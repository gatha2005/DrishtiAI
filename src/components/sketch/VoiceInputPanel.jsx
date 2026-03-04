import { useState } from "react";

export default function VoiceInputPanel() {
  const [text, setText] = useState("");

  return (
    <div className="panel">
      <h3>Voice Input</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe suspect..."
        style={{
          width: "100%",
          height: "80px",
          marginBottom: "10px",
        }}
      />
      <button>Start Recording</button>
    </div>
  );
}