import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // New in eslint-plugin-react-hooks 7 (with eslint-config-next 16). The app sets loading
      // state at the start of fetch effects in ~29 places; that's a re-render cost, not a bug.
      // Kept visible as a warning until those effects are restructured.
      "react-hooks/set-state-in-effect": "warn",
      // Other rules
      // "@next/next/no-img-element": "off"
    },
  },
]);

export default eslintConfig;
