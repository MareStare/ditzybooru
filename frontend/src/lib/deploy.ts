/**
 * True in the production build for Cloudflare Workers. That deploy has no
 * backend of its own and every API call costs a Worker request, so it starts
 * on mock data and has the API switched off unless the Worker variables turn
 * it on (see `lib/api/backend/backend.server.ts`).
 */
export const CLOUDFLARE_PRODUCTION = import.meta.env.PROD && import.meta.env.BUILD_TARGET === 'cloudflare';
