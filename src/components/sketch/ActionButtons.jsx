import { useState } from "react";
import html2canvas from "html2canvas";

const PROXY = "http://localhost:3001";

const TRAITS = {
  hair: { hair1:"short neat hair",hair2:"medium wavy hair",hair3:"long straight hair",hair4:"curly hair",hair5:"bald head",hair6:"spiky hair",hair7:"side-parted hair",hair8:"receding hairline",hair9:"thick bushy hair",hair10:"short cropped hair" },
  eye:  { eyes1:"narrow almond eyes",eyes2:"wide round eyes",eyes3:"deep-set eyes",eyes4:"hooded eyes",eyes5:"large prominent eyes",eyes6:"close-set eyes",eyes7:"heavy-lidded eyes",eyes8:"upturned eyes",eyes9:"downturned eyes",eyes10:"oval eyes" },
  nose: { nose1:"small upturned nose",nose2:"broad wide nose",nose3:"narrow pointed nose",nose4:"bulbous nose",nose5:"straight Roman nose",nose6:"flat nose",nose7:"hooked nose",nose8:"button nose",nose9:"wide-bridged nose",nose10:"long thin nose",nose11:"snub nose" },
  lips: { lip1:"thin lips",lip2:"full thick lips",lip3:"wide lips",lip4:"bow-shaped lips",lip5:"downturned lips",lip6:"upturned lips",lip7:"uneven lips",lip8:"heart-shaped lips",lip9:"pursed lips",lip10:"parted lips",lip11:"narrow lips",lip12:"medium lips" },
  face_structure: { face1:"oval face",face2:"round face",face3:"square jaw",face4:"heart-shaped face",face5:"long narrow face",face6:"wide face",face7:"diamond face",face8:"chubby face",face9:"angular face",face10:"soft rounded face" },
};

function getFolder(src) {
  if (!src) return null;
  if (src.includes("/hair/"))           return "hair";
  if (src.includes("/eye/"))            return "eye";
  if (src.includes("/nose/"))           return "nose";
  if (src.includes("/lips/"))           return "lips";
  if (src.includes("/face_structure/")) return "face_structure";
  return null;
}

function analyzeCoords(items) {
  const ZONE_Y  = { hair:95, eye:205, nose:295, lips:375, face_structure:255 };
  const ZONE_SZ = { hair:140, eye:180, nose:110, lips:130, face_structure:240 };
  const notes = [];
  items.forEach(item => {
    const f = getFolder(item.src);
    if (!f) return;
    const cy     = item.y + item.size / 2;
    const vOff   = cy - (ZONE_Y[f] || cy);
    const sRatio = item.size / (ZONE_SZ[f] || item.size);
    if (f === "eye") {
      if (sRatio > 1.25)  notes.push("wide-set eyes");
      else if (sRatio < 0.75) notes.push("close-set eyes");
      if (vOff < -20)     notes.push("eyes high on face");
      else if (vOff > 20) notes.push("eyes low on face");
    }
    if (f === "nose") {
      if (sRatio > 1.3)   notes.push("very broad nose");
      else if (sRatio < 0.75) notes.push("very narrow nose");
    }
    if (f === "face_structure") {
      if (sRatio > 1.2)   notes.push("broad wide face");
      else if (sRatio < 0.84) notes.push("narrow slim face");
      if (item.y < 80)    notes.push("high forehead");
    }
    if (f === "lips") {
      if (sRatio > 1.25)  notes.push("large prominent lips");
      else if (sRatio < 0.75) notes.push("small thin lips");
    }
    if (f === "hair") {
      if (sRatio > 1.3)   notes.push("very voluminous hair");
      else if (sRatio < 0.75) notes.push("fine thin hair");
    }
  });
  return [...new Set(notes)];
}

function buildPrompt(items, attrs) {
  const { gender="person", age=30, skinTone="medium", specs=false, scars="", marks="" } = attrs;
  const feats = {};
  items.forEach(item => {
    const f = getFolder(item.src);
    const name = item.src.split("/").pop().replace(/\.[^.]+$/, "").toLowerCase();
    if (f && TRAITS[f]?.[name]) feats[f] = TRAITS[f][name];
  });
  const spatial = analyzeCoords(items);
  const skinMap = { light:"fair light skin", medium:"medium olive skin", tan:"tan brown skin", dark:"dark brown skin", "very-dark":"very dark skin" };
  return [
    `hyperrealistic portrait photo of a ${gender}`,
    age ? `${age} years old` : "",
    skinMap[skinTone] || "",
    feats.face_structure || "", feats.hair || "", feats.eye || "", feats.nose || "", feats.lips || "",
    ...spatial,
    specs ? "wearing eyeglasses" : "",
    scars ? `visible scar on ${scars}` : "",
    marks || "",
    "detailed realistic skin, professional studio lighting, neutral grey background, sharp focus, facing camera, 8k photo",
  ].filter(Boolean).join(", ");
}

function hashSketch(items, attrs) {
  const k = items.map(i => `${getFolder(i.src)}:${i.src.split("/").pop()}:${Math.round(i.x/10)},${Math.round(i.y/10)},${Math.round(i.size/10)}`).sort().join("|");
  return btoa(k + JSON.stringify(attrs)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 40);
}

const SKIN_TONES = [
  { k:"light", hex:"#f5d5b0" }, { k:"medium", hex:"#c68642" },
  { k:"tan",   hex:"#8d5524" }, { k:"dark",   hex:"#5c3317" }, { k:"very-dark", hex:"#2c1503" },
];
const DEFAULT_ATTRS = { gender:"", age:30, skinTone:"medium", specs:false, scars:"", marks:"" };

export default function ActionButtons({ sketchItems = [] }) {
  const [generating, setGenerating] = useState(false);
  const [genStatus,  setGenStatus]  = useState("");
  const [modal,      setModal]      = useState(null);
  const [imgLoaded,  setImgLoaded]  = useState(false);
  const [imgError,   setImgError]   = useState(false);
  const [result,     setResult]     = useState(null);
  const [attrs,      setAttrs]      = useState(DEFAULT_ATTRS);
  const [showAttrs,  setShowAttrs]  = useState(true);
  const set = (k, v) => setAttrs(p => ({ ...p, [k]: v }));

  const captureCanvas = async () => {
    const el = document.querySelector(".canvas");
    if (!el) throw new Error("Canvas not found");
    const c = await html2canvas(el, { backgroundColor: "#ffffff" });
    const dataUrl = c.toDataURL("image/png");
    return { dataUrl, base64: dataUrl.split(",")[1] };
  };

  const handleGenerate = async () => {
    if (sketchItems.length === 0) { alert("Add facial components to the canvas first."); return; }
    if (!attrs.gender) { alert("Please select gender in Suspect Attributes below."); return; }
    setGenerating(true); setImgLoaded(false); setImgError(false); setResult(null); setModal(null);
    try {
      const hash = hashSketch(sketchItems, attrs);
      setGenStatus("Checking cached images...");
      try {
        const chk = await fetch(`${PROXY}/cache/${hash}`);
        const cached = await chk.json();
        if (cached.found) { setResult({ ...cached, fromCache: true }); setModal("realface"); return; }
      } catch { /* backend offline */ }
      setGenStatus("Capturing sketch...");
      const { base64 } = await captureCanvas();
      setGenStatus("Converting sketch to real face... (15-30s)");
      const res = await fetch(`${PROXY}/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, sketchItems, attrs, hash }),
      });
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Generation failed");
      setResult({ ...data, fromCache: false });
      setModal("realface");
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("fetch") || msg.includes("Failed to fetch")) {
        alert("Backend not running.\n\nRun in a terminal:\n  node backend.js");
      } else if (msg.includes("REPLICATE")) {
        alert("No API key.\n\nAdd to .env:\n  REPLICATE_API_KEY=r8_your_key\n\nGet free key at replicate.com");
      } else { alert("Error: " + msg); }
    } finally { setGenerating(false); setGenStatus(""); }
  };

  const handleSave = async () => {
    try { const { dataUrl } = await captureCanvas(); const a = document.createElement("a"); a.download = `sketch_${Date.now()}.png`; a.href = dataUrl; a.click(); }
    catch (e) { alert("Save failed: " + e.message); }
  };

  const handleSubmit = async () => {
    try {
      const { dataUrl } = await captureCanvas();
      const caseId = `CASE-${Date.now().toString().slice(-6)}`;
      const record = { id: `REC-${Date.now()}`, subject: `Unknown ${attrs.gender === "man" ? "Male" : "Female"}, ~${attrs.age}yr`, caseId, date: new Date().toISOString().slice(0,10), status: "Submitted", sketchUrl: dataUrl, generatedUrl: result?.imageUrl || null, attributes: attrs };
      const prev = JSON.parse(localStorage.getItem("sentinel_cases") || "[]");
      localStorage.setItem("sentinel_cases", JSON.stringify([record, ...prev]));
      alert(`Case ${caseId} submitted!`);
    } catch (e) { alert("Submit failed: " + e.message); }
  };

  const coordNotes    = analyzeCoords(sketchItems);
  const placedFeats   = [...new Set(sketchItems.map(i => getFolder(i.src)).filter(Boolean))];
  const promptPreview = sketchItems.length > 0 ? buildPrompt(sketchItems, attrs) : "";

  return (
    <>
      <div style={s.panel}>
        <div style={s.panelHdr} onClick={() => setShowAttrs(v => !v)}>
          <span style={s.panelTitle}>👤 SUSPECT ATTRIBUTES</span>
          <div style={s.tagRow2}>
            {attrs.gender && <Tag c="#2196f3">{attrs.gender.toUpperCase()}</Tag>}
            {attrs.age    && <Tag c="#f5a623">AGE {attrs.age}</Tag>}
            {attrs.specs  && <Tag c="#a855f7">👓 SPECS</Tag>}
            {attrs.scars  && <Tag c="#ff3b4e">SCAR</Tag>}
            {attrs.marks  && <Tag c="#00e5a0">MARK</Tag>}
          </div>
          <span style={{ color:"#3a5570", marginLeft:"auto" }}>{showAttrs ? "▲" : "▼"}</span>
        </div>
        {showAttrs && (
          <div style={s.attrGrid}>
            <div style={s.attrBox}>
              <div style={s.lbl}>GENDER <span style={{ color:"#ff3b4e" }}>*</span></div>
              <div style={s.btnRow}>
                <button style={{ ...s.optBtn, ...(attrs.gender==="man"   ? s.activeM : {}) }} onClick={() => set("gender","man")}>♂ MALE</button>
                <button style={{ ...s.optBtn, ...(attrs.gender==="woman" ? s.activeF : {}) }} onClick={() => set("gender","woman")}>♀ FEMALE</button>
              </div>
            </div>
            <div style={s.attrBox}>
              <div style={s.lbl}>AGE — <b style={{ color:"#f5a623" }}>{attrs.age}</b></div>
              <input type="range" min={10} max={80} value={attrs.age} onChange={e => set("age",+e.target.value)} style={{ width:"100%", accentColor:"#f5a623", cursor:"pointer" }} />
              <div style={s.rangeHints}><span>10</span><span>25</span><span>40</span><span>60</span><span>80</span></div>
            </div>
            <div style={s.attrBox}>
              <div style={s.lbl}>SKIN TONE</div>
              <div style={{ display:"flex", gap:"6px" }}>
                {SKIN_TONES.map(({ k, hex }) => (
                  <button key={k} title={k} onClick={() => set("skinTone",k)} style={{ width:26, height:26, borderRadius:"50%", background:hex, cursor:"pointer", border: attrs.skinTone===k ? "3px solid #f5a623" : "2px solid #1e2d3d" }} />
                ))}
              </div>
            </div>
            <div style={s.attrBox}>
              <div style={s.lbl}>SPECTACLES</div>
              <div style={s.btnRow}>
                <button style={{ ...s.optBtn, ...(attrs.specs===false ? s.activeN : {}) }} onClick={() => set("specs",false)}>✕ NONE</button>
                <button style={{ ...s.optBtn, ...(attrs.specs===true  ? s.activeA : {}) }} onClick={() => set("specs",true)}>👓 YES</button>
              </div>
            </div>
            <div style={s.attrBox}>
              <div style={s.lbl}>SCAR LOCATION</div>
              <select value={attrs.scars} onChange={e => set("scars",e.target.value)} style={s.sel}>
                <option value="">None</option>
                <option value="left cheek">Left Cheek</option>
                <option value="right cheek">Right Cheek</option>
                <option value="forehead">Forehead</option>
                <option value="chin">Chin</option>
                <option value="nose bridge">Nose Bridge</option>
                <option value="near left eye">Near Left Eye</option>
                <option value="upper lip">Upper Lip</option>
              </select>
            </div>
            <div style={s.attrBox}>
              <div style={s.lbl}>DISTINCTIVE MARK</div>
              <select value={attrs.marks} onChange={e => set("marks",e.target.value)} style={s.sel}>
                <option value="">None</option>
                <option value="mole on left cheek">Mole — Left Cheek</option>
                <option value="birthmark on forehead">Birthmark — Forehead</option>
                <option value="tattoo on neck">Tattoo — Neck</option>
                <option value="freckles across nose">Freckles</option>
                <option value="beard stubble">Beard Stubble</option>
                <option value="full thick beard">Full Beard</option>
                <option value="mustache">Mustache</option>
                <option value="deep wrinkles">Deep Wrinkles</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {sketchItems.length > 0 && (
        <div style={s.summaryBar}>
          <span style={s.summaryLbl}>SKETCH</span>
          {placedFeats.map(f => <Tag key={f} c="#00e5a0">{f.replace("_"," ").toUpperCase()} ✓</Tag>)}
          {coordNotes.map((n,i) => <Tag key={i} c="#f5a623">{n}</Tag>)}
        </div>
      )}

      <div style={{ ...s.row, marginTop:"8px" }}>
        <button style={{ ...s.btn, ...s.blue }} onClick={handleGenerate} disabled={generating}>
          {generating ? <Spin color="#a855f7" text={genStatus || "GENERATING..."} /> : "✦ GENERATE FACE"}
        </button>
        <button style={{ ...s.btn, ...s.amber }} onClick={handleSave}>↓ SAVE SKETCH</button>
        <button style={{ ...s.btn, ...s.green }} onClick={handleSubmit}>✓ SUBMIT CASE</button>
      </div>

      {promptPreview && (
        <div style={s.promptBox}>
          <div style={s.lbl}>PROMPT PREVIEW</div>
          <div style={s.promptTxt}>{promptPreview}</div>
        </div>
      )}

      {modal === "realface" && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.mHdr}>
              <span style={s.mTitle}><Dot c="#a855f7" /> GENERATED SUSPECT FACE {result?.fromCache && <span style={s.cacheBadge}>⚡ CACHED</span>}</span>
              <button style={s.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={s.tagRow}>
              {attrs.gender && <Tag c="#2196f3">{attrs.gender.toUpperCase()}</Tag>}
              {attrs.age    && <Tag c="#f5a623">~{attrs.age} YRS</Tag>}
              {attrs.specs  && <Tag c="#a855f7">👓 SPECTACLES</Tag>}
              {attrs.scars  && <Tag c="#ff3b4e">SCAR: {attrs.scars.toUpperCase()}</Tag>}
              {attrs.marks  && <Tag c="#00e5a0">{attrs.marks.toUpperCase()}</Tag>}
            </div>
            <div style={s.imgWrap}>
              {!imgLoaded && !imgError && <div style={s.skeleton}><span style={s.spinLg} /><div style={s.skelTxt}>GENERATING FACE...</div><div style={s.skelSub}>Please wait 15–30 seconds</div></div>}
              {imgError && <div style={s.skeleton}><div style={{ fontSize:"32px" }}>⚠</div><div style={{ ...s.skelTxt, color:"#ff3b4e" }}>FAILED TO LOAD</div></div>}
              {result?.imageUrl && <img src={result.imageUrl} alt="face" style={{ ...s.img, display: imgLoaded ? "block" : "none" }} onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} />}
              <div style={s.imgBadge}><Dot c="#a855f7" sz={5} /> {result?.model || "AI GENERATED"}</div>
            </div>
            {result?.prompt && <div style={{ padding:"10px 16px", borderTop:"1px solid #1e2d3d" }}><div style={s.lbl}>PROMPT</div><div style={s.promptTxt}>{result.prompt}</div></div>}
            <div style={s.warning}>⚠ AI-generated for forensic reference only.</div>
            <div style={s.mFoot}>
              <button style={{ ...s.btn, ...s.amber, flex:1 }} onClick={() => { const a = document.createElement("a"); a.download=`face_${Date.now()}.png`; a.href=result?.imageUrl; a.click(); }}>↓ SAVE</button>
              <button style={{ ...s.btn, ...s.purple, flex:1 }} onClick={() => { setModal(null); setTimeout(handleGenerate,100); }}>↺ REGENERATE</button>
              <button style={{ ...s.btn, ...s.green, flex:1 }} onClick={() => { handleSubmit(); setModal(null); }}>✓ SUBMIT</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Tag({ c, children }) {
  return <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px", padding:"2px 7px", borderRadius:"3px", background:`${c}15`, border:`1px solid ${c}33`, color:c }}>{children}</span>;
}
function Dot({ c, sz=8 }) {
  return <span style={{ width:sz, height:sz, borderRadius:"50%", background:c, display:"inline-block", flexShrink:0 }} />;
}
function Spin({ color, text }) {
  return <span style={{ display:"flex", alignItems:"center", gap:"7px" }}><span style={{ width:12, height:12, border:`2px solid ${color}44`, borderTop:`2px solid ${color}`, borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block" }} /><span style={{ fontFamily:"var(--font-mono)", fontSize:"10px" }}>{text}</span></span>;
}

const s = {
  row:{ display:"flex", gap:"8px", flexWrap:"wrap" },
  btn:{ padding:"10px 14px", border:"1px solid #1e2d3d", borderRadius:"4px", cursor:"pointer", fontFamily:"var(--font-display)", fontSize:"11px", fontWeight:"700", letterSpacing:"1.5px", background:"#080c10", color:"#6b8ca8", transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" },
  blue:{ borderColor:"rgba(33,150,243,0.4)", color:"#2196f3", background:"rgba(33,150,243,0.08)" },
  purple:{ borderColor:"rgba(168,85,247,0.4)", color:"#a855f7", background:"rgba(168,85,247,0.08)" },
  amber:{ borderColor:"rgba(245,166,35,0.4)", color:"#f5a623", background:"rgba(245,166,35,0.08)" },
  green:{ borderColor:"rgba(0,229,160,0.4)", color:"#00e5a0", background:"rgba(0,229,160,0.08)" },
  panel:{ background:"#080c10", border:"1px solid #1e2d3d", borderRadius:"6px", overflow:"hidden", marginBottom:"8px" },
  panelHdr:{ display:"flex", alignItems:"center", gap:"8px", padding:"9px 14px", cursor:"pointer", userSelect:"none" },
  panelTitle:{ fontFamily:"var(--font-display)", fontSize:"11px", fontWeight:"700", letterSpacing:"2px", color:"#d4e8f5", flexShrink:0 },
  attrGrid:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", padding:"10px 14px 14px", borderTop:"1px solid #1e2d3d" },
  attrBox:{ display:"flex", flexDirection:"column", gap:"6px" },
  lbl:{ fontFamily:"var(--font-mono)", fontSize:"9px", color:"#3a5570", letterSpacing:"1.5px" },
  btnRow:{ display:"flex", gap:"6px" },
  optBtn:{ flex:1, padding:"5px 6px", border:"1px solid #1e2d3d", borderRadius:"3px", background:"transparent", color:"#3a5570", fontFamily:"var(--font-mono)", fontSize:"10px", cursor:"pointer" },
  activeM:{ borderColor:"rgba(33,150,243,0.5)", color:"#2196f3", background:"rgba(33,150,243,0.12)" },
  activeF:{ borderColor:"rgba(233,30,99,0.5)", color:"#e91e63", background:"rgba(233,30,99,0.12)" },
  activeN:{ borderColor:"rgba(107,140,168,0.4)", color:"#6b8ca8", background:"rgba(107,140,168,0.1)" },
  activeA:{ borderColor:"rgba(168,85,247,0.5)", color:"#a855f7", background:"rgba(168,85,247,0.12)" },
  rangeHints:{ display:"flex", justifyContent:"space-between", fontFamily:"var(--font-mono)", fontSize:"8px", color:"#2a3d50" },
  sel:{ background:"#060a0e", border:"1px solid #1e2d3d", borderRadius:"3px", color:"#d4e8f5", fontFamily:"var(--font-mono)", fontSize:"10px", padding:"5px 7px", cursor:"pointer", width:"100%" },
  summaryBar:{ display:"flex", flexWrap:"wrap", gap:"5px", alignItems:"center", padding:"5px 0" },
  summaryLbl:{ fontFamily:"var(--font-mono)", fontSize:"9px", color:"#2a3d50", letterSpacing:"1.5px" },
  promptBox:{ background:"rgba(168,85,247,0.04)", border:"1px solid rgba(168,85,247,0.15)", borderRadius:"4px", padding:"8px 12px", marginTop:"6px" },
  promptTxt:{ fontFamily:"var(--font-mono)", fontSize:"10px", color:"#6b8ca8", lineHeight:1.7, marginTop:"4px" },
  tagRow:{ display:"flex", flexWrap:"wrap", gap:"5px", padding:"8px 16px", borderBottom:"1px solid #1e2d3d", background:"#060a0e" },
  tagRow2:{ display:"flex", flexWrap:"wrap", gap:"5px", flex:1 },
  overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(6px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
  modal:{ background:"#0c1118", border:"1px solid #2e4a66", borderRadius:"8px", width:"100%", maxWidth:"580px", maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.9)" },
  mHdr:{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #1e2d3d", position:"sticky", top:0, background:"#0c1118", zIndex:10 },
  mTitle:{ display:"flex", alignItems:"center", gap:"8px", fontFamily:"var(--font-display)", fontSize:"12px", fontWeight:"700", letterSpacing:"2px", color:"#d4e8f5" },
  mFoot:{ display:"flex", gap:"8px", padding:"12px 16px", borderTop:"1px solid #1e2d3d" },
  closeBtn:{ background:"none", border:"none", color:"#3a5570", cursor:"pointer", fontSize:"18px", padding:"2px 8px" },
  cacheBadge:{ marginLeft:"8px", fontFamily:"var(--font-mono)", fontSize:"9px", padding:"2px 6px", borderRadius:"3px", background:"rgba(0,229,160,0.1)", border:"1px solid rgba(0,229,160,0.3)", color:"#00e5a0" },
  imgWrap:{ position:"relative", minHeight:"200px", background:"#060a0e" },
  img:{ width:"100%", display:"block", maxHeight:"500px", objectFit:"contain" },
  imgBadge:{ position:"absolute", bottom:8, left:10, display:"flex", alignItems:"center", gap:"5px", fontFamily:"var(--font-mono)", fontSize:"9px", color:"rgba(168,85,247,0.9)", background:"rgba(0,0,0,0.7)", padding:"3px 8px", borderRadius:"3px" },
  skeleton:{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"260px", padding:"40px" },
  spinLg:{ width:28, height:28, border:"3px solid rgba(168,85,247,0.2)", borderTop:"3px solid #a855f7", borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"block" },
  skelTxt:{ fontFamily:"var(--font-mono)", fontSize:"11px", color:"#6b8ca8", marginTop:"12px", letterSpacing:"1px" },
  skelSub:{ fontFamily:"var(--font-mono)", fontSize:"9px", color:"#2a3d50", marginTop:"4px" },
  warning:{ padding:"8px 16px", fontFamily:"var(--font-mono)", fontSize:"9px", color:"#3a5570", borderTop:"1px solid #1e2d3d" },
};