function crossover(parent1, parent2) {
  if (!parent1 || !parent2 || parent1.length === 0 || parent2.length === 0) {
    return parent1 && parent1.length > 0 ? [...parent1] : [...parent2];
  }

  const size = Math.min(parent1.length, parent2.length);
  if (size === 0) return [];

  // Python'daki crossover mantığı
  const start = size > 1 ? Math.floor(Math.random() * size) : 0;
  const end = size > 1 ? Math.floor(Math.random() * (size - start)) + start : 0;

  const child = new Array(size).fill(-1);

  // Parent1'den belirli aralığı kopyala
  for (let i = start; i <= end && i < parent1.length; i++) {
    child[i] = parent1[i];
  }

  // Kullanılan lokasyonları takip et
  const usedLocations = child.filter(loc => loc !== -1);
  
  // Parent2'den kullanılmayanları ekle
  const unusedFromParent2 = parent2.filter(loc => !usedLocations.includes(loc));

  // Boş yerleri doldur
  for (let i = 0; i < size; i++) {
    if (child[i] === -1) {
      if (unusedFromParent2.length > 0) {
        child[i] = unusedFromParent2.shift();
      } else {
        // Eğer parent2'den de yoksa, herhangi bir lokasyonu kullan
        const maxLoc = Math.max(...parent1, ...parent2);
        const allLocations = Array.from({length: maxLoc + 1}, (_, i) => i);
        const available = allLocations.filter(loc => !child.includes(loc));
        if (available.length > 0) {
          child[i] = available[Math.floor(Math.random() * available.length)];
        } else {
          child[i] = parent1[Math.floor(Math.random() * parent1.length)];
        }
      }
    }
  }

  return child.filter(gene => gene !== -1);
}
module.exports = crossover;
