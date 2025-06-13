const geneticAlgorithm = require("./geneticAlgorithm");
const {generateLocations} = require("./locationservice");
const optimizeRouteOrder = require("../utils/optimizeRouteOrder");
const createDistanceMatrix = require("../utils/createDistanceMatrix");
const { TRAVEL_TIME_PER_KM, MAX_DISTANCE_THRESHOLD } = require("../utils/constants");
const {
  DEFAULT_START_HOUR,
  DEFAULT_TOTAL_HOURS
} = require("../utils/constants");

startHour = DEFAULT_START_HOUR;
totalHours = DEFAULT_TOTAL_HOURS;
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function filterAvailableLocations(preference) {
  const locations = generateLocations('data/locations.json', preference.startLat, preference.startLon);
  const days = preference.getDayStrings();
  console.log('🧾 Gelen Preference:', preference);
  console.log('📅 Günler:', preference.getDayStrings());
  console.log('📂 Category map:', mapCategory(preference.type));
  return locations
  .filter(loc => {
    const categoryMatch = mapCategory(preference.type).includes(loc.category.toLowerCase());
    return categoryMatch;
  })
  .map(loc => ({
    id: loc.id,
    name: loc.name,
    latitude: loc.latitude,
    longitude: loc.longitude,
    distance_to_start: loc.distance_to_start,
    must_visit: loc.must_visit,
    category: loc.category,
    score: loc.score,
    visit_duration: loc.visit_duration,
    opening_hours: loc.opening_hours,
    rating: loc.rating,
    image_url: loc.image_url 
  }));
}function mapCategory(type) {
  const validCategories = [
    'cultural',
    'park',
    'food',
    'shopping',
    'education',
    'entertainment',
    'scenic'
  ];

  if (Array.isArray(type)) {
    return type
      .filter((t) => typeof t === 'string' && validCategories.includes(t.toLowerCase()))
      .map((t) => t.toLowerCase());
  }

  if (typeof type === 'string' && validCategories.includes(type.toLowerCase())) {
    return [type.toLowerCase()];
  }
  

  return [];
}


function optimizeRoute(day, startHour, totalHours, selectedCategories, locations, distanceMatrix) {
  console.log('NICETOHVAR', locations[0].name, locations[0].distance_to_start);
  const filtered = locations.filter(loc => loc.distance_to_start <= MAX_DISTANCE_THRESHOLD || !loc.must_visit);
  console.log(`genetik algoya başladı'`);
  const bestRoute = geneticAlgorithm(filtered, distanceMatrix, day, startHour, totalHours, selectedCategories);
  const orderedRoute = optimizeRouteOrder(bestRoute, filtered, distanceMatrix);

  const visitTimes = {};
  let currentTime = startHour * 60;
  const endTime = currentTime + totalHours * 60;
  let previous = -1;
  const finalRoute = [];

  for (const idx of orderedRoute) {
    const loc = filtered[idx];
    if (previous !== -1) {
      const distance = distanceMatrix[previous][idx];
      currentTime += distance * TRAVEL_TIME_PER_KM;
    }
    const hours = loc.opening_hours[day];
    if (!hours) continue;
    const [open, close] = hours;
    if (open === -1 || close === -1) continue;
    if (currentTime < open * 60) currentTime = open * 60;
    if ((currentTime + loc.visit_duration > close * 60) || (currentTime + loc.visit_duration > endTime)) continue;
    visitTimes[idx] = currentTime;
    currentTime += loc.visit_duration;
    finalRoute.push(loc);
    previous = idx;
  }

  return [ finalRoute, filtered, visitTimes ];
}

function getDateRange(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Sadece tarih kısmını karşılaştırmak için saatleri sıfırla
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const dates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
}

// ✅ createMultiDayRoute fonksiyonu — daha önce senin backend'de tanımladığın yapının düz hali
function createMultiDayRoute({ startDate, endDate, startHour, totalHours, selectedCategory, niceToHavePlaces, startLat, startLon }) {
  const niceToHaveIds = new Set(niceToHavePlaces.map(p => p.id));
    // 🛠️ startLat ve startLon geldi mi kontrol et
  console.log("📌 Gelen koordinatlar:", startLat, startLon);

  
  const allLocations = generateLocations("data/locations.json", startLat, startLon);

  // Nice-to-have'lerin güncel mesafelerini al
  niceToHavePlaces = niceToHavePlaces.map(place => {
    const updated = allLocations.find(loc => loc.id === place.id);
    if (!updated) {
      console.warn(`⚠️ Nice-to-have lokasyon bulunamadı: ID ${place.id}`);
    }
    return updated || place;
  });

  const dates = getDateRange(startDate, endDate);
  
  // 🎯 KATEGORİ DENGESİ: Her kategori için hedef oranlar
  const categoryBalance = {};
  selectedCategory.forEach(cat => {
    categoryBalance[cat.toLowerCase()] = 1.0 / selectedCategory.length; // Eşit dağılım
  });
  
  console.log(`🎯 Kategori dengesi hedefi:`, categoryBalance);
  
  // 🔥 HİBRİT FİLTRELEME: Öncelik seçilen kategoriler, yedek diğerleri
  const primaryLocations = allLocations.filter(loc => 
    selectedCategory.some(cat => cat.toLowerCase() === loc.category.toLowerCase()) ||
    niceToHaveIds.has(loc.id)
  );
  
  const secondaryLocations = allLocations.filter(loc => 
    !selectedCategory.some(cat => cat.toLowerCase() === loc.category.toLowerCase()) &&
    !niceToHaveIds.has(loc.id)
  );
  
  console.log(`🎯 Birincil lokasyonlar: ${primaryLocations.length}`);
  console.log(`🔄 Yedek lokasyonlar: ${secondaryLocations.length}`);
  
  let remainingPrimary = [...primaryLocations];
  let remainingSecondary = [...secondaryLocations];
  const allRoutes = [];
  const usedLocationIds = new Set();
  
  // 📊 Kategori sayacı
  const categoryUsage = {};
  selectedCategory.forEach(cat => categoryUsage[cat.toLowerCase()] = 0);
  
  for (const travelDate of dates) {
    const day = travelDate.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = travelDate.toISOString().split("T")[0];
    
    console.log(`\n📅 İşlenen gün: ${formattedDate} (${day})`);
    
    // 🔥 GÜNLÜK HEDEFLENMİŞ LOKASYoN SAYISI
    const targetLocationsPerDay = Math.max(4, Math.ceil((totalHours * 60) / 90)); // 90dk ortalama
    console.log(`🎯 Hedef lokasyon sayısı: ${targetLocationsPerDay}`);
    
    // Kullanılabilir lokasyonları bul
    const availablePrimary = remainingPrimary.filter(loc => !usedLocationIds.has(loc.id));
    const availableSecondary = remainingSecondary.filter(loc => !usedLocationIds.has(loc.id));
    
    if (availablePrimary.length === 0 && availableSecondary.length === 0) {
      allRoutes.push({ date: formattedDate, route: [], message: "No more locations." });
      continue;
    }
    
    // 🎯 AKILLI LOKASYoN SEÇİMİ
    const selectedLocations = selectBalancedLocations(
      availablePrimary, 
      availableSecondary, 
      selectedCategory, 
      categoryUsage, 
      categoryBalance, 
      niceToHaveIds, 
      targetLocationsPerDay,
      day,
      startLat,
      startLon
    );
    
    console.log(`✅ Seçilen lokasyon sayısı: ${selectedLocations.length}`);
    
    if (selectedLocations.length === 0) {
      allRoutes.push({ date: formattedDate, route: [], message: "No suitable locations found." });
      continue;
    }
    
    // Genetic Algorithm ile optimize et
    const distanceMatrix = createDistanceMatrix(selectedLocations);
    const availableNiceToHaveIds = new Set();
    selectedLocations.forEach(loc => {
      if (niceToHaveIds.has(loc.id)) {
        availableNiceToHaveIds.add(loc.id);
      }
    });
    
    const bestRoute = geneticAlgorithm(
      selectedLocations, 
      distanceMatrix, 
      day, 
      startHour, 
      totalHours, 
      selectedCategory, 
      availableNiceToHaveIds
    );
    
    const orderedRoute = optimizeRouteOrder(bestRoute, selectedLocations, distanceMatrix);
    
    // Zaman çizelgesi oluştur
    const finalRoute = createTimeSchedule(
      orderedRoute, 
      selectedLocations, 
      distanceMatrix, 
      day, 
      startHour, 
      totalHours, 
      niceToHaveIds
    );
    
    // Kategori sayacını güncelle
    finalRoute.forEach(location => {
      const category = location.category.toLowerCase();
      if (categoryUsage[category] !== undefined) {
        categoryUsage[category]++;
      }
    });
    
    // Kullanılan lokasyonları işaretle
    finalRoute.forEach(location => usedLocationIds.add(location.id));
    
    console.log(`✅ ${formattedDate} için ${finalRoute.length} lokasyon eklendi`);
    console.log(`📊 Günün kategori dağılımı:`, 
      finalRoute.reduce((acc, loc) => {
        acc[loc.category] = (acc[loc.category] || 0) + 1;
        return acc;
      }, {})
    );
    
    allRoutes.push({ date: formattedDate, route: finalRoute });
  }
  
  console.log(`\n📊 Toplam kategori kullanımı:`, categoryUsage);
  return allRoutes;
}

// 🎯 Mesafe optimizeli dengeli lokasyon seçimi fonksiyonu
// 🎯 Evrensel mesafe optimizeli lokasyon seçimi (tüm şehirler için)
function selectBalancedLocations(primaryLocs, secondaryLocs, selectedCategories, categoryUsage, categoryBalance, niceToHaveIds, targetCount, day, startLat, startLon) {
  const result = [];
  const totalUsage = Object.values(categoryUsage).reduce((sum, count) => sum + count, 0);
  
  // 🗺️ 1. MESAFE BAZLI GRUPLAMA (şehir bağımsız)
  const distanceGroups = {
    veryNear: [],      // 0-3 km (yürüme mesafesi)
    near: [],          // 3-7 km (kısa ulaşım)
    medium: [],        // 7-15 km (orta mesafe)
    far: [],           // 15-25 km (uzun yolculuk)
    veryFar: []        // 25+ km (çok uzak)
  };
  
  // Lokasyonları mesafeye göre grupla
  primaryLocs.forEach(loc => {
    if (!isLocationOpenOnDay(loc, day)) return;
    
    const dist = loc.distance_to_start;
    if (dist <= 3) distanceGroups.veryNear.push(loc);
    else if (dist <= 7) distanceGroups.near.push(loc);
    else if (dist <= 15) distanceGroups.medium.push(loc);
    else if (dist <= 25) distanceGroups.far.push(loc);
    else distanceGroups.veryFar.push(loc);
  });
  
  console.log(`📏 Mesafe dağılımı:`, {
    '0-3km': distanceGroups.veryNear.length,
    '3-7km': distanceGroups.near.length,
    '7-15km': distanceGroups.medium.length,
    '15-25km': distanceGroups.far.length,
    '25+km': distanceGroups.veryFar.length
  });
  
  // 🎯 2. YAKIN NICE-TO-HAVE'LERİ EKLE
  const nearbyNiceToHaves = [];
  const distantNiceToHaves = [];
  
  primaryLocs.forEach(loc => {
    if (niceToHaveIds.has(loc.id) && isLocationOpenOnDay(loc, day)) {
      if (loc.distance_to_start <= 10) {
        // 10km altı öncelikli
        nearbyNiceToHaves.push(loc);
      } else if (loc.distance_to_start <= 20) {
        // 10-20km arası değerlendirilebilir
        distantNiceToHaves.push(loc);
      } else {
        console.log(`⚠️ Çok uzak nice-to-have: ${loc.name} (${loc.distance_to_start.toFixed(1)} km)`);
      }
    }
  });
  
  // Nice-to-have'leri mesafeye göre sırala ve ekle
  nearbyNiceToHaves.sort((a, b) => a.distance_to_start - b.distance_to_start);
  result.push(...nearbyNiceToHaves);
  console.log(`✅ ${nearbyNiceToHaves.length} yakın nice-to-have eklendi`);
  
  // 📊 3. KATEGORİ DENGESİ HESAPLA
  const categoryNeeds = {};
  selectedCategories.forEach(cat => {
    const currentRatio = totalUsage > 0 ? categoryUsage[cat.toLowerCase()] / totalUsage : 0;
    const targetRatio = categoryBalance[cat.toLowerCase()];
    categoryNeeds[cat.toLowerCase()] = targetRatio - currentRatio;
  });
  
  // 🌐 4. BÖLGESEL YOĞUNLUK ANALİZİ (Quadrant bazlı)
  // Başlangıç noktası etrafında 4 bölge oluştur
  const quadrants = {
    NE: [], // Kuzey-Doğu
    NW: [], // Kuzey-Batı  
    SE: [], // Güney-Doğu
    SW: []  // Güney-Batı
  };
  
  // Yakın lokasyonları bölgelere ayır
  [...distanceGroups.veryNear, ...distanceGroups.near].forEach(loc => {
    const isNorth = loc.latitude >= startLat;
    const isEast = loc.longitude >= startLon;
    
    if (isNorth && isEast) quadrants.NE.push(loc);
    else if (isNorth && !isEast) quadrants.NW.push(loc);
    else if (!isNorth && isEast) quadrants.SE.push(loc);
    else quadrants.SW.push(loc);
  });
  
  // En yoğun bölgeyi bul
  const quadrantCounts = Object.entries(quadrants).map(([dir, locs]) => ({
    direction: dir,
    count: locs.length,
    locations: locs
  })).sort((a, b) => b.count - a.count);
  
  console.log(`🧭 Bölgesel yoğunluk:`, quadrantCounts.map(q => `${q.direction}: ${q.count}`).join(', '));
  
  // 🎯 5. AKILLI SEÇİM STRATEJİSİ
  const addedIds = new Set(result.map(loc => loc.id));
  let remainingSlots = targetCount - result.length;
  
  // Strateji 1: En yoğun bölgeden başla
  const primaryQuadrant = quadrantCounts[0];
  if (primaryQuadrant.count > 0) {
    const quadrantSelection = selectFromGroup(
      primaryQuadrant.locations,
      selectedCategories,
      categoryNeeds,
      addedIds,
      Math.ceil(remainingSlots * 0.5) // Slotların yarısını en yoğun bölgeye ayır
    );
    
    result.push(...quadrantSelection);
    quadrantSelection.forEach(loc => addedIds.add(loc.id));
    remainingSlots = targetCount - result.length;
    
    console.log(`📍 Ana bölgeden (${primaryQuadrant.direction}) ${quadrantSelection.length} lokasyon eklendi`);
  }
  
  // Strateji 2: Mesafe gruplarından kademeli seç
  const distanceOrder = ['veryNear', 'near', 'medium'];
  
  for (const distGroup of distanceOrder) {
    if (remainingSlots <= 0) break;
    
    const availableLocs = distanceGroups[distGroup]
      .filter(loc => !addedIds.has(loc.id));
    
    if (availableLocs.length === 0) continue;
    
    const groupSelection = selectFromGroup(
      availableLocs,
      selectedCategories,
      categoryNeeds,
      addedIds,
      remainingSlots
    );
    
    result.push(...groupSelection);
    groupSelection.forEach(loc => addedIds.add(loc.id));
    remainingSlots = targetCount - result.length;
    
    console.log(`📍 ${distGroup} grubundan ${groupSelection.length} lokasyon eklendi`);
  }
  
  // 🚨 6. MİNİMUM SAYI GARANTİSİ
  if (result.length < Math.max(3, targetCount * 0.6)) {
    // Orta mesafeli nice-to-have'leri değerlendir
    const criticalNiceToHaves = distantNiceToHaves
      .sort((a, b) => a.distance_to_start - b.distance_to_start)
      .slice(0, Math.max(1, targetCount - result.length));
    
    criticalNiceToHaves.forEach(loc => {
      if (!addedIds.has(loc.id)) {
        console.log(`⚠️ Uzak nice-to-have eklendi: ${loc.name} (${loc.distance_to_start.toFixed(1)} km)`);
        result.push(loc);
        addedIds.add(loc.id);
      }
    });
  }
  
  // 📊 7. SONUÇ ANALİZİ
  if (result.length > 0) {
    const avgDistance = result.reduce((sum, loc) => sum + loc.distance_to_start, 0) / result.length;
    const maxDistance = Math.max(...result.map(l => l.distance_to_start));
    
    console.log(`\n📊 Rota özeti:`, {
      'Toplam lokasyon': result.length,
      'Ortalama mesafe': avgDistance.toFixed(2) + ' km',
      'Max mesafe': maxDistance.toFixed(2) + ' km',
      'Kompaktlık skoru': (10 / avgDistance).toFixed(2), // Düşük ortalama = yüksek skor
      'Kategori dağılımı': result.reduce((acc, loc) => {
        acc[loc.category] = (acc[loc.category] || 0) + 1;
        return acc;
      }, {})
    });
  }
  
  return result.slice(0, targetCount);
}

// Yardımcı fonksiyon: Gruptan kategori dengeli seçim
function selectFromGroup(locations, selectedCategories, categoryNeeds, excludeIds, maxCount) {
  const selected = [];
  const availableLocs = locations.filter(loc => !excludeIds.has(loc.id));
  
  // Önce ihtiyaç duyulan kategorilerden seç
  const sortedCategories = Object.entries(categoryNeeds)
    .sort(([,a], [,b]) => b - a)
    .map(([cat]) => cat);
  
  for (const category of sortedCategories) {
    const categoryLocs = availableLocs
      .filter(loc => 
        loc.category.toLowerCase() === category && 
        !selected.some(s => s.id === loc.id)
      )
      .sort((a, b) => a.distance_to_start - b.distance_to_start)
      .slice(0, Math.ceil(maxCount / selectedCategories.length));
    
    selected.push(...categoryLocs);
    
    if (selected.length >= maxCount) break;
  }
  
  // Kalan yerler için en yakınları ekle
  if (selected.length < maxCount) {
    const remaining = availableLocs
      .filter(loc => !selected.some(s => s.id === loc.id))
      .sort((a, b) => a.distance_to_start - b.distance_to_start)
      .slice(0, maxCount - selected.length);
    
    selected.push(...remaining);
  }
  
  return selected.slice(0, maxCount);
}

// 🕐 Zaman çizelgesi oluşturma
function createTimeSchedule(orderedRoute, locations, distanceMatrix, day, startHour, totalHours, niceToHaveIds) {
  const visitTimes = {};
  let currentTime = startHour * 60; // dakikaya çevir
  const endTime = currentTime + totalHours * 60;
  let previous = -1;
  const finalRoute = [];

  for (const idx of orderedRoute) {
    const loc = locations[idx];
    
    if (previous !== -1) {
      const dist = distanceMatrix[previous][idx];
      currentTime += dist * TRAVEL_TIME_PER_KM;
    }

    const [open, close] = loc.opening_hours[day] || [-1, -1];
    if (open === -1 || close === -1) continue;
    
    // Açılış saatini bekle
    if (currentTime < open * 60) {
      currentTime = open * 60;
    }
    
    // Zaman kontrolleri
    if (currentTime + loc.visit_duration > close * 60 || 
        currentTime + loc.visit_duration > endTime) {
      continue;
    }

    visitTimes[idx] = currentTime;
    const endVisitTime = currentTime + loc.visit_duration;
    
    finalRoute.push({
      id: loc.id,
      name: loc.name,
      category: loc.category,
      mustVisit: niceToHaveIds.has(loc.id),
      latitude: loc.latitude,
      longitude: loc.longitude,
      visitStartTime: formatTimeCorrectly(currentTime / 60), // Düzeltilmiş format
      visitEndTime: formatTimeCorrectly(endVisitTime / 60),
      image_url: loc.image_url
    });

    currentTime = endVisitTime;
    previous = idx;
  }

  return finalRoute;
}

// 🕐 Doğru saat formatı
function formatTimeCorrectly(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// 📅 Lokasyonun o gün açık olup olmadığını kontrol et
function isLocationOpenOnDay(location, day) {
  const hours = location.opening_hours[day];
  return hours && hours[0] !== -1 && hours[1] !== -1;
}

module.exports = {
  optimizeRoute,
  getDateRange,
  filterAvailableLocations,
  createMultiDayRoute,
  selectBalancedLocations,
  createTimeSchedule,
  formatTimeCorrectly
};
