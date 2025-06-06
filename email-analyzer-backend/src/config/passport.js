// src/config/passport.js
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path if necessary

module.exports = function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        // We don't strictly need passReqToCallback here, but it can be useful
        // passReqToCallback: true
      },
      async (accessToken, refreshToken, profile, done) => {
        // This 'verify' callback function runs after Google redirects back
        // It receives the tokens and the user's profile information

        // --- IMPORTANT: Handling the Refresh Token ---
        // Google only sends the refresh token the VERY FIRST time a user authorizes
        // OR if you explicitly use prompt: 'consent' in the auth request.
        // You MUST store it securely when you receive it.
        console.log('--- Google OAuth Callback ---');
        console.log('Access Token:', accessToken ? '[RECEIVED]' : '[NOT RECEIVED]'); // Don't log the actual token
        console.log('Refresh Token:', refreshToken ? '[RECEIVED]' : '[NOT RECEIVED]'); // Log for dev, REMOVE in production
        console.log('Profile ID:', profile.id);
        console.log('Profile Email:', profile.emails ? profile.emails[0].value : '[NO EMAIL]');
        console.log('-----------------------------');


        const newUser = {
          googleId: profile.id,
          email: profile.emails[0].value, // Take the first email
          name: profile.displayName,
          // Store the tokens. Access token might be useful for immediate API calls.
          // Refresh token is crucial for long-term background access.
          googleAccessToken: accessToken, // Consider if you really need to store this long-term
          // Only store the refresh token if we receive it!
          ...(refreshToken && { googleRefreshToken: refreshToken })
        };

        try {
          // Check if user already exists in our database
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists - Update potentially changed info and MOST IMPORTANTLY the refresh token if we got a new one
            console.log(`User found: ${user.email}`);

            // Only update the refresh token field if a new one was provided in this callback
            if (refreshToken) {
              console.log('Updating existing user with new Refresh Token.');
              user.googleRefreshToken = refreshToken;
            }
            // You might also want to update the access token if you plan to use it immediately
            user.googleAccessToken = accessToken;
            // Update name in case it changed in Google profile
            user.name = profile.displayName;

            await user.save();
            done(null, user); // Pass the existing user to passport
          } else {
            // User does not exist - Create a new user
            console.log(`Creating new user: ${newUser.email}`);
            // NOTE: Make sure the newUser object includes the refreshToken if provided!
            if (!refreshToken) {
                console.warn('WARNING: New user signup, but NO refresh token received from Google.');
                // This might happen if the user previously authorized without offline access
                // or if prompt: 'consent' wasn't used. You might need to guide the user
                // to re-authenticate or revoke and grant access again if you NEED the refresh token.
                // For now, we'll create the user but flag the issue.
                // Consider maybe *not* creating the user if the refresh token is essential for your app's core function.
            }

            user = await User.create(newUser);
            done(null, user); // Pass the newly created user to passport
          }
        } catch (err) {
          console.error('Error during Google OAuth user processing:', err);
          done(err, null); // Pass error to passport
        }
      }
    )
  );

  // --- Session Management ---
  // These functions tell Passport how to store user info in the session cookie
  // and how to retrieve it on subsequent requests.

  // Stores the user ID in the session
  passport.serializeUser((user, done) => {
    // We store the MongoDB unique _id
    done(null, user.id); // user.id is the shortcut for user._id in Mongoose
  });

  // Retrieves the user details from the session using the stored ID
  passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user); // Makes user object available as req.user
    } catch (err) {
        done(err, null);
    }
});

};