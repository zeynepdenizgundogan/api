const express = require('express');
const router = express.Router();
const Route = require('../models/route');

// POST /api/routes
router.post('/', async (req, res) => {
  try {
    console.log('📥 Yeni rota alındı:', req.body);
    const title = `${req.body.startPlace?.name} Trip - ${new Date().toLocaleDateString()}`;
    const savedRoute = await Route.create({ ...req.body, title });
    console.log('💾 MongoDB\'ye kaydedildi:', savedRoute._id);
    res.status(201).json({
      message: 'Rota başarıyla kaydedildi!',
      data: savedRoute
    });
  } catch (error) {
    console.error('❌ Rota kaydederken hata:', error);
    res.status(500).json({ message: 'Veri kaydedilemedi.', error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const routes = await Route.find({ userId });
    res.status(200).json({ routes });
  } catch (error) {
    console.error('❌ Rota getirme hatası:', error);
    res.status(500).json({ message: 'Rotalar alınamadı', error: error.message });
  }
});

module.exports = router;