class Location {
  constructor({
    id,
    name,
    latitude,
    longitude,
    distance_to_start,
    must_visit,
    category,
    score,
    visit_duration,
    opening_hours,
    rating,
    image_url
  }) {
    this.id = id;
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.distance_to_start = distance_to_start;
    this.must_visit = must_visit;
    this.category = category;
    this.score = score;
    this.visit_duration = visit_duration;
    this.opening_hours = opening_hours;
    this.rating = rating;
    this.image_url = image_url;
  }
}

module.exports = Location;
