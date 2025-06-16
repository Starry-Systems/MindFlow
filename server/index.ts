import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// Example API route (optional)
app.get("/", (req, res) => {
  res.send("MindFlow backend is running!");
});

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// Socket.IO collaboration logic
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("mindmap-change", (data) => {
    // Broadcast to all other clients except sender
    socket.broadcast.emit("mindmap-change", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});