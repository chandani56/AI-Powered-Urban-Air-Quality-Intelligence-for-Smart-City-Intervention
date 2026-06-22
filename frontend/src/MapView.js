import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

const CITY_COORDS = {
  "Delhi NCR": { lat: 28.6139, lng: 77.209, zoom: 11 },
  Mumbai: { lat: 19.076, lng: 72.8777, zoom: 12 },
  Bengaluru: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  Chennai: { lat: 13.0827, lng: 80.2707, zoom: 12 },
  Kolkata: { lat: 22.5726, lng: 88.3639, zoom: 12 },
  Hyderabad: { lat: 17.385, lng: 78.4867, zoom: 12 },
};

const MOCK_HOTSPOTS = {
  "Delhi NCR": [
    { lat: 28.645, lng: 77.315, aqi: 387, station: "Anand Vihar" },
    { lat: 28.535, lng: 77.271, aqi: 312, station: "Okhla Phase II" },
    { lat: 28.479, lng: 77.073, aqi: 278, station: "Gurgaon MG Road" },
    { lat: 28.726, lng: 77.108, aqi: 241, station: "Rohini Sector 8" },
    { lat: 28.613, lng: 77.209, aqi: 198, station: "Connaught Place" },
    { lat: 28.7, lng: 77.1, aqi: 320, station: "Pitampura" },
  ],
  Mumbai: [
    { lat: 19.076, lng: 72.877, aqi: 178, station: "Bandra" },
    { lat: 19.018, lng: 72.848, aqi: 156, station: "Worli" },
    { lat: 19.121, lng: 72.908, aqi: 201, station: "Andheri" },
    { lat: 18.961, lng: 72.819, aqi: 145, station: "Colaba" },
  ],
  Bengaluru: [
    { lat: 12.971, lng: 77.594, aqi: 142, station: "MG Road" },
    { lat: 12.934, lng: 77.624, aqi: 118, station: "Koramangala" },
    { lat: 13.035, lng: 77.597, aqi: 165, station: "Hebbal" },
    { lat: 12.9, lng: 77.58, aqi: 130, station: "Jayanagar" },
  ],
  Chennai: [
    { lat: 13.082, lng: 80.27, aqi: 156, station: "Anna Nagar" },
    { lat: 12.994, lng: 80.247, aqi: 134, station: "Adyar" },
    { lat: 13.067, lng: 80.237, aqi: 178, station: "Perambur" },
  ],
  Kolkata: [
    { lat: 22.572, lng: 88.363, aqi: 234, station: "Park Street" },
    { lat: 22.518, lng: 88.38, aqi: 267, station: "Howrah" },
    { lat: 22.6, lng: 88.37, aqi: 198, station: "Dum Dum" },
  ],
  Hyderabad: [
    { lat: 17.385, lng: 78.486, aqi: 189, station: "Hitech City" },
    { lat: 17.36, lng: 78.474, aqi: 167, station: "Banjara Hills" },
    { lat: 17.447, lng: 78.498, aqi: 210, station: "Secunderabad" },
  ],
};

const AQI_LEGEND = [
  { label: "Good ≤50", color: "#10B981" },
  { label: "Moderate ≤100", color: "#84CC16" },
  { label: "Sensitive ≤150", color: "#F59E0B" },
  { label: "Unhealthy ≤200", color: "#F97316" },
  { label: "Very Unhealthy", color: "#EF4444" },
  { label: "Hazardous", color: "#8B5CF6" },
];

export default function MapView({ selectedCity }) {
  const [markers, setMarkers] = useState([]);
  const city = CITY_COORDS[selectedCity] || CITY_COORDS["Delhi NCR"];

  useEffect(() => {
    // Seedha mock data use karo — no API call
    const spots = MOCK_HOTSPOTS[selectedCity] || MOCK_HOTSPOTS["Delhi NCR"];
    setMarkers(spots);
  }, [selectedCity]);

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        key={selectedCity}
        center={[city.lat, city.lng]}
        zoom={city.zoom}
        style={{ height: "400px", width: "100%", borderRadius: 12 }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {markers.map((m, i) => (
          <CircleMarker
            key={i}
            center={[m.lat, m.lng]}
            radius={Math.max(12, m.aqi / 20)}
            pathOptions={{
              color: aqiColor(m.aqi),
              fillColor: aqiColor(m.aqi),
              fillOpacity: 0.75,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: "monospace", minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                  {m.station}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    color: aqiColor(m.aqi),
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {m.aqi}
                </div>
                <div
                  style={{ fontSize: 11, color: aqiColor(m.aqi), marginTop: 2 }}
                >
                  {aqiLabel(m.aqi)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 1000,
          background: "rgba(13,17,23,0.92)",
          borderRadius: 8,
          padding: "8px 12px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {AQI_LEGEND.map((l, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 3,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: l.color,
              }}
            />
            <span style={{ fontSize: 10, color: "#8B949E" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
