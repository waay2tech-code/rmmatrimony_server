const Interest = require("../models/Interest");
const Wishlist = require("../models/Wishlist");
const User = require("../models/User");

// ✅ Send Interest

exports.sendInterest = async (req, res) => {
  const senderId = req.userId;
  //const senderId = "6884587aa6abc068d41345ae";
  const { receiverId } = req.params;

  try {
    const existing = await Interest.findOne({ senderId, receiverId });
    if (existing) return res.status(400).json({ message: "Interest already sent" });

    const interest = new Interest({
      senderId,
      receiverId,
      status: "pending",
      sentAt: new Date()
    });

    await interest.save();
    res.status(201).json({ message: "Interest sent" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ View Interests Sent
exports.getSentInterests = async (req, res) => {
  try {
    // const senderId="68849877ab49d4cd01ae5d8c"
     const senderId=req.userId
    const interests = await Interest.find({ senderId: senderId})
      .populate("receiverId", "name age location religion caste");

    res.json(interests);
  } catch (err) {
    res.status(500).json({ error: "Failed to get sent interests" });
  }
};

// ✅ View Interests Received
exports.getReceivedInterests = async (req, res) => {
  try {
   // const receiverId="6884618009122d8f4667d4e5";
   const receiverId=req.userId 

    const interests = await Interest.find({ receiverId:receiverId })
      .populate("senderId", "name age location religion caste");

    res.json(interests);
  } catch (err) {
    res.status(500).json({ error: "Failed to get received interests" });
  }
};

// ✅ Add to Wishlist
exports.addToWishlist = async (req, res) => {
  const userId = req.userId;
  //const userId = "6884618009122d8f4667d4e5";
  const { wishedUserId } = req.params;
  const currentUserId = req.userId;
 // const currentUserId = "6884618009122d8f4667d4e5";
  const likedUserId = req.params.wishedUserId;

  try {
    const exists = await Wishlist.findOne({ userId, wishedUserId });
    if (exists) return res.status(400).json({ message: "Already in wishlist" });

    const wish = new Wishlist({ userId, wishedUserId });
    await wish.save();

    if (currentUserId === likedUserId) {
      return res.status(400).json({ message: "You cannot like yourself." });
    }

    const currentUser = await User.findById(currentUserId);
    const likedUser = await User.findById(likedUserId);

    if (!currentUser || !likedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already liked
    if (currentUser.likes.includes(likedUserId)) {
      return res.status(400).json({ message: "You have already liked this user" });
    }

    currentUser.likes.push(likedUserId);
    await currentUser.save();

    res.status(201).json({ message: "Added to wishlist" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
};

// ✅ View Wishlist
exports.getWishlist = async (req, res) => {
  try {
     
  //  const userId="6884618009122d8f4667d4e5"
    const userId=req.userId
    const wishes = await Wishlist.find({ userId:userId  })
      .populate("wishedUserId", "name age location religion caste");

    res.json(wishes);
  } catch (err) {
    res.status(500).json({ error: "Failed to get wishlist" });
  }
};
