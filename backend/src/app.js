const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', version: 'base-backend' });
});

module.exports = app;
