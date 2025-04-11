import React from 'react';
import { useTranslation } from 'react-i18next';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

/**
 * Analytics Page component
 */
export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  
  // Check if user is authenticated and is an admin
  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="container mx-auto py-8">
      <AnalyticsDashboard />
    </div>
  );
}
