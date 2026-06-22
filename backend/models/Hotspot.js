const mongoose = require("mongoose");

const HotspotSchema = new mongoose.Schema({
  zone: String,
  lat: Number,
  lng: Number,
  aqi: Number,
  trend: { type: String, enum: ["rising", "falling", "stable"] },
  primarySource: String,
  confidence: Number,
  severity: String,
  city: { type: String, default: "Delhi NCR" },
  recordedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Hotspot", HotspotSchema);
