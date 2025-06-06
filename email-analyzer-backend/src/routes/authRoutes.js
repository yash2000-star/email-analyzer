// src/routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const router = express.Router();
const { getUnreadEmails } = require('../services/gmailService');
const { analyzeEmailContent } = require('../services/aiService'); // Import the AI service

// --- Import Mongoose Models ---
const DailySummary = require('../models/DailySummary'); // Adjust path if needed
const ActionPoint = require('../models/ActionPoint');   // Adjust path if needed
const User = require('../models/User'); // Might need this if DailySummary doesn't populate user info automatically

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// --- Helper middleware to check authentication ---
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next(); // User is logged in, proceed
    }
    // User is not logged in
    res.status(401).redirect('/auth/google'); // Or send an error JSON: res.status(401).json({ message: 'Please log in.' });
  };

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', {
  scope: [
    'profile', // Get basic profile information (name, photo)
    'email',   // Get user's email address
    'https://www.googleapis.com/auth/gmail.readonly' // Permission to read emails
  ],
  accessType: 'offline', // <--- Request refresh token!
  prompt: 'consent'      // <--- Force consent screen & refresh token (useful for dev/testing, maybe remove for prod)
}));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/google/failure' // Redirect on failure
    // successRedirect: '/auth/google/success' // We'll handle success manually below
  }),
  (req, res) => {
    // Successful authentication!
    console.log('Successfully authenticated, redirecting to frontend dashboard...');
       // Use an environment variable for the frontend URL in production
       const frontendDashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Default to Vite dev port
       res.redirect(`${frontendDashboardUrl}/dashboard`); // Redirect to frontend
       // res.redirect('/auth/google/success'); // <-- REMOVE THIS LINE or comment out
  }
);

// @desc    Simple success route (replace with actual redirect later)
// @route   GET /auth/google/success
router.get('/google/success', (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/google/failure'); // If no user in session somehow
    }
    res.send(`<h1>Login Success!</h1><p>Welcome ${req.user.name}!</p><p>Email: ${req.user.email}</p><p>Refresh Token Received: ${req.user.googleRefreshToken ? 'Yes' : 'No (Check Logs/Google Consent)'}</p><a href="/auth/logout">Logout</a>`);
    // In a real app, you'd redirect to your frontend: res.redirect('/dashboard');
});

// @desc    Simple failure route
// @route   GET /auth/google/failure
router.get('/google/failure', (req, res) => {
  res.status(401).send('<h1>Login Failed</h1><p>Something went wrong during Google Authentication.</p><a href="/">Home</a>');
});


// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
  req.logout(function(err) { // req.logout requires a callback function
    if (err) { return next(err); }
    console.log('User logged out, redirecting...');
    // You would typically redirect to the home page or login page
    // res.redirect('http://localhost:3000/'); // Example frontend redirect
    res.redirect('/'); // Redirect to backend root for now
  });
});


// @desc    Check authentication status (Example API endpoint)
// @route   GET /auth/status
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) { // Method provided by Passport
        res.json({
            isAuthenticated: true,
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                hasRefreshToken: !!req.user.googleRefreshToken // Check if token exists
            }
        });
    } else {
        res.json({
            isAuthenticated: false,
            user: null
        });
    }
});


// --- Test Route for Fetching, Analyzing, and SAVING Emails ---
// @desc    Fetch unread emails, analyze them, and save results for the logged-in user
// @route   GET /auth/test-emails
router.get('/test-emails', ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id; // Logged-in user's MongoDB ID
      const userEmail = req.user.email; // Logged-in user's email for logging
      console.log(`User ${userEmail} requested /auth/test-emails (with AI analysis & DB Save)...`);
  
      // --- Determine Date for Summary ---
      // Use the start of today (in UTC for consistency, or user's timezone if available/needed)
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
  
      // 1. Fetch Emails
      const emails = await getUnreadEmails(userId);
  
      if (emails.length === 0) {
        return res.json({ message: "No unread emails to analyze.", emails: [] });
      }
  
      console.log(`Fetched ${emails.length} emails. Starting AI analysis & DB save (with delays)...`);
  
      const analysisResults = []; // Keep track of results for the response
      const processedEmailIdsForSummary = []; // Store IDs for the DailySummary document
      const savedActionPoints = []; // Store saved action points for the response
      let dailySummaryDoc = null; // To hold the DailySummary document for this run
  
      const RATE_LIMIT_DELAY = 5000; // 5 seconds
  
      // --------------------------------------------------
      // Loop through emails for ANALYSIS and ACTION POINT saving
      // --------------------------------------------------
      for (const email of emails) {
        console.log(`--- Processing Email ID: ${email.id} ---`);
  
        // Skip emails with no content (same as before)
        if (!email.body && !email.subject) {
          console.log(`Skipping analysis & save for email ID ${email.id} due to empty content.`);
          analysisResults.push({
            emailId: email.id, subject: email.subject, analysis: null, error: 'Empty subject and body'
          });
          // Optional small delay even for skipped emails
          // await delay(100);
          continue;
        }
  
        let analysis = null;
        let error = null;
  
        try {
          // --- Call AI Service ---
          analysis = await analyzeEmailContent(email.subject || '', email.body || '');
          console.log(`Successfully analyzed Email ID: ${email.id}`);
  
          // --- Save Action Points (if any) ---
          if (analysis && analysis.actionPoints && analysis.actionPoints.length > 0) {
            console.log(`Found ${analysis.actionPoints.length} action points for Email ID: ${email.id}. Saving...`);
            // Use findOneAndUpdate with upsert: true to avoid creating duplicate action points
            // for the same email if the job runs again before the user handles them.
            // We match on userId and emailId.
            const actionPointDoc = await ActionPoint.findOneAndUpdate(
              { userId: userId, emailId: email.id },
              {
                $set: { // Use $set to update fields without overwriting the whole doc if it exists
                  emailSubject: email.subject || 'No Subject',
                  actionPoints: analysis.actionPoints,
                  status: 'pending', // Reset status to pending if updating
                  updatedAt: new Date() // Manually update timestamp on update
                },
                $setOnInsert: { // Fields to set only when creating a new document
                   userId: userId,
                   emailId: email.id,
                   createdAt: new Date()
                }
              },
              {
                new: true, // Return the modified document (or the new one if created)
                upsert: true // Create the document if it doesn't exist
              }
            );
            console.log(`Saved/Updated ActionPoint for Email ID: ${email.id} (Doc ID: ${actionPointDoc._id})`);
            savedActionPoints.push(actionPointDoc); // Add to our response list
          } else {
              console.log(`No action points found or generated for Email ID: ${email.id}.`);
              // Optional: Delete existing action points for this email if none found now? Depends on desired logic.
              // await ActionPoint.deleteOne({ userId: userId, emailId: email.id });
          }
  
          // --- Mark as processed for Daily Summary ---
          processedEmailIdsForSummary.push(email.id);
          error = null; // No error occurred
  
        } catch (aiError) {
          console.error(`AI analysis or DB save failed for email ID ${email.id}: ${aiError.message}`);
          error = aiError.message; // Store error message
  
          // Rate limit handling (same as before)
          if (aiError.message.includes('429 Too Many Requests')) {
               const retryMatch = aiError.message.match(/retryDelay":"(\d+)s"/);
               let waitTime = RATE_LIMIT_DELAY;
               if (retryMatch && retryMatch[1]) {
                   waitTime = (parseInt(retryMatch[1], 10) + 1) * 1000;
                   console.log(`Rate limit hit. Waiting for suggested retry delay: ${waitTime / 1000}s`);
               } else {
                   console.log(`Rate limit hit. Waiting for default delay: ${waitTime / 1000}s`);
               }
                await delay(waitTime);
                // We are continuing to the next email after delay in this logic
                // Consider if you need to retry the *failed* email instead in a real job.
                continue; // Move to the next email in the loop after rate limit delay
          }
          // For other errors, the loop will proceed to finally block for the standard delay
  
        } finally {
          // Store result for the final response (even if failed)
          analysisResults.push({
              emailId: email.id,
              subject: email.subject,
              analysis: analysis, // Will be null if error occurred before analysis completed
              error: error
          });
  
          // Standard delay before processing the next email (same as before)
          if (emails.indexOf(email) < emails.length - 1) { // Don't delay after the last email
               console.log(`Waiting ${RATE_LIMIT_DELAY / 1000}s before next email...`);
               await delay(RATE_LIMIT_DELAY);
          }
        }
      } // --- End of email processing loop ---
  
      console.log("AI analysis & ActionPoint saving loop complete.");
  
        // --------------------------------------------------
    // Create or Update the DailySummary document
    // --------------------------------------------------
    if (processedEmailIdsForSummary.length > 0) {
        console.log(`Attempting to save DailySummary for ${userEmail} on ${todayStart.toISOString().split('T')[0]}...`);
        try {
            // Use findOneAndUpdate with upsert:true
            dailySummaryDoc = await DailySummary.findOneAndUpdate(
                { userId: userId, date: todayStart }, // Find criteria: Match user and specific day
                {
                    // --- Operators applied on UPDATE or INSERT ---
                    $set: { // Always update the summary and timestamp
                        summary: `Processed ${processedEmailIdsForSummary.length} emails today.`, // Updated summary text
                        updatedAt: new Date()
                    },
                    $addToSet: { // Add email IDs to the set (works correctly on insert too)
                         processedEmailIds: { $each: processedEmailIdsForSummary }
                    },
                    // --- Operator applied ONLY on INSERT ---
                    $setOnInsert: {
                        userId: userId, // Set userId only if inserting
                        date: todayStart,   // Set date only if inserting
                        createdAt: new Date() // Set createdAt only if inserting
                        // REMOVED processedEmailIds from here - $addToSet handles it.
                    }
                },
                {
                    upsert: true, // Create document if it doesn't exist
                    new: true,    // Return the modified or new document
                    setDefaultsOnInsert: true // Apply schema defaults if inserting
                }
            );
            console.log(`Successfully saved/updated DailySummary (Doc ID: ${dailySummaryDoc._id})`);
        } catch(summaryError) {
             console.error(`Failed to save DailySummary for user ${userId} on ${todayStart}:`, summaryError);
             // Log the specific error details
             console.error("Summary Save Error Details:", summaryError.errorResponse || summaryError.message);
             // Maybe add summaryError details to the final response?
        }
    } else {
        console.log("No emails were successfully processed, skipping DailySummary save.");
    }

    // ... rest of the response sending logic ...
  
      // --------------------------------------------------
      // Send Final Response
      // --------------------------------------------------
      res.json({
        message: `Processed ${analysisResults.length} out of ${emails.length} fetched emails. Saved ${savedActionPoints.length} action point records.`,
        dailySummaryId: dailySummaryDoc ? dailySummaryDoc._id : null,
        results: analysisResults, // Show individual email processing results
        // savedActionPoints: savedActionPoints // Optionally include the saved action point details
      });
  
    } catch (error) {
      // Handle errors from getUnreadEmails or other unexpected route-level issues
      console.error('Error in /auth/test-emails main route handler:', error);
      res.status(500).json({
        message: 'Failed during the email processing workflow.',
        error: error.message,
      });
    }
  });
  
  module.exports = router;