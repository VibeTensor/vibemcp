import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'VibeMCP',
  description: 'Token-Optimized Unified MCP Server for Gmail & Microsoft 365',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  ],

  themeConfig: {
    logo: '/vmcp_icon.svg',

    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Reference', link: '/reference/tools' },
      { text: 'Ecosystem', link: '/ecosystem/' },
      { text: 'Changelog', link: '/changelog' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is VibeMCP?', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'TOON Format', link: '/guide/toon-format' },
            { text: 'Multi-Account Auth', link: '/guide/multi-account' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Tools', link: '/reference/tools' },
            { text: 'CLI', link: '/reference/cli' },
            { text: 'Configuration', link: '/reference/configuration' },
            { text: 'Output Format', link: '/reference/output-format' },
          ],
        },
      ],
      '/ecosystem/': [
        {
          text: 'Ecosystem',
          items: [
            { text: 'Overview', link: '/ecosystem/' },
            { text: 'Integrations', link: '/ecosystem/integrations' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/nicktensor/vibemcp' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@vibetensor/vibemcp' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the PolyForm Noncommercial License.',
      copyright: 'Copyright 2026 VibeTensor',
    },
  },
})
