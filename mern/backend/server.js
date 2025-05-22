import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import db from "./db/connection.js";

const PORT = process.env.PORT || 5050;
const app = express();

// Application state tracking
let isReady = false;
let isStarted = false;

app.use(cors());
app.use(express.json());
app.use("/record", records);

// Health check endpoint (liveness probe)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Startup probe endpoint
app.get('/startup', async (req, res) => {
  try {
    if (!isStarted) {
      // Check if database connection is established
      await db.admin().ping();
      isStarted = true;
    }
    
    res.status(200).json({ 
      status: 'started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Startup probe failed:', error);
    res.status(503).json({ 
      status: 'starting',
      error: 'Database connection not ready',
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness probe endpoint
app.get('/ready', async (req, res) => {
  try {
    // Check if the application is started and database is accessible
    if (!isStarted) {
      return res.status(503).json({ 
        status: 'not ready',
        reason: 'Application not started',
        timestamp: new Date().toISOString()
      });
    }

    // Perform a lightweight database check
    await db.admin().ping();
    
    // You can add additional readiness checks here
    // For example: check external service dependencies, cache connections, etc.
    
    isReady = true;
    res.status(200).json({ 
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Readiness probe failed:', error);
    isReady = false;
    res.status(503).json({ 
      status: 'not ready',
      reason: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Comprehensive status endpoint (optional - useful for debugging)
app.get('/status', async (req, res) => {
  try {
    const dbStatus = await db.admin().ping();
    res.status(200).json({
      application: {
        name: 'Records API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      health: {
        status: 'healthy',
        started: isStarted,
        ready: isReady,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      database: {
        status: 'connected',
        ping: !!dbStatus
      },
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
    res.status(503).json({
      health: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown...');
  isReady = false;
  
  // Give some time for readiness probes to detect the change
  setTimeout(async () => {
    try {
      await db.close();
      console.log('Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }, 5000);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, starting graceful shutdown...');
  isReady = false;
  
  setTimeout(async () => {
    try {
      await db.close();
      console.log('Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }, 1000);
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
  console.log(`Startup probe available at: http://localhost:${PORT}/startup`);
  console.log(`Readiness probe available at: http://localhost:${PORT}/ready`);
  console.log(`Status endpoint available at: http://localhost:${PORT}/status`);
});