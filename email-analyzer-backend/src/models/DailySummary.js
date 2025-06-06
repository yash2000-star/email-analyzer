const mongoose = require('mongoose');

const dailySummarySchema = new mongoose.Schema({
    userId: { // Link to the User who onws this summary
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the 'User model
        required: true,
        index: true, //Add index for faster lookups by user
    },
    date: { // The date this summary applies to (e.g., start of the day)
        type: Date,
        required: true,
        index: true, // Add index for faaster lookups by date/user

    },
    summary: { // The AI-generated summary text
        type: String,
        required: true,

    },
    processedEmailIds: { // List of original email IDs included in this summary
        type: [String],
        default: [],

    },
    // Consider adding:
  // status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});


//Ensure a user can only have one summary per day
dailySummarySchema.index({ userId: 1, date: 1}, { unique: true });


const DailySummary = mongoose.model('DailySummary', dailySummarySchema);

module.exports = DailySummary;