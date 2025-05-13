const express = require('express');
const router = express.Router();
const Preference = require('../models/preferences');
const { createMultiDayRoute } = require('../services/routeService');
const { filterAvailableLocations } = require('../services/routeService');

router.post('/available-places', (req, res) => {
  try {
    const preference = new Preference(req.body);
    const places = filterAvailableLocations(preference);
    res.status(200).json({
      message: 'Filtrelenmiş lokasyonlar',
      data: places
    });
  } catch (error) {
    console.error('❌ Lokasyon filtreleme hatası:', error);
    res.status(500).json({ message: 'Lokasyonlar alınamadı', error: error.message });
  }
});

router.post('/', (req, res) => {
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

    // createMultiDayRoute çağrısını güncelle
    const routes = createMultiDayRoute({
      startDate: preference.startDate,
      endDate: preference.endDate,
      startHour: preference.startHour || 10,
      totalHours: preference.totalHours || 7,
      selectedCategory: preference.type,
      niceToHavePlaces: preference.niceToHavePlaces, // Eksik parametre eklendi
      startLat: preference.startLat,
      startLon: preference.startLon
    });

    console.log('📋 createMultiDayRoute parametreleri:', {
      startDate: preference.startDate,
      endDate: preference.endDate,
      startHour: preference.startHour,
      totalHours: preference.totalHours,
      selectedCategory: preference.type,
      niceToHavePlaces: preference.niceToHavePlaces.map(p => ({ id: p.id, name: p.name }))
    });

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