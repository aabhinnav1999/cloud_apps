const express = require("express");

const {
  createNotification,
  getAllNotifications,
  getNotificationsByUser,
  markAsRead,
  deleteNotification
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/", createNotification);
router.get("/", getAllNotifications);
router.get("/user/:userId", getNotificationsByUser);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;