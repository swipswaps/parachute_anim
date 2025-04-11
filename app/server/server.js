const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create output directories if they don't exist
const outputDir = path.join(__dirname, 'output');
const framesDir = path.join(outputDir, 'frames');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

// Process YouTube video endpoint
app.post('/api/process-youtube', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }
  
  const videoId = new URL(url).searchParams.get('v');
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }
  
  const outputPath = path.join(outputDir, `${videoId}.mp4`);
  
  try {
    // Download YouTube video using youtube-dl
    // Note: You need to install youtube-dl and ffmpeg on your server
    exec(`youtube-dl -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4' -o "${outputPath}" ${url}`, 
      async (error) => {
        if (error) {
          console.error('Error downloading video:', error);
          return res.status(500).json({ error: 'Failed to download video' });
        }
        
        // Extract frames using ffmpeg (1 frame per second)
        const framesPath = path.join(framesDir, `${videoId}-%03d.jpg`);
        exec(`ffmpeg -i "${outputPath}" -vf fps=1 "${framesPath}"`, 
          (ffmpegError) => {
            if (ffmpegError) {
              console.error('Error extracting frames:', ffmpegError);
              return res.status(500).json({ error: 'Failed to extract frames' });
            }
            
            // Return success response
            res.json({ 
              success: true, 
              message: 'Video processed successfully',
              videoId,
              // You would typically process these frames through your 3D pipeline here
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error processing video' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});