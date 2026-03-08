import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "cameras", label: "Cameras", icon: "◉" },
  { id: "alerts", label: "Alerts", icon: "⚠", badge: 3 },
  { id: "database", label: "Database", icon: "⊟" },
  { id: "reports", label: "Reports", icon: "≡" },
];

export default function Navbar({ user, onLogout, activePage, onNavigate }) {
  const [time, setTime] = useState(new Date());
  const [status] = useState("ONLINE");

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();

  return (
    <nav style={styles.nav}>
      {/* Left: Brand */}
      <div style={styles.brand}>
        <div style={styles.brandIcon}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="10" stroke="#f5a623" strokeWidth="1.5"/>
            <circle cx="11" cy="11" r="5" stroke="#f5a623" strokeWidth="1"/>
            <circle cx="11" cy="11" r="1.5" fill="#f5a623"/>
            <line x1="11" y1="1" x2="11" y2="5" stroke="#f5a623" strokeWidth="1.5"/>
            <line x1="11" y1="17" x2="11" y2="21" stroke="#f5a623" strokeWidth="1.5"/>
            <line x1="1" y1="11" x2="5" y2="11" stroke="#f5a623" strokeWidth="1.5"/>
            <line x1="17" y1="11" x2="21" y2="11" stroke="#f5a623" strokeWidth="1.5"/>
          </svg>
        </div>
        <div>
          <div style={styles.brandName}>DrishtiAI</div>
          <div style={styles.brandSub}>SURVEILLANCE SYSTEM</div>
        </div>
        <div style={styles.statusDot} title={status} />
      </div>

      {/* Center: Navigation */}
      <div style={styles.navItems}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            style={{
              ...styles.navItem,
              ...(activePage === item.id ? styles.navItemActive : {}),
            }}
            onClick={() => onNavigate?.(item.id)}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span style={styles.badge}>{item.badge}</span>
            )}
            {activePage === item.id && <div style={styles.navUnderline} />}
          </button>
        ))}
      </div>

      {/* Right: User + Clock */}
      <div style={styles.right}>
        <div style={styles.clock}>
          <div style={styles.clockTime}>{formatTime(time)}</div>
          <div style={styles.clockDate}>{formatDate(time)}</div>
        </div>
        <div style={styles.divider} />
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={styles.userName}>{user?.name || "Unknown"}</div>
            <div style={styles.userRole}>
              <span style={{
                ...styles.roleTag,
                ...(user?.role === "admin" ? styles.roleAdmin : styles.roleInvestigator)
              }}>
                {user?.role?.toUpperCase() || "GUEST"}
              </span>
            </div>
          </div>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout} title="Logout">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-3-4-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: "60px",
    background: "linear-gradient(180deg, #0c1118 0%, #080c10 100%)",
    borderBottom: "1px solid #1e2d3d",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 1px 0 0 #1e2d3d, 0 4px 20px rgba(0,0,0,0.5)",
    gap: "16px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  brandIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #111820, #080c10)",
    border: "1px solid #2e4a66",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 12px rgba(245,166,35,0.1)",
  },
  brandName: {
    fontFamily: "var(--font-display)",
    fontSize: "18px",
    fontWeight: "700",
    letterSpacing: "4px",
    color: "#f5a623",
    lineHeight: 1,
  },
  brandSub: {
    fontFamily: "var(--font-mono)",
    fontSize: "8px",
    color: "#3a5570",
    letterSpacing: "2px",
    marginTop: "2px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#00e5a0",
    animation: "pulse-green 2s ease-in-out infinite",
    flexShrink: 0,
  },
  navItems: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    flex: 1,
    justifyContent: "center",
  },
  navItem: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "8px 16px",
    background: "transparent",
    border: "none",
    color: "#6b8ca8",
    fontFamily: "var(--font-display)",
    fontSize: "13px",
    fontWeight: "600",
    letterSpacing: "1px",
    cursor: "pointer",
    borderRadius: "4px",
    transition: "all 0.2s",
    textTransform: "uppercase",
  },
  navItemActive: {
    color: "#f5a623",
    background: "rgba(245,166,35,0.07)",
  },
  navIcon: {
    fontSize: "14px",
    opacity: 0.8,
  },
  navUnderline: {
    position: "absolute",
    bottom: "-1px",
    left: "12px",
    right: "12px",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #f5a623, transparent)",
    borderRadius: "1px",
  },
  badge: {
    background: "#ff3b4e",
    color: "#fff",
    fontSize: "10px",
    fontFamily: "var(--font-mono)",
    fontWeight: "700",
    padding: "1px 5px",
    borderRadius: "8px",
    lineHeight: 1.4,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexShrink: 0,
  },
  clock: {
    textAlign: "right",
  },
  clockTime: {
    fontFamily: "var(--font-mono)",
    fontSize: "16px",
    color: "#d4e8f5",
    letterSpacing: "1px",
    lineHeight: 1,
  },
  clockDate: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "#3a5570",
    letterSpacing: "1px",
    marginTop: "3px",
  },
  divider: {
    width: "1px",
    height: "28px",
    background: "#1e2d3d",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  userAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "6px",
    background: "linear-gradient(135deg, #243547, #18222e)",
    border: "1px solid #2e4a66",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-display)",
    fontSize: "15px",
    fontWeight: "700",
    color: "#f5a623",
  },
  userName: {
    fontFamily: "var(--font-display)",
    fontSize: "13px",
    fontWeight: "600",
    color: "#d4e8f5",
    letterSpacing: "0.5px",
    lineHeight: 1,
  },
  userRole: {
    marginTop: "3px",
  },
  roleTag: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "1px",
    padding: "1px 6px",
    borderRadius: "2px",
  },
  roleAdmin: {
    background: "rgba(245,166,35,0.15)",
    color: "#f5a623",
    border: "1px solid rgba(245,166,35,0.3)",
  },
  roleInvestigator: {
    background: "rgba(33,150,243,0.15)",
    color: "#64b5f6",
    border: "1px solid rgba(33,150,243,0.3)",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    background: "transparent",
    border: "1px solid #1e2d3d",
    borderRadius: "6px",
    color: "#3a5570",
    transition: "all 0.2s",
    cursor: "pointer",
  },
};