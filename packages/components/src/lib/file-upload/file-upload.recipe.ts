import type { CompiledComponentCase, CompiledComponentRecipe, ThemeContract } from '@dkcli/core';

import { createComponentRegistration, type ComponentRegistration } from '../contracts.js';
import { getCompiledCase, serializeCompiledSlotStyles } from '../shared/recipe.js';
import { DEFAULT_COMPONENT_THEME } from '../shared/theme.js';
import { fileUploadSpec, type FileUploadSize } from './file-upload.spec.js';

export type FileUploadCaseAxes = {
  size: FileUploadSize;
};

export const DEFAULT_FILE_UPLOAD_THEME = DEFAULT_COMPONENT_THEME;

export function createFileUploadRegistration(
  theme: ThemeContract = DEFAULT_FILE_UPLOAD_THEME
): ComponentRegistration {
  return createComponentRegistration({
    spec: fileUploadSpec,
    theme
  });
}

export function getFileUploadRecipeCase(
  recipe: CompiledComponentRecipe,
  axes: FileUploadCaseAxes
): CompiledComponentCase {
  return getCompiledCase(recipe, axes, 'FileUpload');
}

export function serializeFileUploadSlotStyles(compiledCase: CompiledComponentCase): Record<string, string> {
  return serializeCompiledSlotStyles(compiledCase);
}

export const FILE_UPLOAD_CASE_KEYS = Object.keys(
  createFileUploadRegistration(DEFAULT_FILE_UPLOAD_THEME).recipe.cases
);
