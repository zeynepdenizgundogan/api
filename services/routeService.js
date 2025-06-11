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
  const locations = generateLocations('data/locations.json');
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
    image_url: loc.image_url  // ✅ En kritik alan burası
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
function formatTime(mins) {
  const totalSeconds = Math.round(mins * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}.${String(s).padStart(2, "0")}`;
}
// ✅ createMultiDayRoute fonksiyonu — daha önce senin backend'de tanımladığın yapının düz hali
function createMultiDayRoute({ startDate, endDate, startHour, totalHours, selectedCategory, niceToHavePlaces, startLat, startLon }) {
  const niceToHaveIds = new Set(niceToHavePlaces.map(p => p.id));
  
  const allLocations = generateLocations("data/locations.json", startLat, startLon);
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
      day
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

// 🎯 Dengeli lokasyon seçimi fonksiyonu
function selectBalancedLocations(primaryLocs, secondaryLocs, selectedCategories, categoryUsage, categoryBalance, niceToHaveIds, targetCount, day) {
  const result = [];
  const totalUsage = Object.values(categoryUsage).reduce((sum, count) => sum + count, 0);
  
  // 1. Nice-to-have önceliği
  primaryLocs.forEach(loc => {
    if (niceToHaveIds.has(loc.id) && isLocationOpenOnDay(loc, day)) {
      result.push(loc);
    }
  });
  
  // 2. Kategori dengesi için gereken sayıları hesapla
  const categoryNeeds = {};
  selectedCategories.forEach(cat => {
    const currentRatio = totalUsage > 0 ? categoryUsage[cat.toLowerCase()] / totalUsage : 0;
    const targetRatio = categoryBalance[cat.toLowerCase()];
    categoryNeeds[cat.toLowerCase()] = targetRatio - currentRatio;
  });
  
  console.log(`📊 Kategori ihtiyaçları:`, categoryNeeds);
  
  // 3. En çok ihtiyaç duyulan kategorilerden seç
  const sortedCategories = Object.entries(categoryNeeds)
    .sort(([,a], [,b]) => b - a)
    .map(([cat]) => cat);
  
  for (const category of sortedCategories) {
    const categoryLocs = primaryLocs.filter(loc => 
      loc.category.toLowerCase() === category && 
      !result.some(r => r.id === loc.id) &&
      isLocationOpenOnDay(loc, day)
    ).slice(0, Math.ceil(targetCount / selectedCategories.length));
    
    result.push(...categoryLocs);
    
    if (result.length >= targetCount) break;
  }
  
  // 4. Hedef sayıya ulaşmadıysak birincil lokasyonlardan ekle
  if (result.length < targetCount) {
    const remaining = primaryLocs.filter(loc => 
      !result.some(r => r.id === loc.id) &&
      isLocationOpenOnDay(loc, day)
    ).slice(0, targetCount - result.length);
    
    result.push(...remaining);
  }
  
  // 5. Hala eksikse ve mesafe uygunsa ikincil lokasyonlardan ekle
  if (result.length < Math.max(3, targetCount * 0.7)) {
    const nearbySecondary = secondaryLocs.filter(loc => 
      loc.distance_to_start <= 10 && // 10km içinde
      isLocationOpenOnDay(loc, day)
    ).slice(0, targetCount - result.length);
    
    if (nearbySecondary.length > 0) {
      console.log(`🔄 ${nearbySecondary.length} yakın ikincil lokasyon eklendi`);
      result.push(...nearbySecondary);
    }
  }
  
  return result.slice(0, targetCount);
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
