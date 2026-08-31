import { useState } from 'react';
import type { Ref } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Camera, Search } from 'lucide-react';

import { Button } from '#/components/ui/Button';
import { Field } from '#/components/ui/Field';

/**
 * The site search field. Rendered twice: in the header bar on a wide screen,
 * and in the bottom navigation's search sheet on a phone, where the bar has no
 * room for it. Both sit on `--surface-nav`, so one set of styles covers them.
 */
export function SearchBar({ className = '', inputRef }: { className?: string; inputRef?: Ref<HTMLInputElement> }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        // An empty field means the default listing, not a search for "".
        void navigate({ to: '/search', search: { q: query.trim() || '*', page: 1 } });
      }}
      className={`nav-search ${className}`}
      role="search"
    >
      <div className="nav-search__box">
        <Search className="nav-search__icon" size={16} />
        <Field
          ref={inputRef}
          value={query}
          onChange={event => {
            setQuery(event.target.value);
          }}
          placeholder="Search"
          aria-label="Search"
          inputMode="search"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
      <Button type="submit" variant="ghost" icon title="Search" aria-label="Search">
        <Search size={16} />
      </Button>
      <Link
        // @ts-expect-error TODO: route not built yet
        to="/search/reverse"
        title="Search using an image"
        aria-label="Reverse image search"
        className="nav-link nav-search__reverse"
      >
        <Camera size={16} />
      </Link>
    </form>
  );
}
