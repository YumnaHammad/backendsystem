// Simple health check endpoint
module.exports = (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server running',
    timestamp: new Date().toISOString()
  });
};
