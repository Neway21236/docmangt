const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const folderRoutes = require('./routes/folderRoutes');
const documentRoutes = require('./routes/documentRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const phase5Routes = require('./routes/phase5Routes');
const phase6Routes = require('./routes/phase6Routes');
const { startExpiryJob } = require('./services/expiryJob');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*', // Allow frontend access in development
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'dms-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api', phase5Routes);
app.use('/api', phase6Routes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
});

// Server start if main
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===========================================`);
    console.log(`🚀 DMS Backend running on http://0.0.0.0:${PORT}`);
    console.log(`   Health: http://0.0.0.0:${PORT}/api/health`);
    console.log(`===========================================`);
    startExpiryJob();
  });
}

module.exports = app;
