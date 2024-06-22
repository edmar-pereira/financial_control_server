const express = require('express');
const mongoose = require('mongoose');
const Router = require('./routes/Routes');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
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

mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost/CRUD',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Connected to MongoDB');
      console.log({
        host: mongoose.connection.host,
        db: mongoose.connection.db.namespace,
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
