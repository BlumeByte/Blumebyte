# GitHub Security Setup - Quick Start Guide

## 📋 Summary

This guide helps you configure GitHub security features and branch protection rules for the Blumebyte repository.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Enable Security Features

Go to **Settings** → **Security** → **Code security and analysis**

Enable these features:
- ✅ Dependency graph
- ✅ Dependabot alerts
- ✅ Dependabot security updates
- ✅ Grouped security updates
- ✅ CodeQL analysis
- ✅ Secret scanning
- ✅ Push protection for secret scanning

**All features are FREE for public and private repositories!**

---

### Step 2: Configure Branch Protection

Go to **Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch ruleset**

#### Main Branch Protection

**Ruleset Name**: `main-branch-protection`

**Target**: Branch name pattern `main`

**Enable these rules:**
1. ✅ **Restrict deletions** - Prevent branch deletion
2. ✅ **Require pull request** - 2 approvals required
3. ✅ **Require status checks** - Must pass CI/CD
4. ✅ **Block force pushes** - No force push allowed
5. ✅ **Require linear history** - No merge commits

**Status checks to require:**
- Build Application
- NPM Audit
- CodeQL Analysis

**Click "Create"** to save the ruleset.

---

### Step 3: Configure Develop Branch

Create another ruleset for `develop` branch:

**Ruleset Name**: `develop-branch-protection`

**Target**: Branch name pattern `develop`

**Enable these rules:**
1. ✅ **Restrict deletions**
2. ✅ **Require pull request** - 1 approval required
3. ✅ **Require status checks**
4. ✅ **Block force pushes**

---

### Step 4: Set Up Environments

Go to **Settings** → **Environments**

#### Create Production Environment
1. Click **New environment**
2. Name: `production`
3. Add protection rules:
   - ✅ Required reviewers: 2
   - ✅ Wait timer: 5 minutes
   - ✅ Deployment branches: Only `main`
4. Add secrets (see below)

#### Create Staging Environment
1. Click **New environment**
2. Name: `staging`
3. Add protection rules:
   - ✅ Required reviewers: 1
   - ✅ Deployment branches: `main` and `develop`

---

### Step 5: Add Environment Secrets

In each environment, add these secrets:

**Production Secrets:**
```
VITE_SUPABASE_URL=https://ivohczdtuxasyfoiphqu.supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```

**Staging Secrets:**
```
VITE_SUPABASE_URL=[your-staging-url]
VITE_SUPABASE_ANON_KEY=[your-staging-anon-key]
```

⚠️ **NEVER** add `SUPABASE_SERVICE_ROLE_KEY` to Vercel/GitHub - it stays in Supabase only!

---

## 📁 Files Created

### GitHub Workflows
- `.github/workflows/security-scan.yml` - Runs security scans on every push
- `.github/workflows/build-test.yml` - Builds and tests the app

### Configuration Files
- `.github/dependabot.yml` - Automated dependency updates
- `.github/CODEOWNERS` - Code review assignments
- `.github/pull_request_template.md` - PR template
- `.github/BRANCH_PROTECTION_RULES.md` - Detailed protection rules

### Issue Templates
- `.github/ISSUE_TEMPLATE/bug_report.md` - Bug reporting
- `.github/ISSUE_TEMPLATE/feature_request.md` - Feature requests
- `.github/ISSUE_TEMPLATE/security_vulnerability.md` - Security disclosure

### Deployment Files
- `.vercelignore` - Exclude server code from Vercel
- `vercel.json` - Vercel build configuration
- `.npmrc` - NPM configuration
- `VERCEL_DEPLOYMENT_FIX.md` - Deployment troubleshooting guide

---

## 🔄 Automated Workflows

### What Runs Automatically?

#### On Every Push/PR:
1. **Security Scan** - Checks for vulnerabilities
2. **Build Test** - Verifies code compiles
3. **CodeQL Analysis** - Scans for security issues
4. **Secret Scanning** - Detects leaked secrets

#### Weekly (Every Monday):
1. **Dependency Updates** - Dependabot creates PRs
2. **Security Audit** - Full security scan

#### On Pull Requests:
1. **Dependency Review** - Checks new dependencies
2. **Required Reviews** - Based on CODEOWNERS
3. **Status Checks** - All tests must pass

---

## 👥 Team Setup

### Create GitHub Teams (Recommended)

Go to **Organization Settings** → **Teams**

Create these teams:
1. `@BlumeByte/maintainers` - Full access
2. `@BlumeByte/security-team` - Security reviews
3. `@BlumeByte/frontend-team` - Frontend code reviews
4. `@BlumeByte/backend-team` - Backend code reviews
5. `@BlumeByte/devops-team` - Infrastructure reviews

Assign members to appropriate teams.

---

## 🔒 Security Best Practices

### DO ✅
- Use pull requests for all changes
- Require code reviews before merging
- Keep dependencies updated (Dependabot helps)
- Use branch protection rules
- Enable secret scanning
- Sign commits with GPG
- Use environment-specific secrets

### DON'T ❌
- Never commit secrets to Git
- Never force push to main/develop
- Never bypass branch protection (except emergencies)
- Never share service role keys
- Never disable security features "temporarily"

---

## 📊 Monitoring

### What to Check Weekly:
1. Dependabot PRs - Review and merge security updates
2. CodeQL Alerts - Fix any security issues
3. Failed Workflows - Investigate build failures
4. Secret Scanning Alerts - Rotate any exposed secrets

### What to Check Monthly:
1. Review branch protection effectiveness
2. Audit team permissions
3. Review environment secrets
4. Check deployment logs

---

## 🆘 Emergency Procedures

### If a Secret is Exposed:

1. **Immediate Action**:
   - Rotate the secret in Supabase/service
   - Update in GitHub environment secrets
   - Check logs for unauthorized access

2. **Investigation**:
   - Review commit history
   - Check who had access
   - Identify impact scope

3. **Prevention**:
   - Enable push protection (if not already)
   - Review team access
   - Update security training

### If Main Branch is Broken:

1. **Immediate Fix**:
   - Create hotfix branch from last good commit
   - Fix the issue
   - Create PR with "hotfix" label
   - Get emergency approval
   - Merge and deploy

2. **Post-Incident**:
   - Review what happened
   - Update tests to prevent recurrence
   - Update documentation

---

## ✅ Verification Checklist

After setup, verify these work:

- [ ] Cannot push directly to main branch
- [ ] Cannot delete main/develop branches
- [ ] PRs require approvals before merging
- [ ] CI/CD runs on every PR
- [ ] Dependabot creates update PRs weekly
- [ ] Security scans run automatically
- [ ] Team members are assigned correct roles
- [ ] Environment secrets are configured
- [ ] Production deploys require 2 approvals
- [ ] Push protection blocks committed secrets

---

## 🎯 Success Metrics

Track these metrics to measure security effectiveness:

1. **Mean Time to Update** - How fast we update dependencies
2. **Security Alert Resolution Time** - How fast we fix vulnerabilities
3. **Code Review Coverage** - % of PRs with reviews
4. **Deployment Frequency** - Deployments per week
5. **Failed Deployment Rate** - % of deployments that fail

**Target Goals:**
- 🎯 Update dependencies within 7 days
- 🎯 Fix critical vulnerabilities within 24 hours
- 🎯 100% code review coverage
- 🎯 <5% failed deployment rate

---

## 📚 Additional Resources

### Documentation
- [GitHub Branch Protection Rules](.github/BRANCH_PROTECTION_RULES.md)
- [Vercel Deployment Fix](VERCEL_DEPLOYMENT_FIX.md)
- [Security Audit Report](SECURITY-AUDIT.md)

### External Links
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)

---

## 🎉 You're All Set!

Your repository now has enterprise-grade security configured:

✅ Automated security scanning  
✅ Branch protection rules  
✅ Code review requirements  
✅ Dependency management  
✅ Secret scanning  
✅ Environment protection  

**Next Steps:**
1. Commit these changes to GitHub
2. Enable the security features in GitHub Settings
3. Create the branch protection rulesets
4. Set up environments with secrets
5. Test the workflow by creating a PR

---

**Need Help?** Open an issue with label `github-setup` or contact @BlumeByte/devops-team

**Last Updated:** January 2025  
**Version:** 1.0
