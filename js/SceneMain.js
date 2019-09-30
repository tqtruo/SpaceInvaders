class SceneMain extends Phaser.Scene {
	constructor() {
		super({ key: 'SceneMain' });
	}

	init(data) {
		this.passingData = data;
	}

	//Loads all files from content -- images + sounds
	preload() {
		this.load.image('sprPlayer', 'content/sprPlayer.png');
		this.load.spritesheet('sprEnemy0', 'content/sprEnemy0.png', {
			frameWidth: 8,
			frameHeight: 8
		});
		// this.load.image("sprShieldTile", "content/sprShieldTile.png");
		this.load.image('sprLaserEnemy', 'content/sprLaserEnemy.png');
		this.load.image('sprLaserPlayer', 'content/sprLaserPlayer.png');
		this.load.spritesheet('sprExplosion', 'content/sprExplosion.png', {
			frameWidth: 8,
			frameHeight: 8
		});
		this.load.audio('sndExplode', 'content/sndExplode.wav');
		this.load.audio('sndLaserEnemy', 'content/sndLaserEnemy.wav');
		this.load.audio('sndLaserPlayer', 'content/sndLaserPlayer.wav');
		//this.load.audio('sndExplode1', 'content/sndExplode1.wav');
	}

	create() {
		//Checks if the passingData object is empty --> create a new game with lives and sets the score to 0;
		if (Object.getOwnPropertyNames(this.passingData).length === 0 && this.passingData.constructor === Object) {
			this.passingData = {
				maxLives: 3,
				lives: 3,
				score: 0,
				highScore: 0
			};
		}

		//loads all sound effects
		this.sfx = {
			explode: this.sound.add('sndExplode'),
			laserPlayer: this.sound.add('sndLaserPlayer'),
			laserEnemy: this.sound.add('sndLaserEnemy'),
			explodeWall: this.sound.add('sndExplode1')
		};

		//Creates unlimited enemies
		this.anims.create({
			key: 'sprEnemy0',
			frames: this.anims.generateFrameNumbers('sprEnemy0'),
			frameRate: 8,
			repeat: -1 //repeat forever
		});

		//Creates the explosions once
		this.anims.create({
			key: 'sprExplosion',
			frames: this.anims.generateFrameNumbers('sprExplosion')
			//default frameRate: 24,
			//default repeat: 0;
		});

		//Label for the score -- not the actual score value
		this.textLabelScore = this.add.text(32, 32, 'SCORE <1>', {
			fontFamily: 'Arcadepix',
			fontSize: 16,
			align: 'left'
		});

		//score from passingData object -- score is located below the label
		this.textScore = this.add.text(32, 64, this.passingData.score, {
			fontFamily: 'Arcadepix',
			fontSize: 16,
			align: 'left'
		});

		//Label for the Hi-Score -- not teh actual hi-score
		this.textLabelHighScore = this.add.text(180, 32, 'HI-SCORE', {
			fontFamily: 'Arcadepix',
			fontSize: 16,
			align: 'left'
		});

		//Highscore from passData object
		this.textHighScore = this.add.text(180, 64, this.passingData.highScore, {
			fontFamily: 'Arcadepix',
			fontSize: 16,
			align: 'left'
		});

		this.textLabelLives = this.add.text(this.game.config.width * 0.8, 32, 'LIVES', {
			fontFamily: 'Arcadepix',
			fontSize: 16,
			align: 'left'
		});
		this.textLives = this.add.text(this.game.config.width * 0.8, 64, this.passingData.lives);

		/* ******************* MAKING THE PLAYER *******************************/

		this.player = new Player(this, this.game.config.width * 0.5, this.game.config.height - 64);

		//Arrow keys control movement of player
		//this.keyUP = this.input.keyboard.addKey(Phaser.input.Keyboard.KeyCodes.UP);
		//this.keyDOWN = this.input.keyboard.addKey(Phaser.input.Keyboard.KeyCodes.DOWN);
		this.keyLEFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
		this.keyRIGHT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
		this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

		this.playerShootDelay = 50;
		this.playerShootTick = 0;

		//Groups to hold enemies, lasers, explosions, and shield object data
		this.enemies = this.add.group();
		this.enemyLasers = this.add.group();
		this.playerLasers = this.add.group();
		this.explosions = this.add.group();

		//Enemy Movement -- Keeping track of the enemies
		this.lastEnemyMoveDirection = 'LEFT';
		this.enemyMoveDirection = 'RIGHT';

		//Bounding box of the enemies
		this.enemyRectangle = new Phaser.Geom.Rectangle(
			0,
			0,
			Math.round(this.game.config.width / 24 * 0.75) * 24,
			Math.round(this.game.config.height / 20 * 0.25) * 20
		);

		/* ******************* ADDING THE ENEMIES *******************************/
		//Loop through the width and height of the bounding box and create a new enemy

		for (let x = 0; x < Math.round(this.game.config.width / 32); x++) {
			for (let y = 0; y < Math.round(this.game.config.height / 80); y++) {
				let enemy = new Enemy(this, x * 24, 128 + y * 20, 'sprEnemy0');
				enemy.play('sprEnemy0');
				enemy.setScale(2);
				this.enemies.add(enemy);
			}
		}

		this.updateEnemiesMovement();
		this.updateEnemiesShooting();
		this.updatePlayerMovement();
		this.updatePlayerShooting();
		this.updateLasers();
		this.updateMoreEnemies();

		//this.createLivesIcons(); //Need to write

		//collision between player lasers and an enemy
		this.physics.add.overlap(
			this.playerLasers,
			this.enemies,
			function(laser, enemy) {
				if (laser) {
					laser.destroy();
				}
				if (enemy) {
					this.createExplosion(enemy.x, enemy.y);
					this.addScore(10);
					enemy.destroy();
				}
			},
			null,
			this
		);

		//collision between player and enemy lasers
		this.physics.add.overlap(
			this.playerLasers,
			this.enemyLasers,
			function(playerLaser, enemyLaser) {
				if (playerLaser) {
					playerLaser.destroy();
				}
				if (enemyLaser) {
					enemyLaser.destroy();
				}
			},
			null,
			this
		);

		this.physics.add.overlap(
			this.player,
			this.enemies,
			function(player, enemy) {
				if (player) {
					player.destroy();
					this.lifeDown();
				}
				if (enemy) {
					enemy.destroy();
				}
			},
			null,
			this
		);

		this.physics.add.overlap(
			this.player,
			this.enemyLasers,
			function(player, laser) {
				if (player) {
					player.destroy();
					this.lifeDown();
				}
				if (laser) {
					laser.destroy();
				}
			},
			null,
			this
		);

		//Sets the highscore to be zero if there is nothing in the storage, otherwise, take in the highscore from the passingData object
		if (localStorage.getItem('highScore') === null) {
			localStorage.setItem('highScore', 0);
		} else {
			this.passingData.highScore = localStorage.getItem('highScore');
			this.textHighScore.setText(this.passingData.highScore);
		}
	}

	//Adding score and changing the score tracker
	addScore(amount) {
		this.passingData.score += amount;
		this.textScore.setText(this.passingData.score);
	}

	//Changing direction of the enemy and settting their current movement as their last move
	setEnemyDirection(direction) {
		this.lastEnemyMoveDirection = this.enemyMoveDirection;
		this.enemyMoveDirection = direction;
	}

	//Infinitely loop and move the enemies.
	updateEnemiesMovement() {
		this.moveTimer = this.time.addEvent({
			delay: 1050, // How often the function is called in ms
			callback: function() {
				//function to call after delay expires
				//move the box of enemies and detects position relative to bounding box
				if (this.enemyMoveDirection === 'RIGHT') {
					this.enemyRectangle.x += 6; //move it right

					if (this.enemyRectangle.width + this.enemyRectangle.x > this.game.config.width) {
						this.setEnemyDirection('DOWN'); //If the movement will cause the enemies to be outside the game window, then move them down
					}
				} else if (this.enemyMoveDirection === 'LEFT') {
					this.enemyRectangle.x -= 6; //move it left

					if (this.enemyRectangle.x < 20) {
						this.setEnemyDirection('DOWN');
					}
				} else if (this.enemyMoveDirection === 'DOWN') {
					this.moveTimer.delay -= 100; //makes the enemies move faster

					for (let i = 0; i < this.enemies.getChildren().length; i++) {
						//getChildren() gets all the members of the group in an array
						let enemy = this.enemies.getChildren()[i];

						enemy.y += 25;

						if (this.lastEnemyMoveDirection === 'RIGHT') {
							this.setEnemyDirection('LEFT');
						} else if (this.lastEnemyMoveDirection === 'LEFT') {
							this.setEnemyDirection('RIGHT');
						}
					}
				}

				//Move all the enemies
				for (let i = 0; i < this.enemies.getChildren().length; i++) {
					let enemy = this.enemies.getChildren()[i];

					if (this.enemyMoveDirection === 'RIGHT') {
						enemy.x += 5;
					} else if (this.enemyMoveDirection === 'LEFT') {
						enemy.x -= 5;
					}
				}
			},
			loop: true, //defaults to false
			callbackScope: this //what to call the function with
		});
	}
	updateEnemiesShooting() {
		this.time.addEvent({
			delay: 400,
			callback: function() {
				for (let i = 0; i < this.enemies.getChildren().length; i++) {
					let enemy = this.enemies.getChildren()[i];

					if (Math.round(Math.random() * 100) > 98) {
						let enemyLaser = new LaserEnemy(this, enemy.x, enemy.y);
						this.enemyLasers.add(enemyLaser);

						this.sfx.laserEnemy.play();
					}
				}
			},
			loop: true,
			callbackScope: this
		});
		//loop through all enemies and randomly generate them a laser
	}

	updatePlayerMovement() {
		console.log('player movement');
		this.time.addEvent({
			delay: 40,
			callback: function() {
				if (this.keyLEFT.isDown) {
					this.player.x -= 8;
				}
				if (this.keyRIGHT.isDown) {
					this.player.x += 8;
				}
			},
			loop: true,
			callbackScope: this
		});
	}

	//Player has a shooting delay
	updatePlayerShooting() {
		this.time.addEvent({
			delay: 200,
			callback: function() {
				if (this.keySpace.isDown && this.player.active) {
					if (this.player.playerShootTick < this.player.playerShootDelay) {
						this.player.playerShootTick++;
					} else {
						let laser = new LaserPlayer(this, this.player.x, this.player.y);

						this.playerLasers.add(laser);

						this.sfx.laserPlayer.play();
						this.player.playerShootTick = 0;
					}
				}
			},
			loop: true,
			callbackScope: this
		});
	}

	createExplosion(x, y) {
		this.sfx.explode.play();

		let explosion = new Explosion(this, x, y);
		this.explosions.add(explosion);
	}

	//Update position of all lasers
	updateLasers() {
		//playerLasers
		this.time.addEvent({
			delay: 50,
			callback: function() {
				for (let i = 0; i < this.playerLasers.getChildren().length; i++) {
					let laser = this.playerLasers.getChildren()[i];

					laser.y -= laser.displayHeight;

					if (laser.y < 16) {
						this.createExplosion(laser.x, laser.y);
						if (laser) {
							laser.destroy();
						}
					}
				}
			},
			loop: true,
			callbackScope: this
		});

		//enemy lasers
		this.time.addEvent({
			delay: 100,
			callback: function() {
				for (let i = 0; i < this.enemyLasers.getChildren().length; i++) {
					let laser = this.enemyLasers.getChildren()[i];

					laser.y += laser.displayHeight;
				}
			},
			loop: true,
			callbackScope: this
		});
	}

	updateMoreEnemies() {
		console.log('enemy amount', this.enemies.getChildren().length);
		console.log('the move timer before', this.moveTimer.delay);
		this.time.addEvent({
			delay: 100,
			callback: function() {
				if (this.enemies.getChildren().length === 0) {
					console.log('the move timer after', this.moveTimer.delay);
					this.moveTimer.delay -= 100;
					for (let x = 0; x < Math.round(this.game.config.width / 32); x++) {
						for (let y = 0; y < Math.round(this.game.config.height / 80); y++) {
							let enemy = new Enemy(this, x * 24, 128 + y * 20, 'sprEnemy0');
							enemy.play('sprEnemy0');
							enemy.setScale(2);
							this.enemies.add(enemy);
						}
					}
				}
			},
			loop: true,
			callbackScope: this
		});
	}

	lifeDown() {
		if (this.passingData.lives === 0) {
			this.textGameOver = this.add.text(this.game.config.width * 0.5, 150, 'GAME OVER', {
				fontFamily: 'Arcadepix',
				fontSize: 40,
				align: 'center'
			});
			this.textGameOver.setOrigin(0.5);
		}
		if (this.passingData.score > localStorage.getItem('highScore')) {
			localStorage.setItem('highScore', this.passingData.score);
		}
		this.time.addEvent({
			delay: 2000,
			callback: function() {
				if (this.passingData.lives > 0) {
					this.passingData.lives--;
					console.log('in here', this.passingData);
					this.scene.start('SceneMain', this.passingData);
				} else {
					this.scene.start('SceneMain', {});
				}
			},
			loop: false,
			callbackScope: this
		});
	}
}
