const mongoose = require('mongoose'); // Import mongoose

const RatedImageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  imageUrl: { type: String, required: true },
  // Add other fields if needed
});

module.exports = mongoose.model('RatedImage', RatedImageSchema);
