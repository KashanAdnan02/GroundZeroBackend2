const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app); // Use HTTP server

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// Attach io to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});
console.log(process.env.RAZORPAY_KEY_ID)
console.log(process.env.RAZORPAY_KEY_SECRET)
// Routes
app.use("/api", require("./routes"));

app.get("/", (req, res) => {
  res.redirect("/api");
});

// Socket logic
io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Error handling
app.use((err, req, res, next) => {
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// 🚀 Important: use server.listen (not app.listen)
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO running on http://localhost:${PORT}`);
});

module.exports = { app, io };
