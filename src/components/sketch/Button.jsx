export default function Button({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        margin: "5px",
        backgroundColor: "#ff9800",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
      }}
    >
      {label}
    </button>
  );
}