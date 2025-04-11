#!/bin/bash
# Check if app directory exists
if [ -d "app" ]; then
  echo "App directory exists, initializing React app"
else
  echo "Creating app directory"
  mkdir -p app
fi

# Navigate to app directory
cd app

# Initialize a basic package.json
cat > package.json << 'EOF'
{
  "name": "parachute-3d-pipeline-ui",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "axios": "^1.3.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

# Create basic React app structure
mkdir -p public src

# Create index.html
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Parachute 3D Pipeline</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# Create index.js
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create App.js
cat > src/App.js << 'EOF'
import React, { useState } from 'react';

function App() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage('Please select files to upload');
      return;
    }

    setUploading(true);
    setMessage('Uploading files...');

    // Simulate upload
    setTimeout(() => {
      setUploading(false);
      setMessage('Upload successful!');
      setFiles([]);
    }, 2000);

    // In a real app, you would use fetch or axios to upload to your API
    // const formData = new FormData();
    // files.forEach(file => {
    //   formData.append('files', file);
    // });
    // try {
    //   const response = await fetch('/api/upload', {
    //     method: 'POST',
    //     body: formData,
    //   });
    //   const data = await response.json();
    //   setMessage(data.message);
    // } catch (error) {
    //   setMessage('Upload failed: ' + error.message);
    // } finally {
    //   setUploading(false);
    // }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Parachute 3D Pipeline</h1>
      <div>
        <h2>Upload Images</h2>
        <input 
          type="file" 
          multiple 
          onChange={handleFileChange} 
          disabled={uploading}
        />
        <button 
          onClick={handleUpload} 
          disabled={uploading || files.length === 0}
          style={{ marginLeft: '10px' }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        {message && <p>{message}</p>}
        {files.length > 0 && (
          <div>
            <h3>Selected Files:</h3>
            <ul>
              {files.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
EOF

echo "React app structure created successfully!"