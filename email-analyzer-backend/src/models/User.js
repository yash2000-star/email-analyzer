const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: { // Unique identifier from Google
        type: String,
        required: true,
        unique: true,
    },
    email: { // User's email address
        type: String,
        required: true,
        unique: true,
        lowercase: true, //Store emails in lowercase
    },
    name: { // User's display name
        type: String,
        required: true,

    },
     // We need a secure way to store these for background processing
  // For now, let's define them. We'll address secure storage later.
  // Consider encrypting these fields in a real application.
  googleAccessToken: { // Short-lived token (might not store long term)
    type: String,
    required: false, //Might get refresh token

    },
    googleRefreshToken: { // Long-lived token for offline access
      type: String,
      required: false, // User needs to grant offline access
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const User = mongoose.model('User', userSchema);

module.exports = User;
