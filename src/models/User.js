const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  mobile: String,
  dob:String,
  memberid: { type: String, unique: true } ,// New field for member ID
  qualification:String,
  weight:String,
  aboutMe:String,
  gender:String, 
  address:String,
  profilePhoto: String, // optional
  // ✅ Matches/Search-related fields
  age: Number,
  location: String,
  religion: { type: String, required: false },
  caste: String,
  otherCaste: String,
  about: String,
  height: String,
  occupation: String,
  monthlyIncome: String,
  fatherName: String,
  fatherNative: String,
  motherNative: String,
  fatherOccupation: String,
  motherOccupation: String ,
  siblings: String,
  motherName: String,
  isActive: { type: Boolean, default: true },
  userType: { type: String, enum: ['user', 'admin'], default: 'user' },
  profileStatus: { type: String,
     enum: ['Verified', 'Pending', 'Reported'], 
     default: 'Pending' },
     
  profileType: { type: String, enum: ['Free', 'Premium'], default: 'Free' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // ✅ Important: likes field (for mutual match)
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  // ✅ Password reset functionality
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  lastPasswordReset: {
    type: Date,
    default: null
  }

});

const User = mongoose.model('User', userSchema);

module.exports = User;