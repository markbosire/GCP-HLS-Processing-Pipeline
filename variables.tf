variable "project_id" {
  type    = string
  default = "banded-meridian-435911-g6"
}

variable "region" {
  type    = string
  default = "us-east4"
}

output "project_id" {
  value       = var.project_id
  description = "The ID of the Google Cloud project"
}