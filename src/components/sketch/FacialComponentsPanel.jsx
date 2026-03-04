export default function FacialComponentsPanel() {
  // ✅ Exact same paths as original — only drag fix applied
  const categories = [
    {
      label: "Face Structure",
      items: [
        "/assets/face_structure/face1.jpeg",
        "/assets/face_structure/face2.jpeg",
        "/assets/face_structure/face3.jpeg",
        "/assets/face_structure/face4.jpeg",
        "/assets/face_structure/face5.jpeg",
        "/assets/face_structure/face6.jpeg",
        "/assets/face_structure/face7.png",
        "/assets/face_structure/face8.jpeg",
        "/assets/face_structure/face9.jpeg",
        "/assets/face_structure/face10.jpeg",
      ],
    },
    {
      label: "Eyes",
      items: [
        "/assets/eye/eyes1.jpeg",
        "/assets/eye/eyes2.jpeg",
        "/assets/eye/eyes3.jpeg",
        "/assets/eye/eyes4.jpeg",
        "/assets/eye/eyes5.jpeg",
        "/assets/eye/eyes6.jpeg",
        "/assets/eye/eyes7.jpeg",
        "/assets/eye/eyes8.jpeg",
        "/assets/eye/eyes9.jpeg",
        "/assets/eye/eyes10.jpeg",
      ],
    },
    {
      label: "Hair",
      items: [
        "/assets/hair/hair1.jpeg",
        "/assets/hair/hair2.jpeg",
        "/assets/hair/hair3.jpeg",
        "/assets/hair/hair4.jpeg",
        "/assets/hair/hair5.jpeg",
        "/assets/hair/hair6.jpeg",
        "/assets/hair/hair7.jpeg",
        "/assets/hair/hair8.jpeg",
        "/assets/hair/hair9.jpeg",
        "/assets/hair/hair10.jpeg",
      ],
    },
    {
      label: "Lips",
      items: [
        "/assets/lips/lip1.png",
        "/assets/lips/lip2.png",
        "/assets/lips/lip3.png",
        "/assets/lips/lip4.png",
        "/assets/lips/lip5.png",
        "/assets/lips/lip6.png",
        "/assets/lips/lip7.png",
        "/assets/lips/lip8.png",
        "/assets/lips/lip9.png",
        "/assets/lips/lip10.png",
        "/assets/lips/lip11.png",
        "/assets/lips/lip12.png",
      ],
    },
    {
      label: "Nose",
      items: [
        "/assets/nose/nose1.jpeg",
        "/assets/nose/nose2.jpeg",
        "/assets/nose/nose3.jpeg",
        "/assets/nose/nose4.jpeg",
        "/assets/nose/nose5.jpeg",
        "/assets/nose/nose6.jpeg",
        "/assets/nose/nose7.jpeg",
        "/assets/nose/nose8.jpeg",
        "/assets/nose/nose9.jpeg",
        "/assets/nose/nose10.jpeg",
        "/assets/nose/nose11.jpeg",
      ],
    },
  ];

  // ✅ FIXED: was setData("external", src) — now matches CanvasArea's getData("text/plain")
  const handleDragStart = (e, src) => {
    e.dataTransfer.setData("text/plain", src);
  };

  return (
    <div style={styles.panel}>
      {categories.map((cat) => (
        <div key={cat.label} style={styles.category}>
          <div style={styles.categoryLabel}>{cat.label.toUpperCase()}</div>
          <div style={styles.grid}>
            {cat.items.map((src, i) => (
              <img
                key={i}
                src={src}
                draggable
                onDragStart={(e) => handleDragStart(e, src)}
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
    background: "#080c10",
    transition: "border-color 0.2s",
  },
};