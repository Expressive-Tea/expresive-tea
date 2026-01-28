# ⚠️ DEPRECATION NOTICE - EXPRESSIVE TEA v1.x

**Effective Date:** January 27, 2026  
**Affected Versions:** All versions < 2.0.0 (v1.x, v0.x, beta versions)  
**Status:** **END-OF-LIFE - NO LONGER SUPPORTED**

---

## 🚨 Critical Notice

**All versions of Expressive Tea before 2.0.0 are officially deprecated and will receive NO further support, updates, or security patches.**

If you are using any version before 2.0.0, you **must upgrade to v2.0.0 immediately**.

---

## 📋 Summary

| Item | v1.x (Deprecated) | v2.0.0 (Supported) |
|------|-------------------|-------------------|
| **Status** | ❌ Deprecated / End-of-Life | ✅ Supported |
| **Security Patches** | ❌ None | ✅ Ongoing |
| **Bug Fixes** | ❌ None | ✅ Ongoing |
| **New Features** | ❌ None | ✅ Ongoing |
| **Technical Support** | ❌ None | ✅ Full Support |
| **InversifyJS** | ❌ 6.x (Deprecated) | ✅ 7.x (Supported) |
| **Security Vulnerabilities** | ❌ Critical Issues | ✅ Fixed |

---

## 🔴 Why v1.x is Deprecated

### 1. InversifyJS 6.x Dependency (CRITICAL)

**Problem:**
- Expressive Tea v1.x depends on InversifyJS 6.x
- InversifyJS 6.x is now deprecated by its maintainers
- No security updates or bug fixes for InversifyJS 6.x
- InversifyJS 7.x has breaking changes incompatible with v1.x architecture

**Impact:**
- Cannot update dependency injection library
- Stuck on unmaintained dependencies
- Potential security vulnerabilities in dependencies

**Resolution in v2.0.0:**
- Upgraded to InversifyJS 7.x
- Modernized DI architecture
- Enhanced scoping (Singleton, Transient, Scoped)

---

### 2. Critical Security Vulnerabilities (CRITICAL)

**Problem:**
- v1.x uses broken AES-256-GCM cryptography implementation
- MD5 password hashing (cryptographically broken since 1996)
- Incorrect authentication tag handling
- Credential logging (sensitive data exposure)

**Impact:**
- Encrypted data is vulnerable to attacks
- Passwords can be cracked easily
- Authentication can be bypassed
- Credentials may be logged in plaintext

**Resolution in v2.0.0:**
- HKDF (RFC 5869) for secure key derivation
- PBKDF2 (100,000 iterations) for password hashing
- Proper AES-256-GCM authentication tag handling
- Removed all credential logging

⚠️ **These security issues cannot be fixed in v1.x without breaking changes.**

---

### 3. Architectural Limitations

**Problem:**
- v1.x architecture prevents security fixes
- Type system improvements require breaking changes
- Performance optimizations blocked by legacy code

**Impact:**
- Cannot fix security issues
- Cannot improve type safety
- Cannot optimize performance

**Resolution in v2.0.0:**
- Complete architectural refactoring
- TypeScript strict mode enabled
- Modern best practices applied

---

## 📅 Timeline

| Date | Event |
|------|-------|
| **January 27, 2026** | v2.0.0 Released |
| **January 27, 2026** | v1.x Deprecated (End-of-Life) |
| **January 27, 2026** | No more v1.x support, patches, or fixes |
| **February 2026** | v1.x documentation archived |
| **March 2026** | v1.x npm tags removed (use @deprecated tag) |

---

## ⚠️ What This Means for You

### If You're Using v1.x

**Immediate Risks:**
1. ❌ **Security Vulnerabilities** - Your application has critical security flaws
2. ❌ **No Patches** - Security issues will never be fixed
3. ❌ **No Support** - No help available for v1.x issues
4. ❌ **Deprecated Dependencies** - InversifyJS 6.x is unmaintained
5. ❌ **Compliance Issues** - May fail security audits

**Required Action:**
- **Upgrade to v2.0.0 immediately**
- See [MIGRATION_GUIDE_v2.md](MIGRATION_GUIDE_v2.md) for detailed instructions
- Plan migration within **30 days** maximum

---

### If You're Starting a New Project

**Do NOT use v1.x:**
- ❌ v1.x is deprecated
- ❌ v1.x has security vulnerabilities
- ❌ v1.x receives no support

**Use v2.0.0:**
- ✅ v2.0.0 is the current supported version
- ✅ v2.0.0 has security fixes
- ✅ v2.0.0 receives ongoing support

```bash
# DO NOT USE v1.x
npm install @zerooneit/expressive-tea@1.3.0  # ❌ DEPRECATED

# USE v2.0.0
npm install @zerooneit/expressive-tea@2.0.0  # ✅ SUPPORTED
# or
npm install @zerooneit/expressive-tea@latest # ✅ SUPPORTED
```

---

## 🚀 Migration Path

### Step 1: Assess Your Application

Check your current version:
```bash
npm list @zerooneit/expressive-tea
```

If output shows any version < 2.0.0, you must upgrade.

---

### Step 2: Read the Migration Guide

**Required Reading:**
- [MIGRATION_GUIDE_v2.md](MIGRATION_GUIDE_v2.md) - Complete upgrade guide
- [CHANGELOG.md](CHANGELOG.md) - Full list of changes
- [RELEASE_NOTES_v2.0.0.md](RELEASE_NOTES_v2.0.0.md) - Release details

---

### Step 3: Backup Your Data

**CRITICAL:** Backup all encrypted data before upgrading!

```bash
# Backup database
pg_dump mydb > backup_before_v2.sql

# Backup encrypted files
cp -r /path/to/encrypted /path/to/encrypted.backup
```

---

### Step 4: Migrate Encrypted Data

**v1.x encrypted data CANNOT be decrypted by v2.0.0** due to security fixes.

You must decrypt data with v1.x and re-encrypt with v2.0.0:

```bash
# Install both versions temporarily
npm install @zerooneit/expressive-tea@2.0.0
npm install expressive-tea-v1@npm:@zerooneit/expressive-tea@1.3.0-beta.6
```

Then run migration script (see MIGRATION_GUIDE_v2.md for complete script).

---

### Step 5: Update Dependencies

```bash
# Update to v2.0.0
npm install @zerooneit/expressive-tea@2.0.0

# Update peer dependencies
npm install express@^5.0.0
npm install typescript@^5.0.0
```

---

### Step 6: Fix TypeScript Errors

v2.0.0 enables strict mode. You may see compilation errors.

**Option 1: Disable strict mode temporarily**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false
  }
}
```

**Option 2: Fix errors (recommended)**
See MIGRATION_GUIDE_v2.md Section 5 for common fixes.

---

### Step 7: Test Thoroughly

```bash
# Run tests
npm test

# Run application
npm start

# Verify functionality
curl http://localhost:3000/health
```

---

## 📞 Support

### For v1.x Users (Migration Help Only)

We will provide **migration assistance only** for users upgrading from v1.x to v2.0.0:

- **Migration Questions:** Open GitHub issue with `migration` label
- **Migration Guide:** [MIGRATION_GUIDE_v2.md](MIGRATION_GUIDE_v2.md)
- **v1.x Bugs:** ❌ Will not be fixed - upgrade to v2.0.0
- **v1.x Security Issues:** ❌ Will not be patched - upgrade to v2.0.0

### For v2.0.0 Users (Full Support)

Full support available for v2.0.0:
- **GitHub Issues:** https://github.com/Expressive-Tea/expresive-tea/issues
- **Documentation:** https://zero-oneit.github.io/expresive-tea/
- **Security Issues:** security@zero-oneit.com

---

## 🔒 Security Notice

**If you are using v1.x in production, your application has critical security vulnerabilities:**

1. **Broken Cryptography** - Data encryption is vulnerable
2. **Weak Password Hashing** - MD5 can be cracked in seconds
3. **Credential Exposure** - May log sensitive data
4. **Deprecated Dependencies** - InversifyJS 6.x vulnerabilities

**These issues will NEVER be fixed in v1.x.**

**Upgrade to v2.0.0 immediately to secure your application.**

---

## ❓ FAQ

### Q: Will v1.x receive security patches?
**A:** ❌ No. v1.x is end-of-life. No patches will be released.

### Q: Can I continue using v1.x?
**A:** Technically yes, but **not recommended**. You will have critical security vulnerabilities and no support.

### Q: How long do I have to upgrade?
**A:** **Immediately.** v1.x is already deprecated. Every day you delay increases security risk.

### Q: Is there a migration tool?
**A:** No automated tool, but [MIGRATION_GUIDE_v2.md](MIGRATION_GUIDE_v2.md) provides step-by-step instructions and migration scripts.

### Q: Will my v1.x application break if I don't upgrade?
**A:** No, but:
- ❌ You have critical security vulnerabilities
- ❌ Dependencies may break (InversifyJS 6.x is deprecated)
- ❌ No support if issues arise
- ❌ May fail security compliance audits

### Q: Can I get an exception to the deprecation?
**A:** ❌ No. The deprecation is due to critical security issues and deprecated dependencies. Everyone must upgrade.

### Q: What if I can't upgrade right now?
**A:** You **must** upgrade. If you have specific blockers, open a GitHub issue with the `migration` label and we'll help with migration assistance only.

### Q: Are there any cases where v1.x is acceptable?
**A:** ❌ No. Never use v1.x for:
- Production applications
- Applications handling sensitive data
- Applications requiring security compliance
- New projects
- Any application that will be maintained

---

## 📊 Comparison

| Feature | v1.x (Deprecated) | v2.0.0 (Supported) |
|---------|-------------------|-------------------|
| **InversifyJS** | 6.x (Deprecated) | 7.x (Supported) |
| **Cryptography** | Broken (MD5 + broken AES) | Secure (PBKDF2 + HKDF) |
| **TypeScript** | Loose typing | Strict mode |
| **Test Coverage** | ~80% | 92.75% |
| **Security Patches** | ❌ None | ✅ Ongoing |
| **Bug Fixes** | ❌ None | ✅ Ongoing |
| **Support** | ❌ None | ✅ Full |
| **Node.js** | 6+ (EOL) | 18+ (LTS) |
| **Express** | 4.x | 5.x |
| **Bundle Size** | +540 KB | Native (0 KB extra) |
| **Performance** | Baseline | 3.5x faster |

---

## ✅ Conclusion

**Expressive Tea v1.x is deprecated and unsupported.**

**Action Required:**
1. ✅ Read [MIGRATION_GUIDE_v2.md](MIGRATION_GUIDE_v2.md)
2. ✅ Backup your data
3. ✅ Migrate to v2.0.0
4. ✅ Test thoroughly
5. ✅ Deploy v2.0.0

**Do not delay.** Every day on v1.x is a day with critical security vulnerabilities.

**Upgrade to v2.0.0 today!** 🚀

---

**Document Version:** 1.0  
**Last Updated:** January 27, 2026  
**Status:** Official Deprecation Notice  
**Contact:** support@zero-oneit.com (migration help only)
