
# Ditzybooru

Ditzybooru is an alternative modern web frontend for [Philomena](https://github.com/philomena-dev/philomena)-based backends like [Derpibooru](https://derpibooru.org). The main production instance https://ditzybooru.org is backed by Derpibooru, but Ditzybooru is self-hostable with any other Philomena-based backend of your choice.

Ditzybooru doesn't have a standalone backend. It reaches out to the origin Philomena-based server (e.g. https://derpibooru.org) for images, comments, user profile data, etc. Therefore, all data is still stored on the origin server. You can also optionally log in to Ditzybooru with your account on the origin server, and all your favourites, uploads, and comments will still be available. Any changes you make on Ditzybooru will be pushed to the origin server, and any data you see on the origin server can be seen on the Ditzybooru frontend.

## The Mission

The ideal goal of this project is to create a modern React NextJS SSR web frontend for Philomena and potentially integrate it upstream or use it as a basis for Philomena-native moder frontend. A less ambitious goal is to just make it available as a web app on a separate domain, extending it with extra features that are not available on the original Derpibooru frontend.

## Design

The official Philomena REST API offers a good chunk of read-only functionality of the service, but it doesn't cover the full capabilities of the upstream web frontend. The upstream Philomena web frontend is a multipage Elixir Phoenix app rendered server-side. Unfortunately, this complicates the development of alternative web frontends, but doesn't make it impossible.

Ditzybooru uses a custom backend designed to close the API gap for the alternative frontend. It exposes JSON REST APIs that provide the full range of features of Philomena. Internally, it uses web HTML requests to the Philomena origin server, while translating them to a nice REST JSON API for the frontend. This way, Ditzybooru's backend itself can be used to conveniently plug any other frontend if so desired.

Ideally, an equivalent or similar API will be exposed by Philomena natively, and attempts will be made to integrate the API design upstream, making Ditzybooru's proxy backend redundant, per se, in the future.

## License

<sup>
Licensed under the <a href="./LICENSE.txt">AGPL-3.0 license</a> just like the [Philomena project](https://github.com/philomena-dev/philomena).
</sup>

<br>

<sub>
Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, shall be licensed as above,
without any additional terms or conditions.
</sub>
