import { s } from '../dsl/schema.ts';

const Representations = s.object({
  full: s.uri(),
  tall: s.uri(),
  large: s.uri(),
  medium: s.uri(),
  small: s.uri(),
  thumb: s.uri(),
  thumbSmall: s.uri(),
  thumbTiny: s.uri(),
});

const Image = s.object({
  id: s.int(),
  createdAt: s.dateTime(),
  width: s.int(),
  height: s.int(),
  aspectRatio: s.number(),
  format: s.string(),
  tags: s.array(s.string()),
  tagCount: s.int(),
  score: s.int(),
  upvotes: s.int(),
  downvotes: s.int(),
  faves: s.int(),
  commentCount: s.int(),
  sourceUrls: s.array(s.string()),
  description: s.string(),
  uploader: s.nullable(s.string()),
  representations: s.ref('Representations'),
  spoilered: s.bool(),
  hiddenFromUsers: s.bool(),
});

const ErrorBody = s.object({
  error: s.object({ code: s.string(), message: s.string() }),
});

export const schemas = { Representations, Image, Error: ErrorBody };
