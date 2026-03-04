import { useState } from "react";
import html2canvas from "html2canvas";

export default function ActionButtons() {
  const [loading, setLoading] = useState(false);
  const [modal, setModal]     = useState(null); // { description, enhancement }

  // ── Capture canvas as base64 ───────────────────────────
  const captureCanvas = async () => {
    const canvasEl = document.querySelector(".canvas");
    if (!canvasEl) throw new Error("Canvas not found");
    const captured = await html2canvas(canvasEl, { backgroundColor: "#ffffff" });
    return captured.toDataURL("image/png").split(",")[1]; // base64 only
  };

  // ── Save to file ───────────────────────────────────────
  const handleSave = async () => {
    try {
      const canvasEl = document.querySelector(".canvas");
      if (!canvasEl) return;
      const captured = await html2canvas(canvasEl, { backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `suspect_composite_${Date.now()}.png`;
      link.href = captured.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  // ── Call Claude AI ─────────────────────────────────────
  const handleGenerateAI = async () => {
    const canvasEl = document.querySelector(".canvas");
    const items = canvasEl?.querySelectorAll("img");
    if (!items || items.length === 0) {
      alert("Please add facial components to the canvas first.");
      return;
    }

    setLoading(true);
    setModal(null);

    try {
      const base64Image = await captureCanvas();

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: base64Image,
                  },
                },
                {
                  type: "text",
                  text: `You are a forensic sketch analyst assisting law enforcement. Analyze this facial composite sketch built from assembled facial components and provide:

1. SUSPECT DESCRIPTION: A detailed written description of the suspect as if filing a police report. Include face shape, eye characteristics, nose type, lip shape, hair style, and any notable features. Be specific and professional.

2. ENHANCEMENT SUGGESTIONS: List 3-5 specific suggestions to improve this composite sketch for better identification accuracy. Mention which facial features need adjustment, repositioning, or replacement.

Format your response as JSON only, no markdown:
{
  "description": "detailed suspect description here",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.map(c => c.text || "").join("") || "";

      let parsed = { description: "", suggestions: [] };
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        parsed = {
          description: text,
          suggestions: ["Could not parse suggestions. Please try again."],
        };
      }

      setModal(parsed);
    } catch (err) {
      console.error("AI error:", err);
      setModal({
        description: "Error connecting to AI service. Please try again.",
        suggestions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Action buttons ── */}
      <div style={styles.row}>
        <button
          style={{ ...styles.btn, ...styles.btnBlue }}
          onClick={handleGenerateAI}
          disabled={loading}
        >
          {loading ? (
            <span style={styles.loadingInner}>
              <span style={styles.spinner} /> ANALYZING...
            </span>
          ) : (
            "◈ GENERATE AI ANALYSIS"
          )}
        </button>

        <button style={{ ...styles.btn, ...styles.btnAmber }} onClick={handleSave}>
          ↓ SAVE TO CASE
        </button>

        <button style={{ ...styles.btn, ...styles.btnGreen }}>
          ✓ SUBMIT
        </button>
      </div>

      {/* ── AI Result Modal ── */}
      {modal && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                <span style={styles.modalDot} />
                AI FORENSIC ANALYSIS
              </div>
              <button style={styles.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>

            {/* Description */}
            <div style={styles.section}>
              <div style={styles.sectionLabel}>SUSPECT DESCRIPTION</div>
              <div style={styles.descriptionBox}>
                {modal.description}
              </div>
            </div>

            {/* Enhancement suggestions */}
            {modal.suggestions?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>ENHANCEMENT SUGGESTIONS</div>
                <div style={styles.suggestionList}>
                  {modal.suggestions.map((s, i) => (
                    <div key={i} style={styles.suggestionItem}>
                      <span style={styles.suggestionNum}>{i + 1}</span>
                      <span style={styles.suggestionText}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div style={styles.modalFooter}>
              <button style={{ ...styles.btn, ...styles.btnAmber, flex: 1 }} onClick={handleSave}>
                ↓ SAVE COMPOSITE
              </button>
              <button style={{ ...styles.btn, ...styles.btnBlue, flex: 1 }} onClick={handleGenerateAI} disabled={loading}>
                ↺ RE-ANALYZE
              </button>
              <button style={{ ...styles.btn, flex: 1 }} onClick={() => setModal(null)}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  row: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  btn: {
    flex: 1,
    padding: "10px 14px",
    border: "1px solid #1e2d3d",
    borderRadius: "4px",
    background: "transparent",
    color: "#6b8ca8",
    fontFamily: "var(--font-display)",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  btnBlue: {
    background: "rgba(33,150,243,0.1)",
    borderColor: "rgba(33,150,243,0.35)",
    color: "#2196f3",
  },
  btnAmber: {
    background: "rgba(245,166,35,0.1)",
    borderColor: "rgba(245,166,35,0.35)",
    color: "#f5a623",
  },
  btnGreen: {
    background: "rgba(0,229,160,0.1)",
    borderColor: "rgba(0,229,160,0.35)",
    color: "#00e5a0",
  },
  loadingInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    display: "inline-block",
    width: "12px",
    height: "12px",
    border: "2px solid rgba(33,150,243,0.3)",
    borderTopColor: "#2196f3",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },

  // Modal overlay
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(4,6,8,0.85)",
    backdropFilter: "blur(4px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    animation: "fadeUp 0.3s ease-out",
  },
  modal: {
    width: "100%",
    maxWidth: "600px",
    background: "#0c1118",
    border: "1px solid #2e4a66",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px #1e2d3d",
    animation: "fadeUp 0.3s ease-out",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #1e2d3d",
    background: "#080c10",
  },
  modalTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "var(--font-display)",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "3px",
    color: "#d4e8f5",
  },
  modalDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#2196f3",
    animation: "pulse-amber 2s infinite",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#3a5570",
    fontSize: "16px",
    cursor: "pointer",
    fontFamily: "var(--font-mono)",
    transition: "color 0.2s",
    padding: "4px 8px",
  },
  section: {
    padding: "16px 20px",
    borderBottom: "1px solid #1e2d3d",
  },
  sectionLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "3px",
    color: "#3a5570",
    marginBottom: "10px",
  },
  descriptionBox: {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    color: "#d4e8f5",
    lineHeight: 1.8,
    background: "#080c10",
    border: "1px solid #1e2d3d",
    borderRadius: "4px",
    padding: "14px",
  },
  suggestionList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  suggestionItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "10px 14px",
    background: "#080c10",
    border: "1px solid #1e2d3d",
    borderRadius: "4px",
    borderLeft: "3px solid rgba(245,166,35,0.4)",
  },
  suggestionNum: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "#f5a623",
    fontWeight: "700",
    flexShrink: 0,
    lineHeight: 1.6,
  },
  suggestionText: {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    color: "#6b8ca8",
    lineHeight: 1.6,
  },
  modalFooter: {
    display: "flex",
    gap: "10px",
    padding: "16px 20px",
    background: "#080c10",
  },
};