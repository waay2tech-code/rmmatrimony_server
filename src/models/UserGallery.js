const mongoose = require('mongoose');

const userGallerySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  photos: [
    {
      url: String,
      isProfile: { type: Boolean, default: false }
    }
  ],
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserGallery', userGallerySchema);
