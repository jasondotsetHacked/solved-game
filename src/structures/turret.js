// Turret module to repel unwanted creeps or invaders

module.exports = {
    run: function(turret) {
        // Find hostile creeps in the room
        const hostiles = turret.room.find(FIND_HOSTILE_CREEPS);

        if (hostiles.length > 0) {
            // Prioritize the closest hostile creep
            const target = turret.pos.findClosestByRange(hostiles);

            // Attack the target if the turret is not on cooldown
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