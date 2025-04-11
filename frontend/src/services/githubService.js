/**
 * GitHub Service for interacting with GitHub API
 */
import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import { withRetry, extractRateLimitInfo, isRateLimitError } from '../utils/rateLimitUtils';
import { processBatch, chunkArray } from '../utils/batchUtils';
import { createProgressTracker, formatElapsedTime, formatEta } from '../utils/progressUtils';

// Create a custom Octokit with throttling plugin
const ThrottledOctokit = Octokit.plugin(throttling);

/**
 * GitHub Service class for repository operations
 */
class GitHubService {
  constructor() {
    this.octokit = null;
    this.owner = 'swipswaps'; // Default owner
    this.rateLimitInfo = null;
    this.progressTracker = null;
    this.onProgressUpdate = null;
  }

  /**
   * Initialize the GitHub service with a token
   * @param {string} token - GitHub personal access token
   * @param {string} owner - GitHub username or organization (default: swipswaps)
   * @param {Function} onProgressUpdate - Callback for progress updates
   * @param {Object} options - Additional options
   * @param {boolean} options.enableThrottling - Whether to enable throttling (default: true)
   * @returns {GitHubService} - The initialized service
   */
  init(token, owner = 'swipswaps', onProgressUpdate = null, { enableThrottling = true } = {}) {
    if (!token) {
      throw new Error('GitHub token is required');
    }

    // Store the progress update callback
    this.onProgressUpdate = onProgressUpdate;

    // Create a progress tracker
    this.progressTracker = createProgressTracker({
      onProgress: (progress) => {
        if (this.onProgressUpdate) {
          this.onProgressUpdate(progress);
        }
      }
    });

    // Create Octokit instance with throttling if enabled
    if (enableThrottling) {
      this.octokit = new ThrottledOctokit({
        auth: token,
        throttle: {
          onRateLimit: (retryAfter, options, octokit, retryCount) => {
            octokit.log.warn(
              `Request quota exhausted for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds! (Retry count: ${retryCount})`
            );

            // Only retry twice
            return retryCount < 2;
          },
          onSecondaryRateLimit: (retryAfter, options, octokit, retryCount) => {
            octokit.log.warn(
              `Secondary rate limit detected for request ${options.method} ${options.url}. Retrying after ${retryAfter} seconds! (Retry count: ${retryCount})`
            );

            // Only retry once for secondary rate limits
            return retryCount < 1;
          },
        },
      });
    } else {
      this.octokit = new Octokit({
        auth: token,
      });
    }

    this.owner = owner;

    return this;
  }

  /**
   * Check if the service is initialized
   * @returns {boolean} - Whether the service is initialized
   */
  isInitialized() {
    return !!this.octokit;
  }

  /**
   * Create a new repository
   * @param {Object} options - Repository options
   * @param {string} options.name - Repository name
   * @param {string} options.description - Repository description
   * @param {boolean} options.isPrivate - Whether the repository is private
   * @param {boolean} options.autoInit - Whether to initialize with a README
   * @returns {Promise} - The API response
   */
  async createRepository({
    name,
    description = 'Created with Parachute 3D Pipeline',
    isPrivate = false,
    autoInit = false,
  }) {
    if (!this.isInitialized()) {
      throw new Error('GitHub service not initialized. Call init() first.');
    }

    return withRetry(
      async () => {
        try {
          const response = await this.octokit.repos.createForAuthenticatedUser({
            name,
            description,
            private: isPrivate,
            auto_init: autoInit,
          });

          // Update rate limit info
          this.rateLimitInfo = extractRateLimitInfo(response);

          return response.data;
        } catch (error) {
          console.error('Error creating repository:', error);
          throw error;
        }
      },
      {
        shouldRetry: (error) => isRateLimitError(error),
        onRetry: (error, attempt, delay) => {
          console.warn(`Rate limit hit while creating repository. Retrying in ${delay}ms... (Attempt ${attempt})`);

          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              type: 'rate_limit',
              error,
              attempt,
              delay,
              operation: 'createRepository',
            });
          }
        },
      }
    );
  }

  /**
   * Check if a repository exists
   * @param {string} repoName - Repository name
   * @returns {Promise<boolean>} - Whether the repository exists
   */
  async repositoryExists(repoName) {
    if (!this.isInitialized()) {
      throw new Error('GitHub service not initialized. Call init() first.');
    }

    return withRetry(
      async () => {
        try {
          const response = await this.octokit.repos.get({
            owner: this.owner,
            repo: repoName,
          });

          // Update rate limit info
          this.rateLimitInfo = extractRateLimitInfo(response);

          return true;
        } catch (error) {
          if (error.status === 404) {
            return false;
          }

          // Re-throw other errors
          throw error;
        }
      },
      {
        shouldRetry: (error) => isRateLimitError(error),
        onRetry: (error, attempt, delay) => {
          console.warn(`Rate limit hit while checking repository existence. Retrying in ${delay}ms... (Attempt ${attempt})`);

          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              type: 'rate_limit',
              error,
              attempt,
              delay,
              operation: 'repositoryExists',
            });
          }
        },
      }
    );
  }

  /**
   * Create a file in a repository
   * @param {Object} options - File options
   * @param {string} options.repo - Repository name
   * @param {string} options.path - File path
   * @param {string} options.content - File content
   * @param {string} options.message - Commit message
   * @returns {Promise} - The API response
   */
  async createOrUpdateFile({
    repo,
    path,
    content,
    message = 'Add file via Parachute 3D Pipeline',
  }) {
    if (!this.isInitialized()) {
      throw new Error('GitHub service not initialized. Call init() first.');
    }

    return withRetry(
      async () => {
        try {
          // Check if file exists
          let sha;
          try {
            const contentResponse = await this.octokit.repos.getContent({
              owner: this.owner,
              repo,
              path,
            });

            // Update rate limit info
            this.rateLimitInfo = extractRateLimitInfo(contentResponse);

            sha = contentResponse.data.sha;
          } catch (error) {
            // File doesn't exist, which is fine
            if (error.status !== 404) {
              throw error;
            }
          }

          // Create or update file
          const response = await this.octokit.repos.createOrUpdateFileContents({
            owner: this.owner,
            repo,
            path,
            message,
            content: Buffer.from(content).toString('base64'),
            sha,
          });

          // Update rate limit info
          this.rateLimitInfo = extractRateLimitInfo(response);

          return response.data;
        } catch (error) {
          console.error(`Error creating/updating file ${path}:`, error);
          throw error;
        }
      },
      {
        shouldRetry: (error) => isRateLimitError(error),
        onRetry: (error, attempt, delay) => {
          console.warn(`Rate limit hit while creating/updating file. Retrying in ${delay}ms... (Attempt ${attempt})`);

          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              type: 'rate_limit',
              error,
              attempt,
              delay,
              operation: 'createOrUpdateFile',
              path,
            });
          }
        },
      }
    );
  }

  /**
   * Upload multiple files to a repository in batches
   * @param {Object} options - Upload options
   * @param {string} options.repo - Repository name
   * @param {Array<Object>} options.files - Array of file objects with path and content
   * @param {string} options.commitMessage - Base commit message
   * @param {number} options.batchSize - Number of files per batch (default: 5)
   * @param {number} options.concurrency - Number of concurrent uploads (default: 2)
   * @param {number} options.delayBetweenBatches - Delay between batches in ms (default: 1000)
   * @returns {Promise<Object>} - Upload results
   */
  async uploadFiles({
    repo,
    files,
    commitMessage = 'Add files via Parachute 3D Pipeline',
    batchSize = 5,
    concurrency = 2,
    delayBetweenBatches = 1000,
  }) {
    if (!this.isInitialized()) {
      throw new Error('GitHub service not initialized. Call init() first.');
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('Files array is required and must not be empty');
    }

    // Initialize progress tracker
    this.progressTracker.reset(files.length);
    this.progressTracker.start();

    // Process files in batches
    const { results, errors } = await processBatch(
      files,
      async (file, index) => {
        try {
          // Create custom commit message with file path
          const message = `${commitMessage}: ${file.path}`;

          // Upload the file
          const result = await this.createOrUpdateFile({
            repo,
            path: file.path,
            content: file.content,
            message,
          });

          // Update progress
          this.progressTracker.update({ completedCount: 1 });

          return { success: true, file, result };
        } catch (error) {
          // Update progress
          this.progressTracker.update({ failedCount: 1 });

          return { success: false, file, error };
        }
      },
      {
        batchSize,
        concurrency,
        delayBetweenBatches,
        onBatchStart: (batchIndex, batchItems) => {
          console.log(`Starting batch ${batchIndex + 1} with ${batchItems.length} files`);

          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              type: 'batch_start',
              batchIndex,
              batchSize: batchItems.length,
              totalBatches: Math.ceil(files.length / batchSize),
            });
          }
        },
        onBatchComplete: (batchIndex, batchResults) => {
          const successCount = batchResults.results.length;
          const errorCount = batchResults.errors.length;

          console.log(`Completed batch ${batchIndex + 1}: ${successCount} succeeded, ${errorCount} failed`);

          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              type: 'batch_complete',
              batchIndex,
              successCount,
              errorCount,
              progress: this.progressTracker.getProgress(),
            });
          }
        },
        onItemStart: (file, index) => {
          console.log(`Uploading file ${index + 1}/${files.length}: ${file.path}`);

          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              type: 'file_start',
              file,
              index,
              total: files.length,
            });
          }
        },
        onItemComplete: (file, result, index) => {
          console.log(`Uploaded file ${index + 1}/${files.length}: ${file.path}`);

          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              type: 'file_complete',
              file,
              result,
              index,
              total: files.length,
              progress: this.progressTracker.getProgress(),
            });
          }
        },
        onItemError: (file, error, index) => {
          console.error(`Error uploading file ${index + 1}/${files.length}: ${file.path}`, error);

          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              type: 'file_error',
              file,
              error,
              index,
              total: files.length,
              progress: this.progressTracker.getProgress(),
            });
          }
        },
      }
    );

    // Complete progress tracking
    this.progressTracker.complete();

    return {
      totalFiles: files.length,
      successCount: results.length,
      errorCount: errors.length,
      successfulFiles: results.map(r => r.file.path),
      failedFiles: errors.map(e => e.file.path),
      errors,
    };
  }

  /**
   * Get the authenticated user
   * @returns {Promise} - The API response
   */
  async getAuthenticatedUser() {
    if (!this.isInitialized()) {
      throw new Error('GitHub service not initialized. Call init() first.');
    }

    return withRetry(
      async () => {
        try {
          const response = await this.octokit.users.getAuthenticated();

          // Update rate limit info
          this.rateLimitInfo = extractRateLimitInfo(response);

          return response.data;
        } catch (error) {
          console.error('Error getting authenticated user:', error);
          throw error;
        }
      },
      {
        shouldRetry: (error) => isRateLimitError(error),
        onRetry: (error, attempt, delay) => {
          console.warn(`Rate limit hit while getting authenticated user. Retrying in ${delay}ms... (Attempt ${attempt})`);

          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              type: 'rate_limit',
              error,
              attempt,
              delay,
              operation: 'getAuthenticatedUser',
            });
          }
        },
      }
    );
  }

  /**
   * List repositories for the authenticated user
   * @returns {Promise} - The API response
   */
  async listRepositories() {
    if (!this.isInitialized()) {
      throw new Error('GitHub service not initialized. Call init() first.');
    }

    return withRetry(
      async () => {
        try {
          const response = await this.octokit.repos.listForAuthenticatedUser();

          // Update rate limit info
          this.rateLimitInfo = extractRateLimitInfo(response);

          return response.data;
        } catch (error) {
          console.error('Error listing repositories:', error);
          throw error;
        }
      },
      {
        shouldRetry: (error) => isRateLimitError(error),
        onRetry: (error, attempt, delay) => {
          console.warn(`Rate limit hit while listing repositories. Retrying in ${delay}ms... (Attempt ${attempt})`);

          if (this.onProgressUpdate) {
            this.onProgressUpdate({
              type: 'rate_limit',
              error,
              attempt,
              delay,
              operation: 'listRepositories',
            });
          }
        },
      }
    );
  }

  /**
   * Get rate limit information
   * @returns {Promise<Object>} - Rate limit information
   */
  async getRateLimitInfo() {
    if (!this.isInitialized()) {
      throw new Error('GitHub service not initialized. Call init() first.');
    }

    try {
      const response = await this.octokit.rateLimit.get();

      // Update stored rate limit info
      this.rateLimitInfo = response.data;

      return response.data;
    } catch (error) {
      console.error('Error getting rate limit info:', error);

      // Return cached rate limit info if available
      if (this.rateLimitInfo) {
        return this.rateLimitInfo;
      }

      throw error;
    }
  }

  /**
   * Upload an entire repository
   * @param {Object} options - Upload options
   * @param {string} options.repo - Repository name
   * @param {string} options.localPath - Local path to the repository
   * @param {Array<string>} options.ignorePaths - Paths to ignore
   * @param {boolean} options.createRepo - Whether to create the repository if it doesn't exist
   * @param {Object} options.repoOptions - Options for repository creation
   * @param {Object} options.batchOptions - Options for batch processing
   * @returns {Promise<Object>} - Upload results
   */
  async uploadRepository({
    repo,
    files,
    createRepo = true,
    repoOptions = {},
    batchOptions = {},
  }) {
    if (!this.isInitialized()) {
      throw new Error('GitHub service not initialized. Call init() first.');
    }

    if (!repo) {
      throw new Error('Repository name is required');
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('Files array is required and must not be empty');
    }

    // Check if repository exists
    const repoExists = await this.repositoryExists(repo);

    // Create repository if it doesn't exist and createRepo is true
    if (!repoExists) {
      if (createRepo) {
        console.log(`Repository ${repo} doesn't exist. Creating...`);

        if (this.onProgressUpdate) {
          this.onProgressUpdate({
            type: 'repository_creating',
            repo,
          });
        }

        await this.createRepository({
          name: repo,
          ...repoOptions,
        });

        if (this.onProgressUpdate) {
          this.onProgressUpdate({
            type: 'repository_created',
            repo,
          });
        }
      } else {
        throw new Error(`Repository ${repo} doesn't exist and createRepo is false`);
      }
    }

    // Upload files
    console.log(`Uploading ${files.length} files to repository ${repo}...`);

    if (this.onProgressUpdate) {
      this.onProgressUpdate({
        type: 'upload_starting',
        repo,
        fileCount: files.length,
      });
    }

    const result = await this.uploadFiles({
      repo,
      files,
      ...batchOptions,
    });

    if (this.onProgressUpdate) {
      this.onProgressUpdate({
        type: 'upload_complete',
        repo,
        result,
      });
    }

    return result;
  }
}

// Create singleton instance
const githubService = new GitHubService();

export default githubService;
