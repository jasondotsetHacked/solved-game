module.exports = {
    run: function(turret) {
        const hostiles = turret.room.find(FIND_HOSTILE_CREEPS);

        if (hostiles.length > 0) {
            const target = turret.pos.findClosestByRange(hostiles);

            turret.attack(target);
        }
    }
};
