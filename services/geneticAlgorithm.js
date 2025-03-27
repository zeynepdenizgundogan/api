const { crossover } = require('../utils/crossover');
const { mutate } = require('../utils/mutate');
const { tournamentSelection } = require('../utils/tournamentSelection');
const { calculateFitness } = require('../utils/calculateFitness');
const { MAX_ROUTE_LENGTH, STAGNATION_LIMIT } = require('../utils/constants');

function geneticAlgorithm(locations, distanceMatrix, day, startHour, totalHours, selectedCategory) {
  if (!locations || locations.length === 0) return [];

  const populationSize = 300;
  const generations = 500;
  const eliteCount = 30;
  const mutationRate = 0.4;

  const mustVisitIndices = locations.map((loc, i) => loc.mustVisit ? i : null).filter(i => i !== null);
  const categoryIndices = locations.map((loc, i) => loc.category === selectedCategory && !mustVisitIndices.includes(i) ? i : null).filter(i => i !== null);
  const otherIndices = locations.map((_, i) => i).filter(i => !mustVisitIndices.includes(i) && !categoryIndices.includes(i));

  let population = [];

  for (let i = 0; i < populationSize; i++) {
    const route = [...mustVisitIndices];
    const extraCategory = shuffle(categoryIndices).slice(0, MAX_ROUTE_LENGTH - route.length);
    const extraOthers = shuffle(otherIndices).slice(0, MAX_ROUTE_LENGTH - route.length - extraCategory.length);
    population.push(shuffle([...route, ...extraCategory, ...extraOthers]).slice(0, MAX_ROUTE_LENGTH));
  }

  let fitnessValues = population.map(route =>
    calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategory)
  );

  let bestFitness = Math.max(...fitnessValues);
  let stagnation = 0;

  for (let gen = 0; gen < generations; gen++) {
    const sortedIndices = fitnessValues.map((val, i) => ({ i, val }))
      .sort((a, b) => b.val - a.val)
      .map(item => item.i);

    const newPopulation = sortedIndices.slice(0, eliteCount).map(i => [...population[i]]);

    while (newPopulation.length < populationSize) {
      const parent1 = tournamentSelection(population, fitnessValues);
      const parent2 = tournamentSelection(population, fitnessValues);
      let child = crossover(parent1, parent2);
      mutate(child, mutationRate);

      if (child.length > MAX_ROUTE_LENGTH) {
        child = child.slice(0, MAX_ROUTE_LENGTH);
      }

      newPopulation.push(child);
    }

    population = newPopulation;
    fitnessValues = population.map(route =>
      calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategory)
    );

    const currentBest = Math.max(...fitnessValues);
    if (currentBest > bestFitness) {
      bestFitness = currentBest;
      stagnation = 0;
    } else {
      stagnation++;
    }

    if (stagnation >= STAGNATION_LIMIT) {
      const bestRoute = population[fitnessValues.indexOf(currentBest)];
      population = [bestRoute];

      while (population.length < populationSize) {
        const route = [
          ...shuffle(mustVisitIndices),
          ...shuffle(categoryIndices).slice(0, MAX_ROUTE_LENGTH - mustVisitIndices.length),
          ...shuffle(otherIndices).slice(0, MAX_ROUTE_LENGTH - mustVisitIndices.length - categoryIndices.length)
        ].slice(0, MAX_ROUTE_LENGTH);

        population.push(route);
      }

      fitnessValues = population.map(route =>
        calculateFitness(route, locations, distanceMatrix, day, startHour, totalHours, selectedCategory)
      );

      stagnation = 0;
    }
  }

  const bestIndex = fitnessValues.indexOf(Math.max(...fitnessValues));
  return population[bestIndex];
}

// Yardımcı: array’i karıştır
function shuffle(array) {
  return array
    .map(val => ({ val, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ val }) => val);
}

module.exports = { geneticAlgorithm };
