class Preference {
    constructor({ type, duration, startDate, endDate, userId, niceToHavePlaces, startLat, startLon, city }) {
      this.type = type;
      this.duration = duration;
      this.startDate = new Date(startDate);
      this.endDate = new Date(endDate);
      this.userId = userId;
      this.niceToHavePlaces = niceToHavePlaces || [];
      this.startHour = 10; // Varsayılan
      this.totalHours = 7; // Varsayılan
      this.startLat = startLat || 41.0370; // Varsayılan: Taksim
      this.startLon = startLon || 28.9850; // Varsayılan: Taksim
      this.city = city || 'Istanbul'; // Varsayılan şehir
    }

    getDayStrings() {
      const days = [];
      const current = new Date(this.startDate);
      for (let i = 0; i < this.duration; i++) {
        const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
        days.push(dayName);
        current.setDate(current.getDate() + 1);
      }
      return days;
    }
}

module.exports = Preference;