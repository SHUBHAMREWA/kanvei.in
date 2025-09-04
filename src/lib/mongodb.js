import mongoose from "mongoose"

const { MONGODB_URI } = process.env

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set. Please configure it in your environment.")
}

let cached = global.mongoose
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((conn) => {
        const dbName = conn.connection?.name || "(unknown)"
        if (dbName !== "kanveiecommerce") {
          console.warn(
            `Connected to MongoDB database '${dbName}'. Expected 'kanveiecommerce'. Ensure your MONGODB_URI points to the correct DB.`,
          )
        }
        return conn
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
