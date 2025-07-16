module.exports = {
    initMemory() {
        if (!Memory.rooms) {
            Memory.rooms = {};
        }
        if (!Memory.scouting) {
            Memory.scouting = {};
        }
    }
};
