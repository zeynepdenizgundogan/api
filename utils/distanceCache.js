// utils/distanceCache.js
const calculateDistance = require('./distance');

class DistanceCache {
  constructor() {
    this.cache = new Map();
    this.hitCount = 0;
    this.missCount = 0;
  }

  getKey(loc1Id, loc2Id) {
    // Sıralı key oluştur (1-2 ile 2-1 aynı)
    return loc1Id < loc2Id ? `${loc1Id}-${loc2Id}` : `${loc2Id}-${loc1Id}`;
  }

  getDistance(loc1, loc2) {
    if (loc1.id === loc2.id) return 0;
    
    const key = this.getKey(loc1.id, loc2.id);
    
    if (this.cache.has(key)) {
      this.hitCount++;
      return this.cache.get(key);
    }
    
    this.missCount++;
    const distance = calculateDistance(
      loc1.latitude, 
      loc1.longitude, 
      loc2.latitude, 
      loc2.longitude
    );
    
    this.cache.set(key, distance);
    return distance;
  }

  getStats() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total * 100).toFixed(2) : 0;
    return {
      hits: this.hitCount,
      misses: this.missCount,
      total: total,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size
    };
  }

  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// Singleton instance
const distanceCache = new DistanceCache();

module.exports = distanceCache;