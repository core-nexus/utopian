import { defineConfig } from "tsup";

export default defineConfig([
  // CLI build
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    target: "node18",
    sourcemap: true,
    clean: true,
    minify: false,
    banner: { js: "#!/usr/bin/env node" },
    outExtension() {
      return { js: ".mjs" };
    }
  },
  // Library build
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node18",
    sourcemap: true,
    clean: false,
    dts: true,
    minify: false,
    outExtension() {
      return { js: ".mjs" };
    }
  }
]);