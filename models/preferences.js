// preference.js

class Preference {
    constructor({ type, duration, startDate, endDate, userId, niceToHavePlaces }) {
      this.type = type; // Örn: "adventure", "food", "historic"
      this.duration = duration; // Gün cinsinden
      this.startDate = new Date(startDate);
      this.endDate = new Date(endDate);
      this.userId = userId;
      this.niceToHavePlaces = niceToHavePlaces || [];
    }
  
    // İsteğe bağlı: startDate ve duration'dan gün gün array çıkarabiliriz
    getDayStrings() {
      const days = [];
      const current = new Date(this.startDate);
      for (let i = 0; i < this.duration; i++) {
        const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
        days.push(dayName);
        current.setDate(current.getDate() + 1);
      }
      return days; // Örn: ["Saturday", "Sunday", "Monday"]
    }
  }
  
  module.exports = Preference;
  