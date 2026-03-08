import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PORT = 3001;
const HORDE_KEY = "0000000000";
const __dir = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dir, "sentinel-cache.json");

// ── Cache file helpers ──────────────────────────────────────
function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); }
  catch { return {}; }
}
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// ── Route handler ───────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ── GET /cache/retrieve?hash=xxx ──────────────────────────
  if (req.method === "GET" && url.pathname === "/cache/retrieve") {
    const hash = url.searchParams.get("hash");
    const cache = loadCache();
    if (hash && cache[hash]) {
      console.log(`[CACHE] HIT: ${hash.slice(0, 20)}...`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ found: true, data: cache[hash] }));
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ found: false }));
    }
    return;
  }

  // ── GET /cache/list ───────────────────────────────────────
  if (req.method === "GET" && url.pathname === "/cache/list") {
    const cache = loadCache();
    const entries = Object.entries(cache).map(([hash, data]) => ({
      hash, prompt: data.prompt, attrs: data.attrs,
      generatedAt: data.generatedAt, model: data.model,
      imageUrl: data.imageUrl?.slice(0, 60) + "...",
    }));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ count: entries.length, entries }));
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(404); res.end(JSON.stringify({ error: "Not found" })); return;
  }

  let body = "";
  req.on("data", c => (body += c));
  req.on("end", async () => {
    try {
      const payload = JSON.parse(body);

      // ── POST /cache/store ───────────────────────────────────
      if (url.pathname === "/cache/store") {
        const { hash, imageUrl, prompt, attrs, model } = payload;
        const cache = loadCache();
        cache[hash] = { imageUrl, prompt, attrs, model, generatedAt: new Date().toISOString() };
        saveCache(cache);
        console.log(`[CACHE] STORED: ${hash.slice(0, 20)}... (total: ${Object.keys(cache).length})`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // ── POST /generate ──────────────────────────────────────
      if (url.pathname === "/generate") {
        const { base64, prompt, negPrompt, strength } = payload;
        console.log(`\n[GEN] Prompt: ${prompt.slice(0, 100)}...`);

        const submitData = JSON.stringify({
          prompt: `${prompt} ### ${negPrompt}`,
          params: {
            sampler_name: "k_euler_a", cfg_scale: 7.5,
            denoising_strength: strength || 0.6,
            seed: String(Math.floor(Math.random() * 999999)),
            height: 512, width: 512, steps: 30, n: 1,
            control_type: "hed",
            controlnet_conditioning_scale: 0.9,
            image_is_control: false, return_control_map: false,
          },
          source_image: base64,
          source_processing: "img2img",
          models: ["Realistic Vision", "Deliberate", "dreamshaper"],
          r2: false, trusted_workers: false,
        });

        const submitRes = await httpsPost(
          "stablehorde.net", "/api/v2/generate/async",
          { "Content-Type": "application/json", apikey: HORDE_KEY, "Client-Agent": "sentinel:1.0" },
          submitData
        );
        if (!submitRes.ok) throw new Error(`Horde submit: ${submitRes.status} ${submitRes.body}`);

        const { id } = JSON.parse(submitRes.body);
        console.log(`[GEN] Job ID: ${id}`);

        let elapsed = 0;
        while (true) {
          await sleep(4000); elapsed += 4;
          const chk = JSON.parse((await httpsGet("stablehorde.net",
            `/api/v2/generate/check/${id}`, { apikey: HORDE_KEY, "Client-Agent": "sentinel:1.0" })).body);
          if (chk.faulted) throw new Error("Horde faulted");
          if (chk.done) { console.log(`[GEN] Done in ${elapsed}s`); break; }
          if (elapsed > 180) throw new Error("Timeout");
          console.log(`[GEN] ${elapsed}s | queue:${chk.waiting}`);
        }

        const st = JSON.parse((await httpsGet("stablehorde.net",
          `/api/v2/generate/status/${id}`, { apikey: HORDE_KEY, "Client-Agent": "sentinel:1.0" })).body);
        const img = st.generations?.[0]?.img;
        if (!img) throw new Error("No image");

        const imageUrl = img.startsWith("data:") ? img : `data:image/webp;base64,${img}`;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, imageUrl, model: st.generations?.[0]?.model || "SD" }));
        return;
      }

      res.writeHead(404); res.end(JSON.stringify({ error: "Unknown route" }));

    } catch (err) {
      console.error(`[ERROR] ${err.message}`);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

function httpsPost(host, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: host, path, method: "POST", headers: { ...headers, "Content-Length": Buffer.byteLength(body) } },
      res => { let d = ""; res.on("data", c => d += c); res.on("end", () => resolve({ ok: res.statusCode < 300, status: res.statusCode, body: d })); }
    );
    req.on("error", reject); req.write(body); req.end();
  });
}
function httpsGet(host, path, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: host, path, method: "GET", headers },
      res => { let d = ""; res.on("data", c => d += c); res.on("end", () => resolve({ ok: res.statusCode < 300, status: res.statusCode, body: d })); }
    );
    req.on("error", reject); req.end();
  });
}

server.listen(PORT, () => {
  console.log(`\n✅  SENTINEL Proxy  →  http://localhost:${PORT}`);
  console.log(`    Routes: /generate  /cache/store  /cache/retrieve  /cache/list`);
  console.log(`    Cache:  ${CACHE_FILE}\n`);
});