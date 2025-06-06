// src/models/ActionPoint.js
const mongoose = require('mongoose');

const actionPointSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  emailId: { // Gmail Message ID (or provider's unique ID)
    type: String,
    required: true,
    index: true,
  },
  emailSubject: {
    type: String,
    required: false, // Good to have, but maybe not strictly required
  },
  // --- New Fields for Email Metadata ---
  emailSender: { // Store the 'From' address/name
    type: String,
    required: false, // Make required if essential for UI
  },
  emailSnippet: { // Store the short preview text
    type: String,
    required: false,
  },
  emailDate: { // Store the date from the email header
    type: Date,
    required: false, // Make required if essential for UI
    index: true, // Index if you plan to sort/filter by this date often
  },
  // --- End of New Fields ---

  actionPoints: { // AI-generated action points
    type: [String],
    required: true, // Keep required, will be [] if none
    default: [], // Default to empty array
  },
  summary: {
    type: String,
    required: false // Allow empty/null if AI fails or doesn't provide one
  },
  
  status: { // User's status for this email/action point
    type: String,
    enum: ['pending', 'done', 'dismissed'],
    default: 'pending',
    index: true,
  },
   isRead: {
    type: Boolean,
    default: false, // Default to unread when first processed
    required: true,
  },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Ensure uniqueness per user and email ID
actionPointSchema.index({ userId: 1, emailId: 1 }, { unique: true });


const ActionPoint = mongoose.model('ActionPoint', actionPointSchema);

module.exports = ActionPoint;