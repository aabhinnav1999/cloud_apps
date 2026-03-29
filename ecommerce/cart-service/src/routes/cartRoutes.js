const express = require("express");
const authenticate = require("../middlewares/authMiddleware");
const {
  getMyCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearMyCart
} = require("../controllers/cartController");

const router = express.Router();

router.use(authenticate);

router.get("", getMyCart);
router.post("/items", addCartItem);
router.put("/items/:productId", updateCartItem);
router.delete("/items/:productId", removeCartItem);
router.delete("", clearMyCart);

module.exports = router;