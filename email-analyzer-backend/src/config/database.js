const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Get the MongoDB connection string from environment variables
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            console.error('FATAL ERROR: MONGO_URI is not defined in the ENV file');
            process.exit(1); // Exit the application if DB connection string is missing
        }

        // Attempt to connect to the database
        const conn = await mongoose.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit the process if connection fails
    }
};

module.exports = connectDB;
