require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cron = require('node-cron');
const connectDB = require('./config/database'); // Import the connectDB function
const configurePassport = require('./config/passport');
const cors = require('cors'); // <--- ADD THIS LINE

// --- Import the Job Function ---
const { processUserEmails } = require('./jobs/emailProcessor');

// Connect to Database 
connectDB();

const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
    process.env.FRONTEND_URL
    // Add other origins if needed for local development:
    // 'http://localhost:3000', // Example for React/Vite development server
    // 'http://localhost:5173' // Example for Vite's default dev server
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true // Important for sessions/cookies to be sent cross-origin
}));

//Middleware
//Enable Express to parse JSON request bodies
app.use(express.json());
// Enable Express to parse URL-encoded request bodies
app.use(express.urlencoded({extended: true}));

// --- Session Configuration --- MUST be before Passport initialization
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key_fallback', // Change in production! Put in .env
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    // store: // Add a production-ready store like connect-mongo later
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        httpOnly: true, // Prevent client-side JS from reading the cookie
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
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

cron.schedule('9 8 * * *', () => { // This will run at 8:09 AM daily
    console.log('⏰ Running scheduled email processing job...');
    processUserEmails().catch(err => { // Start the job
        console.error('Unhandled error during scheduled job execution:', err);
    });
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Example: Set to India Standard Time
  });
  
  console.log('📰 Email processing job scheduled to run daily at 8:09 AM IST.');

// The following line contradicts the cron.schedule above. Consider removing it if you want the job to run.
console.log('📰 Automatic daily job scheduling is DISABLED.'); 

const PORT = process.env.PORT || 3001; //use port from .env or default to 3001
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});