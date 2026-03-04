import { useState } from "react";
import Navbar from "../Navbar";
<Navbar></Navbar>
export default function CanvasArea() {
  const [items, setItems] = useState([]);

  const handleDrop = (e) => {
    e.preventDefault();

    const src = e.dataTransfer.getData("text/plain");
    if (!src) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left - 40;
    const y = e.clientY - rect.top - 40;

    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        src,
        x,
        y,
      },
    ]);
  };

  return (
    <div
      className="canvas"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {items.map((item) => (
        <img
          key={item.id}
          src={item.src}
          style={{
            left: item.x,
            top: item.y,
          }}
        />
      ))}
    </div>
  );
}