/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */
/** @typedef {import("prettier-plugin-sort-json").SortJsonOptions} SortJsonConfig */

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig | SortJsonConfig } */
export default {
  singleQuote: true,
  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
    'prettier-plugin-packagejson',
  ],

  tailwindFunctions: ['cn', 'cva'],

  importOrder: [
    '<TYPES>',
    '^(react/(.*)$)|^(react$)|^(react-native(.*)$)',
    '<THIRD_PARTY_MODULES>',
    '',
    '<TYPES>^@reactlith-template',
    '^@reactlith-template/(.*)$',
    '^~/components/ui/(.*)$',
    '',
    '<TYPES>^[.|..|~|#]',
    '^[~/|#]',
    '^[../]',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  overrides: [
    {
      files: ['**/messages/*.json'],
      options: {
        plugins: [
          '@ianvs/prettier-plugin-sort-imports',
          'prettier-plugin-tailwindcss',
          'prettier-plugin-packagejson',
          'prettier-plugin-sort-json',
        ],
        jsonRecursiveSort: true,
      },
    },
  ],
};
