import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

const connectDB = async (retryCount = 0) => {
  const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartops';
  console.log(`🔌 Attempting to connect to MongoDB... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);

  try {
    const conn = await mongoose.connect(dbUri);
    console.log(`🟢 MongoDB Connected Successfully: ${conn.connection.host} 🎉`);
  } catch (error) {
    console.error(`🔴 MongoDB Connection Error: ${error.message}`);
    
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`🔄 Connection failed. Retrying in ${RETRY_INTERVAL_MS / 1000} seconds...`);
      setTimeout(() => {
        connectDB(retryCount + 1);
      }, RETRY_INTERVAL_MS);
    } else {
      console.error(`🚨 Max retries (${MAX_RETRIES}) reached. Failed to establish connection to database.`);
      
      // Do not crash the process in development to allow fallback mocks,
      // but exit in production.
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
};

export default connectDB;
