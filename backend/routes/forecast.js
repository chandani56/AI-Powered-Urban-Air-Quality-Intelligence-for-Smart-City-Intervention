// forecast.js
const router = require("express").Router();

router.get("/", (req, res) => {
  const hours = Array.from({ length: 72 }, (_, i) => ({
    hour: i,
    aqi: Math.round(160 + Math.sin(i * 0.3) * 60),
    label: i % 6 === 0 ? `+${i}h` : "",
  }));
  res.json(hours);
});

module.exports = router;
