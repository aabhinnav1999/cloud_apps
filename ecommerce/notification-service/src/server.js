const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.json({
    service: "Notification Service",
    status: "Running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "notification-service"
  });
});

app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 8086;

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});