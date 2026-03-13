const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: 'Token required' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

    req.user = decoded;

    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
