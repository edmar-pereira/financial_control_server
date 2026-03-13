const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const Router = require('./routes/api.routes');
const AuthRouter = require('./routes/auth.routes');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const fs = require('node:fs');
const https = require('node:https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3008;
const uri = process.env.MONGODB_URI;
const swaggerFile = require('./swagger.json');

const allowedOrigins = process.env.CORS_ORIGIN.split(',');

//middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // permite curl / server to server

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use('/api/', Router);
app.use('/auth/', AuthRouter);

if (!uri) {
  throw new Error('MongoDB URI is undefined. Check .env file');
}

mongoose
  .connect(uri)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log({
      host: mongoose.connection.host,
      db: mongoose.connection.db.namespace,
    });
  })
  .catch((err) => console.error(err));

if (process.env.NODE_ENV === 'development') {
  const options = {
    key: fs.readFileSync('.cert/key.pem'),
    cert: fs.readFileSync('.cert/cert.pem'),
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log(`Server running locally on https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
  });
}

module.exports = app;
