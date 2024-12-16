import { defineConfig } from "tsup";

export default defineConfig({
  platform: "node",
  entry: ["src/**/*.ts"],
  target: "es2020",
  format: ["cjs", "esm"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
});
