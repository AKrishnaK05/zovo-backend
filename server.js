const http = require("http");
const app = require("./src/app");
const { Server } = require("socket.io");
const { connectToDatabase } = require("./shared/mongo");

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await connectToDatabase();
    console.log("✅ MongoDB Connected");

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    app.set("io", io);

    io.on("connection", (socket) => {
      console.log("🔌 Socket connected:", socket.id);

      socket.on("join", (userId) => {
        if (!userId) return;
        socket.join(`user-${userId}`);
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected:", socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

startServer();
