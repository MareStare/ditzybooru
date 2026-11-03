import type { FieldSpec } from '../dsl/extract.ts';

/**
 * One post or comment as the site renders it (`article.communication`): who
 * wrote it, when, and the text as HTML for the backend to clean. Forum posts
 * and image comments share the markup.
 */
export function communicationFields(): Record<string, FieldSpec> {
  return {
    id: { attr: 'id', as: 'lastInt' },
    author: { sel: '.communication__body__sender-name strong', text: true },
    authorSlug: {
      sel: '.communication__body__sender-name strong a',
      attr: 'href',
      as: 'lastSegment',
      optional: true,
    },
    avatarUrl: { sel: '.communication__body__avatar img', attr: 'src', as: 'url', optional: true },
    createdAt: { sel: '.communication__options time', attr: 'datetime' },
    bodyHtml: { sel: '.communication__body__text', html: true, as: 'sanitizedHtml' },
  };
}
