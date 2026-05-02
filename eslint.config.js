import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{ ignores: ['**/*.svelte'] },
	js.configs.recommended,
	...ts.configs.strictTypeChecked,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			'no-undef': 'off',
			'no-restricted-syntax': [
				'error',
				{
					selector: "CallExpression[callee.name='$effect']",
					message: 'Prefer derived state or explicit event handlers over $effect synchronization.'
				},
				{
					selector: "TSAsExpression > AwaitExpression > CallExpression[callee.property.name='json']",
					message: 'Parse JSON through a named boundary helper with a type guard instead of casting response.json().'
				}
			],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ prefer: 'type-imports', fixStyle: 'inline-type-imports' }
			],
			'@typescript-eslint/explicit-function-return-type': [
				'error',
				{
					allowExpressions: true,
					allowHigherOrderFunctions: true,
					allowTypedFunctionExpressions: true
				}
			],
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/restrict-template-expressions': [
				'error',
				{ allowNumber: true }
			],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		...ts.configs.disableTypeChecked,
		files: ['**/*.{js,mjs,cjs}']
	},
	{
		...ts.configs.disableTypeChecked,
		files: ['packages/**/*.ts', 'packages/**/*.mts', 'packages/**/*.cts'],
		rules: {
			...ts.configs.disableTypeChecked.rules,
			'@typescript-eslint/no-non-null-assertion': 'off'
		}
	},
	{
		files: ['**/*.{test,spec}.{ts,js}', '**/*.svelte.{test,spec}.{ts,js}'],
		rules: {
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off'
		}
	},
	{
		files: [
			'src/**/*.ts',
			'vitest.config.ts',
			'tsup.config.ts',
			'examples/svelte-starter/**/*.ts'
		],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		}
	}
);
