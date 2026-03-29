const { createClient } = require("redis");
const env = require("./env");

const redisConfig = {
  socket: {
    host: env.redisHost,
    port: env.redisPort
  }
};

if (env.redisPassword) {
  redisConfig.password = env.redisPassword;
}

const redisClient = createClient(redisConfig);

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

module.exports = redisClient;