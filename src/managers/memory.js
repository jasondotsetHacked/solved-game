module.exports = {
    initMemory() {
        Memory = {};
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
    }
};
