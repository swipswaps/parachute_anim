#!/bin/bash
# Add frontend setup
echo "Setting up frontend..."
mkdir -p frontend
cd frontend
npm init -y
npm install @octokit/rest @react-three/drei @react-three/fiber axios react react-dom react-dropzone react-router-dom three
npm install -D @vitejs/plugin-react vite
cd ..

# Create Vite config
cat > frontend/vite.config.js << EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
EOL

echo "Frontend setup complete!"