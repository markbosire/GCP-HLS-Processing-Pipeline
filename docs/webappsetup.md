
1. Change the directory into the upload-view-app directory Update the environment variables in the `setup.sh` script:

```bash
#!/bin/bash

export GOOGLE_CLOUD_PROJECT_ID="your-project-id"
export GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"
export SERVICE_ACCOUNT_NAME="your-prefered-service-account-email-for-the-webapp"

```

Replace the following placeholders with your actual values:

- `your-project-id`
- `your-bucket-name`
- `your-prefered-service-account-email-for-the-webapp`


1. Run the `setup.sh` script to create the `.env` file and grant the necessary IAM permissions:

```
bash setup.sh
```

3. Install the project dependencies:

```
npm install
```

6. Start the application:

```
node app.js
```

The server will start running on `http://localhost:3000`. You can now interact with the application, which will use the configured Cloud Storage bucket and Pub/Sub topic/subscription.

## Usage

1. Open the  `http://localhost:3000` file in a web browser.
2. Click the "Select a video file" button to choose a video from your local file system.
3. Wait for the video upload and processing to complete. The loading spinner will be displayed during this time.
4. Once the process is complete, a success message will be displayed then the page will reload .
5. The uploaded video can now be previewed in the video player area if selected.
