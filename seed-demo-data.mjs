import { execFileSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const deployment = "nautical-shrimp-774";
const assetFiles = [
  "explore-tile-01.png",
  "explore-tile-02.png",
  "explore-tile-03.png",
  "explore-tile-04.png",
  "explore-tile-05.png",
  "explore-tile-06.png",
  "explore-tile-07.png",
  "explore-tile-08.png",
  "explore-tile-09.png",
  "explore-tile-10.png",
  "explore-tile-11.png",
  "explore-tile-12.png",
  "profile-grid-1.png",
  "profile-grid-2.png",
  "profile-grid-3.png",
  "profile-grid-4.png",
  "profile-grid-5.png",
  "profile-grid-6.png",
  "home-post-dog.png",
  "chat-coast-photo.png",
];

function runConvex(functionName, args) {
  const json = JSON.stringify(args);
  const cliArgument = Object.keys(args).length === 0
    ? "{}"
    : "{payload:[" + Array.from(new TextEncoder().encode(json)).join(",") + "]}";
  let output;
  if (process.platform === "win32") {

    const command =
      "$ErrorActionPreference = 'Stop'; $result = & npx convex run '" +
      functionName +
      "' '" +
      cliArgument +
      "' --deployment '" +
      deployment +
      "'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; $result";
    output = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], {
      cwd: root,
      encoding: "utf8",
      stdio: ["inherit", "pipe", "inherit"],
    });
  } else {
    output = execFileSync(
      "npx",
      ["convex", "run", functionName, cliArgument, "--deployment", deployment],
      { cwd: root, encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] },
    );
  }

  const response = output.trim();
  if (!response) throw new Error("Convex returned an empty response for " + functionName + ".");
  try {
    return JSON.parse(response);
  } catch {
    throw new Error("Convex returned an unexpected response for " + functionName + ".");
  }
}

const assets = [];
for (const filename of assetFiles) {
  const fullPath = path.join(root, "assets", "images", filename);
  const info = await stat(fullPath);
  assets.push({
    assetKey: path.basename(filename, ".png"),
    byteSize: info.size,
    contentType: "image/png",
    fullPath,
  });
}

const prepared = runConvex("demoSeed:prepareDemoData", {
  assets: assets.map(({ assetKey, byteSize, contentType }) => ({ assetKey, byteSize, contentType })),
});

const recoveredKeys = new Set(runConvex("demoSeed:recoverDemoUploads", {}));
for (const task of prepared.uploads) {
  if (recoveredKeys.has(task.seedKey)) continue;
  const asset = assets.find((item) => item.assetKey === task.assetKey);
  if (!asset) throw new Error("Missing local asset " + task.assetKey + ".");
  const bytes = await readFile(asset.fullPath);
  const response = await fetch(task.uploadUrl, {
    method: "POST",
    headers: { "Content-Type": asset.contentType },
    body: bytes,
  });
  if (!response.ok) {
    throw new Error("Upload failed for " + task.assetKey + " with HTTP " + response.status + ".");
  }
  const body = await response.json();
  if (typeof body.storageId !== "string") {
    throw new Error("Convex did not return a storage ID for " + task.assetKey + ".");
  }
  const row = [[task.seedKey, task.mediaId, body.storageId]];
  runConvex("demoSeed:attachDemoUploads", { uploads: row });
}

runConvex("demoSeed:finishDemoData", {});
const summary = runConvex("demoSeed:demoDataSummary", {});
console.log(
  "Development demo data ready: " +
    summary.profiles +
    " profiles, " +
    summary.posts +
    " posts, " +
    summary.likes +
    " likes, " +
    summary.comments +
    " comments, and " +
    summary.follows +
    " follows.",
);