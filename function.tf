# function.tf - Cloud Function configuration
resource "google_cloudfunctions2_function" "function" {
  project     = var.project_id
  name        = "Cloud-function-trigger-using-terraform-gen-2"
  location    = var.region
  description = "Cloud function gen2 trigger using terraform"

  build_config {
    runtime     = "nodejs20"
    entry_point = "convertToHLS"
    environment_variables = {
      BUILD_CONFIG_TEST = "build_test"
    }
    source {
      storage_source {
        bucket = google_storage_bucket.Cloud_function_bucket.name
        object = google_storage_bucket_object.zip.name
      }
    }
  }

  service_config {
    max_instance_count             = 2
    min_instance_count            = 0
    available_memory              = "2Gi"
    available_cpu                 = "4"
    timeout_seconds               = 60
    environment_variables = {
      SERVICE_CONFIG_TEST = "config_test"
    }
    ingress_settings               = "ALLOW_INTERNAL_ONLY"
    all_traffic_on_latest_revision = true
    service_account_email          = google_service_account.function_sa.email
  }

  event_trigger {
    trigger_region        = var.region
    event_type           = "google.cloud.storage.object.v1.finalized"
    retry_policy         = "RETRY_POLICY_RETRY"
    service_account_email = google_service_account.function_sa.email
    event_filters {
      attribute = "bucket"
      value     = google_storage_bucket.input_bucket.name
    }
  }

  depends_on = [
    google_storage_bucket.Cloud_function_bucket,
    google_storage_bucket_object.zip,
    google_service_account.function_sa,
    google_project_iam_member.sa_roles,
    google_storage_bucket_iam_member.bucket_roles
  ]
}