import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileForm from '../components/auth/ProfileForm';
import Layout from '../components/Layout';

export default function ProfilePage() {
  const { isAuthenticated, loading } = useAuth();

  // Redirect if not logged in
  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        <ProfileForm />
      </div>
    </Layout>
  );
}
