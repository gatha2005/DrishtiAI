export default function Database() {
  const records = [
    { id: 1, name: "John Doe", role: "Visitor", entry: "18:45" },
    { id: 2, name: "Security Staff", role: "Employee", entry: "17:10" },
    { id: 3, name: "Delivery Agent", role: "Vendor", entry: "19:25" },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>⊟ Database Records</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Entry Time</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => (
            <tr key={rec.id}>
              <td>{rec.name}</td>
              <td>{rec.role}</td>
              <td>{rec.entry}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    color: "#d4e8f5",
  },
  heading: {
    color: "#64b5f6",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
};