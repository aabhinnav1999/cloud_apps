const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { errorResponse } = require("../utils/response");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Authorization token is missing", 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.jwtSecret);

    req.user = {
      email: decoded.sub
    };

    next();
  } catch (error) {
    return errorResponse(res, "Invalid or expired token", 401);
  }
};

module.exports = authenticate;