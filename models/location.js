// location.js

class Location {
    constructor({
      id,
      name,
      latitude,
      longitude,
      distance_to_start,
      must_visit,
      category,
      category_match,
      score,
      visit_duration,
      opening_hours
    }) {
      this.id = id;
      this.name = name;
      this.latitude = latitude;
      this.longitude = longitude;
      this.distanceToStart = distance_to_start;
      this.mustVisit = must_visit;
      this.category = category;
      this.categoryMatch = category_match;
      this.score = score;
      this.visitDuration = visit_duration;
      this.openingHours = opening_hours;
    }
  }
  
  module.exports = Location;
  