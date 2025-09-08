const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadVideo() {
  try {
    // Read the video file
    const videoPath = path.join(__dirname, '../public/hero-video.mp4');
    const videoFile = fs.readFileSync(videoPath);
    
    console.log('📹 Uploading video to Vercel Blob...');
    
    // Upload to Vercel Blob
    const blob = await put('hero-video.mp4', videoFile, {
      access: 'public',
      addRandomSuffix: false, // Keep the same name
    });
    
    console.log('✅ Video uploaded successfully!');
    console.log('🔗 Video URL:', blob.url);
    console.log('📝 Copy this URL to use in your video element');
    
    return blob.url;
  } catch (error) {
    console.error('❌ Error uploading video:', error);
    throw error;
  }
}

uploadVideo().catch(console.error);