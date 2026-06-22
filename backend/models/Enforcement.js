const mongoose = require("mongoose");

const EnforcementSchema = new mongoose.Schema({
  enfId: String,
  priority: String,
  entity: String,
  type: String,
  violation: String,
  confidence: Number,
  evidence: [String],
  estimatedImpact: String,
  assigned: String,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Enforcement", EnforcementSchema);
