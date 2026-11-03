/** The `?page=` of a paged listing. Page 1 has no parameter, as on the sites, so a link to the listing needs no search. */
export interface PageSearch {
  page?: number;
}

export function pageSearch(search: Record<string, unknown>): PageSearch {
  const page = Number(search.page);

  return Number.isInteger(page) && page > 1 ? { page } : {};
}
