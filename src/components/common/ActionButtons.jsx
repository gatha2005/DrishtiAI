import { useState } from "react";
import html2canvas from "html2canvas";

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY; // only needed for AI Analysis

export default function ActionButtons() {
  const [aiLoading,   setAiLoading]   = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [modal,       setModal]       = useState(null);
  const [genStatus,   setGenStatus]   = useState("");
  const [controlScale, setControlScale] = useState(0.8);
  const [gender, setGender] = useState("man");

  // ── Capture canvas ─────────────────────────────────────
  const captureCanvas = async () => {
    const canvasEl = document.querySelector(".canvas");
    if (!canvasEl) throw new Error("Canvas not found");
    const captured = await html2canvas(canvasEl, { backgroundColor: "#ffffff" });
    const dataUrl = captured.toDataURL("image/png");
    const base64  = dataUrl.split(",")[1];
    const blob    = await new Promise(res => captured.toBlob(res, "image/png"));
    return { dataUrl, base64, blob };
  };

  // ── Submit to Case (saves to localStorage DB) ─────────
  const handleSubmitToCase = async (sketchUrlOverride, generatedUrlOverride) => {
    try {
      const { dataUrl: sketchUrl } = await captureCanvas();
      const caseId = `CASE-${Date.now().toString().slice(-4)}`;
      const recId  = `REC-${Date.now().toString().slice(-5)}`;
      const record = {
        id: recId,
        subject: "Unknown Suspect",
        caseId,
        date: new Date().toISOString().slice(0, 10),
        status: "Submitted",
        sketchUrl:    sketchUrlOverride || sketchUrl,
        generatedUrl: generatedUrlOverride || modal?.imageUrl || null,
      };
      const existing = JSON.parse(localStorage.getItem("sentinel_cases") || "[]");
      existing.unshift(record);
      localStorage.setItem("sentinel_cases", JSON.stringify(existing));
      alert(`✓ Case ${caseId} submitted to database!\nView it in the Database page.`);
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Failed to submit. Please try again.");
    }
  };

  // ── Save sketch ────────────────────────────────────────
  const handleSave = async () => {
    try {
      const { dataUrl } = await captureCanvas();
      const link = document.createElement("a");
      link.download = `suspect_composite_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  // ── Claude AI Analysis ─────────────────────────────────
  const handleAnalyzeAI = async () => {
    const imgs = document.querySelector(".canvas")?.querySelectorAll("img");
    if (!imgs || imgs.length === 0) {
      alert("Please add facial components to the canvas first.");
      return;
    }
    setAiLoading(true);
    setModal(null);
    try {
      const { base64 } = await captureCanvas();
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/png", data: base64 } },
              { type: "text", text: `You are a forensic sketch analyst. Analyze this facial composite and provide:
1. SUSPECT DESCRIPTION: Detailed police-report style — face shape, eyes, nose, lips, hair, notable features.
2. ENHANCEMENT SUGGESTIONS: 3-5 specific improvements.
Respond ONLY as JSON, no markdown:
{"description":"...","suggestions":["...","...","..."]}` },
            ],
          }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      let parsed = { description: text, suggestions: [] };
      try { parsed = JSON.parse(text.replace(/```json|```/g, "").trim()); } catch {}
      setModal({ type: "analysis", ...parsed });
    } catch (err) {
      setModal({ type: "analysis", description: "Error connecting. Please try again.", suggestions: [] });
    } finally {
      setAiLoading(false);
    }
  };

  // ── Generate Real Face via Stable Horde (free, img2img) ─
  const handleGenerateRealFace = async () => {
    const imgs = document.querySelector(".canvas")?.querySelectorAll("img");
    if (!imgs || imgs.length === 0) {
      alert("Please add facial components to the canvas first.");
      return;
    }

    setFaceLoading(true);
    setGenStatus("Capturing sketch...");
    setModal(null);

    try {
      setGenStatus(`Building ${gender} portrait...`);

      const genderNeg = gender === "man"
        ? "woman, female, girl, feminine"
        : "man, male, boy, masculine";
      const prompt =
        `RAW photo, photorealistic portrait of a ${gender}, detailed face, ` +
        `studio lighting, neutral grey background, sharp focus, 8k, forensic ID photo`;
      const negPrompt =
        `${genderNeg}, cartoon, anime, sketch, drawing, painting, ` +
        `blurry, deformed, ugly, watermark, text, logo`;

      // ── Prodia API — free, no key needed ─────────────────
      setGenStatus("Submitting to Prodia (free)...");
      const jobRes = await fetch("https://api.prodia.com/v1/job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "dreamshaper_8.safetensors [9d40847d]",
          prompt,
          negative_prompt: negPrompt,
          steps: 25,
          cfg_scale: 7,
          seed: Math.floor(Math.random() * 999999),
          width: 512,
          height: 512,
          sampler: "DPM++ 2M Karras",
        }),
      });

      if (!jobRes.ok) throw new Error(`Prodia error: ${jobRes.status}`);
      const { job } = await jobRes.json();
      setGenStatus(`Queued: ${job.slice(0,8)}... · Waiting for GPU...`);

      // ── Poll until done ───────────────────────────────────
      let elapsed = 0;
      while (true) {
        await new Promise(r => setTimeout(r, 3000));
        elapsed += 3;
        const poll = await fetch(`https://api.prodia.com/v1/job/${job}`);
        const data = await poll.json();

        if (data.status === "succeeded") {
          const imageUrl = `https://images.prodia.xyz/${job}.png`;
          setModal({ type: "realface", imageUrl, model: "Prodia · DreamShaper 8", prompt });
          return;
        }
        if (data.status === "failed") throw new Error("Prodia generation failed.");
        if (elapsed > 120) throw new Error("Timed out. Please try again.");
        const pct = Math.min(90, elapsed * 3);
        setGenStatus(`Generating ${gender} face... ${pct}% (${elapsed}s)`);
      }

    } catch (err) {
      console.error("Prodia error:", err);
      // ── Fallback: fetch Pollinations as blob to avoid CORS ─
      try {
        setGenStatus("Trying Pollinations fallback...");
        const seed = Math.floor(Math.random() * 999999);
        const p = encodeURIComponent(
          `photorealistic portrait of a ${gender}, detailed face, ` +
          `studio lighting, neutral grey background, sharp focus, 8k`
        );
        const res = await fetch(
          `https://image.pollinations.ai/prompt/${p}?width=512&height=512&seed=${seed}&model=flux&nologo=true`
        );
        if (!res.ok) throw new Error("Pollinations also failed");
        const blob = await res.blob();
        const imageUrl = URL.createObjectURL(blob);
        setModal({ type: "realface", imageUrl, model: "Pollinations Flux", prompt: `portrait of a ${gender}` });
      } catch {
        setModal({ type: "realface", imageUrl: null, error: `All services unavailable.
Check internet connection and try again.

Error: ${err.message}` });
      }
    } finally {
      setFaceLoading(false);
      setGenStatus("");
    }
  };

    const saveGeneratedFace = (imageUrl) => {
    const link = document.createElement("a");
    link.download = `suspect_generated_${Date.now()}.png`;
    link.href = imageUrl;
    link.click();
  };

  return (
    <>
      {/* ── Buttons ── */}
      <div style={styles.row}>
        <button style={{ ...styles.btn, ...styles.btnBlue }} onClick={handleAnalyzeAI} disabled={aiLoading || faceLoading}>
          {aiLoading ? <Spinner color="#2196f3" text="ANALYZING..." /> : "◈ AI ANALYSIS"}
        </button>

        <button style={{ ...styles.btn, ...styles.btnPurple }} onClick={handleGenerateRealFace} disabled={faceLoading || aiLoading}>
          {faceLoading ? <Spinner color="#a855f7" text="GENERATING..." /> : "✦ GENERATE REAL FACE"}
        </button>

        <button style={{ ...styles.btn, ...styles.btnAmber }} onClick={handleSave}>
          ↓ SAVE
        </button>

        <button style={{ ...styles.btn, ...styles.btnGreen }} onClick={handleSubmitToCase}>
          ✓ SUBMIT TO CASE
        </button>
      </div>

      {/* Gender toggle */}
      <div style={styles.genderRow}>
        <span style={styles.controlLabel}>👤 SUSPECT GENDER:</span>
        <div style={styles.genderToggle}>
          <button
            style={{ ...styles.genderBtn, ...(gender === "man" ? styles.genderBtnActive : {}) }}
            onClick={() => setGender("man")}
            disabled={faceLoading}
          >
            ♂ MALE
          </button>
          <button
            style={{ ...styles.genderBtn, ...(gender === "woman" ? styles.genderBtnActiveF : {}) }}
            onClick={() => setGender("woman")}
            disabled={faceLoading}
          >
            ♀ FEMALE
          </button>
        </div>
      </div>

      {/* ControlNet scale slider */}
      <div style={styles.controlRow}>
        <span style={styles.controlLabel}>
          🎛 SKETCH INFLUENCE: <strong style={{ color: "#a855f7" }}>{Math.round(controlScale * 100)}%</strong>
        </span>
        <input
          type="range"
          min="0.3"
          max="1.0"
          step="0.05"
          value={controlScale}
          onChange={(e) => setControlScale(parseFloat(e.target.value))}
          style={styles.slider}
          disabled={faceLoading}
        />
        <div style={styles.scaleHints}>
          <span>Creative</span>
          <span>Balanced</span>
          <span>Strict</span>
        </div>
      </div>

      {/* Loading banner */}
      {faceLoading && (
        <div style={styles.loadingBanner}>
          <span style={styles.spinnerLg} />
          <div style={{ flex: 1 }}>
            <div style={styles.loadingTitle}>GENERATING PHOTOREALISTIC FACE</div>
            <div style={styles.loadingSubtitle}>{genStatus || "Initializing..."}</div>
            <div style={styles.progressBar}>
              <div style={styles.progressFill} />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Analysis ── */}
      {modal?.type === "analysis" && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}><span style={{ ...styles.dot, background: "#2196f3" }} />AI FORENSIC ANALYSIS</div>
              <button style={styles.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={styles.section}>
              <div style={styles.label}>SUSPECT DESCRIPTION</div>
              <div style={styles.descBox}>{modal.description}</div>
            </div>
            {modal.suggestions?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.label}>ENHANCEMENT SUGGESTIONS</div>
                {modal.suggestions.map((s, i) => (
                  <div key={i} style={styles.suggItem}>
                    <span style={styles.suggNum}>{i + 1}</span>
                    <span style={styles.suggText}>{s}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={styles.modalFooter}>
              <button style={{ ...styles.btn, ...styles.btnPurple, flex: 1 }} onClick={() => { setModal(null); handleGenerateRealFace(); }}>
                ✦ GENERATE REAL FACE
              </button>
              <button style={{ ...styles.btn, flex: 1 }} onClick={() => setModal(null)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Real Face ── */}
      {modal?.type === "realface" && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={{ ...styles.modal, maxWidth: "680px" }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}><span style={{ ...styles.dot, background: "#a855f7" }} />GENERATED SUSPECT FACE</div>
              <button style={styles.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>

            {modal.imageUrl ? (
              <div style={styles.faceBody}>
                <div style={styles.faceImgWrap}>
                  <img
                    src={modal.imageUrl}
                    alt="Generated"
                    style={styles.faceImg}
                    onLoad={(e) => { e.target.style.opacity = 1; }}
                    onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  />
                  <div style={{ display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", gap: "10px", background: "#080c10" }}>
                    <div style={{ fontSize: "28px" }}>⚠</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#ff3b4e" }}>IMAGE FAILED TO LOAD</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570", textAlign: "center" }}>Check internet connection and try regenerating</div>
                  </div>
                  <div style={styles.faceImgLabel}>
                    <span style={styles.dot2} /> AI GENERATED · {modal.model}
                  </div>
                </div>

                {modal.prompt && (
                  <div style={styles.promptBox}>
                    <span style={styles.label}>FACE DESCRIPTION USED</span>
                    <p style={styles.promptText}>{modal.prompt}</p>
                  </div>
                )}

                <div style={styles.warningBox}>
                  ⚠ AI-generated image for forensic reference only. Not a photograph of a real person.
                </div>

                <div style={styles.faceActions}>
                  <button style={{ ...styles.btn, ...styles.btnAmber, flex: 1 }} onClick={() => saveGeneratedFace(modal.imageUrl)}>
                    ↓ SAVE IMAGE
                  </button>
                  <button style={{ ...styles.btn, ...styles.btnPurple, flex: 1 }} onClick={() => { setModal(null); handleGenerateRealFace(); }}>
                    ↺ REGENERATE
                  </button>
                  <button style={{ ...styles.btn, ...styles.btnGreen, flex: 1 }}>
                    ✓ SUBMIT TO CASE
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.errorBody}>
                <div style={{ fontSize: "32px" }}>⚠</div>
                <div style={styles.errorTitle}>Generation Failed</div>
                <div style={styles.errorText}>{modal.error}</div>
                <button style={{ ...styles.btn, ...styles.btnPurple }} onClick={() => { setModal(null); handleGenerateRealFace(); }}>
                  ↺ TRY AGAIN
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Spinner({ color, text }) {
  return (
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
      <span style={{ display: "inline-block", width: "12px", height: "12px", border: `2px solid ${color}44`, borderTopColor: color, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
      {text}
    </span>
  );
}

const styles = {
  row: { display: "flex", gap: "8px", flexWrap: "wrap" },
  btn: { flex: 1, padding: "10px 12px", border: "1px solid #1e2d3d", borderRadius: "4px", background: "transparent", color: "#6b8ca8", fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" },
  btnBlue:   { background: "rgba(33,150,243,0.1)",  borderColor: "rgba(33,150,243,0.35)",  color: "#2196f3" },
  btnPurple: { background: "rgba(168,85,247,0.12)", borderColor: "rgba(168,85,247,0.45)",  color: "#a855f7", boxShadow: "0 0 14px rgba(168,85,247,0.15)" },
  btnAmber:  { background: "rgba(245,166,35,0.1)",  borderColor: "rgba(245,166,35,0.35)",  color: "#f5a623" },
  btnGreen:  { background: "rgba(0,229,160,0.1)",   borderColor: "rgba(0,229,160,0.35)",   color: "#00e5a0" },
  loadingBanner: { display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", marginTop: "10px", background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "4px" },
  spinnerLg: { display: "inline-block", width: "20px", height: "20px", flexShrink: 0, border: "2px solid rgba(168,85,247,0.3)", borderTopColor: "#a855f7", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingTitle: { fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "700", color: "#a855f7", letterSpacing: "2px" },
  loadingSubtitle: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6b8ca8", marginTop: "3px" },
  progressBar: { marginTop: "8px", height: "3px", background: "#1e2d3d", borderRadius: "2px", overflow: "hidden" },
  progressFill: { height: "100%", width: "100%", background: "linear-gradient(90deg, #a855f7, #2196f3, #a855f7)", backgroundSize: "200% 100%", animation: "progressSlide 1.5s linear infinite", borderRadius: "2px" },
  controlRow: { marginTop: "10px", padding: "10px 14px", background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "6px" },
  controlLabel: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#6b8ca8", letterSpacing: "1px" },
  slider: { width: "100%", accentColor: "#a855f7", cursor: "pointer", height: "4px" },
  scaleHints: { display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#3a5570", letterSpacing: "1px" },
  genderRow: { marginTop: "10px", padding: "10px 14px", background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "6px", display: "flex", alignItems: "center", gap: "14px" },
  genderToggle: { display: "flex", gap: "6px" },
  genderBtn: { padding: "6px 18px", background: "transparent", border: "1px solid #1e2d3d", borderRadius: "4px", color: "#3a5570", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer", transition: "all 0.2s" },
  genderBtnActive: { background: "rgba(33,150,243,0.15)", border: "1px solid rgba(33,150,243,0.5)", color: "#2196f3" },
  genderBtnActiveF: { background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.5)", color: "#ec4899" },
  overlay: { position: "fixed", inset: 0, background: "rgba(4,6,8,0.88)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", animation: "fadeUp 0.3s ease-out" },
  modal: { width: "100%", maxWidth: "600px", background: "#0c1118", border: "1px solid #2e4a66", borderRadius: "8px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.8)", animation: "fadeUp 0.3s ease-out", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #1e2d3d", background: "#080c10", position: "sticky", top: 0, zIndex: 10 },
  modalTitle: { display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "700", letterSpacing: "3px", color: "#d4e8f5" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  closeBtn: { background: "transparent", border: "none", color: "#3a5570", fontSize: "16px", cursor: "pointer", padding: "4px 8px" },
  section: { padding: "16px 20px", borderBottom: "1px solid #1e2d3d" },
  label: { fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "3px", color: "#3a5570", marginBottom: "10px", display: "block" },
  descBox: { fontFamily: "var(--font-body)", fontSize: "13px", color: "#d4e8f5", lineHeight: 1.8, background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "4px", padding: "14px" },
  suggItem: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 14px", background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "4px", borderLeft: "3px solid rgba(245,166,35,0.4)", marginBottom: "8px" },
  suggNum: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f5a623", fontWeight: "700", flexShrink: 0, lineHeight: 1.6 },
  suggText: { fontFamily: "var(--font-body)", fontSize: "13px", color: "#6b8ca8", lineHeight: 1.6 },
  modalFooter: { display: "flex", gap: "10px", padding: "16px 20px", background: "#080c10" },
  faceBody: { padding: "20px", display: "flex", flexDirection: "column", gap: "14px" },
  faceImgWrap: { position: "relative", borderRadius: "6px", overflow: "hidden", border: "1px solid #2e4a66", boxShadow: "0 0 30px rgba(168,85,247,0.15)" },
  faceImg: { width: "100%", display: "block", maxHeight: "480px", objectFit: "cover", opacity: 0, transition: "opacity 0.5s ease" },
  faceImgLabel: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 12px", background: "rgba(4,6,8,0.8)", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#a855f7", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" },
  dot2: { width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7", animation: "pulse-amber 2s infinite", flexShrink: 0 },
  promptBox: { padding: "12px 14px", background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "4px" },
  promptText: { fontFamily: "var(--font-body)", fontSize: "12px", color: "#6b8ca8", lineHeight: 1.6, margin: "6px 0 0" },
  warningBox: { padding: "10px 14px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "4px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6b8ca8" },
  faceActions: { display: "flex", gap: "10px" },
  errorBody: { display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", gap: "10px" },
  errorTitle: { fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: "700", color: "#d4e8f5", letterSpacing: "2px" },
  errorText: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#6b8ca8", textAlign: "center", maxWidth: "380px", lineHeight: 1.6 },
};