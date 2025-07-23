module.exports = {
    run: function(turret) {
        const hostiles = turret.room.find(FIND_HOSTILE_CREEPS);

        if (hostiles.length > 0) {
            const target = turret.pos.findClosestByRange(hostiles);

            if (turret.attack(target) === ERR_NOT_IN_RANGE) {
                console.log(`Turret at ${turret.pos} cannot reach target at ${target.pos}`);
            } else {
                console.log(`Turret at ${turret.pos} is attacking hostile at ${target.pos}`);
            }
        } else {
            console.log(`Turret at ${turret.pos} found no hostiles in room ${turret.room.name}`);
        }
    }
};
