const http = require("http");
const app = require("./src/app");
const { Server } = require("socket.io");
const { connectToDatabase } = require("./shared/mongo");

const PORT = process.env.PORT || 8080;

// START SERVER FIRST (CRITICAL)
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
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
});
