// src/services/gmailService.js
const { google } = require('googleapis');
const User = require('../models/User'); // Adjust path as needed

// Create a new OAuth2 client instance
// We configure it once here, and then set user-specific credentials later
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

/**
 * Helper function to get an authorized Gmail API client for a user.
 * It fetches the user's refresh token and sets it on the OAuth2 client.
 * The googleapis library automatically handles refreshing the access token.
 * @param {string} userId - The MongoDB ObjectId of the user.
 * @returns {Promise<object>} - An authorized Gmail API client instance.
 * @throws {Error} - If user not found or refresh token is missing.
 */
const getGmailClient = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found with ID: ${userId}`);
  }
  if (!user.googleRefreshToken) {
    console.error(`User ${userId} (${user.email}) is missing Google Refresh Token.`);
    // TODO: Implement logic to prompt user to re-authenticate.
    throw new Error(`Missing Google Refresh Token for user ${user.email}. Please re-authenticate.`);
  }

  // Set the refresh token credentials on the OAuth2 client
  // The googleapis library will use this to automatically get a new access token
  oauth2Client.setCredentials({
    refresh_token: user.googleRefreshToken,
  });

  // Return an authorized Gmail API client instance
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

/**
 * Decodes a base64 encoded string (common for email bodies).
 * Handles URL-safe base64 encoding.
 * @param {string} encodedString - The base64 encoded string.
 * @returns {string} - The decoded string.
 */
const decodeBase64 = (encodedString) => {
    if (!encodedString) return '';
    // Replace URL-safe characters back to standard base64 characters
    const base64 = encodedString.replace(/-/g, '+').replace(/_/g, '/');
    // Decode using Buffer
    return Buffer.from(base64, 'base64').toString('utf-8');
};


/**
 * Extracts the plain text body from an email message payload.
 * Traverses multipart messages to find the 'text/plain' part.
 * @param {object} payload - The message payload object from Gmail API.
 * @returns {string} - The plain text body, or an empty string if not found.
 */
const getEmailBody = (payload) => {
  let parts = [payload]; // Start with the main payload
  let body = '';
  let mimeType = 'text/plain'; // Default preference

  const stack = [...parts]; // Use a stack for depth-first search of parts

  let plainTextBody = null;
  let htmlBody = null;

  while (stack.length > 0) {
      const part = stack.pop();

      if (!part) continue;

      if (part.mimeType === 'text/plain' && part.body?.data) {
          plainTextBody = decodeBase64(part.body.data);
          // If we find plain text, we prefer it, stop searching this branch? Usually yes.
           // Let's prioritize plain text if found. If not, we'll look for HTML later.
           break; // Found the best possible plain text, exit loop
      } else if (part.mimeType === 'text/html' && part.body?.data) {
          // Store HTML body in case plain text isn't found or is unsuitable
          if (!htmlBody) { // Only store the first HTML part found
               htmlBody = decodeBase64(part.body.data);
          }
      }

      // If it's a container type, add its parts to the stack
      if (part.parts && part.parts.length > 0) {
          // Add parts in reverse order to maintain approximate original order processing
          for (let i = part.parts.length - 1; i >= 0; i--) {
              stack.push(part.parts[i]);
          }
      }
       // Handle nested message/rfc822 parts if necessary (more complex)
       // else if (part.mimeType === 'message/rfc822' && part.payload) {
       //     stack.push(part.payload); // Process nested message payload
       // }
  }

  // --- Decide what to return ---
  if (plainTextBody) {
      body = plainTextBody;
      mimeType = 'text/plain';
  } else if (htmlBody) {
      // Fallback to HTML if no plain text was found
      body = htmlBody;
      mimeType = 'text/html';
  } else if (payload?.body?.data) {
       // Final fallback: decode the top-level body if nothing else worked
       console.warn("Decoding top-level body as final fallback.");
       body = decodeBase64(payload.body.data);
       mimeType = payload.mimeType || 'text/plain'; // Guess mimetype
  }


  return { body: body.trim(), type: mimeType };
};

/**
 * Fetches unread emails for a specific user.
 * @param {string} userId - The MongoDB ObjectId of the user.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of email objects.
 * Each object contains { id, threadId, subject, from, date, snippet, body }.
 * @throws {Error} - If authentication fails or Gmail API call errors occur.
 */
const getUnreadEmails = async (userId) => {
  try {
    const gmail = await getGmailClient(userId);

    // 1. List unread messages (only get IDs first)
    console.log(`Fetching unread message IDs for user ${userId}...`);
    const listResponse = await gmail.users.messages.list({
      userId: 'me', // 'me' refers to the authenticated user
      q: 'is:unread in:inbox', // Query to filter messages (only unread in inbox)
      maxResults: 25, // Limit the number of results per request (adjust as needed)
      // pageToken: // Add logic for pagination if needed later
    });

    const messages = listResponse.data.messages;
    if (!messages || messages.length === 0) {
      console.log(`No unread messages found for user ${userId}.`);
      return []; // No unread messages
    }
    console.log(`Found ${messages.length} unread message IDs.`);

    // 2. Fetch details for each message ID
    const emailDetailsPromises = messages.map(async (message) => {
      try {
          console.log(`Fetching details for message ID: ${message.id}`);
          const msgResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'METADATA', // 'full' gives payload, headers, etc. 'metadata' is less info.
          });

          const payload = msgResponse.data.payload;
          const headers = payload.headers;

          // Helper function to extract specific header value
          const getHeader = (name) => {
            const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
            return header ? header.value : 'N/A';
          };

          const labelIds = msgResponse.data.labelIds || [];
           const isReadStatus = false;

          const emailData = {
            id: msgResponse.data.id,
            threadId: msgResponse.data.threadId,
            subject: getHeader('Subject'),
            from: getHeader('From'),
            date: getHeader('Date'),
            snippet: msgResponse.data.snippet, // Short preview from Gmail
           // body: getEmailBody(payload),  Extract plain text body
             labelIds: labelIds, // Good to have for debugging or other logic
          isRead: isReadStatus,
          };
          return emailData;

      } catch (detailError) {
           console.error(`Error fetching details for message ${message.id}:`, detailError.message);
           // Return null or a specific error object for this email if one fails
           // This prevents one bad email fetch from stopping the whole process
           return null;
      }
    });

    // Wait for all detail requests to complete
    const resolvedEmails = await Promise.all(emailDetailsPromises);

    // Filter out any null results from failed fetches
    const successfulEmails = resolvedEmails.filter(email => email !== null);

    console.log(`Successfully fetched details for ${successfulEmails.length} emails for user ${userId}.`);
    return successfulEmails;

  } catch (error) {
    console.error(`Error in getUnreadEmails for user ${userId}:`, error.message);
    // Handle specific errors like token revocation, API limits etc.
    if (error.message.includes('Token has been expired or revoked')) {
         // TODO: Update user status in DB, maybe mark refresh token as invalid
         console.error(`Refresh token for user ${userId} likely revoked. Needs re-authentication.`);
    } else if (error.response && error.response.status === 403) {
        console.error(`Permission denied for user ${userId}. Check API scopes or user permissions.`);
    }
    // Re-throw the error so the caller knows something went wrong
    throw error;
  }
};

/**
 * Fetches the full details (payload, headers) for a single email message.
 * @param {string} userId - The MongoDB ObjectId of the user.
 * @param {string} messageId - The specific ID of the Gmail message to fetch.
 * @returns {Promise<object|null>} - A promise that resolves to the full message object from Gmail API, or null if not found/error.
 * @throws {Error} - If authentication fails or Gmail API call errors occur (other than not found).
 */
const getSpecificEmailDetails = async (userId, messageId) => {
  try {
      const gmail = await getGmailClient(userId); // Reuse existing helper to get authorized client

      console.log(`Fetching full details for message ID: ${messageId} for user ${userId}...`);
      const msgResponse = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full' // Request full payload to get body, headers etc.
      });

      console.log(`Successfully fetched details for message ID: ${messageId}`);
      return msgResponse.data; // Return the full message resource

  } catch (error) {
      // Specifically handle "Not Found" errors gracefully
      if (error.code === 404) {
          console.warn(`Message ID ${messageId} not found for user ${userId}.`);
          return null; // Return null if the message doesn't exist
      }
      // Log and re-throw other errors (like auth issues)
      console.error(`Error in getSpecificEmailDetails for message ${messageId} (User ${userId}):`, error.message);
      throw error;
  }
};


// Export the new function along with existing ones
module.exports = {
  getUnreadEmails,
  getSpecificEmailDetails,
  getEmailBody,    // <-- Add this line
  decodeBase64,    // <-- Add this line (needed by getEmailBody)
};