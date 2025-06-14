// 📄 logRouteCategories.js
// Rotaların kategorilerini ve must-visit durumlarını loglamak için yardımcı fonksiyon

function logRouteDetails(route, locations) {
  console.log("=== 📍 Route Details ===");
  route.forEach((index, i) => {
    const loc = locations[index];
    if (!loc) {
      console.warn(`⚠️ Invalid index: ${index}`);
      return;
    }
    const cat = loc.category || "(no category)";
    const must = loc.must_visit || false;
    console.log(`${i + 1}. ${loc.name} [${cat}] ${must ? "⭐ MUST VISIT" : ""}`);
  });
  console.log("========================\n");
}

module.exports = logRouteDetails;

// 📦 Kullanım örneği (geneticAlgorithm.js içinde):
// const logRouteDetails = require("../utils/logRouteCategories");
// logRouteDetails(bestRoute, locations);
