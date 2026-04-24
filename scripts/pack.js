// Bundle the extension into a zip ready for Chrome Web Store upload.
// Includes only the files Chrome needs at runtime.

const fs = require("node:fs");
const path = require("node:path");
const archiver = require("archiver");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
);
const outDir = path.join(root, "build");
const outFile = path.join(outDir, `youtube-play-all-${manifest.version}.zip`);

fs.mkdirSync(outDir, { recursive: true });

const output = fs.createWriteStream(outFile);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
  const kb = (archive.pointer() / 1024).toFixed(1);
  console.log(`Wrote ${path.relative(root, outFile)} (${kb} KiB)`);
});
archive.on("warning", (err) => {
  if (err.code !== "ENOENT") throw err;
});
archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);
archive.file(path.join(root, "manifest.json"), { name: "manifest.json" });
archive.file(path.join(root, "icon.png"), { name: "icon.png" });
archive.directory(path.join(root, "dist"), "dist");
archive.directory(path.join(root, "_locales"), "_locales");
archive.finalize();
