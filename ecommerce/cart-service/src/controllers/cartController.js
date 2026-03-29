const {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart
} = require("../services/cartService");
const { successResponse, errorResponse } = require("../utils/response");

const validateAddItemPayload = (body) => {
  const { productId, name, brand, price, imageUrl, quantity } = body;

  if (
    productId === undefined ||
    !name ||
    !brand ||
    price === undefined ||
    !imageUrl ||
    quantity === undefined
  ) {
    return "productId, name, brand, price, imageUrl and quantity are required";
  }

  if (Number(price) <= 0) {
    return "Price must be greater than 0";
  }

  if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
    return "Quantity must be a positive integer";
  }

  return null;
};

const validateQuantityPayload = (body) => {
  const { quantity } = body;

  if (quantity === undefined) {
    return "Quantity is required";
  }

  if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
    return "Quantity must be a positive integer";
  }

  return null;
};

const getMyCart = async (req, res) => {
  try {
    const cart = await getCart(req.user.email);
    return successResponse(res, "Cart fetched successfully", cart);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const addCartItem = async (req, res) => {
  try {
    const validationError = validateAddItemPayload(req.body);
    if (validationError) {
      return errorResponse(res, validationError, 400);
    }

    const payload = {
      productId: req.body.productId,
      name: req.body.name,
      brand: req.body.brand,
      price: Number(req.body.price),
      imageUrl: req.body.imageUrl,
      quantity: Number(req.body.quantity)
    };

    const cart = await addItemToCart(req.user.email, payload);
    return successResponse(res, "Item added to cart successfully", cart, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const updateCartItem = async (req, res) => {
  try {
    const validationError = validateQuantityPayload(req.body);
    if (validationError) {
      return errorResponse(res, validationError, 400);
    }

    const cart = await updateCartItemQuantity(
      req.user.email,
      req.params.productId,
      Number(req.body.quantity)
    );

    return successResponse(res, "Cart item updated successfully", cart);
  } catch (error) {
    if (error.message === "Cart item not found") {
      return errorResponse(res, error.message, 404);
    }
    return errorResponse(res, error.message);
  }
};

const removeCartItem = async (req, res) => {
  try {
    const cart = await removeItemFromCart(req.user.email, req.params.productId);
    return successResponse(res, "Cart item removed successfully", cart);
  } catch (error) {
    if (error.message === "Cart item not found") {
      return errorResponse(res, error.message, 404);
    }
    return errorResponse(res, error.message);
  }
};

const clearMyCart = async (req, res) => {
  try {
    await clearCart(req.user.email);
    return successResponse(res, "Cart cleared successfully");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  getMyCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearMyCart
};