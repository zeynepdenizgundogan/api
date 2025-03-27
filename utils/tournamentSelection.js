function tournamentSelection(population, fitnessValues, tournamentSize = 7) {
    if (!population || population.length === 0) return [];
  
    tournamentSize = Math.min(tournamentSize, population.length);
    if (tournamentSize < 1) tournamentSize = 1;
  
    const indices = randomSample(population.length, tournamentSize);
    const selectedFitness = indices.map(i => fitnessValues[i]);
    const winnerIdx = indices[selectedFitness.indexOf(Math.max(...selectedFitness))];
  
    return [...population[winnerIdx]];
  }
  
  function randomSample(max, size) {
    const indices = new Set();
    while (indices.size < size) {
      indices.add(Math.floor(Math.random() * max));
    }
    return Array.from(indices);
  }
  
  module.exports = { tournamentSelection };
  