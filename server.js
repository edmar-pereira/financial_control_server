const express = require('express');
const mongoose = require('mongoose');
const Router = require('./routes/Routes');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const fs = require('node:fs');
const https = require('node:https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const swaggerFile = require('./swagger.json');

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use('/api/', Router);

const uri = process.env.MONGODB_URI;

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

app.get('/health-check', (req, res) => {
  res.send('server is running');
});

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
