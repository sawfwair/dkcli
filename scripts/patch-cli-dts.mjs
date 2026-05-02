import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const declarationPath = path.resolve(here, '../dist/lib/dk/index.d.ts');

let source = readFileSync(declarationPath, 'utf8');

source = source.replace(/@dkcli\/core\/([a-z-]+)/g, './_core/$1.js');
source = source.replace(/@dkcli\/core(?=['"])/g, './_core/index.js');

writeFileSync(declarationPath, source);
