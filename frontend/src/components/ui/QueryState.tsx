import type { ReactNode } from 'react';

import { Button } from '#/components/ui/Button';
import { Notice, NoticeTitle } from '#/components/ui/Notice';
import { HttpError } from '#/lib/http/http-client';
import type { DataSourceKind } from '#/lib/api/types';

interface QueryStateProps<TData> {
  kind: DataSourceKind;
  data: TData | undefined;
  error: Error | null;
  isPending: boolean;
  refetch: () => unknown;
  /** What a missing thing is called: "page", "forum". */
  what: string;
  children: (data: TData) => ReactNode;
}

/**
 * Everything a page that reads from the live source can be instead of its
 * content: on mock data, loading, missing, or failed.
 */
export function QueryState<TData>({ kind, data, error, isPending, refetch, what, children }: QueryStateProps<TData>) {
  if (data !== undefined) {
    return children(data);
  }
  if (kind !== 'live') {
    return (
      <Notice>
        <NoticeTitle>Mock data is on</NoticeTitle>
        This page comes from the site itself, so it needs the live data source. Switch to it in the developer settings.
      </Notice>
    );
  }
  if (error instanceof HttpError && error.response.status === 404) {
    return (
      <Notice variant="warning">
        <NoticeTitle>Not found</NoticeTitle>
        There is no such {what}.
      </Notice>
    );
  }
  if (error instanceof HttpError && error.response.status === 501) {
    return (
      <Notice variant="warning">
        <NoticeTitle>Not available here</NoticeTitle>
        This site does not offer this page.
      </Notice>
    );
  }
  if (error !== null) {
    return (
      <Notice variant="danger">
        <NoticeTitle>Could not load this {what}</NoticeTitle>
        <Button
          onClick={() => {
            void refetch();
          }}
        >
          Retry
        </Button>
      </Notice>
    );
  }

  return <p className="content-page__status">{isPending ? 'Loading…' : null}</p>;
}
