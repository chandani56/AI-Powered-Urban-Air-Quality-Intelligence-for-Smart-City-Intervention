const router = require("express").Router();
const Enforcement = require("../models/Enforcement");

router.get("/", async (req, res) => {
  try {
    const actions = await Enforcement.find().sort({
      priority: 1,
      createdAt: -1,
    });
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const action = new Enforcement(req.body);
    await action.save();
    res.status(201).json(action);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const updated = await Enforcement.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
