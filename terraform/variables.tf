variable "aws_region" {
  type        = string
  description = "AWS region to deploy the infrastructure"
  default     = "us-east-1"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type (use t2.micro or t3.micro for free tier)"
  default     = "t2.micro"
}

variable "key_name" {
  type        = string
  description = "Name of the existing AWS Key Pair to use for SSH access"
}

variable "ssh_allowed_ip" {
  type        = string
  description = "IP address or CIDR range allowed to SSH into the instance (default allows all, but restricting is recommended)"
  default     = "0.0.0.0/0"
}

variable "project_name" {
  type        = string
  description = "Name of the project to tag resources"
  default     = "kalindi"
}
