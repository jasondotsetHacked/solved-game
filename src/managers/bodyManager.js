const ROLE_CATALOG = require('managers_roleDefinitions');

module.exports = {
  buildBody(role, energyBudget) {
    if (energyBudget <= 0) return [];

    const definition = ROLE_CATALOG[role];
    if (!definition) return [];

    const template = Array.isArray(definition.template) ? definition.template : [];
    if (template.length === 0) return [];

    const minimumEnergy = definition.minimumEnergy || 0;
    const maximumEnergy = definition.maximumEnergy || energyBudget;
    const targetEnergy = Math.min(energyBudget, maximumEnergy);

    if (targetEnergy < minimumEnergy) return [];

    const basePattern = definition.basePattern || template;
    const baseCost = costOf(basePattern);
    if (baseCost > targetEnergy) {
      if (definition.allowPartial === false) return [];
      return buildPartial(template, targetEnergy);
    }

    const body = basePattern.slice();
    let remainingEnergy = targetEnergy - baseCost;

    const repeatPattern = definition.repeatPattern || template;
    const repeatCost = costOf(repeatPattern);
    const maxRepeats = definition.maxRepeats || Infinity;
    let repeats = 0;

    while (repeatCost > 0 && remainingEnergy >= repeatCost && repeats < maxRepeats) {
      body.push(...repeatPattern);
      remainingEnergy -= repeatCost;
      repeats += 1;
    }

    const extras = definition.extras || template;
    for (const part of extras) {
      const partCost = BODYPART_COST[part];
      if (partCost <= remainingEnergy) {
        body.push(part);
        remainingEnergy -= partCost;
      }
    }

    return body;
  }
};

function costOf(parts) {
  return parts.reduce((sum, part) => sum + (BODYPART_COST[part] || 0), 0);
}

function buildPartial(pattern, energyBudget) {
  const body = [];
  let remainingEnergy = energyBudget;
  let hasMove = false;
  const moveCost = BODYPART_COST[MOVE];

  for (const part of pattern) {
    const partCost = BODYPART_COST[part];
    if (partCost > remainingEnergy) continue;
    const reserveForMove = !hasMove && part !== MOVE && remainingEnergy - partCost < moveCost;
    if (reserveForMove) continue;
    if (part === MOVE) hasMove = true;
    body.push(part);
    remainingEnergy -= partCost;
  }

  if (!hasMove && remainingEnergy >= moveCost) {
    body.push(MOVE);
    remainingEnergy -= moveCost;
    hasMove = true;
  }

  if (!hasMove && body.length > 0) {
    const reclaimed = body.pop();
    remainingEnergy += BODYPART_COST[reclaimed];
    if (remainingEnergy >= moveCost) {
      body.push(MOVE);
      remainingEnergy -= moveCost;
      hasMove = true;
    }
  }

  if (!hasMove && energyBudget >= moveCost) {
    return [MOVE];
  }

  return body;
}
