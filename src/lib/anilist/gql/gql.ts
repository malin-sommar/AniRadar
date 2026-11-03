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
    "query BrowseAnime($page: Int = 1, $perPage: Int = 30, $search: String, $genres: [String], $tags: [String], $season: MediaSeason, $seasonYear: Int, $formats: [MediaFormat], $statuses: [MediaStatus], $sort: [MediaSort] = [POPULARITY_DESC], $isAdult: Boolean) {\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(\n      type: ANIME\n      search: $search\n      genre_in: $genres\n      tag_in: $tags\n      season: $season\n      seasonYear: $seasonYear\n      format_in: $formats\n      status_in: $statuses\n      sort: $sort\n      isAdult: $isAdult\n    ) {\n      ...MediaCard\n    }\n  }\n}": typeof types.BrowseAnimeDocument,
    "fragment MediaCard on Media {\n  id\n  title {\n    romaji\n    english\n    native\n  }\n  coverImage {\n    medium\n    large\n    extraLarge\n    color\n  }\n  format\n  status\n  episodes\n  season\n  seasonYear\n  averageScore\n  genres\n  isAdult\n  nextAiringEpisode {\n    airingAt\n    episode\n  }\n}": typeof types.MediaCardFragmentDoc,
    "query SearchAnime($ids: [Int]!, $matchSort: [MediaSort] = [POPULARITY_DESC], $page: Int = 1, $perPage: Int = 30, $search: String!, $genres: [String], $tags: [String], $season: MediaSeason, $seasonYear: Int, $formats: [MediaFormat], $statuses: [MediaStatus], $sort: [MediaSort] = [SEARCH_MATCH], $isAdult: Boolean) {\n  matches: Page(page: 1, perPage: 20) {\n    media(\n      type: ANIME\n      id_in: $ids\n      genre_in: $genres\n      tag_in: $tags\n      season: $season\n      seasonYear: $seasonYear\n      format_in: $formats\n      status_in: $statuses\n      sort: $matchSort\n      isAdult: $isAdult\n    ) {\n      ...MediaCard\n    }\n  }\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(\n      type: ANIME\n      search: $search\n      genre_in: $genres\n      tag_in: $tags\n      season: $season\n      seasonYear: $seasonYear\n      format_in: $formats\n      status_in: $statuses\n      sort: $sort\n      isAdult: $isAdult\n    ) {\n      ...MediaCard\n    }\n  }\n}": typeof types.SearchAnimeDocument,
    "query GenresAndTags {\n  GenreCollection\n  MediaTagCollection {\n    id\n    name\n    category\n    isAdult\n    isGeneralSpoiler\n  }\n}": typeof types.GenresAndTagsDocument,
    "query TrendingAnime($page: Int = 1, $perPage: Int = 25, $isAdult: Boolean) {\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: $isAdult) {\n      ...MediaCard\n      bannerImage\n    }\n  }\n}": typeof types.TrendingAnimeDocument,
};
const documents: Documents = {
    "query BrowseAnime($page: Int = 1, $perPage: Int = 30, $search: String, $genres: [String], $tags: [String], $season: MediaSeason, $seasonYear: Int, $formats: [MediaFormat], $statuses: [MediaStatus], $sort: [MediaSort] = [POPULARITY_DESC], $isAdult: Boolean) {\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(\n      type: ANIME\n      search: $search\n      genre_in: $genres\n      tag_in: $tags\n      season: $season\n      seasonYear: $seasonYear\n      format_in: $formats\n      status_in: $statuses\n      sort: $sort\n      isAdult: $isAdult\n    ) {\n      ...MediaCard\n    }\n  }\n}": types.BrowseAnimeDocument,
    "fragment MediaCard on Media {\n  id\n  title {\n    romaji\n    english\n    native\n  }\n  coverImage {\n    medium\n    large\n    extraLarge\n    color\n  }\n  format\n  status\n  episodes\n  season\n  seasonYear\n  averageScore\n  genres\n  isAdult\n  nextAiringEpisode {\n    airingAt\n    episode\n  }\n}": types.MediaCardFragmentDoc,
    "query SearchAnime($ids: [Int]!, $matchSort: [MediaSort] = [POPULARITY_DESC], $page: Int = 1, $perPage: Int = 30, $search: String!, $genres: [String], $tags: [String], $season: MediaSeason, $seasonYear: Int, $formats: [MediaFormat], $statuses: [MediaStatus], $sort: [MediaSort] = [SEARCH_MATCH], $isAdult: Boolean) {\n  matches: Page(page: 1, perPage: 20) {\n    media(\n      type: ANIME\n      id_in: $ids\n      genre_in: $genres\n      tag_in: $tags\n      season: $season\n      seasonYear: $seasonYear\n      format_in: $formats\n      status_in: $statuses\n      sort: $matchSort\n      isAdult: $isAdult\n    ) {\n      ...MediaCard\n    }\n  }\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(\n      type: ANIME\n      search: $search\n      genre_in: $genres\n      tag_in: $tags\n      season: $season\n      seasonYear: $seasonYear\n      format_in: $formats\n      status_in: $statuses\n      sort: $sort\n      isAdult: $isAdult\n    ) {\n      ...MediaCard\n    }\n  }\n}": types.SearchAnimeDocument,
    "query GenresAndTags {\n  GenreCollection\n  MediaTagCollection {\n    id\n    name\n    category\n    isAdult\n    isGeneralSpoiler\n  }\n}": types.GenresAndTagsDocument,
    "query TrendingAnime($page: Int = 1, $perPage: Int = 25, $isAdult: Boolean) {\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: $isAdult) {\n      ...MediaCard\n      bannerImage\n    }\n  }\n}": types.TrendingAnimeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query BrowseAnime($page: Int = 1, $perPage: Int = 30, $search: String, $genres: [String], $tags: [String], $season: MediaSeason, $seasonYear: Int, $formats: [MediaFormat], $statuses: [MediaStatus], $sort: [MediaSort] = [POPULARITY_DESC], $isAdult: Boolean) {\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(\n      type: ANIME\n      search: $search\n      genre_in: $genres\n      tag_in: $tags\n      season: $season\n      seasonYear: $seasonYear\n      format_in: $formats\n      status_in: $statuses\n      sort: $sort\n      isAdult: $isAdult\n    ) {\n      ...MediaCard\n    }\n  }\n}"): typeof import('./graphql').BrowseAnimeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment MediaCard on Media {\n  id\n  title {\n    romaji\n    english\n    native\n  }\n  coverImage {\n    medium\n    large\n    extraLarge\n    color\n  }\n  format\n  status\n  episodes\n  season\n  seasonYear\n  averageScore\n  genres\n  isAdult\n  nextAiringEpisode {\n    airingAt\n    episode\n  }\n}"): typeof import('./graphql').MediaCardFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query SearchAnime($ids: [Int]!, $matchSort: [MediaSort] = [POPULARITY_DESC], $page: Int = 1, $perPage: Int = 30, $search: String!, $genres: [String], $tags: [String], $season: MediaSeason, $seasonYear: Int, $formats: [MediaFormat], $statuses: [MediaStatus], $sort: [MediaSort] = [SEARCH_MATCH], $isAdult: Boolean) {\n  matches: Page(page: 1, perPage: 20) {\n    media(\n      type: ANIME\n      id_in: $ids\n      genre_in: $genres\n      tag_in: $tags\n      season: $season\n      seasonYear: $seasonYear\n      format_in: $formats\n      status_in: $statuses\n      sort: $matchSort\n      isAdult: $isAdult\n    ) {\n      ...MediaCard\n    }\n  }\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(\n      type: ANIME\n      search: $search\n      genre_in: $genres\n      tag_in: $tags\n      season: $season\n      seasonYear: $seasonYear\n      format_in: $formats\n      status_in: $statuses\n      sort: $sort\n      isAdult: $isAdult\n    ) {\n      ...MediaCard\n    }\n  }\n}"): typeof import('./graphql').SearchAnimeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GenresAndTags {\n  GenreCollection\n  MediaTagCollection {\n    id\n    name\n    category\n    isAdult\n    isGeneralSpoiler\n  }\n}"): typeof import('./graphql').GenresAndTagsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query TrendingAnime($page: Int = 1, $perPage: Int = 25, $isAdult: Boolean) {\n  Page(page: $page, perPage: $perPage) {\n    pageInfo {\n      hasNextPage\n      currentPage\n    }\n    media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: $isAdult) {\n      ...MediaCard\n      bannerImage\n    }\n  }\n}"): typeof import('./graphql').TrendingAnimeDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
