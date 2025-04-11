import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import VideoUpload from './pages/VideoUpload';
import ModelViewer from './pages/ModelViewer';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <BrowserRouter>
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<VideoUpload />} />
              <Route path="/models/:id" element={<ModelViewer />} />
            </Routes>
          </div>
        </BrowserRouter>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;