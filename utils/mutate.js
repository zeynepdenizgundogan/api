function mutate(route, mutationRate = 0.4) {
  if (!route || route.length < 2) return;

  if (Math.random() < mutationRate) {
    const i = Math.floor(Math.random() * route.length);
    let j = Math.floor(Math.random() * route.length);

    // i ve j farklı olana kadar yeniden seç
    while (j === i) {
      j = Math.floor(Math.random() * route.length);
    }
    
    // Swap işlemi
    const temp = route[i];
    route[i] = route[j];
    route[j] = temp;
  }
}

module.exports = mutate;
