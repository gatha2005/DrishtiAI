import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";

// ─── DATA ───────────────────────────────────────────────
const RECENT_ALERTS = [
  { id: "ALT-2847", time: "14:33:21", camera: "CAM-07 · Gate B", type: "Motion Detected", severity: "HIGH" },
  { id: "ALT-2846", time: "14:29:05", camera: "CAM-12 · Lobby", type: "Face Recognized", severity: "MED" },
  { id: "ALT-2845", time: "14:11:48", camera: "CAM-03 · Parking", type: "Vehicle Loitering", severity: "HIGH" },
  { id: "ALT-2844", time: "13:55:12", camera: "CAM-19 · Roof", type: "Connection Lost", severity: "LOW" },
  { id: "ALT-2843", time: "13:42:30", camera: "CAM-02 · Corridor", type: "Motion Detected", severity: "MED" },
];

const ALL_CAMERAS = [
  { id: "CAM-01", location: "Main Entrance",  status: "online",  zone: "Entry",    fps: 30, res: "1080p" },
  { id: "CAM-02", location: "Corridor A",     status: "online",  zone: "Interior", fps: 25, res: "1080p" },
  { id: "CAM-03", location: "Parking Lot",    status: "online",  zone: "Exterior", fps: 30, res: "4K"    },
  { id: "CAM-04", location: "Server Room",    status: "online",  zone: "Secure",   fps: 15, res: "1080p" },
  { id: "CAM-05", location: "Roof Access",    status: "offline", zone: "Exterior", fps: 0,  res: "1080p" },
  { id: "CAM-06", location: "Reception",      status: "online",  zone: "Entry",    fps: 30, res: "720p"  },
  { id: "CAM-07", location: "Gate B",         status: "online",  zone: "Entry",    fps: 30, res: "4K"    },
  { id: "CAM-08", location: "Stairwell B",    status: "online",  zone: "Interior", fps: 25, res: "1080p" },
  { id: "CAM-09", location: "Loading Bay",    status: "online",  zone: "Exterior", fps: 30, res: "1080p" },
  { id: "CAM-10", location: "Canteen",        status: "offline", zone: "Interior", fps: 0,  res: "720p"  },
  { id: "CAM-11", location: "Fire Exit A",    status: "online",  zone: "Exit",     fps: 25, res: "1080p" },
  { id: "CAM-12", location: "Lobby",          status: "online",  zone: "Entry",    fps: 30, res: "4K"    },
];

const DB_RECORDS = [
  { id: "REC-001", subject: "Unknown Male #1", date: "2025-03-01", caseId: "CASE-441", status: "Open"   },
  { id: "REC-002", subject: "Vehicle PLT-9921", date: "2025-03-01", caseId: "CASE-440", status: "Closed" },
  { id: "REC-003", subject: "Unknown Female #3", date: "2025-02-28", caseId: "CASE-439", status: "Open"   },
  { id: "REC-004", subject: "Unknown Male #2", date: "2025-02-28", caseId: "CASE-438", status: "Review" },
  { id: "REC-005", subject: "Vehicle PLT-3341", date: "2025-02-27", caseId: "CASE-437", status: "Closed" },
  { id: "REC-006", subject: "Unknown Male #4", date: "2025-02-26", caseId: "CASE-436", status: "Open"   },
];

const REPORTS = [
  { id: "RPT-081", title: "Weekly Incident Summary",   date: "2025-03-01", author: "ADMIN",   type: "Incident"  },
  { id: "RPT-080", title: "Camera Uptime Report",      date: "2025-02-28", author: "SYSTEM",  type: "System"    },
  { id: "RPT-079", title: "Suspect Composite — Gate B", date: "2025-02-27", author: "CHEN_J",  type: "Composite" },
  { id: "RPT-078", title: "Alert Escalation Log",      date: "2025-02-26", author: "ADMIN",   type: "Incident"  },
  { id: "RPT-077", title: "Monthly Statistics",        date: "2025-02-25", author: "SYSTEM",  type: "Analytics" },
];

const SEV_COLORS = {
  HIGH: { color: "#ff3b4e", bg: "rgba(255,59,78,0.12)",   border: "rgba(255,59,78,0.3)"   },
  MED:  { color: "#f5a623", bg: "rgba(245,166,35,0.10)",  border: "rgba(245,166,35,0.25)" },
  LOW:  { color: "#6b8ca8", bg: "rgba(107,140,168,0.10)", border: "rgba(107,140,168,0.2)" },
};

// ─── SUB-PAGES ───────────────────────────────────────────

function CamerasPage({ user }) {
  return (
    <div>
      <div style={styles.subHeader}>
        <div>
          <div style={styles.pageTitle}>Camera Management</div>
          <div style={styles.pageSubtitle}>{ALL_CAMERAS.filter(c => c.status === "online").length} online · {ALL_CAMERAS.filter(c => c.status === "offline").length} offline</div>
        </div>
        {user.role === "admin" && <button style={styles.actionBtn}>+ ADD CAMERA</button>}
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Camera ID", "Location", "Zone", "Resolution", "FPS", "Status", "Actions"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_CAMERAS.map((cam, i) => (
              <tr key={cam.id} style={{ ...styles.tr, animationDelay: `${i * 0.04}s` }}>
                <td style={styles.td}><span style={styles.monoText}>{cam.id}</span></td>
                <td style={styles.td}>{cam.location}</td>
                <td style={styles.td}><span style={styles.zoneBadge}>{cam.zone}</span></td>
                <td style={styles.td}><span style={styles.monoText}>{cam.res}</span></td>
                <td style={styles.td}><span style={styles.monoText}>{cam.fps > 0 ? `${cam.fps} fps` : "—"}</span></td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusBadge,
                    color: cam.status === "online" ? "#00e5a0" : "#ff3b4e",
                    background: cam.status === "online" ? "rgba(0,229,160,0.1)" : "rgba(255,59,78,0.1)",
                    border: `1px solid ${cam.status === "online" ? "rgba(0,229,160,0.3)" : "rgba(255,59,78,0.3)"}`,
                  }}>
                    {cam.status === "online" ? "● ONLINE" : "○ OFFLINE"}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={styles.tblBtn}>VIEW</button>
                    {user.role === "admin" && <button style={{ ...styles.tblBtn, color: "#ff3b4e", borderColor: "rgba(255,59,78,0.3)" }}>DISABLE</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertsPage({ user }) {
  const [filter, setFilter] = useState("ALL");
  const filters = ["ALL", "HIGH", "MED", "LOW"];
  const filtered = filter === "ALL" ? RECENT_ALERTS : RECENT_ALERTS.filter(a => a.severity === filter);

  return (
    <div>
      <div style={styles.subHeader}>
        <div>
          <div style={styles.pageTitle}>Alert Management</div>
          <div style={styles.pageSubtitle}>{RECENT_ALERTS.length} active alerts</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {filters.map(f => (
            <button
              key={f}
              style={{
                ...styles.filterBtn,
                ...(filter === f ? styles.filterBtnActive : {}),
              }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map((alert, i) => {
          const sev = SEV_COLORS[alert.severity];
          return (
            <div key={alert.id} style={{ ...styles.alertCard, borderLeftColor: sev.color, animationDelay: `${i * 0.07}s` }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <span style={styles.monoText}>{alert.id}</span>
                  <span style={{ ...styles.statusBadge, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}` }}>
                    {alert.severity}
                  </span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: "600", color: "#d4e8f5" }}>
                    {alert.type}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "24px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#6b8ca8" }}>📍 {alert.camera}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a5570" }}>🕐 {alert.time}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={styles.tblBtn}>DETAILS</button>
                {user.role === "admin" && (
                  <button style={{ ...styles.tblBtn, color: "#00e5a0", borderColor: "rgba(0,229,160,0.3)" }}>RESOLVE</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DatabasePage() {
  const [viewRecord, setViewRecord] = useState(null);

  // Load saved cases from localStorage
  const savedCases = (() => {
    try {
      return JSON.parse(localStorage.getItem("sentinel_cases") || "[]");
    } catch { return []; }
  })();

  const allRecords = [
    ...savedCases,
    ...DB_RECORDS.map(r => ({ ...r, sketchUrl: null, generatedUrl: null })),
  ];

  const statusColors = {
    Open:      { color: "#f5a623", bg: "rgba(245,166,35,0.1)",   border: "rgba(245,166,35,0.3)"   },
    Closed:    { color: "#6b8ca8", bg: "rgba(107,140,168,0.1)", border: "rgba(107,140,168,0.2)" },
    Review:    { color: "#2196f3", bg: "rgba(33,150,243,0.1)",  border: "rgba(33,150,243,0.3)"  },
    Submitted: { color: "#00e5a0", bg: "rgba(0,229,160,0.1)",   border: "rgba(0,229,160,0.3)"   },
  };

  const deleteRecord = (id) => {
    const updated = savedCases.filter(r => r.id !== id);
    localStorage.setItem("sentinel_cases", JSON.stringify(updated));
    window.location.reload();
  };

  return (
    <div>
      <div style={styles.subHeader}>
        <div>
          <div style={styles.pageTitle}>Case Database</div>
          <div style={styles.pageSubtitle}>{allRecords.length} records · {savedCases.length} submitted composites</div>
        </div>
        <button style={styles.actionBtn}>⊞ EXPORT</button>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Record ID", "Subject", "Case ID", "Date", "Status", "Images", "Actions"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allRecords.map((rec, i) => {
              const sc = statusColors[rec.status] || statusColors.Open;
              const hasSketch    = !!rec.sketchUrl;
              const hasGenerated = !!rec.generatedUrl;
              return (
                <tr key={rec.id + i} style={{ ...styles.tr, animationDelay: `${i * 0.05}s` }}>
                  <td style={styles.td}><span style={styles.monoText}>{rec.id}</span></td>
                  <td style={styles.td}>{rec.subject}</td>
                  <td style={styles.td}><span style={styles.monoText}>{rec.caseId}</span></td>
                  <td style={styles.td}><span style={styles.monoText}>{rec.date}</span></td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      {rec.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {hasSketch && (
                        <span style={styles.imgBadge}>🖼 SKETCH</span>
                      )}
                      {hasGenerated && (
                        <span style={{ ...styles.imgBadge, color: "#a855f7", borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)" }}>✦ AI FACE</span>
                      )}
                      {!hasSketch && !hasGenerated && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        style={{ ...styles.tblBtn, color: "#00e5a0", borderColor: "rgba(0,229,160,0.3)" }}
                        onClick={() => setViewRecord(rec)}
                      >
                        VIEW
                      </button>
                      {hasSketch && (
                        <button
                          style={styles.tblBtn}
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = rec.sketchUrl;
                            link.download = `${rec.id}_sketch.png`;
                            link.click();
                          }}
                        >
                          ↓
                        </button>
                      )}
                      {savedCases.find(r => r.id === rec.id) && (
                        <button
                          style={{ ...styles.tblBtn, color: "#ff3b4e", borderColor: "rgba(255,59,78,0.3)" }}
                          onClick={() => deleteRecord(rec.id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Image Viewer Modal ── */}
      {viewRecord && (
        <div style={dbStyles.overlay} onClick={() => setViewRecord(null)}>
          <div style={dbStyles.modal} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={dbStyles.modalHeader}>
              <div style={dbStyles.modalTitle}>
                <span style={dbStyles.dot} />
                {viewRecord.id} · {viewRecord.subject}
              </div>
              <button style={dbStyles.closeBtn} onClick={() => setViewRecord(null)}>✕</button>
            </div>

            {/* Meta info */}
            <div style={dbStyles.metaRow}>
              <span style={dbStyles.metaItem}>CASE: <span style={dbStyles.metaVal}>{viewRecord.caseId}</span></span>
              <span style={dbStyles.metaItem}>DATE: <span style={dbStyles.metaVal}>{viewRecord.date}</span></span>
              <span style={dbStyles.metaItem}>STATUS: <span style={{ ...dbStyles.metaVal, color: statusColors[viewRecord.status]?.color }}>{viewRecord.status.toUpperCase()}</span></span>
            </div>

            {/* Images side by side */}
            {(viewRecord.sketchUrl || viewRecord.generatedUrl) ? (
              <div style={dbStyles.imagesRow}>
                {viewRecord.sketchUrl && (
                  <div style={dbStyles.imageCard}>
                    <div style={dbStyles.imageLabel}>🖼 COMPOSITE SKETCH</div>
                    <img src={viewRecord.sketchUrl} alt="Sketch" style={dbStyles.image} />
                    <button
                      style={dbStyles.downloadBtn}
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = viewRecord.sketchUrl;
                        link.download = `${viewRecord.id}_sketch.png`;
                        link.click();
                      }}
                    >
                      ↓ DOWNLOAD SKETCH
                    </button>
                  </div>
                )}
                {viewRecord.generatedUrl && (
                  <div style={dbStyles.imageCard}>
                    <div style={{ ...dbStyles.imageLabel, color: "#a855f7" }}>✦ AI GENERATED FACE</div>
                    <img src={viewRecord.generatedUrl} alt="Generated" style={dbStyles.image} />
                    <button
                      style={{ ...dbStyles.downloadBtn, borderColor: "rgba(168,85,247,0.4)", color: "#a855f7" }}
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = viewRecord.generatedUrl;
                        link.download = `${viewRecord.id}_generated.png`;
                        link.click();
                      }}
                    >
                      ↓ DOWNLOAD AI FACE
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={dbStyles.noImages}>
                <div style={dbStyles.noImagesIcon}>◎</div>
                <div style={dbStyles.noImagesTitle}>NO IMAGES ATTACHED</div>
                <div style={dbStyles.noImagesText}>
                  This record has no composite sketch or AI-generated face.
                  Go to the <strong style={{ color: "#00e5a0" }}>Sketch Tool</strong>, build a composite and click{" "}
                  <strong style={{ color: "#00e5a0" }}>✓ SUBMIT TO CASE</strong> to attach images.
                </div>
              </div>
            )}

            <div style={dbStyles.footer}>
              <button style={dbStyles.closeFullBtn} onClick={() => setViewRecord(null)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsPage() {
  const typeColors = {
    Incident:  "#ff3b4e",
    System:    "#6b8ca8",
    Composite: "#00e5a0",
    Analytics: "#2196f3",
  };
  return (
    <div>
      <div style={styles.subHeader}>
        <div>
          <div style={styles.pageTitle}>Reports</div>
          <div style={styles.pageSubtitle}>{REPORTS.length} reports available</div>
        </div>
        <button style={styles.actionBtn}>+ NEW REPORT</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {REPORTS.map((rpt, i) => (
          <div key={rpt.id} style={{ ...styles.alertCard, borderLeftColor: typeColors[rpt.type] || "#3a5570", animationDelay: `${i * 0.07}s` }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                <span style={styles.monoText}>{rpt.id}</span>
                <span style={{ ...styles.statusBadge, color: typeColors[rpt.type], background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)` }}>
                  {rpt.type.toUpperCase()}
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: "600", color: "#d4e8f5", marginBottom: "6px" }}>
                {rpt.title}
              </div>
              <div style={{ display: "flex", gap: "20px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a5570" }}>by {rpt.author}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a5570" }}>{rpt.date}</span>
              </div>
            </div>
            <button style={styles.tblBtn}>DOWNLOAD</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OVERVIEW (original dashboard content) ───────────────
function OverviewPage({ user }) {
  return (
    <div>
      <div style={styles.statsGrid}>
        <StatCard label="Active Cameras" value={24} icon="◉" accent="green" live={true} trend="up" trendValue="+2 since 06:00" subtitle="2 offline" delay={0} />
        <StatCard label="Active Alerts"  value={7}  icon="⚠" accent="red"   live={true} trend="up" trendValue="+3 in last hour" subtitle="3 HIGH severity" delay={100} />
        <StatCard label="Database Records" value={148392} unit="rec" icon="⊟" accent="amber" trend="up" trendValue="+1,204 today" subtitle="Last sync 2m ago" delay={200} />
        <StatCard label="Footage Stored" value={2847} unit="GB" icon="⊞" accent="blue" trend="up" trendValue="+12 GB today" subtitle="81% capacity" delay={300} />
      </div>

      <div style={styles.mainGrid}>
        {/* Camera feeds */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}><span style={styles.panelDot} /> LIVE FEEDS</div>
            <button style={styles.panelAction}>VIEW ALL →</button>
          </div>
          <div style={styles.cameraGrid}>
            {ALL_CAMERAS.slice(0, 6).map((cam, i) => (
              <div key={cam.id} style={{ ...styles.camCell, animationDelay: `${i * 0.1}s` }}>
                <div style={styles.camScreen}>
                  <div style={styles.camScanline} />
                  {cam.status === "offline" ? (
                    <div style={styles.camOffline}>NO SIGNAL</div>
                  ) : (
                    <>
                      <div style={styles.camCrosshair}>
                        <span style={styles.crosshairH} /><span style={styles.crosshairV} />
                      </div>
                      <div style={styles.camTimestamp}>{new Date().toLocaleTimeString("en-US", { hour12: false })}</div>
                      <div style={styles.camRecording}><div style={styles.recDot} />REC</div>
                    </>
                  )}
                </div>
                <div style={styles.camLabel}>
                  <span style={styles.camId}>{cam.id}</span>
                  <span style={{ ...styles.camStatus, color: cam.status === "online" ? "#00e5a0" : "#ff3b4e" }}>
                    {cam.status.toUpperCase()}
                  </span>
                </div>
                <div style={styles.camLocation}>{cam.location}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}><span style={{ ...styles.panelDot, background: "#ff3b4e" }} /> RECENT ALERTS</div>
            <span style={styles.alertCount}>{RECENT_ALERTS.length} ACTIVE</span>
          </div>
          <div style={styles.alertList}>
            {RECENT_ALERTS.map((alert, i) => {
              const sev = SEV_COLORS[alert.severity];
              return (
                <div key={alert.id} style={{ ...styles.alertRow, borderLeftColor: sev.color, animationDelay: `${i * 0.08}s` }}>
                  <div style={styles.alertMain}>
                    <div style={styles.alertTop}>
                      <span style={styles.alertId}>{alert.id}</span>
                      <span style={{ ...styles.alertSeverity, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}` }}>{alert.severity}</span>
                    </div>
                    <div style={styles.alertType}>{alert.type}</div>
                    <div style={styles.alertMeta}>
                      <span style={styles.alertCamera}>{alert.camera}</span>
                      <span style={styles.alertTime}>{alert.time}</span>
                    </div>
                  </div>
                  {user.role === "admin" && <button style={styles.resolveBtn}>RESOLVE</button>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────
export default function Dashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();

  const PAGE_TITLES = {
    dashboard: "Command Dashboard",
    cameras:   "Camera Management",
    alerts:    "Alert Management",
    database:  "Case Database",
    reports:   "Reports",
  };

  const renderPage = () => {
    switch (activePage) {
      case "cameras":  return <CamerasPage user={user} />;
      case "alerts":   return <AlertsPage user={user} />;
      case "database": return <DatabasePage />;
      case "reports":  return <ReportsPage />;
      default:         return <OverviewPage user={user} />;
    }
  };

  return (
    <div style={styles.root}>
      <Navbar
        user={user}
        onLogout={onLogout}
        activePage={activePage}
        onNavigate={setActivePage}   // ← this now actually switches pages
      />

      <div style={styles.body}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.breadcrumb}>
              <span style={styles.breadcrumbItem}>SENTINEL</span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>{activePage.toUpperCase()}</span>
            </div>
            <h1 style={styles.pageTitleMain}>{PAGE_TITLES[activePage]}</h1>
          </div>
          <div style={styles.pageHeaderRight}>
            <div style={styles.systemStatus}>
              <div style={styles.statusIndicator} />
              <span style={styles.statusText}>All Systems Nominal</span>
            </div>
            <button style={styles.sketchBtn} onClick={() => navigate("/sketch")}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
                <line x1="7.5" y1="1" x2="7.5" y2="4" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="7.5" y1="11" x2="7.5" y2="14" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="1" y1="7.5" x2="4" y2="7.5" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="11" y1="7.5" x2="14" y2="7.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              OPEN SKETCH TOOL
            </button>
          </div>
        </div>

        {/* Render active page */}
        <div key={activePage} style={{ animation: "fadeUp 0.3s ease-out" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────
const styles = {
  root: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-void)" },
  body: { flex: 1, padding: "28px 32px", maxWidth: "1600px", margin: "0 auto", width: "100%" },

  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid #1e2d3d" },
  breadcrumb: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" },
  breadcrumbItem: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570", letterSpacing: "2px" },
  breadcrumbSep: { color: "#1e2d3d" },
  breadcrumbCurrent: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#f5a623", letterSpacing: "2px" },
  pageTitleMain: { fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: "700", letterSpacing: "2px", color: "#d4e8f5", lineHeight: 1 },
  pageHeaderRight: { display: "flex", alignItems: "center", gap: "12px" },
  systemStatus: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: "4px" },
  statusIndicator: { width: "7px", height: "7px", borderRadius: "50%", background: "#00e5a0", animation: "pulse-green 2s infinite" },
  statusText: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#00e5a0", letterSpacing: "1px" },
  sketchBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "9px 18px", background: "linear-gradient(135deg, rgba(0,229,160,0.15), rgba(0,229,160,0.08))", border: "1px solid rgba(0,229,160,0.5)", borderRadius: "4px", color: "#00e5a0", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "700", letterSpacing: "2px", cursor: "pointer", boxShadow: "0 0 16px rgba(0,229,160,0.1)" },
  actionBtn: { padding: "8px 16px", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: "4px", color: "#f5a623", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", cursor: "pointer" },

  // Sub-page shared
  subHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" },
  pageTitle: { fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: "700", color: "#d4e8f5", letterSpacing: "1px", marginBottom: "4px" },
  pageSubtitle: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a5570", letterSpacing: "1px" },

  // Table
  tableWrap: { background: "#0c1118", border: "1px solid #1e2d3d", borderRadius: "6px", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "2px", color: "#3a5570", textAlign: "left", borderBottom: "1px solid #1e2d3d", background: "#080c10", textTransform: "uppercase" },
  tr: { borderBottom: "1px solid #1e2d3d", animation: "fadeUp 0.3s ease-out both", transition: "background 0.15s" },
  td: { padding: "12px 16px", fontFamily: "var(--font-body)", fontSize: "13px", color: "#6b8ca8" },
  monoText: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#7ec8e3", letterSpacing: "1px" },
  statusBadge: { fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "1px", padding: "3px 8px", borderRadius: "3px" },
  zoneBadge: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6b8ca8", background: "rgba(107,140,168,0.1)", border: "1px solid rgba(107,140,168,0.2)", padding: "2px 7px", borderRadius: "3px", letterSpacing: "1px" },
  tblBtn: { padding: "4px 10px", background: "transparent", border: "1px solid #1e2d3d", borderRadius: "3px", color: "#6b8ca8", fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "1px", cursor: "pointer" },

  // Alert card
  alertCard: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 16px 18px", background: "#0c1118", borderRadius: "6px", borderLeft: "3px solid", animation: "fadeUp 0.3s ease-out both", gap: "16px" },

  // Filter buttons
  filterBtn: { padding: "6px 14px", background: "transparent", border: "1px solid #1e2d3d", borderRadius: "4px", color: "#3a5570", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "1px", cursor: "pointer" },
  filterBtnActive: { borderColor: "rgba(245,166,35,0.4)", color: "#f5a623", background: "rgba(245,166,35,0.08)" },

  // Overview
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" },
  panel: { background: "#0c1118", border: "1px solid #1e2d3d", borderRadius: "6px", padding: "20px", animation: "fadeUp 0.5s ease-out 0.3s both" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid #1e2d3d" },
  panelTitle: { display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "3px", color: "#6b8ca8", textTransform: "uppercase" },
  panelDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#00e5a0", animation: "pulse-green 2s infinite" },
  panelAction: { background: "transparent", border: "none", color: "#3a5570", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "1px", cursor: "pointer" },
  alertCount: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#ff3b4e", letterSpacing: "1px", padding: "4px 8px", background: "rgba(255,59,78,0.1)", borderRadius: "2px", border: "1px solid rgba(255,59,78,0.25)" },
  cameraGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" },
  camCell: { animation: "fadeUp 0.4s ease-out both" },
  camScreen: { position: "relative", paddingBottom: "75%", background: "#050810", borderRadius: "4px", border: "1px solid #1e2d3d", overflow: "hidden", marginBottom: "6px" },
  camScanline: { position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,200,100,0.02) 3px, rgba(0,200,100,0.02) 4px)" },
  camOffline: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#ff3b4e", letterSpacing: "2px" },
  camCrosshair: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "24px", height: "24px", opacity: 0.3 },
  crosshairH: { position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#00e5a0" },
  crosshairV: { position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "#00e5a0" },
  camTimestamp: { position: "absolute", bottom: "5px", left: "6px", fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgba(0,229,160,0.7)" },
  camRecording: { position: "absolute", top: "5px", right: "6px", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#ff3b4e", display: "flex", alignItems: "center", gap: "4px" },
  recDot: { width: "5px", height: "5px", borderRadius: "50%", background: "#ff3b4e", animation: "blink 1.5s infinite" },
  camLabel: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" },
  camId: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6b8ca8", letterSpacing: "1px" },
  camStatus: { fontFamily: "var(--font-mono)", fontSize: "9px" },
  camLocation: { fontFamily: "var(--font-body)", fontSize: "11px", color: "#3a5570" },
  alertList: { display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" },
  alertRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 12px 14px", background: "#080c10", borderRadius: "4px", borderLeft: "3px solid", animation: "fadeUp 0.4s ease-out both", gap: "10px" },
  alertMain: { flex: 1, minWidth: 0 },
  alertTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" },
  alertId: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570", letterSpacing: "1px" },
  alertSeverity: { fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "1px", padding: "2px 6px", borderRadius: "2px" },
  alertType: { fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "600", color: "#d4e8f5", marginBottom: "4px" },
  alertMeta: { display: "flex", justifyContent: "space-between" },
  alertCamera: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570" },
  alertTime: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570" },
  resolveBtn: { flexShrink: 0, padding: "5px 10px", background: "transparent", border: "1px solid #1e2d3d", borderRadius: "3px", color: "#3a5570", fontFamily: "var(--font-mono)", fontSize: "9px", cursor: "pointer" },
  imgBadge: { fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "1px", padding: "2px 7px", borderRadius: "3px", color: "#00e5a0", background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.25)", whiteSpace: "nowrap" },
};

const dbStyles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(4,6,8,0.92)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", animation: "fadeUp 0.3s ease-out" },
  modal: { width: "100%", maxWidth: "960px", background: "#0c1118", border: "1px solid #2e4a66", borderRadius: "8px", boxShadow: "0 24px 64px rgba(0,0,0,0.8)", animation: "fadeUp 0.3s ease-out", maxHeight: "92vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #1e2d3d", background: "#080c10", position: "sticky", top: 0, zIndex: 10 },
  modalTitle: { display: "flex", alignItems: "center", gap: "10px", fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: "700", letterSpacing: "2px", color: "#d4e8f5" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", background: "#00e5a0", animation: "pulse-green 2s infinite", flexShrink: 0 },
  closeBtn: { background: "transparent", border: "none", color: "#3a5570", fontSize: "18px", cursor: "pointer", padding: "4px 8px" },
  metaRow: { display: "flex", gap: "24px", padding: "12px 20px", borderBottom: "1px solid #1e2d3d", background: "#080c10", flexWrap: "wrap" },
  metaItem: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570", letterSpacing: "1px" },
  metaVal: { color: "#d4e8f5", marginLeft: "6px", fontWeight: "600" },
  imagesRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", padding: "20px" },
  imageCard: { display: "flex", flexDirection: "column", gap: "0", background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "6px", overflow: "hidden" },
  imageLabel: { fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "2px", color: "#00e5a0", padding: "10px 14px", borderBottom: "1px solid #1e2d3d", background: "rgba(0,229,160,0.04)" },
  image: { width: "100%", display: "block", objectFit: "contain", background: "#fff" },
  downloadBtn: { margin: "12px 14px 14px", padding: "8px 14px", background: "transparent", border: "1px solid rgba(0,229,160,0.3)", borderRadius: "4px", color: "#00e5a0", fontFamily: "var(--font-display)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", cursor: "pointer", textAlign: "center" },
  footer: { padding: "14px 20px", borderTop: "1px solid #1e2d3d", background: "#080c10", display: "flex", justifyContent: "flex-end" },
  closeFullBtn: { padding: "8px 20px", background: "transparent", border: "1px solid #1e2d3d", borderRadius: "4px", color: "#6b8ca8", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", cursor: "pointer" },
  noImages: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: "12px", borderTop: "1px solid #1e2d3d" },
  noImagesIcon: { fontSize: "40px", color: "#1e2d3d", lineHeight: 1 },
  noImagesTitle: { fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: "700", letterSpacing: "3px", color: "#3a5570" },
  noImagesText: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a5570", textAlign: "center", maxWidth: "400px", lineHeight: 1.8, letterSpacing: "0.3px" },
};