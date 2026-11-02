/** Closed set of named value transforms; implemented once, in the Rust engine. */
type Transform =
  'int' | 'float' | 'bool' | 'date' | 'url' | 'slug' | 'relativeTime' | `split:${string}` | `join:${string}`;

/** HTML field extractor. `sel` is CSS relative to the parent; exactly one reader applies. */
interface FieldSpec {
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

/** JSON pointer remap: our field -> pointer into the upstream document, or a nested spec. */
type JsonMapValue = string | { from: string; as?: Transform; map?: Record<string, JsonMapValue> };
type JsonMap = Record<string, JsonMapValue>;

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

interface JsonStrategy extends StrategyBase {
  kind: 'json';
  request: UpstreamRequest;
  map: JsonMap;
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
