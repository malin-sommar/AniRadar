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

export type MediaCardFragment = { id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null };

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
export const TrendingAnimeDocument = new TypedDocumentString(`
    query TrendingAnime($page: Int = 1, $perPage: Int = 25, $isAdult: Boolean = false) {
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