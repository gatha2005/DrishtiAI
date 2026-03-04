export default function FacialComponentsPanel() {
  const categories = [
    {
      label: "Face Structure",
      items: Array.from({ length: 10 }, (_, i) =>
        i < 6
          ? `/assets/face_structure/face${i + 1}.jpeg`
          : `/assets/face_structure/face${i + 1}.png`
      ).map((src, i) => ({
        src: i < 6
          ? `/assets/face_structure/face${i + 1}.jpeg`
          : `/assets/face_structure/face${i === 6 ? 7 : i + 1}.${i === 6 ? "png" : "jpeg"}`,
      })),
    },
    {
      label: "Eyes",
      items: Array.from({ length: 10 }, (_, i) => ({
        src: `/assets/Eye/eyes${i + 1}.jpeg`,
      })),
    },
    {
      label: "Hair",
      items: Array.from({ length: 10 }, (_, i) => ({
        src: `/assets/hair/hair${i + 1}.jpeg`,
      })),
    },
    {
      label: "Lips",
      items: Array.from({ length: 12 }, (_, i) => ({
        src: `/assets/lips/lip${i + 1}.png`,
      })),
    },
    {
      label: "Nose",
      items: Array.from({ length: 11 }, (_, i) => ({
        src: `/assets/nose/nose${i + 1}.jpeg`,
      })),
    },
  ];

  // ✅ FIX: use "text/plain" to match CanvasArea's getData("text/plain")
  const handleDragStart = (e, src) => {
    e.dataTransfer.setData("text/plain", src);
  };

  return (
    <div style={styles.panel}>
      {categories.map((cat) => (
        <div key={cat.label} style={styles.category}>
          <div style={styles.categoryLabel}>{cat.label.toUpperCase()}</div>
          <div style={styles.grid}>
            {cat.items.map((item, i) => (
              <img
                key={i}
                src={item.src}
                draggable
                onDragStart={(e) => handleDragStart(e, item.src)}
                style={styles.thumb}
                title={`Drag to canvas`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  panel: {
    padding: "12px",
  },
  category: {
    marginBottom: "16px",
  },
  categoryLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "2px",
    color: "#3a5570",
    marginBottom: "8px",
    paddingBottom: "4px",
    borderBottom: "1px solid #1e2d3d",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "6px",
  },
  thumb: {
    width: "100%",
    aspectRatio: "1",
    objectFit: "cover",
    borderRadius: "4px",
    cursor: "grab",
    border: "1px solid #1e2d3d",
    transition: "border-color 0.2s, transform 0.15s",
    background: "#080c10",
  },
};