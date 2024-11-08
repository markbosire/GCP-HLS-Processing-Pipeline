terraform {
  backend "gcs" {
    bucket = "banded-meridian-435911-g6-terraform" # GCS bucket name to store terraform tfstate
    prefix = "function"                            # Prefix name should be unique for each Terraform project having same remote state bucket.
  }
  # backend "local" {}
}