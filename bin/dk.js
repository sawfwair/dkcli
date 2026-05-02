#!/usr/bin/env node

import { runCli } from '../src/lib/dk/cli.ts';

process.exitCode = await runCli(process.argv.slice(2));
