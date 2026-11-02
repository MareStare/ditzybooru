import type { JsonMap } from '../dsl/extract.ts';
import { urlAt } from './media.ts';

/** Upstream post -> `Post`. */
export const postMap: JsonMap = {
  id: '/id',
  createdAt: '/created_at',
  updatedAt: '/updated_at',
  editedAt: '/edited_at',
  editReason: '/edit_reason',
  body: '/body',
  author: '/author',
  avatarUrl: urlAt('/avatar'),
  userId: '/user_id',
};

/** Upstream comment -> the fields every `Comment` shape shares. */
export const commentMap: JsonMap = {
  id: '/id',
  imageId: '/image_id',
  createdAt: '/created_at',
  updatedAt: '/updated_at',
  editedAt: '/edited_at',
  editReason: '/edit_reason',
  body: '/body',
  author: '/author',
  avatarUrl: urlAt('/avatar'),
  userId: '/user_id',
};

/** Upstream filter -> `Filter`. */
export const filterMap: JsonMap = {
  id: '/id',
  name: '/name',
  description: '/description',
  public: '/public',
  system: '/system',
  userCount: '/user_count',
  userId: '/user_id',
  hiddenTagIds: '/hidden_tag_ids',
  spoileredTagIds: '/spoilered_tag_ids',
  hiddenComplex: '/hidden_complex',
  spoileredComplex: '/spoilered_complex',
};

/** Moves every pointer of a flat `map` below `prefix`, for a response that wraps the item (`{"post": {...}}`). */
export function under(prefix: string, map: JsonMap): JsonMap {
  const lift = (pointer: string) =>
    pointer
      .split('|')
      .map(alternative => `${prefix}${alternative}`)
      .join('|');
  const lifted: JsonMap = {};
  for (const [field, rule] of Object.entries(map)) {
    if (typeof rule === 'string') lifted[field] = lift(rule);
    else if ('from' in rule) lifted[field] = { ...rule, from: lift(rule.from) };
    else lifted[field] = rule;
  }
  return lifted;
}
