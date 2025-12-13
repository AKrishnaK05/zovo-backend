const http = require("http");
const app = require("./src/app");
const { Server } = require("socket.io");
const { connectToDatabase } = require("./shared/mongo");

const PORT = process.env.PORT || 4000;

/**
 * Connect to MongoDB
 * Azure App Service will restart the app if this fails
 */
(async () => {
  try {
    await connectToDatabase();
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err);
    process.exit(1); // Fail fast so Azure restarts
  }
})();

const server = http.createServer(app);

/**
 * Socket.IO configuration
 */
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : [
          "http://localhost:5173",
          "http://localhost:5174"
        ],
    credentials: true
  },
  transports: ["websocket", "polling"] // websocket preferred, polling fallback
});

// Make io accessible inside routes/controllers
app.set("io", io);

/**
 * Socket events
 */
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Join user-specific room
  socket.on("join", (userId) => {
    if (!userId) return;
    const room = `user-${userId}`;
    socket.join(room);
    console.log(`👤 User joined room: ${room}`);
  });

  // Generic room join (workers, categories, etc.)
  socket.on("joinRoom", (room) => {
    if (!room) return;
    socket.join(room);
    console.log(`🚪 Socket ${socket.id} joined room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

/**
 * Start server
 * IMPORTANT: must listen on process.env.PORT for Azure
 */
server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log("⚡ Socket.IO enabled");
});
