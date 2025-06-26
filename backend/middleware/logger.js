/**
 * Request logger middleware
 * Logs information about incoming requests
 */

/**
 * Log details about the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function requestLogger(req, res, next) {
  const start = new Date();
  const { method, url } = req;
  
  // Log the request when it starts
  console.log(`${method} ${url} - ${start.toISOString()}`);
  
  // Once the response is finished, log the completion
  res.on('finish', () => {
    const duration = new Date() - start;
    console.log(`${method} ${url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Determine appropriate status code
  const statusCode = err.statusCode || 500;
  
  // Send error response
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
