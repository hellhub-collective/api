await Bun.build({
  minify: true,
  target: "node",
  outdir: "build",
  entrypoints: ["src/index.ts"],
});
