const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const startBookingCleanupJob = require("./utils/fiveMinutesAgo");
const { default: mongoose } = require("mongoose");
const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
startBookingCleanupJob();

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api", require("./routes"));

app.get("/", (req, res) => {
  res.redirect("/api");
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
});

app.use((err, req, res, next) => {
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

mongoose.connect(process.env.MONGODB_URI).then((res) => {
  console.log("Mongodb Connected!");
  server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
}).catch((err) =>{
  console.log("Mongodb error: ", err);
  
})
