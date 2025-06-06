require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cron = require('node-cron');
const connectDB = require('./config/database'); // Import the connectDB function
const configurePassport = require('./config/passport');

// --- Import the Job Function ---
const { processUserEmails } = require('./jobs/emailProcessor');

// Connect to Database 
connectDB();

const app = express();

//Middleware
//Enable Express to parse JSON request bodies
app.use(express.json());
// Enable Express to parse URL-encoded request bodies
app.use(express.urlencoded({extended: true}));

// --- Session Configuration --- MUST be before Passport initialization
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key_fallback', // Change in production! Put in .env
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, //Don't create session until something stored
      // store: // Add a production-ready store like connect-mongo later
}));

//---Passport Middleware---
app.use(passport.initialize()); //initialize Passport
app.use(passport.session()); //Allow passport to use express-session

// --- Configure Passport Strategy --- (Call the function we will create)
configurePassport(passport); // Pass the passport instance to our config function

// Basic route for testing 
app.get('/', (req, res) => {
    res.send('Email Analyzer Backend is running!');
});

// --- Authentication Routes (We will create these next) ----
const authRoutes = require('./routes/authRoutes'); // We will create this file
app.use('/auth', authRoutes) 

const apiRoutes = require('./routes/apiRoutes'); // Import the new router
app.use('/api', apiRoutes); // Mount API routes under /api path

// --- Schedule the Background Job ---
// Example: Run every day at 3:00 AM (server time)
// Cron syntax: second minute hour day-of-month month day-of-week
//             (0)   (0)   (3)     (*)       (*)      (*)

cron.schedule('9 8 * * *', () => {
    console.log('⏰ Running scheduled email processing job...');
    processUserEmails().catch(err => { // Start the job
        console.error('Unhandled error during scheduled job execution:', err);
    });
  }, {
    scheduled: true,
    // timezone: "America/New_York" // Optional: Specify timezone if server time != desired time
    timezone: "Asia/Kolkata" // Example: Set to India Standard Time
  });
  
  console.log('📰 Email processing job scheduled to run daily at 11:51 AM IST.');

console.log('📰 Automatic daily job scheduling is DISABLED.');
const PORT = process.env.PORT || 3001; //use port from .env or default to 3001
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});