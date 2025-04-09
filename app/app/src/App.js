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
