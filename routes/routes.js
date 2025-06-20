const express = require('express');
const router = express.Router();
const Route = require('../models/route');

// GET /api/routes/all → Tüm kullanıcıların rotalarını getir
router.get('/all', async (req, res) => {
  try {
    const routes = await Route.find();
    res.status(200).json({ routes });
  } catch (error) {
    console.error('❌ Tüm rotaları getirirken hata:', error);
    res.status(500).json({ message: 'Tüm rotalar alınamadı', error: error.message });
  }
});


// ✅ Tüm paylaşılan rotaları getir (anasayfa için)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.isShared === 'true' ? { isShared: true } : {};
    const routes = await Route.find(filter);
    res.status(200).json({ routes });
  } catch (error) {
    console.error('❌ Tüm rotaları alırken hata:', error);
    res.status(500).json({ message: 'Tüm rotalar alınamadı', error: error.message });
  }
});


// ✅ Belirli kullanıcıya ait rotaları getir (my trips için)
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const routes = await Route.find({ userId });
    res.status(200).json({ routes });
  } catch (error) {
    console.error('❌ Rota getirme hatası:', error);
    res.status(500).json({ message: 'Rotalar alınamadı', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('📥 Yeni rota alındı:', req.body);

    // Eğer frontend title, image_url ve userName gönderiyorsa doğrudan kullan
    const savedRoute = await Route.create({
      userId: req.body.userId,
      userName: req.body.userName,                    // ✅
      title: req.body.title?.trim(),                  // ✅
      image_url: req.body.thumbnailImageUrl,          // ✅ ilk lokasyonun image'ı
      duration: req.body.duration,
      startPlace: req.body.startPlace,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      isShared: req.body.isShared || false,
      days: req.body.days
    });

    console.log('💾 Rota kaydedildi:', savedRoute._id);
    res.status(201).json({
      message: 'Rota başarıyla kaydedildi!',
      data: savedRoute
    });
  } catch (error) {
    console.error('❌ Rota kaydederken hata:', error);
    res.status(500).json({ message: 'Veri kaydedilemedi.', error: error.message });
  }
});


// 🔄 Belirli bir rotayı paylaşma durumu güncelle
router.put('/:routeId/share', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { isShared } = req.body;

    const updated = await Route.findByIdAndUpdate(
      routeId,
      { isShared },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Rota bulunamadı' });
    }

    res.status(200).json({ message: 'Paylaşım durumu güncellendi', route: updated });
  } catch (error) {
    console.error('❌ Paylaşım güncelleme hatası:', error);
    res.status(500).json({ message: 'Güncelleme başarısız', error: error.message });
  }
});

module.exports = router;
