const http = require("http");
const app = require("./src/app");
const { Server } = require("socket.io");
const { connectToDatabase } = require("./shared/mongo");
const { loadModel } = require("./src/services/predictionService");

// START SERVER FIRST (CRITICAL)
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);

  // WARMUP: Load ML Model in background immediately
  console.log("🔥 Warming up ML Model...");
  loadModel().catch(err => console.error("⚠️ Model Warmup Failed:", err.message));
});

// CONNECT DB IN BACKGROUND
connectToDatabase();

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: [
      "https://red-water-0e427d600.3.azurestaticapps.net",
      "http://localhost:5173"
    ],
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Allow client to join their specific rooms
  socket.on('join', (userId) => {
    if (userId) {
      const room = `worker-${userId}`;
      socket.join(room);
      console.log(`✅ Socket ${socket.id} joined room: ${room}`);
    }
  });

  socket.on('joinJob', (jobId) => {
    if (jobId) {
      const room = `job-${jobId}`;
      socket.join(room);
      console.log(`✅ Socket ${socket.id} joined Job Room: ${room}`);
    }
  });
});
