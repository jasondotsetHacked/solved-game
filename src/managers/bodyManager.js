const ROLE_DEFINITIONS = require('managers_roleDefinitions');

module.exports = {
  buildBody(role, energy) {
    const roleDefinition = ROLE_DEFINITIONS.find(d => d.role === role);
    if (!roleDefinition) {
      return [];
    }
    const template = roleDefinition.template;
    const body = [];
    let remainingEnergy = energy;
    const templateCost = template.reduce((sum, part) => sum + BODYPART_COST[part], 0);
    if (templateCost > remainingEnergy) {
      for (const part of template) {
        if (BODYPART_COST[part] <= remainingEnergy) {
          body.push(part);
          remainingEnergy -= BODYPART_COST[part];
        }
      }
      return body;
    }
    while (remainingEnergy >= templateCost) {
      body.push(...template);
      remainingEnergy -= templateCost;
    }
    for (const part of template) {
      if (BODYPART_COST[part] <= remainingEnergy) {
        body.push(part);
        remainingEnergy -= BODYPART_COST[part];
      }
    }
    return body;
  }
};
