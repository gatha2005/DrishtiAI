export default function Reports() {
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>≡ Reports</h2>

      <div style={styles.card}>
        <p>Total Cameras: 12</p>
        <p>Active Alerts: 3</p>
        <p>System Status: Operational</p>
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
  card: {
    background: "#111820",
    border: "1px solid #1e2d3d",
    padding: "20px",
    borderRadius: "6px",
  },
};