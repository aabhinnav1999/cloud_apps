const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    orderId: {
      type: String
    },
    type: {
      type: String,
      enum: ["ORDER_CREATED", "ORDER_CONFIRMED", "PAYMENT_SUCCESS", "PAYMENT_FAILED", "ORDER_CANCELLED", "GENERAL"],
      default: "GENERAL"
    },
    channel: {
      type: String,
      enum: ["EMAIL", "SMS", "APP"],
      default: "APP"
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "READ"],
      default: "PENDING"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Notification", notificationSchema);