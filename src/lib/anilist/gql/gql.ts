/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "fragment MediaCard on Media {\n  id\n  title {\n    romaji\n    english\n    native\n  }\n  coverImage {\n    medium\n    large\n    extraLarge\n    color\n  }\n  format\n  status\n  episodes\n  season\n  seasonYear\n  averageScore\n  genres\n  isAdult\n  nextAiringEpisode {\n    airingAt\n    episode\n  }\n}": typeof types.MediaCardFragmentDoc,
    "query TrendingAnime($page: Int = 1, $perPage: Int = 25, $isAdult: Boolean = false) {\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: $isAdult) {\n      ...MediaCard\n      bannerImage\n    }\n  }\n}": typeof types.TrendingAnimeDocument,
};
const documents: Documents = {
    "fragment MediaCard on Media {\n  id\n  title {\n    romaji\n    english\n    native\n  }\n  coverImage {\n    medium\n    large\n    extraLarge\n    color\n  }\n  format\n  status\n  episodes\n  season\n  seasonYear\n  averageScore\n  genres\n  isAdult\n  nextAiringEpisode {\n    airingAt\n    episode\n  }\n}": types.MediaCardFragmentDoc,
    "query TrendingAnime($page: Int = 1, $perPage: Int = 25, $isAdult: Boolean = false) {\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: $isAdult) {\n      ...MediaCard\n      bannerImage\n    }\n  }\n}": types.TrendingAnimeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment MediaCard on Media {\n  id\n  title {\n    romaji\n    english\n    native\n  }\n  coverImage {\n    medium\n    large\n    extraLarge\n    color\n  }\n  format\n  status\n  episodes\n  season\n  seasonYear\n  averageScore\n  genres\n  isAdult\n  nextAiringEpisode {\n    airingAt\n    episode\n  }\n}"): typeof import('./graphql').MediaCardFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query TrendingAnime($page: Int = 1, $perPage: Int = 25, $isAdult: Boolean = false) {\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: $isAdult) {\n      ...MediaCard\n      bannerImage\n    }\n  }\n}"): typeof import('./graphql').TrendingAnimeDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
