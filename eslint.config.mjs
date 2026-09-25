import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["drizzle/**"],
  },
];

export default eslintConfig;
