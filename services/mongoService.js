require('dotenv').config(); // EN ÜSTTE OLMALI
const { MongoClient } = require("mongodb");
const haversine = require("../utils/haversine");

async function getMongoLocations(preference, initLocation) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("BLG4902");

  const categoryList = preference.type.map(t => t.charAt(0).toUpperCase() + t.slice(1));
  const places = await db.collection("places").find({ category: { $in: categoryList } }).toArray();

  const withDistance = places.map((place, idx) => {
    const distance = haversine(initLocation.lat, initLocation.lng, place.coordinates.lat, place.coordinates.lng);
    return {
      id: idx,
      name: place.name,
      latitude: place.coordinates.lat,
      longitude: place.coordinates.lng,
      distance_to_start: distance,
      must_visit: false,
      category: place.category.toLowerCase(),
      score: place.score,
      visit_duration: place.visit_duration,
      opening_hours: place.opening_hours,
      image_url: place.image_url 
    };
  });

  await client.close();
  return withDistance;
}

module.exports = { getMongoLocations };
console.log('🔍 Mongo URI:', process.env.MONGO_URI);
