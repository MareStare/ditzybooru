import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';

const TOKEN = { sel: 'meta[name=csrf-token]', attr: 'content' };

/** What every one of these answers: the image's counters after the change. */
const counters = {
  score: '/score',
  upvotes: '/upvotes',
  downvotes: '/downvotes',
  faves: '/faves',
};

interface InteractionOptions {
  operationId: string;
  /** The upstream's last path segment: `vote`, `fave`, `hide`. */
  what: 'vote' | 'fave' | 'hide';
  method: 'POST' | 'DELETE';
  summary: string;
  /** Fields of the submission. */
  body?: Record<string, string>;
  /** Sent as JSON, with a real boolean where the template says `true` or `false`. Some forks read a vote's `up` only that way. */
  json?: true;
  /** Our request body. */
  input?: ReturnType<typeof s.object>;
}

/**
 * An action a signed-in visitor takes on an image. The site answers these in
 * JSON, so the answer is mapped straight from the submission's response. The
 * visitor's session cookie decides who acts, and the backend gives the browser
 * the `_ses` id the site wants for any write.
 */
function interaction(options: InteractionOptions) {
  return defineOperation({
    operationId: options.operationId,
    path: `/images/{id}/${options.what}`,
    method: options.method === 'POST' ? 'post' : 'delete',
    summary: options.summary,
    tags: ['interactions'],
    params: [{ name: 'id', in: 'path', schema: s.int(), required: true }],
    ...(options.input ? { body: options.input } : {}),
    response: s.ref('ImageCounters'),
    philomena: {
      routes: [`${options.method} /images/:image_id/${options.what}`],
      auth: 'session',
      strategies: [
        {
          kind: 'form',
          flavors: ['philomena', 'furbooru'],
          // Any page carries a token; the home page is the lightest.
          form: { page: '/', csrf: TOKEN },
          request: {
            method: options.method,
            path: `/images/{id}/${options.what}`,
            ...(options.body ? { body: options.body } : {}),
            ...(options.json ? { encoding: 'json' as const } : {}),
          },
          result: { json: counters },
        },
      ],
    },
  });
}

export const voteImage = interaction({
  operationId: 'voteImage',
  what: 'vote',
  method: 'POST',
  summary: 'Upvote (`up: true`) or downvote (`up: false`) an image. Answers its counters.',
  body: { up: '{up}' },
  json: true,
  input: s.object({ up: s.bool() }),
});

export const removeVote = interaction({
  operationId: 'removeVote',
  what: 'vote',
  method: 'DELETE',
  summary: 'Take back the visitor’s vote on an image.',
});

export const faveImage = interaction({
  operationId: 'faveImage',
  what: 'fave',
  method: 'POST',
  summary: 'Fave an image.',
});

export const unfaveImage = interaction({
  operationId: 'unfaveImage',
  what: 'fave',
  method: 'DELETE',
  summary: 'Take an image off the visitor’s faves.',
});

export const hideImage = interaction({
  operationId: 'hideImage',
  what: 'hide',
  method: 'POST',
  summary: 'Hide an image from the visitor’s own listings.',
});

export const unhideImage = interaction({
  operationId: 'unhideImage',
  what: 'hide',
  method: 'DELETE',
  summary: 'Stop hiding an image.',
});
