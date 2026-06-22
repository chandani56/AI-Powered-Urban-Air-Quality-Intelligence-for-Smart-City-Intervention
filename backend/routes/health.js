// health.js — static advisory serve karo (ya MongoDB se)
const router = require("express").Router();

router.get("/", (req, res) => {
  res.json([
    {
      ward: "Anand Vihar",
      aqiForecast: 387,
      riskLevel: "extreme",
      population: 84200,
    },
    { ward: "Okhla", aqiForecast: 312, riskLevel: "high", population: 134000 },
  ]);
});

module.exports = router;
