#!/usr/bin/env bash

# This script will stop the AWS EC2 instance the script is currently on
#
# Example usage:
# sh/stop-instance.sh

TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
aws ec2 stop-instances --instance-ids $(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id) 
