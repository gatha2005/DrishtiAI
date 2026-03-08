/**
 * SENTINEL Backend — Calls your Google Colab GPU API
 *
 * Setup:
 * 1. Open sentinel_image_api.ipynb in Google Colab
 * 2. Runtime → Change runtime type → T4 GPU → Save
 * 3. Run all cells (Ctrl+F9)
 * 4. Copy the ngrok URL from the last cell output
 * 5. Paste it below as COLAB_URL
 * 6. Run: node backend.js
 */

import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;
const CACHE_FILE = path.join(__dir, "sentinel-cache.json");
const CONFIG_FILE = path.join(__dir, "colab-url.txt");

// ── Read Colab URL (from file or env) ──────────────────────
function getColabUrl() {
  try {
    const url = fs.readFileSync(CONFIG_FILE, "utf8").trim();
    if (url.startsWith("http")) return url;
  } catch {}
  try {
    const env = fs.readFileSync(path.join(__dir, ".env"), "utf8");
    return env.match(/COLAB_URL=(.+)/)?.[1]?.trim() || null;
  } catch {}
  return null;
}

// ── Cache ───────────────────────────────────────────────────
function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); }
  catch { return {}; }
}
function saveCache(c) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(c, null, 2));
}

// ── Build prompt ────────────────────────────────────────────
function buildPrompt(items = [], attrs = {}) {
  const TRAITS = {
    hair: { hair1:"short neat hair", hair2:"medium wavy hair", hair3:"long straight hair", hair4:"curly hair", hair5:"bald head", hair6:"spiky hair", hair7:"side-parted hair", hair8:"receding hairline", hair9:"thick bushy hair", hair10:"short cropped hair" },
    eye:  { eyes1:"narrow almond eyes", eyes2:"wide round eyes", eyes3:"deep-set eyes", eyes4:"hooded eyes", eyes5:"large prominent eyes", eyes6:"close-set eyes", eyes7:"heavy-lidded eyes", eyes8:"upturned eyes", eyes9:"downturned eyes", eyes10:"oval eyes" },
    nose: { nose1:"small upturned nose", nose2:"broad wide nose", nose3:"narrow pointed nose", nose4:"bulbous nose", nose5:"straight Roman nose", nose6:"flat nose", nose7:"hooked nose", nose8:"button nose", nose9:"wide-bridged nose", nose10:"long thin nose", nose11:"snub nose" },
    lips: { lip1:"thin lips", lip2:"full thick lips", lip3:"wide lips", lip4:"bow-shaped lips", lip5:"downturned lips", lip6:"upturned lips", lip7:"uneven lips", lip8:"heart-shaped lips", lip9:"pursed lips", lip10:"parted lips", lip11:"narrow lips", lip12:"medium lips" },
    face_structure: { face1:"oval face", face2:"round face", face3:"square jaw", face4:"heart-shaped face", face5:"long narrow face", face6:"wide face", face7:"diamond face", face8:"chubby face", face9:"angular face", face10:"soft rounded face" },
  };
  const ZONE_Y  = { hair:95, eye:205, nose:295, lips:375, face_structure:255 };
  const ZONE_SZ = { hair:140, eye:180, nose:110, lips:130, face_structure:240 };
  const feats = {}, spatial = [];

  items.forEach(item => {
    const src = item.src || "";
    const f = src.includes("/hair/") ? "hair" : src.includes("/eye/") ? "eye"
      : src.includes("/nose/") ? "nose" : src.includes("/lips/") ? "lips"
      : src.includes("/face_structure/") ? "face_structure" : null;
    if (!f) return;
    const name = src.split("/").pop().replace(/\.[^.]+$/, "").toLowerCase();
    if (TRAITS[f]?.[name]) feats[f] = TRAITS[f][name];
    const sRatio = item.size / (ZONE_SZ[f] || item.size);
    const cy = item.y + item.size / 2;
    const vOff = cy - (ZONE_Y[f] || cy);
    if (f === "eye") {
      if (sRatio > 1.25) spatial.push("wide-set eyes");
      else if (sRatio < 0.75) spatial.push("close-set eyes");
      if (vOff < -20) spatial.push("eyes set high"); else if (vOff > 20) spatial.push("eyes set low");
    }
    if (f === "nose" && sRatio > 1.3) spatial.push("very broad nose");
    if (f === "face_structure") {
      if (sRatio > 1.2) spatial.push("broad wide face");
      if (item.y < 80) spatial.push("high forehead");
    }
    if (f === "lips") {
      if (sRatio > 1.25) spatial.push("large full lips");
      else if (sRatio < 0.75) spatial.push("small thin lips");
    }
  });

  const { gender="person", age=30, skinTone="medium", specs=false, scars="", marks="" } = attrs;
  const skinMap = { light:"fair light skin", medium:"medium olive skin", tan:"tan brown skin", dark:"dark brown skin", "very-dark":"very dark skin" };

  return [
    `hyperrealistic portrait photo of a ${gender}`, `${age} years old`,
    skinMap[skinTone] || "medium skin",
    feats.face_structure||"", feats.hair||"", feats.eye||"", feats.nose||"", feats.lips||"",
    ...spatial,
    specs ? "wearing eyeglasses" : "",
    scars ? `scar on ${scars}` : "",
    marks||"",
    "photorealistic, studio lighting, neutral grey background, sharp focus, facing camera, 8k, realistic skin texture",
  ].filter(Boolean).join(", ");
}

// ── Call Colab API ──────────────────────────────────────────
async function generateWithColab(colabUrl, prompt) {
  console.log("[COLAB] Sending request to:", colabUrl);
  console.log("[COLAB] Prompt:", prompt.slice(0, 100) + "...");

  const body = JSON.stringify({
    prompt,
    negative: "cartoon, anime, sketch, drawing, painting, blurry, deformed, ugly, watermark, text, bad anatomy, disfigured",
    steps: 25,
    guidance: 7.5,
    seed: Math.floor(Math.random() * 999999),
  });

  // Parse the colab URL
  const urlObj = new URL(colabUrl + "/generate");
  const isHttps = urlObj.protocol === "https:";
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      port: urlObj.port || (isHttps ? 443 : 80),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 120000, // 2 min — GPU generation can take time
    }, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => {
        console.log("[COLAB] Response status:", res.statusCode);
        try {
          const json = JSON.parse(d);
          if (json.success && json.imageUrl) {
            console.log("[COLAB] ✅ Image received!");
            resolve({ imageUrl: json.imageUrl, model: json.model || "Stable Diffusion (Colab)" });
          } else {
            reject(new Error(json.error || "No image in response"));
          }
        } catch {
          reject(new Error("Bad response from Colab: " + d.slice(0, 100)));
        }
      });
    });

    req.on("error", err => {
      if (err.message.includes("ECONNREFUSED") || err.message.includes("ENOTFOUND")) {
        reject(new Error("Cannot reach Colab. Is the notebook running? Check your ngrok URL."));
      } else {
        reject(err);
      }
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Colab request timed out. GPU may be busy — try again."));
    });

    req.write(body);
    req.end();
  });
}

function readBody(req) {
  return new Promise((res, rej) => {
    let b = "";
    req.on("data", c => b += c);
    req.on("end", () => { try { res(JSON.parse(b)); } catch { rej(new Error("Invalid JSON")); } });
  });
}

// ── Server ──────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  const url = req.url;

  // GET /health
  if (req.method === "GET" && url === "/health") {
    const colabUrl = getColabUrl();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, provider: "Google Colab GPU", colabConnected: !!colabUrl, cached: Object.keys(loadCache()).length }));
    return;
  }

  // POST /set-url  — update colab URL at runtime
  if (req.method === "POST" && url === "/set-url") {
    try {
      const { colabUrl } = await readBody(req);
      fs.writeFileSync(CONFIG_FILE, colabUrl.trim());
      console.log("[CONFIG] Colab URL updated:", colabUrl);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, colabUrl }));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // GET /cache/:hash
  if (req.method === "GET" && url.startsWith("/cache/")) {
    const hash = url.slice(8);
    const cache = loadCache();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(cache[hash] ? { found: true, ...cache[hash] } : { found: false }));
    return;
  }

  // POST /generate
  if (req.method === "POST" && url === "/generate") {
    try {
      const { sketchItems, attrs, hash } = await readBody(req);

      // Cache check
      if (hash) {
        const cache = loadCache();
        if (cache[hash]) {
          console.log("[CACHE HIT]", hash.slice(0, 20));
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, fromCache: true, ...cache[hash] }));
          return;
        }
      }

      const colabUrl = getColabUrl();
      if (!colabUrl) {
        throw new Error(
          "Colab URL not set!\n\n" +
          "1. Open sentinel_image_api.ipynb in Google Colab\n" +
          "2. Runtime → T4 GPU → Run all cells\n" +
          "3. Copy the ngrok URL from output\n" +
          "4. Create colab-url.txt in project root with that URL"
        );
      }

      const prompt = buildPrompt(sketchItems, attrs);
      const result = await generateWithColab(colabUrl, prompt);

      const entry = { ...result, prompt, attrs, generatedAt: new Date().toISOString() };
      if (hash) {
        const cache = loadCache();
        cache[hash] = entry;
        saveCache(cache);
        console.log("[CACHED]", hash.slice(0, 20));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, fromCache: false, ...entry }));

    } catch (err) {
      console.error("\n[ERROR]", err.message, "\n");
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  res.writeHead(404); res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  const colabUrl = getColabUrl();
  console.log(`\n✅  SENTINEL Backend  →  http://localhost:${PORT}`);
  console.log(`    Provider: Google Colab (Free GPU)`);
  console.log(`    Colab:    ${colabUrl ? "✓ " + colabUrl : "✗ Not set — see instructions below"}`);
  console.log(`    Cache:    ${CACHE_FILE}\n`);
  if (!colabUrl) {
    console.log("  ┌─────────────────────────────────────────────┐");
    console.log("  │  HOW TO CONNECT YOUR COLAB GPU:             │");
    console.log("  │                                             │");
    console.log("  │  1. Open sentinel_image_api.ipynb in Colab  │");
    console.log("  │  2. Runtime → Change runtime → T4 GPU       │");
    console.log("  │  3. Run all cells (Ctrl+F9)                 │");
    console.log("  │  4. Copy the ngrok URL from output          │");
    console.log("  │  5. Create colab-url.txt with that URL      │");
    console.log("  │     Example: https://xxxx.ngrok-free.app    │");
    console.log("  └─────────────────────────────────────────────┘\n");
  }
});