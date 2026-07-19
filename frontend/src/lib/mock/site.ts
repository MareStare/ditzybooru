/**
 * Static site configuration used to render the header navigation and footer.
 * Mirrors the structure Philomena hard-codes in its layout templates.
 */

interface NavLink {
  label: string;
  href: string;
}

export interface NavItem extends NavLink {
  /** Dropdown entries revealed on hover/focus. */
  children?: Array<NavLink>;
  /** A live counter rendered next to the label (e.g. live channel count). */
  counter?: number;
}

export const primaryNav: Array<NavItem> = [
  { label: 'Images', href: '/images', children: [{ label: 'Random', href: '/images/random' }] },
  { label: 'Activity', href: '/activity', children: [{ label: 'Comments', href: '/comments' }] },
  {
    label: 'Forums',
    href: '/forums',
    children: [
      { label: 'Art Chat', href: '/forums/art' },
      { label: 'General Discussion', href: '/forums/dis' },
      { label: 'Roleplaying', href: '/forums/rp' },
      { label: 'Shows and Movies', href: '/forums/pony' },
      { label: 'Site and Policy', href: '/forums/meta' },
      { label: 'Post Search', href: '/posts' },
    ],
  },
  { label: 'Tags', href: '/tags', children: [{ label: 'Tag Changes', href: '/tag_changes' }] },
  { label: 'Galleries', href: '/galleries' },
  { label: 'Commissions', href: '/commissions' },
];

interface FooterColumn {
  title: string;
  links: Array<NavLink & { bold?: boolean; external?: boolean }>;
}

export const footerColumns: Array<FooterColumn> = [
  {
    title: 'Site Resources',
    links: [
      { label: 'Site Rules', href: '/rules', bold: true },
      { label: 'Privacy Policy', href: '/pages/privacy', bold: true },
      { label: 'Tag Guidelines', href: '/pages/tags', bold: true },
      { label: 'About Uploading', href: '/pages/uploading' },
      { label: 'Spoiler Guidelines', href: '/pages/spoilers' },
      { label: 'Takedown Requests', href: '/pages/takedowns' },
      { label: 'Do-Not-Post List', href: '/dnp' },
    ],
  },
  {
    title: 'Help & Information',
    links: [
      {
        label: 'Changelog',
        href: 'https://github.com/philomena-dev/philomena/commits/master',
        bold: true,
        external: true,
      },
      { label: 'FAQs', href: '/pages/faq', bold: true },
      { label: 'API Docs', href: '/pages/api' },
      { label: 'Keyboard Shortcuts', href: '/pages/shortcuts' },
      { label: 'Advertising', href: '/pages/advertising' },
      { label: 'Onion Service', href: '/pages/onion' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Contact', href: '/pages/contact', bold: true },
      { label: 'Donations', href: '/pages/donations', bold: true },
      { label: 'Site Staff List', href: '/staff' },
      { label: 'Statistics', href: '/pages/stats' },
      { label: 'About', href: '/pages/about' },
    ],
  },
];

/** Search sort options offered on Philomena. */
export const searchSorts = {
  wilsonScore: { sf: 'wilson_score', sd: 'desc' },
  score: { sf: 'score', sd: 'desc' },
  commentCount: { sf: 'comment_count', sd: 'desc' },
} as const;
