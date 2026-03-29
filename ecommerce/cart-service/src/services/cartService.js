const redisClient = require("../config/redis");

const getCartKey = (userEmail) => `cart:${userEmail}`;

const getCart = async (userEmail) => {
  const cartKey = getCartKey(userEmail);
  const cartJson = await redisClient.get(cartKey);

  if (!cartJson) {
    return {
      userEmail,
      items: [],
      totalItems: 0,
      totalQuantity: 0,
      totalAmount: 0
    };
  }

  return JSON.parse(cartJson);
};

const saveCart = async (userEmail, cart) => {
  const cartKey = getCartKey(userEmail);
  await redisClient.set(cartKey, JSON.stringify(cart));
};

const calculateCartSummary = (cart) => {
  let totalQuantity = 0;
  let totalAmount = 0;

  for (const item of cart.items) {
    totalQuantity += item.quantity;
    totalAmount += Number(item.price) * item.quantity;
  }

  cart.totalItems = cart.items.length;
  cart.totalQuantity = totalQuantity;
  cart.totalAmount = Number(totalAmount.toFixed(2));

  return cart;
};

const addItemToCart = async (userEmail, payload) => {
  const cart = await getCart(userEmail);

  const existingItem = cart.items.find(
    (item) => String(item.productId) === String(payload.productId)
  );

  if (existingItem) {
    existingItem.quantity += payload.quantity;
  } else {
    cart.items.push({
      productId: payload.productId,
      name: payload.name,
      brand: payload.brand,
      price: Number(payload.price),
      imageUrl: payload.imageUrl,
      quantity: payload.quantity
    });
  }

  const updatedCart = calculateCartSummary(cart);
  await saveCart(userEmail, updatedCart);

  return updatedCart;
};

const updateCartItemQuantity = async (userEmail, productId, quantity) => {
  const cart = await getCart(userEmail);

  const item = cart.items.find(
    (cartItem) => String(cartItem.productId) === String(productId)
  );

  if (!item) {
    throw new Error("Cart item not found");
  }

  item.quantity = quantity;

  const updatedCart = calculateCartSummary(cart);
  await saveCart(userEmail, updatedCart);

  return updatedCart;
};

const removeItemFromCart = async (userEmail, productId) => {
  const cart = await getCart(userEmail);

  const initialLength = cart.items.length;

  cart.items = cart.items.filter(
    (item) => String(item.productId) !== String(productId)
  );

  if (cart.items.length === initialLength) {
    throw new Error("Cart item not found");
  }

  const updatedCart = calculateCartSummary(cart);
  await saveCart(userEmail, updatedCart);

  return updatedCart;
};

const clearCart = async (userEmail) => {
  const cartKey = getCartKey(userEmail);
  await redisClient.del(cartKey);
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart
};