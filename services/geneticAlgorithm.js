const calculateFitness = require("../utils/calculateFitness");
const crossover = require("../utils/crossover");
const mutate = require("../utils/mutate");
const tournamentSelection = require("../utils/tournamentSelection");
const {
  MAX_ROUTE_LENGTH,
  STAGNATION_LIMIT,
  MAX_DISTANCE_THRESHOLD,
  DEFAULT_START_HOUR,
  DEFAULT_TOTAL_HOURS
} = require("../utils/constants");

function geneticAlgorithm(locations, distanceMatrix, day, startHour = DEFAULT_START_HOUR, totalHours = DEFAULT_TOTAL_HOURS, selectedCategories) {
  console.log("🧬 geneticAlgorithm başladı", { locCount: locations.length, day });

  if (!locations || locations.length === 0) return [];

  // Parametreler
  const populationSize = 300;
  const mutationRate = 0.15;
  const eliteCount = 45; // %15
  const tournamentSize = 7;
  const generations = 200;

  // En az 4-5 lokasyon garantisi için
  const minLocations = Math.min(5, locations.length);
  const targetLocations = Math.min(MAX_ROUTE_LENGTH, Math.max(minLocations, 4));

  // Lokasyon kategorileri ve kalite analizi
  const locationAnalysis = analyzeLocations(locations, selectedCategories);
  
  console.log("🔍 Lokasyon analizi:", {
    mustVisit: locationAnalysis.mustVisitIndices.length,
    category: locationAnalysis.categoryIndices.length,
    other: locationAnalysis.otherIndices.length
  });

  // Akıllı popülasyon oluşturma
  let population = createBalancedPopulation(
    populationSize,
    locationAnalysis,
    locations,
    selectedCategories,
    targetLocations,
    day
  );

  let fitnessValues = population.map(route =>
    calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategories)
  );

  let bestFitness = Math.max(...fitnessValues);
  let stagnationCounter = 0;

  // Ana evrim döngüsü
  for (let generation = 0; generation < generations; generation++) {
    // Elitleri seç
    const sortedIndices = [...fitnessValues.keys()].sort((a, b) => fitnessValues[b] - fitnessValues[a]);
    const newPopulation = sortedIndices.slice(0, eliteCount).map(i => [...population[i]]);

    // Yeni nesil oluştur
    while (newPopulation.length < populationSize) {
      let child;
      
      // %30 ihtimalle yeni balanced route oluştur
      if (Math.random() < 0.3) {
        child = createBalancedRoute(locationAnalysis, locations, selectedCategories, targetLocations, day);
      } else {
        // Normal crossover
        const parent1 = tournamentSelection(population, fitnessValues, tournamentSize);
        const parent2 = tournamentSelection(population, fitnessValues, tournamentSize);
        child = crossover(parent1, parent2);
        mutate(child, mutationRate);
      }

      // Rota kalitesini garantile
      child = ensureRouteQuality(child, locationAnalysis, locations, selectedCategories, targetLocations, day);
      
      if (child.length >= minLocations) {
        newPopulation.push(child);
      }
    }

    population = newPopulation;
    fitnessValues = population.map(route =>
      calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategories)
    );

    const currentBestFitness = Math.max(...fitnessValues);
    if (currentBestFitness > bestFitness) {
      bestFitness = currentBestFitness;
      stagnationCounter = 0;
      console.log(`🚀 Gen ${generation}: Yeni en iyi fitness: ${currentBestFitness.toFixed(2)}`);
    } else {
      stagnationCounter++;
    }

    // Stagnation kontrolü
    if (stagnationCounter >= STAGNATION_LIMIT) {
      console.log(`⏹️ Erken durma: ${generation} generasyonda`);
      
      // Yeni balanced popülasyon oluştur
      const bestRoute = [...population[fitnessValues.indexOf(Math.max(...fitnessValues))]];
      population = [bestRoute];

      for (let i = 0; i < populationSize - 1; i++) {
        const newRoute = createBalancedRoute(locationAnalysis, locations, selectedCategories, targetLocations, day);
        population.push(newRoute);
      }

      fitnessValues = population.map(route =>
        calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategories)
      );

      stagnationCounter = 0;
    }
  }

  const bestIndex = fitnessValues.indexOf(Math.max(...fitnessValues));
  const finalRoute = population[bestIndex];
  
  console.log(`🏆 Final rota: ${finalRoute.length} lokasyon, fitness: ${fitnessValues[bestIndex].toFixed(2)}`);
  console.log('🧬 geneticAlgorithm tamamlandı');
  
  return finalRoute;
}

function analyzeLocations(locations, selectedCategories) {
  const selectedCatsLower = selectedCategories.map(cat => cat.toLowerCase());
  
  // Must-visit lokasyonlar
  const mustVisitIndices = locations.map((loc, i) => ({ loc, i }))
    .filter(({ loc }) => loc.must_visit && loc.distance_to_start <= MAX_DISTANCE_THRESHOLD)
    .map(({ i }) => i);

  // Kategori eşleşen lokasyonlar
  const categoryIndices = locations.map((loc, i) => ({ loc, i }))
    .filter(({ loc, i }) => {
      if (mustVisitIndices.includes(i)) return false;
      
      const categories = Array.isArray(loc.category) ? loc.category : [loc.category];
      return categories.some(cat => selectedCatsLower.includes(cat.toLowerCase()));
    })
    .map(({ i }) => i);

  // Diğer lokasyonlar
  const otherIndices = locations.map((_, i) => i)
    .filter(i => !mustVisitIndices.includes(i) && !categoryIndices.includes(i));

  return {
    mustVisitIndices,
    categoryIndices,
    otherIndices
  };
}

function createBalancedPopulation(size, analysis, locations, selectedCategories, targetLocations, day) {
  const population = [];
  
  for (let i = 0; i < size; i++) {
    const route = createBalancedRoute(analysis, locations, selectedCategories, targetLocations, day);
    population.push(route);
  }
  
  return population;
}

function createBalancedRoute(analysis, locations, selectedCategories, targetLocations, day) {
  const { mustVisitIndices, categoryIndices, otherIndices } = analysis;
  
  let route = [];
  
  // 1. Önce must-visit lokasyonları ekle
  route.push(...mustVisitIndices);
  
  // 2. Kalan slot sayısını hesapla
  let remainingSlots = targetLocations - route.length;
  
  // 3. Kategori eşleşen lokasyonlardan seç (en az %70)
  if (remainingSlots > 0 && categoryIndices.length > 0) {
    const categoryCount = Math.min(
      Math.ceil(remainingSlots * 0.7), 
      categoryIndices.length
    );
    const shuffledCategory = shuffle([...categoryIndices]);
    
    // Açık olan lokasyonları filtrele
    const openCategory = shuffledCategory.filter(idx => isLocationOpen(locations[idx], day));
    route.push(...openCategory.slice(0, categoryCount));
    remainingSlots = targetLocations - route.length;
  }
  
  // 4. Kalan yerleri diğer lokasyonlardan doldur
  if (remainingSlots > 0 && otherIndices.length > 0) {
    const shuffledOthers = shuffle([...otherIndices]);
    const openOthers = shuffledOthers.filter(idx => isLocationOpen(locations[idx], day));
    route.push(...openOthers.slice(0, remainingSlots));
  }
  
  // 5. Hala eksikse, tüm kategori lokasyonlarından rastgele seç
  remainingSlots = targetLocations - route.length;
  if (remainingSlots > 0) {
    const availableIndices = categoryIndices.filter(idx => 
      !route.includes(idx) && isLocationOpen(locations[idx], day)
    );
    
    if (availableIndices.length > 0) {
      const shuffledAvailable = shuffle(availableIndices);
      route.push(...shuffledAvailable.slice(0, remainingSlots));
    }
  }
  
  // 6. Lokasyon sırasını karıştır
  return shuffle(route);
}

function ensureRouteQuality(route, analysis, locations, selectedCategories, targetLocations, day) {
  if (!route || route.length === 0) {
    return createBalancedRoute(analysis, locations, selectedCategories, targetLocations, day);
  }
  
  // Minimum lokasyon sayısını garantile
  if (route.length < 4) {
    const additionalNeeded = 4 - route.length;
    const { categoryIndices } = analysis;
    
    const availableIndices = categoryIndices
      .filter(idx => !route.includes(idx) && isLocationOpen(locations[idx], day));
    
    if (availableIndices.length > 0) {
      const shuffled = shuffle(availableIndices);
      route.push(...shuffled.slice(0, additionalNeeded));
    }
  }
  
  // Maksimum uzunluk kontrolü
  if (route.length > MAX_ROUTE_LENGTH) {
    // Kaliteli olanları koru
    const mustVisitInRoute = route.filter(idx => analysis.mustVisitIndices.includes(idx));
    const categoryInRoute = route.filter(idx => analysis.categoryIndices.includes(idx));
    
    let newRoute = [...mustVisitInRoute];
    let remaining = MAX_ROUTE_LENGTH - newRoute.length;
    
    if (remaining > 0) {
      newRoute.push(...categoryInRoute.slice(0, remaining));
    }
    
    route = newRoute;
  }
  
  return route;
}

function isLocationOpen(location, day) {
  const openClose = location.opening_hours?.[day];
  if (!openClose) return false;
  const [openTime, closeTime] = openClose;
  return openTime !== -1 && closeTime !== -1;
}

// Yardımcı fonksiyon - array karıştırma
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = geneticAlgorithm;