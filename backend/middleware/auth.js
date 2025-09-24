/**
 * Authentication middleware for protecting routes
 */
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'indiclaw-jwt-secret';

/**
 * Middleware to authenticate JWT token and attach user to request
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user with the ID from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Attach user object to request
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware - will attach user if token is valid,
 * but will not block the request if no token is present
 */
export const optionalAuthenticateToken = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    
    if (!token) {
      // Continue without user authentication
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user with the ID from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      // Attach user object to request
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name
      };
    }
    
    next();
  } catch (error) {
    // Continue without user authentication
    next();
  }
};

export default {
  authenticateToken,
  optionalAuthenticateToken
};