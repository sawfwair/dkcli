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
  description: 'Proof-driven design tooling for palettes, scales, typography, motion, layout, and component systems.',
  base: resolveBase(),
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ['README.md', 'SUMMARY.md'],
  head: [
    ['meta', { name: 'theme-color', content: '#fdf3ea' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'DesignKit CLI' }],
    ['meta', { property: 'og:description', content: 'A mathematical design workbench for proofable interface systems.' }]
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
      { text: 'Start', link: '/getting-started' },
      { text: 'CLI', link: '/cli/' },
      { text: 'Packages', link: '/packages/' },
      { text: 'Guides', link: '/guides/proof-driven-design' }
    ],
    sidebar: [
      {
        text: 'Orientation',
        items: [
          { text: 'Home', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Repository Tour', link: '/architecture' }
        ]
      },
      {
        text: 'CLI Workbench',
        items: [
          { text: 'Command Map', link: '/cli/' },
          { text: 'Palette', link: '/cli/palette' },
          { text: 'Scale & Type', link: '/cli/scale-type' },
          { text: 'Motion & Layout', link: '/cli/motion-layout' },
          { text: 'Audit & Proofs', link: '/cli/audit-proof' },
          { text: 'DKCMS', link: '/cli/cms' }
        ]
      },
      {
        text: 'Packages',
        items: [
          { text: 'Package Overview', link: '/packages/' },
          { text: '@dkcli/core', link: '/packages/core' },
          { text: '@dkcli/tokens', link: '/packages/tokens' },
          { text: '@dkcli/components', link: '/packages/components' }
        ]
      },
      {
        text: 'Guides',
        items: [
          { text: 'Proof-Driven Design', link: '/guides/proof-driven-design' },
          { text: 'Build A Theme', link: '/guides/build-a-theme' },
          { text: 'Ship Components', link: '/guides/ship-components' },
          { text: 'Release Workflow', link: '/guides/release-workflow' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Architecture Blueprint', link: '/design-system-blueprint' },
          { text: 'Generated Proof', link: '/reference/generated-proof' }
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
      prev: 'Previous proof',
      next: 'Next proof'
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © DesignKit contributors'
    }
  }
})
