import { useState } from "react";

export default function CanvasArea() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [resizingId, setResizingId] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startSize, setStartSize] = useState(0);

  // DROP FROM PANEL
  const handleDrop = (e) => {
    e.preventDefault();
    const src = e.dataTransfer.getData("text/plain");
    console.log("Dropped:", src); 
    if (!src) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 50;
    const y = e.clientY - rect.top - 50;

    setItems((prev) => [
      ...prev,
      { id: Date.now(), src, x, y, size: 120 },
    ]);
  };

  // MOVE START
  const handleMouseDownMove = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    setDraggingId(id);
  };

  // RESIZE START
  const handleMouseDownResize = (e, id, size) => {
    e.stopPropagation();
    setSelectedId(id);
    setResizingId(id);
    setStartX(e.clientX);
    setStartSize(size);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();

    // MOVE
    if (draggingId) {
      const x = e.clientX - rect.left - 50;
      const y = e.clientY - rect.top - 50;

      setItems((prev) =>
        prev.map((item) =>
          item.id === draggingId ? { ...item, x, y } : item
        )
      );
    }

    // RESIZE
    if (resizingId) {
      const diff = e.clientX - startX;

      setItems((prev) =>
        prev.map((item) =>
          item.id === resizingId
            ? { ...item, size: Math.max(40, startSize + diff) }
            : item
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  const handleDelete = () => {
    if (!selectedId) return;

    setItems((prev) =>
      prev.filter((item) => item.id !== selectedId)
    );
    setSelectedId(null);
  };

  return (
    <div>
      <div
        className="canvas"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={(e) => {
          if (e.target.className === "canvas") {
            setSelectedId(null);
          }
        }}
        style={{
          position: "relative",
          width: "700px",
          height: "500px",
          background: "black",
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            onMouseDown={(e) => handleMouseDownMove(e, item.id)}
            style={{
              position: "absolute",
              left: item.x,
              top: item.y,
              width: item.size,
              height: item.size,
              border:
                selectedId === item.id
                  ? "2px solid red"
                  : "2px solid transparent",
              boxSizing: "border-box",
              cursor: "move",
            }}
          >
            <img
              src={item.src}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />

            {selectedId === item.id && (
              <div
                onMouseDown={(e) =>
                  handleMouseDownResize(e, item.id, item.size)
                }
                style={{
                  position: "absolute",
                  width: "16px",
                  height: "16px",
                  background: "white",
                  right: "-8px",
                  bottom: "-8px",
                  cursor: "nwse-resize",
                  border: "2px solid black",
                  zIndex: 10,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={handleDelete}>
          Delete Selected
        </button>
      </div>
    </div>
  );
}