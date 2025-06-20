const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// require for login form------
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


require('dotenv').config();  
const jwtSecretKey = process.env.JWT_SECRET_KEY;
// require for login form------

// Initialize Express
const app = express();

// Middleware
app.use(bodyParser.json());

// app.use(cors());


app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

const allowedOrigins = [
  'http://localhost:5500', 
  'https://stupendous-stardust-44dcf9.netlify.app/'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// MongoDB Connection
const mongoURI = process.env.MONGODB_URL;
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define a Schema and Model (Example: Food Items)
const itemSchema = new mongoose.Schema({
    itemID: String,
    itemPic: String,
    itemDescription: {
      item_name: String,
      item_store: String,
      item_price: Number,
      veg: Boolean,
    },
    rating: {
        total_rating: Number,
        avg_rating: Number
    }
});

const Item = mongoose.model('Item', itemSchema, 'items');



// Fetch all items
app.get('/api/menu', verifyToken, async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (err) {
        console.error('Error fetching menu : ' ,err);
        res.status(500).send('Server Error');
    }
});

// _________________________________________________fetch total items end here

// Define Schema for Background Images
const PicSchema = new mongoose.Schema({
    pic_name: { type: String, required: true },
    cover_pic: { type: String, required: true }
});

// Create Model
const BackPic = mongoose.model('BackPic', PicSchema);

// API Route to Fetch Background Images
app.get('/api/backPIC', async (req, res) => {
    try {
        const coverImages = await BackPic.find({}, 'pic_name cover_pic'); // Fetch only required fields
        res.json(coverImages);
    } catch (err) {
        console.error("Error fetching background images:", err);
        res.status(500).json({ message: 'Error fetching background images' });
    }
});


// login--------------------------
// Define the User Schema for Login and Sign-Up

  const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },  // Custom userId
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    name: { type: String, default: '' },
    phone: { type: String },
    profilePicture: { type: String, default: '' },
    role: { type: String, enum: ['user','staff','admin'], default: 'user' },

    registered_date: { 
      type: String, 
      required: true, 
      default: () => {
        return new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }
    }
  });
  
  // User model (can be used for both sign-up and login)
  const User = mongoose.model('User', userSchema);
  
  // Sign-Up Route
  app.post('/api/signup', async (req, res) => {
    const {userId , email, password } = req.body;
  
    // Check if email or userId already exists
    const existingUser = await User.findOne({ $or: [{ email }, { userId }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User ID or Email already exists' });
    }
  
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Create a new user instance
    const newUser = new User({
      userId: userId,
      email: email,
      password: hashedPassword
    });
  
    // Save the new user to the database
    try {
      await newUser.save();
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Error creating user. Please try again later.' });
    }
  });






// ___________________________________________________new sign up with verification code


// require for signup form------
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth:{
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const verificationCodes = new Map(); // Use Redis in production

// Send verification code
app.post('/api/send-verification-code', async (req, res) => {
  const { userId, email } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { userId }] });
  if (existingUser) return res.status(400).json({ message: 'Email or User ID already exists' });

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const expiresAt = Date.now() + 60 * 1000; // 1 minute

  verificationCodes.set(email, { code, expiresAt });

  // Use nodemailer to send email
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Verification Code : ByteGo',
    text: `Your verification code is: ${code}`
  });

  res.json({ message: `Verification code sent to ${email}` });
});

// Verify code and create user
app.post('/api/verify-code', async (req, res) => {
  const { userId, email, password, code } = req.body;
  const entry = verificationCodes.get(email);

  if (!entry) return res.status(400).json({ message: 'No code sent or code expired' });

  if (Date.now() > entry.expiresAt) {
    verificationCodes.delete(email);
    return res.status(400).json({ message: 'Verification code expired' });
  }

  if (entry.code !== code) return res.status(400).json({ message: 'Invalid code' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ userId, email, password: hashedPassword });

  try {
    await newUser.save();
    verificationCodes.delete(email);
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating user' });
  }
});


// ___________________________________________________new sign up with verification code








  
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }
  
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid email or password' });
  
    const accessToken = jwt.sign({ id: user._id }, jwtSecretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id }, 'refreshSecretKey', { expiresIn: '7d' });
  
    // Save refresh token somewhere secure (e.g., database or HTTP-only cookie)
    // For this example, let's assume it's stored in a variable for simplicity
    user.refreshToken = refreshToken;
    await user.save();
  
    res.json({
      accessToken,
      refreshToken,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        registered_date: user.registered_date,
      }
    });
  });
  

// signup-------------------------




app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized access: No user ID.' });
    }

    const user = await User.findById(req.userId).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});





// user cart---------------------------


// Define the Cart Item Schema
const cartItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cart: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
      quantity: { type: Number, required: true, default: 1 },
    }
  ]
});

const UserCart = mongoose.model('UserCart', cartItemSchema);

// Route to add item to cart
app.post('/api/cart/add', async (req, res) => {
  const { itemId, quantity } = req.body;
  const token = req.headers['authorization']?.split(' ')[1];  // Get token from Authorization header

  if (!token) {
    return res.status(403).json({ message: 'Authorization token is required.' });
  }

  try {
    // Decode the token
    const decoded = jwt.verify(token, jwtSecretKey);
    const userId = decoded.id;

    // Check if the user already has a cart
    let cart = await UserCart.findOne({ userId });

    if (!cart) {
      // No cart exists for the user, create a new one with the current item
      cart = new UserCart({
        userId,
        cart: [{ itemId, quantity }],
      });
    } else {
      // Cart exists, add or update the item
      const existingItemIndex = cart.cart.findIndex(item => item.itemId.toString() === itemId);
      if (existingItemIndex === -1) {
        // If the item is not in the cart, add it
        cart.cart.push({ itemId, quantity });
      } else {
        // If the item already exists, update the quantity
        cart.cart[existingItemIndex].quantity += quantity;
      }
    }

    // Save the cart
    await cart.save();
    res.status(200).json({ message: 'Item added to cart' });

  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Error adding item to cart' });
  }
});



app.post('/api/cart/update', verifyToken, async (req, res) => {
  const { itemId, quantity } = req.body;

  if (quantity === 0) {
    // Remove the item from the cart
    await UserCart.updateOne(
      { userId: req.userId },
      { $pull: { cart: { itemId: itemId } } }  // Remove item with itemId
    );
    return res.json({ message: 'Item removed from cart' });
  }

  // Update the quantity of the item in the cart
  const cart = await UserCart.findOne({ userId: req.userId });
  const itemIndex = cart.cart.findIndex(item => item.itemId.toString() === itemId);
  if (itemIndex !== -1) {
    cart.cart[itemIndex].quantity = quantity;
    await cart.save();
    return res.json({ message: 'Item quantity updated' });
  } else {
    return res.status(404).json({ message: 'Item not found in cart' });
  }
});


app.post('/api/cart/remove', verifyToken, async (req, res) => {
  const { itemId } = req.body;

  const cart = await UserCart.findOne({ userId: req.userId });
  const itemIndex = cart.cart.findIndex(item => item.itemId.toString() === itemId);

  if (itemIndex !== -1) {
    cart.cart.splice(itemIndex, 1);  // Remove item from the cart
    await cart.save();
    return res.json({ message: 'Item removed from cart' });
  } else {
    return res.status(404).json({ message: 'Item not found in cart' });
  }
});


// ------------------------------------------------------------check authToken Authirization

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];  // Get token from Authorization header

  if (!token) {
    return res.status(403).json({ message: 'Authorization token is required.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecretKey);  // Verify the token using secret key
    req.userId = decoded.id;  // Attach userId to request object
    next();  // Proceed to the next middleware or route handler
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired, please log in again.' }); // Handle expired token
    }
    return res.status(401).json({ message: 'Token is not valid.' });  // Return 401 if token is invalid
  }
}


//  fetch data from cart ----------------------------------------------------


// Route to get cart items for a user (protected with JWT)
app.get('/api/cart', verifyToken, async (req, res) => {
  try {
    const cart = await UserCart.findOne({ userId: req.userId }).populate('cart.itemId');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found', cart: [] });
    }
    res.json(cart.cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart', cart: [] });
  }
});

app.get('/api/some-protected-route', verifyToken, (req, res) => {
  res.json({ success: true });
});


app.post('/api/refreshToken', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(403).json({ message: 'Refresh token is required.' });

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, 'refreshSecretKey');
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token.' });
    }

    // Generate a new access token
    const newAccessToken = jwt.sign({ id: user._id }, jwtSecretKey, { expiresIn: '1h' });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(403).json({ message: 'Invalid refresh token.' });
  }
});








const Razorpay = require('razorpay');
// const router = express.Router();
const crypto = require('crypto');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})
const QRCode = require('qrcode');



const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentId: String,
  orderId: String, // custom 6-digit hex order ID
  razorpayOrderId: String, // Razorpay’s original order ID
  confirmationCode: String,
  qrCodeUrl: String,
  amount: Number,
  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
      quantity: Number,
    },
  ],
  status: {
    type: String,
    enum: ['pending', 'received', 'cancelled'],
    default: 'pending',
  },
  receivedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});



const Order = mongoose.model('Order',orderSchema);

app.post('/api/razorpay/create-order', verifyToken, async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Amount is required' });
  }

  const options = {
    amount: amount * 100, // Razorpay amount is in paise
    currency: 'INR',
    receipt: `receipt_order_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Error creating Razorpay order' });
  }
});



// Counter schema for hex order ID
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 1 },
});

const Counter = mongoose.model('Counter', counterSchema);

// 👉 Function to generate next hex order ID (000001 to FFFFFF)
async function getNextHexOrderId() {
  const counter = await Counter.findOneAndUpdate(
    { name: 'order_hex_id' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const hex = counter.seq.toString(16).toUpperCase().padStart(6, '0'); // '000001' to 'FFFFFF'
  return hex;
}


app.post('/api/razorpay/verify-payment', verifyToken, async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;

  // Step 1: Verify signature
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid signature. Payment verification failed.' });
  }

  try {

    // Step 2: Fetch cart items
    const userCart = await UserCart.findOne({ userId: req.userId });

    if (!userCart || userCart.cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty or not found' });
    }


    // ✅ Generate custom order ID
    const customOrderId = await getNextHexOrderId();
    
    // Generate confirmation code
    const confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
    // const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const qrData = {
      orderId: customOrderId,  // 👈 Use your short order ID
      confirmationCode
    };


    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));

    
    // ✅ Save order
    const newOrder = new Order({
      userId: req.userId,
      paymentId: razorpay_payment_id,
      orderId: customOrderId, // 👈 Custom short order ID
      razorpayOrderId: razorpay_order_id, // 👈 Store Razorpay's order ID separately
      amount,
      confirmationCode,
      qrCodeUrl,
      items: userCart.cart,
    });

    await newOrder.save();

    // Step 4: Clear user's cart
    await UserCart.updateOne({ userId: req.userId }, { $set: { cart: [] } });

    res.status(200).json({ 
      message: 'Payment verified and order placed successfully!',
      order: {
        orderId: customOrderId,
        confirmationCode,
        qrCodeUrl
      }
    });

  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



// staff pages are starts here_____________________________________


app.get('/api/orders/staff', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'userId') // populate only `userId` field from User model
      .lean(); // convert to plain JS objects

    const formatted = orders.map(order => ({
      ...order,
      userId: order.userId?.userId || 'unknown'
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching orders for staff:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

app.post('/api/orders/confirm', verifyToken, async (req, res) => {
  const { orderId, confirmationCode } = req.body;

  try {
    // Step 1: Find the matching order
    const order = await Order.findOne({ orderId, confirmationCode });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Step 2: Check if already received
    if (order.status === 'received') {
      return res.status(400).json({ message: 'Order already received' });
    }

    // Step 3: Update status
    order.status = 'received';
    order.receivedAt = new Date();
    await order.save();

    // Step 4: Get user readable ID
    const user = await User.findById(order.userId);
    const userIdString = user?.userId || 'Unknown';

    // Step 5: Get full item details
    const fullItems = await Promise.all(order.items.map(async (itemObj) => {
      const item = await Item.findById(itemObj.itemId);

      const name = item?.itemDescription?.item_name || 'Unknown Item';
      const price = item?.itemDescription?.item_price || 0;

      return {
        name,
        price,
        quantity: itemObj.quantity,
        amount: price * itemObj.quantity
      };
    }));

    // Step 6: Calculate totals
    const subTotal = fullItems.reduce((sum, item) => sum + item.amount, 0);
    const gst = +(subTotal * 0.025).toFixed(2);  // 2.5% GST on both CGST and SGST
    const grandTotal = Math.round(subTotal + gst * 2);

    // Step 7: Send response
    res.json({
      orderId: order.orderId,
      confirmationCode: order.confirmationCode,
      receivedAt: order.receivedAt,
      qrCodeUrl: order.qrCodeUrl,
      userId: userIdString,
      items: fullItems,
      subTotal,
      gst,
      grandTotal
    });

  } catch (err) {
    console.error('Order confirmation error:', err);
    res.status(500).json({ message: 'Server error during confirmation' });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

