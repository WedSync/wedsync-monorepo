#!/bin/bash

# SonarQube Quality Gates and Rules Setup Script
# This script configures comprehensive quality gates for Clean as You Code

SONAR_HOST=${SONAR_HOST:-"http://localhost:9000"}
SONAR_TOKEN=${SONAR_TOKEN:-""}

if [ -z "$SONAR_TOKEN" ]; then
    echo "ERROR: SONAR_TOKEN environment variable is required"
    echo "Please set your SonarQube user token:"
    echo "export SONAR_TOKEN=your_token_here"
    exit 1
fi

echo "Setting up SonarQube Quality Gates and Rules..."
echo "SonarQube Host: $SONAR_HOST"

# Create custom quality gate for Clean as You Code
echo "Creating WedSync Quality Gate..."
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualitygates/create" \
  -d "name=WedSync-CleanCode"

# Get the quality gate ID
GATE_ID=$(curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/qualitygates/list" | \
  grep -o '"id":[0-9]*,"name":"WedSync-CleanCode"' | \
  grep -o '[0-9]*' | head -1)

if [ -z "$GATE_ID" ]; then
    echo "ERROR: Failed to create or find WedSync-CleanCode quality gate"
    exit 1
fi

echo "Quality Gate ID: $GATE_ID"

# Set conditions for the quality gate (Clean as You Code focused)
echo "Setting quality gate conditions..."

# Coverage on New Code
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualitygates/create_condition" \
  -d "gateId=$GATE_ID" \
  -d "metric=new_coverage" \
  -d "op=LT" \
  -d "error=80"

# Duplicated Lines on New Code
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualitygates/create_condition" \
  -d "gateId=$GATE_ID" \
  -d "metric=new_duplicated_lines_density" \
  -d "op=GT" \
  -d "error=3"

# Maintainability Rating on New Code
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualitygates/create_condition" \
  -d "gateId=$GATE_ID" \
  -d "metric=new_maintainability_rating" \
  -d "op=GT" \
  -d "error=1"

# Reliability Rating on New Code
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualitygates/create_condition" \
  -d "gateId=$GATE_ID" \
  -d "metric=new_reliability_rating" \
  -d "op=GT" \
  -d "error=1"

# Security Rating on New Code
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualitygates/create_condition" \
  -d "gateId=$GATE_ID" \
  -d "metric=new_security_rating" \
  -d "op=GT" \
  -d "error=1"

# Security Hotspots Reviewed
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualitygates/create_condition" \
  -d "gateId=$GATE_ID" \
  -d "metric=new_security_hotspots_reviewed" \
  -d "op=LT" \
  -d "error=100"

# New Vulnerabilities
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualitygates/create_condition" \
  -d "gateId=$GATE_ID" \
  -d "metric=new_vulnerabilities" \
  -d "op=GT" \
  -d "error=0"

# New Bugs
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualitygates/create_condition" \
  -d "gateId=$GATE_ID" \
  -d "metric=new_bugs" \
  -d "op=GT" \
  -d "error=0"

# Set as default quality gate
echo "Setting WedSync Quality Gate as default..."
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualitygates/set_as_default" \
  -d "id=$GATE_ID"

# Configure projects to use this quality gate
echo "Configuring projects to use WedSync Quality Gate..."

# List of project keys
PROJECTS=("wedsync-monorepo" "wedsync-app" "wedme-app" "admin-app")

for project in "${PROJECTS[@]}"; do
    echo "Setting quality gate for project: $project"
    curl -u "$SONAR_TOKEN:" -X POST \
      "$SONAR_HOST/api/qualitygates/select" \
      -d "gateId=$GATE_ID" \
      -d "projectKey=$project"
done

# Create custom rule profile for TypeScript/JavaScript
echo "Creating custom rule profile..."
curl -u "$SONAR_TOKEN:" -X POST \
  "$SONAR_HOST/api/qualityprofiles/create" \
  -d "name=WedSync-TypeScript" \
  -d "language=ts"

# Get the profile key
PROFILE_KEY=$(curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/qualityprofiles/search?qualityProfile=WedSync-TypeScript" | \
  grep -o '"key":"[^"]*' | sed 's/"key":"//' | head -1)

echo "Profile Key: $PROFILE_KEY"

# Set as default profile for TypeScript
if [ ! -z "$PROFILE_KEY" ]; then
    curl -u "$SONAR_TOKEN:" -X POST \
      "$SONAR_HOST/api/qualityprofiles/set_default" \
      -d "key=$PROFILE_KEY"

    # Associate profile with projects
    for project in "${PROJECTS[@]}"; do
        echo "Setting quality profile for project: $project"
        curl -u "$SONAR_TOKEN:" -X POST \
          "$SONAR_HOST/api/qualityprofiles/add_project" \
          -d "key=$PROFILE_KEY" \
          -d "project=$project"
    done
fi

echo "SonarQube configuration completed!"
echo ""
echo "Quality Gate 'WedSync-CleanCode' has been created with the following conditions:"
echo "- Coverage on New Code >= 80%"
echo "- Duplicated Lines on New Code <= 3%"
echo "- Maintainability Rating on New Code = A"
echo "- Reliability Rating on New Code = A"
echo "- Security Rating on New Code = A"
echo "- Security Hotspots Reviewed = 100%"
echo "- New Vulnerabilities = 0"
echo "- New Bugs = 0"
echo ""
echo "All projects have been configured to use this quality gate."
echo "Visit $SONAR_HOST to view your projects and quality gates."