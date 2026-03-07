import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CanvasArea from "../components/sketch/CanvasArea";
import FacialComponentsPanel from "../components/sketch/FacialComponentsPanel";
import VoiceInputPanel from "../components/sketch/VoiceInputPanel";
import ActionButtons from "../components/common/ActionButtons";

export default function SketchPage({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div style={styles.root}>
      <Navbar
        user={user}
        onLogout={onLogout}
        activePage="sketch"
        onNavigate={(page) => {
          navigate("/dashboard");
        }}
      />

      <div style={styles.body}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.breadcrumb}>
              <span
                style={styles.breadcrumbLink}
                onClick={() => navigate("/dashboard")}
              >
                DASHBOARD
              </span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>SKETCH TOOL</span>
            </div>
            <h1 style={styles.pageTitle}>Facial Composite Sketch</h1>
            <p style={styles.pageSubtitle}>
              Drag facial components onto the canvas to build a suspect composite
            </p>
          </div>

          {/* Back button */}
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            BACK TO DASHBOARD
          </button>
        </div>

        {/* Main sketch layout */}
        <div style={styles.sketchLayout}>

          {/* LEFT — Facial Components Panel */}
          <div style={styles.leftPanel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>
                <span style={styles.panelDot} />
                COMPONENTS LIBRARY
              </div>
            </div>
            <div style={styles.panelScroll}>
              <FacialComponentsPanel />
            </div>
          </div>

          {/* CENTER — Canvas + Actions */}
          <div style={styles.centerPanel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>
                <span style={{ ...styles.panelDot, background: "#f5a623", animation: "pulse-amber 2s infinite" }} />
                COMPOSITE CANVAS
              </div>
              <span style={styles.canvasBadge}>DRAG &amp; DROP ACTIVE</span>
            </div>
            <div style={styles.canvasWrapper}>
              <CanvasArea />
            </div>
            <div style={styles.actionsWrapper}>
              <ActionButtons />
            </div>
          </div>

          {/* RIGHT — Voice Input Panel */}
          <div style={styles.rightPanel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>
                <span style={{ ...styles.panelDot, background: "#2196f3" }} />
                WITNESS INPUT
              </div>
            </div>
            <VoiceInputPanel />

            {/* Case info box */}
            <div style={styles.caseInfo}>
              <div style={styles.caseInfoTitle}>CASE DETAILS</div>
              <div style={styles.caseInfoRow}>
                <span style={styles.caseInfoLabel}>OPERATOR</span>
                <span style={styles.caseInfoValue}>{user?.name}</span>
              </div>
              <div style={styles.caseInfoRow}>
                <span style={styles.caseInfoLabel}>ROLE</span>
                <span style={{
                  ...styles.caseInfoValue,
                  color: user?.role === "admin" ? "#f5a623" : "#64b5f6",
                }}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
              <div style={styles.caseInfoRow}>
                <span style={styles.caseInfoLabel}>SESSION</span>
                <span style={{ ...styles.caseInfoValue, color: "#00e5a0" }}>ACTIVE</span>
              </div>
              <div style={styles.caseInfoRow}>
                <span style={styles.caseInfoLabel}>TIME</span>
                <span style={styles.caseInfoValue}>
                  {new Date().toLocaleTimeString("en-US", { hour12: false })}
                </span>
              </div>
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
    padding: "24px 32px",
    maxWidth: "1600px",
    margin: "0 auto",
    width: "100%",
  },

  // Header
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "24px",
    paddingBottom: "18px",
    borderBottom: "1px solid #1e2d3d",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
  },
  breadcrumbLink: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#3a5570",
    letterSpacing: "2px",
    cursor: "pointer",
    transition: "color 0.2s",
    textDecoration: "underline",
    textDecorationColor: "transparent",
  },
  breadcrumbSep: { color: "#1e2d3d", fontSize: "12px" },
  breadcrumbCurrent: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#00e5a0",
    letterSpacing: "2px",
  },
  pageTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "26px",
    fontWeight: "700",
    letterSpacing: "2px",
    color: "#d4e8f5",
    lineHeight: 1,
    marginBottom: "6px",
  },
  pageSubtitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "#3a5570",
    letterSpacing: "0.5px",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 16px",
    background: "transparent",
    border: "1px solid #1e2d3d",
    borderRadius: "4px",
    color: "#6b8ca8",
    fontFamily: "var(--font-display)",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "2px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  // Layout
  sketchLayout: {
    display: "grid",
    gridTemplateColumns: "220px 1fr 240px",
    gap: "16px",
    alignItems: "start",
  },

  // Shared panel style
  leftPanel: {
    background: "#0c1118",
    border: "1px solid #1e2d3d",
    borderRadius: "6px",
    overflow: "hidden",
    animation: "fadeUp 0.4s ease-out both",
  },
  centerPanel: {
    background: "#0c1118",
    border: "1px solid #1e2d3d",
    borderRadius: "6px",
    overflow: "hidden",
    animation: "fadeUp 0.4s ease-out 0.1s both",
  },
  rightPanel: {
    background: "#0c1118",
    border: "1px solid #1e2d3d",
    borderRadius: "6px",
    overflow: "hidden",
    animation: "fadeUp 0.4s ease-out 0.2s both",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #1e2d3d",
    background: "#080c10",
  },
  panelTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "var(--font-display)",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "3px",
    color: "#6b8ca8",
    textTransform: "uppercase",
  },
  panelDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#00e5a0",
    animation: "pulse-green 2s infinite",
    flexShrink: 0,
  },
  canvasBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "#f5a623",
    letterSpacing: "1px",
    padding: "2px 8px",
    background: "rgba(245,166,35,0.08)",
    border: "1px solid rgba(245,166,35,0.2)",
    borderRadius: "2px",
  },

  panelScroll: {
    overflowY: "auto",
    maxHeight: "calc(100vh - 240px)",
  },
  canvasWrapper: {
    padding: "16px",
    display: "flex",
    justifyContent: "center",
    overflowX: "auto",
  },
  actionsWrapper: {
    padding: "12px 16px",
    borderTop: "1px solid #1e2d3d",
    background: "#080c10",
  },

  // Case info sidebar card
  caseInfo: {
    margin: "12px",
    padding: "14px",
    background: "#080c10",
    border: "1px solid #1e2d3d",
    borderRadius: "4px",
  },
  caseInfoTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "3px",
    color: "#3a5570",
    marginBottom: "12px",
  },
  caseInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  caseInfoLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "#3a5570",
    letterSpacing: "1px",
  },
  caseInfoValue: {
    fontFamily: "var(--font-display)",
    fontSize: "12px",
    fontWeight: "600",
    color: "#d4e8f5",
    letterSpacing: "0.5px",
  },
};