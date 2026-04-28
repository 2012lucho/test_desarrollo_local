const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const tecnologias = await db('tecnologias').select('*').orderBy('id', 'asc');
    res.json({ ok: true, data: tecnologias });
  } catch (error) {
    console.error('GET /api/tecnologias error', error);
    res.status(500).json({ ok: false, error: 'Error listando tecnologias' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ ok: false, error: 'Id de tecnología inválido' });
  }

  try {
    const tecnologia = await db('tecnologias').where({ id }).first();
    if (!tecnologia) {
      return res.status(404).json({ ok: false, error: 'Tecnología no encontrada' });
    }
    res.json({ ok: true, data: tecnologia });
  } catch (error) {
    console.error('GET /api/tecnologias/:id error', error);
    res.status(500).json({ ok: false, error: 'Error obteniendo tecnología' });
  }
});

router.post('/', async (req, res) => {
  const nombre = String(req.body?.nombre || '').trim();
  const color = String(req.body?.color || '').trim() || null;
  if (!nombre) {
    return res.status(400).json({ ok: false, error: 'El nombre es requerido' });
  }

  try {
    const [id] = await db('tecnologias').insert({ nombre, color });
    const tecnologia = await db('tecnologias').where({ id }).first();
    res.status(201).json({ ok: true, data: tecnologia });
  } catch (error) {
    console.error('POST /api/tecnologias error', error);
    res.status(500).json({ ok: false, error: 'Error creando tecnología' });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const nombre = String(req.body?.nombre || '').trim();
  const color = String(req.body?.color || '').trim() || null;

  if (!id || id <= 0) {
    return res.status(400).json({ ok: false, error: 'Id de tecnología inválido' });
  }
  if (!nombre) {
    return res.status(400).json({ ok: false, error: 'El nombre es requerido' });
  }

  try {
    const affected = await db('tecnologias').where({ id }).update({ nombre, color, actualizado_el: new Date() });
    if (!affected) {
      return res.status(404).json({ ok: false, error: 'Tecnología no encontrada' });
    }
    const tecnologia = await db('tecnologias').where({ id }).first();
    res.json({ ok: true, data: tecnologia });
  } catch (error) {
    console.error('PUT /api/tecnologias/:id error', error);
    res.status(500).json({ ok: false, error: 'Error actualizando tecnología' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ ok: false, error: 'Id de tecnología inválido' });
  }

  try {
    const affected = await db('tecnologias').where({ id }).delete();
    if (!affected) {
      return res.status(404).json({ ok: false, error: 'Tecnología no encontrada' });
    }
    res.json({ ok: true, data: { id } });
  } catch (error) {
    console.error('DELETE /api/tecnologias/:id error', error);
    res.status(500).json({ ok: false, error: 'Error eliminando tecnología' });
  }
});

module.exports = router;
