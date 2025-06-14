
function crossover(parent1, parent2) {
  const size = Math.min(parent1.length, parent2.length);
  if (size === 0) return [];
  const start = size > 1 ? Math.floor(Math.random() * size) : 0;
  const end = size > 1 ? Math.floor(Math.random() * (size - start)) + start : 0;
  const child = Array(size).fill(-1);

  for (let i = start; i <= end; i++) {
    if (i < parent1.length) child[i] = parent1[i];
  }

  const used = new Set(child.filter((i) => i !== -1));
  const unused = parent2.filter((i) => !used.has(i));

  for (let i = 0; i < size; i++) {
    if (child[i] === -1) {
      child[i] = unused.length > 0 ? unused.shift() : parent1[Math.floor(Math.random() * parent1.length)];
    }
  }

  return child;
}
module.exports = crossover;
