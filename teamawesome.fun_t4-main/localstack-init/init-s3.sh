#!/bin/bash
set -euxo pipefail

echo "Starting S3 initialization..."
awslocal s3 mb s3://teamawesome-bucket || {
    echo "Failed to create bucket"
    exit 1
}

echo "Verifying bucket creation..."
awslocal s3 ls || {
    echo "Failed to list buckets"
    exit 1
}

echo "S3 initialization complete!"