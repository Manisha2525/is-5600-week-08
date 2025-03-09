const cuid = require('cuid')

const db = require('./db')

const Order = db.model('Order', {
  _id: { type: String, default: cuid }, // Unique identifier for each order
  buyerEmail: { type: String, required: true }, // Email of the buyer (required field)
  products: [{
    type: String,
    ref: 'Product', // References Product model, allowing population
    index: true,
    required: true
  }],
  status: {
    type: String,
    index: true,
    default: 'CREATED',
    enum: ['CREATED', 'PENDING', 'COMPLETED'] // Order status with allowed values
  }
})

/**
 * List orders with optional filters for product and status
 * @param {Object} options - Query options (offset, limit, productId, status)
 * @returns {Promise<Array>} - List of orders matching the query
 */
async function list(options = {}) {
  const { offset = 0, limit = 25, productId, status } = options;

  const productQuery = productId ? { products: productId } : {};
  const statusQuery = status ? { status } : {};

  const query = { ...productQuery, ...statusQuery };

  const orders = await Order.find(query)
    .sort({ _id: 1 }) // Sorting by _id in ascending order
    .skip(offset) // Skipping specified number of records (pagination)
    .limit(limit); // Limiting results to specified amount

  return orders;
}

/**
 * Get an order by its ID
 * @param {String} _id - Order ID
 * @returns {Promise<Object>} - The order object, populated with product details
 */
async function get(_id) {
  // Using populate to retrieve full product details instead of just IDs
  const order = await Order.findById(_id)
    .populate('products')
    .exec();

  return order;
}

/**
 * Edit an existing order
 * @param {String} _id - Order ID
 * @param {Object} change - Fields to update
 * @returns {Promise<Object>} - Updated order object
 */
async function edit(_id, change) {
  const order = await get(_id);

  // Apply changes to the order
  Object.keys(change).forEach((key) => {
    order[key] = change[key];
  });

  await order.save(); // Save updated order

  return order;
}

/**
 * Create a new order
 * @param {Object} fields - Order fields (buyerEmail, products, etc.)
 * @returns {Promise<Object>} - Newly created order object, populated with product details
 */
async function create(fields) {
  const order = await new Order(fields).save();
  await order.populate('products'); // Populate product details after saving
  return order;
}

module.exports = {
  create,
  get,
  list,
  edit
};
