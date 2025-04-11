import React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import GitHubUploader from '../components/admin/GitHubUploader';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';

/**
 * AdminPage component for admin functionality
 */
export default function AdminPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  
  // Check if user is authenticated and is an admin
  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{t('admin.title')}</h1>
      
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">{t('admin.analytics')}</TabsTrigger>
          <TabsTrigger value="github">{t('admin.github')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="github">
          <GitHubUploader />
        </TabsContent>
      </Tabs>
    </div>
  );
}
