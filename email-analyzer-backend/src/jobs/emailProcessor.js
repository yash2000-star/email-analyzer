// src/jobs/emailProcessor.js
const mongoose = require('mongoose');
const User = require('../models/User');
const DailySummary = require('../models/DailySummary');
const ActionPoint = require('../models/ActionPoint');
const { getUnreadEmails } = require('../services/gmailService'); // Assuming getUnreadEmails returns { id, subject, from, date, snippet, body: { body: string, type: string } }
const { analyzeEmailContent } = require('../services/aiService');

// Helper function for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Main Job Function ---
const processUserEmails = async () => {
    console.log('*** Starting Daily Email Processing Job ***');
    const startTime = Date.now();
    const usersToProcess = await User.find({ googleRefreshToken: { $ne: null } }).select('_id email');

    if (!usersToProcess || usersToProcess.length === 0) {
        console.log('No users found with refresh tokens. Job finished.');
        return;
    }

    console.log(`Found ${usersToProcess.length} users to process.`);
    let totalEmailsProcessed = 0;
    let totalActionPointsFound = 0;
    let totalActionPointDocsSaved = 0;
    let usersSuccessfullyProcessed = 0;
    let usersFailed = 0;

    for (const user of usersToProcess) {
        console.log(`\n--- Processing User: ${user.email} (ID: ${user._id}) ---`);
        const userStartTime = Date.now();
        let userEmailsAnalyzedCount = 0;
        let userActionPointsFoundCount = 0;
        let userActionPointDocsSavedCount = 0;
        let userProcessingError = null;

        try {
            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);
            // Expect emails to be array of { id, subject, from, date, snippet, body: { body: 'content', type: 'text/plain|text/html' } }
            const emails = await getUnreadEmails(user._id);

            if (emails.length === 0) {
                console.log(`No unread emails found for ${user.email}. Skipping analysis.`);
                await ensureDailySummaryExists(user._id, todayStart, 0, []); // Pass empty array
                usersSuccessfullyProcessed++;
                continue;
            }
            console.log(`Fetched ${emails.length} emails for ${user.email}. Starting processing...`);

            const processedEmailIdsForSummary = [];
            const RATE_LIMIT_DELAY = 5000;

            // --- Loop through fetched emails for this user ---
            for (const email of emails) {
                 // --- Extract body string safely ---
                 const emailBodyString = email.body?.body || ''; // Get the string from the inner 'body' property
                 const emailSubjectString = email.subject || '';

                 // Skip if both subject and body string are effectively empty
                 if (!emailBodyString && !emailSubjectString) {
                    console.log(`Skipping analysis for email ID ${email.id} (User ${user.email}) due to empty content.`);
                    continue;
                 }

                let analysisResult = { summary: null, actionPoints: [] };
                let analysisError = null;
                let shouldProcessDb = true; // Flag specifically for DB saving

                try {
                    console.log(`Analyzing Email ID: ${email.id} (User ${user.email})`);
                    // --- Pass the extracted STRINGS to the AI function ---
                    analysisResult = await analyzeEmailContent(emailSubjectString, emailBodyString); // Use extracted strings
                    userEmailsAnalyzedCount++;

                    // DEBUG LOG 1
                    console.log(`DEBUG: AI Result for ${email.id}:`, JSON.stringify(analysisResult));

                    if (analysisResult.actionPoints && analysisResult.actionPoints.length > 0) {
                        userActionPointsFoundCount += analysisResult.actionPoints.length;
                    }

                } catch (aiError) {
                    console.error(`AI analysis failed for Email ID ${email.id} (User ${user.email}): ${aiError.message}`);
                    analysisError = aiError.message;
                    if (aiError.message.includes('429 Too Many Requests')) {
                         const retryMatch = aiError.message.match(/retryDelay":"(\d+)s"/);
                         let waitTime = RATE_LIMIT_DELAY;
                         if (retryMatch && retryMatch[1]) {
                             waitTime = (parseInt(retryMatch[1], 10) + 1) * 1000;
                             console.log(`Rate limit hit. Waiting for suggested retry delay: ${waitTime / 1000}s before next AI call...`);
                         } else {
                            console.log(`Rate limit hit. Waiting for default delay: ${waitTime / 1000}s before next AI call...`);
                         }
                          await delay(waitTime);
                          shouldProcessDb = false; // Don't save if rate limited on AI call
                          // Continue will skip the DB save and the final delay for this iteration
                          continue;
                    }
                     // Keep shouldProcessDb = true for other AI errors to save metadata
                }

                // --- Save/Update ActionPoint/Metadata Record ---
                 if (shouldProcessDb) {
                    try {
                        const emailDateObject = email.date ? new Date(email.date) : null;
                        const updateData = {
                            emailSubject: emailSubjectString, // Use variable
                            emailSender: email.from || 'Unknown Sender',
                            emailSnippet: email.snippet || '',
                            emailDate: isNaN(emailDateObject) ? null : emailDateObject,
                             // Use analysisResult which contains { summary, actionPoints }
                            summary: analysisResult?.summary || null,
                            actionPoints: analysisResult?.actionPoints || [],
                            status: 'pending',
                            updatedAt: new Date(),
                            isRead: email.isRead,
                            // Optional: Store analysisError here if needed:
                            // analysisErrorInfo: analysisError ? { message: analysisError } : null
                        };

                        // DEBUG LOG 2
                        console.log(`DEBUG: Saving/Updating record for Email ID: ${email.id} with summary: ${updateData.summary ? '"' + updateData.summary.substring(0,30) + '..."' : 'null'}, actions: ${updateData.actionPoints.length}`);

                        await ActionPoint.findOneAndUpdate(
                            { userId: user._id, emailId: email.id },
                            { $set: updateData, $setOnInsert: { userId: user._id, emailId: email.id, createdAt: new Date() } },
                            { new: true, upsert: true, setDefaultsOnInsert: true }
                        );
                        userActionPointDocsSavedCount++;
                        processedEmailIdsForSummary.push(email.id);

                    } catch (dbError) {
                         console.error(`Database save failed for Email ID ${email.id} (User ${user.email}): ${dbError.message}`);
                    }
                 }

                // --- Delay before next email (ensure delay happens even if DB skipped due to rate limit elsewhere) ---
                if (emails.indexOf(email) < emails.length - 1) {
                    console.log(`Waiting ${RATE_LIMIT_DELAY / 1000}s before next email for user ${user.email}...`);
                    await delay(RATE_LIMIT_DELAY);
                }

            } // --- End of email loop ---

            // --- Create or Update the DailySummary ---
            // Use processedEmailIdsForSummary which only contains IDs successfully saved/updated
            await ensureDailySummaryExists(user._id, todayStart, emails.length, processedEmailIdsForSummary);

            usersSuccessfullyProcessed++;
            // Note: totalEmailsProcessed still counts fetched emails, not just successfully saved ones
            totalEmailsProcessed += emails.length;
            totalActionPointsFound += userActionPointsFoundCount;
            totalActionPointDocsSaved += userActionPointDocsSavedCount;

        } catch (userError) {
            console.error(`!!! Failed processing user ${user.email} (ID: ${user._id}): ${userError.message} !!!`);
            userProcessingError = userError.message;
            usersFailed++;
        } finally {
            const userEndTime = Date.now();
            console.log(`--- Finished processing User: ${user.email}. Duration: ${((userEndTime - userStartTime) / 1000).toFixed(2)}s. Status: ${userProcessingError ? 'FAILED' : 'SUCCESS'}. Emails Analyzed: ${userEmailsAnalyzedCount}. ActionPoints Found: ${userActionPointsFoundCount}. Docs Saved: ${userActionPointDocsSavedCount} ---`);
        }
    } // --- End of user loop ---

    // --- Final Job Summary ---
    const endTime = Date.now();
    console.log(`\n*** Daily Email Processing Job Finished ***`);
    console.log(`Duration: ${((endTime - startTime) / 1000 / 60).toFixed(2)} minutes`);
    console.log(`Users Processed: ${usersToProcess.length} (Success: ${usersSuccessfullyProcessed}, Failed: ${usersFailed})`);
    console.log(`Total Emails Fetched (Across Users): ${totalEmailsProcessed}`);
    console.log(`Total Action Points Found (Across Users): ${totalActionPointsFound}`);
    console.log(`Total Metadata/ActionPoint Documents Saved/Updated: ${totalActionPointDocsSaved}`);
    console.log('******************************************');
};


// --- Helper function ensureDailySummaryExists ---
const ensureDailySummaryExists = async (userId, date, fetchedCount, processedIds) => {
    try {
        const summaryText = fetchedCount === 0
                    ? `No unread emails found today.`
                    : `Processed ${processedIds.length} out of ${fetchedCount} fetched emails today.`;

        await DailySummary.findOneAndUpdate(
            { userId: userId, date: date },
            {
                $set: { summary: summaryText, updatedAt: new Date() },
                $addToSet: { processedEmailIds: { $each: processedIds || [] } },
                $setOnInsert: { userId: userId, date: date, createdAt: new Date() }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    } catch (summaryError) {
        console.error(`Failed to ensure DailySummary for user ${userId} on ${date}:`, summaryError);
    }
};

// Export the main function
module.exports = {
    processUserEmails
};