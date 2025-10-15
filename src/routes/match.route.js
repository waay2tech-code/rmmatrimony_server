const express = require("express");
const router = express.Router();
const { getMatches, searchProfiles } = require("../controllers/userController"); // ✅ fixed name
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/matches", authMiddleware, getMatches);
router.get("/search", authMiddleware, searchProfiles); // ✅ fixed name

module.exports = router;
