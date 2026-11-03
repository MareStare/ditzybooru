import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';

/** The livestreams page. */
export const listChannels = defineOperation({
  operationId: 'listChannels',
  path: '/channels',
  method: 'get',
  summary: 'The livestreams page: tracked streaming channels, live ones flagged.',
  tags: ['channels'],
  params: [{ name: 'q', in: 'query', schema: s.string(), description: 'Search by channel name.' }],
  response: s.ref('ChannelList'),
  examples: {},
  philomena: {
    routes: ['GET /channels'],
    auth: 'none',
    strategies: [
      {
        // The channel pages are HTML only, and Derpibooru's sit behind a bot
        // challenge, so this is not offered there.
        kind: 'html',
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/channels', query: { cq: '{q}' } },
        template: 'lib/philomena_web/templates/channel/index.html.slime',
        select: {
          fields: {
            items: {
              sel: '.media-list .media-box',
              many: true,
              fields: {
                id: { sel: 'a.media-box__header--link', attr: 'href', as: 'lastInt' },
                title: { sel: 'a.media-box__header--link', attr: 'title' },
                live: { sel: '.label--success', exists: true },
                viewers: { sel: '.media-box__header--channel:has(.label)', text: true, as: 'lastInt' },
                nsfw: { sel: '.media-box__overlay', exists: true },
                thumbnailUrl: { sel: '.media-box__content--channel img', attr: 'src', as: 'url' },
                artistTag: { sel: 'a[href^="/tags/"]', text: true, optional: true },
              },
            },
          },
        },
      },
    ],
  },
});
