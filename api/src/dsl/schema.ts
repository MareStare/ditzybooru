/** A minimal JSON Schema (2020-12 subset) builder with TypeScript inference. */
export interface Schema<T = unknown> {
  readonly _type?: T;
  readonly json: Record<string, unknown>;
}

type Infer<TSchema> = TSchema extends Schema<infer T> ? T : never;
type Shape = Record<string, Schema & { optional?: true }>;
type OptionalKeys<TShape extends Shape> = {
  [K in keyof TShape]: TShape[K] extends { optional: true } ? K : never;
}[keyof TShape];

function make<T>(json: Record<string, unknown>): Schema<T> {
  return { json };
}

export const s = {
  string: () => make<string>({ type: 'string' }),
  int: () => make<number>({ type: 'integer' }),
  number: () => make<number>({ type: 'number' }),
  bool: () => make<boolean>({ type: 'boolean' }),
  dateTime: () => make<string>({ type: 'string', format: 'date-time' }),
  uri: () => make<string>({ type: 'string', format: 'uri-reference' }),
  enum: <const TValues extends readonly string[]>(...values: TValues) =>
    make<TValues[number]>({ type: 'string', enum: values }),
  array: <T>(item: Schema<T>, minItems = 0) => make<T[]>({ type: 'array', items: item.json, minItems }),
  nullable: <T>(inner: Schema<T>) => make<T | null>({ oneOf: [inner.json, { type: 'null' }] }),
  /** Marks an object property as not required. */
  optional: <T>(inner: Schema<T>) => ({ ...inner, optional: true as const }),
  ref: <T>(name: string) => make<T>({ $ref: `#/components/schemas/${name}` }),
  object: <TShape extends Shape>(props: TShape) =>
    make<
      { [K in Exclude<keyof TShape, OptionalKeys<TShape>>]: Infer<TShape[K]> } & {
        [K in OptionalKeys<TShape>]?: Infer<TShape[K]>;
      }
    >({
      type: 'object',
      properties: Object.fromEntries(Object.entries(props).map(([k, v]) => [k, v.json])),
      required: Object.entries(props)
        .filter(([, v]) => !v.optional)
        .map(([k]) => k),
      additionalProperties: false,
    }),
};
