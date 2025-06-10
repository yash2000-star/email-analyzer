// File: email-analyzer-backend/src/routes/apiRoutes.js
// --- FULLY UPDATED AND STREAMLINED ---

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// --- Import our new, powerful service functions ---
const { getEmailsForDashboard, getEmailFromDB } = require('../services/gmailService');
const Email = require('../models/Email'); // We'll need the Email model for updates

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
};
router.use(ensureAuthenticated);


// =========================================================================
// --- NEW CORE API ROUTES ---
// =========================================================================

/**
 * @route   GET /api/emails
 * @desc    Get the list of emails for the main dashboard view.
 *          This triggers a sync with Gmail, analyzes new emails, and
 *          returns the full, enriched list from our database.
 * @access  Private
 */
router.get('/emails', async (req, res) => {
    try {
        const emails = await getEmailsForDashboard(req.user.id);
        res.json(emails);
    } catch (err) {
        console.error("Error in GET /api/emails:", err);
        // Handle specific errors like token revocation
        if (err.message.includes('Token') || err.message.includes('credentials')) {
            return res.status(401).json({ message: 'Authentication error with Google. Please re-login.', needsReAuth: true });
        }
        res.status(500).json({ message: 'Failed to fetch emails.' });
    }
});

 /**
 * @route   GET /api/emails/:id
 * @desc    Get the full details of a single, specific email from our database.
 * @access  Private
 */
router.get('/emails/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid email ID format.' });
    }

    try {
        // This function now securely gets the email from our DB
        const email = await getEmailFromDB(id, userId);

        if (!email) {
            return res.status(404).json({ message: 'Email not found or you do not have permission to view it.' });
        }
        res.json(email);
    } catch (err) {
        console.error(`Error in GET /api/emails/${id}:`, err);
        res.status(500).json({ message: 'Failed to retrieve email details.' });
    }
});


/**
 * @route   PATCH /api/emails/:id/star
 * @desc    Toggle the starred status of an email.
 * @access  Private
 */
router.patch('/emails/:id/star', async (req, res) => {
    const { id } = req.params;
    const { isStarred } = req.body; // Expecting { "isStarred": true } or { "isStarred": false }

    if (typeof isStarred !== 'boolean') {
        return res.status(400).json({ message: 'Invalid value for isStarred. Must be a boolean.' });
    }

    try {
        const updatedEmail = await Email.findOneAndUpdate(
            { _id: id, userId: req.user.id }, // Security check
            { $set: { isStarred: isStarred } },
            { new: true } // Return the updated document
        );

        if (!updatedEmail) {
            return res.status(404).json({ message: 'Email not found.' });
        }
        
        // TODO: In a future step, we could also make a call to the Gmail API to star/unstar the email there.
        // For now, we just update our local database.

        res.json(updatedEmail);
    } catch (err) {
        console.error(`Error updating star status for email ${id}:`, err);
        res.status(500).json({ message: 'Error updating email.' });
    }
});

 module.exports = router;