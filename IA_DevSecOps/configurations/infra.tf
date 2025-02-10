# Security Group avec des règles dangereuses
resource "aws_security_group" "allow_all" {
  name        = "allow_all"
  description = "Security group with open rules"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # ⚠️ SSH accessible à tout le monde
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # ⚠️ HTTP accessible à tout le monde
  }
}

# IAM Policy avec accès illimité
resource "aws_iam_policy" "admin_policy" {
  name        = "admin_policy"
  description = "Overly permissive IAM policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "*"
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# S3 Bucket sans chiffrement
resource "aws_s3_bucket" "unsecure_bucket" {
  bucket = "my-unsecure-bucket"
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "versioning_example" {
  bucket = aws_s3_bucket.unsecure_bucket.id
  versioning_configuration {
    status = "Disabled"  # ⚠️ Versioning désactivé
  }
}

# Subnet public exposé sur Internet
resource "aws_vpc" "main_vpc" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.main_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true  # ⚠️ Le subnet est public
}

# Identifiants AWS exposés en dur (⚠️ Faille de sécurité)
variable "aws_access_key" {
  default = "AKIAEXAMPLE1234567890"
}

variable "aws_secret_key" {
  default = "EXAMPLESECRETKEYWITH40CHARACTERS12345678"
}

# ⚠️ CloudTrail n'est pas activé (absence de journaux AWS)
