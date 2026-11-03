/** Closed set of named value transforms; implemented once, in the Rust engine. */
export type Transform =
  | 'int'
  | 'lastInt'
  | 'float'
  | 'bool'
  | 'date'
  | 'url'
  | 'slug'
  | 'relativeTime'
  | `split:${string}`
  | `join:${string}`;

/** HTML field extractor. `sel` is CSS relative to the parent; exactly one reader applies. */
export interface FieldSpec {
  sel?: string;
  attr?: string;
  text?: true;
  html?: true;
  exists?: true;
  /** Parse the attribute as JSON (e.g. `data-uris`). */
  json?: true;
  /** Remap the parsed JSON attribute; pointers are relative to its root. */
  map?: JsonMap;
  many?: true;
  optional?: true;
  as?: Transform;
  fields?: Record<string, FieldSpec>;
}

interface SelectSpec {
  root?: string;
  fields: Record<string, FieldSpec>;
}

/** JSON pointer remap (`a|b` tries pointer `a`, then `b`, for renamed fields): our field -> pointer into the upstream document, or a nested spec. */
type JsonMapValue =
  | string
  | { from: string; as?: Transform; map?: Record<string, JsonMapValue> }
  /** Finds the item of a join's follow-up response whose `join.key` equals this item's `key`, and takes its `value`. */
  | { join: string; key: string; value: string; as?: Transform }
  /** Every item of a join's follow-up response, remapped by `map`. An empty list when the follow-up was not sent. */
  | { join: string; map: Record<string, JsonMapValue> };
export type JsonMap = Record<string, JsonMapValue>;

interface UpstreamRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Upstream path with `{param}` placeholders. */
  path: string;
  query?: Record<string, string>;
  encoding?: 'form' | 'multipart' | 'json';
  body?: Record<string, string>;
}

interface StrategyBase {
  /** Only used on these upstream flavors; omitted means all. */
  flavors?: string[];
}

/** A second request made after the first, from values collected out of its response. */
interface Join {
  name: string;
  /** `{<collect.param>}` and `{<collect.param>Count}` are filled in. */
  request: UpstreamRequest;
  collect: {
    param: string;
    /** Pointer to an array in the first response. */
    from: string;
    /** Pointer, inside each element, to the value to send. Values are unique. */
    pick: string;
    prefix?: string;
    separator: string;
  };
  /** Pointer to the item array of the follow-up response. */
  items: string;
  /** Pointer, inside each item, to the value `lookup` rules match on. */
  key: string;
}

/** One request per element of the first response, merged into a single list. */
interface Fanout {
  /** Pointer to the array in the first response. */
  from: string;
  /** Filled from `bind` for each element. */
  request: UpstreamRequest;
  /** Parameter name -> pointer, inside the element, to its value. */
  bind: Record<string, string>;
  /** Pointer to the item array in each response. */
  items: string;
  /** Pointer, inside each item, to the value the merged list is sorted by. */
  sortBy: string;
  descending?: boolean;
  /** Name of a request parameter that caps the merged list. */
  limit?: string;
}

export interface JsonStrategy extends StrategyBase {
  kind: 'json';
  request: UpstreamRequest;
  map: JsonMap;
  joins?: Join[];
  /** Pointer to an array in the first response; when it is empty the page does not exist (answers 404). */
  notFoundWhenEmpty?: string;
  /** When set, `map` runs on `{ items: [{ parent, item }] }`: `parent` is the element of the first response, `item` an entry of its follow-up. */
  fanout?: Fanout;
}

interface HtmlStrategy extends StrategyBase {
  kind: 'html';
  request: UpstreamRequest;
  /** Upstream template to inspect when selectors break. */
  template?: string;
  select: SelectSpec;
}

interface FormStrategy extends StrategyBase {
  kind: 'form';
  form: { page: string; csrf: string };
  request: UpstreamRequest;
  success: { status: number[]; location?: string };
  errors?: FieldSpec;
}

export type Strategy = JsonStrategy | HtmlStrategy | FormStrategy;

export type AuthLevel = 'none' | 'session' | 'session+csrf' | 'api-key' | 'role:moderator' | 'role:admin';
