import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowUp, ChevronDown, Clock, Dices, EyeOff, Image as ImageIcon, Search } from 'lucide-react';

import { DisplaySettingsControls } from '#/components/layout/DisplaySettings';
import { Badge } from '#/components/ui/Badge';
import { Button, ButtonGroup } from '#/components/ui/Button';
import { Menu, MenuButton, MenuLabel, MenuSeparator } from '#/components/ui/Menu';
import { ComponentSettingsControls } from '#/components/layout/ComponentSettings';
import { Panel, PanelBody, PanelFooter, PanelHeader, PanelList, PanelTab, PanelTabs } from '#/components/ui/Panel';
import { MediaGrid } from '#/components/home/MediaGrid';
import { MEDIA_GRID_SETTING_CONTROLS } from '#/lib/componentSettings';
import { images, totalImages } from '#/lib/mock/data';

import type { ComponentSettingControl } from '#/lib/componentSettings';

export const Route = createFileRoute('/settings/display')({ component: DisplaySettingsPage });

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

function DisplaySettingsPage() {
  return (
    <div className="display-page">
      {/* The rail scrolls independently, so it needs a name and a tab stop — a
          scroll container is unreachable by keyboard without one. */}
      <aside className="display-page-rail" aria-label="Site-wide settings" tabIndex={0}>
        {/* Collapsed below the rail's own column, where it sits on top of the
            specimens and expanded would push every card off the first screen.
            Forced open — and the summary made inert — at `--xl`. */}
        <details className="display-page-rail-disclosure">
          <summary className="display-page-rail-summary">
            <h1 className="display-page-title">Display settings</h1>
            <ChevronDown className="display-page-rail-chevron" size={16} aria-hidden="true" />
          </summary>

          <div className="display-page-rail-content">
            <p className="display-page-note">
              The rail holds the site-wide settings — the same ones the display menu in the header offers, on the same
              stored values. Each writes a single custom property on <code>:root</code>, so the chrome around this page
              re-styles with the cards.
            </p>

            <DisplaySettingsControls />

            <p className="display-page-note">
              Settings that only make sense for one kind of component live on that component&apos;s card instead.
            </p>
          </div>
        </details>
      </aside>

      {/* A plain `div`: the page already renders inside the app shell's `main`. */}
      <div className="display-page-main">
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
 *
 * `controls` are the settings of the component the card showcases, rendered in
 * its title bar: they are scoped to this one component, so they belong next to
 * it rather than in the page-wide rail.
 *
 * `id` is what a component's own settings menu links to, so "More settings"
 * lands on the card for that component rather than at the top of the page.
 */
function Section({
  id,
  title,
  size = 'normal',
  controls = [],
  children,
}: {
  id?: string;
  title: string;
  size?: 'normal' | 'wide' | 'full';
  controls?: Array<ComponentSettingControl>;
  children: React.ReactNode;
}) {
  const modifier = size === 'normal' ? '' : ` display-page-card--${size}`;

  return (
    <section id={id} className={`display-page-card${modifier}`}>
      <div className="display-page-card-head">
        <h2>{title}</h2>
        {controls.length > 0 ? <ComponentSettingsControls controls={controls} inline /> : null}
      </div>
      <div className="display-page-card-body">{children}</div>
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
      <div className="display-page-grid">
        <Panel>
          <PanelTabs label="Panel tab demo">
            {PANEL_TABS.map(t => (
              <PanelTab
                key={t.id}
                id={`demo-tab-${t.id}`}
                controls="demo-tabpanel"
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
          <PanelBody id="demo-tabpanel" role="tabpanel" aria-labelledby={`demo-tab-${tab}`}>
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
                  <div className="display-page-note">12 replies · 3 hours ago</div>
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
            <p className="display-page-note">Uploads 1,204 · Comments 8,930 · Faves 22,145</p>
          </PanelBody>
        </Panel>
      </div>
    </Section>
  );
}

function ButtonSpecimen() {
  return (
    <Section title="Buttons">
      <div className="display-page-row">
        <Button>Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="success">Success</Button>
        <Button variant="warning">Warning</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="display-page-row">
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
      <p className="display-page-note">
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
      <p className="display-page-note">
        Category colors are identical in every Derpibooru theme, so they live in the shared palette rather than in each
        theme file. Background and border derive from the one category color via <code>color-mix()</code>.
      </p>
    </Section>
  );
}

/**
 * The home page's gallery, rendered by the component the home page renders.
 *
 * It carries the media boxes, the title bar and the pagination controls at once,
 * which is why none of those has a specimen of its own: a hand-built copy of any
 * of them would be a thing that looks like the site rather than a thing that is
 * the site, and would drift the first time the real one changed.
 */
function MediaGridSpecimen() {
  // The home page's own list, not a short slice of it: the page size is one of
  // the settings on this card, and a specimen trimmed to four images would show
  // the same four whichever stop the reader picks.
  return (
    <Section id="media-grid" title="Media grid" size="full" controls={MEDIA_GRID_SETTING_CONTROLS}>
      <MediaGrid label="Recent" icon={<Clock size={16} />} images={images} total={totalImages} />
    </Section>
  );
}

function FormSpecimen() {
  return (
    <Section title="Forms">
      <div className="display-page-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="demo-title">
            Image title
          </label>
          <input className="field" id="demo-title" placeholder="Describe the upload" />
          <span className="field-hint">Shown above the image on its page.</span>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="demo-email">
            Email (invalid on blur)
          </label>
          <input className="field" id="demo-email" type="email" required placeholder="you@example.com" />
          <span className="field-hint">
            Uses <code>:user-invalid</code>, so it only flags after you interact.
          </span>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="demo-desc">
            Description
          </label>
          <textarea className="field" id="demo-desc" placeholder="Markdown supported" />
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
            <input type="radio" name="demo-layout" defaultChecked /> Grid layout
          </label>
          <label className="choice">
            <input type="radio" name="demo-layout" /> List layout
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
      <div className="display-page-row">
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
      <Menu className="display-page-menu">
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
            /* staff-only, never enabled in a specimen */
          }}
        >
          <EyeOff size={14} />
          Wilson score (staff)
        </MenuButton>
      </Menu>
      <p className="display-page-note">
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
      <p className="display-page-note">
        Muted text for timestamps and counters: posted 3 hours ago · 1,204 views · 88 faves
      </p>
    </Section>
  );
}
