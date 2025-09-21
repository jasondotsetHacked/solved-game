const ROLE_CATALOG = require('managers_roleDefinitions');

module.exports = {
  buildBody(role, energyBudget) {
    if (energyBudget <= 0) return [];

    const definition = ROLE_CATALOG[role];
    if (!definition) return [];

    const minimumEnergy = definition.minimumEnergy || 0;
    const maximumEnergy = definition.maximumEnergy || energyBudget;
    const targetEnergy = Math.min(energyBudget, maximumEnergy);

    if (targetEnergy < minimumEnergy) return [];

    if (definition.tiers && definition.tiers.length > 0) {
      const tiers = definition.tiers.slice().sort((a, b) => a.energy - b.energy);
      let selected = null;
      for (const tier of tiers) {
        if (tier.energy <= targetEnergy) {
          selected = tier;
        } else {
          break;
        }
      }
      if (!selected) return [];
      return selected.body.slice();
    }

    const template = Array.isArray(definition.template) ? definition.template : [];
    if (template.length === 0) return [];

    const basePattern = definition.basePattern || template;
    const baseCost = costOf(basePattern);
    if (baseCost > targetEnergy) {
      if (definition.allowPartial === false) return [];
      return buildPartial(template, targetEnergy, definition);
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

function buildPartial(pattern, energyBudget, definition) {
  const body = [];
  let remainingEnergy = energyBudget;
  let hasMove = false;
  let hasWork = false;
  let hasCarry = false;
  const moveCost = BODYPART_COST[MOVE];

  for (const part of pattern) {
    const partCost = BODYPART_COST[part];
    if (partCost > remainingEnergy) continue;
    const reserveForMove = !hasMove && part !== MOVE && remainingEnergy - partCost < moveCost;
    if (reserveForMove) continue;
    if (part === MOVE) hasMove = true;
    if (part === WORK) hasWork = true;
    if (part === CARRY) hasCarry = true;
    body.push(part);
    remainingEnergy -= partCost;
  }

  if (!hasMove && remainingEnergy >= moveCost) {
    body.push(MOVE);
    remainingEnergy -= moveCost;
    hasMove = true;
  }

  if ((!hasWork || !hasCarry) && definition && Array.isArray(definition.fallbackParts)) {
    const fallback = definition.fallbackParts.filter(part => {
      const cost = BODYPART_COST[part];
      return cost <= remainingEnergy;
    });
    for (const part of fallback) {
      body.push(part);
      remainingEnergy -= BODYPART_COST[part];
      if (part === WORK) hasWork = true;
      if (part === CARRY) hasCarry = true;
      if (part === MOVE) hasMove = true;
    }
  }

  if ((!hasWork || !hasCarry) && remainingEnergy >= moveCost) {
    body.push(MOVE);
    hasMove = true;
  }

  if ((!hasWork || !hasCarry) && energyBudget >= 200) {
    return [WORK, CARRY, MOVE];
  }

  if (!hasMove && energyBudget >= moveCost) {
    return [MOVE];
  }

  return body;
}
