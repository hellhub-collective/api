await Bun.build({
  minify: true,
  target: "node",
  outdir: "build",
  sourcemap: "external",
  entrypoints: ["src/index.ts"],
});
