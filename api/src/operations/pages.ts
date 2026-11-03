import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';

/** A static page such as the privacy policy or the about page. */
export const getPage = defineOperation({
  operationId: 'getPage',
  path: '/pages/{slug}',
  method: 'get',
  summary: 'A static page: its title, last update and text.',
  tags: ['pages'],
  params: [{ name: 'slug', in: 'path', schema: s.string(), required: true }],
  response: s.ref('StaticPage'),
  examples: { slug: 'about' },
  philomena: {
    routes: ['GET /pages/:id'],
    auth: 'none',
    strategies: [
      {
        kind: 'html',
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/pages/{slug}' },
        template: 'lib/philomena_web/templates/page/show.html.slime',
        select: {
          // The heading is the anchor: the rest of the page, rendered without
          // a wrapper, follows it as siblings.
          root: 'main > h1',
          fields: {
            title: { text: true },
            updatedAt: { after: 'p', sel: 'time', attr: 'datetime' },
            bodyHtml: { after: 'p:has(a[href$="/history"])', rest: true, html: true, as: 'sanitizedHtml' },
          },
        },
      },
    ],
  },
});

/** The site rules. Only Philomena's current master has this page. */
export const listRules = defineOperation({
  operationId: 'listRules',
  path: '/rules',
  method: 'get',
  summary: 'The site rules page: every rule with its text and examples.',
  tags: ['pages'],
  params: [],
  response: s.ref('RuleList'),
  examples: {},
  philomena: {
    routes: ['GET /rules'],
    auth: 'none',
    strategies: [
      {
        kind: 'html',
        flavors: ['philomena'],
        request: { method: 'GET', path: '/rules' },
        template: 'lib/philomena_web/templates/rule/index.html.slime',
        select: {
          fields: {
            updatedAt: { sel: 'time', attr: 'datetime' },
            items: {
              sel: 'article.rule',
              many: true,
              fields: {
                id: { attr: 'id', as: 'int' },
                title: { sel: '.rule__title', text: true },
                important: { sel: '.rule__badge--important', exists: true },
                bodyHtml: { sel: '.rule__body .walloftext', html: true, as: 'sanitizedHtml' },
                examplesHtml: { sel: '.rule__example .walloftext', html: true, optional: true, as: 'sanitizedHtml' },
              },
            },
          },
        },
      },
    ],
  },
});

/** The staff list: groups (administrators, moderators, ...) with their members. */
export const getStaff = defineOperation({
  operationId: 'getStaff',
  path: '/staff',
  method: 'get',
  summary: 'The staff page: staff groups and the people in each.',
  tags: ['pages'],
  params: [],
  response: s.ref('StaffPage'),
  examples: {},
  philomena: {
    routes: ['GET /staff'],
    auth: 'none',
    strategies: [
      {
        kind: 'html',
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/staff' },
        template: 'lib/philomena_web/templates/staff/index.html.slime',
        select: {
          fields: {
            groups: {
              sel: '.staff-block__category',
              many: true,
              fields: {
                name: { text: true },
                // The page lists a heading, its description, then its members,
                // as siblings rather than nested.
                description: { after: '.staff-block__description', text: true },
                members: {
                  after: '.staff-block__grid',
                  sel: '.staff-block__user',
                  many: true,
                  fields: {
                    name: { sel: '.staff-block__avatar b', text: true },
                    profileUrl: { sel: 'a.profile-block', attr: 'href', as: 'url' },
                    avatarUrl: { sel: '.staff-block__avatar img', attr: 'src', as: 'url', optional: true },
                    description: { sel: '.staff-block__user-description', text: true },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
});
