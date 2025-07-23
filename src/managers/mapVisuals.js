module.exports = {
    run: function() {
        this.updateMemory();
        this.drawVisuals();
    },

    updateMemory: function() {
        for (const roomName of Object.keys(Game.rooms)) {
            if (!Memory.rooms[roomName]) {
                Memory.rooms[roomName] = {};
            }
            Memory.rooms[roomName].lastVisit = Game.time;
        }
    },

    drawVisuals: function() {
        const visual = Game.map.visual;
        for (const roomName in Memory.rooms) {
            const lastVisit = Memory.rooms[roomName].lastVisit;
            if (lastVisit === undefined) continue;
            const age = Game.time - lastVisit;
            const pos = new RoomPosition(25, 25, roomName);
            visual.text(age.toString(), pos, {
                color: '#ffffff',
                fontSize: 12.0,
                backgroundColor: '#000000',
                backgroundPadding: 5,
                opacity: 0.8,
                align: 'center'
            });
        }
    }
};
