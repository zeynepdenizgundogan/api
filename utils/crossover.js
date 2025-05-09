function crossover(parent1, parent2) {
  const size = Math.min(parent1.length, parent2.length);
  if (size === 0) return [];

  let start = Math.floor(Math.random() * size);
  let end = Math.floor(Math.random() * size);
  if (start > end) [start, end] = [end, start]; // garantili aralık

  const child = new Array(size).fill(-1);
  for (let i = start; i <= end; i++) {
    if (i < parent1.length) {
      child[i] = parent1[i];
    }
  }

  const usedLocations = child.filter(loc => loc !== -1);
  const unusedFromParent2 = parent2.filter(loc => !usedLocations.includes(loc));

  for (let i = 0; i < size; i++) {
    if (child[i] === -1) {
      if (unusedFromParent2.length > 0) {
        child[i] = unusedFromParent2.shift();
      } else {
        const allLocations = Array.from(
          new Set([...parent1, ...parent2])
        );
        const available = allLocations.filter(loc => !child.includes(loc));
        if (available.length > 0) {
          child[i] = available[Math.floor(Math.random() * available.length)];
        } else {
          child[i] = parent1.length > 0
            ? parent1[Math.floor(Math.random() * parent1.length)]
            : 0;
        }
      }
    }
  }

  return child;
}

module.exports = crossover;
