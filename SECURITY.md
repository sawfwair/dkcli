# Security Policy

## Supported Versions

Security fixes target the latest `main` branch and the latest published npm versions of the `@dkcli/*` packages. Older minor versions are handled on a best-effort basis.

## Reporting A Vulnerability

Please report sensitive issues privately through GitHub Security Advisories for this repository. If that is unavailable, open a minimal public issue asking for a private contact path and do not include exploit details.

For non-sensitive hardening requests, use a regular GitHub issue.

## Secrets

Do not commit service tokens, `.env` files, `.npmrc` files, or generated package credentials. Cloudflare deployment config and private overlays belong in the sibling `../dkweb` workspace, not in this public CLI repo.

## Local Checks

Useful checks before release:

```bash
pnpm audit --audit-level low
pnpm licenses list --prod
pnpm release:verify
```
