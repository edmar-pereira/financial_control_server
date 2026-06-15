const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');

// LOGIN
exports.login = async (req, res) => {
  const { user: username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'User and password are required' });
  }

  try {
      const hashedPassword = await bcrypt.hash(password, 10);

    console.log('USER:', username);
    console.log('PASSWORD HASH:', hashedPassword);
    const existingUser = await User.findOne({ user: username });

    
    if (!existingUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, existingUser.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const accessToken = jwt.sign(
      { id: existingUser._id, user: existingUser.user },
      process.env.ACCESS_SECRET,
      { expiresIn: '24h' },
    );

    const refreshToken = jwt.sign(
      { id: existingUser._id },
      process.env.REFRESH_SECRET,
      { expiresIn: '30d' },
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
    });

    res.json({ accessToken });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// REFRESH TOKEN
exports.refresh = (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'Missing refresh token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.ACCESS_SECRET,
      { expiresIn: '24h' },
    );

    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.clearCookie('refreshToken', { path: '/auth' });

  res.json({ message: 'Logged out successfully' });
};
