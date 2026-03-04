import html2canvas from "html2canvas";

export default function ActionButtons() {
  const handleSave = async () => {
    const canvasElement = document.querySelector(".canvas");
    if (!canvasElement) return;
    const canvas = await html2canvas(canvasElement);
    const link = document.createElement("a");
    link.download = "sketch.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div style={styles.row}>
      <button style={{ ...styles.btn, ...styles.btnPrimary }}>
        ◈ Generate Sketch
      </button>
      <button style={{ ...styles.btn, ...styles.btnAmber }} onClick={handleSave}>
        ↓ Save to Case
      </button>
      <button style={{ ...styles.btn, ...styles.btnGreen }}>
        ✓ Submit
      </button>
    </div>
  );
}

const styles = {
  row: { display: "flex", gap: "10px", flexWrap: "wrap" },
  btn: {
    flex: 1, padding: "10px 14px", border: "1px solid",
    borderRadius: "4px", fontFamily: "var(--font-display)",
    fontSize: "12px", fontWeight: "700", letterSpacing: "1px",
    cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
  },
  btnPrimary: { background: "rgba(33,150,243,0.1)", borderColor: "rgba(33,150,243,0.35)", color: "#2196f3" },
  btnAmber:  { background: "rgba(245,166,35,0.1)",  borderColor: "rgba(245,166,35,0.35)",  color: "#f5a623" },
  btnGreen:  { background: "rgba(0,229,160,0.1)",   borderColor: "rgba(0,229,160,0.35)",   color: "#00e5a0" },
};

