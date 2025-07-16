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
      default:
        return [];
    }
  }
};
