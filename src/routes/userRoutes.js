//const User = require("../models/User");
const express = require("express");
const router = express.Router();
const authMiddleware  = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const { likeUser, updateProfile,
   uploadPhoto ,getUserProfile,getAllUsers,uploadToGallery,getRecommendations, getAllNotificationsAdmin,
   toggleLike,removeLike,getNotifications,adminupdateProfile,admindeleteprofile,getUserProfileType,getUserProfileById,
    getUserGallery,adminprofileupdateProfile,getadminUserProfile,adminuploadToGallery,deletePhoto,admindeletePhoto, getAllAdminUsers
  
  } = require("../controllers/userController");
const upload = require("../middlewares/uploadMiddleware");

// Profile routes
router.put("/profile", authMiddleware, upload.single("profilePhoto"), updateProfile);
// Admin routes

router.put("/admin-update-profile/:profileId", authMiddleware, upload.single("profilePhoto"), adminprofileupdateProfile);
router.put("/adminedit/:profileId", authMiddleware, upload.single("profilePhoto"),adminupdateProfile);

router.delete("/admindelete/:profileId", authMiddleware,admindeleteprofile);
router.get("/profile",authMiddleware, getUserProfile);
router.get("/admingetprofile/:profileId",authMiddleware, getadminUserProfile);
router.get("/me",authMiddleware, getUserProfile);
router.get("/profile/:id",authMiddleware, getUserProfileById);
// Get user gallery by ID
router.get("/gallery/:id", authMiddleware, getUserGallery);
router.get("/allusers", getAllUsers);
// Get admin users
router.get("/adminusers", getAllAdminUsers);

router.get("/matches",  authMiddleware,getRecommendations);
//router.post("/like/:id", authMiddleware, likeUser);

// Like/unlike a profile
router.post("/like/:profileId", authMiddleware, toggleLike);
router.get("/notifications", authMiddleware, getNotifications);

// Admin route (add admin middleware)
router.get('/admin/notifications', authMiddleware, getAllNotificationsAdmin);

// Admin route to remove likes
router.post('/admin/remove-like', [authMiddleware, adminMiddleware], removeLike);

router.post("/upload-photo", authMiddleware, upload.single("photo"), uploadToGallery);
router.post("/admin-upload-photo/:profileId", authMiddleware, upload.single("photo"), adminuploadToGallery);
// Get current user's profileType only
router.get("/profile-type", authMiddleware, getUserProfileType);

router.delete('/delete-photo', authMiddleware,deletePhoto);
router.delete('/admin-delete-photo/:profileId', authMiddleware,admindeletePhoto);

//router.post("/upload-photo", authMiddleware, upload.single("photo"), uploadPhoto);

module.exports = router;