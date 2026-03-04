import { useState } from "react";
import StatCard from "../components/StatCard";

const RECENT_ALERTS = [
  { id: "ALT-2847", time: "14:33:21", camera: "CAM-07 · Gate B", type: "Motion Detected", severity: "HIGH" },
  { id: "ALT-2846", time: "14:29:05", camera: "CAM-12 · Lobby", type: "Face Recognized", severity: "MED" },
  { id: "ALT-2845", time: "14:11:48", camera: "CAM-03 · Parking", type: "Vehicle Loitering", severity: "HIGH" },
  { id: "ALT-2844", time: "13:55:12", camera: "CAM-19 · Roof", type: "Connection Lost", severity: "LOW" },
  { id: "ALT-2843", time: "13:42:30", camera: "CAM-02 · Corridor", type: "Motion Detected", severity: "MED" },
];

const CAMERA_FEEDS = [
  { id: "CAM-01", location: "Main Entrance", status: "online" },
  { id: "CAM-02", location: "Corridor A", status: "online" },
  { id: "CAM-03", location: "Parking Lot", status: "online" },
  { id: "CAM-04", location: "Server Room", status: "online" },
  { id: "CAM-05", location: "Roof Access", status: "offline" },
  { id: "CAM-06", location: "Reception", status: "online" },
];

const SEV_COLORS = {
  HIGH: { color: "#ff3b4e", bg: "rgba(255,59,78,0.12)", border: "rgba(255,59,78,0.3)" },
  MED: { color: "#f5a623", bg: "rgba(245,166,35,0.10)", border: "rgba(245,166,35,0.25)" },
  LOW: { color: "#6b8ca8", bg: "rgba(107,140,168,0.10)", border: "rgba(107,140,168,0.2)" },
};


export default function Dashboard({ user }) {

  return (
    <div style={styles.root}>

      <div style={styles.body}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.breadcrumb}>
              <span style={styles.breadcrumbItem}>SENTINEL</span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>OVERVIEW</span>
            </div>
            <h1 style={styles.pageTitle}>Command Dashboard</h1>
          </div>
          <div style={styles.pageHeaderRight}>
            <div style={styles.systemStatus}>
              <div style={styles.statusIndicator} />
              <span style={styles.statusText}>All Systems Nominal</span>
            </div>
            {user.role === "admin" && (
              <button style={styles.actionBtn}>+ ADD CAMERA</button>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div style={styles.statsGrid}>
          <StatCard
            label="Active Cameras"
            value={24}
            icon="◉"
            accent="green"
            live={true}
            trend="up"
            trendValue="+2 since 06:00"
            subtitle="2 offline"
            delay={0}
          />
          <StatCard
            label="Active Alerts"
            value={7}
            icon="⚠"
            accent="red"
            live={true}
            trend="up"
            trendValue="+3 in last hour"
            subtitle="3 HIGH severity"
            delay={100}
          />
          <StatCard
            label="Database Records"
            value={148392}
            unit="rec"
            icon="⊟"
            accent="amber"
            trend="up"
            trendValue="+1,204 today"
            subtitle="Last sync 2m ago"
            delay={200}
          />
          <StatCard
            label="Footage Stored"
            value={2847}
            unit="GB"
            icon="⊞"
            accent="blue"
            trend="up"
            trendValue="+12 GB today"
            subtitle="81% capacity"
            delay={300}
          />
        </div>

        {/* Main content area */}
        <div style={styles.mainGrid}>
          {/* Camera feed preview */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>
                <span style={styles.panelDot} />
                LIVE FEEDS
              </div>
              <button style={styles.panelAction}>VIEW ALL →</button>
            </div>
            <div style={styles.cameraGrid}>
              {CAMERA_FEEDS.map((cam, i) => (
                <div key={cam.id} style={{
                  ...styles.camCell,
                  animationDelay: `${i * 0.1}s`,
                }}>
                  {/* Mock camera view */}
                  <div style={styles.camScreen}>
                    <div style={styles.camNoise} />
                    <div style={styles.camScanline} />
                    {cam.status === "offline" && (
                      <div style={styles.camOffline}>
                        <span>NO SIGNAL</span>
                      </div>
                    )}
                    {cam.status === "online" && (
                      <>
                        <div style={styles.camCrosshair}>
                          <span style={styles.crosshairH} />
                          <span style={styles.crosshairV} />
                        </div>
                        <div style={styles.camTimestamp}>
                          {new Date().toLocaleTimeString("en-US", { hour12: false })}
                        </div>
                        <div style={styles.camRecording}>
                          <div style={styles.recDot} />
                          REC
                        </div>
                      </>
                    )}
                  </div>
                  <div style={styles.camLabel}>
                    <span style={styles.camId}>{cam.id}</span>
                    <span style={{
                      ...styles.camStatus,
                      color: cam.status === "online" ? "#00e5a0" : "#ff3b4e",
                    }}>
                      {cam.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.camLocation}>{cam.location}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert log */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>
                <span style={{ ...styles.panelDot, background: "#ff3b4e" }} />
                RECENT ALERTS
              </div>
              <span style={styles.alertCount}>{RECENT_ALERTS.length} ACTIVE</span>
            </div>
            <div style={styles.alertList}>
              {RECENT_ALERTS.map((alert, i) => {
                const sev = SEV_COLORS[alert.severity];
                return (
                  <div key={alert.id} style={{
                    ...styles.alertRow,
                    animationDelay: `${i * 0.08}s`,
                    borderLeftColor: sev.color,
                  }}>
                    <div style={styles.alertMain}>
                      <div style={styles.alertTop}>
                        <span style={styles.alertId}>{alert.id}</span>
                        <span style={{
                          ...styles.alertSeverity,
                          color: sev.color,
                          background: sev.bg,
                          border: `1px solid ${sev.border}`,
                        }}>
                          {alert.severity}
                        </span>
                      </div>
                      <div style={styles.alertType}>{alert.type}</div>
                      <div style={styles.alertMeta}>
                        <span style={styles.alertCamera}>{alert.camera}</span>
                        <span style={styles.alertTime}>{alert.time}</span>
                      </div>
                    </div>
                    {user.role === "admin" && (
                      <button style={styles.resolveBtn}>RESOLVE</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "var(--bg-void)",
  },
  body: {
    flex: 1,
    padding: "28px 32px",
    maxWidth: "1600px",
    margin: "0 auto",
    width: "100%",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "28px",
    paddingBottom: "20px",
    borderBottom: "1px solid #1e2d3d",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
  },
  breadcrumbItem: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#3a5570",
    letterSpacing: "2px",
  },
  breadcrumbSep: {
    color: "#1e2d3d",
    fontSize: "12px",
  },
  breadcrumbCurrent: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#f5a623",
    letterSpacing: "2px",
  },
  pageTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "2px",
    color: "#d4e8f5",
    lineHeight: 1,
  },
  pageHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  systemStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    background: "rgba(0,229,160,0.05)",
    border: "1px solid rgba(0,229,160,0.2)",
    borderRadius: "4px",
  },
  statusIndicator: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#00e5a0",
    animation: "pulse-green 2s infinite",
  },
  statusText: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "#00e5a0",
    letterSpacing: "1px",
  },
  actionBtn: {
    padding: "8px 16px",
    background: "rgba(245,166,35,0.1)",
    border: "1px solid rgba(245,166,35,0.3)",
    borderRadius: "4px",
    color: "#f5a623",
    fontFamily: "var(--font-display)",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "2px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "20px",
  },
  panel: {
    background: "#0c1118",
    border: "1px solid #1e2d3d",
    borderRadius: "6px",
    padding: "20px",
    animation: "fadeUp 0.5s ease-out 0.3s both",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "14px",
    borderBottom: "1px solid #1e2d3d",
  },
  panelTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "var(--font-display)",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "3px",
    color: "#6b8ca8",
    textTransform: "uppercase",
  },
  panelDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#00e5a0",
    animation: "pulse-green 2s infinite",
  },
  panelAction: {
    background: "transparent",
    border: "none",
    color: "#3a5570",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    letterSpacing: "1px",
    cursor: "pointer",
    transition: "color 0.2s",
  },
  alertCount: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#ff3b4e",
    letterSpacing: "1px",
    padding: "4px 8px",
    background: "rgba(255,59,78,0.1)",
    borderRadius: "2px",
    border: "1px solid rgba(255,59,78,0.25)",
  },
  cameraGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },
  camCell: {
    animation: "fadeUp 0.4s ease-out both",
  },
  camScreen: {
    position: "relative",
    paddingBottom: "75%",
    background: "#050810",
    borderRadius: "4px",
    border: "1px solid #1e2d3d",
    overflow: "hidden",
    marginBottom: "6px",
  },
  camNoise: {
    position: "absolute",
    inset: 0,
    background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"1\"/></filter><rect width=\"200\" height=\"200\" filter=\"url(%23n)\" opacity=\"0.03\"/></svg>')",
    backgroundSize: "100px 100px",
    opacity: 0.5,
  },
  camScanline: {
    position: "absolute",
    inset: 0,
    background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,200,100,0.02) 3px, rgba(0,200,100,0.02) 4px)",
  },
  camOffline: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#ff3b4e",
    letterSpacing: "2px",
    background: "rgba(255,59,78,0.05)",
  },
  camCrosshair: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    width: "24px",
    height: "24px",
    opacity: 0.3,
  },
  crosshairH: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: "1px",
    background: "#00e5a0",
  },
  crosshairV: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: "1px",
    background: "#00e5a0",
  },
  camTimestamp: {
    position: "absolute",
    bottom: "5px",
    left: "6px",
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "rgba(0,229,160,0.7)",
    letterSpacing: "1px",
  },
  camRecording: {
    position: "absolute",
    top: "5px",
    right: "6px",
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "#ff3b4e",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  recDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#ff3b4e",
    animation: "blink 1.5s infinite",
  },
  camLabel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2px",
  },
  camId: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#6b8ca8",
    letterSpacing: "1px",
  },
  camStatus: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "1px",
  },
  camLocation: {
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    color: "#3a5570",
  },
  alertList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "400px",
    overflowY: "auto",
  },
  alertRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 12px 12px 14px",
    background: "#080c10",
    borderRadius: "4px",
    borderLeft: "3px solid",
    animation: "fadeUp 0.4s ease-out both",
    gap: "10px",
  },
  alertMain: {
    flex: 1,
    minWidth: 0,
  },
  alertTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  alertId: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#3a5570",
    letterSpacing: "1px",
  },
  alertSeverity: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "1px",
    padding: "2px 6px",
    borderRadius: "2px",
  },
  alertType: {
    fontFamily: "var(--font-display)",
    fontSize: "13px",
    fontWeight: "600",
    color: "#d4e8f5",
    letterSpacing: "0.3px",
    marginBottom: "4px",
  },
  alertMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertCamera: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#3a5570",
  },
  alertTime: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#3a5570",
  },
  resolveBtn: {
    flexShrink: 0,
    padding: "5px 10px",
    background: "transparent",
    border: "1px solid #1e2d3d",
    borderRadius: "3px",
    color: "#3a5570",
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "1px",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
};
