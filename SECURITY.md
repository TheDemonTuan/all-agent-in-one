# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take the security of TDT Space seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: [your-email@example.com]

Or create a draft security advisory on GitHub:
1. Go to the [Security tab](https://github.com/TheDemonTuan/all-agent-in-one/security)
2. Click "Report a vulnerability"
3. Provide detailed information

### What to Include

Please include the following information in your report:

- **Type of issue**: e.g. buffer overflow, SQL injection, cross-site scripting, etc.
- **Full paths of source file(s) related to the issue**
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Any special configuration required to reproduce the issue**
- **Step-by-step instructions to reproduce the issue**
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue**, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Resolution**: Depends on severity and complexity

### Process

1. **Report**: Submit vulnerability report
2. **Confirm**: We'll confirm receipt and assess the issue
3. **Investigate**: We'll investigate and determine severity
4. **Fix**: We'll develop and test a fix
5. **Release**: We'll publish a security advisory and release
6. **Disclose**: After 30 days, details may be publicly disclosed

### Security Best Practices for Users

To ensure secure usage of TDT Space:

1. **Keep Updated**: Always use the latest version
2. **Verify Downloads**: Check file hashes when downloading
3. **Trusted Sources**: Only install agents from trusted sources
4. **Review Commands**: Review AI-generated commands before execution
5. **Secure Workspace**: Don't share workspace files with sensitive data

### Security Measures in TDT Space

- **Content Security Policy (CSP)**: Restricts resource loading
- **Context Isolation**: Electron preload script isolation
- **Node Integration**: Disabled in renderer process
- **Input Validation**: All user inputs are validated
- **Dependency Scanning**: Regular security audits of dependencies

### Known Security Limitations

- Terminal emulation requires elevated privileges for PTY spawning
- Third-party AI agents may have their own security implications
- Workspace files are stored in plaintext (don't store sensitive data)

## Bug Bounty Program

Currently, we do not have a bug bounty program. However, we deeply appreciate responsible disclosure and will acknowledge your contribution (unless you prefer to remain anonymous).

## Contact

For any security-related questions:
- Email: [your-email@example.com]
- GitHub Security Advisories: [Link](https://github.com/TheDemonTuan/all-agent-in-one/security/advisories)

---

**Thank you for helping keep TDT Space and our users safe! 🔒**
