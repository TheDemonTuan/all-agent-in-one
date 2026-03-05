# Repository Setup Guide

## GitHub Repository Configuration

### ✅ Already Configured

The following settings have been automatically configured:

- [x] Repository description set
- [x] Topics/tags added
- [x] Default branch set to `main`
- [x] Release v0.1.0 published
- [x] CI/CD workflows enabled

### 📋 Manual Configuration Steps

#### 1. Repository Settings

Go to: `Settings` → `General`

**About Section:**
- **Description**: `Multi-Agent Terminal for TDT Vibe Coding - Run multiple AI coding agents in parallel terminal panes`
- **Website**: `https://github.com/TheDemonTuan/all-agent-in-one`

**Topics (click "Manage topics"):**
```
electron
terminal
ai
react
typescript
electron-app
productivity
developer-tools
windows
multi-agent
vite
xterm
workspace
coding
automation
```

#### 2. Branch Protection

Go to: `Settings` → `Branches` → `Add branch protection rule`

**Branch name pattern**: `main`

**Protect:**
- [x] Require a pull request before merging
- [x] Require approvals (1)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
  - Required status checks: `build`, `package`
- [x] Require branches to be up to date before merging
- [x] Include administrators
- [x] Force pushes (uncheck to allow)
- [x] Allow deletions (uncheck to prevent)

#### 3. Release Settings

Go to: `Settings` → `General` → `Releases`

**Recommended:**
- [x] Show published at date
- [x] Display release creation date

#### 4. Issue Templates

Already configured in `.github/ISSUE_TEMPLATE/`:
- Bug report template
- Feature request template

**Enable:**
Go to: `Settings` → `General` → `Features`
- [x] Issues (enabled)

#### 5. Pull Requests

Already configured:
- PR template in `.github/PULL_REQUEST_TEMPLATE.md`

**Settings:** `Settings` → `General` → `Pull Requests`
- [x] Allow merge commits
- [x] Allow squash merging
- [x] Allow rebase merging
- [x] Automatically delete head branches

#### 6. GitHub Actions

Already configured workflows:
- `build.yml` - Build and test on push
- `code-quality.yml` - Code quality checks
- `auto-release.yml` - Automated releases
- `update-badges.yml` - Badge updates

**Enable:**
Go to: `Settings` → `Actions` → `General`
- [x] Allow all actions and reusable workflows
- [x] Allow GitHub Actions to create approvals
- [x] Send status updates

#### 7. Security Settings

Go to: `Settings` → `Security`

**Enable:**
- [x] Dependabot alerts
- [x] Dependabot security updates
- [x] Dependabot version updates
- [x] Code scanning alerts (optional)

**Security policy:**
Already created: `SECURITY.md`

#### 8. Social Preview

Go to: `Settings` → `General` → `Social preview`

**Upload an image:**
- Size: 1280x640 pixels
- Format: PNG or JPEG
- Content: TDT Space logo or screenshot

#### 9. Pages (Optional)

For documentation site:

Go to: `Settings` → `Pages`

**Source:**
- [ ] Deploy from branch (if you want GitHub Pages)
- Branch: `gh-pages` (create if needed)

#### 10. Discussions

Go to: `Settings` → `General` → `Features`

**Enable:**
- [x] Discussions (for community Q&A)

---

## Post-Setup Checklist

### Verification

- [ ] Visit repository homepage - check About section
- [ ] Verify topics/tags are visible
- [ ] Check workflows are running: `Actions` tab
- [ ] Verify release is published: `Releases` section
- [ ] Test issue templates: `Issues` → `New issue`
- [ ] Verify security policy link appears in Security tab

### Optional Enhancements

#### GitHub Sponsors
1. Go to: `https://github.com/sponsors/TheDemonTuan`
2. Set up sponsorship tiers
3. Add sponsor button to repository

#### GitHub Pages Site
1. Create `gh-pages` branch or use `/docs` folder
2. Set up in Settings → Pages
3. Add custom domain (optional)

#### Community Profile
Go to: `https://github.com/TheDemonTuan/all-agent-in-one/community`

Aim for 100% completion:
- [x] README.md
- [x] LICENSE
- [x] CONTRIBUTING.md
- [x] CODE_OF_CONDUCT.md (create if needed)
- [x] SECURITY.md
- [ ] Social preview image

#### Insights
- Monitor: `Insights` → `Traffic` for views and clones
- Track: `Insights` → `Code frequency` for contributions
- Watch: `Insights` → `Dependency graph` for dependencies

---

## Quick Commands

### Update Repository Metadata
```bash
# Set description
gh repo edit --description "Your description here"

# Add topic
gh repo edit --add-topic your-topic

# Set homepage
gh repo edit --homepage "https://your-website.com"
```

### Check Repository Status
```bash
# View repo info
gh repo view

# List releases
gh release list

# Check workflows
gh workflow list
```

---

## Support & Maintenance

### Regular Tasks

**Weekly:**
- [ ] Check for new issues
- [ ] Review pull requests
- [ ] Monitor Actions for failures
- [ ] Check Dependabot alerts

**Monthly:**
- [ ] Update dependencies
- [ ] Review download statistics
- [ ] Update documentation if needed
- [ ] Plan next release

**Per Release:**
- [ ] Update CHANGELOG.md
- [ ] Update version in package.json
- [ ] Run automated release script
- [ ] Announce on social media

---

## Contact & Links

- **Repository**: https://github.com/TheDemonTuan/all-agent-in-one
- **Issues**: https://github.com/TheDemonTuan/all-agent-in-one/issues
- **Releases**: https://github.com/TheDemonTuan/all-agent-in-one/releases
- **Actions**: https://github.com/TheDemonTuan/all-agent-in-one/actions
- **Security**: https://github.com/TheDemonTuan/all-agent-in-one/security

---

**Last Updated**: March 6, 2026
**Version**: 0.1.0
