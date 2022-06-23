module.exports = {
  title: 'Sociably | Sociable App Framework',
  tagline: 'Build Sociable App on All Social Platforms',
  url: 'https://sociably.js.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'machinat',
  projectName: 'sociably',
  deploymentBranch: 'gh-page',
  themeConfig: {
    image: 'img/sociably-og.png',
    navbar: {
      logo: {
        alt: 'My Site Logo',
        src: 'img/nav-logo.svg',
        srcDark: 'img/nav-logo-dark.svg',
      },
      items: [
        {
          label: 'Docs',
          to: 'docs/',
          activeBaseRegex: 'docs/(?:(?!learn).)',
          position: 'right',
        },
        {
          label: 'Learn',
          to: 'docs/learn/',
          activeBasePath: 'docs/learn',
          position: 'right',
        },
        {
          label: 'Blog',
          to: 'blog',
          position: 'right',
        },
        {
          label: 'API',
          href: 'pathname:///api',
          position: 'right',
        },
        {
          href: 'https://github.com/machinat/sociably',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/sociably',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/Sociablyjs',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: 'blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/machinat/sociably',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Machinat LLC`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/machinat/sociably/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/machinat/sociably/edit/master/website/blog/',
          path: './blog',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        googleAnalytics: {
          trackingID: 'G-9NF8CTC8SH',
          anonymizeIP: true,
        },
      },
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'blog-zh_tw',
        routeBasePath: 'blog/zh-tw',
        path: './blog-zh_tw',
      },
    ],
  ],
};
