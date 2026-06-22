const router = require("express").Router();
const Hotspot = require("../models/Hotspot");

// GET all hotspots
router.get("/", async (req, res) => {
  try {
    const hotspots = await Hotspot.find().sort({ aqi: -1 });
    res.json(hotspots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new hotspot (admin/sensor input)
router.post("/", async (req, res) => {
  try {
    const hotspot = new Hotspot(req.body);
    await hotspot.save();
    res.status(201).json(hotspot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update AQI
router.put("/:id", async (req, res) => {
  try {
    const updated = await Hotspot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
