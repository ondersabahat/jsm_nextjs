import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  {
    ignores: [
      // Default ignores of eslint-config-next:
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "warn",
      ignorePatterns: ["components/ui/*"],
    },
  },
];

export default eslintConfig;
