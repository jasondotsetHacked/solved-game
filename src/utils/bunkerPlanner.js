// bestBunkerFit.js

const bunkerMaskPattern = [
    '0XXXXX',
    'XXXXXX',
    'XXXXXX',
    'XXXXXX',
    '0XXXXX',
    '0XXXXX',
    '000XX0'
];

const fetchJson = url =>
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
            return response.json();
        });

const fetchEncodedTerrain = (shard, room) =>
    fetchJson(
        `http://localhost:21025/api/game/room-terrain?shard=${encodeURIComponent(shard)}&room=${encodeURIComponent(room)}&encoded=1`
    ).then(data => data.terrain[0].terrain);

const fetchRoomObjects = (shard, room) =>
    fetchJson(
        `http://localhost:21025/api/game/room-objects?shard=${encodeURIComponent(shard)}&room=${encodeURIComponent(room)}`
    ).then(data => data.objects);

const terrainStringToGrid = terrainString =>
    Array.from({ length: 50 }, (_, row) =>
        terrainString.slice(row * 50, row * 50 + 50).split('')
    );

const overlayObjects = (grid, objects) => {
    objects.forEach(({ x, y }) => {
        grid[y][x] = 'X';
    });
    return grid;
};

const parseMask = pattern =>
    pattern.map(row => row.split(''));

const rotate90 = matrix =>
    matrix[0].map((_, col) =>
        matrix.map(row => row[col]).reverse()
    );

const generateMaskOrientations = pattern => {
    const base = parseMask(pattern);
    const orientations = [base];
    for (let i = 1; i < 4; i++) {
        orientations.push(rotate90(orientations[i - 1]));
    }
    return orientations;
};

const isBuildable = cell =>
    cell === '0' || cell === '2';

const canPlaceMask = (grid, mask, offsetX, offsetY) => {
    for (let y = 0; y < mask.length; y++) {
        for (let x = 0; x < mask[0].length; x++) {
            if (!isBuildable(grid[offsetY + y][offsetX + x])) {
                return false;
            }
        }
    }
    return true;
};

const findMaskPlacements = (grid, pattern) => {
    const orientations = generateMaskOrientations(pattern);
    const placements = [];

    orientations.forEach((mask, rotIndex) => {
        const h = mask.length;
        const w = mask[0].length;
        const maxY = grid.length - h;
        const maxX = grid[0].length - w;

        for (let y = 0; y <= maxY; y++) {
            for (let x = 0; x <= maxX; x++) {
                if (canPlaceMask(grid, mask, x, y)) {
                    placements.push({ x, y, rotation: rotIndex * 90 });
                }
            }
        }
    });

    return placements;
};

const findRoomTargets = objects => {
    const sources = [];
    let controller = null;
    let mineral = null;

    for (const obj of objects) {
        if (obj.type === 'source') sources.push(obj);
        if (obj.type === 'controller') controller = obj;
        if (obj.type === 'mineral') mineral = obj;
    }

    return { sources, controller, mineral };
};

const computeDistance = (a, b) =>
    Math.hypot(a.x - b.x, a.y - b.y);

const getMaskCenter = (placement, mask) => ({
    x: placement.x + mask[0].length / 2,
    y: placement.y + mask.length / 2
});

const scorePlacement = (placement, mask, targets) => {
    const center = getMaskCenter(placement, mask);
    const distances = [];

    if (targets.controller) distances.push(computeDistance(center, targets.controller));
    if (targets.mineral) distances.push(computeDistance(center, targets.mineral));
    for (const src of targets.sources) {
        distances.push(computeDistance(center, src));
    }

    if (distances.length < 2) {
        return { variation: Infinity, average: Infinity };
    }

    const maxDist = Math.max(...distances);
    const minDist = Math.min(...distances);
    const sum = distances.reduce((sum, d) => sum + d, 0);

    return {
        variation: maxDist - minDist,
        average: sum / distances.length
    };
};

const findOptimalPlacement = (grid, pattern, objects) => {
    const placements = findMaskPlacements(grid, pattern);
    const targets = findRoomTargets(objects);
    const orientations = generateMaskOrientations(pattern);

    return placements
        .map(p => {
            const maskIndex = p.rotation / 90;
            const maskScore = scorePlacement(p, orientations[maskIndex], targets);
            return { ...p, ...maskScore };
        })
        .sort((a, b) =>
            a.variation - b.variation ||
            a.average - b.average
        )[0] || null;
};

async function findBestBunkerFit(shard, room) {
    const [terrainString, objects] = await Promise.all([
        fetchEncodedTerrain(shard, room),
        fetchRoomObjects(shard, room)
    ]);

    const baseGrid = terrainStringToGrid(terrainString);
    const grid = overlayObjects(baseGrid, objects);
    const best = findOptimalPlacement(grid, bunkerMaskPattern, objects);

    if (best) {
        console.log('Best fit found at:', best);
    } else {
        console.log('No valid placement found.');
    }

    return best;
}

findBestBunkerFit('shard3', 'W1N5').catch(console.error);