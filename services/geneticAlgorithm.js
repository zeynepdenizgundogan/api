const calculateFitness = require("../utils/calculateFitness");
const crossover = require("../utils/crossover");
const mutate = require("../utils/mutate");
const tournamentSelection = require("../utils/tournamentSelection");
const { MAX_ROUTE_LENGTH, STAGNATION_LIMIT, MAX_DISTANCE_THRESHOLD } = require("../utils/constants");
const logRouteDetails = require("../utils/logRouteCategories");

function geneticAlgorithm(locations, distanceMatrix, day, startHour, totalHours, selectedCategories, niceToHaveIds = new Set()) {
  const populationSize = 500;
  const mutationRate = 0.1;
  const eliteCount = 75;
  const tournamentSize = 7;
  const generations = 500;

  // 🔥 PYTHON UYUMLU: Must-visit indekslerini belirle
  const mustVisitIndices = [];
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    if (niceToHaveIds.has(loc.id) && loc.distance_to_start <= MAX_DISTANCE_THRESHOLD) {
      mustVisitIndices.push(i);
    }
  }

  // 🔥 PYTHON UYUMLU: Kategori indekslerini belirle (must-visit hariç)
  const categoryIndices = [];
  for (let i = 0; i < locations.length; i++) {
    if (selectedCategories.includes(locations[i].category) && !mustVisitIndices.includes(i)) {
      categoryIndices.push(i);
    }
  }

  // 🔥 PYTHON UYUMLU: Diğer indeksler
  const otherIndices = [];
  for (let i = 0; i < locations.length; i++) {
    if (!mustVisitIndices.includes(i) && !categoryIndices.includes(i)) {
      otherIndices.push(i);
    }
  }

  const shuffle = arr => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 🔥 PYTHON UYUMLU: İlk popülasyon üretimi
  let population = Array.from({ length: populationSize }, () => {
    // 1. Must-visit'leri ekle
    const route = [...mustVisitIndices];
    
    // 2. Kategori lokasyonlarından rastgele seç
    const remainingSlots = MAX_ROUTE_LENGTH - route.length;
    const shuffledCategories = shuffle(categoryIndices);
    const categoryToAdd = shuffledCategories.slice(0, Math.min(shuffledCategories.length, remainingSlots));
    route.push(...categoryToAdd);

    // 3. Hâlâ yer varsa diğer lokasyonlardan ekle
    const stillRemaining = MAX_ROUTE_LENGTH - route.length;
    if (stillRemaining > 0) {
      const shuffledOthers = shuffle(otherIndices);
      const othersToAdd = shuffledOthers.slice(0, Math.min(shuffledOthers.length, stillRemaining));
      route.push(...othersToAdd);
    }

    // 4. Sırayı karıştır (Python'daki gibi)
    return shuffle(route);
  });

  let fitnessValues = population.map(route =>
    calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategories, niceToHaveIds)
  );

  let bestFitness = Math.max(...fitnessValues);
  let stagnation = 0;

  for (let gen = 0; gen < generations; gen++) {
    // Elite selection
    const sorted = [...population.keys()].sort((a, b) => fitnessValues[b] - fitnessValues[a]);
    const newPop = sorted.slice(0, eliteCount).map(i => [...population[i]]);

    // Generate new offspring
    while (newPop.length < populationSize) {
      const parent1 = tournamentSelection(population, fitnessValues, tournamentSize);
      const parent2 = tournamentSelection(population, fitnessValues, tournamentSize);
      let child = crossover(parent1, parent2);
      mutate(child, mutationRate);

      // 🔥 PYTHON UYUMLU: Child'ı düzenle
      if (child.length > MAX_ROUTE_LENGTH) {
        const mustVisitInChild = child.filter(idx => mustVisitIndices.includes(idx));
        const categoryInChild = child.filter(idx => categoryIndices.includes(idx) && !mustVisitInChild.includes(idx));
        const otherInChild = child.filter(idx => !mustVisitInChild.includes(idx) && !categoryInChild.includes(idx));

        const newChild = [...mustVisitInChild];
        const remainingSlots1 = Math.min(MAX_ROUTE_LENGTH - newChild.length, categoryInChild.length);
        if (remainingSlots1 > 0) {
          newChild.push(...categoryInChild.slice(0, remainingSlots1));
        }
        const remainingSlots2 = Math.min(MAX_ROUTE_LENGTH - newChild.length, otherInChild.length);
        if (remainingSlots2 > 0) {
          newChild.push(...otherInChild.slice(0, remainingSlots2));
        }
        child = newChild;
      }

      newPop.push(child);
    }

    population = newPop;
    fitnessValues = population.map(route =>
      calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategories, niceToHaveIds)
    );

    const currentBestFitness = Math.max(...fitnessValues);
    if (currentBestFitness > bestFitness) {
      bestFitness = currentBestFitness;
      stagnation = 0;
    } else {
      stagnation++;
    }

    // 🔥 PYTHON UYUMLU: Stagnation handling
    if (stagnation >= STAGNATION_LIMIT) {
      const bestRouteIndex = fitnessValues.indexOf(Math.max(...fitnessValues));
      const bestRoute = [...population[bestRouteIndex]];
      
      population = [bestRoute];
      
      // Yeni popülasyon üret
      while (population.length < populationSize) {
        if (Math.random() < 0.5) {
          // Must-visit tabanlı route
          const route = [...mustVisitIndices];
          const remainingSlots = Math.min(MAX_ROUTE_LENGTH - route.length, categoryIndices.length);
          if (remainingSlots > 0) {
            const randomCategories = shuffle(categoryIndices).slice(0, remainingSlots);
            route.push(...randomCategories);
          }
          population.push(shuffle(route));
        } else {
          // Tamamen rastgele
          const allIndices = Array.from({ length: locations.length }, (_, i) => i);
          const randomRoute = shuffle(allIndices).slice(0, Math.min(allIndices.length, MAX_ROUTE_LENGTH));
          population.push(randomRoute);
        }
      }

      fitnessValues = population.map(route =>
        calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategories, niceToHaveIds)
      );
      stagnation = 0;
    }
  }

  const bestIndex = fitnessValues.indexOf(Math.max(...fitnessValues));
  const bestRoute = population[bestIndex];
  
  logRouteDetails(bestRoute, locations);
  return bestRoute;
}

module.exports = geneticAlgorithm;