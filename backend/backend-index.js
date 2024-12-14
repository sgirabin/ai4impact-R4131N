require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const app = require('./server'); // REST API server
const captionServer = require('./components/captions'); // Captioning WebSocket server


(async () => {
  try {
    console.log(`[${new Date().toISOString()}] Starting Grow-Platform backend`);

    // Connect to MongoDB
    const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/grow-platform';
    await mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`[${new Date().toISOString()}] Connected to MongoDB`);

    // Start REST API server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));

    console.log(`[${new Date().toISOString()}] Grow-Platform backend is running`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error initializing backend:`, error.message);
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  });
})();
