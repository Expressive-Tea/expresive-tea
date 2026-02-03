# 📦 Package Renamed: Expressive Tea is now `@expressive-tea/core`

## Quick Migration

**Update your `package.json`:**

```diff
{
  "dependencies": {
-   "@zerooneit/expressive-tea": "^1.2.0"
+   "@expressive-tea/core": "^2.0.0"
  }
}
```

Then reinstall:
```bash
npm install
# or
yarn install
```

**That's it!** Your code doesn't need to change - all imports work exactly the same.

---

## Why the Rename?

### Better Organization
- **New namespace:** `@expressive-tea/*` allows for a family of packages
- **Future packages:** `@expressive-tea/auth`, `@expressive-tea/database`, etc.
- **Clear identity:** Makes the project more discoverable and professional

### Community Ownership
- Moved from personal namespace (`@zerooneit`) to community namespace
- Better reflects the open-source nature of the project
- Easier for contributors to find and engage with the project

### Repository Move
- **New URL:** https://github.com/Expressive-Tea/expresive-tea
- **Old URL:** https://github.com/Zero-OneiT/expresive-tea (redirects)

---

## Legacy Support Timeline

| Package | Status | Support Until | Notes |
|---------|--------|---------------|-------|
| `@zerooneit/expressive-tea` | 🟡 **Maintenance Mode** | **April 30, 2026** | Security patches ONLY, no new features |
| `@expressive-tea/core` | ✅ **Active Development** | Ongoing | All new features, active support |

### What "Maintenance Mode" Means

For `@zerooneit/expressive-tea` (until April 30, 2026):
- ✅ Critical security patches will be backported
- ✅ Package remains installable
- ❌ No new features
- ❌ No bug fixes (unless security-related)
- ❌ No technical support
- ❌ No documentation updates

**After April 30, 2026:** The package will be marked as deprecated on npm and no further updates will be published.

---

## Migration Guide

### For New Projects

**Just use the new package:**
```bash
npm install @expressive-tea/core
```

```typescript
import { Boot, Route, Get } from '@expressive-tea/core';
```

### For Existing v1.x Projects

**Step 1:** Update `package.json`
```diff
{
  "dependencies": {
-   "@zerooneit/expressive-tea": "^1.2.0"
+   "@expressive-tea/core": "^2.0.0"
  }
}
```

**Step 2:** Reinstall dependencies
```bash
npm install
```

**Step 3:** Review breaking changes

v2.0.0 has breaking changes beyond the package rename. See the [full migration guide](docs/MIGRATION_GUIDE_v2.md) for:
- Cryptography changes (CRITICAL if you use encryption)
- TypeScript strict mode
- Node.js 20+ requirement
- Express 5.x upgrade

### For Plugin Developers

Update your plugin's `peerDependencies`:

```diff
{
  "peerDependencies": {
-   "@zerooneit/expressive-tea": "^1.2.0"
+   "@expressive-tea/core": "^2.0.0"
  }
}
```

---

## No Code Changes Required!

The package rename **does not affect your code**. All exports remain identical:

```typescript
// These all work exactly the same in both packages:
import { Boot } from '@expressive-tea/core';
import { Route, Get, Post } from '@expressive-tea/core';
import { ServerSettings } from '@expressive-tea/core';
import { Modules } from '@expressive-tea/core';
// etc.
```

---

## FAQ

### Q: Why rename now?

**A:** v2.0.0 is a major release with breaking changes anyway. This is the ideal time to also fix the package namespace.

### Q: What happens if I don't migrate?

**A:** 
- You can continue using `@zerooneit/expressive-tea` until April 30, 2026
- You'll receive security patches for critical vulnerabilities
- You won't get new features or bug fixes
- After April 30, 2026, the package will be fully deprecated

### Q: Will my old projects break?

**A:** No! Projects using `@zerooneit/expressive-tea` will continue to work. The package remains on npm and will receive security patches until April 30, 2026.

### Q: Can I use both packages?

**A:** Not recommended. Choose one:
- Use `@expressive-tea/core` for new features and active support
- Use `@zerooneit/expressive-tea` only if you can't upgrade yet

### Q: What about version numbers?

**A:** Both packages share version 2.0.0:
- `@zerooneit/expressive-tea@2.0.0` - Maintenance mode
- `@expressive-tea/core@2.0.0` - Active development

All future releases will only be published to `@expressive-tea/core`.

### Q: How do I know which package I'm using?

**A:** Check your `package.json` dependencies. Or run:
```bash
npm list | grep expressive-tea
```

---

## Support

- 📚 **Documentation:** https://zero-oneit.github.io/expresive-tea/
- 🐛 **Issues:** https://github.com/Expressive-Tea/expresive-tea/issues
- 💬 **Discussions:** https://github.com/Expressive-Tea/expresive-tea/discussions
- 📧 **Security:** security@expressive-tea.io (or see [SECURITY.md](SECURITY.md))

---

## Thank You! 🙏

Thank you for using Expressive Tea! We believe this rename will help the project grow and better serve the community. The migration is simple, and we're here to help if you have any questions.

**Happy brewing! 🍵**

---

*Last updated: January 28, 2026*
