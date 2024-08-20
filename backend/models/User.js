// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: String,  // Add this field
});

module.exports = mongoose.model('User', UserSchema);
