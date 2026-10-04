import { createTheme, emitThemeCss } from '@dkcli/tokens';
import { readTheme } from '$lib/model.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ cookies }) {
  const config = readTheme(cookies.get('desk-theme'));
  const theme = createTheme(config);
  return { config, theme, themeCss: emitThemeCss(theme) };
}
