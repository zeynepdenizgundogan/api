const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  title: String, 
  id: Number,
  name: String,
  latitude: Number,
  longitude: Number,
  category: String
});

const daySchema = new mongoose.Schema({
  day: Number,
  route: [placeSchema]
});

const routeSchema = new mongoose.Schema({
  startPlace: {
    id: Number,
    name: String,
    latitude: Number,
    longitude: Number
  },
  duration: Number,
  startDate: Date,
  endDate: Date,
  days: [daySchema], // 👈 gün gün rotalar burada
  userId: { type: String, required: true }
}, { timestamps: true });


module.exports = mongoose.model('Route', routeSchema);
