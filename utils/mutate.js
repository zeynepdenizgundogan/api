function mutate(route, mutationRate = 0.4) {
    if (route.length < 2) return;
  
    if (Math.random() < mutationRate) {
      const [i, j] = randomPair(route.length);
      [route[i], route[j]] = [route[j], route[i]];
    }
  }
  
  function randomPair(length) {
    const i = Math.floor(Math.random() * length);
    let j = Math.floor(Math.random() * length);
    while (j === i) {
      j = Math.floor(Math.random() * length);
    }
    return [i, j];
  }
  
  module.exports = { mutate };
  