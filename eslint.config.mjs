import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "gulpfile.js",
      "babel.config.js",
      "jest.config.js",
      "build/**",
      "dist/**",
      "coverage/**",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        foundry: "readonly",
        canvas: "readonly",
        fromUuid: "readonly",
        fromUuidSync: "readonly",
        CONFIG: "readonly",
        CONST: "readonly",
        Hooks: "readonly",
        game: "readonly",
        Handlebars: "readonly",
        loadTemplates: "readonly",
        renderTemplate: "readonly",
        getProperty: "readonly",
        ui: "readonly",
        Actors: "readonly",
        Actor: "readonly",
        ActorSheet: "readonly",
        Dialog: "readonly",
        Items: "readonly",
        Item: "readonly",
        ItemSheet: "readonly",
        ChatMessage: "readonly",
        Macro: "readonly",
        Roll: "readonly",
        TokenDocument: "readonly",
        Folder: "readonly",
        module: "readonly",
      },
    },
    rules: {
      indent: [
        "error",
        2,
        {
          SwitchCase: 1,
          // Match the existing formatting of multi-line ternaries...
          offsetTernaryExpressions: true,
          // ...and of conditional spreads such as ...(cond && { ... })
          ignoredNodes: ["LogicalExpression > ObjectExpression"],
        },
      ],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-unused-vars": ["error", { varsIgnorePattern: ".*Key" }],
    },
  },
  {
    // Jest unit tests
    files: ["src/module/util/_tests/**"],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];
