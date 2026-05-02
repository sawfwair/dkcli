#!/usr/bin/env node

import { runCli } from '../lib/dk/cli.ts';

void runCli(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
});
