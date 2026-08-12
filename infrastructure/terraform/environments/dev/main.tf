terraform {
  required_version = ">= 1.5"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

output "note" {
  value = "Wire modules network/ecs/rds/redis/ecr/iam/alb/secrets for full AWS deploy (M10)."
}
