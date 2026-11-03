import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Images } from 'lucide-react';

import { MediaGrid } from '#/components/home/MediaGrid';
import { useComponentSettings } from '#/hooks/use-component-settings';
import { useDataSource } from '#/hooks/use-data-source';
import { galleryQuery } from '#/lib/api/queries';

interface GalleryParams {
  page: number;
}

function pageParam(value: unknown): number {
  const page = Number(value);

  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export const Route = createFileRoute('/galleries/$id')({
  component: GalleryPage,
  params: {
    // A bad id is not an error of the router's: the page says there is no such gallery.
    parse: ({ id }: { id: string }) => ({ id: Number(id) }),
    stringify: ({ id }: { id: number }) => ({ id: String(id) }),
  },
  validateSearch: (search: Record<string, unknown>): GalleryParams => ({ page: pageParam(search.page) }),
});

function GalleryPage() {
  const { id } = Route.useParams();
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const kind = useDataSource();
  const { mediaPerPage } = useComponentSettings();
  const valid = Number.isInteger(id) && id >= 1;
  const { data: gallery, isError } = useQuery({ ...galleryQuery(kind, id, page, mediaPerPage), enabled: valid });

  if (gallery === undefined) {
    return (
      <div className="search-page">
        <p>{isError || !valid ? 'This gallery could not be loaded. It may not exist.' : 'Loading…'}</p>
      </div>
    );
  }

  return (
    <div className="search-page">
      <header>
        <h1>{gallery.title}</h1>
        <p>A gallery by {gallery.creator}</p>
        {gallery.description === '' ? null : <p>{gallery.description}</p>}
      </header>
      <MediaGrid
        headingLevel={2}
        size="large"
        label="Images"
        icon={<Images size={16} />}
        images={gallery.images}
        total={gallery.imageTotal}
        paging={{
          page,
          onPageChange: nextPage => {
            void navigate({ search: { page: nextPage } });
          },
        }}
      />
    </div>
  );
}
