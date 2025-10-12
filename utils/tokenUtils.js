const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const extractToken = (req) => {
  let token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    token = req.header('X-Auth-Token');
  }
  if (!token) {
    token = req.cookies?.authToken;
  }
  return token;
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const setCookieToken = (res, token) => {
  res.cookie('authToken', token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};

const setTokenHeaders = (res, token) => {
  res.set('Authorization', `Bearer ${token}`);
  res.set('X-Auth-Token', token);
};

module.exports = {
  generateToken,
  extractToken,
  verifyToken,
  setCookieToken,
  setTokenHeaders
};