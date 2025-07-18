module.exports = {
    initMemory() {
        if (!Memory.creeps) {
            Memory.creeps = {};
        }
        if (!Memory.rooms) {
            Memory.rooms = {};
        }
        if (!Memory.scouting) {
            Memory.scouting = {};
        }
        if (!Memory.scouting.queue) {
            Memory.scouting.queue = [];
        }
    },
    cleanCreepsMemory() {
        for (const name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
    }
};
