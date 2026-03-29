const express = require("express");
const redisClient = require("./config/redis");
const env = require("./config/env");
const cartRoutes = require("./routes/cartRoutes");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  return res.status(200).json({
    service: "cart-service",
    status: "up",
    port: env.port
  });
});

app.use("/api/cart", cartRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

const startServer = async () => {
  try {
    await redisClient.connect();

    app.listen(env.port, () => {
      console.log(`Cart Service running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start Cart Service:", error.message);
    process.exit(1);
  }
};

startServer();