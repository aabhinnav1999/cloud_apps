require("dotenv").config();

module.exports = {
  port: process.env.PORT || 8083,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret:
    process.env.JWT_SECRET ||
    "mySuperSecretKeyForJwtTokenGeneration1234567890",
  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: Number(process.env.REDIS_PORT || 6379),
  redisPassword: process.env.REDIS_PASSWORD || ""
};