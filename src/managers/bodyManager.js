const { ROLE_DEFINITIONS } = require('managers_colony');
// manager for constructing creep body arrays based on role and energy capacity

module.exports = {
  buildBody(role, energy) {
    const def = ROLE_DEFINITIONS.find(d => d.role === role);
    if (!def) {
      return [];
    }
    const template = def.template;
    const body = [];
    let remainingEnergy = energy;
    const templateCost = template.reduce((sum, part) => sum + BODYPART_COST[part], 0);
    // If we don't have enough energy for a full template, add as many parts as possible
    if (templateCost > remainingEnergy) {
      for (const part of template) {
        if (BODYPART_COST[part] <= remainingEnergy) {
          body.push(part);
          remainingEnergy -= BODYPART_COST[part];
        }
      }
      return body;
    }
    // Add full template sets while possible
    while (remainingEnergy >= templateCost) {
      body.push(...template);
      remainingEnergy -= templateCost;
    }
    // Fill remaining energy with additional parts from the template
    for (const part of template) {
      if (BODYPART_COST[part] <= remainingEnergy) {
        body.push(part);
        remainingEnergy -= BODYPART_COST[part];
      }
    }
    return body;
  }
};
