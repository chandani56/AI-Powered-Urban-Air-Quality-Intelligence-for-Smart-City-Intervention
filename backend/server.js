const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ── MOCK DATA ──────────────────────────────
const hotspots = [
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

const enforcement = [
  {
    id: "ENF-2847",
    priority: "P1",
    entity: "Mayapuri Steelworks",
    type: "Industrial",
    violation: "Stack emission limit exceeded 4.2×",
    confidence: 96,
    estimatedImpact: "−23 µg/m³",
    assigned: "CPCB Inspector Sharma",
    status: "pending",
  },
  {
    id: "ENF-2848",
    priority: "P1",
    entity: "NH-48 Corridor Fleet",
    type: "Vehicular",
    violation: "84 BSIII diesel trucks flagged",
    confidence: 91,
    estimatedImpact: "−18 µg/m³",
    assigned: "Traffic SHO Mehta",
    status: "pending",
  },
  {
    id: "ENF-2849",
    priority: "P2",
    entity: "Metro Realty Construction",
    type: "Construction",
    violation: "Dust suppression inactive",
    confidence: 83,
    estimatedImpact: "−11 µg/m³",
    assigned: "DPCC Field Team B",
    status: "pending",
  },
  {
    id: "ENF-2850",
    priority: "P2",
    entity: "Sector 16 MCD Zone",
    type: "Burning",
    violation: "3 active waste burning sites",
    confidence: 88,
    estimatedImpact: "−8 µg/m³",
    assigned: "Unassigned",
    status: "pending",
  },
];

const forecast = Array.from({ length: 72 }, (_, i) => ({
  hour: i,
  aqi: Math.round(160 + Math.sin(i * 0.3) * 60),
  label: i % 6 === 0 ? `+${i}h` : "",
}));

const health = [
  {
    ward: "Anand Vihar",
    population: 84200,
    vulnerable: 12400,
    aqiForecast: 387,
    riskLevel: "extreme",
  },
  {
    ward: "Okhla",
    population: 134000,
    vulnerable: 18900,
    aqiForecast: 312,
    riskLevel: "high",
  },
  {
    ward: "Rohini Sec 8",
    population: 210000,
    vulnerable: 29100,
    aqiForecast: 241,
    riskLevel: "moderate",
  },
];

// ── AI PROXY ROUTE ──────────────────────────
app.post("/api/ai", async (req, res) => {
  try {
    // System + user messages combine karo
    const systemMsg =
      req.body.system || "You are an air quality expert analyst.";
    const userMessages = req.body.messages || [];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 1000,
          messages: [{ role: "system", content: systemMsg }, ...userMessages],
        }),
      },
    );

    const data = await response.json();
    console.log("Groq raw response:", JSON.stringify(data)); // debug

    // Error check karo
    if (data.error) {
      return res.status(400).json({
        content: [{ text: `Error: ${data.error.message}` }],
      });
    }

    // Response nikalo
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return res.json({
        content: [{ text: "Groq se koi response nahi aaya." }],
      });
    }

    res.json({ content: [{ text }] });
  } catch (err) {
    res.status(500).json({
      content: [{ text: `Server error: ${err.message}` }],
    });
  }
});
// ── ROUTES ──────────────────────────────────
// ── WEATHER ROUTE ────────────────────────────
app.get("/api/weather/:city", async (req, res) => {
  const cityCoords = {
    "Delhi NCR": { lat: 28.6139, lon: 77.209 },
    Mumbai: { lat: 19.076, lon: 72.8777 },
    Bengaluru: { lat: 12.9716, lon: 77.5946 },
    Chennai: { lat: 13.0827, lon: 80.2707 },
    Kolkata: { lat: 22.5726, lon: 88.3639 },
    Hyderabad: { lat: 17.385, lon: 78.4867 },
  };

  const city = req.params.city;
  const coords = cityCoords[city] || cityCoords["Delhi NCR"];

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${process.env.WEATHER_KEY}&units=metric`,
    );
    const data = await response.json();

    res.json({
      city,
      temperature: data.main?.temp,
      humidity: data.main?.humidity,
      windSpeed: data.wind?.speed,
      windDirection: data.wind?.deg,
      description: data.weather?.[0]?.description,
      visibility: data.visibility,
      pressure: data.main?.pressure,
    });
  } catch (err) {
    // Fallback mock data
    res.json({
      city,
      temperature: 32,
      humidity: 71,
      windSpeed: 3.4,
      windDirection: 315,
      description: "haze",
      visibility: 3000,
      pressure: 1012,
    });
  }
});

// ── REAL AQI ROUTE ────────────────────────────
app.get("/api/realtime-aqi/:city", async (req, res) => {
  const cityCoords = {
    "Delhi NCR": { lat: 28.6139, lng: 77.209 },
    Mumbai: { lat: 19.076, lng: 72.8777 },
    Bengaluru: { lat: 12.9716, lng: 77.5946 },
    Chennai: { lat: 13.0827, lng: 80.2707 },
    Kolkata: { lat: 22.5726, lng: 88.3639 },
    Hyderabad: { lat: 17.385, lng: 78.4867 },
  };

  const city = req.params.city;
  const coords = cityCoords[city] || cityCoords["Delhi NCR"];

  try {
    const response = await fetch(
      `https://api.waqi.info/map/bounds/?latlng=${coords.lat - 0.5},${coords.lng - 0.5},${coords.lat + 0.5},${coords.lng + 0.5}&token=${process.env.WAQI_TOKEN}`,
    );
    const data = await response.json();

    if (data.status === "ok") {
      const stations = data.data
        .filter((s) => s.aqi !== "-" && !isNaN(parseInt(s.aqi)))
        .map((s) => ({
          lat: s.lat,
          lng: s.lon,
          aqi: parseInt(s.aqi),
          station: s.station.name,
          zone: s.station.name,
          trend: "stable",
          primarySource: "Mixed sources",
          confidence: 85,
          actions: 1,
          severity:
            parseInt(s.aqi) > 300
              ? "hazardous"
              : parseInt(s.aqi) > 200
                ? "very-unhealthy"
                : "unhealthy",
        }))
        .sort((a, b) => b.aqi - a.aqi)
        .slice(0, 6); // Top 6 worst stations

      res.json({ status: "ok", city, stations });
    } else {
      res.json({ status: "fallback", city, stations: [] });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/hotspots", (req, res) => res.json(hotspots));
app.get("/api/enforcement", (req, res) => res.json(enforcement));
app.get("/api/forecast", (req, res) => res.json(forecast));
app.get("/api/health", (req, res) => res.json(health));
app.get("/api/status", (req, res) =>
  res.json({
    status: "ok",
    message: "AQIP Backend running ✅",
    mode: "mock data",
  }),
);

// ── START ────────────────────────────────────
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Proxy ready`);
  console.log(`📡 Mock data mode`);
});
