const calculateFitness = require("../utils/calculateFitness");
const crossover = require("../utils/crossover");
const mutate = require("../utils/mutate");
const tournamentSelection = require("../utils/tournamentSelection");
const {
  MAX_ROUTE_LENGTH,
  STAGNATION_LIMIT,
  MAX_DISTANCE_THRESHOLD, // Eklendi
  DEFAULT_START_HOUR,
  DEFAULT_TOTAL_HOURS
} = require("../utils/constants");

function geneticAlgorithm(locations, distanceMatrix, day, startHour = DEFAULT_START_HOUR, totalHours = DEFAULT_TOTAL_HOURS, selectedCategories) {
  console.log("🧬 geneticAlgorithm başladı", { locCount: locations.length, day });

  
  if (!locations || locations.length === 0) return [];

  const populationSize = 100; // 300 yerine
  const generations = 100; // 500 yerine
  const eliteCount = 10; // 30 yerine
  const tournamentSize = 5; // 7 yerine
  const mutationRate = 0.4;

  const mustVisitIndices = locations.map((loc, i) => ({ loc, i }))
    .filter(({ loc }) => loc.must_visit && loc.distance_to_start <= MAX_DISTANCE_THRESHOLD)
    .map(({ i }) => i);

  console.log('📍 Must-visit indices:', mustVisitIndices.map(i => ({
    id: locations[i].id,
    name: locations[i].name,
    distance_to_start: locations[i].distance_to_start.toFixed(2)
  })));

  const categoryIndices = locations.map((loc, i) => ({ loc, i }))
    .filter(({ loc, i }) => {
      const categories = Array.isArray(loc.category) ? loc.category : [loc.category];
      return categories.some(cat => selectedCategories.includes(cat.toLowerCase()))
        && !mustVisitIndices.includes(i);
    })
    .map(({ i }) => i);

  const otherIndices = locations.map((_, i) => i)
    .filter(i => !mustVisitIndices.includes(i) && !categoryIndices.includes(i));

  console.log("🧬 mustVisitIndices:", mustVisitIndices.length);
  console.log("🧬 categoryIndices:", categoryIndices.length);
  console.log("🧬 otherIndices:", otherIndices.length);

  let population = [];
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  for (let i = 0; i < populationSize / 4; i++) {
    let route = mustVisitIndices.length ? [...mustVisitIndices] : [];
    if (categoryIndices.length && route.length < MAX_ROUTE_LENGTH) {
      route.push(categoryIndices[Math.floor(Math.random() * categoryIndices.length)]);
    } else if (otherIndices.length && route.length === 0) {
      route.push(otherIndices[Math.floor(Math.random() * otherIndices.length)]);
    }
    population.push(shuffle(route));
  }

  for (let i = 0; i < populationSize / 4; i++) {
    let route = [...mustVisitIndices];
    if (categoryIndices.length && route.length < MAX_ROUTE_LENGTH) {
      route.push(categoryIndices[Math.floor(Math.random() * categoryIndices.length)]);
    }
    population.push(shuffle(route));
  }

  for (let i = 0; i < populationSize / 4; i++) {
    let route = [...mustVisitIndices];
    let remaining = Math.min(MAX_ROUTE_LENGTH - route.length, categoryIndices.length);
    route.push(...shuffle([...categoryIndices]).slice(0, remaining));
    remaining = Math.min(MAX_ROUTE_LENGTH - route.length, otherIndices.length);
    route.push(...shuffle([...otherIndices]).slice(0, remaining));
    population.push(shuffle(route));
  }

  while (population.length < populationSize) {
    let indices = [...Array(locations.length).keys()];
    population.push(shuffle(indices).slice(0, MAX_ROUTE_LENGTH));
  }

  let fitnessValues = population.map(route =>
    calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategories)
  );

  let bestFitness = Math.max(...fitnessValues);
  let stagnationCounter = 0;

  for (let gen = 0; gen < generations; gen++) {
    console.log(`🧬 Jenerasyon: ${gen}/${generations}`);
    const sortedIndices = [...fitnessValues.keys()].sort((a, b) => fitnessValues[b] - fitnessValues[a]);
    const newPopulation = sortedIndices.slice(0, eliteCount).map(i => [...population[i]]);

    while (newPopulation.length < populationSize) {
      const parent1 = tournamentSelection(population, fitnessValues, tournamentSize);
      const parent2 = tournamentSelection(population, fitnessValues, tournamentSize);
      let child = crossover(parent1, parent2);
      mutate(child, mutationRate);

      if (child.length > MAX_ROUTE_LENGTH) {
        const must = child.filter(idx => mustVisitIndices.includes(idx));
        const cat = child.filter(idx => categoryIndices.includes(idx) && !must.includes(idx));
        const other = child.filter(idx => !must.includes(idx) && !cat.includes(idx));

        let newChild = [...must];
        let remain = Math.min(MAX_ROUTE_LENGTH - newChild.length, cat.length);
        newChild.push(...cat.slice(0, remain));
        remain = Math.min(MAX_ROUTE_LENGTH - newChild.length, other.length);
        newChild.push(...other.slice(0, remain));

        child = newChild;
      }

      newPopulation.push(child);
    }

    population = newPopulation;
    fitnessValues = population.map(route =>
      calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategories)
    );

    const currentBest = Math.max(...fitnessValues);
    if (currentBest > bestFitness) {
      bestFitness = currentBest;
      stagnationCounter = 0;
    } else {
      stagnationCounter++;
    }

    if (stagnationCounter >= STAGNATION_LIMIT) {
      const bestRoute = [...population[fitnessValues.indexOf(currentBest)]];
      population = [bestRoute];

      while (population.length < populationSize) {
        let route;
        if (Math.random() < 0.5) {
          route = [...mustVisitIndices];
          let remaining = Math.min(MAX_ROUTE_LENGTH - route.length, categoryIndices.length);
          route.push(...shuffle([...categoryIndices]).slice(0, remaining));
        } else {
          let indices = [...Array(locations.length).keys()];
          route = shuffle(indices).slice(0, MAX_ROUTE_LENGTH);
        }
        population.push(route);
      }

      fitnessValues = population.map(route =>
        calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategories)
      );

      stagnationCounter = 0;
    }
  }

  const bestIndex = fitnessValues.indexOf(Math.max(...fitnessValues));
  console.log('🧬 geneticAlgorithm tamamlandı');
  return population[bestIndex];
}

module.exports = geneticAlgorithm; 