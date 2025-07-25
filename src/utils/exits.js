function findExitMiddles(roomName) {
  const room = Game.rooms[roomName];
  if (!room) return null;

  const exits = room.find(FIND_EXIT);
  const groups = { top: [], right: [], bottom: [], left: [] };
  for (const pos of exits) {
    if (pos.y === 0) groups.top.push(pos);
    else if (pos.x === 49) groups.right.push(pos);
    else if (pos.y === 49) groups.bottom.push(pos);
    else if (pos.x === 0) groups.left.push(pos);
  }

  const centers = {};
  for (const [direction, positions] of Object.entries(groups)) {
    if (!positions.length) continue;
    const sorted = positions.sort((a, b) =>
      direction === 'top' || direction === 'bottom' ? a.x - b.x : a.y - b.y
    );
    const ranges = [];
    let current = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (
        (direction === 'top' || direction === 'bottom')
          ? curr.x === prev.x + 1
          : curr.y === prev.y + 1
      ) {
        current.push(curr);
      } else {
        ranges.push(current);
        current = [curr];
      }
    }
    ranges.push(current);

    centers[direction] = ranges.map(list => {
      const idx = Math.floor(list.length / 2);
      const p = list[idx];
      return { x: p.x, y: p.y, roomName: roomName };
    });
  }

  return centers;
}

module.exports = {
  findExitMiddles
};
