const { Router } = require('express');
const tecnologiasRoutes = require('./tecnologias');
const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

router.use('/tecnologias', tecnologiasRoutes);

module.exports = router;
