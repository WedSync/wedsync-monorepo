# SonarQube Setup and Configuration Guide

## Overview

SonarQube has been comprehensively configured for the WedSync monorepo with **Clean as You Code** methodology. All configuration files and scripts are ready for use.

## ✅ Completed Configuration

### 1. Project Configuration Files
- **Main Config**: `sonar-project.properties` (comprehensive monorepo configuration)
- **WedSync App**: `wedsync/sonar-project.properties`
- **WedMe App**: `wedme/sonar-project.properties`
- **Admin App**: `admin/sonar-project.properties`

### 2. Scripts
- **Quality Gates Setup**: `scripts/setup-sonar-quality-gates.sh`
- **Analysis Script**: `scripts/sonar-analyze.sh`

### 3. Package.json Scripts
```json
{
  "sonar:start": "docker-compose -f docker-compose.sonar.yml up -d",
  "sonar:stop": "docker-compose -f docker-compose.sonar.yml down",
  "sonar:scan": "sonar-scanner",
  "sonar:setup": "./scripts/setup-sonar-quality-gates.sh",
  "sonar:analyze": "./scripts/sonar-analyze.sh analyze",
  "sonar:full": "./scripts/sonar-analyze.sh full"
}
```

### 4. Clean as You Code Configuration
- New Code Period: 30 days
- Quality Gate: Custom "WedSync-CleanCode"
- Focus on new code metrics only

## 🔧 Token Configuration Required

The SonarQube user token needs to be properly configured:

### Step 1: Verify Token in SonarQube UI
1. Open http://localhost:9000
2. Login with admin/admin (or your credentials)
3. Go to **User Account** → **Security** → **Tokens**
4. Generate a new token or verify the existing one

### Step 2: Set Environment Variable
```bash
export SONAR_TOKEN="your_actual_token_here"
```

### Step 3: Test Configuration
```bash
npm run sonar:setup    # Setup quality gates
npm run sonar:analyze  # Run analysis
```

## 📊 Quality Gate Configuration

The "WedSync-CleanCode" quality gate includes:

### New Code Conditions
- **Coverage >= 80%** - Ensures good test coverage
- **Duplicated Lines <= 3%** - Prevents code duplication
- **Maintainability Rating = A** - No code smells
- **Reliability Rating = A** - No bugs
- **Security Rating = A** - No vulnerabilities
- **Security Hotspots Reviewed = 100%** - Security review required
- **New Vulnerabilities = 0** - Zero tolerance for security issues
- **New Bugs = 0** - Zero tolerance for bugs

## 🎯 Clean as You Code Benefits

1. **Focus on New Code**: Quality gates only check new/changed code
2. **Prevent Technical Debt**: Stops accumulation of new issues
3. **Gradual Improvement**: Existing code can be improved over time
4. **Fast Feedback**: Quick analysis focused on recent changes

## 📁 Project Structure Analysis

### Monorepo Coverage
- **WedSync App** (`wedsync/src`)
- **WedMe App** (`wedme/src`)
- **Admin App** (`admin/src`)
- **Shared Packages** (`packages/*/src`)

### Exclusions
- Test files (analyzed separately)
- Build artifacts (`.next`, `dist`, `out`)
- Configuration files
- Node modules
- Generated TypeScript definitions

## 🚀 Usage Instructions

### Initial Setup (One Time)
```bash
# Start SonarQube
npm run sonar:start

# Wait for startup, then setup quality gates
export SONAR_TOKEN="your_token"
npm run sonar:setup
```

### Regular Analysis
```bash
# Quick analysis
npm run sonar:analyze

# Full analysis (with linting and tests)
npm run sonar:full
```

### CI/CD Integration
```bash
# In your CI pipeline
npm run lint:fix
npm run test
npm run sonar:analyze
```

## 🔍 Viewing Results

After analysis, view results at:
- **Monorepo**: http://localhost:9000/dashboard?id=wedsync-monorepo
- **WedSync**: http://localhost:9000/dashboard?id=wedsync-app
- **WedMe**: http://localhost:9000/dashboard?id=wedme-app
- **Admin**: http://localhost:9000/dashboard?id=admin-app

## 🛡️ Security Configuration

- Security analysis enabled
- Vulnerability detection active
- Security hotspot review required
- OWASP Top 10 coverage

## 📈 Metrics Tracked

### Code Quality
- Coverage percentage
- Code duplications
- Cognitive complexity
- Lines of code

### Maintainability
- Technical debt ratio
- Code smells count
- Maintainability rating

### Reliability
- Bug count
- Reliability rating

### Security
- Vulnerability count
- Security rating
- Security hotspots

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify token in SonarQube UI
   - Check token expiration
   - Ensure proper environment variable

2. **Analysis Fails**
   - Check SonarQube server is running
   - Verify project configuration
   - Check file paths and exclusions

3. **Quality Gate Fails**
   - Review new code metrics
   - Fix identified issues
   - Re-run analysis

### Debug Mode
```bash
sonar-scanner -X  # Enable debug logging
```

## 📚 Next Steps

1. **Set correct token** and run `npm run sonar:setup`
2. **Run first analysis** with `npm run sonar:analyze`
3. **Review quality gates** in SonarQube UI
4. **Integrate with CI/CD** pipeline
5. **Train team** on Clean as You Code methodology

## 🎉 Ready to Use!

All SonarQube configuration is complete and ready for comprehensive code analysis with Clean as You Code methodology.