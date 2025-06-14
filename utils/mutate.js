function mutate(route, mutationRate = 0.1) {
  if (route.length < 2 || Math.random() > mutationRate) return;
  const [i, j] = [
    Math.floor(Math.random() * route.length),
    Math.floor(Math.random() * route.length)
  ];
  [route[i], route[j]] = [route[j], route[i]];
}

module.exports = mutate;
