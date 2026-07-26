
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      tls: true,
      family: 4,
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error("Check MONGO_URI, Atlas Network Access IP whitelist, database user password, and TLS/network firewall settings.");
    process.exit(1);
  }
};

module.exports = connectDB;
