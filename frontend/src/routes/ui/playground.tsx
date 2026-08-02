import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowUp, Clock, Dices, EyeOff, Image as ImageIcon, Search } from 'lucide-react';

import { AppearanceKnobs } from '#/components/layout/AppearanceKnobs';
import { Badge } from '#/components/ui/Badge';
import { Button, ButtonGroup } from '#/components/ui/Button';
import { Menu, MenuButton, MenuLabel, MenuSeparator } from '#/components/ui/Menu';
import { Panel, PanelBody, PanelFooter, PanelHeader, PanelList, PanelTab, PanelTabs } from '#/components/ui/Panel';
import { MediaGrid } from '#/components/home/MediaGrid';
import { useKnobs } from '#/hooks/useKnobs';
import { hiddenImages, images, randomImages, topAllTime, totalImages } from '#/lib/mock/data';
import type { Knobs } from '#/lib/knobs';

export const Route = createFileRoute('/ui/playground')({ component: UiPlayground });

const TAG_CATEGORIES = [
  { modifier: '', label: 'safe', count: '2.1M' },
  { modifier: 'tag--rating', label: 'suggestive', count: '412k' },
  { modifier: 'tag--spoiler', label: 'spoiler:s09', count: '8.3k' },
  { modifier: 'tag--origin', label: 'screencap', count: '96k' },
  { modifier: 'tag--oc', label: 'oc:littlepip', count: '3.4k' },
  { modifier: 'tag--error', label: 'duplicate', count: '221' },
  { modifier: 'tag--character', label: 'twilight sparkle', count: '188k' },
  { modifier: 'tag--content-official', label: 'official comic', count: '1.2k' },
  { modifier: 'tag--content-fanmade', label: 'fan art', count: '740k' },
  { modifier: 'tag--species', label: 'pegasus', count: '311k' },
  { modifier: 'tag--body-type', label: 'anthro', count: '54k' },
] as const;

/** Tokens worth eyeballing side by side when a knob or theme changes. */
const INSPECTED_TOKENS = [
  '--surface-page',
  '--surface',
  '--surface-sunken',
  '--surface-hover',
  '--surface-selected',
  '--surface-nav',
  '--surface-nav-field',
  '--surface-nav-sub',
  '--surface-panel-header',
  '--surface-panel-header-sub',
  '--surface-media',
  '--text-color',
  '--text-muted',
  '--text-subtle',
  '--text-disabled',
  '--link',
  '--link-hover',
  '--link-on-panel-header',
  '--border-color',
  '--border-color-subtle',
  '--border-color-strong',
  '--brand',
  '--success',
  '--danger',
  '--warning',
  '--fave',
  '--vote-up',
  '--vote-down',
  '--unread',
];

function UiPlayground() {
  // Only to re-read the token inspector when a knob moves; the sliders
  // themselves are `AppearanceKnobs`, shared with the header's menu.
  const knobs = useKnobs();

  return (
    <div className="pg">
      {/* Both rails scroll independently, so both need a name (two unlabelled
          complementary landmarks are indistinguishable) and a tab stop (a
          scroll container is unreachable by keyboard without one). */}
      <aside className="pg-rail" aria-label="Design tokens knobs" tabIndex={0}>
        <div>
          <h1 className="pg-title">UI playground</h1>
          <p className="pg-note">
            The same controls the appearance menu in the header offers, on the same stored settings — each one writes a
            single custom property on <code>:root</code>, so the chrome around this page re-styles with the specimens.
          </p>
        </div>

        <AppearanceKnobs />

        <p className="pg-note">
          Try <code>Corners: Square</code> with <code>Outlines: Hairline</code> for the classic Derpibooru look, or{' '}
          <code>Outlines: None</code> to watch panels switch to depth-based separation via a container style query.
        </p>
      </aside>

      <TokenInspector knobs={knobs} />

      {/* A plain `div`: the page already renders inside the app shell's `main`. */}
      <div className="pg-main">
        {/* Order is layout, not taxonomy. `grid-auto-flow: dense` backfills
            gaps, but only with cards that come later in the DOM, so the
            two-column cards sit among the one-column ones that can fill in
            around them rather than all at the end. */}
        <PanelSpecimen />
        <ButtonSpecimen />
        <TagSpecimen />
        <MediaGridSpecimen />
        <FormSpecimen />
        <FeedbackSpecimen />
        <TableSpecimen />
        <MenuSpecimen />
        <TypographySpecimen />
      </div>
    </div>
  );
}

/**
 * One specimen card. `wide` takes two grid columns, for specimens that cannot be
 * read honestly at a third of the width; `full` takes every column, for page
 * chrome that is misrepresented at anything narrower.
 */
function Section({
  title,
  size = 'normal',
  children,
}: {
  title: string;
  size?: 'normal' | 'wide' | 'full';
  children: React.ReactNode;
}) {
  const className = size === 'full' ? 'pg-card pg-card--full' : size === 'wide' ? 'pg-card pg-card--wide' : 'pg-card';

  return (
    <section className={className}>
      <h2 className="pg-card-head">{title}</h2>
      <div className="pg-card-body">{children}</div>
    </section>
  );
}

const PANEL_TABS = [
  { id: 'recent', label: 'Recent' },
  { id: 'top', label: 'Top' },
  { id: 'random', label: 'Random' },
];

function PanelSpecimen() {
  const [tab, setTab] = useState('recent');

  return (
    <Section title="Panels">
      <div className="pg-grid">
        <Panel>
          <PanelTabs label="Panel tab demo">
            {PANEL_TABS.map(t => (
              <PanelTab
                key={t.id}
                id={`pg-tab-${t.id}`}
                controls="pg-tabpanel"
                selected={tab === t.id}
                onSelect={() => {
                  setTab(t.id);
                }}
              >
                <ImageIcon size={14} />
                {t.label}
              </PanelTab>
            ))}
          </PanelTabs>
          <PanelBody id="pg-tabpanel" role="tabpanel" aria-labelledby={`pg-tab-${tab}`}>
            Tab bodies share the panel surface, so the selected tab reads as continuous with the content below it.
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader center>
            <a href="#forums">Forum activity</a>
          </PanelHeader>
          <PanelBody flush>
            <PanelList>
              {['Site rules discussion', 'Tag cleanup thread', 'Art critique corner'].map(item => (
                <li key={item}>
                  <a href="#thread">{item}</a>
                  <div className="pg-note">12 replies · 3 hours ago</div>
                </li>
              ))}
            </PanelList>
          </PanelBody>
          <PanelFooter href="#all">View all threads</PanelFooter>
        </Panel>

        <Panel>
          <PanelHeader>Statistics</PanelHeader>
          <PanelHeader sub>Last 24 hours</PanelHeader>
          <PanelBody>
            <p>A sub-header carries a lighter tint so nested sections do not compete with the panel title.</p>
            <p className="pg-note">Uploads 1,204 · Comments 8,930 · Faves 22,145</p>
          </PanelBody>
        </Panel>
      </div>
    </Section>
  );
}

function ButtonSpecimen() {
  return (
    <Section title="Buttons">
      <div className="pg-row">
        <Button>Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="success">Success</Button>
        <Button variant="warning">Warning</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="pg-row">
        <Button size="sm">Small</Button>
        <Button>Medium</Button>
        <Button size="lg">Large</Button>
        <Button icon aria-label="Search">
          <Search size={14} />
        </Button>
        <ButtonGroup>
          <Button>Newest</Button>
          <Button>Score</Button>
          <Button>Wilson</Button>
        </ButtonGroup>
      </div>
      <p className="pg-note">
        Each variant sets one variable (<code>--btn-seed</code>); border, hover and active states derive from it.
      </p>
    </Section>
  );
}

function TagSpecimen() {
  return (
    <Section title="Tags">
      <ul className="tag-list">
        {TAG_CATEGORIES.map(t => (
          <li key={t.label}>
            <a className={`tag ${t.modifier}`} href="#tag">
              {t.label}
              <span className="tag-count">{t.count}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="pg-note">
        Category colors are identical in every Derpibooru theme, so they live in the shared palette rather than in each
        theme file. Background and border derive from the one category color via <code>color-mix()</code>.
      </p>
    </Section>
  );
}

/**
 * The home page's gallery, rendered by the component the home page renders.
 *
 * It carries the media boxes, the tab strip and the pagination controls at once,
 * which is why none of those has a specimen of its own: a hand-built copy of any
 * of them would be a thing that looks like the site rather than a thing that is
 * the site, and would drift the first time the real one changed.
 */
function MediaGridSpecimen() {
  // A page of four, not the home page's full page: this is one card among a
  // dozen, and a specimen that scrolls for a screen and a half stops being a
  // specimen. The totals stay real so the pagination has something to count.
  return (
    <Section title="Media grid" size="full">
      <MediaGrid
        tabs={[
          { query: '*', label: 'Recent', icon: <Clock size={16} />, images: images.slice(0, 4), total: totalImages },
          {
            query: '*',
            label: 'Top (all time)',
            icon: <ArrowUp size={16} />,
            images: topAllTime.slice(0, 4),
            total: totalImages,
          },
          {
            query: '*',
            label: 'Random',
            icon: <Dices size={16} />,
            images: randomImages.slice(0, 4),
            total: totalImages,
          },
          {
            query: 'my:hidden',
            label: 'Hidden',
            icon: <EyeOff size={16} />,
            images: hiddenImages.slice(0, 4),
            total: hiddenImages.length,
          },
        ]}
      />
    </Section>
  );
}

function FormSpecimen() {
  return (
    <Section title="Forms">
      <div className="pg-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="pg-title">
            Image title
          </label>
          <input className="field" id="pg-title" placeholder="Describe the upload" />
          <span className="field-hint">Shown above the image on its page.</span>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="pg-email">
            Email (invalid on blur)
          </label>
          <input className="field" id="pg-email" type="email" required placeholder="you@example.com" />
          <span className="field-hint">
            Uses <code>:user-invalid</code>, so it only flags after you interact.
          </span>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="pg-desc">
            Description
          </label>
          <textarea className="field" id="pg-desc" placeholder="Markdown supported" />
        </div>

        <div className="field-group">
          <span className="field-label">Options</span>
          <label className="choice">
            <input type="checkbox" defaultChecked /> Show spoilered images
          </label>
          <label className="choice">
            <input type="checkbox" /> Autoplay animations
          </label>
          <label className="choice">
            <input type="radio" name="pg-layout" defaultChecked /> Grid layout
          </label>
          <label className="choice">
            <input type="radio" name="pg-layout" /> List layout
          </label>
          <label className="choice">
            <input className="switch" type="checkbox" defaultChecked role="switch" /> Compact mode
          </label>
          <label className="choice">
            <input type="checkbox" disabled /> Disabled option
          </label>
        </div>
      </div>
    </Section>
  );
}

function TableSpecimen() {
  const rows = [
    { tag: 'twilight sparkle', images: 188_204, category: 'character' },
    { tag: 'safe', images: 2_140_882, category: 'rating' },
    { tag: 'pegasus', images: 311_405, category: 'species' },
    { tag: 'screencap', images: 96_331, category: 'origin' },
    { tag: 'oc:littlepip', images: 3_402, category: 'oc' },
  ];

  return (
    <Section title="Tables" size="wide">
      <div className="table-scroll">
        <table className="table table--numeric">
          <thead>
            <tr>
              <th>Tag</th>
              <th>Category</th>
              <th>Images</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.tag}>
                <td>
                  <a href="#tag">{r.tag}</a>
                </td>
                <td>{r.category}</td>
                <td>{r.images.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function FeedbackSpecimen() {
  return (
    <Section title="Notices & badges" size="wide">
      <div className="notice">
        <span>
          <strong className="notice-title">Heads up</strong>
          Your filter is hiding 42 images on this page.
        </span>
      </div>
      <div className="notice notice--success">
        <span>
          <strong className="notice-title">Upload complete</strong>
          Your image is now in the moderation queue.
        </span>
      </div>
      <div className="notice notice--warning">
        <span>
          <strong className="notice-title">Tag conflict</strong>
          This image has both <code>safe</code> and <code>suggestive</code>.
        </span>
      </div>
      <div className="notice notice--danger">
        <span>
          <strong className="notice-title">Upload rejected</strong>A duplicate of this image already exists.
        </span>
      </div>
      <div className="pg-row">
        <Badge>Member</Badge>
        <Badge variant="unread">3 new</Badge>
        <Badge variant="staff">Assistant</Badge>
        <Badge variant="fave">Top faver</Badge>
        <Badge variant="success">Live</Badge>
        <Badge variant="danger">Off air</Badge>
      </div>
      <div className="site-notice">Scheduled maintenance tonight at 02:00 UTC.</div>
    </Section>
  );
}

function MenuSpecimen() {
  const [sort, setSort] = useState('newest');

  return (
    <Section title="Menus">
      <Menu className="pg-menu">
        <MenuLabel>Sort by</MenuLabel>
        {[
          { id: 'newest', label: 'Newest first', icon: <Clock size={14} /> },
          { id: 'score', label: 'Highest score', icon: <ArrowUp size={14} /> },
          { id: 'random', label: 'Random', icon: <Dices size={14} /> },
        ].map(option => (
          <MenuButton
            key={option.id}
            selected={sort === option.id}
            onClick={() => {
              setSort(option.id);
            }}
          >
            {option.icon}
            {option.label}
          </MenuButton>
        ))}
        <MenuSeparator />
        <MenuButton
          disabled
          onClick={() => {
            /* staff-only, never enabled in the playground */
          }}
        >
          <EyeOff size={14} />
          Wilson score (staff)
        </MenuButton>
      </Menu>
      <p className="pg-note">
        The same menu surface the header's section dropdowns and user menu use — {images.length} mock images are listed
        behind it on the home page.
      </p>
    </Section>
  );
}

function TypographySpecimen() {
  return (
    <Section title="Typography">
      <h1>Heading one</h1>
      <h2>Heading two</h2>
      <h3>Heading three</h3>
      <h4>Heading four</h4>
      <p>
        Body text sits at <code>--text-sm</code>, the density a booru wants. Links use{' '}
        <a href="#link">the link color</a>, and hovering one reveals the signature purple that makes the palette
        recognizable rather than generic.
      </p>
      <p className="pg-note">Muted text for timestamps and counters: posted 3 hours ago · 1,204 views · 88 faves</p>
    </Section>
  );
}

function TokenInspector({ knobs }: { knobs: Knobs }) {
  const [values, setValues] = useState<Array<[string, string]>>([]);

  useEffect(() => {
    const root = document.documentElement;

    const read = () => {
      const styles = getComputedStyle(root);
      setValues(INSPECTED_TOKENS.map(name => [name, styles.getPropertyValue(name).trim()]));
    };

    // Read after paint so a just-applied knob or theme attribute is reflected.
    let frame = requestAnimationFrame(read);

    // The theme lives on `<html>` and is switched from the site header, which
    // this component knows nothing about — so watch the attributes rather than
    // trying to thread the theme through as a prop.
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    });
    observer.observe(root, { attributeFilter: ['data-theme-lightness', 'data-theme-color'] });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [knobs]);

  return (
    <aside className="pg-tokens-rail" aria-label="Resolved token values" tabIndex={0}>
      <div>
        <h2 className="pg-card-head pg-card-head--bare">Resolved tokens</h2>
        <p className="pg-note">
          Computed values for the current theme, read back from the live root. Everything here derives from the handful
          of seed colors in the theme file.
        </p>
      </div>
      <div className="pg-tokens">
        {values.map(([name, value]) => (
          <div className="pg-token" key={name}>
            <span className="pg-token-chip" style={{ background: `var(${name})` }} />
            <span className="pg-token-text">
              <span className="pg-token-name">{name}</span>
              <span className="pg-token-value">{value}</span>
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
