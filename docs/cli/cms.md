# DKCMS

`dk cms` is the public client for the hosted DKCMS service. It manages authentication, sites, pages, builds, and email exports.

## Common Flow

```bash
dk cms login
dk cms sites list
dk cms pages create --site spring-launch --slug launch-01 --file campaign.json
dk cms pages publish --site spring-launch --page launch-01
dk cms pages export-email --build <build-id> --format html
```

## Boundaries

The CMS command group is intentionally separate from the deterministic design math in `src/lib/dk`. Hosted-service state belongs at the CLI/service boundary so core package consumers can keep pure, repeatable behavior.
