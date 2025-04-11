import React, { useState, Suspense, useEffect, lazy } from 'react';
import performanceMonitoring from './utils/performanceMonitoring';
import analytics from './utils/analytics';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Box, Upload, Youtube, LayoutGrid, BarChart2, Settings, LogOut, LogIn, User, UserPlus, Menu, X, Github } from 'lucide-react';
import AccessibilityPanel from './components/accessibility/AccessibilityPanel';
import FeedbackForm from './components/feedback/FeedbackForm';

// Import self-healing components
import { withSelfHealing } from './components/common/SelfHealingComponent';
import AppFallback from './components/common/AppFallback';

// Import debug components
import ErrorLogButton from './components/debug/ErrorLogButton';

// Import components
import ErrorBoundary from './components/ErrorBoundary';

// Import error loggers
import { initErrorLogger } from './utils/errorLogger';
import { initFileLogger, logError } from './utils/fileLogger';
import errorLoggingService from './services/errorLoggingService';

// Lazy load components with prefetch
const ModelViewer = lazy(() => {
  // Prefetch related components
  import('./components/viewer/ModelControls');
  import('./components/viewer/ModelInfo');
  import('./components/sharing/ShareModelDialog');
  return import('./components/ModelViewer');
});

const VideoUpload = lazy(() => {
  // Prefetch related components
  import('./components/common/LazyImage');
  return import('./components/VideoUpload');
});

const YouTubeProcessor = lazy(() => import('./components/YouTubeProcessor'));
const ModelGallery = lazy(() => {
  // Prefetch related components
  import('./components/common/LazyImage');
  return import('./components/ModelGallery');
});

// Lazy load debug page
const DebugPage = lazy(() => import('./pages/DebugPage'));

// Import context providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Import for i18n
import { useTranslation } from 'react-i18next';
import LanguageSelector from './components/common/LanguageSelector';

// Main App component
function App() {
  // Main layout component
  function Layout({ children }) {
    const { user, isAuthenticated, logout } = useAuth();
    const { t } = useTranslation();

    const handleLogout = async () => {
      await logout();
      // No need to navigate as the protected routes will handle redirection
    };

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Box className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">{t('app.name')}</span>
            </Link>
            <nav>
              <ul className="flex space-x-4 items-center">
                <li>
                  <Link to="/" className="text-gray-600 hover:text-blue-600">
                    {t('nav.home')}
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" className="text-gray-600 hover:text-blue-600">
                    {t('nav.gallery')}
                  </Link>
                </li>
                <li>
                  <Link to="/upload" className="text-gray-600 hover:text-blue-600">
                    {t('nav.upload')}
                  </Link>
                </li>
                <li className="ml-2">
                  <LanguageSelector />
                </li>

                {isAuthenticated ? (
                  <>
                    <li className="ml-4">
                      <div className="relative group">
                        <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                          <User className="h-5 w-5" />
                          <span>{user?.name?.split(' ')[0] || t('nav.profile')}</span>
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            {t('nav.profile')}
                          </Link>
                          {user?.isAdmin && (
                            <>
                              <Link
                              to="/analytics"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <BarChart2 className="h-4 w-4 mr-2" />
                              {t('nav.analytics') || 'Analytics'}
                            </Link>
                            <Link
                              to="/admin"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Github className="h-4 w-4 mr-2" />
                              {t('nav.admin') || 'Admin'}
                            </Link>
                          </>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          {t('nav.logout')}
                        </button>
                      </div>
                    </div>
                  </li>
                </>
              ) : (
                <>
                  <li className="ml-4">
                    <Link
                      to="/login"
                      className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
                    >
                      <LogIn className="h-5 w-5" />
                      <span>{t('nav.login')}</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>{t('nav.register')}</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 flex-grow">
        {children}
      </main>
      <footer className="bg-white border-t mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500">
          <p>Parachute 3D Pipeline &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

// Home page component
function HomePage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create 3D Models from Videos</h1>
        <p className="text-lg mb-8">
          Upload a video or provide a YouTube URL to create a 3D model using photogrammetry.
        </p>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center">
              <Youtube className="h-4 w-4 mr-2" />
              YouTube URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-6">
            <VideoUpload onUploadComplete={(data) => console.log('Upload complete:', data)} />
          </TabsContent>
          <TabsContent value="youtube" className="mt-6">
            <YouTubeProcessor onProcessComplete={(data) => console.log('Process complete:', data)} />
          </TabsContent>
        </Tabs>

        <div className="mt-12 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Upload a video file or provide a YouTube URL</li>
            <li>Specify the start time and duration of the segment to process</li>
            <li>Our system extracts frames from the video segment</li>
            <li>The frames are processed using photogrammetry to create a 3D model</li>
            <li>View and download your 3D model in various formats</li>
          </ol>
          <div className="mt-6">
            <Link to="/gallery">
              <Button className="flex items-center">
                <LayoutGrid className="h-4 w-4 mr-2" />
                View Model Gallery
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Model viewer page
function ViewModelPage() {
  const [modelUrl, setModelUrl] = useState('/models/example.glb');

  return (
    <Layout>
      <div className="h-[70vh] w-full">
        <ModelViewer modelUrl={modelUrl} />
      </div>
    </Layout>
  );
}

// Gallery page
function GalleryPage() {
  return (
    <Layout>
      <ModelGallery />
    </Layout>
  );
}

// Upload page
function UploadPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Upload Video</h1>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center">
              <Youtube className="h-4 w-4 mr-2" />
              YouTube URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-6">
            <VideoUpload onUploadComplete={(data) => console.log('Upload complete:', data)} />
          </TabsContent>
          <TabsContent value="youtube" className="mt-6">
            <YouTubeProcessor onProcessComplete={(data) => console.log('Process complete:', data)} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="loader">
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Error fallback component
function ErrorFallback({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error?.message || 'An unexpected error occurred'}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

// Lazy load auth pages with prefetch
const LoginPage = lazy(() => {
  // Prefetch related components
  import('./components/auth/LoginForm');
  return import('./pages/LoginPage');
});

const RegisterPage = lazy(() => {
  // Prefetch related components
  import('./components/auth/RegisterForm');
  return import('./pages/RegisterPage');
});

const ProfilePage = lazy(() => {
  // Prefetch related components
  import('./components/auth/ProfileForm');
  return import('./pages/ProfilePage');
});

const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

const EmbedPage = lazy(() => {
  // Prefetch related components
  import('./components/ModelViewer');
  return import('./pages/EmbedPage');
});

const AnalyticsPage = lazy(() => {
  // Prefetch related components
  import('./components/analytics/AnalyticsDashboard');
  return import('./pages/AnalyticsPage');
});

const AdminPage = lazy(() => {
  // Prefetch related components
  import('./components/admin/GitHubUploader');
  import('./components/analytics/AnalyticsDashboard');
  return import('./pages/AdminPage');
});

// PWA components
const InstallPrompt = lazy(() => import('./components/pwa/InstallPrompt'));
const OfflineIndicator = lazy(() => import('./components/pwa/OfflineIndicator'));

// LoadingFallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Protected route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Main App component
function App() {
  // Initialize performance monitoring and analytics
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitoring.init({
      reportToConsole: process.env.NODE_ENV === 'development',
      reportToBeacon: process.env.NODE_ENV === 'production',
      beaconUrl: '/api/metrics',
    });

    // Report navigation timing
    performanceMonitoring.reportCustomMetric('PAGE_LOAD', {
      name: 'app-init',
      value: performance.now(),
      url: window.location.href,
    });

    // Initialize analytics
    analytics.init({
      customEndpoint: true,
      customEndpointUrl: '/api/analytics',
      initialUserProperties: {
        appVersion: '1.0.0',
      },
    });

    // Initialize error loggers
    initErrorLogger({
      logToConsole: true,
      logToServer: true,
      logToLocalStorage: true,
    });

    // Initialize file logger
    initFileLogger({
      logToConsole: true,
      downloadLogs: false, // Don't automatically download logs
    });

    // Initialize production-ready error logging service
    errorLoggingService.logInfo('Application started', {
      source: 'app-init',
      context: {
        appVersion: '1.0.0',
        environment: process.env.NODE_ENV,
        buildTime: process.env.BUILD_TIME || new Date().toISOString(),
      },
    });
  }, []);

  // Log when the App component renders
  console.log('Rendering App component');

  return (
    <Router>
      <ErrorBoundary>
        <ErrorProvider>
          <NotificationProvider>
            <AuthProvider>
              <OnboardingProvider>
                <div className="app-container">
            {/* PWA components */}
            <Suspense fallback={null}>
              <InstallPrompt />
              <OfflineIndicator />
            </Suspense>

            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/view/:modelId" element={<ViewModelPage />} />
                <Route path="/embed/:modelId" element={<EmbedPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected routes */}
                <Route path="/upload" element={
                  <ProtectedRoute>
                    <UploadPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } />

                {/* Debug page */}
                <Route path="/debug" element={<DebugPage />} />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Error log button */}
              <ErrorLogButton />
            </Suspense>
                  {/* Accessibility Panel */}
                  <AccessibilityPanel />

                  {/* Feedback Form */}
                  <FeedbackForm />
                </div>
              </OnboardingProvider>
            </AuthProvider>
          </NotificationProvider>
        </ErrorProvider>
      </ErrorBoundary>
    </Router>
  );
}

// Export the App component wrapped with self-healing capabilities
export default withSelfHealing(App, {
  dependencyName: 'App',
  fallback: AppFallback
});