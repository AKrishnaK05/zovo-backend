const http = require("http");
const app = require("./src/app");
const { Server } = require("socket.io");
const { connectToDatabase } = require("./shared/mongo");

const PORT = process.env.PORT || 8080;

// 1️⃣ START SERVER IMMEDIATELY
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

// 2️⃣ CONNECT TO DB IN BACKGROUND (NON-BLOCKING)
connectToDatabase()
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    // DO NOT process.exit() on Azure
  });

// 3️⃣ SOCKET.IO
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
});
