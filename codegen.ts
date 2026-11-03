import type { CodegenConfig } from "@graphql-codegen/cli"

// Generates typed documents for every operation in operations/*.graphql.
// The schema is committed (refresh with `pnpm schema:fetch`), so codegen
// never needs to call AniList.
const config: CodegenConfig = {
  schema: "src/lib/anilist/schema.graphql",
  documents: ["src/lib/anilist/operations/**/*.graphql"],
  generates: {
    "src/lib/anilist/gql/": {
      preset: "client",
      presetConfig: { fragmentMasking: false },
      config: {
        documentMode: "string",
        enumsAsTypes: true,
        useTypeImports: true,
        skipTypename: true,
        strictScalars: true,
        scalars: {
          Json: "unknown",
          CountryCode: "string",
          FuzzyDateInt: "number",
        },
      },
    },
  },
}

export default config
