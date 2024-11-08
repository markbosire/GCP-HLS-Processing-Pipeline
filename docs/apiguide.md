To enable the required APIs using the Google Cloud CLI (`gcloud`), you can run the following commands:

```
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable eventarc.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable run.googleapis.com
```

These commands will enable the necessary APIs for the Google Cloud resources used in the provided Terraform configuration.

Make sure you have the Google Cloud SDK installed and your account authenticated with the necessary permissions to enable these APIs. You may also need to set your project ID using the `gcloud config set project [PROJECT_ID]` command before running these API enablement commands.

After running these commands, you should be able to proceed with deploying the Terraform configuration without any issues related to missing APIs.