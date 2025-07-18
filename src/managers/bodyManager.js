// manager for constructing creep body arrays based on role and energy capacity
module.exports = {
  /**
   * Build a body array for a given role using available energy
   * @param {string} role
   * @param {number} energy - energy capacity available in room
   * @returns {BodyPartConstant[]}
   */
  buildBody(role, energy) {
    switch (role) {
      case 'scout':
        return [MOVE];
      case 'worker': {
        const template = [WORK, CARRY, MOVE];
        const parts = [];
        let remaining = energy;
        let idx = 0;
        while (true) {
          const part = template[idx % template.length];
          const cost = part === WORK ? 100 : 50;
          if (remaining >= cost) {
            parts.push(part);
            remaining -= cost;
            idx++;
          } else {
            break;
          }
        }
        return parts;
      }
      case 'stationaryHarvester': {
        // Reserve energy for one CARRY and one MOVE, use rest for WORK parts
        const carryCost = 50;
        const moveCost = 50;
        const workCost = 100;
        const reserved = carryCost + moveCost;
        let remaining = energy - reserved;
        const parts = [];
        const numWork = remaining > 0 ? Math.floor(remaining / workCost) : 0;
        for (let i = 0; i < numWork; i++) {
          parts.push(WORK);
        }
        // Add carry and move parts
        parts.push(CARRY);
        parts.push(MOVE);
        return parts;
      }
      case 'repair': {
        // Build repair creep: balance work for repairing and carry for energy transport
        const template = [WORK, CARRY, MOVE];
        const parts = [];
        let remaining = energy;
        let idx = 0;
        while (true) {
          const part = template[idx % template.length];
          const cost = part === WORK ? 100 : 50;
          if (remaining < cost) break;
          parts.push(part);
          remaining -= cost;
          idx++;
        }
        return parts;
      }
      case 'hauler': {
        // Build hauler creep: maximize carry and move parts
        const parts = [];
        let remaining = energy;
        while (remaining >= 100) {
          parts.push(CARRY);
          parts.push(MOVE);
          remaining -= 100;
        }
        if (remaining >= 50) parts.push(CARRY);
        return parts;
      }
      case 'filler': {
        // Filler: transport energy to structures, balance carry and move
        const parts = [];
        let remaining = energy;
        while (remaining >= 100) {
          parts.push(CARRY);
          parts.push(MOVE);
          remaining -= 100;
        }
        if (remaining >= 50) parts.push(CARRY);
        return parts;
      }
      case 'upgrader': {
        // Upgrader: balanced work, carry, and move
        const template = [WORK, CARRY, MOVE];
        const parts = [];
        let remaining = energy;
        let idx = 0;
        while (true) {
          const part = template[idx % template.length];
          const cost = part === WORK ? 100 : 50;
          if (remaining < cost) break;
          parts.push(part);
          remaining -= cost;
          idx++;
        }
        return parts;
      }
      case 'builder': {
        // Builder: balanced work, carry, and move
        const template = [WORK, CARRY, MOVE];
        const parts = [];
        let remaining = energy;
        let idx = 0;
        while (true) {
          const part = template[idx % template.length];
          const cost = part === WORK ? 100 : 50;
          if (remaining < cost) break;
          parts.push(part);
          remaining -= cost;
          idx++;
        }
        return parts;
      }
      case 'repairer': {
        // Repairer: similar to builder but emphasizes work
        const template = [WORK, WORK, CARRY, MOVE];
        const parts = [];
        let remaining = energy;
        let idx = 0;
        while (true) {
          const part = template[idx % template.length];
          const cost = part === WORK ? 100 : 50;
          if (remaining < cost) break;
          parts.push(part);
          remaining -= cost;
          idx++;
        }
        return parts;
      }
      default:
        return [];
    }
  }
};
