module.exports = {
    run: function(turret) {
        const hostiles = turret.room.find(FIND_HOSTILE_CREEPS);

        if (hostiles.length > 0) {
            const target = turret.pos.findClosestByRange(hostiles);

            if (turret.attack(target) === ERR_NOT_IN_RANGE){}
        }
    }
};
