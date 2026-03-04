import { useState } from "react";

// ── Canvas dimensions ─────────────────────────────────────
const CW = 700;
const CH = 500;
const CX = CW / 2; // 350 — horizontal center

// ── Anatomically correct snap zones (centered on face) ────
// Face is centered at (350, 250). Zones follow real facial proportions.
const SNAP_ZONES = [
  {
    id: "hair",
    label: "HAIR",
    x: CX,       y: 95,
    w: 220,       h: 110,
    snapSize: 140,
    color: "rgba(245,166,35,0.08)",
    border: "rgba(245,166,35,0.35)",
  },
  {
    id: "face",
    label: "FACE",
    x: CX,       y: 255,
    w: 240,       h: 300,
    snapSize: 240,
    color: "rgba(107,140,168,0.05)",
    border: "rgba(107,140,168,0.2)",
  },
  {
    id: "eyes",
    label: "EYES",
    x: CX,       y: 205,
    w: 230,       h: 75,
    snapSize: 180,
    color: "rgba(33,150,243,0.08)",
    border: "rgba(33,150,243,0.35)",
  },
  {
    id: "nose",
    label: "NOSE",
    x: CX,       y: 295,
    w: 110,       h: 90,
    snapSize: 110,
    color: "rgba(0,229,160,0.07)",
    border: "rgba(0,229,160,0.35)",
  },
  {
    id: "lips",
    label: "LIPS",
    x: CX,       y: 375,
    w: 140,       h: 70,
    snapSize: 130,
    color: "rgba(255,59,78,0.07)",
    border: "rgba(255,59,78,0.3)",
  },
];

// Detect which zone the drop is closest to
function getSnapPosition(dropX, dropY) {
  let best = null;
  let minDist = Infinity;

  SNAP_ZONES.forEach((zone) => {
    // Only snap if drop point is inside the zone rectangle
    const inX = Math.abs(dropX - zone.x) < zone.w / 2 + 30;
    const inY = Math.abs(dropY - zone.y) < zone.h / 2 + 30;
    if (inX && inY) {
      const dist = Math.hypot(dropX - zone.x, dropY - zone.y);
      if (dist < minDist) {
        minDist = dist;
        best = zone;
      }
    }
  });

  if (best) {
    return {
      x: best.x - best.snapSize / 2,
      y: best.y - best.snapSize / 2,
      size: best.snapSize,
      snapped: best.label,
    };
  }

  return { x: dropX - 60, y: dropY - 60, size: 120, snapped: null };
}

// Blend modes that work well for sketch layering
const BLEND_MODES = ["normal", "multiply", "screen", "overlay", "darken", "luminosity"];

export default function CanvasArea() {
  const [items, setItems]           = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [startX, setStartX]         = useState(0);
  const [startSize, setStartSize]   = useState(0);
  const [showZones, setShowZones]   = useState(true);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [snapMsg, setSnapMsg]       = useState(null);

  const selectedItem = items.find(i => i.id === selectedId);

  // ── Drop ────────────────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    const src = e.dataTransfer.getData("text/plain");
    if (!src) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const dropY = e.clientY - rect.top;

    const { x, y, size, snapped } = getSnapPosition(dropX, dropY);
    const maxZ = items.length > 0 ? Math.max(...items.map(i => i.zIndex)) : 0;

    setItems(prev => [
      ...prev,
      {
        id: Date.now(), src,
        x, y, size,
        zIndex: maxZ + 1,
        opacity: 1,
        blendMode: "normal",
      },
    ]);

    setHoveredZone(null);
    if (snapped) {
      setSnapMsg(`Snapped → ${snapped}`);
      setTimeout(() => setSnapMsg(null), 1600);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = null;
    SNAP_ZONES.forEach(zone => {
      const inX = Math.abs(mx - zone.x) < zone.w / 2 + 30;
      const inY = Math.abs(my - zone.y) < zone.h / 2 + 30;
      if (inX && inY) found = zone.id;
    });
    setHoveredZone(found);
  };

  // ── Move ────────────────────────────────────────────────
  const handleMouseDownMove = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    setDraggingId(id);
  };

  // ── Resize ──────────────────────────────────────────────
  const handleMouseDownResize = (e, id, size) => {
    e.stopPropagation();
    setResizingId(id);
    setStartX(e.clientX);
    setStartSize(size);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (draggingId) {
      const x = e.clientX - rect.left - 60;
      const y = e.clientY - rect.top  - 60;
      setItems(prev => prev.map(item =>
        item.id === draggingId ? { ...item, x, y } : item
      ));
    }
    if (resizingId) {
      const diff = e.clientX - startX;
      setItems(prev => prev.map(item =>
        item.id === resizingId
          ? { ...item, size: Math.max(40, startSize + diff) }
          : item
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  // ── Layer controls ──────────────────────────────────────
  const bringForward = () => {
    if (!selectedId) return;
    setItems(prev => {
      const maxZ = Math.max(...prev.map(i => i.zIndex));
      return prev.map(item =>
        item.id === selectedId ? { ...item, zIndex: maxZ + 1 } : item
      );
    });
  };

  const sendBack = () => {
    if (!selectedId) return;
    setItems(prev => {
      const minZ = Math.min(...prev.map(i => i.zIndex));
      return prev.map(item =>
        item.id === selectedId ? { ...item, zIndex: Math.max(0, minZ - 1) } : item
      );
    });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setItems(prev => prev.filter(i => i.id !== selectedId));
    setSelectedId(null);
  };

  const clearAll = () => { setItems([]); setSelectedId(null); };

  // ── Opacity & blend ────────────────────────────────────
  const updateItem = (id, patch) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  return (
    <div style={styles.wrapper}>

      {/* ── Top toolbar ── */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <button
            style={{ ...styles.toolBtn, ...(showZones ? styles.toolBtnOn : {}) }}
            onClick={() => setShowZones(v => !v)}
          >
            ⊞ GUIDES {showZones ? "ON" : "OFF"}
          </button>
          <span style={styles.infoText}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={styles.toolbarRight}>
          {selectedItem && (
            <>
              <button style={{ ...styles.toolBtn, color: "#f5a623", borderColor: "rgba(245,166,35,0.3)" }} onClick={bringForward}>↑ FORWARD</button>
              <button style={{ ...styles.toolBtn, color: "#6b8ca8" }} onClick={sendBack}>↓ BACK</button>
              <button style={{ ...styles.toolBtn, color: "#ff3b4e", borderColor: "rgba(255,59,78,0.3)" }} onClick={deleteSelected}>✕ DELETE</button>
            </>
          )}
          {items.length > 0 && (
            <button style={{ ...styles.toolBtn, color: "#3a5570" }} onClick={clearAll}>CLEAR</button>
          )}
        </div>
      </div>

      {/* ── Selected item controls (opacity + blend) ── */}
      {selectedItem && (
        <div style={styles.itemControls}>
          <div style={styles.controlGroup}>
            <span style={styles.controlLabel}>OPACITY</span>
            <input
              type="range" min="0.1" max="1" step="0.05"
              value={selectedItem.opacity}
              onChange={e => updateItem(selectedItem.id, { opacity: parseFloat(e.target.value) })}
              style={styles.slider}
            />
            <span style={styles.controlValue}>{Math.round(selectedItem.opacity * 100)}%</span>
          </div>
          <div style={styles.controlGroup}>
            <span style={styles.controlLabel}>BLEND</span>
            <select
              value={selectedItem.blendMode}
              onChange={e => updateItem(selectedItem.id, { blendMode: e.target.value })}
              style={styles.select}
            >
              {BLEND_MODES.map(m => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div style={styles.controlGroup}>
            <span style={styles.controlLabel}>SIZE</span>
            <input
              type="range" min="60" max="400" step="5"
              value={selectedItem.size}
              onChange={e => updateItem(selectedItem.id, { size: parseInt(e.target.value) })}
              style={styles.slider}
            />
            <span style={styles.controlValue}>{selectedItem.size}px</span>
          </div>
        </div>
      )}

      {/* ── Snap toast ── */}
      {snapMsg && <div style={styles.toast}>{snapMsg}</div>}

      {/* ── Canvas ── */}
      <div
        className="canvas"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setHoveredZone(null)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={e => { if (e.target.className === "canvas") setSelectedId(null); }}
        style={styles.canvas}
      >
        {/* Snap zone guides */}
        {showZones && SNAP_ZONES.map(zone => {
          const isHovered = hoveredZone === zone.id;
          return (
            <div
              key={zone.id}
              style={{
                position: "absolute",
                left: zone.x - zone.w / 2,
                top:  zone.y - zone.h / 2,
                width:  zone.w,
                height: zone.h,
                background: isHovered
                  ? zone.color.replace(/[\d.]+\)$/, "0.18)")
                  : zone.color,
                border: `1px dashed ${zone.border}`,
                borderRadius: zone.id === "face" ? "50% / 45%" : "6px",
                pointerEvents: "none",
                transition: "background 0.2s",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                padding: "4px 6px",
                boxSizing: "border-box",
              }}
            >
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                color: zone.border,
                letterSpacing: "1px",
                opacity: 0.9,
              }}>
                {zone.label}
              </span>
            </div>
          );
        })}

        {/* Items sorted by zIndex */}
        {[...items].sort((a, b) => a.zIndex - b.zIndex).map(item => (
          <div
            key={item.id}
            onMouseDown={e => handleMouseDownMove(e, item.id)}
            style={{
              position: "absolute",
              left: item.x,
              top:  item.y,
              width:  item.size,
              height: item.size,
              border: selectedId === item.id
                ? "1.5px solid #f5a623"
                : "1.5px solid transparent",
              boxSizing: "border-box",
              cursor: "move",
              zIndex: item.zIndex,
              opacity: item.opacity,
              mixBlendMode: item.blendMode,
              borderRadius: "2px",
              boxShadow: selectedId === item.id ? "0 0 10px rgba(245,166,35,0.25)" : "none",
            }}
          >
            <img
              src={item.src}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                display: "block",
                mixBlendMode: item.blendMode,
              }}
            />

            {/* Layer badge */}
            {selectedId === item.id && (
              <div style={styles.layerBadge}>Z:{item.zIndex}</div>
            )}

            {/* Resize handle */}
            {selectedId === item.id && (
              <div
                onMouseDown={e => handleMouseDownResize(e, item.id, item.size)}
                style={styles.resizeHandle}
              />
            )}
          </div>
        ))}

        {/* Empty state */}
        {items.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>◎</div>
            <div style={styles.emptyText}>DRAG COMPONENTS HERE</div>
            <div style={styles.emptySub}>Drop features into the guide zones</div>
          </div>
        )}
      </div>

      {/* ── Hint bar ── */}
      <div style={styles.hintBar}>
        {selectedItem
          ? <>Selected layer <span style={{ color: "#f5a623" }}>Z:{selectedItem.zIndex}</span> · Use <span style={{ color: "#f5a623" }}>BLEND</span> + <span style={{ color: "#f5a623" }}>OPACITY</span> to blend features naturally</>
          : <>Click a component to select · <span style={{ color: "#6b8ca8" }}>Multiply</span> or <span style={{ color: "#6b8ca8" }}>Darken</span> blend modes work best for sketches</>
        }
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
    width: "100%",
  },

  // Toolbar
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 2px",
    borderBottom: "1px solid #1e2d3d",
    marginBottom: "8px",
  },
  toolbarLeft:  { display: "flex", alignItems: "center", gap: "10px" },
  toolbarRight: { display: "flex", alignItems: "center", gap: "6px" },
  infoText: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570", letterSpacing: "1px" },
  toolBtn: {
    padding: "5px 10px",
    background: "transparent",
    border: "1px solid #1e2d3d",
    borderRadius: "3px",
    color: "#6b8ca8",
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "1px",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  toolBtnOn: {
    borderColor: "rgba(0,229,160,0.4)",
    color: "#00e5a0",
    background: "rgba(0,229,160,0.07)",
  },

  // Item controls bar
  itemControls: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "8px 12px",
    background: "#080c10",
    border: "1px solid #1e2d3d",
    borderRadius: "4px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  controlGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  controlLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "#3a5570",
    letterSpacing: "2px",
    whiteSpace: "nowrap",
  },
  controlValue: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#f5a623",
    minWidth: "32px",
  },
  slider: {
    width: "90px",
    accentColor: "#f5a623",
    cursor: "pointer",
  },
  select: {
    padding: "3px 8px",
    background: "#0c1118",
    border: "1px solid #1e2d3d",
    borderRadius: "3px",
    color: "#d4e8f5",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    cursor: "pointer",
    outline: "none",
  },

  // Canvas
  canvas: {
    position: "relative",
    width: `${CW}px`,
    height: `${CH}px`,
    background: "#ffffff",
    borderRadius: "4px",
    border: "1px solid #1e2d3d",
    overflow: "hidden",
    userSelect: "none",
  },

  toast: {
    position: "absolute",
    alignSelf: "center",
    background: "rgba(0,229,160,0.15)",
    border: "1px solid rgba(0,229,160,0.4)",
    borderRadius: "4px",
    padding: "5px 14px",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#00e5a0",
    letterSpacing: "1px",
    zIndex: 9999,
    animation: "fadeUp 0.3s ease-out",
    marginBottom: "4px",
  },

  layerBadge: {
    position: "absolute",
    top: "-18px",
    left: "0",
    background: "#f5a623",
    color: "#040608",
    fontFamily: "var(--font-mono)",
    fontSize: "8px",
    fontWeight: "700",
    padding: "1px 5px",
    borderRadius: "2px",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  resizeHandle: {
    position: "absolute",
    width: "12px",
    height: "12px",
    background: "#f5a623",
    right: "-6px",
    bottom: "-6px",
    cursor: "nwse-resize",
    border: "2px solid #040608",
    borderRadius: "2px",
    zIndex: 10,
  },

  emptyState: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    pointerEvents: "none",
  },
  emptyIcon: { fontSize: "36px", color: "#cccccc", lineHeight: 1 },
  emptyText: { fontFamily: "var(--font-display)", fontSize: "14px", letterSpacing: "4px", color: "#cccccc", fontWeight: "700" },
  emptySub:  { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#cccccc", letterSpacing: "1px" },

  hintBar: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#3a5570",
    letterSpacing: "0.5px",
    textAlign: "center",
    padding: "6px 0 2px",
    lineHeight: 1.6,
  },
};