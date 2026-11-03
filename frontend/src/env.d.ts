interface ImportMetaEnv {
  /** The short hash of the git commit the app is built from. */
  readonly COMMIT_SHA: string;
  /** The date of that commit, in RFC 3339 format and UTC. */
  readonly COMMIT_DATE: string;
  /** `cloudflare` or `node`, the server the app is built for. */
  readonly BUILD_TARGET: 'cloudflare' | 'node';
}
