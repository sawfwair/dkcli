# Security policy

This policy describes how to report security issues in DesignKit.

## Supported versions

Security fixes target `main` and the published `@dkcli/*` package versions that
npm identifies as `latest`. Support for earlier minor versions depends on the
issue.

## Report a vulnerability

To report a sensitive issue, use the repository's private GitHub Security
Advisories. If private reporting is unavailable, open a public issue requesting
a contact method. Omit exploit details from the public issue.

For hardening requests without sensitive details, open a regular GitHub issue.

## Protect credentials

Exclude service tokens, `.env` files, `.npmrc` files, and generated credentials
from commits. Cloudflare deployment configuration and private files belong in
the sibling `../dkweb` workspace.

## Check dependencies and packages

Before a release, inspect dependency reports and verify the package artifacts:

```bash
pnpm audit --audit-level low
pnpm licenses list --prod
pnpm release:verify
```
