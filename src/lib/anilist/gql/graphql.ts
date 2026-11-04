/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
/** The role the character plays in the media */
export type CharacterRole =
  /** A background character in the media */
  | 'BACKGROUND'
  /** A primary character role in the media */
  | 'MAIN'
  /** A supporting character role in the media */
  | 'SUPPORTING';

export type ExternalLinkType =
  | 'INFO'
  | 'SOCIAL'
  | 'STREAMING';

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

/** Media list watching/reading status enum. */
export type MediaListStatus =
  /** Finished watching/reading */
  | 'COMPLETED'
  /** Currently watching/reading */
  | 'CURRENT'
  /** Stopped watching/reading before completing */
  | 'DROPPED'
  /** Paused watching/reading */
  | 'PAUSED'
  /** Planning to watch/read */
  | 'PLANNING'
  /** Re-watching/reading */
  | 'REPEATING';

/** Type of relation media has to its parent. */
export type MediaRelation =
  /** An adaption of this media into a different format */
  | 'ADAPTATION'
  /** An alternative version of the same media */
  | 'ALTERNATIVE'
  /** Shares at least 1 character */
  | 'CHARACTER'
  /** Version 2 only. */
  | 'COMPILATION'
  /** Version 2 only. */
  | 'CONTAINS'
  /** Other */
  | 'OTHER'
  /** The media a side story is from */
  | 'PARENT'
  /** Released before the relation */
  | 'PREQUEL'
  /** Version 3 only. The media is set in the same universe as another media */
  | 'SAME_UNIVERSE'
  /** Released after the relation */
  | 'SEQUEL'
  /** A side story of the parent media */
  | 'SIDE_STORY'
  /** Version 2 only. The source material the media was adapted from */
  | 'SOURCE'
  /** An alternative version of the media with a different primary focus */
  | 'SPIN_OFF'
  /** A shortened and summarized version */
  | 'SUMMARY';

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

/** Source type the media was adapted from */
export type MediaSource =
  /** Version 2+ only. Japanese Anime */
  | 'ANIME'
  /** Version 3 only. Comics excluding manga */
  | 'COMIC'
  /** Version 2+ only. Self-published works */
  | 'DOUJINSHI'
  /** Version 3 only. Games excluding video games */
  | 'GAME'
  /** Written work published in volumes */
  | 'LIGHT_NOVEL'
  /** Version 3 only. Live action media such as movies or TV show */
  | 'LIVE_ACTION'
  /** Asian comic book */
  | 'MANGA'
  /** Version 3 only. Multimedia project */
  | 'MULTIMEDIA_PROJECT'
  /** Version 2+ only. Written works not published in volumes */
  | 'NOVEL'
  /** An original production not based of another work */
  | 'ORIGINAL'
  /** Other */
  | 'OTHER'
  /** Version 3 only. Picture book */
  | 'PICTURE_BOOK'
  /** Video game */
  | 'VIDEO_GAME'
  /** Video game driven primary by text and narrative */
  | 'VISUAL_NOVEL'
  /** Version 3 only. Written works published online */
  | 'WEB_NOVEL';

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

/** Media type enum, anime or manga. */
export type MediaType =
  /** Japanese Anime */
  | 'ANIME'
  /** Asian comic */
  | 'MANGA';

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


export type BrowseAnimeQuery = { Page: { pageInfo: { hasNextPage: boolean | null, currentPage: number | null } | null, media: Array<{ id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null, startDate: { year: number | null, month: number | null, day: number | null } | null, relations: { edges: Array<{ relationType: MediaRelation | null, node: { id: number, type: MediaType | null, format: MediaFormat | null, status: MediaStatus | null, startDate: { year: number | null, month: number | null } | null, title: { romaji: string | null, english: string | null, native: string | null } | null } | null } | null> | null } | null } | null> | null } | null };

export type AnimeCharactersQueryVariables = Exact<{
  id: number;
  page?: number | null | undefined;
  perPage?: number | null | undefined;
}>;


export type AnimeCharactersQuery = { Media: { id: number, characters: { pageInfo: { hasNextPage: boolean | null, currentPage: number | null } | null, edges: Array<{ id: number | null, role: CharacterRole | null, node: { id: number, name: { full: string | null, native: string | null } | null, image: { medium: string | null, large: string | null } | null } | null, voiceActors: Array<{ id: number, languageV2: string | null, name: { full: string | null, native: string | null } | null, image: { medium: string | null, large: string | null } | null } | null> | null } | null> | null } | null } | null };

export type AnimeDetailQueryVariables = Exact<{
  id: number;
}>;


export type AnimeDetailQuery = { Media: { type: MediaType | null, idMal: number | null, siteUrl: string | null, bannerImage: string | null, description: string | null, duration: number | null, source: MediaSource | null, countryOfOrigin: string | null, popularity: number | null, favourites: number | null, id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, startDate: { year: number | null, month: number | null, day: number | null } | null, endDate: { year: number | null, month: number | null, day: number | null } | null, studios: { nodes: Array<{ id: number, name: string, siteUrl: string | null } | null> | null } | null, tags: Array<{ id: number, name: string, rank: number | null, category: string | null, isGeneralSpoiler: boolean | null, isMediaSpoiler: boolean | null, isAdult: boolean | null } | null> | null, trailer: { id: string | null, site: string | null, thumbnail: string | null } | null, externalLinks: Array<{ id: number, site: string, url: string | null, type: ExternalLinkType | null, language: string | null, color: string | null, icon: string | null, isDisabled: boolean | null } | null> | null, airingSchedule: { nodes: Array<{ episode: number, airingAt: number } | null> | null } | null, relations: { edges: Array<{ relationType: MediaRelation | null, node: { id: number, type: MediaType | null, format: MediaFormat | null, status: MediaStatus | null, averageScore: number | null, seasonYear: number | null, episodes: number | null, isAdult: boolean | null, siteUrl: string | null, relations: { edges: Array<{ relationType: MediaRelation | null, node: { id: number, type: MediaType | null } | null } | null> | null } | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, startDate: { year: number | null, month: number | null, day: number | null } | null } | null } | null> | null } | null, characters: { pageInfo: { hasNextPage: boolean | null } | null, edges: Array<{ id: number | null, role: CharacterRole | null, node: { id: number, name: { full: string | null, native: string | null } | null, image: { medium: string | null, large: string | null } | null } | null, voiceActors: Array<{ id: number, languageV2: string | null, name: { full: string | null, native: string | null } | null, image: { medium: string | null, large: string | null } | null } | null> | null } | null> | null } | null, recommendations: { nodes: Array<{ mediaRecommendation: { id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null } | null } | null> | null } | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null } | null };

export type MediaCardFragment = { id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null };

export type SeriesLinksFragment = { startDate: { year: number | null, month: number | null, day: number | null } | null, relations: { edges: Array<{ relationType: MediaRelation | null, node: { id: number, type: MediaType | null, format: MediaFormat | null, status: MediaStatus | null, startDate: { year: number | null, month: number | null } | null, title: { romaji: string | null, english: string | null, native: string | null } | null } | null } | null> | null } | null };

export type SeasonNodeFragment = { id: number, type: MediaType | null, format: MediaFormat | null, status: MediaStatus | null, averageScore: number | null, seasonYear: number | null, episodes: number | null, isAdult: boolean | null, siteUrl: string | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, startDate: { year: number | null, month: number | null, day: number | null } | null };

export type RelatedSeasonFragment = { relationType: MediaRelation | null, node: { id: number, type: MediaType | null, format: MediaFormat | null, status: MediaStatus | null, averageScore: number | null, seasonYear: number | null, episodes: number | null, isAdult: boolean | null, siteUrl: string | null, relations: { edges: Array<{ relationType: MediaRelation | null, node: { id: number, type: MediaType | null } | null } | null> | null } | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, startDate: { year: number | null, month: number | null, day: number | null } | null } | null };

export type CharacterEdgeFragment = { id: number | null, role: CharacterRole | null, node: { id: number, name: { full: string | null, native: string | null } | null, image: { medium: string | null, large: string | null } | null } | null, voiceActors: Array<{ id: number, languageV2: string | null, name: { full: string | null, native: string | null } | null, image: { medium: string | null, large: string | null } | null } | null> | null };

export type MyAnimeListQueryVariables = Exact<{
  userId: number;
  chunk?: number | null | undefined;
}>;


export type MyAnimeListQuery = { MediaListCollection: { hasNextChunk: boolean | null, lists: Array<{ isCustomList: boolean | null, entries: Array<{ id: number, mediaId: number, status: MediaListStatus | null, progress: number | null, score: number | null, repeat: number | null, updatedAt: number | null, media: { id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, externalLinks: Array<{ site: string, type: ExternalLinkType | null, isDisabled: boolean | null } | null> | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null, startDate: { year: number | null, month: number | null, day: number | null } | null, relations: { edges: Array<{ relationType: MediaRelation | null, node: { id: number, type: MediaType | null, format: MediaFormat | null, status: MediaStatus | null, startDate: { year: number | null, month: number | null } | null, title: { romaji: string | null, english: string | null, native: string | null } | null } | null } | null> | null } | null } | null } | null> | null } | null> | null } | null };

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


export type SearchAnimeQuery = { matches: { media: Array<{ id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null, startDate: { year: number | null, month: number | null, day: number | null } | null, relations: { edges: Array<{ relationType: MediaRelation | null, node: { id: number, type: MediaType | null, format: MediaFormat | null, status: MediaStatus | null, startDate: { year: number | null, month: number | null } | null, title: { romaji: string | null, english: string | null, native: string | null } | null } | null } | null> | null } | null } | null> | null } | null, Page: { pageInfo: { hasNextPage: boolean | null, currentPage: number | null } | null, media: Array<{ id: number, format: MediaFormat | null, status: MediaStatus | null, episodes: number | null, season: MediaSeason | null, seasonYear: number | null, averageScore: number | null, genres: Array<string | null> | null, isAdult: boolean | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, nextAiringEpisode: { airingAt: number, episode: number } | null, startDate: { year: number | null, month: number | null, day: number | null } | null, relations: { edges: Array<{ relationType: MediaRelation | null, node: { id: number, type: MediaType | null, format: MediaFormat | null, status: MediaStatus | null, startDate: { year: number | null, month: number | null } | null, title: { romaji: string | null, english: string | null, native: string | null } | null } | null } | null> | null } | null } | null> | null } | null };

export type SeasonChainQueryVariables = Exact<{
  ids: Array<number | null | undefined> | number;
}>;


export type SeasonChainQuery = { Page: { media: Array<{ id: number, type: MediaType | null, format: MediaFormat | null, status: MediaStatus | null, averageScore: number | null, seasonYear: number | null, episodes: number | null, isAdult: boolean | null, siteUrl: string | null, relations: { edges: Array<{ relationType: MediaRelation | null, node: { id: number, type: MediaType | null, format: MediaFormat | null, status: MediaStatus | null, averageScore: number | null, seasonYear: number | null, episodes: number | null, isAdult: boolean | null, siteUrl: string | null, relations: { edges: Array<{ relationType: MediaRelation | null, node: { id: number, type: MediaType | null } | null } | null> | null } | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, startDate: { year: number | null, month: number | null, day: number | null } | null } | null } | null> | null } | null, title: { romaji: string | null, english: string | null, native: string | null } | null, coverImage: { medium: string | null, large: string | null, extraLarge: string | null, color: string | null } | null, startDate: { year: number | null, month: number | null, day: number | null } | null } | null> | null } | null };

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
export const SeriesLinksFragmentDoc = new TypedDocumentString(`
    fragment SeriesLinks on Media {
  startDate {
    year
    month
    day
  }
  relations {
    edges {
      relationType(version: 2)
      node {
        id
        type
        format
        status
        startDate {
          year
          month
        }
        title {
          romaji
          english
          native
        }
      }
    }
  }
}
    `, {"fragmentName":"SeriesLinks"}) as unknown as TypedDocumentString<SeriesLinksFragment, unknown>;
export const SeasonNodeFragmentDoc = new TypedDocumentString(`
    fragment SeasonNode on Media {
  id
  type
  format
  status
  averageScore
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
  startDate {
    year
    month
    day
  }
  seasonYear
  episodes
  isAdult
  siteUrl
}
    `, {"fragmentName":"SeasonNode"}) as unknown as TypedDocumentString<SeasonNodeFragment, unknown>;
export const RelatedSeasonFragmentDoc = new TypedDocumentString(`
    fragment RelatedSeason on MediaEdge {
  relationType(version: 2)
  node {
    ...SeasonNode
    relations {
      edges {
        relationType(version: 2)
        node {
          id
          type
        }
      }
    }
  }
}
    fragment SeasonNode on Media {
  id
  type
  format
  status
  averageScore
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
  startDate {
    year
    month
    day
  }
  seasonYear
  episodes
  isAdult
  siteUrl
}`, {"fragmentName":"RelatedSeason"}) as unknown as TypedDocumentString<RelatedSeasonFragment, unknown>;
export const CharacterEdgeFragmentDoc = new TypedDocumentString(`
    fragment CharacterEdge on CharacterEdge {
  id
  role
  node {
    id
    name {
      full
      native
    }
    image {
      medium
      large
    }
  }
  voiceActors(sort: [RELEVANCE, ID]) {
    id
    languageV2
    name {
      full
      native
    }
    image {
      medium
      large
    }
  }
}
    `, {"fragmentName":"CharacterEdge"}) as unknown as TypedDocumentString<CharacterEdgeFragment, unknown>;
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
      ...SeriesLinks
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
}
fragment SeriesLinks on Media {
  startDate {
    year
    month
    day
  }
  relations {
    edges {
      relationType(version: 2)
      node {
        id
        type
        format
        status
        startDate {
          year
          month
        }
        title {
          romaji
          english
          native
        }
      }
    }
  }
}`) as unknown as TypedDocumentString<BrowseAnimeQuery, BrowseAnimeQueryVariables>;
export const AnimeCharactersDocument = new TypedDocumentString(`
    query AnimeCharacters($id: Int!, $page: Int = 1, $perPage: Int = 25) {
  Media(id: $id, type: ANIME) {
    id
    characters(page: $page, perPage: $perPage, sort: [ROLE, RELEVANCE, ID]) {
      pageInfo {
        hasNextPage
        currentPage
      }
      edges {
        ...CharacterEdge
      }
    }
  }
}
    fragment CharacterEdge on CharacterEdge {
  id
  role
  node {
    id
    name {
      full
      native
    }
    image {
      medium
      large
    }
  }
  voiceActors(sort: [RELEVANCE, ID]) {
    id
    languageV2
    name {
      full
      native
    }
    image {
      medium
      large
    }
  }
}`) as unknown as TypedDocumentString<AnimeCharactersQuery, AnimeCharactersQueryVariables>;
export const AnimeDetailDocument = new TypedDocumentString(`
    query AnimeDetail($id: Int!) {
  Media(id: $id, type: ANIME) {
    ...MediaCard
    type
    idMal
    siteUrl
    bannerImage
    description(asHtml: true)
    duration
    source(version: 3)
    countryOfOrigin
    popularity
    favourites
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    studios(isMain: true) {
      nodes {
        id
        name
        siteUrl
      }
    }
    tags {
      id
      name
      rank
      category
      isGeneralSpoiler
      isMediaSpoiler
      isAdult
    }
    trailer {
      id
      site
      thumbnail
    }
    externalLinks {
      id
      site
      url
      type
      language
      color
      icon
      isDisabled
    }
    airingSchedule(notYetAired: true, perPage: 6) {
      nodes {
        episode
        airingAt
      }
    }
    relations {
      edges {
        ...RelatedSeason
      }
    }
    characters(page: 1, perPage: 12, sort: [ROLE, RELEVANCE, ID]) {
      pageInfo {
        hasNextPage
      }
      edges {
        ...CharacterEdge
      }
    }
    recommendations(perPage: 12, sort: [RATING_DESC, ID]) {
      nodes {
        mediaRecommendation {
          ...MediaCard
        }
      }
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
}
fragment SeasonNode on Media {
  id
  type
  format
  status
  averageScore
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
  startDate {
    year
    month
    day
  }
  seasonYear
  episodes
  isAdult
  siteUrl
}
fragment RelatedSeason on MediaEdge {
  relationType(version: 2)
  node {
    ...SeasonNode
    relations {
      edges {
        relationType(version: 2)
        node {
          id
          type
        }
      }
    }
  }
}
fragment CharacterEdge on CharacterEdge {
  id
  role
  node {
    id
    name {
      full
      native
    }
    image {
      medium
      large
    }
  }
  voiceActors(sort: [RELEVANCE, ID]) {
    id
    languageV2
    name {
      full
      native
    }
    image {
      medium
      large
    }
  }
}`) as unknown as TypedDocumentString<AnimeDetailQuery, AnimeDetailQueryVariables>;
export const MyAnimeListDocument = new TypedDocumentString(`
    query MyAnimeList($userId: Int!, $chunk: Int = 1) {
  MediaListCollection(
    userId: $userId
    type: ANIME
    forceSingleCompletedList: true
    chunk: $chunk
    perChunk: 500
  ) {
    hasNextChunk
    lists {
      isCustomList
      entries {
        id
        mediaId
        status
        progress
        score(format: POINT_10_DECIMAL)
        repeat
        updatedAt
        media {
          ...MediaCard
          ...SeriesLinks
          externalLinks {
            site
            type
            isDisabled
          }
        }
      }
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
}
fragment SeriesLinks on Media {
  startDate {
    year
    month
    day
  }
  relations {
    edges {
      relationType(version: 2)
      node {
        id
        type
        format
        status
        startDate {
          year
          month
        }
        title {
          romaji
          english
          native
        }
      }
    }
  }
}`) as unknown as TypedDocumentString<MyAnimeListQuery, MyAnimeListQueryVariables>;
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
      ...SeriesLinks
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
      ...SeriesLinks
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
}
fragment SeriesLinks on Media {
  startDate {
    year
    month
    day
  }
  relations {
    edges {
      relationType(version: 2)
      node {
        id
        type
        format
        status
        startDate {
          year
          month
        }
        title {
          romaji
          english
          native
        }
      }
    }
  }
}`) as unknown as TypedDocumentString<SearchAnimeQuery, SearchAnimeQueryVariables>;
export const SeasonChainDocument = new TypedDocumentString(`
    query SeasonChain($ids: [Int]!) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, type: ANIME) {
      ...SeasonNode
      relations {
        edges {
          ...RelatedSeason
        }
      }
    }
  }
}
    fragment SeasonNode on Media {
  id
  type
  format
  status
  averageScore
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
  startDate {
    year
    month
    day
  }
  seasonYear
  episodes
  isAdult
  siteUrl
}
fragment RelatedSeason on MediaEdge {
  relationType(version: 2)
  node {
    ...SeasonNode
    relations {
      edges {
        relationType(version: 2)
        node {
          id
          type
        }
      }
    }
  }
}`) as unknown as TypedDocumentString<SeasonChainQuery, SeasonChainQueryVariables>;
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