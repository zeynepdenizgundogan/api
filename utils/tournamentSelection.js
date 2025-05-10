function tournamentSelection(population, fitnessValues, tournamentSize = 7) {
  if (!population || population.length === 0) return [];

  tournamentSize = Math.min(tournamentSize, population.length);
  if (tournamentSize < 1) tournamentSize = 1;

  const tournamentIndices = [];
  while (tournamentIndices.length < tournamentSize) {
    const idx = Math.floor(Math.random() * population.length);
    if (!tournamentIndices.includes(idx)) {
      tournamentIndices.push(idx);
    }
  }

  const tournamentFitness = tournamentIndices.map(i => fitnessValues[i]);
  const maxFitness = Math.max(...tournamentFitness);
  const winnerIdx = tournamentIndices[tournamentFitness.indexOf(maxFitness)];

  return [...population[winnerIdx]]; // Kopya döndür
}

module.exports = tournamentSelection;
