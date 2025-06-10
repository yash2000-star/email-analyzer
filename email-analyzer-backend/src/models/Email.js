const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  // Link to the user who owns this email
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Unique identifier from Gmail
  gmailId: {
    type: String,
    required: true,
    unique: true, // Prevent duplicate emails
    index: true,
  },
  threadId: {
    type: String,
    index: true,
  },
  subject: String,
  sender: String,
  recipient: String,
  snippet: String,
  body: String, // Store the full HTML or plain text body
  isRead: {
    type: Boolean,
    default: false,
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  receivedAt: {
    type: Date,
    required: true,
  },

  // --- AI ANALYSIS FIELDS ---
  aiSummary: String,
  aiCategory: String, // e.g., "Promotion", "Job Alert", "Urgent"
  aiSentiment: String, // e.g., "Positive", "Neutral", "Negative"
  aiActionPoints: {
    type: [String], // An array of strings
    default: [],
  },
  // Timestamp to know when the analysis was last performed
  analyzedAt: Date,

}, {
  // Add timestamps for when the record is created and updated in our DB
  timestamps: true,
});

// Create a compound index for efficient querying
emailSchema.index({ userId: 1, receivedAt: -1 });

module.exports = mongoose.model('Email', emailSchema);