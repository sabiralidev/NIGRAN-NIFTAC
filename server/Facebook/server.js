require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const accountRoutes = require("./routes/accounts");
const postRoutes = require("./routes/posts");
const alertRoutes = require("./routes/alerts");
const { initializeSocket } = require("./socket/socketManager");
const { startMonitoring } = require("./jobs/monitoringJob");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Connect to database
connectDB();

// CORS configuration - MUST come early
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  }),
);
// Middleware
app.use(express.json());

// Routes
app.use("/facebook/accounts", accountRoutes);
app.use("/facebook/posts", postRoutes);
app.use("/facebook/alerts", alertRoutes);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Facebook service running on port ${PORT}`);
  // Start the monitoring job
  startMonitoring();
});
