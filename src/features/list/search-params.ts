import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server"

import { LIST_SORTS, LIST_TABS } from "@/domain/my-list"

/** List filters in the URL, so Back and shared links keep them. */
export const listParsers = {
  tab: parseAsStringLiteral(LIST_TABS).withDefault("all"),
  sort: parseAsStringLiteral(LIST_SORTS).withDefault("updated"),
  search: parseAsString.withDefault(""),
  services: parseAsArrayOf(parseAsString).withDefault([]),
  /** "On my services": only shows on the services chosen in settings. */
  mine: parseAsBoolean.withDefault(false),
}

export const listUrlKeys = { search: "q" } as const
