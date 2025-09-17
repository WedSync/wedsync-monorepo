#!/bin/bash

# Comprehensive SonarQube Analysis Script with Clean as You Code
# This script runs a complete analysis of the WedSync monorepo

set -e

SONAR_HOST=${SONAR_HOST:-"http://localhost:9000"}
SONAR_TOKEN=${SONAR_TOKEN:-""}
BRANCH_NAME=${BRANCH_NAME:-$(git rev-parse --abbrev-ref HEAD)}
TARGET_BRANCH=${TARGET_BRANCH:-"main"}

if [ -z "$SONAR_TOKEN" ]; then
    echo "ERROR: SONAR_TOKEN environment variable is required"
    echo "Please set your SonarQube user token:"
    echo "export SONAR_TOKEN=your_token_here"
    exit 1
fi

echo "Starting SonarQube Analysis for WedSync Monorepo"
echo "=============================================="
echo "SonarQube Host: $SONAR_HOST"
echo "Branch: $BRANCH_NAME"
echo "Target Branch: $TARGET_BRANCH"
echo ""

# Function to run ESLint and generate reports
generate_eslint_reports() {
    echo "Generating ESLint reports..."

    # Root level ESLint report
    npx eslint . --format json --output-file eslint-report.json || true

    # Individual app reports
    cd wedsync && npx eslint src --format json --output-file eslint-report.json && cd .. || true
    cd wedme && npx eslint src --format json --output-file eslint-report.json && cd .. || true
    cd admin && npx eslint src --format json --output-file eslint-report.json && cd .. || true

    echo "ESLint reports generated"
}

# Function to run tests and generate coverage
generate_coverage() {
    echo "Running tests and generating coverage..."

    # Run tests with coverage
    npm run test -- --coverage || true

    echo "Coverage reports generated"
}

# Function to check if SonarQube is running
check_sonar_server() {
    echo "Checking SonarQube server..."

    if ! curl -s "$SONAR_HOST/api/system/status" > /dev/null; then
        echo "ERROR: SonarQube server is not running on $SONAR_HOST"
        echo "Please start SonarQube with: npm run sonar:start"
        exit 1
    fi

    echo "SonarQube server is running"
}

# Function to run SonarQube analysis
run_sonar_analysis() {
    local project_key=$1
    local project_name=$2
    local project_dir=$3

    echo "Analyzing $project_name ($project_key)..."

    local sonar_args=(
        "-Dsonar.projectKey=$project_key"
        "-Dsonar.projectName=$project_name"
        "-Dsonar.host.url=$SONAR_HOST"
        "-Dsonar.token=$SONAR_TOKEN"
        "-Dsonar.branch.name=$BRANCH_NAME"
    )

    # Add target branch if not on main/master
    if [ "$BRANCH_NAME" != "main" ] && [ "$BRANCH_NAME" != "master" ]; then
        sonar_args+=("-Dsonar.branch.target=$TARGET_BRANCH")
    fi

    if [ "$project_dir" != "." ]; then
        cd "$project_dir"
    fi

    sonar-scanner "${sonar_args[@]}"

    if [ "$project_dir" != "." ]; then
        cd ..
    fi

    echo "$project_name analysis completed"
}

# Main execution
main() {
    # Verify prerequisites
    check_sonar_server

    # Prepare code quality reports
    echo "Preparing analysis..."
    npm run lint:fix || true
    npm run format || true

    generate_eslint_reports
    generate_coverage

    echo ""
    echo "Running SonarQube Analysis"
    echo "========================="

    # Analyze monorepo
    run_sonar_analysis "wedsync-monorepo" "WedSync Monorepo" "."

    # Analyze individual applications
    run_sonar_analysis "wedsync-app" "WedSync Supplier Platform" "wedsync"
    run_sonar_analysis "wedme-app" "WedMe Client Platform" "wedme"
    run_sonar_analysis "admin-app" "WedSync Admin Dashboard" "admin"

    echo ""
    echo "Analysis completed successfully!"
    echo "==============================="
    echo "Visit $SONAR_HOST to view results"
    echo ""
    echo "Projects analyzed:"
    echo "- WedSync Monorepo: $SONAR_HOST/dashboard?id=wedsync-monorepo"
    echo "- WedSync App: $SONAR_HOST/dashboard?id=wedsync-app"
    echo "- WedMe App: $SONAR_HOST/dashboard?id=wedme-app"
    echo "- Admin App: $SONAR_HOST/dashboard?id=admin-app"
}

# Handle script arguments
case "${1:-analyze}" in
    "setup")
        echo "Setting up SonarQube quality gates and rules..."
        ./scripts/setup-sonar-quality-gates.sh
        ;;
    "analyze")
        main
        ;;
    "full")
        echo "Running full setup and analysis..."
        ./scripts/setup-sonar-quality-gates.sh
        main
        ;;
    *)
        echo "Usage: $0 [setup|analyze|full]"
        echo "  setup   - Configure quality gates and rules"
        echo "  analyze - Run code analysis (default)"
        echo "  full    - Setup + analysis"
        exit 1
        ;;
esac