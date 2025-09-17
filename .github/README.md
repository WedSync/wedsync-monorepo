# 🚀 WedSync GitHub Actions Workflows

This directory contains all GitHub Actions workflows for the WedSync monorepo, providing comprehensive CI/CD automation.

## 📋 Workflow Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **CI** | Push/PR to main/develop | Continuous Integration checks |
| **SonarQube** | Push/PR + Daily schedule | Code quality analysis & security |
| **Deploy Preview** | Pull Requests | Preview deployments for testing |
| **Deploy Production** | Push to main | Production deployments |
| **Release** | Main branch + Manual | Automated version management |
| **Dependency Updates** | Weekly schedule | Automated dependency updates |

## 🔄 CI Workflow (`ci.yml`)

**Triggers:** Push/PR to `main` or `develop` branches

### Features:
- **Smart Change Detection**: Only runs relevant jobs based on changed files
- **Parallel Execution**: Runs jobs concurrently for faster feedback
- **Comprehensive Checks**:
  - ESLint + Prettier code quality
  - TypeScript type checking
  - Jest unit tests with coverage
  - Turbo-powered monorepo builds
- **Caching**: Optimized dependency and build caching
- **Quality Gate**: Ensures all checks pass before merge

### Jobs:
1. **Changes Detection** - Determines which apps/packages changed
2. **Install Dependencies** - Sets up Node.js, pnpm, and caches
3. **Lint** - Runs ESLint and Prettier checks
4. **Type Check** - TypeScript compilation and type validation
5. **Test** - Jest unit tests with coverage reporting
6. **Build** - Production builds for all applications
7. **Quality Gate** - Final validation of all checks

## 📊 SonarQube Workflow (`sonarqube.yml`)

**Triggers:** Push/PR + Daily at 2 AM UTC

### Features:
- **Code Quality Analysis**: Comprehensive static analysis
- **Security Scanning**: Vulnerability detection
- **Coverage Tracking**: Test coverage monitoring
- **Quality Gates**: Automated quality thresholds
- **Clean as You Code**: Focus on new code quality

### Security Scans:
- **npm audit**: Dependency vulnerability scanning
- **Trivy**: Container and filesystem vulnerability scanning
- **SARIF Upload**: Security results to GitHub Security tab

## 🚀 Deploy Preview Workflow (`deploy-preview.yml`)

**Triggers:** Pull Requests to `main` or `develop`

### Features:
- **Parallel Deployments**: All three apps deploy simultaneously
- **Smart Deployment**: Only deploys changed applications
- **Preview URLs**: Automatic comment with preview links
- **Performance Audits**: Lighthouse CI on preview deployments
- **Environment Management**: Separate preview environments per PR

### Applications:
- **WedSync** → `wedsync-preview-pr-{number}`
- **WedMe** → `wedme-preview-pr-{number}`
- **Admin** → `admin-preview-pr-{number}`

## 🌟 Deploy Production Workflow (`deploy-production.yml`)

**Triggers:** Push to `main` branch + Releases

### Features:
- **Pre-deployment Security**: Hardcoded secrets detection
- **Zero-downtime Deployments**: Blue-green deployment strategy
- **Health Checks**: Post-deployment service validation
- **Rollback Capability**: Automatic rollback on failure
- **Performance Monitoring**: Post-deployment Lighthouse audits

### Security Checks:
- Quality gate validation
- Critical security audit
- Hardcoded secrets detection (API keys, tokens, etc.)

### Production URLs:
- **WedSync** → `https://app.wedsync.com`
- **WedMe** → `https://wedme.com`
- **Admin** → `https://admin.wedsync.com`

## 🏷️ Release Workflow (`release.yml`)

**Triggers:** Push to `main` + Manual workflow dispatch

### Features:
- **Semantic Versioning**: Automatic version calculation
- **Conventional Commits**: Version increment based on commit messages
- **Changelog Generation**: Automatic changelog from commits
- **Git Tagging**: Automatic tag creation and push
- **GitHub Releases**: Formatted release notes
- **NPM Publishing**: Optional package publishing

### Version Rules:
- `BREAKING CHANGE` or `!:` → **Major** version bump
- `feat:` commits → **Minor** version bump
- `fix:`, `chore:`, etc. → **Patch** version bump

## 🔄 Dependency Updates Workflow (`dependency-updates.yml`)

**Triggers:** Weekly on Mondays at 9 AM UTC + Manual

### Features:
- **Automated Updates**: Weekly dependency updates
- **Full Testing**: Runs complete test suite after updates
- **Security Audits**: Vulnerability scanning of new dependencies
- **Auto PR Creation**: Creates PR with update summary
- **Safety Checks**: Ensures compatibility before proposing changes

## 🔧 Required Secrets

Configure these secrets in your GitHub repository:

### Deployment Secrets:
```bash
VERCEL_TOKEN                    # Vercel deployment token
VERCEL_ORG_ID                  # Vercel organization ID
VERCEL_WEDSYNC_PROJECT_ID      # WedSync project ID
VERCEL_WEDME_PROJECT_ID        # WedMe project ID
VERCEL_ADMIN_PROJECT_ID        # Admin project ID
```

### Optional Secrets:
```bash
SONAR_TOKEN                    # SonarQube authentication token
NPM_TOKEN                      # NPM publishing token (if publishing packages)
```

### Variables:
```bash
SONAR_HOST_URL                 # SonarQube server URL (default: http://localhost:9000)
```

## 📈 Performance & Optimization

### Caching Strategy:
- **pnpm Store Cache**: Reuses downloaded packages across runs
- **Node Modules Cache**: Skips installation when dependencies unchanged
- **Build Cache**: Turbo build cache for incremental builds
- **SonarQube Cache**: Reduces analysis time

### Parallel Execution:
- **Matrix Builds**: Applications build in parallel
- **Independent Jobs**: Lint, test, and type-check run simultaneously
- **Smart Filters**: Only affected packages are processed

### Resource Usage:
- **Conditional Execution**: Jobs only run when relevant files change
- **Artifact Sharing**: Build outputs shared between jobs
- **Optimized Docker**: Multi-stage builds and layer caching

## 🛠️ Development Guidelines

### Commit Message Format:
```
type(scope): description

feat: add new user authentication
fix: resolve dashboard loading issue
chore: update dependencies
docs: improve API documentation
```

### Branch Strategy:
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature development branches
- **hotfix/***: Critical production fixes

### Pull Request Process:
1. Create feature branch from `develop`
2. Implement changes with tests
3. Create PR to `develop`
4. Automated checks and preview deployment
5. Code review and approval
6. Merge to `develop`
7. Release from `develop` to `main`

## 🔍 Monitoring & Alerts

### Quality Gates:
- **Coverage**: Minimum 80% test coverage
- **Duplication**: Maximum 3% code duplication
- **Maintainability**: Grade A rating required
- **Security**: Zero high/critical vulnerabilities

### Performance Budgets:
- **FCP**: < 2.5s (First Contentful Paint)
- **LCP**: < 4s (Largest Contentful Paint)
- **CLS**: < 0.1 (Cumulative Layout Shift)
- **FID**: < 100ms (First Input Delay)

### Security Standards:
- **Dependency Scanning**: Weekly vulnerability checks
- **Secret Detection**: Automated hardcoded secret scanning
- **HTTPS Enforcement**: SSL/TLS validation
- **Modern Security Headers**: CSP, HSTS, etc.

## 🚨 Troubleshooting

### Common Issues:

#### Build Failures:
```bash
# Clear cache and reinstall
rm -rf node_modules */node_modules
rm pnpm-lock.yaml
pnpm install
```

#### Type Errors:
```bash
# Rebuild TypeScript project references
pnpm type-check --build
```

#### Test Failures:
```bash
# Run tests with verbose output
pnpm test --verbose --coverage
```

#### Deployment Issues:
- Check Vercel token permissions
- Verify project IDs are correct
- Ensure environment variables are set

### Getting Help:
- Check workflow logs in GitHub Actions tab
- Review SonarQube reports for quality issues
- Contact DevOps team for deployment problems

---

📚 **Documentation**: [GitHub Actions Docs](https://docs.github.com/en/actions)
🔧 **Turbo Docs**: [Turborepo Documentation](https://turbo.build/repo/docs)
📊 **SonarQube**: [Quality Gates](https://docs.sonarqube.org/latest/user-guide/quality-gates/)