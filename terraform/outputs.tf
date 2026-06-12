output "instance_public_ip" {
  value       = aws_instance.web.public_ip
  description = "The public IP address of the EC2 instance"
}

output "ssh_connection_string" {
  value       = "ssh -o StrictHostKeyChecking=no ubuntu@${aws_instance.web.public_ip}"
  description = "SSH command to connect to the EC2 instance"
}
