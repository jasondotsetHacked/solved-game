/**
 * Map Visuals Manager
 * Shows time since last visit on each grid cell.
 */

module.exports = {
    /** Main entry point: update memory and draw visuals */
    run: function() {
        this.updateMemory();
        this.drawVisuals();
    },

    /** Record last visit time per room */
    updateMemory: function() {
        // mark current rooms where our creeps are present
        for (const roomName of Object.keys(Game.rooms)) {
            if (!Memory.rooms[roomName]) {
                Memory.rooms[roomName] = {};
            }
            // update last visit tick to now
            Memory.rooms[roomName].lastVisit = Game.time;
        }
    },

    /** Draw one timer per room showing time since last visit */
    drawVisuals: function() {
        const vis = Game.map.visual;
        for (const roomName in Memory.rooms) {
            const lastVisit = Memory.rooms[roomName].lastVisit;
            if (lastVisit === undefined) continue;
            const delta = Game.time - lastVisit;
            // draw at room center on world map view
            const pos = new RoomPosition(25, 25, roomName);
            vis.text(delta.toString(), pos, {
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
