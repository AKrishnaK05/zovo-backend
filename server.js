const http = require('http');
const app = require('./src/app');
const { Server } = require('socket.io');
const { connectToDatabase } = require('./shared/mongo');

const PORT = process.env.PORT || 4000;

// Connect to DB immediately
connectToDatabase().then(() => {
  console.log('✅ MongoDB Connected (Server start)');
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
});

const server = http.createServer(app);

// 🔥 Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  },
  transports: ["websocket", "polling"] // Allow polling fallback just in case
});

// Make io available everywhere via req.app.get('io')
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // User joins their own room (userId)
  socket.on("join", (userId) => {
    if (userId) {
      console.log(`👤 User ${userId} joining room user-${userId}`);
      socket.join(`user-${userId}`); // Consistent naming
      // Also join worker/category rooms if valid? 
      // For simplicity we trust the frontend/backend logic to emit to correct rooms.
      // Frontend adapter currently emits 'join' with userId.
    }
  });

  // Support custom room joins if needed (e.g. worker specific)
  socket.on("joinRoom", (room) => {
    console.log(`🚪 Socket ${socket.id} joining room ${room}`);
    socket.join(room);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`👉 Socket.IO enabled`);
});
