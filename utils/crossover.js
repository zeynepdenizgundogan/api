function crossover(parent1, parent2) {
    const size = Math.min(parent1.length, parent2.length);
    if (size === 0) return [];
  
    const start = size > 1 ? Math.floor(Math.random() * size) : 0;
    const end = size > 1 ? Math.floor(Math.random() * (size - start)) + start : 0;
  
    const child = Array(size).fill(-1);
  
    for (let i = start; i <= end; i++) {
      if (i < parent1.length) {
        child[i] = parent1[i];
      }
    }
  
    const used = new Set(child.filter(id => id !== -1));
    const unusedFromParent2 = parent2.filter(id => !used.has(id));
  
    for (let i = 0; i < size; i++) {
      if (child[i] === -1) {
        if (unusedFromParent2.length) {
          child[i] = unusedFromParent2.shift();
        } else {
          const all = Array.from(new Set([...parent1, ...parent2]));
          const remaining = all.filter(id => !child.includes(id));
          child[i] = remaining.length ? remaining[Math.floor(Math.random() * remaining.length)] : parent1[0];
        }
      }
    }
  
    return child;
  }
  
  module.exports = { crossover };
  