function tournamentSelection(population, fitnessValues, tournamentSize = 7) {
  if (!population.length) return [];
  tournamentSize = Math.min(tournamentSize, population.length);
  const indices = Array.from({ length: tournamentSize }, () => Math.floor(Math.random() * population.length));
  const bestIdx = indices.reduce((a, b) => fitnessValues[a] > fitnessValues[b] ? a : b);
  return [...population[bestIdx]];
}
module.exports = tournamentSelection;
