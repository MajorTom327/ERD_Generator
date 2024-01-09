import esbuild from "esbuild";

const isDev = process.env.NODE_ENV === "development";

const config = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  minify: !isDev,
  sourcemap: isDev,
  external: ["pg"],
  platform: "node",
  target: ["es2015"],
  outfile: "dist/index.js",
};

if (process.argv.includes("--watch")) {
  const ctx = await esbuild.context(config);
  ctx.watch();
} else {
  esbuild.build(config);
}
