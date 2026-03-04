import { useEffect, useState, useRef } from "react";

const ACCENT_MAP = {
  amber: {
    color: "#f5a623",
    glow: "rgba(245,166,35,0.12)",
    border: "rgba(245,166,35,0.25)",
    pulse: "pulse-amber",
  },
  green: {
    color: "#00e5a0",
    glow: "rgba(0,229,160,0.10)",
    border: "rgba(0,229,160,0.22)",
    pulse: "pulse-green",
  },
  red: {
    color: "#ff3b4e",
    glow: "rgba(255,59,78,0.12)",
    border: "rgba(255,59,78,0.25)",
    pulse: null,
  },
  blue: {
    color: "#2196f3",
    glow: "rgba(33,150,243,0.10)",
    border: "rgba(33,150,243,0.22)",
    pulse: null,
  },
};

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(Math.floor(eased * target));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
}

export default function StatCard({
  label,
  value,
  unit = "",
  icon,
  accent = "amber",
  trend,
  trendValue,
  subtitle,
  live = false,
  delay = 0,
}) {
  const [visible, setVisible] = useState(false);
  const countedValue = useCountUp(visible ? value : 0, 1400);
  const theme = ACCENT_MAP[accent] || ACCENT_MAP.amber;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const trendColor =
    trend === "up" ? "#00e5a0" : trend === "down" ? "#ff3b4e" : "#6b8ca8";
  const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <div
      style={{
        ...styles.card,
        borderColor: theme.border,
        background: `linear-gradient(135deg, #0c1118 0%, #080c10 100%)`,
        boxShadow: visible
          ? `0 0 0 1px ${theme.border}, 0 8px 32px rgba(0,0,0,0.5), inset 0 0 40px ${theme.glow}`
          : "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ${delay}ms, transform 0.5s ${delay}ms, box-shadow 0.5s ${delay}ms`,
      }}
    >
      {/* Corner marks */}
      <span style={{ ...styles.corner, top: 0, left: 0, borderColor: theme.color }} />
      <span style={{ ...styles.corner, top: 0, right: 0, borderColor: theme.color, transform: "rotate(90deg)" }} />
      <span style={{ ...styles.corner, bottom: 0, left: 0, borderColor: theme.color, transform: "rotate(-90deg)" }} />
      <span style={{ ...styles.corner, bottom: 0, right: 0, borderColor: theme.color, transform: "rotate(180deg)" }} />

      {/* Header */}
      <div style={styles.header}>
        <div style={{ ...styles.iconBox, borderColor: theme.border, background: theme.glow }}>
          <span style={{ fontSize: "18px" }}>{icon}</span>
        </div>
        {live && (
          <div style={styles.liveBadge}>
            <div style={{ ...styles.liveDot, background: theme.color, animation: `${theme.pulse || "pulse-amber"} 2s infinite` }} />
            <span style={{ ...styles.liveText, color: theme.color }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div style={styles.valueRow}>
        <span style={{ ...styles.value, color: theme.color }}>
          {countedValue.toLocaleString()}
        </span>
        {unit && <span style={styles.unit}>{unit}</span>}
      </div>

      {/* Label */}
      <div style={styles.label}>{label}</div>

      {/* Footer */}
      {(subtitle || trendValue) && (
        <div style={styles.footer}>
          {trendValue && (
            <span style={{ color: trendColor, fontFamily: "var(--font-mono)", fontSize: "11px" }}>
              {trendArrow} {trendValue}
            </span>
          )}
          {subtitle && (
            <span style={styles.subtitle}>{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    position: "relative",
    padding: "20px",
    borderRadius: "6px",
    border: "1px solid transparent",
    overflow: "hidden",
    minWidth: "180px",
    flex: 1,
  },
  corner: {
    position: "absolute",
    width: "10px",
    height: "10px",
    borderTop: "1.5px solid",
    borderLeft: "1.5px solid",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  iconBox: {
    width: "38px",
    height: "38px",
    borderRadius: "6px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
  },
  liveText: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    letterSpacing: "1px",
  },
  valueRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "6px",
    marginBottom: "6px",
  },
  value: {
    fontFamily: "var(--font-display)",
    fontSize: "40px",
    fontWeight: "700",
    lineHeight: 1,
    letterSpacing: "-1px",
    animation: "countUp 0.4s ease-out",
  },
  unit: {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "#3a5570",
    letterSpacing: "1px",
  },
  label: {
    fontFamily: "var(--font-display)",
    fontSize: "11px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: "#6b8ca8",
    fontWeight: "600",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "14px",
    paddingTop: "12px",
    borderTop: "1px solid #1e2d3d",
  },
  subtitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#3a5570",
    letterSpacing: "0.5px",
  },
};
