# Clean as You Code Configuration

This document outlines the Clean as You Code methodology implemented for the WedSync project.

## Overview

Clean as You Code focuses on maintaining and improving code quality on new code, ensuring that:
- New code meets high quality standards
- Technical debt doesn't accumulate in new development
- Quality gates focus on new code metrics

## Quality Gate Configuration

### New Code Quality Conditions

1. **Coverage on New Code >= 80%**
   - Ensures new code is well-tested
   - Prevents regression in test coverage

2. **Duplicated Lines on New Code <= 3%**
   - Prevents code duplication in new development
   - Encourages proper code reuse patterns

3. **Maintainability Rating on New Code = A**
   - No code smells in new code
   - Maintains clean architecture

4. **Reliability Rating on New Code = A**
   - No bugs in new code
   - Ensures robust implementation

5. **Security Rating on New Code = A**
   - No security vulnerabilities in new code
   - Maintains secure coding practices

6. **Security Hotspots Reviewed = 100%**
   - All security hotspots must be reviewed
   - Ensures security awareness

7. **New Vulnerabilities = 0**
   - Zero tolerance for new vulnerabilities
   - Strict security enforcement

8. **New Bugs = 0**
   - Zero tolerance for new bugs
   - Ensures code quality

## New Code Period

The new code period is configured to focus on:
- **Previous Version**: Compares against the last release
- **30 Days**: Rolling window for continuous development

## Branch Strategy

- **Main Branch**: `main` serves as the baseline
- **Feature Branches**: Analyzed against main branch
- **Pull Requests**: Quality gate must pass before merge

## Implementation Guidelines

### For Developers

1. **Before Committing**:
   ```bash
   npm run lint:fix
   npm run format
   npm run test
   npm run type-check
   ```

2. **Local Analysis**:
   ```bash
   npm run sonar:analyze
   ```

3. **Full Setup** (first time):
   ```bash
   npm run sonar:full
   ```

### CI/CD Integration

The following should be integrated into your CI/CD pipeline:

```bash
# Pre-analysis
npm run sonar:prepare

# Analysis
npm run sonar:analyze

# Check quality gate
# (Quality gate will fail the build if conditions aren't met)
```

## Quality Metrics Focus

### Primary Metrics
- Code Coverage (New Code)
- Duplicated Lines (New Code)
- Maintainability Rating (New Code)
- Reliability Rating (New Code)
- Security Rating (New Code)

### Secondary Metrics
- Cognitive Complexity
- Lines of Code
- Technical Debt Ratio

## Best Practices

1. **Write Tests First**: Ensure new functionality is tested
2. **Review Security Hotspots**: Address all security concerns
3. **Eliminate Code Smells**: Fix maintainability issues
4. **Monitor Complexity**: Keep cognitive complexity low
5. **Regular Analysis**: Run SonarQube analysis frequently

## Exclusions

The following are excluded from analysis:
- Test files (analyzed separately)
- Generated code
- Third-party libraries
- Configuration files
- Build artifacts

## Reporting

Quality metrics are available at:
- **Monorepo**: http://localhost:9000/dashboard?id=wedsync-monorepo
- **WedSync App**: http://localhost:9000/dashboard?id=wedsync-app
- **WedMe App**: http://localhost:9000/dashboard?id=wedme-app
- **Admin App**: http://localhost:9000/dashboard?id=admin-app

## Continuous Improvement

- Quality gates evolve with project maturity
- Metrics thresholds may be adjusted based on team performance
- Regular reviews of quality trends and patterns