import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  EyeOff,
  Heart,
  Image as ImageIcon,
  MessageSquare,
  Search,
  Shield,
  Upload,
} from 'lucide-react';

import '#/styles/index.css';
import '#/styles/playground.css';

export const Route = createFileRoute('/dev/styling')({ component: StylingPlayground });

/** Themes, with the two colors each rail swatch previews (nav + page). */
const THEMES = [
  { id: 'dark-blue', label: 'Dark blue', chip: ['#284371', '#141a24'] },
  { id: 'dark-purple', label: 'Dark purple', chip: ['#36274e', '#15121a'] },
  { id: 'dark-green', label: 'Dark green', chip: ['#287139', '#091a11'] },
  { id: 'dark-red', label: 'Dark red', chip: ['#923131', '#412121'] },
  { id: 'dark-gray', label: 'Dark gray', chip: ['#2e3439', '#0c0c0c'] },
  { id: 'light-blue', label: 'Light blue', chip: ['#3d92d0', '#f8fafc'] },
  { id: 'light-purple', label: 'Light purple', chip: ['#8048ad', '#f8fafc'] },
  { id: 'light-green', label: 'Light green', chip: ['#38b261', '#f8fafc'] },
  { id: 'light-red', label: 'Light red', chip: ['#d03d3d', '#f8fafc'] },
  { id: 'light-gray', label: 'Light gray', chip: ['#8792a3', '#f8fafc'] },
] as const;

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

interface Knobs {
  radiusUnit: number;
  borderWidth: number;
  shadowForce: number;
  density: number;
  fontScale: number;
  motionScale: number;
}

const DEFAULT_KNOBS: Knobs = {
  radiusUnit: 6,
  borderWidth: 1,
  shadowForce: 1,
  density: 1,
  fontScale: 1,
  motionScale: 1,
};

function StylingPlayground() {
  const [theme, setTheme] = useState<string>('dark-blue');
  const [knobs, setKnobs] = useState<Knobs>(DEFAULT_KNOBS);
  const rootRef = useRef<HTMLDivElement>(null);

  const setKnob = <TKey extends keyof Knobs>(key: TKey, value: Knobs[TKey]) => {
    setKnobs(prev => ({ ...prev, [key]: value }));
  };

  // The knobs are unregistered custom properties, so `@container style()` in
  // panel.css compares them textually. `--border-width` and `--shadow-force`
  // are style-queried and must therefore be written in the exact form the query
  // uses — `0px` and `0`, never `0.0px` or `calc(0px)`. `String(Number)` gives
  // the canonical form for both.
  const rootStyle = {
    '--radius-unit': `${knobs.radiusUnit}px`,
    '--border-width': `${knobs.borderWidth}px`,
    '--shadow-force': String(knobs.shadowForce),
    '--density': String(knobs.density),
    '--font-scale': String(knobs.fontScale),
    '--motion-scale': String(knobs.motionScale),
  } as CSSProperties;

  return (
    <div ref={rootRef} className="ds pg" data-ds-theme={theme} style={rootStyle}>
      <aside className="pg-rail">
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)' }}>Design system</h1>
          <p className="pg-note">Every control below writes a single CSS custom property on the root.</p>
        </div>

        <div className="pg-knob">
          <span className="pg-knob-head">Theme</span>
          <div className="pg-themes">
            {THEMES.map(t => (
              <button
                key={t.id}
                type="button"
                className="pg-theme"
                aria-pressed={theme === t.id}
                onClick={() => {
                  setTheme(t.id);
                }}
              >
                <span
                  className="pg-theme-chip"
                  style={{ '--chip-a': t.chip[0], '--chip-b': t.chip[1] } as CSSProperties}
                />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Knob
          label="Radius"
          token="--radius-unit"
          value={knobs.radiusUnit}
          display={`${knobs.radiusUnit}px`}
          min={0}
          max={16}
          step={1}
          onChange={v => {
            setKnob('radiusUnit', v);
          }}
        />
        <Knob
          label="Border width"
          token="--border-width"
          value={knobs.borderWidth}
          display={`${knobs.borderWidth}px`}
          min={0}
          max={3}
          step={1}
          onChange={v => {
            setKnob('borderWidth', v);
          }}
        />
        <Knob
          label="Shadow"
          token="--shadow-force"
          value={knobs.shadowForce}
          display={knobs.shadowForce.toFixed(2)}
          min={0}
          max={2}
          step={0.05}
          onChange={v => {
            setKnob('shadowForce', v);
          }}
        />
        <Knob
          label="Density"
          token="--density"
          value={knobs.density}
          display={knobs.density.toFixed(2)}
          min={0.75}
          max={1.4}
          step={0.05}
          onChange={v => {
            setKnob('density', v);
          }}
        />
        <Knob
          label="Font scale"
          token="--font-scale"
          value={knobs.fontScale}
          display={knobs.fontScale.toFixed(2)}
          min={0.85}
          max={1.3}
          step={0.05}
          onChange={v => {
            setKnob('fontScale', v);
          }}
        />
        <Knob
          label="Motion"
          token="--motion-scale"
          value={knobs.motionScale}
          display={knobs.motionScale.toFixed(1)}
          min={0}
          max={2}
          step={0.1}
          onChange={v => {
            setKnob('motionScale', v);
          }}
        />

        <button
          type="button"
          className="btn btn--block"
          onClick={() => {
            setKnobs(DEFAULT_KNOBS);
          }}
        >
          Reset knobs
        </button>

        <p className="pg-note">
          Try <code>Radius 0</code> + <code>Border 1</code> for the classic Derpibooru look, or <code>Border 0</code> to
          watch panels switch to depth-based separation via a container style query.
        </p>
      </aside>

      <TokenInspector rootRef={rootRef} theme={theme} knobs={knobs} />

      <main className="pg-main">
        {/* Order is layout, not taxonomy. `grid-auto-flow: dense` backfills
            gaps, but only with cards that come later in the DOM, so the
            two-column cards sit among the one-column ones that can fill in
            around them rather than all at the end. */}
        <NavSpecimen />

        <PanelSpecimen />
        <ButtonSpecimen />
        <TagSpecimen />
        <MediaSpecimen />
        <FormSpecimen />
        <FeedbackSpecimen />
        <TableSpecimen />
        <MenuSpecimen />
        <TypographySpecimen />
      </main>
    </div>
  );
}

interface KnobProps {
  label: string;
  token: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function Knob({ label, token, value, display, min, max, step, onChange }: KnobProps) {
  return (
    <label className="pg-knob">
      <span className="pg-knob-head">
        <span>
          {label} <span className="pg-knob-token">{token}</span>
        </span>
        <span className="pg-knob-value">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => {
          onChange(Number(e.target.value));
        }}
      />
    </label>
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

function NavSpecimen() {
  return (
    <Section title="Navigation" size="full">
      <nav className="nav" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div className="nav-bar">
          <a className="nav-brand" href="#nav">
            Ditzybooru
          </a>
          <div className="nav-search">
            <input className="field" type="search" placeholder="Search images…" aria-label="Search images" />
            <button type="button" className="btn" aria-label="Search">
              <Search size={14} />
            </button>
          </div>
          <span className="nav-spacer" />
          <a className="nav-link" href="#upload">
            <Upload size={14} /> Upload
          </a>
          <a className="nav-link" href="#notifications">
            <Bell size={14} /> <span className="nav-count">3</span>
          </a>
          <a className="nav-link nav-link--admin" href="#admin">
            <Shield size={14} /> Admin
          </a>
        </div>
        <div className="nav-bar nav-bar--sub">
          {['Images', 'Tags', 'Forums', 'Galleries', 'Comments', 'Channels'].map(item => (
            <a key={item} className="nav-link" href={`#${item}`}>
              {item}
            </a>
          ))}
        </div>
      </nav>
    </Section>
  );
}

function PanelSpecimen() {
  const [tab, setTab] = useState('recent');

  return (
    <Section title="Panels">
      <div className="pg-grid">
        <section className="panel">
          <div className="panel-tabs">
            {[
              { id: 'recent', label: 'Recent' },
              { id: 'top', label: 'Top' },
              { id: 'random', label: 'Random' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className="panel-tab"
                aria-selected={tab === t.id}
                onClick={() => {
                  setTab(t.id);
                }}
              >
                <ImageIcon size={13} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="panel-body">
            Tab bodies share the panel surface, so the selected tab reads as continuous with the content below it.
          </div>
        </section>

        <section className="panel">
          <header className="panel-header panel-header--center">
            <a href="#forums">Forum activity</a>
          </header>
          <div className="panel-body panel-body--flush">
            <ul className="panel-list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {['Site rules discussion', 'Tag cleanup thread', 'Art critique corner'].map(item => (
                <li key={item}>
                  <a href="#thread">{item}</a>
                  <div className="pg-note">12 replies · 3 hours ago</div>
                </li>
              ))}
            </ul>
          </div>
          <a className="panel-footer" href="#all">
            View all threads
          </a>
        </section>

        <section className="panel">
          <header className="panel-header">Statistics</header>
          <header className="panel-header panel-header--sub">Last 24 hours</header>
          <div className="panel-body">
            <p>A sub-header carries a lighter tint so nested sections do not compete with the panel title.</p>
            <p className="pg-note" style={{ marginBottom: 0 }}>
              Uploads 1,204 · Comments 8,930 · Faves 22,145
            </p>
          </div>
        </section>
      </div>
    </Section>
  );
}

function ButtonSpecimen() {
  return (
    <Section title="Buttons">
      <div className="pg-row">
        <button type="button" className="btn">
          Default
        </button>
        <button type="button" className="btn btn--primary">
          Primary
        </button>
        <button type="button" className="btn btn--success">
          Success
        </button>
        <button type="button" className="btn btn--warning">
          Warning
        </button>
        <button type="button" className="btn btn--danger">
          Danger
        </button>
        <button type="button" className="btn btn--ghost">
          Ghost
        </button>
        <button type="button" className="btn" disabled>
          Disabled
        </button>
      </div>
      <div className="pg-row">
        <button type="button" className="btn btn--sm">
          Small
        </button>
        <button type="button" className="btn">
          Medium
        </button>
        <button type="button" className="btn btn--lg">
          Large
        </button>
        <span className="btn-group">
          <button type="button" className="btn">
            Newest
          </button>
          <button type="button" className="btn">
            Score
          </button>
          <button type="button" className="btn">
            Wilson
          </button>
        </span>
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

const DEMO_IMAGES = [
  { id: 1, score: 412, comments: 38 },
  { id: 2, score: 87, comments: 4 },
  { id: 3, score: -6, comments: 19 },
  { id: 4, score: 1204, comments: 211 },
];

function MediaSpecimen() {
  return (
    <Section title="Media grid">
      <div className="media-grid pg-media-grid">
        {DEMO_IMAGES.map(img => (
          <MediaCard key={img.id} seed={img.id} score={img.score} comments={img.comments} />
        ))}
      </div>
    </Section>
  );
}

function MediaCard({ seed, score, comments }: { seed: number; score: number; comments: number }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [faved, setFaved] = useState(false);
  const [hidden, setHidden] = useState(false);

  const delta = vote === 'up' ? 1 : vote === 'down' ? -1 : 0;
  const shown = score + delta;

  return (
    <article className="media-box">
      <div className="media-box-bar">
        <button
          type="button"
          className="media-action media-action--fave"
          aria-pressed={faved}
          title="Fave"
          onClick={() => {
            setFaved(v => !v);
          }}
        >
          <Heart size={13} fill={faved ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          className="media-action media-action--up"
          aria-pressed={vote === 'up'}
          title="Yay!"
          onClick={() => {
            setVote(v => (v === 'up' ? null : 'up'));
          }}
        >
          <ArrowUp size={13} />
        </button>
        <span
          className={`media-score ${shown > 0 ? 'media-score--positive' : shown < 0 ? 'media-score--negative' : ''}`}
        >
          {shown}
        </span>
        <button
          type="button"
          className="media-action media-action--down"
          aria-pressed={vote === 'down'}
          title="Neigh!"
          onClick={() => {
            setVote(v => (v === 'down' ? null : 'down'));
          }}
        >
          <ArrowDown size={13} />
        </button>
        <a className="media-action" href="#comments" title="Comments">
          <MessageSquare size={13} />
          {comments}
        </a>
        <button
          type="button"
          className="media-action media-action--hide"
          aria-pressed={hidden}
          title="Hide"
          onClick={() => {
            setHidden(v => !v);
          }}
        >
          <EyeOff size={13} />
        </button>
      </div>
      <div className="media-thumb">
        <div className="pg-swatch" style={{ filter: `hue-rotate(${seed * 47}deg)`, height: '100%' }} />
        {hidden ? <div className="media-overlay">Hidden</div> : null}
      </div>
    </article>
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
    <Section title="Notices & badges">
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
        <span className="badge">Member</span>
        <span className="badge badge--unread">3 new</span>
        <span className="badge badge--staff">Assistant</span>
        <span className="badge badge--fave">Top faver</span>
      </div>
      <div className="site-notice">Scheduled maintenance tonight at 02:00 UTC.</div>
      <nav className="pagination" aria-label="Pagination">
        <a className="page-link" href="#prev">
          Prev
        </a>
        <a className="page-link" href="#p1">
          1
        </a>
        <a className="page-link" href="#p2" aria-current="page">
          2
        </a>
        <a className="page-link" href="#p3">
          3
        </a>
        <span className="page-gap">…</span>
        <a className="page-link" href="#p99">
          99
        </a>
        <a className="page-link" href="#next">
          Next
        </a>
      </nav>
    </Section>
  );
}

function MenuSpecimen() {
  return (
    <Section title="Menus">
      <ul className="menu" style={{ maxWidth: '16rem' }}>
        <li className="menu-label">Sort by</li>
        <li>
          <button type="button" className="menu-item" aria-selected>
            Newest first
          </button>
        </li>
        <li>
          <button type="button" className="menu-item">
            Highest score
          </button>
        </li>
        <li>
          <button type="button" className="menu-item">
            Most comments
          </button>
        </li>
        <li>
          <hr className="menu-separator" />
        </li>
        <li>
          <button type="button" className="menu-item" disabled>
            Wilson score (staff)
          </button>
        </li>
      </ul>
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

function TokenInspector({
  rootRef,
  theme,
  knobs,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  theme: string;
  knobs: Knobs;
}) {
  const [values, setValues] = useState<Array<[string, string]>>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    // Read after paint so the newly applied theme attribute is reflected.
    const id = requestAnimationFrame(() => {
      const styles = getComputedStyle(root);
      setValues(INSPECTED_TOKENS.map(name => [name, styles.getPropertyValue(name).trim()]));
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }, [rootRef, theme, knobs]);

  return (
    <aside className="pg-tokens-rail">
      <div>
        <h2 className="pg-card-head" style={{ padding: 0, border: 0 }}>
          Resolved tokens
        </h2>
        <p className="pg-note">
          Computed values for the current theme, read back from the live root. Everything here derives from the 19 seed
          colors in the theme file.
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
