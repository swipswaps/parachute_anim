import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Github, Upload, Check, AlertCircle, Copy, Settings, FileText, Folder } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useNotifications } from '../../contexts/NotificationContext';
import githubService from '../../services/githubService';
import GitHubUploadProgress from './GitHubUploadProgress';

/**
 * GitHubUploader component for uploading the repository to GitHub
 */
export default function GitHubUploader() {
  const { t } = useTranslation();
  const { showSuccess, showError, showInfo } = useNotifications();

  // Basic settings
  const [token, setToken] = useState('');
  const [repoName, setRepoName] = useState('');
  const [owner, setOwner] = useState('swipswaps');
  const [isPrivate, setIsPrivate] = useState(false);

  // Upload status
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');

  // Advanced settings
  const [batchSize, setBatchSize] = useState(5);
  const [concurrency, setConcurrency] = useState(2);
  const [delayBetweenBatches, setDelayBetweenBatches] = useState(1000);
  const [enableThrottling, setEnableThrottling] = useState(true);

  // Progress tracking
  const [progress, setProgress] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [uploadLogs, setUploadLogs] = useState([]);

  // Files to upload
  const [files, setFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Handle token change
  const handleTokenChange = (e) => {
    setToken(e.target.value);
  };

  // Handle repo name change
  const handleRepoNameChange = (e) => {
    setRepoName(e.target.value);
  };

  // Handle owner change
  const handleOwnerChange = (e) => {
    setOwner(e.target.value);
  };

  // Handle private toggle
  const handlePrivateToggle = (checked) => {
    setIsPrivate(checked);
  };

  // Progress update handler
  const handleProgressUpdate = useCallback((progressData) => {
    // Add to logs
    setUploadLogs(logs => [
      ...logs,
      { timestamp: new Date(), ...progressData }
    ]);

    // Update progress
    if (progressData.progress) {
      setProgress(progressData.progress);
    }

    // Handle rate limit info
    if (progressData.type === 'rate_limit') {
      setRateLimitInfo(progressData);

      showInfo(
        t('github.rateLimitHit'),
        t('github.rateLimitRetrying', {
          delay: Math.round(progressData.delay / 1000),
          attempt: progressData.attempt
        })
      );
    }

    // Handle repository creation
    if (progressData.type === 'repository_created') {
      showSuccess(
        t('github.repoCreated'),
        t('github.repoCreatedMessage', { repo: progressData.repo })
      );
    }

    // Handle upload completion
    if (progressData.type === 'upload_complete') {
      const { result } = progressData;

      showSuccess(
        t('github.uploadComplete'),
        t('github.uploadCompleteMessage', {
          success: result.successCount,
          total: result.totalFiles,
          failed: result.errorCount
        })
      );
    }
  }, [t, showInfo, showSuccess]);

  // Load files from the repository
  const loadFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    setFiles([]);

    try {
      // This is a simplified example - in a real app, you would load files from the filesystem
      // For this demo, we'll create some dummy files
      const dummyFiles = [
        { path: 'README.md', content: '# Parachute 3D Pipeline\n\nA 3D model viewer and editor.' },
        { path: 'LICENSE', content: 'MIT License\n\nCopyright (c) 2023 Parachute 3D Pipeline' },
        { path: 'index.html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Parachute 3D Pipeline</title>\n</head>\n<body>\n  <h1>Parachute 3D Pipeline</h1>\n</body>\n</html>' },
        { path: 'src/app.js', content: 'console.log("Hello, world!");' },
        { path: 'src/styles.css', content: 'body { font-family: sans-serif; }' },
        { path: 'assets/logo.svg', content: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="blue" /></svg>' },
        { path: 'docs/README.md', content: '# Documentation\n\nThis is the documentation for Parachute 3D Pipeline.' },
        { path: 'tests/test.js', content: 'test("it works", () => { expect(true).toBe(true); });' },
        { path: '.github/workflows/ci.yml', content: 'name: CI\n\non: [push, pull_request]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v2\n      - run: npm test' },
        { path: 'package.json', content: '{\n  "name": "parachute-3d-pipeline",\n  "version": "1.0.0",\n  "description": "A 3D model viewer and editor",\n  "main": "index.js",\n  "scripts": {\n    "test": "echo \"Error: no test specified\" && exit 1"\n  },\n  "keywords": [],\n  "author": "",\n  "license": "MIT"\n}' },
      ];

      // Add more dummy files to demonstrate batch processing
      for (let i = 1; i <= 20; i++) {
        dummyFiles.push({
          path: `examples/example-${i}.js`,
          content: `// Example ${i}\nconsole.log("This is example ${i}");`
        });
      }

      setFiles(dummyFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      showError(t('github.loadFilesError'), error.message);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [t, showError]);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Handle upload
  const handleUpload = async () => {
    if (!token) {
      showError(t('github.tokenRequired'), t('github.tokenRequiredMessage'));
      return;
    }

    if (!repoName) {
      showError(t('github.repoNameRequired'), t('github.repoNameRequiredMessage'));
      return;
    }

    if (files.length === 0) {
      showError(t('github.noFiles'), t('github.noFilesMessage'));
      return;
    }

    // Reset state
    setIsLoading(true);
    setUploadStatus('uploading');
    setProgress(null);
    setUploadLogs([]);

    try {
      // Initialize GitHub service with progress tracking
      githubService.init(token, owner, handleProgressUpdate, { enableThrottling });

      // Upload repository
      await githubService.uploadRepository({
        repo: repoName,
        files,
        createRepo: true,
        repoOptions: {
          description: 'Parachute 3D Pipeline Repository',
          isPrivate,
        },
        batchOptions: {
          batchSize,
          concurrency,
          delayBetweenBatches,
        },
      });

      // Set repository URL
      const repoUrl = `https://github.com/${owner}/${repoName}`;
      setRepoUrl(repoUrl);

      setUploadStatus('success');
    } catch (error) {
      console.error('Error uploading to GitHub:', error);

      showError(
        t('github.uploadError'),
        error.message || t('github.uploadErrorMessage')
      );

      setUploadStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copy repository URL
  const handleCopyRepoUrl = () => {
    navigator.clipboard.writeText(repoUrl);

    showSuccess(
      t('github.urlCopied'),
      t('github.urlCopiedMessage')
    );
  };

  // Handle copy clone command
  const handleCopyCloneCommand = () => {
    navigator.clipboard.writeText(`git clone ${repoUrl}.git`);

    showSuccess(
      t('github.commandCopied'),
      t('github.commandCopiedMessage')
    );
  };

  // Handle batch size change
  const handleBatchSizeChange = (value) => {
    setBatchSize(parseInt(value, 10));
  };

  // Handle concurrency change
  const handleConcurrencyChange = (value) => {
    setConcurrency(parseInt(value, 10));
  };

  // Handle delay change
  const handleDelayChange = (e) => {
    setDelayBetweenBatches(parseInt(e.target.value, 10));
  };

  // Handle throttling toggle
  const handleThrottlingToggle = (checked) => {
    setEnableThrottling(checked);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Github className="h-5 w-5 mr-2" />
          {t('github.title')}
        </CardTitle>
        <CardDescription>
          {t('github.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">{t('github.tabs.basic')}</TabsTrigger>
            <TabsTrigger value="advanced">{t('github.tabs.advanced')}</TabsTrigger>
            <TabsTrigger value="files">{t('github.tabs.files')}</TabsTrigger>
          </TabsList>

          {/* Basic Settings Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Token input */}
            <div className="space-y-2">
              <Label htmlFor="token">{t('github.token')}</Label>
              <Input
                id="token"
                type="password"
                placeholder={t('github.tokenPlaceholder')}
                value={token}
                onChange={handleTokenChange}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                {t('github.tokenHelp')} <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{t('github.createToken')}</a>
              </p>
            </div>

            {/* Repository name input */}
            <div className="space-y-2">
              <Label htmlFor="repoName">{t('github.repoName')}</Label>
              <Input
                id="repoName"
                placeholder={t('github.repoNamePlaceholder')}
                value={repoName}
                onChange={handleRepoNameChange}
                disabled={isLoading}
              />
            </div>

            {/* Owner input */}
            <div className="space-y-2">
              <Label htmlFor="owner">{t('github.owner')}</Label>
              <Input
                id="owner"
                placeholder={t('github.ownerPlaceholder')}
                value={owner}
                onChange={handleOwnerChange}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                {t('github.ownerHelp')}
              </p>
            </div>

            {/* Private toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="private">{t('github.private')}</Label>
                <p className="text-sm text-gray-500">{t('github.privateHelp')}</p>
              </div>
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={handlePrivateToggle}
                disabled={isLoading}
              />
            </div>
          </TabsContent>

          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Batch Size */}
              <div className="space-y-2">
                <Label htmlFor="batchSize">{t('github.advanced.batchSize')}</Label>
                <Select
                  value={batchSize.toString()}
                  onValueChange={handleBatchSizeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="batchSize">
                    <SelectValue placeholder={t('github.advanced.selectBatchSize')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {t('github.advanced.batchSizeHelp')}
                </p>
              </div>

              {/* Concurrency */}
              <div className="space-y-2">
                <Label htmlFor="concurrency">{t('github.advanced.concurrency')}</Label>
                <Select
                  value={concurrency.toString()}
                  onValueChange={handleConcurrencyChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="concurrency">
                    <SelectValue placeholder={t('github.advanced.selectConcurrency')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {t('github.advanced.concurrencyHelp')}
                </p>
              </div>
            </div>

            {/* Delay Between Batches */}
            <div className="space-y-2">
              <Label htmlFor="delay">{t('github.advanced.delay')}</Label>
              <Input
                id="delay"
                type="number"
                min="0"
                step="500"
                placeholder={t('github.advanced.delayPlaceholder')}
                value={delayBetweenBatches}
                onChange={handleDelayChange}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                {t('github.advanced.delayHelp')}
              </p>
            </div>

            {/* Throttling toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="throttling">{t('github.advanced.throttling')}</Label>
                <p className="text-sm text-gray-500">{t('github.advanced.throttlingHelp')}</p>
              </div>
              <Switch
                id="throttling"
                checked={enableThrottling}
                onCheckedChange={handleThrottlingToggle}
                disabled={isLoading}
              />
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{t('github.files.title')}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={loadFiles}
                disabled={isLoading || isLoadingFiles}
              >
                {isLoadingFiles ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">⟳</span>
                    {t('github.files.loading')}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('github.files.reload')}
                  </span>
                )}
              </Button>
            </div>

            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
              {files.length === 0 ? (
                <p className="text-sm text-gray-500">{t('github.files.noFiles')}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm">{t('github.files.count', { count: files.length })}</p>
                  <Accordion type="multiple" className="w-full">
                    {/* Group files by directory */}
                    {Object.entries(files.reduce((acc, file) => {
                      const dir = file.path.includes('/')
                        ? file.path.split('/')[0]
                        : 'root';

                      if (!acc[dir]) {
                        acc[dir] = [];
                      }

                      acc[dir].push(file);
                      return acc;
                    }, {})).map(([dir, dirFiles]) => (
                      <AccordionItem key={dir} value={dir}>
                        <AccordionTrigger className="text-sm">
                          <span className="flex items-center">
                            <Folder className="h-4 w-4 mr-2" />
                            {dir === 'root' ? t('github.files.rootDir') : dir}
                            <span className="ml-2 text-gray-500">({dirFiles.length})</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1">
                            {dirFiles.map((file, index) => (
                              <li key={index} className="text-sm pl-6 py-1 hover:bg-gray-50 rounded">
                                <span className="flex items-center">
                                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                                  {file.path}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Progress tracking */}
        {uploadStatus === 'uploading' && progress && (
          <div className="mt-4">
            <GitHubUploadProgress progress={progress} />
          </div>
        )}

        {/* Upload status */}
        {uploadStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">{t('github.uploadSuccess')}</AlertTitle>
            <AlertDescription className="text-green-700">
              {t('github.uploadSuccessMessage', { repoUrl })}
            </AlertDescription>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between bg-white p-2 rounded border">
                <code className="text-sm">{repoUrl}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyRepoUrl}
                  className="h-6 w-6"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded border">
                <code className="text-sm">git clone {repoUrl}.git</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCloneCommand}
                  className="h-6 w-6"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {uploadStatus === 'error' && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">{t('github.uploadError')}</AlertTitle>
            <AlertDescription className="text-red-700">
              {t('github.uploadErrorMessage')}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload logs */}
        {uploadLogs.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="logs">
              <AccordionTrigger className="text-sm">
                {t('github.logs.title')}
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-40 overflow-y-auto text-xs font-mono bg-gray-50 p-2 rounded">
                  {uploadLogs.map((log, index) => (
                    <div key={index} className="py-1 border-b border-gray-200 last:border-0">
                      <span className="text-gray-500">
                        {log.timestamp.toLocaleTimeString()}
                      </span>:
                      <span className="ml-2">
                        {log.type === 'file_start' && `Starting upload of ${log.file.path}`}
                        {log.type === 'file_complete' && `Completed upload of ${log.file.path}`}
                        {log.type === 'file_error' && `Error uploading ${log.file.path}: ${log.error.message}`}
                        {log.type === 'batch_start' && `Starting batch ${log.batchIndex + 1}/${log.totalBatches}`}
                        {log.type === 'batch_complete' && `Completed batch ${log.batchIndex + 1}: ${log.successCount} succeeded, ${log.errorCount} failed`}
                        {log.type === 'rate_limit' && `Rate limit hit. Retrying in ${Math.round(log.delay / 1000)}s (Attempt ${log.attempt})`}
                        {log.type === 'repository_creating' && `Creating repository ${log.repo}`}
                        {log.type === 'repository_created' && `Repository ${log.repo} created successfully`}
                        {log.type === 'upload_starting' && `Starting upload of ${log.fileCount} files to ${log.repo}`}
                        {log.type === 'upload_complete' && `Upload complete: ${log.result.successCount}/${log.result.totalFiles} files uploaded successfully`}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUpload}
          disabled={isLoading || !token || !repoName || files.length === 0}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⟳</span>
              {t('github.uploading')}
            </span>
          ) : (
            <span className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              {t('github.upload')}
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
