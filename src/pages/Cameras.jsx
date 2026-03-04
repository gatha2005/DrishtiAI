export default function Cameras() {
  const cameras = [
    { id: 1, name: "Entrance Gate", status: "Online" },
    { id: 2, name: "Lobby", status: "Online" },
    { id: 3, name: "Parking Area", status: "Offline" },
    { id: 4, name: "Warehouse", status: "Online" },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>◉ Cameras</h2>

      <div style={styles.grid}>
        {cameras.map((cam) => (
          <div key={cam.id} style={styles.card}>
            <div style={styles.name}>{cam.name}</div>
            <div
              style={{
                ...styles.status,
                color: cam.status === "Online" ? "#00e5a0" : "#ff3b4e",
              }}
            >
              {cam.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    color: "#d4e8f5",
  },
  heading: {
    color: "#f5a623",
    marginBottom: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "15px",
  },
  card: {
    background: "#111820",
    border: "1px solid #1e2d3d",
    padding: "20px",
    borderRadius: "6px",
  },
  name: {
    fontWeight: "600",
    marginBottom: "8px",
  },
  status: {
    fontSize: "13px",
  },
};