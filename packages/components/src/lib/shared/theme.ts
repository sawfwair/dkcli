import { createTheme } from '@dkcli/tokens';

export const DEFAULT_COMPONENT_THEME = createTheme({
  name: 'dk-component-default',
  seed: {
    color: '#295dff',
    ratio: 'perfect-fourth',
    mode: 'light',
    density: 'comfortable',
    motion: 'snappy'
  }
});
