import { useState, useEffect } from "react";

const ROLES = [
  {
    id: "admin",
    label: "System Administrator",
    description: "Full access — camera control, user mgmt, system config",
    icon: "◈",
  },
  {
    id: "investigator",
    label: "Investigator",
    description: "View-only access — footage review, alert logs, reports",
    icon: "◎",
  },
];

export default function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bootComplete, setBootComplete] = useState(false);
  const [bootLines, setBootLines] = useState([]);

  const BOOT_SEQUENCE = [
    "DrishtiAI OS v1.0.0 — Initializing...",
    "Loading kernel modules... [OK]",
    "Network interface eth0... [ACTIVE]",
    "Camera subsystem... 24/24 nodes connected",
    "Alert daemon... [RUNNING]",
    "Database service... [ONLINE]",
    "Encryption layer AES-256... [ENGAGED]",
    "Authentication module... [READY]",
    "System ready. Please authenticate.",
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_SEQUENCE.length) {
        setBootLines((prev) => [...prev, BOOT_SEQUENCE[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBootComplete(true), 400);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!selectedRole) return setError("Select an access role.");
    if (!name.trim()) return setError("Operator ID required.");
    if (!password) return setError("Passphrase required.");

    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      onLogin({ role: selectedRole, name: name.trim() });
    }, 1200);
  };

  return (
    <div style={styles.page}>
      {/* Grid background */}
      <div style={styles.grid} />

      {/* Scan line animation */}
      <div style={styles.scanLine} />

      {/* Boot terminal */}
      {!bootComplete && (
        <div style={styles.terminal}>
          {bootLines.map((line, i) => (
            <div key={i} style={{
              ...styles.termLine,
              color: line.includes("[OK]") || line.includes("[ACTIVE]") || line.includes("[RUNNING]") || line.includes("[ONLINE]") || line.includes("[ENGAGED]") || line.includes("[READY]")
                ? "#00e5a0"
                : line.includes("DrishtiAI OS")
                ? "#f5a623"
                : "#7ec8e3",
              animationDelay: `${i * 0.05}s`,
            }}>
              <span style={styles.termPrompt}>{">"}</span> {line}
            </div>
          ))}
          <div style={styles.cursor} />
        </div>
      )}

      {/* Main login panel */}
      {bootComplete && (
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logoMark}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="27" stroke="#f5a623" strokeWidth="1.5" strokeDasharray="4 2"/>
                <circle cx="28" cy="28" r="18" stroke="#f5a623" strokeWidth="1" opacity="0.5"/>
                <circle cx="28" cy="28" r="8" stroke="#f5a623" strokeWidth="1.5"/>
                <circle cx="28" cy="28" r="2.5" fill="#f5a623"/>
                <line x1="28" y1="1" x2="28" y2="10" stroke="#f5a623" strokeWidth="2"/>
                <line x1="28" y1="46" x2="28" y2="55" stroke="#f5a623" strokeWidth="2"/>
                <line x1="1" y1="28" x2="10" y2="28" stroke="#f5a623" strokeWidth="2"/>
                <line x1="46" y1="28" x2="55" y2="28" stroke="#f5a623" strokeWidth="2"/>
              </svg>
            </div>
            <div style={styles.title}>DrishtiAI</div>
            <div style={styles.subtitle}>SURVEILLANCE & INTELLIGENCE SYSTEM</div>
            <div style={styles.divider} />
          </div>

          {/* Role selection */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>ACCESS LEVEL</div>
            <div style={styles.roles}>
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  style={{
                    ...styles.roleCard,
                    ...(selectedRole === role.id ? styles.roleCardActive : {}),
                  }}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <div style={styles.roleCardInner}>
                    <span style={{
                      ...styles.roleIcon,
                      color: selectedRole === role.id ? "#f5a623" : "#3a5570",
                    }}>{role.icon}</span>
                    <div>
                      <div style={{
                        ...styles.roleLabel,
                        color: selectedRole === role.id ? "#d4e8f5" : "#6b8ca8",
                      }}>
                        {role.label}
                      </div>
                      <div style={styles.roleDesc}>{role.description}</div>
                    </div>
                  </div>
                  {selectedRole === role.id && (
                    <div style={styles.roleCheck}>✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Credentials */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>CREDENTIALS</div>
            <div style={styles.fields}>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>OPERATOR ID</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. CHEN_J"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoComplete="off"
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>PASSPHRASE</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.error}>
              <span style={styles.errorIcon}>⚠</span> {error}
            </div>
          )}

          {/* Submit */}
          <button
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.loadingInner}>
                <span style={styles.spinner} /> AUTHENTICATING...
              </span>
            ) : (
              "AUTHENTICATE & ENTER"
            )}
          </button>

          {/* Footer */}
          <div style={styles.footer}>
            <span style={styles.footerText}>CLASSIFIED SYSTEM — AUTHORIZED ACCESS ONLY</span>
            <span style={styles.footerText}>v4.2.1 · AES-256 · TLS 1.3</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-void)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(245,166,35,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245,166,35,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "48px 48px",
    pointerEvents: "none",
  },
  scanLine: {
    position: "fixed",
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(90deg, transparent, rgba(0,229,160,0.3), transparent)",
    animation: "scan 4s linear infinite",
    pointerEvents: "none",
  },
  terminal: {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    padding: "40px",
    maxWidth: "600px",
    width: "100%",
    lineHeight: 1.8,
  },
  termLine: {
    animation: "fadeUp 0.3s ease-out both",
  },
  termPrompt: {
    color: "#f5a623",
    marginRight: "8px",
  },
  cursor: {
    display: "inline-block",
    width: "8px",
    height: "14px",
    background: "#f5a623",
    animation: "blink 1s infinite",
    verticalAlign: "middle",
    marginLeft: "10px",
  },
  container: {
    width: "100%",
    maxWidth: "480px",
    padding: "0 24px",
    animation: "fadeUp 0.6s ease-out",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoMark: {
    display: "inline-block",
    marginBottom: "16px",
    filter: "drop-shadow(0 0 20px rgba(245,166,35,0.3))",
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "36px",
    fontWeight: "700",
    letterSpacing: "12px",
    color: "#f5a623",
    lineHeight: 1,
    marginBottom: "6px",
    textShadow: "0 0 40px rgba(245,166,35,0.3)",
  },
  subtitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "3px",
    color: "#3a5570",
    marginBottom: "20px",
  },
  divider: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, #2e4a66, transparent)",
    margin: "0 auto",
    maxWidth: "200px",
  },
  section: {
    marginBottom: "24px",
  },
  sectionLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    letterSpacing: "3px",
    color: "#3a5570",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  roles: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  roleCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    background: "#080c10",
    border: "1px solid #1e2d3d",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "left",
  },
  roleCardActive: {
    borderColor: "rgba(245,166,35,0.4)",
    background: "rgba(245,166,35,0.05)",
    boxShadow: "0 0 20px rgba(245,166,35,0.08), inset 0 0 20px rgba(245,166,35,0.03)",
  },
  roleCardInner: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  roleIcon: {
    fontSize: "22px",
    lineHeight: 1,
    transition: "color 0.2s",
  },
  roleLabel: {
    fontFamily: "var(--font-display)",
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "0.5px",
    transition: "color 0.2s",
    marginBottom: "2px",
  },
  roleDesc: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#3a5570",
    letterSpacing: "0.3px",
  },
  roleCheck: {
    fontFamily: "var(--font-mono)",
    color: "#f5a623",
    fontSize: "14px",
    fontWeight: "700",
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  fieldLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    letterSpacing: "2px",
    color: "#3a5570",
  },
  input: {
    padding: "12px 14px",
    background: "#080c10",
    border: "1px solid #1e2d3d",
    borderRadius: "4px",
    color: "#d4e8f5",
    fontSize: "14px",
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 0.2s",
    letterSpacing: "0.5px",
    width: "100%",
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    background: "rgba(255,59,78,0.08)",
    border: "1px solid rgba(255,59,78,0.25)",
    borderRadius: "4px",
    color: "#ff3b4e",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    marginBottom: "16px",
  },
  errorIcon: {
    fontSize: "14px",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #c4821a, #f5a623)",
    border: "none",
    borderRadius: "4px",
    color: "#040608",
    fontFamily: "var(--font-display)",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "3px",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 20px rgba(245,166,35,0.2)",
    marginBottom: "20px",
  },
  loadingInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  spinner: {
    display: "inline-block",
    width: "14px",
    height: "14px",
    border: "2px solid rgba(4,6,8,0.3)",
    borderTopColor: "#040608",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "#1e2d3d",
    letterSpacing: "0.5px",
  },
};