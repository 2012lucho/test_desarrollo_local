const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
// Si .env no existe, usar .env.dev como ejemplo
dotenv.config({ path: '.env.dev' });

const app = require('./app');
const port = process.env.PUERTO || 3000;

app.listen(port, () => {
  console.log(`API backend ejecutándose en http://localhost:${port}`);
});
