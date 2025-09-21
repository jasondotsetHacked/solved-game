module.exports = {
  run(empire) {
    drawRoomOverlays(empire);
  }
};

function drawRoomOverlays(empire) {
  const visual = Game.map.visual;
  visual.clear();

  for (const [roomName, state] of Object.entries(empire.rooms || {})) {
    const designation = state && state.designation ? state.designation : 'unknown';
    const color = colorForDesignation(designation);
    const center = new RoomPosition(25, 24, roomName);
    const summaryLine = formatEnergyLine(state);

    visual.text(`${roomName} - ${designation}`, center, {
      color,
      fontSize: 4.5,
      align: 'center',
      opacity: 0.8
    });

    if (summaryLine) {
      visual.text(summaryLine, new RoomPosition(25, 28, roomName), {
        color: '#cccccc',
        fontSize: 3.2,
        align: 'center',
        opacity: 0.7
      });
    }

    if (designation === 'capital' || designation === 'colony') {
      visual.circle(new RoomPosition(25, 25, roomName), {
        radius: 23,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 0.6,
        opacity: 0.4
      });
    }
  }
}

function formatEnergyLine(state) {
  if (!state) return '';
  const energyLine = state.energyCapacity ? `${state.energyAvailable}/${state.energyCapacity}` : '';
  const storageLine = state.storageEnergy ? `store ${state.storageEnergy}` : '';
  const creepCount = state.creeps ? Object.values(state.creeps).reduce((sum, count) => sum + count, 0) : 0;
  const creepsLine = creepCount > 0 ? `creeps ${creepCount}` : '';
  return [energyLine, storageLine, creepsLine].filter(Boolean).join(' | ');
}

function colorForDesignation(designation) {
  switch (designation) {
    case 'capital':
      return '#6bffb5';
    case 'colony':
      return '#6bd4ff';
    case 'remote':
      return '#ffcf6b';
    case 'hostile':
      return '#ff6b6b';
    case 'claimable':
      return '#d9ff6b';
    default:
      return '#e0e0e0';
  }
}
