const express = require('express');
const router = express.Router();
const Preference = require('../models/preferences');
const {createMultiDayRoute} = require('../services/routeService');
const {filterAvailableLocations} = require('../services/routeService');
router.post('/available-places', async (req, res) => {
  try {
    const preference = new Preference(req.body);

    const places = await filterAvailableLocations(preference); // önce await!
    console.log("🎯 Filtrelenmiş lokasyon sayısı:", places.length); // sonra log!

    res.status(200).json({
      message: 'Filtrelenmiş lokasyonlar',
      data: places
    });
  } catch (error) {
    console.error('❌ Lokasyon filtreleme hatası:', error);
    res.status(500).json({ message: 'Lokasyonlar alınamadı', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const preference = new Preference(req.body);

    console.log('=== 📥 Giriş Verisi (Preference) ===');
    console.log('📌 type:', preference.type);
    console.log('📆 duration:', preference.duration);
    console.log('⏱️ startDate:', preference.startDate.toISOString());
    console.log('⏱️ endDate:', preference.endDate.toISOString());
    console.log('🧑 userId:', preference.userId);
    console.log('📍 niceToHavePlaces:', preference.niceToHavePlaces);
    console.log('📅 Günler:', preference.getDayStrings());
    console.log('=====================================\n');

    // ✅ Yeni sistem: Çok günlük rota üretimi
  const routes = await createMultiDayRoute({
    startDate: preference.startDate,
    endDate: preference.endDate,
    startHour: preference.startHour || 10,
    totalHours: preference.totalHours || 7,
    selectedCategory: preference.type,
    mustVisit: preference.niceToHavePlaces // 👈 bunu da unutma
  });

    console.log('📋 createMultiDayRoute parametreleri:', {
      startDate: preference.startDate,
      endDate: preference.endDate,
      startHour: preference.startHour,
      totalHours: preference.totalHours,
      selectedCategory: preference.type
    });
    // 🔥 Plain log için sadeleştir
    const simplifiedRoutes = routes.map(dayPlan => ({
      date: dayPlan.date,
      route: dayPlan.route.map(loc => ({
        id: loc.id,
        name: loc.name,
        category: loc.category,
        mustVisit: loc.mustVisit,
        start: loc.visitStartTime,
        end: loc.visitEndTime,
      }))
    }));
    
    console.log("🧭 Sadeleştirilmiş Rota:\n", JSON.stringify(simplifiedRoutes, null, 2));

    res.status(201).json({
      message: "Rota başarıyla oluşturuldu!",
      data: {
        preference,
        routes
      }
    });
  } catch (error) {
    console.error("❌ Hata:", error);
    res.status(500).json({ message: "Sunucu hatası", error: error.message });
  }
});

module.exports = router;
