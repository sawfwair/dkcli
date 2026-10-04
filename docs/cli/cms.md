# DKCMS

For DKCMS users, `dk cms` provides commands for authentication, sites, pages, builds, and email exports. These commands contact a hosted service.

## Publish a page

To authenticate with the configured service, run:

```bash
dk cms login
```

To inspect available sites, run:

```bash
dk cms sites list
```

To create or update a page from the `campaign.json` file, build it, and publish it, run:

```bash
dk cms pages submit SITE_ID --slug release-announcement \
    --file campaign.json --publish
```

Replace *`SITE_ID`* with the site ID or slug returned by the site list.

## Export an email build

To export a build as HTML, run:

```bash
dk cms pages export-email --build BUILD_ID --format html
```

Replace *`BUILD_ID`* with the build identifier returned by DKCMS.

## Service boundary

Hosted-service state stays in CLI and service adapters. It is separate from the deterministic design functions in `src/lib/dk` and `@dkcli/core`.
