const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdminUserId } = require('../utils/admin');
const adminMiddleware = require('../middleware/adminMiddleware');
const Product = require('../models/Product');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const MOBILE_PATTERN = /^\+91\d{10}$/;

router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user: { ...user.toObject(), isAdmin: isAdminUserId(user._id) } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'email',
      'mobile',
      'gender',
      'dateOfBirth',
      'location',
      'alternateMobile',
      'hintName',
    ];
    const updates = {};
    const unsetFields = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        updates[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    });

    if (!updates.name || (!updates.email && !updates.mobile)) {
      return res.status(400).json({ message: 'Name and email or mobile are required' });
    }

    ['email', 'mobile'].forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(updates, field)) return;
      if (updates[field]) {
        if (field === 'email') updates[field] = updates[field].toLowerCase();
      } else {
        delete updates[field];
        unsetFields[field] = 1;
      }
    });

    const profileUpdate = Object.keys(unsetFields).length
      ? { $set: updates, $unset: unsetFields }
      : updates;
    const user = await User.findByIdAndUpdate(req.user.id, profileUpdate, {
      returnDocument: 'after',
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: { ...user.toObject(), isAdmin: isAdminUserId(user._id) },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A user with these details already exists' });
    }
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

router.get('/me/preferences', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('cartItems wishlistItems');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const products = await Product.find({
      _id: { $in: [...user.cartItems, ...user.wishlistItems].map((item) => item.id) },
    }).select('stock inStock');
    const productsById = new Map(products.map((product) => [String(product._id), product]));
    const withInventory = (item) => {
      const product = productsById.get(String(item.id));
      return {
        ...item.toObject(),
        stock: product?.stock ?? 0,
        inStock: product?.inStock ?? false,
      };
    };
    res.status(200).json({
      cartItems: user.cartItems.map(withInventory),
      wishlistItems: user.wishlistItems.map(withInventory),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch saved shopping data', error: error.message });
  }
});

router.put('/me/preferences', authMiddleware, async (req, res) => {
  try {
    const cartItems = Array.isArray(req.body?.cartItems) ? req.body.cartItems : [];
    const wishlistItems = Array.isArray(req.body?.wishlistItems) ? req.body.wishlistItems : [];
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { cartItems, wishlistItems },
      { returnDocument: 'after', runValidators: true }
    ).select('cartItems wishlistItems');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'Shopping data saved successfully',
      cartItems: user.cartItems,
      wishlistItems: user.wishlistItems,
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to save shopping data', error: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, password } = req.body || {};
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const mobile = typeof req.body?.mobile === 'string' ? req.body.mobile.trim() : '';

    if (!name || (!email && !mobile)) {
      return res.status(400).json({ message: 'Name and email or mobile are required' });
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address with an extension' });
    }
    if (mobile && !MOBILE_PATTERN.test(mobile)) {
      return res.status(400).json({ message: 'Mobile number must include +91 and 10 digits' });
    }

    if (email && !password) {
      return res.status(400).json({ message: 'Password is required for email sign-up' });
    }

    if (email) {
      const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
      if (existingEmailUser) {
        return res.status(409).json({ message: 'An account already exists with this email' });
      }
    }

    if (mobile) {
      const existingMobileUser = await User.findOne({ mobile: { $in: [mobile, mobile.slice(3)] } });
      if (existingMobileUser) {
        return res.status(409).json({ message: 'An account already exists with this mobile number' });
      }
    }

    const userData = {
      name,
      email: email || undefined,
      mobile: mobile || undefined,
      // DEMO: Hash the password before storing it
      password: email ? await bcrypt.hash(password, 10) : '',
    };

    const user = await User.create(userData);
    const token = generateToken({ id: user._id, email: user.email, mobile: user.mobile });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isAdmin: isAdminUserId(user._id),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A user with these details already exists' });
    }
    res.status(500).json({ message: 'Failed to register user', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body || {};
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const mobile = typeof req.body?.mobile === 'string' ? req.body.mobile.trim() : '';

    if ((!email && !mobile) || (email && !password)) {
      return res.status(400).json({ message: 'Email or mobile is required; email login also requires a password' });
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address with an extension' });
    }
    if (mobile && !MOBILE_PATTERN.test(mobile)) {
      return res.status(400).json({ message: 'Mobile number must include +91 and 10 digits' });
    }

    const query = email ? { email } : { mobile: { $in: [mobile, mobile.slice(3)] } };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ message: 'No account found for this login' });
    }

    // DEMO: Compare the submitted password with the stored hash
    if (user.email && !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    if (!user.email && user.password && user.password !== password) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // DEMO: Create a JWT after successful login
    const token = generateToken({ id: user._id, email: user.email, mobile: user.mobile });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        location: user.location,
        alternateMobile: user.alternateMobile,
        hintName: user.hintName,
        isAdmin: isAdminUserId(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

module.exports = router;
