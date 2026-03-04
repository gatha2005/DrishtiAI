export default function Button({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        background: "#3b82f6",
        color: "white",
        fontWeight: "bold",
      }}
    >
      {label}
    </button>
  );
}