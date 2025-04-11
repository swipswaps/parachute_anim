#!/usr/bin/env node

/**
 * GitHub Repository Upload Utility
 *
 * This script uploads the entire repository to GitHub using the Octokit REST API.
 * It creates a new repository if it doesn't exist, and uploads all files.
 *
 * Usage:
 *   node upload_to_github.js --token=YOUR_GITHUB_TOKEN --repo=REPO_NAME [--owner=OWNER] [--private]
 *
 * Options:
 *   --token    GitHub personal access token (required)
 *   --repo     Repository name (required)
 *   --owner    GitHub username or organization (default: swipswaps)
 *   --private  Make the repository private (default: false)
 *   --help     Show help
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');
const { throttling } = require('@octokit/plugin-throttling');

// Create a custom Octokit with throttling plugin
const ThrottledOctokit = Octokit.plugin(throttling);

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg === '--help') {
    acc.help = true;
    return acc;
  }

  if (arg === '--private') {
    acc.private = true;
    return acc;
  }

  const match = arg.match(/^--([^=]+)=(.+)$/);
  if (match) {
    acc[match[1]] = match[2];
  }

  return acc;
}, {});

// Show help if requested
if (args.help) {
  console.log(`
GitHub Repository Upload Utility

This script uploads the entire repository to GitHub using the Octokit REST API.
It creates a new repository if it doesn't exist, and uploads all files.

Usage:
  node upload_to_github.js --token=YOUR_GITHUB_TOKEN --repo=REPO_NAME [--owner=OWNER] [--private] [--batchSize=SIZE] [--concurrency=NUM] [--delay=MS]

Required Options:
  --token       GitHub personal access token (required)
  --repo        Repository name (required)

Repository Options:
  --owner       GitHub username or organization (default: swipswaps)
  --private     Make the repository private (default: false)

Batch Processing Options:
  --batchSize    Number of files to upload in each batch (default: 5)
  --concurrency  Number of concurrent uploads (default: 2)
  --delay        Delay between batches in milliseconds (default: 1000)

Other Options:
  --help        Show this help
  `);
  process.exit(0);
}

// Validate required arguments
if (!args.token) {
  console.error('Error: GitHub token is required (--token=YOUR_GITHUB_TOKEN)');
  process.exit(1);
}

if (!args.repo) {
  console.error('Error: Repository name is required (--repo=REPO_NAME)');
  process.exit(1);
}

// Set default values
const owner = args.owner || 'swipswaps';
const repoName = args.repo;
const isPrivate = !!args.private;

// Initialize Octokit with throttling
const octokit = new ThrottledOctokit({
  auth: args.token,
  throttle: {
    onRateLimit: (retryAfter, options, octokit, retryCount) => {
      console.warn(
        `Request quota exhausted for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds! (Retry count: ${retryCount})`
      );

      // Only retry twice
      return retryCount < 2;
    },
    onSecondaryRateLimit: (retryAfter, options, octokit, retryCount) => {
      console.warn(
        `Secondary rate limit detected for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds! (Retry count: ${retryCount})`
      );

      // Only retry once for secondary rate limits
      return retryCount < 1;
    },
  },
});

// Get the repository root directory
const repoRoot = path.resolve(__dirname);

// Function to check if a repository exists
async function repositoryExists(owner, repo) {
  try {
    await octokit.repos.get({
      owner,
      repo,
    });

    return true;
  } catch (error) {
    if (error.status === 404) {
      return false;
    }

    throw error;
  }
}

// Function to create a repository
async function createRepository(owner, repo, isPrivate) {
  try {
    const response = await octokit.repos.createForAuthenticatedUser({
      name: repo,
      description: 'Created with Parachute 3D Pipeline',
      private: isPrivate,
      auto_init: false,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating repository:', error.message);
    throw error;
  }
}

// Function to get all files in a directory recursively
function getAllFiles(dir, ignorePaths = []) {
  const files = [];

  function traverse(currentDir, relativePath = '') {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);

      // Skip ignored paths
      if (ignorePaths.some(ignorePath =>
        fullPath.includes(ignorePath) ||
        entryRelativePath.includes(ignorePath)
      )) {
        continue;
      }

      if (entry.isDirectory()) {
        traverse(fullPath, entryRelativePath);
      } else {
        files.push({
          fullPath,
          relativePath: entryRelativePath,
        });
      }
    }
  }

  traverse(dir);
  return files;
}

// Function to create or update a file in a repository
async function createOrUpdateFile(owner, repo, path, content, message) {
  try {
    // Check if file exists
    let sha;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      sha = data.sha;
    } catch (error) {
      // File doesn't exist, which is fine
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create or update file
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || `Add ${path}`,
      content: Buffer.from(content).toString('base64'),
      sha,
    });

    return response.data;
  } catch (error) {
    console.error(`Error creating/updating file ${path}:`, error.message);
    throw error;
  }
}

// Process files in batches
async function processBatch(files, batchSize = 5, concurrency = 2, delayBetweenBatches = 1000) {
  // Split files into batches
  const batches = [];
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }

  let uploadedCount = 0;
  let failedCount = 0;

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    console.log(`\nProcessing batch ${batchIndex + 1}/${batches.length} (${batch.length} files)...`);

    // Process files in the batch with concurrency
    const activeTasks = new Set();
    const results = [];

    // Create a queue of files to process
    const queue = [...batch];

    // Process the queue with concurrency
    while (queue.length > 0 || activeTasks.size > 0) {
      // Fill up to concurrency
      while (queue.length > 0 && activeTasks.size < concurrency) {
        const file = queue.shift();

        // Process the file
        const task = (async () => {
          try {
            const content = fs.readFileSync(file.fullPath, 'utf8');

            await createOrUpdateFile(
              owner,
              repoName,
              file.relativePath,
              content,
              `Add ${file.relativePath}`
            );

            uploadedCount++;
            console.log(`Uploaded (${uploadedCount}/${files.length}): ${file.relativePath}`);

            return { success: true, file };
          } catch (error) {
            failedCount++;
            console.error(`Failed to upload ${file.relativePath}: ${error.message}`);

            return { success: false, file, error };
          }
        })();

        activeTasks.add(task);

        // When the task completes, remove it from active tasks
        task.then(result => {
          activeTasks.delete(task);
          results.push(result);
        });
      }

      // Wait for at least one task to complete if we have active tasks
      if (activeTasks.size > 0) {
        await Promise.race(Array.from(activeTasks));
      }
    }

    // Calculate batch statistics
    const batchSuccessCount = results.filter(r => r.success).length;
    const batchFailCount = results.filter(r => !r.success).length;

    console.log(`Batch ${batchIndex + 1} complete: ${batchSuccessCount} succeeded, ${batchFailCount} failed`);

    // Delay between batches (except for the last batch)
    if (batchIndex < batches.length - 1 && delayBetweenBatches > 0) {
      console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return { uploadedCount, failedCount };
}

// Main function
async function main() {
  try {
    // Parse additional arguments
    const batchSize = parseInt(args.batchSize, 10) || 5;
    const concurrency = parseInt(args.concurrency, 10) || 2;
    const delayBetweenBatches = parseInt(args.delay, 10) || 1000;

    console.log(`🚀 Starting GitHub repository upload utility`);
    console.log(`Repository: ${owner}/${repoName}`);
    console.log(`Private: ${isPrivate ? 'Yes' : 'No'}`);
    console.log(`Batch size: ${batchSize}, Concurrency: ${concurrency}, Delay: ${delayBetweenBatches}ms`);

    // Check if the repository exists
    const exists = await repositoryExists(owner, repoName);

    if (exists) {
      console.log(`Repository ${owner}/${repoName} already exists`);
    } else {
      console.log(`Creating repository ${owner}/${repoName}...`);
      await createRepository(owner, repoName, isPrivate);
      console.log(`Repository created successfully`);
    }

    // Get all files in the repository
    console.log('Scanning repository files...');
    const ignorePaths = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'upload_to_github.js', // Skip this script itself
    ];

    const files = getAllFiles(repoRoot, ignorePaths);
    console.log(`Found ${files.length} files to upload`);

    // Upload files in batches
    console.log('Uploading files in batches...');
    const startTime = Date.now();

    const { uploadedCount, failedCount } = await processBatch(
      files,
      batchSize,
      concurrency,
      delayBetweenBatches
    );

    const endTime = Date.now();
    const elapsedSeconds = Math.round((endTime - startTime) / 1000);

    console.log(`\n✅ Upload complete in ${elapsedSeconds} seconds!`);
    console.log(`${uploadedCount}/${files.length} files uploaded successfully.`);

    if (failedCount > 0) {
      console.log(`⚠️ ${failedCount} files failed to upload.`);
    }

    console.log(`Repository URL: https://github.com/${owner}/${repoName}`);

    // Provide instructions for cloning the repository
    console.log('\nTo clone this repository:');
    console.log(`git clone https://github.com/${owner}/${repoName}.git`);

    // Provide instructions for using the repository as a remote
    console.log('\nTo add this repository as a remote:');
    console.log(`git remote add origin https://github.com/${owner}/${repoName}.git`);
    console.log('git branch -M main');
    console.log('git push -u origin main');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
