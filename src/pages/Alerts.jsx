export default function Alerts() {
  const alerts = [
    { id: 1, type: "Motion Detected", location: "Camera 3", time: "22:14:03" },
    { id: 2, type: "Unauthorized Access", location: "Main Gate", time: "21:58:47" },
    { id: 3, type: "Camera Offline", location: "Parking Area", time: "21:40:12" },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>⚠ Alerts</h2>

      {alerts.map((alert) => (
        <div key={alert.id} style={styles.card}>
          <div style={styles.title}>{alert.type}</div>
          <div style={styles.info}>
            Location: {alert.location} | Time: {alert.time}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    color: "#d4e8f5",
  },
  heading: {
    color: "#ff3b4e",
    marginBottom: "20px",
  },
  card: {
    background: "#111820",
    border: "1px solid #1e2d3d",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "12px",
  },
  title: {
    fontWeight: "600",
    marginBottom: "6px",
  },
  info: {
    fontSize: "13px",
    color: "#6b8ca8",
  },
};