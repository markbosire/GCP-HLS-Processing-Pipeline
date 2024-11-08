#!/bin/bash

# Set the environment variables
export GOOGLE_CLOUD_PROJECT_ID="your-project-id"
export GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"
export GOOGLE_CLOUD_CLIENT_EMAIL="your-service-account-email"
export GOOGLE_CLOUD_PRIVATE_KEY="your-service-account-private-key"

# Create the .env file
cat << EOF > .env
GOOGLE_CLOUD_PROJECT_ID=$GOOGLE_CLOUD_PROJECT_ID
GOOGLE_CLOUD_STORAGE_BUCKET=$GOOGLE_CLOUD_STORAGE_BUCKET
GOOGLE_CLOUD_CLIENT_EMAIL=$GOOGLE_CLOUD_CLIENT_EMAIL
GOOGLE_CLOUD_PRIVATE_KEY=$GOOGLE_CLOUD_PRIVATE_KEY
EOF

# Grant the necessary IAM permissions

gcloud config set project $GOOGLE_CLOUD_PROJECT_ID

# Create the service account key file
gcloud iam service-accounts keys create hls-sa-key.json \
  --iam-account=$GOOGLE_CLOUD_CLIENT_EMAIL


# Grant Cloud Storage permissions
gcloud storage buckets add-iam-policy-binding gs://$GOOGLE_CLOUD_STORAGE_BUCKET \
  --member="serviceAccount:$GOOGLE_CLOUD_CLIENT_EMAIL" \
  --role="roles/storage.objectCreator"

# Grant Pub/Sub permissions
gcloud pubsub topics create video-processing-complete
gcloud pubsub subscriptions create video-processing-complete-sub \
  --topic=video-processing-complete
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT_ID \
  --member="serviceAccount:$GOOGLE_CLOUD_CLIENT_EMAIL" \
  --role="roles/pubsub.subscriber"

echo "Environment variables saved to .env file, and IAM permissions granted."