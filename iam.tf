# iam.tf - Service Account and IAM roles
data "google_storage_project_service_account" "gcs_account" {
}
resource "google_service_account" "function_sa" {
  account_id   = "cloud-function-sa"
  display_name = "Cloud Function Service Account"
  project      = var.project_id
}

# IAM roles for the service account
resource "google_project_iam_member" "sa_roles" {
  for_each = toset([
    "roles/eventarc.eventReceiver",
    "roles/pubsub.publisher",
    "roles/cloudfunctions.invoker",
    "roles/cloudfunctions.developer",
    "roles/run.invoker"
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.function_sa.email}"
}

# Storage bucket IAM bindings for object viewer
resource "google_storage_bucket_iam_member" "bucket_viewer_roles" {
  for_each = {
    "function_bucket" = google_storage_bucket.Cloud_function_bucket.name
    "input_bucket"    = google_storage_bucket.input_bucket.name
  }

  bucket = each.value
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.function_sa.email}"
}
# Add pubsub.publisher role to the default storage service account
resource "google_project_iam_member" "storage_sa_roles" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${data.google_storage_project_service_account.gcs_account.email_address}"
}
# Storage bucket IAM bindings for object user (only for input bucket)
resource "google_storage_bucket_iam_member" "bucket_user_role" {
  for_each = {
    "input_bucket" = google_storage_bucket.input_bucket.name
  }

  bucket = each.value
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${google_service_account.function_sa.email}"
}

# Grant public access to input storage bucket
resource "google_storage_bucket_iam_member" "public_viewer_role" {
  bucket = google_storage_bucket.input_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}


# Output the service account email for use in other files
output "function_service_account_email" {
  value = google_service_account.function_sa.email
}
