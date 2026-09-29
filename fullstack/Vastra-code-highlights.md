# Vastra Code Highlights

Open this file in VS Code while presenting. Each fenced block has JavaScript or YAML syntax highlighting.

## 1. Server Setup
File: `backend/server.js`

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5001;
```

## 2. Route Mounting
File: `backend/server.js`

```javascript
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
```

## 3. Product Request
File: `backend/routes/productRoutes.js`

```javascript
router.get('/', async (req, res) => {
  const products = await Product.find({})
    .sort({ createdAt: -1 });
  res.status(200).json({ products });
});
```

## 4. Password Hashing and Login
File: `backend/routes/userRoutes.js`

```javascript
password: email
  ? await bcrypt.hash(password, 10)
  : '',

await bcrypt.compare(password, user.password);

const token = generateToken({
  id: user._id,
  email: user.email,
  mobile: user.mobile,
});
```

## 5. Authentication Middleware
File: `backend/middleware/authMiddleware.js`

```javascript
const decoded = verifyToken(token);
req.user = decoded;
next();
```

Request header:

```http
Authorization: Bearer <token>
```

## 6. Admin Authorization
File: `backend/middleware/adminMiddleware.js`

```javascript
const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!isAdminUserId(req.user?.id)) {
      return res.status(403).json({
        message: 'Admin access is required',
      });
    }
    next();
  });
};
```

```javascript
const isAdminUserId = (userId) => {
  const adminUserIds = String(process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(userId) &&
    adminUserIds.includes(String(userId).toLowerCase());
};
```

## 7. Server-Side Pricing
File: `backend/routes/orderRoutes.js`

```javascript
const products = await Product.find({
  _id: { $in: requestedItems.map((item) => item.productId) },
});

const calculatedTotal = normalizedItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);
```

## 8. Stock Reservation
File: `backend/routes/orderRoutes.js`

```javascript
const reservedProduct = await Product.findOneAndUpdate(
  {
    _id: item.productId,
    inStock: true,
    stock: { $gte: item.quantity },
  },
  {
    $inc: { stock: -item.quantity },
  },
  {
    returnDocument: 'after',
  }
);
```

## 9. Razorpay Verification
File: `backend/routes/orderRoutes.js`

```javascript
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest('hex');
```

## 10. Customer Orders
File: `backend/routes/orderRoutes.js`

```javascript
const orders = await Order.find({
  userId: req.user.id,
}).sort({ createdAt: -1 });
```

## 11. Docker Services
File: `fullstack/docker_compose.yml`

```yaml
services:
  mongo:
  backend:
  frontend:

volumes:
  - mongo_data:/data/db
```

## 12. Environment-Based Secrets
File: `fullstack/docker_compose.yml`

```yaml
JWT_SECRET: ${JWT_SECRET:?Set JWT_SECRET in fullstack/.env}
RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID:-}
RAZORPAY_KEY_SECRET: ${RAZORPAY_KEY_SECRET:-}
ADMIN_USER_IDS: ${ADMIN_USER_IDS:-}
```

## Presentation Flow

1. Open this file in VS Code.
2. Use the headings to find each talking point.
3. Click a code block and use `Cmd+Shift+L` when you want matching words highlighted.
4. Open the referenced source file when explaining the full implementation.
