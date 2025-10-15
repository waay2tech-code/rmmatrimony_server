const express = require("express");
const router = express.Router();
const {
  sendInterest,
  getSentInterests,
  getReceivedInterests,
  addToWishlist,
  getWishlist
} = require("../controllers/userActionsController");

const authMiddleware  = require("../middlewares/authMiddleware");

router.post("/interest/send/:receiverId",authMiddleware, sendInterest);
router.get("/interest/sent",authMiddleware, getSentInterests);

router.get("/interest/received", authMiddleware,getReceivedInterests);

router.post("/wishlist/:wishedUserId",authMiddleware, addToWishlist);
router.get("/wishlist",authMiddleware, getWishlist);

module.exports = router;
