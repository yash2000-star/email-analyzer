// src/routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import Models
const DailySummary = require('../models/DailySummary');
const ActionPoint = require('../models/ActionPoint'); // Still querying this collection

// --- Import the specific service function ---
const { processUserEmails } = require('../jobs/emailProcessor');
const { getSpecificEmailDetails } = require('../services/gmailService'); // Adjust path if needed
const { decodeBase64, getEmailBody } = require('../services/gmailService'); // Also import helpers if not exported separately

// Ensure User is Authenticated Middleware (keep as is)
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) { return next(); }
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
};
router.use(ensureAuthenticated);

// --- API Routes ---

/**
 * @route   GET /api/summaries
 * @desc    Get list of daily summaries for the logged-in user
 * @access  Private
 */
// Keep the /api/summaries route as is...
router.get('/summaries', async (req, res) => {
    try {
        const summaries = await DailySummary.find({ userId: req.user.id })
            .sort({ date: -1 })
            .select('-processedEmailIds')
            .lean();
        res.json(summaries);
    } catch (err) {
        console.error("Error fetching summaries:", err);
        res.status(500).json({ message: 'Error fetching summaries.' });
    }
});


/**
 * @route   GET /api/processed-emails?date=YYYY-MM-DD  (*** RENAMED ***)
 * @desc    Get processed email metadata for a specific date for the logged-in user
 * @access  Private
 */
// Rename the route from '/action-points' to '/processed-emails'
router.get('/processed-emails', async (req, res) => { // <-- Route path changed
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Invalid or missing date query parameter (YYYY-MM-DD).' });
    }

    try {
        // Calculate start and end of the requested day in UTC
        const startDate = new Date(`${date}T00:00:00.000Z`);
        const endDate = new Date(startDate);
        endDate.setUTCDate(startDate.getUTCDate() + 1);

        // Find ActionPoint documents created within that day range for the user
        // We still query ActionPoint because it now holds metadata for ALL processed emails
        const processedEmails = await ActionPoint.find({
            userId: req.user.id,
            createdAt: { // Filter by creation time (when the job processed it)
                $gte: startDate,
                $lt: endDate
            }
        })
        .sort({ emailDate: -1 }) // *** Sort by the actual email date descending ***
        .select( // Select only the fields needed for the list view
            '_id emailId emailSender emailSubject emailSnippet emailDate status isRead actionPoints' // Include actionPoints to check length
        )
        .lean(); // Use lean for performance

        // Optional: Map the results to add a 'hasActionPoints' flag if needed by frontend
        const results = processedEmails.map(email => ({
            ...email,
            hasActionPoints: email.actionPoints && email.actionPoints.length > 0,
            // Don't need the full actionPoints array for the list view, so remove it after check
            // actionPoints: undefined // Or delete email.actionPoints;
        }));
        // Refinement: Instead of sending the full array and removing, select specific fields:
        // const results = await ActionPoint.find({ ... })
        // .sort({ emailDate: -1 })
        // .select('_id emailId emailSender emailSubject emailSnippet emailDate status') // Select base fields
        // .lean();
        // Then maybe add hasActionPoints based on a check? Or let frontend check if ActionPoints array is > 0 later if needed?
        // Let's stick with sending the necessary list fields for now.

        res.json(processedEmails); // Send the array of processed email metadata

    } catch (err) {
        console.error(`Error fetching processed emails for date ${date}:`, err);
        res.status(500).json({ message: 'Error fetching processed emails.' });
    }
});


/**
 * @route   PATCH /api/action-points/:actionPointId/status
 * @desc    Update the status of a specific action point/processed email record
 * @access  Private
 */
// Keep the PATCH route for updating status as is - it uses the ActionPoint ID (_id)
router.patch('/action-points/:actionPointId/status', async (req, res) => { // <-- Keep route name consistent with what it modifies
    const { actionPointId } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['pending', 'done', 'dismissed'];

    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status provided. Must be one of: ${allowedStatuses.join(', ')}` });
    }
    if (!mongoose.Types.ObjectId.isValid(actionPointId)) {
        return res.status(400).json({ message: 'Invalid Action Point ID format.' });
    }

    try {
        const actionPoint = await ActionPoint.findOneAndUpdate(
            { _id: actionPointId, userId: req.user.id },
            { $set: { status: status } },
            { new: true }
        );

        if (!actionPoint) {
            return res.status(404).json({ message: 'Action Point not found or user unauthorized.' });
        }
        res.json(actionPoint);
    } catch (err) {
        console.error(`Error updating action point ${actionPointId} status:`, err);
        res.status(500).json({ message: 'Error updating action point status.' });
    }
});

/**
 * @route   GET /api/emails/:emailId/content (*** NEW ROUTE ***)
 * @desc    Get full original email content and stored AI analysis for a specific email
 * @access  Private
 */
router.get('/emails/:emailId/content', async (req, res) => {
    const { emailId } = req.params;
    const userId = req.user.id;

    // Basic validation (can add more robust checks if needed)
    if (!emailId) {
        return res.status(400).json({ message: 'Missing emailId parameter.' });
    }

    try {
        // 1. Fetch Original Email Details from Gmail API
        const originalEmailData = await getSpecificEmailDetails(userId, emailId);

        if (!originalEmailData) {
            return res.status(404).json({ message: 'Original email not found in Gmail account.' });
        }

        // 2. Extract necessary details from the original email
        // Re-use header parsing logic (or enhance gmailService to return parsed data)
         const payload = originalEmailData.payload;
         const headers = payload?.headers || [];
         const getHeader = (name) => {
            const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
            return header ? header.value : null;
         };

          // --- Use the modified getEmailBody ---
          const emailBodyResult = getEmailBody(payload);

         const originalEmail = {
             from: getHeader('From'),
             to: getHeader('To'),
             subject: getHeader('Subject'),
             date: getHeader('Date'),
             // Re-use body parsing logic from gmailService (maybe move helpers?)
             body: emailBodyResult.body,
             bodyType: emailBodyResult.type,
             id: originalEmailData.id,
             threadId: originalEmailData.threadId
             
         };

        // 3. Fetch Stored AI Analysis (Summary/Action Points) from our DB
        const storedAnalysis = await ActionPoint.findOne({
            userId: userId,
            emailId: emailId
        }).select('Summary actionPoints status_id').lean(); // Use lean for read

        // 4. Combine results
        const responsePayload = {
            originalEmail: originalEmail,
            // Include analysis only if found, provide defaults otherwise
            analysis: storedAnalysis ? {
                summary: storedAnalysis.summary || null, // Assuming you add summary field later
                actionPoints: storedAnalysis.actionPoints || [],
                status: storedAnalysis.status,
                _id: storedAnalysis._id // Include ActionPoint ID for status updates
            } : {
                 summary: null, actionPoints: [], status: 'pending', _id: null
            }
        };

        res.json(responsePayload);

    } catch (error) {
        console.error(`Error fetching content for email ${emailId}:`, error);
        // Handle specific errors from gmailService (e.g., auth revoked)
        if (error.message.includes('Token has been expired or revoked')) {
            return res.status(401).json({ message: 'Gmail token revoked. Please re-authenticate.', needsReAuth: true });
        }
        res.status(500).json({ message: 'Error fetching email content.' });
    }
});



module.exports = router;