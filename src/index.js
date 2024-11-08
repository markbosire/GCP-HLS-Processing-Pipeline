const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const { PubSub } = require('@google-cloud/pubsub');
const path = require('path');
const fs = require('fs').promises;
const convertVideoToHLS = require('./converter');  // Ensure `converter.js` is in the same directory

const storage = new Storage();
const pubsub = new PubSub();
const TEMP_DIR = '/tmp';
const PUBSUB_TOPIC = 'video-processing-complete';

functions.cloudEvent('convertToHLS', async (cloudEvent) => {
    const file = cloudEvent.data;

    console.log(`Processing file: ${file.name} in bucket: ${file.bucket}`);

    // Download the file to a temporary location
    const localFilePath = path.join(TEMP_DIR, file.name);
    const bucket = storage.bucket(file.bucket);
    const remoteFile = bucket.file(file.name);

    await remoteFile.download({ destination: localFilePath });
    console.log(`Downloaded ${file.name} to ${localFilePath}`);

    // Convert video to HLS
    const outputDir = path.join(TEMP_DIR, `${path.basename(file.name, path.extname(file.name))}-hls`); 
    const results = await convertVideoToHLS(localFilePath, { outputDir });
    console.log(results.playlists);
    const hlsDir = path.join(outputDir, `${path.basename(file.name, path.extname(file.name))}/hls`);
    const files = await fs.readdir(hlsDir);
    console.log('Files in HLS output directory:', files);

    console.log('Conversion to HLS completed');

    // Upload each HLS file
    for (const fileName of files) {
        const outputFilePath = path.join(hlsDir, fileName);
        const destination = `hls/${path.basename(file.name, path.extname(file.name))}/${path.basename(fileName)}`; // Specify the destination path in Cloud Storage

        await bucket.upload(outputFilePath, {
            destination: destination,
        });
        console.log(`Uploaded HLS file: ${fileName}`);
    }

    // Clean up temporary files
    await fs.unlink(localFilePath);
    console.log(`Cleaned up local file ${localFilePath}`);

    // Delete the original file from Cloud Storage
    await remoteFile.delete();
    console.log(`Deleted original file ${file.name} from Cloud Storage`);

    // Publish a message to Pub/Sub to indicate that processing is complete
    const messageData = JSON.stringify({
        videoId: path.basename(file.name, path.extname(file.name)),
        status: 'processed',
        timestamp: new Date().toISOString()
    });

    const dataBuffer = Buffer.from(messageData);
    await pubsub.topic(PUBSUB_TOPIC).publish(dataBuffer);
    console.log(`Published processing completion message for video: ${file.name}`);
});
