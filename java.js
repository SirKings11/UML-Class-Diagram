// ============================================================
//  E-Commerce UML Class Implementations
// ============================================================

// ─────────────────────────────────────────────
//  CLASS: Product
// ─────────────────────────────────────────────
class Product {
  // Static property shared across all instances
  static catalogSize = 0;

  #price;
  #stock;

  constructor(productId, name, price, stock) {
    this.productId = productId;
    this.name      = name;
    this.#price    = price;
    this.#stock    = stock;
    Product.catalogSize++;
  }

  get price() {
    return this.#price;
  }

  set price(value) {
    if (typeof value !== 'number' || value < 0) {
      throw new Error('Price must be a non-negative number.');
    }
    this.#price = +value.toFixed(2);
  }

  get stock() {
    return this.#stock;
  }

  // Instance method: adjust stock level
  updateStock(qty) {
    if (this.#stock + qty < 0) {
      throw new Error(`Insufficient stock for "${this.name}"`);
    }
    this.#stock += qty;
    console.log(`  [Product] Stock for "${this.name}" updated → ${this.#stock} units`);
  }

  // Instance method: return discounted price
  applyDiscount(percent) {
    const discounted = +(this.#price * (1 - percent / 100)).toFixed(2);
    console.log(`  [Product] "${this.name}" discounted by ${percent}% → $${discounted}`);
    return discounted;
  }

  // Static method: look up a product by id from an array
  static findById(catalog, id) {
    const found = catalog.find(p => p.productId === id) || null;
    console.log(`  [Product.findById] id=${id} → ${found ? found.name : 'not found'}`);
    return found;
  }
}

// ─────────────────────────────────────────────
//  CLASS: PremiumProduct
// ─────────────────────────────────────────────
class PremiumProduct extends Product {
  #warrantyYears;

  constructor(productId, name, price, stock, warrantyYears) {
    super(productId, name, price, stock);
    this.#warrantyYears = warrantyYears;
  }

  get warrantyYears() {
    return this.#warrantyYears;
  }

  applyDiscount(percent) {
    const maxAllowed = 20;
    const effectivePercent = Math.min(percent, maxAllowed);
    const discounted = super.applyDiscount(effectivePercent);
    console.log(`  [PremiumProduct] "${this.name}" premium discount capped at ${maxAllowed}% → used ${effectivePercent}%`);
    return discounted;
  }

  offerExtendedWarranty() {
    console.log(`  [PremiumProduct] "${this.name}" includes ${this.#warrantyYears}-year warranty.`);
  }
}

// ─────────────────────────────────────────────
//  CLASS: Customer
// ─────────────────────────────────────────────
class Customer {
  // Static property: total registered customers
  static customerCount = 0;

  #cart = null;

  constructor(id, name, email, address) {
    this.id      = id;
    this.name    = name;
    this.email   = email;
    this.address = address;
    this.#cart   = null;
    Customer.customerCount++;
  }

  get cart() {
    return this.#cart;
  }

  assignCart(cart) {
    this.#cart = cart;
  }

  // Instance method: add item to customer's cart
  addToCart(product, qty) {
    if (!this.#cart) throw new Error(`${this.name} has no active cart. Create one first.`);
    this.#cart.addItem(product, qty);
    console.log(`  [Customer] ${this.name} added ${qty}× "${product.name}" to cart`);
  }

  // Instance method: convert cart to a new Order
  placeOrder() {
    if (!this.#cart || this.#cart.itemCount === 0) {
      throw new Error(`${this.name}'s cart is empty.`);
    }
    const order = Order.createEmpty(this);
    this.#cart.transferTo(order);
    console.log(`  [Customer] ${this.name} placed Order #${order.orderId}`);
    this.#cart.clear();
    return order;
  }

  // Static method: register (increment count + log)
  static register(name) {
    console.log(`  [Customer.register] New customer "${name}" registered. Total: ${Customer.customerCount + 1}`);
  }
}

// ─────────────────────────────────────────────
//  CLASS: Cart
// ─────────────────────────────────────────────
class Cart {
  // Static property: maximum items per cart
  static maxItems = 50;

  #items = [];

  constructor(cartId, customer) {
    this.cartId    = cartId;
    this.createdAt = new Date();
    this.#items    = [];
    this.owner     = customer;
  }

  get itemCount() { return this.#items.length; }

  get subtotal() {
    return +this.#items.reduce((sum, { product, qty }) => sum + product.price * qty, 0).toFixed(2);
  }

  // Instance method: add a product to the cart
  addItem(product, qty) {
    if (this.#items.length >= Cart.maxItems) {
      throw new Error('Cart is full (maxItems reached).');
    }
    const existing = this.#items.find(i => i.product.productId === product.productId);
    if (existing) {
      existing.qty += qty;
    } else {
      this.#items.push({ product, qty });
    }
    console.log(`  [Cart #${this.cartId}] Added ${qty}× "${product.name}" | subtotal: $${this.subtotal}`);
  }

  // Instance method: empty the cart
  clear() {
    this.#items = [];
    console.log(`  [Cart #${this.cartId}] Cleared`);
  }

  transferTo(order) {
    this.#items.forEach(({ product, qty }) => order.addItem(product, qty));
  }

  // Static factory method: create a cart and link it to a customer
  static createFor(customer) {
    const cart = new Cart(Date.now(), customer);
    customer.assignCart(cart);
    console.log(`  [Cart.createFor] Cart #${cart.cartId} created for ${customer.name}`);
    return cart;
  }
}

// ─────────────────────────────────────────────
//  CLASS: Order
// ─────────────────────────────────────────────
class Order {
  // Static property: auto-incrementing order number
  static nextOrderNumber = 1000;

  constructor(orderId, customer) {
    this.orderId     = orderId;
    this.orderDate   = new Date();
    this.status      = 'pending';
    this.totalAmount = 0;
    this.customer    = customer;
    this.items       = [];
  }

  // Instance method: add a product line to the order
  addItem(product, qty) {
    this.items.push({ product, qty });
    this.totalAmount = +( this.totalAmount + product.price * qty ).toFixed(2);
    console.log(`  [Order #${this.orderId}] Added ${qty}× "${product.name}" | total: $${this.totalAmount}`);
  }

  // Instance method: cancel the order
  cancel() {
    this.status = 'cancelled';
    console.log(`  [Order #${this.orderId}] Cancelled`);
  }

  // Static factory: create an empty order with auto-incremented id
  static createEmpty(customer) {
    const id = Order.nextOrderNumber++;
    const order = new Order(id, customer);
    console.log(`  [Order.createEmpty] Order #${id} created for ${customer.name}`);
    return order;
  }
}

// ─────────────────────────────────────────────
//  CLASS: Payment
// ─────────────────────────────────────────────
class Payment {
  // Static property: default currency
  static defaultCurrency = 'USD';

  constructor(paymentId, method, amount) {
    this.paymentId = paymentId;
    this.method    = method;
    this.amount    = amount;
    this.status    = 'pending';
  }

  // Instance method: authorise the payment
  authorize() {
    this.status = 'authorized';
    console.log(`  [Payment #${this.paymentId}] Authorized $${this.amount} ${Payment.defaultCurrency} via ${this.method}`);
    return true;
  }

  // Instance method: capture the payment
  capture() {
    if (this.status !== 'authorized') {
      throw new Error('Payment must be authorized before capture.');
    }
    this.status = 'captured';
    console.log(`  [Payment #${this.paymentId}] Captured`);
    return true;
  }

  // Static factory: create a payment for a given amount
  static create(amount) {
    const id = `PAY-${Math.floor(Math.random() * 90000 + 10000)}`;
    const p = new Payment(id, 'card', amount);
    console.log(`  [Payment.create] Payment ${id} created for $${amount} ${Payment.defaultCurrency}`);
    return p;
  }
}


// ============================================================
//  USAGE SECTION
// ============================================================
console.log('════════════════════════════════════════════════');
console.log('  E-COMMERCE SYSTEM — USAGE DEMO');
console.log('════════════════════════════════════════════════\n');

// ── 1. Register a customer ──────────────────────
console.log('▶ Step 1: Register customer');
Customer.register('Alice Okafor');
const alice = new Customer(1, 'Alice Okafor', 'alice@example.com', '12 Marina Rd, Lagos');
console.log(`  Customer count: ${Customer.customerCount}\n`);

// ── 2. Build a product catalog ──────────────────
console.log('▶ Step 2: Create products');
const laptop  = new Product(101, 'ProBook Laptop',   1200.00, 15);
const earbuds = new Product(102, 'Wireless Earbuds',   89.99, 40);
const sleeve  = new Product(103, 'Laptop Sleeve',      24.99, 100);
const premiumLaptop = new PremiumProduct(104, 'ProBook Ultra', 1800.00, 5, 3);
console.log(`  Catalog size: ${Product.catalogSize}`);

// Static findById
Product.findById([laptop, earbuds, sleeve, premiumLaptop], 102);

// Apply discount
laptop.applyDiscount(10);
premiumLaptop.applyDiscount(25);
premiumLaptop.offerExtendedWarranty();
console.log();

// ── 3. Create a cart and add items ─────────────
console.log('▶ Step 3: Create cart & add items');
Cart.createFor(alice);
alice.addToCart(laptop,  1);
alice.addToCart(earbuds, 2);
alice.addToCart(sleeve,  1);
  console.log(`  Cart subtotal: $${alice.cart.subtotal}`);
  console.log(`  Items in cart: ${alice.cart.itemCount}\n`);
const order = alice.placeOrder();
console.log(`  Order status : ${order.status}`);
console.log(`  Order total  : $${order.totalAmount}\n`);

// ── 5. Process payment ─────────────────────────
console.log('▶ Step 5: Process payment');
const payment = Payment.create(order.totalAmount);
payment.authorize();
payment.capture();
console.log(`  Payment status: ${payment.status}\n`);

// ── 6. Update stock after purchase ─────────────
console.log('▶ Step 6: Update product stock');
laptop.updateStock(-1);
earbuds.updateStock(-2);
sleeve.updateStock(-1);
console.log();

// ── 7. Cancel a second (demo) order ────────────
console.log('▶ Step 7: Cancel a demo order');
Cart.createFor(alice);
alice.addToCart(earbuds, 1);
const order2 = alice.placeOrder();
order2.cancel();
console.log(`  Order #${order2.orderId} status: ${order2.status}\n`);

// ── Static property summary ────────────────────
console.log('════════════════════════════════════════════════');
console.log('  STATIC PROPERTY SUMMARY');
console.log('════════════════════════════════════════════════');
console.log(`  Customer.customerCount  : ${Customer.customerCount}`);
console.log(`  Product.catalogSize     : ${Product.catalogSize}`);
console.log(`  Order.nextOrderNumber   : ${Order.nextOrderNumber} (next id)`);
console.log(`  Cart.maxItems           : ${Cart.maxItems}`);
console.log(`  Payment.defaultCurrency : ${Payment.defaultCurrency}`);
console.log('════════════════════════════════════════════════');