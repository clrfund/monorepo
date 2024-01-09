#!/usr/bin/env bash

#
# This script is used as a cron job reboot task in the AWS EC2 instance launched 
# for the tallying service.
# The script only runs if the USER DATA is available
# It will also stream the script console output to the S3 bucket defined in the secret s3_tally_logs
#
# Example usage:
# sh/start-tally-with-logging.sh

TOKEN=$(curl --silent -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
USER_DATA=$(curl --silent -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/user-data)

if [ -n "$USER_DATA" ]; then
  ROUND_ADDRESS=$(echo $USER_DATA | jq -r .round)
  NETWORK=$(echo $USER_DATA | jq -r .network)
  
  S3_BUCKET=$(aws secretsmanager get-secret-value --region $REGION --secret-id "s3_tally_logs" 2>/dev/null | jq -r '.SecretString')
  if [ -n "${S3_BUCKET}" ]; then
    /home/ubuntu/monorepo/contracts/sh/start-tally.sh 2>&1 | tee /home/ubuntu/logs/start-tally.log | aws s3 cp - s3://${S3_BUCKET}/${NETWORK}-${ROUND_ADDRESS}.log
  else
    /home/ubuntu/monorepo/contracts/sh/start-tally.sh 2>&1 | tee /home/ubuntu/logs/start-tally.log
  fi
fi