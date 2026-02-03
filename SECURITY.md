# Security Policy

## 🔴 CRITICAL SECURITY ADVISORY

### ⚠️ Cryptography Vulnerability in v1.3.x (Beta)

**AFFECTED VERSIONS:** v1.3.x Beta (unreleased)

**SEVERITY:** Critical

**STATUS:** v1.3 will **NEVER** be released as originally planned

#### Description

Version 1.3.x Beta contains critical cryptography vulnerabilities in the encryption implementation used by **Teapot and Teacup gateway** features. These vulnerabilities affect the confidentiality and integrity of encrypted data.

#### Immediate Action Required

**IF YOU ARE USING v1.3.x Beta with Teapot/Teacup Gateway:**

1. 🛑 **STOP using Teapot/Teacup gateway immediately**
2. 🔄 **Upgrade to v2.0.0 or later** (security fixes included)
3. 🔐 **Re-encrypt all sensitive data** using the new secure implementation
4. 🔍 **Review logs** for potential unauthorized access

#### What is Affected?

- ❌ **v1.3.x Beta** - Teapot/Teacup gateway encryption (CRITICAL)
- ⚠️ **v1.2.x Production** - No cryptography issues, but deprecated (see below)
- ✅ **v2.0.0+** - Fully patched with AES-256-GCM + HKDF

#### What is NOT Affected?

**v1.2.x Production users:** Your version does NOT have cryptography vulnerabilities. However, v1.2.x is deprecated due to architectural limitations and dependency issues (see Supported Versions below).

---

## Supported Versions

All our code is constantly reviewed by Snyk to provide better vulnerability response and tracking actions via Dependabot or team members.

| Version | Supported | Security Status | Notes |
| ------- | --------- | --------------- | ----- |
| 2.0.x   | ✅ Yes | 🟢 Secure | **Recommended** - Full security patches, strict TypeScript |
| 1.3.x Beta | ❌ No | 🔴 **CRITICAL** | **DO NOT USE** - Critical crypto vulnerabilities |
| 1.2.x   | ⚠️ Deprecated | 🟡 No crypto issues | Deprecated due to InversifyJS 6.x EOL & architecture |
| 1.0.x - 1.1.x | ❌ No | 🔴 Unsupported | No security updates, upgrade immediately |

### Version 1.2.x Deprecation Notice

**Production version v1.2.x does NOT have cryptography issues** but is officially **deprecated** as of January 27, 2026.

**Why is v1.2.x deprecated?**
- 📦 Depends on **InversifyJS v6.x** (now deprecated and unmaintained)
- 🏗️ Architectural limitations prevent modern feature support
- 🔧 Major package dependencies require breaking changes
- 🔒 Cannot receive future security patches without breaking changes
- ⚡ Performance and type safety improvements only in v2.0+

**Migration Path:**
- v1.2.x users should migrate to v2.0.0+ as soon as feasible
- See [MIGRATION_GUIDE_v2.md](MIGRATION_GUIDE_v2.md) for step-by-step instructions
- v1.2.x will receive NO updates after January 27, 2026

---

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability in Expressive Tea or have security concerns, please report it responsibly.

### How to Report

**For security vulnerabilities:**
- 📧 Email: [security@expressive-tea.io](mailto:security@expressive-tea.io)
- 🔒 Include: Affected versions, steps to reproduce, and potential impact
- ⏱️ Response time: We aim to respond within 48 hours

**For compliance issues:**
- 📧 Email: [compliance@expressive-tea.io](mailto:compliance@expressive-tea.io)

### What to Expect

1. **Acknowledgment** - We'll confirm receipt within 48 hours
2. **Investigation** - We'll investigate and validate the report
3. **Fix & Disclosure** - We'll develop a fix and coordinate disclosure
4. **Credit** - Security researchers will be credited (if desired)

### Security Best Practices

When using Expressive Tea v2.0+:

✅ **DO:**
- Keep dependencies up to date (`npm audit`, `yarn audit`)
- Use TypeScript strict mode for better type safety
- Follow the [OWASP Top 10](https://owasp.org/www-project-top-ten/) guidelines
- Validate and sanitize all user inputs
- Use environment variables for sensitive configuration
- Enable HTTPS in production
- Implement proper authentication and authorization

❌ **DON'T:**
- Use v1.3.x Beta (critical vulnerabilities)
- Store secrets in code or version control
- Disable security features without understanding the risk
- Trust user input without validation

### Additional Resources

- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Migration Guide](MIGRATION_GUIDE_v2.md) - Upgrading from v1.x to v2.0

---

**Need help?** Contact us at [support@expressive-tea.io](mailto:support@expressive-tea.io)
