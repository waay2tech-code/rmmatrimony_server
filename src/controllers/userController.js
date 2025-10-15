const mongoose = require("mongoose");
const User = require("../models/User");
const UserGallery = require("../models/UserGallery");
const path = require("path");
const Notification = require("../models/Notification");
const fs = require('fs');
const { ensureMemberID } = require('../utils/memberIdGenerator');
//const path = require('path');
//const { io, connectedUsers } = require('../server'); // import your socket instance & map
// ✅ GET /api/user/matches
const getMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const mutualMatches = await User.find({
      _id: { $in: currentUser.likes },
      likes: req.userId,
      userType: 'user' // Exclude admin users from matches
    });

    res.status(200).json(mutualMatches);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ GET /api/user/search
const searchProfiles = async (req, res) => {
  try {
    const { age, location, religion, caste } = req.query;
    let query = { userType: 'user' }; // Exclude admin users from search

    if (age) query.age = { $lte: Number(age) };
    if (location) query.location = { $regex: location, $options: "i" };
    if (religion) query.religion = religion;
    if (caste) query.caste = caste;

    const profiles = await User.find(query).select("-password");
    const currentUser = await User.findById(req.userId);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const updatedProfiles = profiles.map((profile) => {
      const isMutual =
        profile.likes.some((id) => id.equals(req.userId)) &&
        currentUser.likes.some((id) => id.equals(profile._id));

      return {
        _id: profile._id,
        name: profile.name,
        age: profile.age,
        location: profile.location,
        photo: isMutual ? profile.profilePhoto : "/blurred.png",
        about: isMutual ? profile.about : "Like to unlock full details",
        isMutualLike: isMutual,
      };
    });

    res.status(200).json(updatedProfiles);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ POST /api/user/like/:id
const likeUser = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const likedUserId = req.params.id;

    if (currentUserId === likedUserId) {
      return res.status(400).json({ message: "You cannot like yourself." });
    }

    const currentUser = await User.findById(currentUserId);
    // Ensure the liked user is a regular user, not an admin
    const likedUser = await User.findOne({ _id: likedUserId, userType: 'user' });

    if (!currentUser || !likedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already liked
    if (currentUser.likes.includes(likedUserId)) {
      return res.status(400).json({ message: "You have already liked this user" });
    }

    currentUser.likes.push(likedUserId);
    await currentUser.save();

    res.status(200).json({ message: "User liked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update Profile Controller (Fixed)
const updateProfile = async (req, res) => {
  try {
    //const userId ="6884587aa6abc068d41345ae"; // Get userId from auth middleware
   const reqs=req.body;
   const usr=req.userId;
   const userId = req.userId; // from authMiddleware
   console.log("file", req.file); // ✅ Check uploaded image info
   console.log("body",reqs,usr);
   console.log("reqbody",req.body);
   
    const updateData = {
      name: req.body.name,
      gender: req.body.gender,
      dob: req.body.dob,
      age: req.body.age,
      address: req.body.address,
      location: req.body.location,
      mobile: req.body.mobile,
      qualification: req.body.qualification,
      occupation: req.body.occupation,
      monthlyIncome: req.body.monthlyIncome,
      height: req.body.height,
      weight: req.body.weight,
      aboutMe: req.body.aboutMe,
      fatherName: req.body.fatherName,
      fatherOccupation: req.body.fatherOccupation,
      fatherNative: req.body.fatherNative,
      motherName: req.body.motherName,
      motherOccupation: req.body.motherOccupation,
      motherNative: req.body.motherNative,
      siblings: req.body.siblings,
      religion: req.body.religion,
      otherReligion: req.body.otherReligion,
      caste: req.body.caste,
      otherCaste: req.body.otherCaste
    };
  // ✅ Add uploaded image path if exists
  if (req.file) {
    updateData.profilePhoto = `/uploads/${req.file.filename}`;
  }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Update failed" });
  }
};

// ✅ GET /api/user/profile
const adminprofileupdateProfile = async (req, res) => {

  try {
    //const userId ="6884587aa6abc068d41345ae"; // Get userId from auth middleware
     const { profileId } = req.params;
     console.log("profileId",profileId);
     
   const reqs=req.body;
   const userId=profileId;
  // const userId = req.userId; // from authMiddleware
   console.log("file", req.file); // ✅ Check uploaded image info
 //  console.log("body",reqs,usr);
   console.log("reqbody",req.body);
   
    const updateData = {
      name: req.body.name,
      gender: req.body.gender,
      dob: req.body.dob,
      age: req.body.age,
      address: req.body.address,
      location: req.body.location,
      mobile: req.body.mobile,
      qualification: req.body.qualification,
      occupation: req.body.occupation,
      monthlyIncome: req.body.monthlyIncome,
      height: req.body.height,
      weight: req.body.weight,
      aboutMe: req.body.aboutMe,
      fatherName: req.body.fatherName,
      fatherOccupation: req.body.fatherOccupation,
      fatherNative: req.body.fatherNative,
      motherName: req.body.motherName,
      motherOccupation: req.body.motherOccupation,
      motherNative: req.body.motherNative,
      siblings: req.body.siblings,
      religion: req.body.religion,
      otherReligion: req.body.otherReligion,
      caste: req.body.caste,
      otherCaste: req.body.otherCaste
    };
  // ✅ Add uploaded image path if exists
  if (req.file) {
    updateData.profilePhoto = `/uploads/${req.file.filename}`;
  }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Update failed" });
  }
};

//adminupdate

// ✅ Update Profile Controller (Fixed)
const adminupdateProfile = async (req, res) => {
  try {
    const userId =req.params.profileId; // Get userId from auth middleware
   const reqs=req.body;
   const usr=req.userId;
  // const userId = req.userId; // from authMiddleware
   console.log("file", req.file); // ✅ Check uploaded image info
   console.log("body",reqs,usr);
   
    const updateData = {
      name: req.body.name,
     
      email: req.body.email,
       mobile: req.body.mobile,
      
      age: req.body.age,
      profileType: req.body.profileType,
      
      // dob: req.body.dob,
       // gender: req.body.gender,
      // address: req.body.address,
      // location: req.body.location,
      // mobile: req.body.mobile,
      // qualification: req.body.qualification,
      occupation: req.body.occupation,
      // monthlyIncome: req.body.monthlyIncome,
      // height: req.body.height,
      // weight: req.body.weight,
      // aboutMe: req.body.aboutMe,
      // fatherName: req.body.fatherName,
      // fatherOccupation: req.body.fatherOccupation,
      // fatherNative: req.body.fatherNative,
      // motherName: req.body.motherName,
      // motherOccupation: req.body.motherOccupation,
      // motherNative: req.body.motherNative,
      // siblings: req.body.siblings,
      // religion: req.body.religion,
      // otherReligion: req.body.otherReligion,
      caste: req.body.caste,
      // otherCaste: req.body.otherCaste
    };
  // ✅ Add uploaded image path if exists
  if (req.file) {
    updateData.profilePhoto = `/uploads/${req.file.filename}`;
  }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Update failed" });
  }
};
// ✅ Upload Photo
const uploadPhoto = async (req, res) => {
  try {
    const photoPath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.userId, { profilePhoto: photoPath }, { new: true });
    res.status(200).json({ message: "Photo uploaded", photo: photoPath });
  } catch (err) {
    res.status(500).json({ error: "Photo upload failed" });
  }
};

//const User = require("../models/User");
//const UserGallery = require("../models/UserGallery"); // Import UserGallery model

const getUserProfile = async (req, res) => {
  //console.log("Decoded from token:", req.user);
  console.log("userId:", req.userId);
  const userId = req.userId;
  
  try {
    // Fetch user profile without password
    let user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure user has a member ID, generate one if missing
    if (!user.memberid) {
      console.log(`User ${user.name} missing member ID, generating...`);
      await ensureMemberID(userId);
      // Fetch updated user data
      user = await User.findById(userId).select("-password");
    }

    // Fetch user's gallery photos
    const gallery = await UserGallery.findOne({ userId: userId });
    
    // Extract photos array or set empty array if no gallery found
    const photos = gallery ? gallery.photos : [];

    res.status(200).json({ 
      profile: user,
      gallery: photos 
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

const getadminUserProfile = async (req, res) => {
  //console.log("Decoded from token:", req.user);
 // console.log("userId:", req.userId);
  const userId = req.params.profileId;
  //const userId = req.userId;
  console.log("userId:", userId);
  
  try {
    // Fetch user profile without password
    let user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure user has a member ID, generate one if missing
    if (!user.memberid) {
      console.log(`User ${user.name} missing member ID, generating...`);
      await ensureMemberID(userId);
      // Fetch updated user data
      user = await User.findById(userId).select("-password");
    }

    // Fetch user's gallery photos
    const gallery = await UserGallery.findOne({ userId: userId });
    
    // Extract photos array or set empty array if no gallery found
    const photos = gallery ? gallery.photos : [];

    res.status(200).json({ 
      profile: user,
      gallery: photos 
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

const getAllAdminUsers = async (req, res) => {
  try {
    const admins = await User.find({ userType: 'admin' }).select("-password");
    
    res.status(200).json(admins);
  } catch (err) {
    console.error("Error fetching admin users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { age, location, religion, caste } = req.query;

    const currentUserId = req.userId; // from authMiddleware
    //const currentUserId="688497d8ab49d4cd01ae5d82";

    const filter = {
      _id: { $ne: currentUserId }, // ❗Exclude current user
      isActive: true,              // ✅ Optional: Only active users
      userType: 'user'             // ✅ Exclude admin users
    };
    if (age) filter.age = Number(age);
    if (location) filter.location = { $regex: location, $options: "i" };
    if (religion) filter.religion = { $regex: religion, $options: "i" };
    if (caste) filter.caste = { $regex: caste, $options: "i" };

    const users = await User.find(filter).select("-password");
    
    // Ensure all users have member IDs
    const usersWithMemberIDs = await Promise.all(users.map(async (user) => {
      if (!user.memberid) {
        console.log(`User ${user.name} missing member ID, generating...`);
        await ensureMemberID(user._id.toString());
        // Fetch updated user data with userType filter to ensure admin users are still excluded
        return await User.findOne({ _id: user._id, userType: 'user' }).select("-password");
      }
      return user;
    })).then(results => results.filter(user => user !== null)); // Filter out any null results

    res.status(200).json(usersWithMemberIDs);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const uploadToGallery = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    // Always use forward slashes for URLs regardless of OS
    const imageUrl = `uploads/${file.filename}`;

    // Check if gallery already exists for user
    let gallery = await UserGallery.findOne({ userId });

    if (!gallery) {
      // Create new gallery
      gallery = new UserGallery({
        userId,
        photos: [{ url: imageUrl }]
      });
    } else {
      // Add to existing gallery
      gallery.photos.push({ url: imageUrl });
    }

    await gallery.save();
    // Return the URL as well so clients can immediately display the uploaded image
    res.status(200).json({ message: "Image uploaded successfully", url: imageUrl, gallery });
  } catch (err) {
    console.error("Gallery upload error:", err);
    res.status(500).json({ message: "Image upload failed" });
  }
};

const adminuploadToGallery = async (req, res) => {
  try {
    const userId = req.params.profileId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    // Always use forward slashes for URLs regardless of OS
    const imageUrl = `/uploads/${file.filename}`;

    // Check if gallery already exists for user
    let gallery = await UserGallery.findOne({ userId });

    if (!gallery) {
      // Create new gallery
      gallery = new UserGallery({
        userId,
        photos: [{ url: imageUrl }]
      });
    } else {
      // Add to existing gallery
      gallery.photos.push({ url: imageUrl });
    }

    await gallery.save();
    // Return the URL as well so clients can immediately display the uploaded image
    res.status(200).json({ message: "Image uploaded successfully", url: imageUrl, gallery });
  } catch (err) {
    console.error("Gallery upload error:", err);
    res.status(500).json({ message: "Image upload failed" });
  }
};

const getRecommendations = async (req, res) => {
  // ... (rest of the code remains the same)
  try {
    const userId = req.userId;
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const users = await User.find({
      _id: { $ne: currentUser._id },
      gender: { $ne: currentUser.gender },
      userType: 'user' // Exclude admin users from recommendations
    });

    // Ensure all users have member IDs
    const usersWithMemberIDs = await Promise.all(users.map(async (user) => {
      if (!user.memberid) {
        console.log(`User ${user.name} missing member ID, generating...`);
        await ensureMemberID(user._id.toString());
        // Fetch updated user data with userType filter to ensure admin users are still excluded
        return await User.findOne({ _id: user._id, userType: 'user' });
      }
      return user;
    })).then(results => results.filter(user => user !== null)); // Filter out any null results

    const MAX_SCORE = 13;

    // Step 1: First compute all scores
    const scoredUsers = usersWithMemberIDs.map((user) => {
      let score = 0;

      if (Math.abs(user.age - currentUser.age) <= 3) score += 2;
      if (user.religion === currentUser.religion) score += 3;
      if (user.caste === currentUser.caste) score += 3;
      if (user.location === currentUser.location) score += 2;
      if (currentUser.likes.includes(user._id)) score += 1;
      if (user.likes.includes(currentUser._id)) score += 2;

      return {
        ...user.toObject(),
        rawScore: score,
        isMutualLike: currentUser.likes.includes(user._id) && user.likes.includes(currentUser._id),
      };
    });

    // Step 2: Find min and max score
    const scores = scoredUsers.map(u => u.rawScore);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Step 3: Scale to 50–100% range
    const recommendations = scoredUsers.map(user => {
      let matchPercentage = 100;
      if (maxScore !== minScore) {
        matchPercentage = 50 + ((user.rawScore - minScore) / (maxScore - minScore)) * 50;
      }
      return {
        ...user,
        matchPercentage: Math.round(matchPercentage),
      };
    });

    // Step 4: Sort by matchPercentage descending
    recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({ recommendations });
  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



const toggleLike = async (req, res) => {
  try {
    const profileId = req.params.profileId;
    const currentUserId = req.userId; // From your auth middleware

    // Ensure the profile user is a regular user, not an admin
    const user = await User.findOne({ _id: profileId, userType: 'user' });
    const senderUser = await User.findById(currentUserId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!senderUser) return res.status(404).json({ message: "Sender user not found" });

    let liked = false;
    let notification;

    if (user.likes.includes(currentUserId)) {
      // Unlike
      user.likes = user.likes.filter(id => id.toString() !== currentUserId);
    } else {
      // Like
      user.likes.push(currentUserId);
      liked = true;

      // Create and save notification
      notification = await Notification.create({
        receiver: user._id,
        sender: senderUser._id,
        type: "like",
        message: `${senderUser.name} liked your profile.`,
      });

    

    }

    await user.save();

    res.json({ 
      message: liked ? `${senderUser.name} liked your profile.` : "You unliked the profile.",
      likes: user.likes,
      liked
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
 
// Example: notificationsController.js

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.userId })
      .sort({ createdAt: -1 })
      .populate("sender", "name"); // populate sender name

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
const getAllNotificationsAdmin = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .populate("sender", "name email profilePhoto mobile memberid profileType")
      .populate("receiver", "name email profilePhoto mobile memberid profileType");

    const formattedNotifications = notifications.map(notification => ({
      _id: notification._id,
      message: notification.message,
      createdAt: notification.createdAt,
      sender: notification.sender && typeof notification.sender === 'object' ? {
        id: notification.sender._id,
        name: notification.sender['name'],
        email: notification.sender['email'],
        profilePhoto: notification.sender['profilePhoto'],
        mobile: notification.sender['mobile'],
        memberid: notification.sender['memberid'],
        profileType: notification.sender['profileType']
      } : null,
      receiver: notification.receiver && typeof notification.receiver === 'object' ? {
        id: notification.receiver._id,
        name: notification.receiver['name'],
        email: notification.receiver['email'],
        profilePhoto: notification.receiver['profilePhoto'],
        mobile: notification.receiver['mobile'],
        memberid: notification.receiver['memberid'],
        profileType: notification.receiver['profileType']
      } : null
    }));

    res.json({ 
      notifications: formattedNotifications,
      count: formattedNotifications.length
    });
  } catch (err) {
    console.error('Admin notifications error:', err);
    res.status(500).json({ message: "Server error" });
  }
};
const admindeleteprofile = async (req, res) => {
  const userId = req.params.profileId;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Deletion error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};


// const admindeleteprofile = async (req, res) => {
//   const userId = req.params.profileId;

//   try {
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { isActive: false },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({ message: "User deactivated successfully" });
//   } catch (err) {
//     console.error("Deactivation error:", err);
//     res.status(500).json({ message: "Failed to deactivate user" });
//   }
// };
// Get current user's profileType only
const getUserProfileType = async (req, res) => {
  console.log("userId:", req.userId);
  const userId = req.userId;
  
  try {
    // Fetch only the profileType field
    const user = await User.findById(userId).select("profileType");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      profileType: user.profileType || 'free' // Default to 'free' if not set
    });
  } catch (error) {
    console.error("Profile type fetch error:", error);
    res.status(500).json({ message: "Error fetching profile type" });
  }
};

// Get user profile by ID
const getUserProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find user by ID and exclude password, ensuring it's a regular user
    const user = await User.findOne({ _id: id, userType: 'user' }).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      success: true,
      profile: user 
    });
  } catch (error) {
    console.error("Error fetching user profile by ID:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// Get user gallery by user ID
const getUserGallery = async (req, res) => {
  try {
    const { id } = req.params; // This is the userId we want to fetch gallery for
    
    // Verify that the user is a regular user, not an admin
    const user = await User.findOne({ _id: id, userType: 'user' });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Find gallery by userId
    const gallery = await UserGallery.findOne({ userId: id });
    
    if (!gallery) {
      return res.status(200).json({ 
        success: true,
        gallery: [] // Return empty array if no gallery found
      });
    }

    res.status(200).json({ 
      success: true,
      gallery: gallery.photos || []
    });
  } catch (error) {
    console.error("Error fetching user gallery:", error);
    res.status(500).json({ message: "Error fetching gallery" });
  }
};
const deletePhoto = async (req, res) => {
  try {
    const {  photoUrl } = req.body; // userId for security/ownership, photoUrl from request
    const userId = req.userId;
    if (!photoUrl) {
      return res.status(400).json({ success: false, message: 'photoUrl is required' });
    }

    // Remove photo from DB array (user gallery doc)
    const updated = await UserGallery.findOneAndUpdate(
      { userId, "photos.url": photoUrl },
      { $pull: { photos: { url: photoUrl } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Photo or user not found' });
    }

    // Physically remove from disk
    const filePath = path.resolve(photoUrl.replace(/\\/g, '/')); // normalize slashes
    fs.unlink(filePath, (err) => {
      if (err) {
        // Warn but return DB delete as success
        return res.json({ 
          success: true, 
          message: 'Photo removed from gallery, but file was missing on disk' 
        });
      }
      res.json({
        success: true,
        message: 'Photo deleted from user gallery and server folder'
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const admindeletePhoto = async (req, res) => {
  try {
    const {  photoUrl } = req.body; // userId for security/ownership, photoUrl from request
    const userId = req.params.profileId;
    if (!photoUrl) {
      return res.status(400).json({ success: false, message: 'photoUrl is required' });
    }

    // Remove photo from DB array (user gallery doc)
    const updated = await UserGallery.findOneAndUpdate(
      { userId, "photos.url": photoUrl },
      { $pull: { photos: { url: photoUrl } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Photo or user not found' });
    }

    // Physically remove from disk
    const filePath = path.resolve(photoUrl.replace(/\\/g, '/')); // normalize slashes
    fs.unlink(filePath, (err) => {
      if (err) {
        // Warn but return DB delete as success
        return res.json({ 
          success: true, 
          message: 'Photo removed from gallery, but file was missing on disk' 
        });
      }
      res.json({
        success: true,
        message: 'Photo deleted from user gallery and server folder'
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = { 
  getMatches, 
  searchProfiles, 
  likeUser, 
  updateProfile, 
  uploadPhoto, 
  getUserProfile, 
  getAllUsers, 
  uploadToGallery, 
  getRecommendations, 
  toggleLike, 
  getNotifications, 
  adminupdateProfile, 
  admindeleteprofile, 
  getUserProfileType, 
  getUserProfileById, 
  getUserGallery, 
  getAllNotificationsAdmin, 
  adminprofileupdateProfile, 
  getadminUserProfile, 
  adminuploadToGallery, 
  deletePhoto, 
  admindeletePhoto, 
  getAllAdminUsers 
};
  