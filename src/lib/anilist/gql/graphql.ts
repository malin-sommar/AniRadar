/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
/** The format the media was released in */
export type MediaFormat =
  /** Professionally published manga with more than one chapter */
  | 'MANGA'
  /** Anime movies with a theatrical release */
  | 'MOVIE'
  /** Short anime released as a music video */
  | 'MUSIC'
  /** Written books released as a series of light novels */
  | 'NOVEL'
  /** (Original Net Animation) Anime that have been originally released online or are only available through streaming services. */
  | 'ONA'
  /** Manga with just one chapter */
  | 'ONE_SHOT'
  /** (Original Video Animation) Anime that have been released directly on DVD/Blu-ray without originally going through a theatrical release or television broadcast */
  | 'OVA'
  /** Special episodes that have been included in DVD/Blu-ray releases, picture dramas, pilots, etc */
  | 'SPECIAL'
  /** Anime broadcast on television */
  | 'TV'
  /** Anime which are under 15 minutes in length and broadcast on television */
  | 'TV_SHORT';

export type MediaSeason =
  /** Predominantly started airing between October and November */
  | 'FALL'
  /** Predominantly started airing between April and June */
  | 'SPRING'
  /** Predominantly started airing between July and September */
  | 'SUMMER'
  /** Predominantly started airing between January and March */
  | 'WINTER';

/** Media sort enums */
export type MediaSort =
  | 'CHAPTERS'
  | 'CHAPTERS_DESC'
  | 'DURATION'
  | 'DURATION_DESC'
  | 'END_DATE'
  | 'END_DATE_DESC'
  | 'EPISODES'
  | 'EPISODES_DESC'
  | 'FAVOURITES'
  | 'FAVOURITES_DESC'
  | 'FORMAT'
  | 'FORMAT_DESC'
  | 'ID'
  | 'ID_DESC'
  | 'POPULARITY'
  | 'POPULARITY_DESC'
  | 'SCORE'
  | 'SCORE_DESC'
  | 'SEARCH_MATCH'
  | 'START_DATE'
  | 'START_DATE_DESC'
  | 'STATUS'
  | 'STATUS_DESC'
  | 'TITLE_ENGLISH'
  | 'TITLE_ENGLISH_DESC'
  | 'TITLE_NATIVE'
  | 'TITLE_NATIVE_DESC'
  | 'TITLE_ROMAJI'
  | 'TITLE_ROMAJI_DESC'
  | 'TRENDING'
  | 'TRENDING_DESC'
  | 'TYPE'
  | 'TYPE_DESC'
  | 'UPDATED_AT'
  | 'UPDATED_AT_DESC'
  | 'VOLUMES'
  | 'VOLUMES_DESC';

/** The current releasing status of the media */
export type MediaStatus =
  /** Ended before the work could be finished */
  | 'CANCELLED'
  /** Has completed and is no longer being released */
  | 'FINISHED'
  /** Version 2 only. Is currently paused from releasing and will resume at a later date */
  | 'HIATUS'
  /** To be released at a later date */
  | 'NOT_YET_RELEASED'
  /** Currently releasing */
  | 'RELEASING';

export type BrowseAnimeQueryVariables = Exact<{
  page?: number | null | undefined;
  perPage?: number | null | undefined;
  search?: string | null | undefined;
  genres?: Array<string | null | undefined> | string | null | undefined;
  tags?: Array<string | null | undefined> | string | null | undefined;
  season?: MediaSeason | null | undefined;
  seasonYear?: number | null | undefined;
  formats?: Array<MediaFormat | null | undefined> | MediaFormat | null | undefined;
  statuses?: Array<MediaStatus | null | undefined> | MediaStatus | null | undefined;
  sort?: Array<MediaSort | null | undefined> | MediaSort | null | undefined;
  isAdult?: boolean | null | undefined;
}>;


export type BrowseAnimeQuery = { Page: { pageInfo: { hasNextPage: boolean | null, currentPage: number | null } | null, media: Array<{ id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null } | null> | null } | null };

export type MediaCardFragment = { id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null };

export type SearchAnimeQueryVariables = Exact<{
  ids: Array<number | null | undefined> | number;
  matchSort?: Array<MediaSort | null | undefined> | MediaSort | null | undefined;
  page?: number | null | undefined;
  perPage?: number | null | undefined;
  search: string;
  genres?: Array<string | null | undefined> | string | null | undefined;
  tags?: Array<string | null | undefined> | string | null | undefined;
  season?: MediaSeason | null | undefined;
  seasonYear?: number | null | undefined;
  formats?: Array<MediaFormat | null | undefined> | MediaFormat | null | undefined;
  statuses?: Array<MediaStatus | null | undefined> | MediaStatus | null | undefined;
  sort?: Array<MediaSort | null | undefined> | MediaSort | null | undefined;
  isAdult?: boolean | null | undefined;
}>;


export type SearchAnimeQuery = { matches: { media: Array<{ id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null } | null> | null } | null, Page: { pageInfo: { hasNextPage: boolean | null, currentPage: number | null } | null, media: Array<{ id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null } | null> | null } | null };

export type GenresAndTagsQueryVariables = Exact<{ [key: string]: never; }>;


export type GenresAndTagsQuery = { GenreCollection: Array<string | null> | null, MediaTagCollection: Array<{ id: number, name: string, category: string | null, isAdult: boolean | null, isGeneralSpoiler: boolean | null } | null> | null };

export type TrendingAnimeQueryVariables = Exact<{
  page?: number | null | undefined;
  perPage?: number | null | undefined;
  isAdult?: boolean | null | undefined;
}>;


export type TrendingAnimeQuery = { Page: { pageInfo: { hasNextPage: boolean | null, currentPage: number | null } | null, media: Array<{ bannerImage: string | null, id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null } | null> | null } | null };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const MediaCardFragmentDoc = new TypedDocumentString(`
    fragment MediaCard on Media {
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    medium
    large
    extraLarge
    color
  }
  format
  status
  episodes
  season
  seasonYear
  averageScore
  genres
  isAdult
  nextAiringEpisode {
    airingAt
    episode
  }
}
    `, {"fragmentName":"MediaCard"}) as unknown as TypedDocumentString<MediaCardFragment, unknown>;
export const BrowseAnimeDocument = new TypedDocumentString(`
    query BrowseAnime($page: Int = 1, $perPage: Int = 30, $search: String, $genres: [String], $tags: [String], $season: MediaSeason, $seasonYear: Int, $formats: [MediaFormat], $statuses: [MediaStatus], $sort: [MediaSort] = [POPULARITY_DESC], $isAdult: Boolean) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      currentPage
    }
    media(
      type: ANIME
      search: $search
      genre_in: $genres
      tag_in: $tags
      season: $season
      seasonYear: $seasonYear
      format_in: $formats
      status_in: $statuses
      sort: $sort
      isAdult: $isAdult
    ) {
      ...MediaCard
    }
  }
}
    fragment MediaCard on Media {
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    medium
    large
    extraLarge
    color
  }
  format
  status
  episodes
  season
  seasonYear
  averageScore
  genres
  isAdult
  nextAiringEpisode {
    airingAt
    episode
  }
}`) as unknown as TypedDocumentString<BrowseAnimeQuery, BrowseAnimeQueryVariables>;
export const SearchAnimeDocument = new TypedDocumentString(`
    query SearchAnime($ids: [Int]!, $matchSort: [MediaSort] = [POPULARITY_DESC], $page: Int = 1, $perPage: Int = 30, $search: String!, $genres: [String], $tags: [String], $season: MediaSeason, $seasonYear: Int, $formats: [MediaFormat], $statuses: [MediaStatus], $sort: [MediaSort] = [SEARCH_MATCH], $isAdult: Boolean) {
  matches: Page(page: 1, perPage: 20) {
    media(
      type: ANIME
      id_in: $ids
      genre_in: $genres
      tag_in: $tags
      season: $season
      seasonYear: $seasonYear
      format_in: $formats
      status_in: $statuses
      sort: $matchSort
      isAdult: $isAdult
    ) {
      ...MediaCard
    }
  }
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      currentPage
    }
    media(
      type: ANIME
      search: $search
      genre_in: $genres
      tag_in: $tags
      season: $season
      seasonYear: $seasonYear
      format_in: $formats
      status_in: $statuses
      sort: $sort
      isAdult: $isAdult
    ) {
      ...MediaCard
    }
  }
}
    fragment MediaCard on Media {
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    medium
    large
    extraLarge
    color
  }
  format
  status
  episodes
  season
  seasonYear
  averageScore
  genres
  isAdult
  nextAiringEpisode {
    airingAt
    episode
  }
}`) as unknown as TypedDocumentString<SearchAnimeQuery, SearchAnimeQueryVariables>;
export const GenresAndTagsDocument = new TypedDocumentString(`
    query GenresAndTags {
  GenreCollection
  MediaTagCollection {
    id
    name
    category
    isAdult
    isGeneralSpoiler
  }
}
    `) as unknown as TypedDocumentString<GenresAndTagsQuery, GenresAndTagsQueryVariables>;
export const TrendingAnimeDocument = new TypedDocumentString(`
    query TrendingAnime($page: Int = 1, $perPage: Int = 25, $isAdult: Boolean) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      currentPage
    }
    media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: $isAdult) {
      ...MediaCard
      bannerImage
    }
  }
}
    fragment MediaCard on Media {
  id
  title {
    romaji
    english
    native
  }
  coverImage {
    medium
    large
    extraLarge
    color
  }
  format
  status
  episodes
  season
  seasonYear
  averageScore
  genres
  isAdult
  nextAiringEpisode {
    airingAt
    episode
  }
}`) as unknown as TypedDocumentString<TrendingAnimeQuery, TrendingAnimeQueryVariables>;