# Production Checklist for TDT Space

## Pre-Release Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console.log() in production code
- [ ] Code formatted with Prettier
- [ ] Linting passes without errors
- [ ] Type checking passes

### Testing
- [ ] Core features tested manually
- [ ] All terminal layouts tested (1x1, 2x1, 2x2, 3x2, 4x4)
- [ ] Workspace creation/deletion tested
- [ ] Agent allocation tested
- [ ] Terminal search tested
- [ ] Command history tested
- [ ] Settings persistence tested

### Build
- [ ] Production build succeeds
- [ ] ZIP file created successfully
- [ ] File size is reasonable (< 200MB)
- [ ] Application runs from ZIP
- [ ] No missing dependencies

### Documentation
- [ ] README.md is up to date
- [ ] CHANGELOG.md updated with version
- [ ] Version numbers updated in package.json
- [ ] Screenshots added to README (if UI changed)
- [ ] Installation guide tested

### GitHub
- [ ] Git tag created and pushed
- [ ] Release notes written
- [ ] ZIP file attached to release
- [ ] Release published (not draft)
- [ ] GitHub Actions workflows passing

### Security
- [ ] No sensitive data in code
- [ ] No hardcoded API keys or secrets
- [ ] Dependencies up to date
- [ ] No security vulnerabilities (run `bun audit`)

### Performance
- [ ] App launch time < 5 seconds
- [ ] Terminal rendering smooth
- [ ] No memory leaks (test with multiple workspaces)
- [ ] Build size optimized

## Post-Release Checklist

### Communication
- [ ] Announce release on social media
- [ ] Update project website (if exists)
- [ ] Notify team members
- [ ] Share in relevant communities

### Monitoring
- [ ] Monitor GitHub Issues
- [ ] Watch for crash reports
- [ ] Track download counts
- [ ] Respond to user feedback

### Follow-up
- [ ] Document known issues
- [ ] Plan bugfix release if needed
- [ ] Update roadmap
- [ ] Gather feature requests for next version

## Automated Checks (GitHub Actions)

The following automated checks run on every push:

1. **Build Workflow** (.github/workflows/build.yml)
   - Type checking
   - Build verification
   - Artifact upload

2. **Code Quality** (.github/workflows/code-quality.yml)
   - Linting
   - Type check
   - Build test

3. **Release Workflow** (.github/workflows/auto-release.yml)
   - Triggered on tag push
   - Builds application
   - Creates GitHub Release
   - Uploads ZIP asset

## Manual Testing Checklist

### Core Features
- [ ] Create new workspace
- [ ] Switch between workspaces
- [ ] Delete workspace
- [ ] Change terminal layout
- [ ] Allocate agents to panes
- [ ] Search in terminal
- [ ] View command history
- [ ] Save custom templates
- [ ] Load templates
- [ ] Settings persistence

### Edge Cases
- [ ] App with no workspaces
- [ ] Very long command output
- [ ] Multiple monitors
- [ ] Different screen resolutions
- [ ] Minimize/restore behavior
- [ ] Close app with multiple workspaces open

## Release Commands

### Using Automated Script
```powershell
# Full release automation
.\scripts\release.ps1 -Version 0.1.0
```

### Manual Release
```bash
# 1. Build
bun run electron:build

# 2. Create ZIP
powershell -ExecutionPolicy Bypass -File scripts\create-zip.ps1

# 3. Create tag
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# 4. Create release
gh release create v0.1.0 \
  --title "TDT Space v0.1.0" \
  --generate-notes \
  TDT-Space-v0.1.0-win.zip
```

## Version Numbering

Follow Semantic Versioning: MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes (e.g., 1.0.0, 2.0.0)
- **MINOR**: New features, backward compatible (e.g., 0.2.0, 0.3.0)
- **PATCH**: Bug fixes (e.g., 0.1.1, 0.1.2)

Examples:
- `v0.1.0` - Initial release
- `v0.1.1` - Bug fixes
- `v0.2.0` - New features
- `v1.0.0` - Stable release

## Support Contacts

- **GitHub**: https://github.com/TheDemonTuan/all-agent-in-one
- **Issues**: https://github.com/TheDemonTuan/all-agent-in-one/issues
- **Discussions**: https://github.com/TheDemonTuan/all-agent-in-one/discussions

---

**Last Updated**: March 6, 2026
**Version**: 0.1.0
