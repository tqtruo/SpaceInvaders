class Entity extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y, key) {
		super(scene, x, y, key);
		this.scene.add.existing(this);
		this.scene.physics.world.enableBody(this, 0);
	}
}

///Classes extend the entity class above, which comes from the build in sprite objects from Phaser
//Scene is the state/current screen
class Player extends Entity {
	constructor(scene, x, y) {
		super(scene, x, y, 'sprPlayer');
		this.setScale(2);
	}
}

class LaserPlayer extends Entity {
	constructor(scene, x, y) {
		super(scene, x, y, 'sprLaserPlayer');
	}
}

class LaserEnemy extends Entity {
	constructor(scene, x, y, key) {
		super(scene, x, y, 'sprLaserEnemy');
	}
}

class Enemy extends Entity {
	constructor(scene, x, y, key) {
		super(scene, x, y, key);
		this.setOrigin(0, 0); //If just 0, then will set for both x and y
	}
}

class Explosion extends Entity {
	constructor(scene, x, y) {
		super(scene, x, y, 'sprExplosion');
		this.play('sprExplosion');
		this.setOrigin(0, 0);
		this.setScale(2);
		this.on('animationcomplete', function() {
			if (this) {
				this.destroy();
			}
		});
	}
}
