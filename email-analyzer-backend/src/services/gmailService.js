// File: email-analyzer-backend/src/services/gmailService.js
// --- FINAL DEFINITIVE VERSION ---

const { google } = require('googleapis');
const { convert } = require('html-to-text');
const User = require('../models/User');
const Email = require('../models/Email');
const aiService = require('./aiService');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

const getGmailClient = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error(`User not found with ID: ${userId}`);
  if (!user.googleRefreshToken) {
    throw new Error(`Missing Google Refresh Token for user ${user.email}. Please re-authenticate.`);
  }
  oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

const decodeBase64 = (encodedString) => {
  if (!encodedString) return '';
  return Buffer.from(encodedString.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
};

const getEmailBody = (payload) => {
  if (!payload) return '';
  const plainTextPart = findPartByMimeType(payload, 'text/plain');
  if (plainTextPart && plainTextPart.body?.data) {
    return decodeBase64(plainTextPart.body.data);
  }
  const htmlPart = findPartByMimeType(payload, 'text/html');
  if (htmlPart && htmlPart.body?.data) {
    const htmlContent = decodeBase64(htmlPart.body.data);
    return convert(htmlContent, { wordwrap: 130 });
  }
  return '';
};

const findPartByMimeType = (payload, mimeType) => {
  const stack = [payload];
  while (stack.length > 0) {
    const part = stack.pop();
    if (part.mimeType === mimeType) return part;
    if (part.parts) stack.push(...part.parts);
  }
  return null;
};

const getEmailsForDashboard = async (userId) => {
  const gmail = await getGmailClient(userId);
  console.log(`[Sync] Fetching recent message IDs for user ${userId}...`);
  const listResponse = await gmail.users.messages.list({
    userId: 'me', q: 'in:inbox', maxResults: 50,
  });
  const messages = listResponse.data.messages;
  if (!messages || messages.length === 0) {
    return [];
  }
  const messageIds = messages.map(m => m.id);
  const existingEmails = await Email.find({ userId, gmailId: { $in: messageIds } }, 'gmailId');
  const existingEmailIds = new Set(existingEmails.map(e => e.gmailId));
  const newEmailIds = messageIds.filter(id => !existingEmailIds.has(id));
  console.log(`[Sync] Found ${messageIds.length} recent emails. ${newEmailIds.length} are new.`);

  if (newEmailIds.length > 0) {
    console.log(`[Sync] Starting serial processing for ${newEmailIds.length} new emails...`);
    for (const messageId of newEmailIds) {
      try {
        const msgResponse = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
        const { id, threadId, snippet, payload, labelIds } = msgResponse.data;
        const headers = payload.headers;
        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || 'N/A';
        const subject = getHeader('Subject');
        const body = getEmailBody(payload);
        const aiAnalysis = await aiService.analyzeEmailContent(subject, body);
        const newEmail = new Email({
          userId, gmailId: id, threadId, subject, sender: getHeader('From'), recipient: getHeader('To'),
          snippet, body: body,
          isRead: !labelIds.includes('UNREAD'), isStarred: labelIds.includes('STARRED'),
          receivedAt: new Date(getHeader('Date')), aiSummary: aiAnalysis.summary, aiCategory: aiAnalysis.category,
          aiSentiment: aiAnalysis.sentiment, aiActionPoints: aiAnalysis.actionPoints, analyzedAt: new Date(),
        });
        await newEmail.save();
        console.log(`[Sync] Successfully processed and saved email: "${subject.substring(0, 40)}..."`);
        
        // --- THE FINAL FIX ---
        // We increase the delay to >4 seconds to stay under the 15/min rate limit.
        await new Promise(res => setTimeout(res, 4100)); // 4.1 second delay
      } catch (err) {
        console.error(`[Sync Error] Failed to process message ${messageId}:`, err.message);
      }
    }
    console.log(`[Sync] Finished serial processing.`);
  }

  console.log(`[Sync] Fetching final dashboard list from DB for user ${userId}.`);
  const finalEmailList = await Email.find({ userId }).sort({ receivedAt: -1 }).limit(100);
  return finalEmailList;
};

const getEmailFromDB = async (emailId, userId) => {
    const email = await Email.findOne({ _id: emailId, userId: userId });
    return email;
};

module.exports = {
  getEmailsForDashboard, getEmailFromDB
};