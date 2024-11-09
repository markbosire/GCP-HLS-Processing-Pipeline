require('dotenv').config()
const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { PubSub } = require('@google-cloud/pubsub');
const path = require('path');
var cors = require('cors')

// Initialize the Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: path.join(__dirname, 'hls-sa-key.json'),
});

const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
const bucket = storage.bucket(bucketName);

// Initialize Pub/Sub client
const pubsub = new PubSub();
const PUBSUB_TOPIC = 'video-processing-complete';
const PUBSUB_SUBSCRIPTION = 'video-processing-complete-sub';

// Initialize Express and Multer
const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

// Serve the HTML file
app.use(cors())
app.use(express.static('public'));
app.get('/videos', async (req, res) => {
  try {
    const [files] = await storage.bucket(bucketName).getFiles({ prefix: 'hls/' });
    const folderNames = files
    .map(file => file.name.split('/')[1])  // Split by '/' and take the second part (folder)
    .filter((value, index, self) => self.indexOf(value) === index);  // Remove duplicates

  // Send the folder names as a JSON response
  res.json(folderNames);
   
  } catch (error) {
    console.error('Error fetching video files:', error);
    res.status(500).send('Error fetching video files');
  }
});

// Route to handle video upload
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const videoPath = req.file.path;
    const destination = `${req.file.originalname}`;
    console.log(destination)

    // Upload the video file to Cloud Storage
    await bucket.upload(videoPath, {
      destination,
      metadata: {
        contentType: 'video/mp4', 
      },
    });

    // Now the video is uploaded, and we will wait for processing confirmation via Pub/Sub
    let processingComplete = false;

    const handlePubSubMessage = (message) => {
      const messageData = JSON.parse(Buffer.from(message.data, 'base64').toString());
      console.log(`Received message: Video ID ${messageData.videoId} processed at ${messageData.timestamp}`);
      
      if (messageData.status === "processed") {
        
        processingComplete = true;
      } 
      // Acknowledge the message so it's not reprocessed
      message.ack();
    };

    const listenForProcessingComplete = async () => {
      const subscription = pubsub.subscription(PUBSUB_SUBSCRIPTION);
      subscription.on('message', handlePubSubMessage);

      // Polling until processing is complete
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject('Processing timed out');
        }, 600000); // Wait for 10 minutes

        const interval = setInterval(() => {
          if (processingComplete) {
            clearInterval(interval);
            clearTimeout(timeout);
            resolve();
          }
        }, 1000); // Check every 1 second
      });
    };

    // Wait for processing to complete before sending the response
    await listenForProcessingComplete();

    // Respond with the success message after processing is complete
    res.status(200).json({
      message: 'Video uploaded and processed successfully',
    });

  } catch (error) {
    console.error('Error uploading or processing video:', error);
    res.status(500).send('An error occurred while uploading or processing the video.');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});