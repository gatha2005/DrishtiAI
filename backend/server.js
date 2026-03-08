/**
 * SENTINEL Image API — Standalone Server
 * 
 * Setup (one time):
 *   npm install
 * 
 * Run:
 *   node server.js
 * 
 * Then open: http://localhost:3001
 */

import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT  = 3001;
const CACHE = path.join(__dir, "cache.json");

// ── Read config ─────────────────────────────────────────────
function getConfig() {
  try {
    const env = fs.readFileSync(path.join(__dir, ".env"), "utf8");
    const get = key => env.match(new RegExp(key + "=(.+)"))?.[1]?.trim() || null;
    return {
      colabUrl: get("COLAB_URL"),
    };
  } catch { return {}; }
}

// ── Cache ───────────────────────────────────────────────────
function loadCache() { try { return JSON.parse(fs.readFileSync(CACHE,"utf8")); } catch { return {}; } }
function saveCache(c) { fs.writeFileSync(CACHE, JSON.stringify(c, null, 2)); }

// ── Build prompt ────────────────────────────────────────────
function buildPrompt(items = [], attrs = {}) {
  const TRAITS = {
    hair: { hair1:"short neat hair",hair2:"medium wavy hair",hair3:"long straight hair",hair4:"curly hair",hair5:"bald head",hair6:"spiky hair",hair7:"side-parted hair",hair8:"receding hairline",hair9:"thick bushy hair",hair10:"short cropped hair" },
    eye:  { eyes1:"narrow almond eyes",eyes2:"wide round eyes",eyes3:"deep-set eyes",eyes4:"hooded eyes",eyes5:"large prominent eyes",eyes6:"close-set eyes",eyes7:"heavy-lidded eyes",eyes8:"upturned eyes",eyes9:"downturned eyes",eyes10:"oval eyes" },
    nose: { nose1:"small upturned nose",nose2:"broad wide nose",nose3:"narrow pointed nose",nose4:"bulbous nose",nose5:"straight Roman nose",nose6:"flat nose",nose7:"hooked nose",nose8:"button nose",nose9:"wide-bridged nose",nose10:"long thin nose",nose11:"snub nose" },
    lips: { lip1:"thin lips",lip2:"full thick lips",lip3:"wide lips",lip4:"bow-shaped lips",lip5:"downturned lips",lip6:"upturned lips",lip7:"uneven lips",lip8:"heart-shaped lips",lip9:"pursed lips",lip10:"parted lips",lip11:"narrow lips",lip12:"medium lips" },
    face_structure: { face1:"oval face",face2:"round face",face3:"square jaw",face4:"heart-shaped face",face5:"long narrow face",face6:"wide face",face7:"diamond face",face8:"chubby face",face9:"angular face",face10:"soft rounded face" },
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
    const name = src.split("/").pop().replace(/\.[^.]+$/,"").toLowerCase();
    if (TRAITS[f]?.[name]) feats[f] = TRAITS[f][name];
    const sRatio = item.size / (ZONE_SZ[f] || item.size);
    const vOff   = (item.y + item.size/2) - (ZONE_Y[f] || 0);
    if (f==="eye") {
      if (sRatio>1.25) spatial.push("wide-set eyes"); else if (sRatio<0.75) spatial.push("close-set eyes");
      if (vOff<-20) spatial.push("eyes high on face"); else if (vOff>20) spatial.push("eyes low on face");
    }
    if (f==="nose"&&sRatio>1.3) spatial.push("very broad nose");
    if (f==="face_structure") { if(sRatio>1.2) spatial.push("broad wide face"); if(item.y<80) spatial.push("high forehead"); }
    if (f==="lips") { if(sRatio>1.25) spatial.push("large full lips"); else if(sRatio<0.75) spatial.push("small thin lips"); }
    if (f==="hair") { if(sRatio>1.3) spatial.push("voluminous hair"); else if(sRatio<0.75) spatial.push("thin fine hair"); }
  });

  const { gender="person", age=30, skinTone="medium", specs=false, scars="", marks="" } = attrs;
  const skinMap = { light:"fair light skin",medium:"medium olive skin",tan:"tan brown skin",dark:"dark brown skin","very-dark":"very dark skin" };

  // Strong emphasis on bald — repeat it so SD doesn't ignore it
  const hairDesc = feats.hair === "bald head"
    ? "completely bald, shaved head, no hair at all, bald"
    : feats.hair || "";

  // Strong emphasis on glasses — SD often ignores weak hints
  const specsDesc = specs
    ? "wearing prescription eyeglasses, glasses on face, spectacles"
    : "";

  // Negative prompt additions based on attrs
  const negAdditions = [];
  if (feats.hair === "bald head") negAdditions.push("hair");
  if (!specs) negAdditions.push("glasses, eyeglasses, spectacles");

  return {
    prompt: [
      `hyperrealistic portrait photo of a ${gender}`, `${age} years old`,
      skinMap[skinTone]||"medium skin",
      feats.face_structure||"", hairDesc, feats.eye||"", feats.nose||"", feats.lips||"",
      ...spatial,
      specsDesc,
      scars?`visible scar on ${scars}`:"",
      marks||"",
      "photorealistic, studio lighting, neutral grey background, sharp focus, facing camera, 8k, realistic skin texture",
    ].filter(Boolean).join(", "),
    negative: [
      "cartoon, anime, sketch, drawing, blurry, deformed, ugly, watermark, text, bad anatomy",
      ...negAdditions,
    ].filter(Boolean).join(", "),
  };
}



// ── Provider: Google Colab GPU ──────────────────────────────
async function generateColab(colabUrl, prompt, negative) {
  console.log("[COLAB] Calling:", colabUrl);
  const neg = negative || "cartoon, anime, sketch, blurry, deformed, ugly, watermark";
  const body = JSON.stringify({ prompt, negative: neg, steps:25, guidance:7.5, seed:Math.floor(Math.random()*999999) });
  const u = new URL(colabUrl + "/generate");
  const lib = u.protocol==="https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request({ hostname:u.hostname, path:u.pathname, port:u.port||(u.protocol==="https:"?443:80), method:"POST", headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(body)}, timeout:120000 }, res => {
      let d=""; res.on("data",c=>d+=c);
      res.on("end",()=>{
        try {
          const j=JSON.parse(d);
          if(j.success&&j.imageUrl) resolve({imageUrl:j.imageUrl, model:j.model||"Stable Diffusion (Colab)"});
          else reject(new Error(j.error||"No image"));
        } catch { reject(new Error("Bad response: "+d.slice(0,100))); }
      });
    });
    req.on("error", err=>reject(new Error("Colab unreachable: "+err.message)));
    req.on("timeout", ()=>{ req.destroy(); reject(new Error("Colab timed out")); });
    req.write(body); req.end();
  });
}

// ── HTTP helpers ─────────────────────────────────────────────
function post(host, urlPath, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname:host, path:urlPath, method:"POST", headers:{...headers,"Content-Length":Buffer.byteLength(body)}, timeout:60000 }, r => {
      let d=""; r.on("data",c=>d+=c); r.on("end",()=>resolve({ok:r.statusCode<300,status:r.statusCode,body:d}));
    });
    req.on("error",reject); req.on("timeout",()=>{req.destroy();reject(new Error("Timeout"));}); req.write(body); req.end();
  });
}
function readBody(req) {
  return new Promise((res,rej)=>{ let b=""; req.on("data",c=>b+=c); req.on("end",()=>{ try{res(JSON.parse(b));}catch{rej(new Error("Invalid JSON"));} }); });
}

// ── Main generate function — tries all providers ─────────────
async function generate(items, attrs) {
  const cfg = getConfig();
  const { prompt, negative } = buildPrompt(items, attrs);
  console.log("\n[PROMPT]", prompt.slice(0, 150) + "...");
  console.log("[NEGATIVE]", negative);

  if (cfg.colabUrl) {
    try { return await generateColab(cfg.colabUrl, prompt, negative); }
    catch (e) { console.log("[COLAB] Failed:", e.message, "→ check COLAB_URL in .env"); }
  }

  throw new Error("Colab not running. Add COLAB_URL to .env and start node server.js");
}

// ── Serve dashboard HTML ─────────────────────────────────────
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SENTINEL API</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#040608;color:#d4e8f5;font-family:'Courier New',monospace;padding:40px;min-height:100vh}
  h1{color:#00e5a0;letter-spacing:4px;font-size:22px;margin-bottom:6px}
  .sub{color:#3a5570;font-size:12px;margin-bottom:40px;letter-spacing:2px}
  .card{background:#080c10;border:1px solid #1e2d3d;border-radius:8px;padding:24px;margin-bottom:20px}
  .card h2{font-size:12px;letter-spacing:3px;color:#6b8ca8;margin-bottom:16px}
  .status{display:flex;align-items:center;gap:10px;margin-bottom:12px}
  .dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
  .green{background:#00e5a0} .red{background:#ff3b4e} .amber{background:#f5a623}
  label{display:block;font-size:10px;color:#3a5570;letter-spacing:1.5px;margin-bottom:6px;margin-top:14px}
  input,textarea{width:100%;background:#060a0e;border:1px solid #1e2d3d;border-radius:4px;color:#d4e8f5;font-family:'Courier New',monospace;font-size:12px;padding:10px;outline:none}
  input:focus,textarea:focus{border-color:#2196f3}
  textarea{height:80px;resize:vertical}
  button{margin-top:14px;padding:10px 20px;background:rgba(33,150,243,0.1);border:1px solid rgba(33,150,243,0.4);border-radius:4px;color:#2196f3;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;cursor:pointer;font-weight:700}
  button:hover{background:rgba(33,150,243,0.2)}
  button.green-btn{background:rgba(0,229,160,0.1);border-color:rgba(0,229,160,0.4);color:#00e5a0}
  .result{margin-top:16px;padding:12px;background:#060a0e;border-radius:4px;border:1px solid #1e2d3d;font-size:11px;color:#6b8ca8;white-space:pre-wrap;word-break:break-all;max-height:200px;overflow-y:auto}
  .img-wrap{margin-top:16px;text-align:center}
  .img-wrap img{max-width:100%;border-radius:6px;border:1px solid #1e2d3d}
  .endpoints{display:grid;gap:8px}
  .ep{display:flex;gap:10px;align-items:center;padding:8px 12px;background:#060a0e;border-radius:4px;border:1px solid #1e2d3d}
  .method{font-size:10px;padding:2px 8px;border-radius:3px;font-weight:700;flex-shrink:0}
  .get{background:rgba(0,229,160,0.1);color:#00e5a0;border:1px solid rgba(0,229,160,0.3)}
  .post-m{background:rgba(33,150,243,0.1);color:#2196f3;border:1px solid rgba(33,150,243,0.3)}
  .ep-path{font-size:11px;color:#6b8ca8}
  .ep-desc{font-size:10px;color:#2a3d50;margin-left:auto}
</style>
</head>
<body>
<h1>⬡ SENTINEL IMAGE API</h1>
<div class="sub">STANDALONE FACE GENERATION SERVER · PORT 3001</div>

<div class="card">
  <h2>SERVER STATUS</h2>
  <div class="status"><div class="dot green" id="dot"></div><span id="status-text">Checking...</span></div>
  <div class="status"><div class="dot amber" id="provider-dot"></div><span id="provider-text">Loading...</span></div>
  <div class="status"><div class="dot" id="cache-dot" style="background:#3a5570"></div><span id="cache-text">Cache: ...</span></div>
</div>

<div class="card">
  <h2>TEST FACE GENERATION</h2>
  <label>PROMPT</label>
  <textarea id="prompt">hyperrealistic portrait photo of a man, 30 years old, medium olive skin, square jaw, short neat hair, wide round eyes, straight Roman nose, medium lips, photorealistic, studio lighting, neutral grey background, 8k</textarea>
  <button class="green-btn" onclick="testGenerate()">▶ GENERATE TEST FACE</button>
  <div class="result" id="gen-result" style="display:none"></div>
  <div class="img-wrap" id="img-wrap" style="display:none"><img id="gen-img" src="" alt="Generated face"></div>
</div>

<div class="card">
  <h2>UPDATE COLAB URL</h2>
  <label>PASTE YOUR NGROK URL FROM GOOGLE COLAB</label>
  <input type="text" id="colab-url" placeholder="https://xxxx.ngrok-free.app">
  <button onclick="setColabUrl()">💾 SAVE URL</button>
  <div class="result" id="url-result" style="display:none"></div>
</div>

<div class="card">
  <h2>API ENDPOINTS</h2>
  <div class="endpoints">
    <div class="ep"><span class="method get">GET</span><span class="ep-path">/health</span><span class="ep-desc">Server status</span></div>
    <div class="ep"><span class="method post-m">POST</span><span class="ep-path">/generate</span><span class="ep-desc">Generate face image</span></div>
    <div class="ep"><span class="method get">GET</span><span class="ep-path">/cache/:hash</span><span class="ep-desc">Check cache</span></div>
    <div class="ep"><span class="method post-m">POST</span><span class="ep-path">/set-url</span><span class="ep-desc">Update Colab URL</span></div>
  </div>
</div>

<script>
async function checkHealth() {
  try {
    const r = await fetch('/health').then(r=>r.json());
    document.getElementById('status-text').textContent = 'Server running · Port 3001';
    document.getElementById('provider-text').textContent = 'Provider: ' + (r.provider||'Not configured');
    document.getElementById('provider-dot').className = 'dot ' + (r.colabConnected ? 'green' : 'red');
    document.getElementById('cache-text').textContent = 'Cache: ' + (r.cached||0) + ' saved images';
  } catch {
    document.getElementById('status-text').textContent = 'Error connecting';
    document.getElementById('dot').className = 'dot red';
  }
}

async function testGenerate() {
  const prompt = document.getElementById('prompt').value;
  const el = document.getElementById('gen-result');
  const wrap = document.getElementById('img-wrap');
  el.style.display='block'; el.textContent='Generating... please wait (5-30 seconds)';
  wrap.style.display='none';
  try {
    const r = await fetch('/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,sketchItems:[],attrs:{gender:'man',age:30,skinTone:'medium'},hash:null})}).then(r=>r.json());
    if(r.success) {
      el.textContent = '✅ Success! Model: ' + r.model + '\\nGenerated: ' + r.generatedAt;
      document.getElementById('gen-img').src = r.imageUrl;
      wrap.style.display='block';
    } else {
      el.textContent = '❌ Error: ' + r.error;
    }
  } catch(e) { el.textContent = '❌ ' + e.message; }
}

async function setColabUrl() {
  const url = document.getElementById('colab-url').value.trim();
  const el = document.getElementById('url-result');
  el.style.display='block'; el.textContent='Saving...';
  try {
    const r = await fetch('/set-url',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({colabUrl:url})}).then(r=>r.json());
    el.textContent = r.ok ? '✅ Saved! Restart node server.js to apply.' : '❌ ' + r.error;
  } catch(e) { el.textContent = '❌ ' + e.message; }
}

checkHealth();
</script>
</body>
</html>`;

// ── HTTP Server ──────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  const url = req.url;

  // Dashboard
  if (req.method === "GET" && (url === "/" || url === "/dashboard")) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(DASHBOARD_HTML);
    return;
  }

  // Health
  if (req.method === "GET" && url === "/health") {
    const cfg = getConfig();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok:true, provider: cfg.colabUrl ? 'Google Colab GPU' : 'Not configured', colabConnected:!!cfg.colabUrl, cached:Object.keys(loadCache()).length }));
    return;
  }

  // Cache check
  if (req.method === "GET" && url.startsWith("/cache/")) {
    const hash = url.slice(8);
    const cache = loadCache();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(cache[hash] ? { found:true,...cache[hash] } : { found:false }));
    return;
  }

  // Set Colab URL
  if (req.method === "POST" && url === "/set-url") {
    try {
      const { colabUrl } = await readBody(req);
      // Update .env
      let env = "";
      try { env = fs.readFileSync(path.join(__dir,".env"),"utf8"); } catch {}
      if (env.includes("COLAB_URL=")) {
        env = env.replace(/COLAB_URL=.+/, `COLAB_URL=${colabUrl}`);
      } else {
        env += `\nCOLAB_URL=${colabUrl}`;
      }
      fs.writeFileSync(path.join(__dir,".env"), env.trim());
      console.log("[CONFIG] Colab URL saved:", colabUrl);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok:true, colabUrl }));
    } catch(e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok:false, error:e.message }));
    }
    return;
  }

  // Generate
  if (req.method === "POST" && url === "/generate") {
    try {
      const { sketchItems=[], attrs={}, hash } = await readBody(req);

      if (hash) {
        const cache = loadCache();
        if (cache[hash]) {
          console.log("[CACHE HIT]", hash.slice(0,20));
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success:true, fromCache:true,...cache[hash] }));
          return;
        }
      }

      const result = await generate(sketchItems, attrs);
      const { prompt } = buildPrompt(sketchItems, attrs);
      const entry = { ...result, prompt, attrs, generatedAt:new Date().toISOString() };

      if (hash) { const c=loadCache(); c[hash]=entry; saveCache(c); }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success:true, fromCache:false,...entry }));

    } catch(err) {
      console.error("\n[ERROR]", err.message, "\n");
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success:false, error:err.message }));
    }
    return;
  }

  res.writeHead(404); res.end(JSON.stringify({ error:"Not found" }));
});

server.listen(PORT, () => {
  const cfg = getConfig();
  console.log(`\n✅  SENTINEL Image API  →  http://localhost:${PORT}`);
  console.log(`    Dashboard:  http://localhost:${PORT}/`);
  console.log(`    Provider:   ${cfg.colabUrl ? "✓ Colab — "+cfg.colabUrl.slice(0,40) : "✗ None — configure .env"}`);
  console.log(`    Cache:      ${CACHE}\n`);
  if (!cfg.colabUrl) {
    console.log("  Add to .env one of:");
    console.log("    COLAB_URL=https://...    (from Colab notebook)\n");
  }
});