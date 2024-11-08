#!/bin/bash

# Set the environment variables
export GOOGLE_CLOUD_PROJECT_ID="terraform-test-254"
export GOOGLE_CLOUD_STORAGE_BUCKET="input-terraform-test-254"
export SERVICE_ACCOUNT_NAME="hls-web-app-sa"  # New variable for service account name

# Set the project
gcloud config set project $GOOGLE_CLOUD_PROJECT_ID

# Create the service account
echo "Creating service account..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="HLS Converter Service Account"

# Get the full service account email
export GOOGLE_CLOUD_CLIENT_EMAIL="${SERVICE_ACCOUNT_NAME}@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com"

# Create the service account key file
echo "Creating service account key..."
gcloud iam service-accounts keys create hls-sa-key.json \
    --iam-account=$GOOGLE_CLOUD_CLIENT_EMAIL

# Get the private key from the key file
export GOOGLE_CLOUD_PRIVATE_KEY=$(cat hls-sa-key.json | jq -r '.private_key')

# Create the .env file
echo "Creating .env file..."
cat << EOF > .env
GOOGLE_CLOUD_PROJECT_ID=$GOOGLE_CLOUD_PROJECT_ID
GOOGLE_CLOUD_STORAGE_BUCKET=$GOOGLE_CLOUD_STORAGE_BUCKET
GOOGLE_CLOUD_CLIENT_EMAIL=$GOOGLE_CLOUD_CLIENT_EMAIL
GOOGLE_CLOUD_PRIVATE_KEY=$GOOGLE_CLOUD_PRIVATE_KEY
EOF

# Grant Cloud Storage permissions
echo "Granting Storage permissions..."
gcloud storage buckets add-iam-policy-binding gs://$GOOGLE_CLOUD_STORAGE_BUCKET \
    --member="serviceAccount:$GOOGLE_CLOUD_CLIENT_EMAIL" \
    --role="roles/storage.objectCreator"

# Create and configure Pub/Sub
echo "Setting up Pub/Sub..."
gcloud pubsub topics create video-processing-complete || true
gcloud pubsub subscriptions create video-processing-complete-sub \
    --topic=video-processing-complete || true

# Grant Pub/Sub permissions
echo "Granting Pub/Sub permissions..."
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT_ID \
    --member="serviceAccount:$GOOGLE_CLOUD_CLIENT_EMAIL" \
    --role="roles/pubsub.subscriber"

echo "Setup complete! Environment variables saved to .env file, and IAM permissions granted."
echo "Service account email: $GOOGLE_CLOUD_CLIENT_EMAIL"
echo "Key file saved as: hls-sa-key.json"