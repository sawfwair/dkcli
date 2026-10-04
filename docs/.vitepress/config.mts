import { defineConfig } from 'vitepress'

function resolveBase(): string {
  const explicit = process.env.DOCS_BASE?.trim()
  if (explicit) return explicit.startsWith('/') ? explicit : `/${explicit}/`

  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]
  if (repository) return repository.endsWith('.github.io') ? '/' : `/${repository}/`

  return '/'
}

export default defineConfig({
  title: 'DesignKit CLI',
  description: 'CLI and package documentation for mathematical design artifacts.',
  base: resolveBase(),
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['README.md', 'SUMMARY.md'],
  head: [
    ['meta', { name: 'theme-color', content: '#fdf3ea' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'DesignKit CLI' }],
    ['meta', { property: 'og:description', content: 'Generate palettes, tokens, typography, motion, layout, and mathematical evidence.' }]
  ],
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },
  themeConfig: {
    siteTitle: 'DesignKit',
    logo: '/mark.svg',
    search: { provider: 'local' },
    nav: [
      { text: 'Get started', link: '/getting-started' },
      { text: 'CLI', link: '/cli/' },
      { text: 'Packages', link: '/packages/' },
      { text: 'Guides', link: '/guides/proof-driven-design' }
    ],
    sidebar: [
      {
        text: 'Orientation',
        items: [
          { text: 'Home', link: '/' },
          { text: 'Get started', link: '/getting-started' },
          { text: 'Repository architecture', link: '/architecture' }
        ]
      },
      {
        text: 'CLI commands',
        items: [
          { text: 'Command reference', link: '/cli/' },
          { text: 'Palette', link: '/cli/palette' },
          { text: 'Scale and typography', link: '/cli/scale-type' },
          { text: 'Motion and layout', link: '/cli/motion-layout' },
          { text: 'Audits and evidence', link: '/cli/audit-proof' },
          { text: 'DKCMS', link: '/cli/cms' }
        ]
      },
      {
        text: 'Packages',
        items: [
          { text: 'Package overview', link: '/packages/' },
          { text: '@dkcli/core', link: '/packages/core' },
          { text: '@dkcli/tokens', link: '/packages/tokens' },
          { text: '@dkcli/components', link: '/packages/components' }
        ]
      },
      {
        text: 'Guides',
        items: [
          { text: 'Design with mathematical evidence', link: '/guides/proof-driven-design' },
          { text: 'Build a theme', link: '/guides/build-a-theme' },
          { text: 'Theme projects', link: '/guides/theme-projects' },
          { text: 'Ship components', link: '/guides/ship-components' },
          { text: 'Release workflow', link: '/guides/release-workflow' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Archived architecture proposal', link: '/design-system-blueprint' },
          { text: 'Generated artifacts', link: '/reference/generated-proof' }
        ]
      }
    ],
    outline: { level: [2, 3] },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/sawfwair/dkcli' }
    ],
    editLink: {
      pattern: 'https://github.com/sawfwair/dkcli/edit/main/docs/:path',
      text: 'Edit this page'
    },
    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    },
    footer: {
      message: 'Licensed under the MIT License.',
      copyright: 'Copyright © DesignKit contributors'
    }
  }
})
