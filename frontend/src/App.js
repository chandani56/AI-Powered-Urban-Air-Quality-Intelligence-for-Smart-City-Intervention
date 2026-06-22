import { useState, useEffect, useRef, useCallback } from "react";
import MapView from "./MapView";

// ─── DESIGN TOKENS ──────────────────────────────────────────────
// Palette: Deep ink (#0D1117) + Electric teal (#00D4AA) + Amber hazard (#F59E0B)
// Unique element: "Pollution Fingerprint" radial pulse map
// Typography: mono for data, sans for labels
const PALETTE = {
  bg: "#0D1117",
  bg2: "#161B22",
  bg3: "#1C2333",
  teal: "#00D4AA",
  tealDim: "#00A885",
  tealFaint: "rgba(0,212,170,0.1)",
  amber: "#F59E0B",
  amberDim: "#D97706",
  amberFaint: "rgba(245,158,11,0.1)",
  red: "#EF4444",
  redFaint: "rgba(239,68,68,0.1)",
  green: "#10B981",
  greenFaint: "rgba(16,185,129,0.1)",
  purple: "#8B5CF6",
  purpleFaint: "rgba(139,92,246,0.1)",
  text: "#E6EDF3",
  textDim: "#8B949E",
  textFaint: "#484F58",
  border: "rgba(255,255,255,0.08)",
  borderBright: "rgba(0,212,170,0.3)",
};

// ─── MOCK DATA ───────────────────────────────────────────────────
const CITIES = [
  "Delhi NCR",
  "Mumbai",
  "Bengaluru",
  "Chennai",
  "Kolkata",
  "Hyderabad",
];
const ZONES = [
  "Ward 47 — Anand Vihar",
  "Ward 12 — Connaught Place",
  "Ward 63 — Rohini",
  "Ward 31 — Dwarka",
  "Zone A — Okhla Industrial",
  "Zone B — Gurgaon Tech Corridor",
];

const SOURCE_TYPES = [
  {
    id: "industrial",
    label: "Industrial stacks",
    icon: "🏭",
    color: "#EF4444",
    pct: 34,
  },
  {
    id: "traffic",
    label: "Vehicular emission",
    icon: "🚗",
    color: "#F59E0B",
    pct: 28,
  },
  {
    id: "construction",
    label: "Construction dust",
    icon: "🏗️",
    color: "#8B5CF6",
    pct: 19,
  },
  {
    id: "burning",
    label: "Waste burning",
    icon: "🔥",
    color: "#F97316",
    pct: 11,
  },
  {
    id: "domestic",
    label: "Domestic cooking",
    icon: "🍳",
    color: "#10B981",
    pct: 8,
  },
];

const FORECAST_HOURS = Array.from({ length: 72 }, (_, i) => {
  const h = new Date();
  h.setHours(h.getHours() + i);
  const base = 160 + Math.sin(i * 0.3) * 60 + Math.random() * 30;
  return { hour: h, aqi: Math.round(base), label: i % 6 === 0 ? `+${i}h` : "" };
});

const HOTSPOTS = [
  {
    id: 1,
    zone: "Anand Vihar",
    lat: 28.645,
    lng: 77.315,
    aqi: 387,
    trend: "rising",
    primarySource: "Industrial stacks",
    confidence: 94,
    actions: 3,
    severity: "hazardous",
  },
  {
    id: 2,
    zone: "Okhla Phase II",
    lat: 28.535,
    lng: 77.271,
    aqi: 312,
    trend: "stable",
    primarySource: "Vehicular emission",
    confidence: 87,
    actions: 2,
    severity: "very-unhealthy",
  },
  {
    id: 3,
    zone: "Gurgaon MG Road",
    lat: 28.479,
    lng: 77.073,
    aqi: 278,
    trend: "falling",
    primarySource: "Construction dust",
    confidence: 79,
    actions: 1,
    severity: "unhealthy",
  },
  {
    id: 4,
    zone: "Rohini Sector 8",
    lat: 28.726,
    lng: 77.108,
    aqi: 241,
    trend: "rising",
    primarySource: "Waste burning",
    confidence: 91,
    actions: 2,
    severity: "unhealthy",
  },
];

const ENFORCEMENT_QUEUE = [
  {
    id: "ENF-2847",
    priority: "P1",
    entity: "Mayapuri Steelworks",
    type: "Industrial",
    violation: "Stack emission limit exceeded 4.2× since 6AM",
    confidence: 96,
    evidence: [
      "Thermal satellite anomaly",
      "PM2.5 spike correlation",
      "Wind trajectory model",
    ],
    estimatedImpact: "−23 µg/m³",
    assigned: "CPCB Inspector Sharma",
  },
  {
    id: "ENF-2848",
    priority: "P1",
    entity: "NH-48 Corridor Fleet",
    type: "Vehicular",
    violation: "84 BSIII diesel trucks flagged; prohibited hours 6-10AM",
    confidence: 91,
    evidence: [
      "ANPR camera log",
      "FASTag movement data",
      "Emission sensor array",
    ],
    estimatedImpact: "−18 µg/m³",
    assigned: "Traffic SHO Mehta",
  },
  {
    id: "ENF-2849",
    priority: "P2",
    entity: "Metro Realty Construction",
    type: "Construction",
    violation: "Dust suppression inactive; permit condition #7 breach",
    confidence: 83,
    evidence: [
      "Drone thermal scan",
      "Water sprinkler IoT feed",
      "Permit database",
    ],
    estimatedImpact: "−11 µg/m³",
    assigned: "DPCC Field Team B",
  },
  {
    id: "ENF-2850",
    priority: "P2",
    entity: "Sector 16 MCD Zone",
    type: "Burning",
    violation: "3 active waste burning sites; mapped via satellite",
    confidence: 88,
    evidence: [
      "Sentinel-2 hotspot",
      "MODIS fire detection",
      "Citizen complaint cluster",
    ],
    estimatedImpact: "−8 µg/m³",
    assigned: "Unassigned",
  },
];

const HEALTH_ADVISORIES = [
  {
    ward: "Anand Vihar",
    population: 84200,
    vulnerable: 12400,
    aqiForecast: 387,
    riskLevel: "extreme",
    affectedFacilities: [
      "St. Mary School",
      "Jubilee Hospital",
      "Senior Centre — Block D",
    ],
    advisory:
      "School closure recommended. Outdoor workers must use N95. Hospital intake may rise 30%.",
  },
  {
    ward: "Okhla",
    population: 134000,
    vulnerable: 18900,
    aqiForecast: 312,
    riskLevel: "high",
    affectedFacilities: ["Govt. Middle School #4", "Kendriya Vidyalaya"],
    advisory: "Restrict outdoor physical activity before 10AM and after 6PM.",
  },
  {
    ward: "Rohini Sec 8",
    population: 210000,
    vulnerable: 29100,
    aqiForecast: 241,
    riskLevel: "moderate",
    affectedFacilities: ["Ryan Int. School"],
    advisory:
      "Limit outdoor exposure for children and elderly. Keep windows closed 6-9AM.",
  },
];

const CITY_COMPARISON = [
  { city: "Delhi NCR", aqi: 312, trend: +12, interventions: 8, compliance: 61 },
  { city: "Mumbai", aqi: 178, trend: -8, interventions: 12, compliance: 78 },
  { city: "Bengaluru", aqi: 142, trend: -3, interventions: 15, compliance: 84 },
  { city: "Chennai", aqi: 156, trend: +5, interventions: 11, compliance: 72 },
  { city: "Kolkata", aqi: 234, trend: +18, interventions: 6, compliance: 58 },
  {
    city: "Hyderabad",
    aqi: 189,
    trend: -11,
    interventions: 14,
    compliance: 79,
  },
];

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────
function aqiColor(aqi) {
  if (aqi <= 50) return "#10B981";
  if (aqi <= 100) return "#84CC16";
  if (aqi <= 150) return "#F59E0B";
  if (aqi <= 200) return "#F97316";
  if (aqi <= 300) return "#EF4444";
  return "#8B5CF6";
}
function aqiLabel(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (Sensitive)";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

// ─── COMPONENTS ─────────────────────────────────────────────────

function PulseDot({ x, y, color, size = 8, intensity = 1 }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={size * 2.5 * intensity}
        fill={color}
        opacity={0.15}
      >
        <animate
          attributeName="r"
          values={`${size * 1.5};${size * 4};${size * 1.5}`}
          dur="2.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.2;0.05;0.2"
          dur="2.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={x} cy={y} r={size} fill={color} opacity={0.9} />
    </g>
  );
}

function AQIGauge({ value, label }) {
  const color = aqiColor(value);
  const angle = (Math.min(value, 500) / 500) * 180 - 90;
  const r = 60,
    cx = 80,
    cy = 80;
  const toRad = (d) => (d * Math.PI) / 180;
  const arcPath = (startDeg, endDeg, rInner, rOuter) => {
    const s = toRad(startDeg - 90),
      e = toRad(endDeg - 90);
    const x1o = cx + rOuter * Math.cos(s),
      y1o = cy + rOuter * Math.sin(s);
    const x2o = cx + rOuter * Math.cos(e),
      y2o = cy + rOuter * Math.sin(e);
    const x1i = cx + rInner * Math.cos(s),
      y1i = cy + rInner * Math.sin(s);
    const x2i = cx + rInner * Math.cos(e),
      y2i = cy + rInner * Math.sin(e);
    return `M${x1o},${y1o} A${rOuter},${rOuter} 0 0,1 ${x2o},${y2o} L${x2i},${y2i} A${rInner},${rInner} 0 0,0 ${x1i},${y1i} Z`;
  };
  const zones = [
    { s: 0, e: 36, c: "#10B981" },
    { s: 36, e: 72, c: "#84CC16" },
    { s: 72, e: 108, c: "#F59E0B" },
    { s: 108, e: 144, c: "#F97316" },
    { s: 144, e: 162, c: "#EF4444" },
    { s: 162, e: 180, c: "#8B5CF6" },
  ];
  const nx = cx + r * Math.cos(toRad(angle)),
    ny = cy + r * Math.sin(toRad(angle));
  return (
    <svg width="160" height="100" viewBox="0 0 160 100">
      {zones.map((z, i) => (
        <path key={i} d={arcPath(z.s, z.e, 46, 62)} fill={z.c} opacity={0.7} />
      ))}
      <path
        d={arcPath(0, 180, 44, 64)}
        fill="none"
        stroke={PALETTE.bg2}
        strokeWidth={1}
      />
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={4} fill={color} />
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fontSize={18}
        fontWeight="700"
        fill={color}
        fontFamily="monospace"
      >
        {value}
      </text>
      <text
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        fontSize={7}
        fill={PALETTE.textDim}
      >
        AQI
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontSize={8}
        fill={PALETTE.textDim}
      >
        {label}
      </text>
    </svg>
  );
}

function ForecastChart({ data }) {
  const w = 520,
    h = 120;
  const vals = data.slice(0, 48).map((d) => d.aqi);
  const minV = Math.min(...vals),
    maxV = Math.max(...vals);
  const pad = { l: 40, r: 20, t: 16, b: 28 };
  const iw = w - pad.l - pad.r,
    ih = h - pad.t - pad.b;
  const toX = (i) => pad.l + (i / (vals.length - 1)) * iw;
  const toY = (v) => pad.t + ih - ((v - minV) / (maxV - minV)) * ih;
  const linePath = vals
    .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`)
    .join(" ");
  const areaPath =
    linePath +
    ` L${toX(vals.length - 1)},${h - pad.b} L${toX(0)},${h - pad.b} Z`;
  const current = vals[0];
  const colorNow = aqiColor(current);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="fgrd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorNow} stopOpacity={0.3} />
          <stop offset="100%" stopColor={colorNow} stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="lgrad" x1="0" y1="0" x2="1" y2="0">
          {vals.map((v, i) => (
            <stop
              key={i}
              offset={`${(i / (vals.length - 1)) * 100}%`}
              stopColor={aqiColor(v)}
            />
          ))}
        </linearGradient>
      </defs>
      {/* Y gridlines */}
      {[100, 200, 300].map((v) => {
        const y = toY(v);
        if (y < pad.t || y > h - pad.b) return null;
        return (
          <g key={v}>
            <line
              x1={pad.l}
              y1={y}
              x2={w - pad.r}
              y2={y}
              stroke={PALETTE.border}
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
            <text
              x={pad.l - 4}
              y={y + 4}
              textAnchor="end"
              fontSize={7}
              fill={PALETTE.textFaint}
            >
              {v}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#fgrd)" />
      <path
        d={linePath}
        fill="none"
        stroke="url(#lgrad)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Hour labels */}
      {data.slice(0, 48).map((d, i) =>
        d.label ? (
          <text
            key={i}
            x={toX(i)}
            y={h - pad.b + 12}
            textAnchor="middle"
            fontSize={7}
            fill={PALETTE.textFaint}
          >
            {d.label}
          </text>
        ) : null,
      )}
      {/* Now marker */}
      <line
        x1={toX(0)}
        y1={pad.t}
        x2={toX(0)}
        y2={h - pad.b}
        stroke={PALETTE.teal}
        strokeWidth={1}
        strokeDasharray="2,2"
      />
      <text x={toX(0) + 4} y={pad.t + 10} fontSize={7} fill={PALETTE.teal}>
        Now
      </text>
      <circle cx={toX(0)} cy={toY(vals[0])} r={3.5} fill={colorNow} />
    </svg>
  );
}

function SourceDonut({ sources }) {
  const cx = 60,
    cy = 60,
    r = 48,
    innerR = 28;
  let startAngle = -Math.PI / 2;
  const slices = sources.map((s) => {
    const angle = (s.pct / 100) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle),
      y1 = cy + r * Math.sin(startAngle);
    startAngle += angle;
    const x2 = cx + r * Math.cos(startAngle),
      y2 = cy + r * Math.sin(startAngle);
    const xi1 = cx + innerR * Math.cos(startAngle - angle),
      yi1 = cy + innerR * Math.sin(startAngle - angle);
    const xi2 = cx + innerR * Math.cos(startAngle),
      yi2 = cy + innerR * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    return {
      ...s,
      d: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${innerR},${innerR} 0 ${large},0 ${xi1},${yi1} Z`,
    };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={innerR - 2} fill={PALETTE.bg2} />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={9}
          fill={PALETTE.text}
          fontWeight="600"
        >
          Source
        </text>
        <text
          x={cx}
          y={cy + 9}
          textAnchor="middle"
          fontSize={8}
          fill={PALETTE.textDim}
        >
          Analysis
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sources.map((s, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: s.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: PALETTE.textDim }}>
              {s.label}
            </span>
            <span
              style={{
                fontSize: 11,
                color: PALETTE.text,
                fontFamily: "monospace",
                marginLeft: "auto",
              }}
            >
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, color = PALETTE.teal, size = "sm" }) {
  return (
    <span
      style={{
        background: color + "22",
        border: `1px solid ${color}44`,
        color: color,
        borderRadius: 4,
        padding: size === "sm" ? "2px 7px" : "4px 10px",
        fontSize: size === "sm" ? 10 : 12,
        fontWeight: 600,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, style = {}, glow = false }) {
  return (
    <div
      style={{
        background: PALETTE.bg2,
        border: `1px solid ${glow ? PALETTE.tealDim + "55" : PALETTE.border}`,
        borderRadius: 12,
        padding: 20,
        boxShadow: glow ? `0 0 24px ${PALETTE.teal}15` : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Stat({ label, value, sub, color = PALETTE.teal, mono = true }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontSize: 10,
          color: PALETTE.textDim,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 700,
          color,
          fontFamily: mono ? "monospace" : "inherit",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 10, color: PALETTE.textDim }}>{sub}</span>
      )}
    </div>
  );
}

function AISidebar({ messages, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: 380,
        zIndex: 100,
        background: PALETTE.bg2,
        borderLeft: `1px solid ${PALETTE.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${PALETTE.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: PALETTE.teal }}>
            AI Intelligence Engine
          </span>
          <div style={{ fontSize: 10, color: PALETTE.textDim, marginTop: 2 }}>
            Powered by Claude claude-sonnet-4-6
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: PALETTE.textDim,
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ×
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: m.role === "user" ? PALETTE.bg3 : PALETTE.tealFaint,
                border: `1px solid ${m.role === "user" ? PALETTE.border : PALETTE.teal + "44"}`,
                fontSize: 10,
                color: m.role === "user" ? PALETTE.textDim : PALETTE.teal,
              }}
            >
              {m.role === "user" ? "U" : "AI"}
            </div>
            <div
              style={{
                flex: 1,
                fontSize: 12,
                color: m.role === "user" ? PALETTE.textDim : PALETTE.text,
                lineHeight: 1.6,
                background:
                  m.role === "assistant" ? PALETTE.bg3 : "transparent",
                borderRadius: 8,
                padding: m.role === "assistant" ? "10px 12px" : "2px 0",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI HOOK ────────────────────────────────────────────────────

function useAIChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "🌬️ AQIP Intelligence Engine online. I'm analysing real-time pollution fingerprints across Delhi NCR. What would you like to investigate?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (userText, contextData = {}) => {
      const newMessages = [...messages, { role: "user", content: userText }];
      setMessages(newMessages);
      setLoading(true);

      try {
        const systemPrompt = `You are an expert urban air quality intelligence analyst embedded in a real-time monitoring platform. Current context: ${JSON.stringify(contextData)}. Be specific, data-driven, and action-oriented. Keep responses under 200 words.`;

        const response = await fetch("http://localhost:5000/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1000,
            system: systemPrompt,
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await response.json();
        console.log("AI Response:", data); // debug ke liye

        if (data.content && data.content[0]) {
          const content = data.content[0].text;
          setMessages((prev) => [...prev, { role: "assistant", content }]);
        } else if (data.error) {
          console.error("API Error:", data.error);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `⚠️ Error: ${data.error.message}` },
          ]);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ Backend se connect nahi ho pa raha. Backend chal raha hai?",
          },
        ]);
      }

      setLoading(false);
    },
    [messages],
  );

  return { messages, loading, sendMessage };
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function AQIPlatform() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCity, setSelectedCity] = useState("Delhi NCR");
  const [showAI, setShowAI] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [tick, setTick] = useState(0);
  const [hotspots, setHotspots] = useState(HOTSPOTS);
  const [enforcement, setEnforcement] = useState(ENFORCEMENT_QUEUE);
  const [weather, setWeather] = useState(null); // ← NEW
  const { messages, loading, sendMessage } = useAIChat();

  // Hotspots + Enforcement fetch
  // Real AQI fetch
  useEffect(() => {
    fetch(
      `http://localhost:5000/api/realtime-aqi/${encodeURIComponent(selectedCity)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok" && data.stations.length > 0) {
          setHotspots(data.stations);
          console.log("✅ Real AQI loaded:", data.stations.length, "stations");
        }
      })
      .catch(() => console.log("AQI fallback to mock"));
  }, [selectedCity]);

  // Weather fetch — city change hone pe ← NEW
  useEffect(() => {
    fetch(
      `http://localhost:5000/api/weather/${encodeURIComponent(selectedCity)}`,
    )
      .then((res) => res.json())
      .then((data) => setWeather(data))
      .catch(() => console.log("Weather fallback"));
  }, [selectedCity]);

  const liveAQI = HOTSPOTS[0].aqi + Math.round(Math.sin(tick * 0.3) * 8);

  const contextData = {
    city: selectedCity,
    liveAQI,
    hotspots: hotspots,
    sources: SOURCE_TYPES,
    enforcement: enforcement.length,
  };

  const handleAISend = (e) => {
    e.preventDefault();
    if (!aiInput.trim() || loading) return;
    sendMessage(aiInput, contextData);
    setAiInput("");
  };

  const tabs = [
    { id: "dashboard", label: "Live Dashboard", icon: "📡" },
    { id: "attribution", label: "Source Attribution", icon: "🔬" },
    { id: "forecast", label: "AQI Forecast", icon: "🌦️" },
    { id: "enforcement", label: "Enforcement Queue", icon: "⚖️" },
    { id: "health", label: "Health Alerts", icon: "🏥" },
    { id: "comparison", label: "City Intelligence", icon: "🗺️" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PALETTE.bg,
        color: PALETTE.text,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${PALETTE.border}`,
          background: PALETTE.bg2,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            height: 60,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${PALETTE.teal}, ${PALETTE.tealDim})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              🌬️
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: PALETTE.teal,
                  letterSpacing: "-0.01em",
                }}
              >
                AQIP
              </div>
              <div
                style={{ fontSize: 9, color: PALETTE.textFaint, marginTop: -1 }}
              >
                AI-Powered Urban Air Quality Intelligence
              </div>
            </div>
          </div>
          <div style={{ width: 1, height: 32, background: PALETTE.border }} />
          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: PALETTE.green,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: PALETTE.green,
                  animation: "ping 1.5s infinite",
                }}
              />
            </div>
            <span
              style={{ fontSize: 10, color: PALETTE.green, fontWeight: 600 }}
            >
              LIVE
            </span>
            <span style={{ fontSize: 10, color: PALETTE.textDim }}>
              · {new Date().toLocaleTimeString()}
            </span>
          </div>
          {/* City selector */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{
              background: PALETTE.bg3,
              border: `1px solid ${PALETTE.border}`,
              color: PALETTE.text,
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              cursor: "pointer",
              marginLeft: "auto",
            }}
          >
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {/* AQI badge */}
          <div
            style={{
              background: aqiColor(liveAQI) + "22",
              border: `1px solid ${aqiColor(liveAQI)}55`,
              borderRadius: 8,
              padding: "6px 14px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: aqiColor(liveAQI),
                fontFamily: "monospace",
                lineHeight: 1,
              }}
            >
              {liveAQI}
            </div>
            <div
              style={{ fontSize: 8, color: aqiColor(liveAQI), opacity: 0.8 }}
            >
              {aqiLabel(liveAQI)}
            </div>
          </div>
          <button
            onClick={() => setShowAI((s) => !s)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              background: showAI ? PALETTE.tealFaint : "transparent",
              border: `1px solid ${PALETTE.teal}`,
              borderRadius: 8,
              color: PALETTE.teal,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🤖 AI Analyst {loading && "..."}
          </button>
        </div>
        {/* Tab bar */}
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            gap: 4,
            borderTop: `1px solid ${PALETTE.border}`,
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "10px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                color: activeTab === t.id ? PALETTE.teal : PALETTE.textDim,
                borderBottom:
                  activeTab === t.id
                    ? `2px solid ${PALETTE.teal}`
                    : "2px solid transparent",
                fontWeight: activeTab === t.id ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "24px",
          paddingRight: showAI ? 420 : 24,
          transition: "padding-right 0.3s",
        }}
      >
        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Top stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5,1fr)",
                gap: 16,
              }}
            >
              {[
                {
                  label: "Live AQI (worst zone)",
                  value: liveAQI,
                  color: aqiColor(liveAQI),
                },
                {
                  label: "Active hotspots",
                  value: 4,
                  color: PALETTE.amber,
                  sub: "2 critical",
                },
                {
                  label: "Enforcement actions",
                  value: 7,
                  color: PALETTE.purple,
                  sub: "today",
                },
                {
                  label: "Population exposed",
                  value: "2.1M",
                  color: PALETTE.red,
                  sub: "AQI > 200 zones",
                },
                {
                  label: "24h trend",
                  value: "+12%",
                  color: PALETTE.amber,
                  sub: "worsening",
                },
              ].map((s, i) => (
                <Card key={i} glow={i === 0}>
                  <Stat
                    label={s.label}
                    value={s.value}
                    color={s.color}
                    sub={s.sub}
                  />
                </Card>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr",
                gap: 20,
              }}
            >
              {/* Map */}
              <Card>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: PALETTE.text,
                      }}
                    >
                      Pollution Fingerprint Map
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: PALETTE.textDim,
                        marginTop: 2,
                      }}
                    >
                      Real-time AQI · Ward-level resolution · {selectedCity}
                    </div>
                  </div>
                  <Badge color={PALETTE.red} size="sm">
                    4 HOTSPOTS
                  </Badge>
                </div>
                <MapView selectedCity={selectedCity} />

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 12,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    "Good ≤50",
                    "Moderate ≤100",
                    "Unhealthy ≤200",
                    "Very Unhealthy ≤300",
                    "Hazardous >300",
                  ].map((l, i) => {
                    const cs = [
                      "#10B981",
                      "#84CC16",
                      "#F97316",
                      "#EF4444",
                      "#8B5CF6",
                    ];
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 9,
                          color: PALETTE.textDim,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: cs[i],
                          }}
                        />
                        {l}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Hotspot list */}
              <Card>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: 14,
                  }}
                >
                  Active Hotspots — Ranked by Severity
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {HOTSPOTS.map((h, i) => (
                    <div
                      key={h.id}
                      style={{
                        background: PALETTE.bg3,
                        borderRadius: 8,
                        padding: "12px 14px",
                        border: `1px solid ${aqiColor(h.aqi)}22`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 6,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: PALETTE.text,
                            }}
                          >
                            {h.zone}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: PALETTE.textDim,
                              marginTop: 1,
                            }}
                          >
                            {h.primarySource} · {h.confidence}% confidence
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color: aqiColor(h.aqi),
                              fontFamily: "monospace",
                              lineHeight: 1,
                            }}
                          >
                            {h.aqi}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color:
                                h.trend === "rising"
                                  ? PALETTE.red
                                  : h.trend === "falling"
                                    ? PALETTE.green
                                    : PALETTE.amber,
                            }}
                          >
                            {h.trend === "rising"
                              ? "↑ Rising"
                              : h.trend === "falling"
                                ? "↓ Falling"
                                : "→ Stable"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Badge color={aqiColor(h.aqi)} size="sm">
                          {aqiLabel(h.aqi)}
                        </Badge>
                        <Badge color={PALETTE.purple} size="sm">
                          {h.actions} actions pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* AI Quick-Ask */}
            <Card glow>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: PALETTE.teal,
                  marginBottom: 10,
                }}
              >
                🤖 Ask the AI Analyst
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  "What's causing the AQI spike in Anand Vihar?",
                  "Which enforcement action will have the highest impact today?",
                  "Forecast peak AQI for tomorrow morning rush hour",
                  "Which schools are at risk and need immediate advisory?",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      sendMessage(q, contextData);
                      setShowAI(true);
                    }}
                    style={{
                      padding: "7px 12px",
                      background: PALETTE.bg3,
                      border: `1px solid ${PALETTE.border}`,
                      borderRadius: 8,
                      color: PALETTE.textDim,
                      fontSize: 11,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── SOURCE ATTRIBUTION ── */}
        {activeTab === "attribution" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              <Card>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: 16,
                  }}
                >
                  Pollution Fingerprint — Source Breakdown
                </div>
                <SourceDonut sources={SOURCE_TYPES} />
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background: PALETTE.bg3,
                    borderRadius: 8,
                    border: `1px solid ${PALETTE.teal}22`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: PALETTE.teal,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    AI ANALYSIS
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: PALETTE.textDim,
                      lineHeight: 1.6,
                    }}
                  >
                    Industrial stacks (34%) remain the dominant contributor —
                    particularly Mayapuri and Narela industrial clusters.
                    Vehicular emissions (28%) show a predictable 6-10AM peak
                    correlating with commuter traffic on NH-48 and Ring Road.
                  </div>
                </div>
              </Card>
              <Card>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: 16,
                  }}
                >
                  Zone-Level Attribution
                </div>
                {ZONES.map((z, i) => {
                  const pct = [34, 28, 22, 18, 31, 25][i];
                  const src = SOURCE_TYPES[i % SOURCE_TYPES.length];
                  const aqi = [387, 312, 278, 241, 198, 176][i];
                  return (
                    <div
                      key={z}
                      style={{
                        padding: "12px 0",
                        borderBottom: `1px solid ${PALETTE.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <AQIGauge value={aqi} label={z.split("—")[0].trim()} />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: PALETTE.text,
                            marginBottom: 4,
                          }}
                        >
                          {z}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: 4,
                              background: PALETTE.bg3,
                              borderRadius: 2,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: src.color,
                                borderRadius: 2,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              color: src.color,
                              fontFamily: "monospace",
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: PALETTE.textDim }}>
                          Primary: {src.label}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: PALETTE.textFaint,
                            marginTop: 2,
                          }}
                        >
                          Confidence: {[94, 87, 79, 91, 82, 76][i]}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>

            {/* Spatial-temporal analysis */}
            <Card>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: PALETTE.text,
                  marginBottom: 16,
                }}
              >
                Spatial-Temporal Emission Pattern — Last 7 Days
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 8,
                }}
              >
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day, di) => (
                    <div key={day}>
                      <div
                        style={{
                          fontSize: 10,
                          color: PALETTE.textDim,
                          textAlign: "center",
                          marginBottom: 6,
                        }}
                      >
                        {day}
                      </div>
                      {Array.from({ length: 6 }, (_, hi) => {
                        const aqi =
                          150 +
                          Math.round(
                            Math.sin(di * 0.8 + hi * 0.5) * 80 +
                              Math.random() * 40,
                          );
                        return (
                          <div
                            key={hi}
                            title={`${["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"][hi]}: AQI ${aqi}`}
                            style={{
                              height: 28,
                              background: aqiColor(aqi) + "44",
                              border: `1px solid ${aqiColor(aqi)}22`,
                              borderRadius: 4,
                              marginBottom: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 8,
                              color: aqiColor(aqi),
                              fontFamily: "monospace",
                            }}
                          >
                            {aqi}
                          </div>
                        );
                      })}
                    </div>
                  ),
                )}
              </div>
              <div
                style={{ fontSize: 10, color: PALETTE.textDim, marginTop: 8 }}
              >
                Each cell = 4-hour block. Hover for details.
              </div>
            </Card>
          </div>
        )}

        {/* ── FORECAST ── */}
        {activeTab === "forecast" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
              }}
            >
              {[
                {
                  horizon: "6h",
                  aqi: 341,
                  label: "Very Unhealthy",
                  confidence: "92%",
                },
                {
                  horizon: "24h",
                  aqi: 289,
                  label: "Very Unhealthy",
                  confidence: "84%",
                },
                {
                  horizon: "48h",
                  aqi: 198,
                  label: "Unhealthy",
                  confidence: "71%",
                },
                {
                  horizon: "72h",
                  aqi: 156,
                  label: "Unhealthy (Sensitive)",
                  confidence: "61%",
                },
              ].map((f) => (
                <Card key={f.horizon}>
                  <div
                    style={{
                      fontSize: 10,
                      color: PALETTE.textDim,
                      marginBottom: 8,
                    }}
                  >
                    Forecast +{f.horizon}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: aqiColor(f.aqi),
                      fontFamily: "monospace",
                      lineHeight: 1,
                    }}
                  >
                    {f.aqi}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: aqiColor(f.aqi),
                      marginTop: 4,
                    }}
                  >
                    {f.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: PALETTE.textDim,
                      marginTop: 6,
                    }}
                  >
                    Model confidence: {f.confidence}
                  </div>
                </Card>
              ))}
            </div>

            <Card>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: PALETTE.text,
                  marginBottom: 4,
                }}
              >
                72-Hour AQI Trajectory — 1km Grid Resolution
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: PALETTE.textDim,
                  marginBottom: 16,
                }}
              >
                Integrating meteorological, traffic, and emission calendar
                models
              </div>
              <ForecastChart data={FORECAST_HOURS} />
            </Card>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              <Card>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: 14,
                  }}
                >
                  🌤️ Live Meteorological Drivers — {selectedCity}
                </div>
                {weather ? (
                  [
                    {
                      param: "Temperature",
                      value: `${weather.temperature}°C`,
                      impact: "Affects dispersion rate",
                      color: PALETTE.amber,
                    },
                    {
                      param: "Humidity",
                      value: `${weather.humidity}%`,
                      impact:
                        weather.humidity > 70
                          ? "High — PM2.5 growth likely"
                          : "Normal levels",
                      color:
                        weather.humidity > 70 ? PALETTE.red : PALETTE.green,
                    },
                    {
                      param: "Wind Speed",
                      value: `${weather.windSpeed} m/s`,
                      impact:
                        weather.windSpeed < 2
                          ? "Low — pollutants trapped"
                          : "Dispersing conditions",
                      color:
                        weather.windSpeed < 2 ? PALETTE.red : PALETTE.green,
                    },
                    {
                      param: "Wind Direction",
                      value: `${weather.windDirection}°`,
                      impact: "Carrying from industrial belt",
                      color: PALETTE.amber,
                    },
                    {
                      param: "Visibility",
                      value: `${(weather.visibility / 1000).toFixed(1)} km`,
                      impact:
                        weather.visibility < 2000
                          ? "Very poor — smog alert"
                          : "Reduced visibility",
                      color:
                        weather.visibility < 2000 ? PALETTE.red : PALETTE.amber,
                    },
                    {
                      param: "Pressure",
                      value: `${weather.pressure} hPa`,
                      impact: "Atmospheric conditions",
                      color: PALETTE.teal,
                    },
                    {
                      param: "Conditions",
                      value: weather.description,
                      impact: "Current sky status",
                      color: PALETTE.textDim,
                    },
                  ].map((d, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: `1px solid ${PALETTE.border}`,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: PALETTE.text }}>
                          {d.param}
                        </div>
                        <div style={{ fontSize: 10, color: PALETTE.textDim }}>
                          {d.impact}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: "monospace",
                          color: d.color,
                        }}
                      >
                        {d.value}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      fontSize: 11,
                      color: PALETTE.textDim,
                      padding: "20px 0",
                      textAlign: "center",
                    }}
                  >
                    🌤️ Loading weather data...
                  </div>
                )}
              </Card>
              <Card>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: 14,
                  }}
                >
                  Recommended Intervention Windows
                </div>
                {[
                  {
                    time: "Tonight 10PM – 6AM",
                    action: "Restrict BSIII diesel truck movement on Ring Road",
                    impact: "−28 µg/m³ peak AQI",
                    urgency: "CRITICAL",
                  },
                  {
                    time: "Tomorrow 6–9AM",
                    action: "Deploy water sprinklers at Anand Vihar flyover",
                    impact: "−14 µg/m³",
                    urgency: "HIGH",
                  },
                  {
                    time: "Tomorrow 8AM",
                    action: "Halt construction at Mayur Vihar site",
                    impact: "−9 µg/m³",
                    urgency: "MEDIUM",
                  },
                  {
                    time: "Ongoing",
                    action:
                      "Increase public transport frequency on NH-48 corridor",
                    impact: "−6 µg/m³ sustained",
                    urgency: "MEDIUM",
                  },
                ].map((w, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px",
                      background: PALETTE.bg3,
                      borderRadius: 8,
                      marginBottom: 8,
                      border: `1px solid ${w.urgency === "CRITICAL" ? PALETTE.red + "44" : PALETTE.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "monospace",
                          color: PALETTE.textDim,
                        }}
                      >
                        {w.time}
                      </span>
                      <Badge
                        color={
                          w.urgency === "CRITICAL"
                            ? PALETTE.red
                            : w.urgency === "HIGH"
                              ? PALETTE.amber
                              : PALETTE.teal
                        }
                      >
                        {w.urgency}
                      </Badge>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: PALETTE.text,
                        marginBottom: 4,
                      }}
                    >
                      {w.action}
                    </div>
                    <div style={{ fontSize: 10, color: PALETTE.green }}>
                      Expected impact: {w.impact}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        {/* ── ENFORCEMENT ── */}
        {activeTab === "enforcement" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
              }}
            >
              {[
                { label: "Priority 1 Actions", value: 2, color: PALETTE.red },
                { label: "Priority 2 Actions", value: 2, color: PALETTE.amber },
                {
                  label: "Est. AQI Reduction",
                  value: "−60",
                  color: PALETTE.green,
                  sub: "µg/m³ if all actioned",
                },
                {
                  label: "Avg. Evidence Score",
                  value: "90%",
                  color: PALETTE.teal,
                  sub: "AI confidence",
                },
              ].map((s, i) => (
                <Card key={i}>
                  <Stat {...s} />
                </Card>
              ))}
            </div>
            {ENFORCEMENT_QUEUE.map((e) => (
              <Card
                key={e.id}
                style={{
                  border: `1px solid ${e.priority === "P1" ? PALETTE.red + "44" : PALETTE.amber + "33"}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 4,
                      }}
                    >
                      <Badge
                        color={
                          e.priority === "P1" ? PALETTE.red : PALETTE.amber
                        }
                      >
                        {e.priority}
                      </Badge>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "monospace",
                          color: PALETTE.textFaint,
                        }}
                      >
                        {e.id}
                      </span>
                      <Badge color={PALETTE.textFaint}>{e.type}</Badge>
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: PALETTE.text,
                      }}
                    >
                      {e.entity}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: PALETTE.textDim,
                        marginTop: 4,
                      }}
                    >
                      {e.violation}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: PALETTE.green,
                        fontWeight: 600,
                      }}
                    >
                      {e.estimatedImpact}
                    </div>
                    <div style={{ fontSize: 9, color: PALETTE.textDim }}>
                      est. AQI impact
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: PALETTE.teal,
                        marginTop: 6,
                      }}
                    >
                      {e.confidence}% confident
                    </div>
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: PALETTE.textDim,
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Evidence Package
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {e.evidence.map((ev, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 10,
                            padding: "3px 8px",
                            background: PALETTE.tealFaint,
                            border: `1px solid ${PALETTE.teal}22`,
                            borderRadius: 4,
                            color: PALETTE.teal,
                          }}
                        >
                          ✓ {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: PALETTE.textDim,
                        marginBottom: 4,
                      }}
                    >
                      Assigned to
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          e.assigned === "Unassigned"
                            ? PALETTE.amber
                            : PALETTE.text,
                      }}
                    >
                      {e.assigned}
                    </div>
                    <button
                      onClick={() =>
                        sendMessage(
                          `Generate a detailed enforcement action report for ${e.entity}. Include recommended immediate actions, legal provisions applicable under Environmental Protection Act, and documentation checklist.`,
                          contextData,
                        ) || setShowAI(true)
                      }
                      style={{
                        marginTop: 8,
                        padding: "6px 12px",
                        background: PALETTE.tealFaint,
                        border: `1px solid ${PALETTE.teal}44`,
                        borderRadius: 6,
                        color: PALETTE.teal,
                        fontSize: 10,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Generate Report 🤖
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── HEALTH ALERTS ── */}
        {activeTab === "health" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {[
                {
                  label: "Population under alert",
                  value: "4.2M",
                  color: PALETTE.red,
                  sub: "across 6 wards",
                },
                {
                  label: "Vulnerable individuals",
                  value: "61K",
                  color: PALETTE.amber,
                  sub: "elderly + children + patients",
                },
                {
                  label: "Facilities at risk",
                  value: 7,
                  color: PALETTE.purple,
                  sub: "schools, hospitals",
                },
              ].map((s, i) => (
                <Card key={i}>
                  <Stat {...s} />
                </Card>
              ))}
            </div>
            {HEALTH_ADVISORIES.map((h, i) => (
              <Card
                key={i}
                style={{
                  border: `1px solid ${h.riskLevel === "extreme" ? PALETTE.red + "44" : h.riskLevel === "high" ? PALETTE.amber + "44" : PALETTE.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 4,
                      }}
                    >
                      <Badge
                        color={
                          h.riskLevel === "extreme"
                            ? PALETTE.red
                            : h.riskLevel === "high"
                              ? PALETTE.amber
                              : PALETTE.teal
                        }
                      >
                        {h.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: PALETTE.text,
                      }}
                    >
                      {h.ward}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: aqiColor(h.aqiForecast),
                        fontFamily: "monospace",
                        lineHeight: 1,
                      }}
                    >
                      {h.aqiForecast}
                    </div>
                    <div style={{ fontSize: 9, color: PALETTE.textDim }}>
                      forecast AQI
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      background: PALETTE.bg3,
                      borderRadius: 6,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: PALETTE.textDim,
                        marginBottom: 2,
                      }}
                    >
                      Total population
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: PALETTE.text,
                        fontFamily: "monospace",
                      }}
                    >
                      {h.population.toLocaleString()}
                    </div>
                  </div>
                  <div
                    style={{
                      background: PALETTE.bg3,
                      borderRadius: 6,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: PALETTE.textDim,
                        marginBottom: 2,
                      }}
                    >
                      Vulnerable
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: PALETTE.amber,
                        fontFamily: "monospace",
                      }}
                    >
                      {h.vulnerable.toLocaleString()}
                    </div>
                  </div>
                  <div
                    style={{
                      background: PALETTE.bg3,
                      borderRadius: 6,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: PALETTE.textDim,
                        marginBottom: 2,
                      }}
                    >
                      At-risk facilities
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: PALETTE.red,
                        fontFamily: "monospace",
                      }}
                    >
                      {h.affectedFacilities.length}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    background: PALETTE.bg3,
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: PALETTE.amber,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    ⚠️ Advisory
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: PALETTE.text,
                      lineHeight: 1.6,
                    }}
                  >
                    {h.advisory}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: PALETTE.textDim,
                      marginBottom: 6,
                    }}
                  >
                    Affected facilities:
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {h.affectedFacilities.map((f, j) => (
                      <Badge key={j} color={PALETTE.purple}>
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button
                    onClick={() =>
                      sendMessage(
                        `Generate a health advisory in Hindi for ward ${h.ward} with AQI ${h.aqiForecast}. Include specific recommendations for schools, hospitals, and outdoor workers. Keep it simple for general public communication.`,
                        contextData,
                      ) || setShowAI(true)
                    }
                    style={{
                      padding: "7px 14px",
                      background: PALETTE.tealFaint,
                      border: `1px solid ${PALETTE.teal}44`,
                      borderRadius: 6,
                      color: PALETTE.teal,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    🤖 Generate Hindi Advisory
                  </button>
                  <button
                    style={{
                      padding: "7px 14px",
                      background: PALETTE.bg3,
                      border: `1px solid ${PALETTE.border}`,
                      borderRadius: 6,
                      color: PALETTE.textDim,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    📱 Push to Mobile Alerts
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── CITY COMPARISON ── */}
        {activeTab === "comparison" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: PALETTE.text,
                  marginBottom: 16,
                }}
              >
                Multi-City Air Quality Intelligence — Live Ranking
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[...CITY_COMPARISON]
                  .sort((a, b) => b.aqi - a.aqi)
                  .map((c, rank) => (
                    <div
                      key={c.city}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "14px 16px",
                        background: PALETTE.bg3,
                        borderRadius: 8,
                        border: `1px solid ${aqiColor(c.aqi)}22`,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: PALETTE.bg2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: rank === 0 ? PALETTE.red : PALETTE.textDim,
                          flexShrink: 0,
                        }}
                      >
                        {rank + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: PALETTE.text,
                          }}
                        >
                          {c.city}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              maxWidth: 200,
                              height: 4,
                              background: PALETTE.bg2,
                              borderRadius: 2,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${(c.aqi / 400) * 100}%`,
                                height: "100%",
                                background: aqiColor(c.aqi),
                                borderRadius: 2,
                              }}
                            />
                          </div>
                          <span
                            style={{ fontSize: 10, color: PALETTE.textDim }}
                          >
                            {c.aqi} AQI
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: c.trend > 0 ? PALETTE.red : PALETTE.green,
                              fontFamily: "monospace",
                              fontWeight: 600,
                            }}
                          >
                            {c.trend > 0 ? "+" : ""}
                            {c.trend}%
                          </div>
                          <div
                            style={{ fontSize: 9, color: PALETTE.textFaint }}
                          >
                            7-day
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: PALETTE.purple,
                              fontFamily: "monospace",
                              fontWeight: 600,
                            }}
                          >
                            {c.interventions}
                          </div>
                          <div
                            style={{ fontSize: 9, color: PALETTE.textFaint }}
                          >
                            interventions
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontSize: 11,
                              color:
                                c.compliance >= 75
                                  ? PALETTE.green
                                  : c.compliance >= 60
                                    ? PALETTE.amber
                                    : PALETTE.red,
                              fontFamily: "monospace",
                              fontWeight: 600,
                            }}
                          >
                            {c.compliance}%
                          </div>
                          <div
                            style={{ fontSize: 9, color: PALETTE.textFaint }}
                          >
                            compliance
                          </div>
                        </div>
                        <Badge color={aqiColor(c.aqi)}>{aqiLabel(c.aqi)}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              <Card>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: 14,
                  }}
                >
                  Best Practices — Bengaluru Model
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: PALETTE.textDim,
                    marginBottom: 12,
                  }}
                >
                  Best compliance (84%) and most interventions (15). Analysis of
                  what worked:
                </div>
                {[
                  {
                    label: "Electric fleet mandate for city buses",
                    impact: "−22 µg/m³ sustained",
                  },
                  {
                    label:
                      "Real-time industrial stack monitoring with auto-alerts",
                    impact: "−15 µg/m³",
                  },
                  {
                    label: "Congestion pricing on inner ring road",
                    impact: "−12 µg/m³ peak",
                  },
                  {
                    label: "Green belt expansion — 40 km² in 3 years",
                    impact: "−8 µg/m³",
                  },
                ].map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 0",
                      borderBottom: `1px solid ${PALETTE.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: 11, color: PALETTE.text }}>
                      {p.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: PALETTE.green,
                        flexShrink: 0,
                        marginLeft: 12,
                      }}
                    >
                      {p.impact}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    sendMessage(
                      "Based on Bengaluru's success, what are the top 3 interventions Delhi NCR should implement immediately given its current AQI of " +
                        liveAQI +
                        "?",
                      contextData,
                    ) || setShowAI(true)
                  }
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "8px",
                    background: PALETTE.tealFaint,
                    border: `1px solid ${PALETTE.teal}44`,
                    borderRadius: 6,
                    color: PALETTE.teal,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  🤖 Apply Bengaluru Learnings to Delhi NCR
                </button>
              </Card>
              <Card>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: PALETTE.text,
                    marginBottom: 14,
                  }}
                >
                  Intervention Effectiveness Matrix
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {[
                    {
                      type: "Traffic restriction",
                      score: 87,
                      impact: "High",
                      time: "Days",
                    },
                    {
                      type: "Industrial enforcement",
                      score: 92,
                      impact: "Very High",
                      time: "Weeks",
                    },
                    {
                      type: "Dust suppression",
                      score: 74,
                      impact: "Medium",
                      time: "Immediate",
                    },
                    {
                      type: "Burning ban",
                      score: 69,
                      impact: "Medium",
                      time: "Days",
                    },
                    {
                      type: "Public transport",
                      score: 81,
                      impact: "High",
                      time: "Months",
                    },
                    {
                      type: "Green infrastructure",
                      score: 62,
                      impact: "Low-Medium",
                      time: "Years",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: PALETTE.bg3,
                        borderRadius: 8,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: PALETTE.text,
                          marginBottom: 6,
                        }}
                      >
                        {item.type}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 3,
                            background: PALETTE.bg2,
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${item.score}%`,
                              height: "100%",
                              background:
                                item.score > 85
                                  ? PALETTE.teal
                                  : item.score > 70
                                    ? PALETTE.amber
                                    : PALETTE.textDim,
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 9,
                            color: PALETTE.textDim,
                            fontFamily: "monospace",
                          }}
                        >
                          {item.score}%
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontSize: 9, color: PALETTE.textDim }}>
                          {item.impact}
                        </span>
                        <span style={{ fontSize: 9, color: PALETTE.textFaint }}>
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* AI Sidebar */}
      {showAI && (
        <div>
          <AISidebar messages={messages} onClose={() => setShowAI(false)} />
          {/* Input bar at bottom of sidebar */}
          <div
            style={{
              position: "fixed",
              right: 0,
              bottom: 0,
              width: 380,
              zIndex: 101,
              background: PALETTE.bg2,
              borderLeft: `1px solid ${PALETTE.border}`,
              borderTop: `1px solid ${PALETTE.border}`,
              padding: "12px 16px",
            }}
          >
            <form onSubmit={handleAISend} style={{ display: "flex", gap: 8 }}>
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask about any pollution zone, source, or action…"
                disabled={loading}
                style={{
                  flex: 1,
                  background: PALETTE.bg3,
                  border: `1px solid ${PALETTE.border}`,
                  color: PALETTE.text,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "8px 14px",
                  background: loading ? PALETTE.bg3 : PALETTE.teal,
                  border: "none",
                  borderRadius: 8,
                  color: loading ? PALETTE.textDim : PALETTE.bg,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "…" : "↑"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 75%,100% { transform: scale(2); opacity: 0; } }
        input::placeholder { color: ${PALETTE.textFaint}; }
        button:hover { opacity: 0.85; }
        select option { background: ${PALETTE.bg2}; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${PALETTE.border}; border-radius: 2px; }
      `}</style>
    </div>
  );
}
