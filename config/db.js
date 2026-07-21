const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    console.log('Using cached database connection');
    return cachedConnection;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedConnection = conn;
    console.log('Database connected successfully: ' + conn.connection.host);
    return conn;
  } catch (error) {
    console.error('Database connection failed: ' + error.message);
  }
};

module.exports = connectDB;