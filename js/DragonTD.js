"use strict";
class DragonTD extends Phaser.Scene {
    towerCards;
    levelMap;
    enemies;
    slowableEnemies;
    towers;
    damageProjectiles;
    iceProjectiles;
    selected = null;
    selectedCard = -1;
    isSpawning = false;
    lives = 0;
    treasure = 0;
    level = 0;
    sellMult = 0;
    gameSpeed = GameSpeed.Normal;
    timeMult = 1;
    isPaused = false;
    isGameOver = false;
    preload() {
        this.load.tilemapTiledJSON("map", "maps/map.json");
        this.load.image('extruded-tiles', 'img/extruded-tileset.png');
        this.load.spritesheet("red-wyvern", "img/wyvern-red.png", { frameWidth: 64, spacing: 2 });
        this.load.spritesheet("green-wyvern", "img/wyvern-green.png", { frameWidth: 64, spacing: 2 });
        this.load.spritesheet("blue-wyvern", "img/wyvern-blue.png", { frameWidth: 64, spacing: 2 });
        this.load.spritesheet("purple-wyvern", "img/wyvern-purple.png", { frameWidth: 64, spacing: 2 });
        this.load.spritesheet("gold-wyvern", "img/wyvern-gold.png", { frameWidth: 64, spacing: 2 });
        this.load.spritesheet("dragon-fire", "img/dragon-fire.png", { frameWidth: 96, spacing: 2 });
        this.load.spritesheet("dragon-ice", "img/dragon-ice.png", { frameWidth: 96, spacing: 2 });
        this.load.spritesheet("dragon-earth", "img/dragon-earth.png", { frameWidth: 96, spacing: 2 });
        this.load.spritesheet("dragon-light", "img/dragon-light.png", { frameWidth: 96, spacing: 2 });
        this.load.spritesheet("dragon-water", "img/dragon-water.png", { frameWidth: 96, spacing: 2 });
        this.load.spritesheet("fireball", "img/fireball.png", { frameWidth: 32, spacing: 2 });
        this.load.spritesheet("icebreath", "img/icebreath.png", { frameWidth: 32, spacing: 2 });
        this.load.spritesheet("rockshard", "img/rockshard.png", { frameWidth: 32, spacing: 2 });
        this.load.spritesheet("rockshardlarge", "img/rockshardlarge.png", { frameWidth: 32, spacing: 2 });
        this.load.spritesheet("lightbolt", "img/lightbolt.png", { frameWidth: 32, spacing: 2 });
    }
    create() {
        this.loadMap();
        this.cameras.main.centerOn(this.levelMap.tiles.widthInPixels / 2, this.levelMap.tiles.heightInPixels / 2);
        this.cameras.main.setZoom(this.cameras.main.height / this.levelMap.tiles.heightInPixels);
        this.towerCards = [
            new TowerCard(TowerType.Fireball, "dragon-fire", "a dragon! crispt!", 120),
            new TowerCard(TowerType.Ice, "dragon-ice", "An ice dragon who freezes their foes with icy breath!", 145),
            new TowerCard(TowerType.Earth, "dragon-earth", "An earth dragon who shoots sharp rock shards!", 90),
            new TowerCard(TowerType.Light, "dragon-light", "A light dragon who shoots long ranged beams of light!", 200)
        ];
        // Animation loading
        let enemyKeys = ['red-wyvern', 'green-wyvern', 'blue-wyvern', 'purple-wyvern', 'gold-wyvern'];
        for (let i = 0; i < enemyKeys.length; i++) {
            this.anims.create({
                key: enemyKeys[i] + '-fly',
                frames: this.anims.generateFrameNumbers(enemyKeys[i], {
                    frames: [1, 2, 1, 0]
                }),
                frameRate: 4,
                repeat: -1,
            });
            this.anims.create({
                key: enemyKeys[i] + '-flyslow',
                frames: this.anims.generateFrameNumbers(enemyKeys[i], {
                    frames: [1, 2, 1, 0]
                }),
                frameRate: 2,
                repeat: -1,
            });
        }
        this.anims.create({
            key: 'fireball-idle',
            frames: this.anims.generateFrameNumbers('fireball', {
                frames: [0, 1, 2]
            }),
            frameRate: 15,
        });
        this.anims.create({
            key: 'fireball-destroy',
            frames: this.anims.generateFrameNumbers('fireball', {
                frames: [3, 4, 5]
            }),
            frameRate: 10,
        });
        this.anims.create({
            key: 'rockshard-destroy',
            frames: this.anims.generateFrameNumbers('rockshard', {
                frames: [1, 2, 3]
            }),
            frameRate: 10,
        });
        this.anims.create({
            key: 'rockshardlarge-destroy',
            frames: this.anims.generateFrameNumbers('rockshardlarge', {
                frames: [1, 2, 3]
            }),
            frameRate: 10,
        });
        this.anims.create({
            key: 'lightbolt-destroy',
            frames: this.anims.generateFrameNumbers('lightbolt', {
                frames: [1, 2, 3]
            }),
            frameRate: 10,
        });
        for (let i = 0; i < this.towerCards.length; i++) {
            this.anims.create({
                key: this.towerCards[i].image + '-attack',
                frames: this.anims.generateFrameNumbers(this.towerCards[i].image, {
                    frames: [1, 0]
                }),
                frameRate: 6,
            });
        }
        // Allow testing by starting at later levels
        // let startLevel = 0;
        // for (let i = 0; i < startLevel; i++) {
        //     let levelData = this.getLevelEnemyData();
        //     for (let index = 0; index < levelData.length; index++) {
        //         let testEnemy = new Enemy({scene:this, x:0, y:0, type:levelData[index].enemyType});
        //         this.treasure += testEnemy.treasure * levelData[index].number;
        //         testEnemy.destroy();
        //     }
        //     this.level = i;
        // }
        this.restart();
    }
    update(time, delta) {
        if (!this.time.paused) {
            // Enemy Movement
            this.enemies.children.each((child) => {
                let enemy = child;
                if (!enemy.active)
                    return true;
                let moveDist = enemy.speed * enemy.speedmult * delta / 1000 * this.timeMult;
                enemy.progress += moveDist;
                switch (enemy.direction) {
                    case 0:
                        enemy.setY(Math.max(enemy.y - moveDist, enemy.distanceToMove));
                        if (enemy.y <= enemy.distanceToMove) {
                            this.moveEnemy(enemy);
                        }
                        break;
                    case 1:
                        enemy.setX(Math.min(enemy.x + moveDist, enemy.distanceToMove));
                        if (enemy.x >= enemy.distanceToMove) {
                            this.moveEnemy(enemy);
                        }
                        break;
                    case 2:
                        enemy.setY(Math.min(enemy.y + moveDist, enemy.distanceToMove));
                        if (enemy.y >= enemy.distanceToMove) {
                            this.moveEnemy(enemy);
                        }
                        break;
                    case 3:
                        enemy.setX(Math.max(enemy.x - moveDist, enemy.distanceToMove));
                        if (enemy.x <= enemy.distanceToMove) {
                            this.moveEnemy(enemy);
                        }
                        break;
                    default:
                        break;
                }
                return true;
            });
            // Tower actions
            this.towers.children.iterate((child) => {
                let tower = child;
                // Update tower target if needed. exit if no target currently
                if (tower.target != null && (!tower.target.active || (tower.x - tower.target.x) ** 2 + (tower.y - tower.target.y) ** 2 > tower.range ** 2)) {
                    tower.target = null;
                }
                let maxProgress = 0;
                if (tower.target != null)
                    maxProgress = tower.target.progress;
                for (let i = 0; i < this.enemies.children.entries.length; i++) {
                    let enemy = this.enemies.children.entries[i];
                    if (enemy.progress < maxProgress)
                        continue;
                    if (enemy.active && (tower.x - enemy.x) ** 2 + (tower.y - enemy.y) ** 2 <= tower.range ** 2) {
                        if (enemy.progress > maxProgress) {
                            maxProgress = enemy.progress;
                            tower.target = enemy;
                        }
                    }
                }
                if (tower.target == null) {
                    if (tower.frame.name != '0')
                        tower.setFrame(0);
                    return true;
                }
                // rotate towards target
                tower.setRotation(Phaser.Math.Angle.Between(tower.x, tower.y, tower.target.x, tower.target.y));
                for (let i = 0; i < tower.canAct.length; i++) {
                    if (tower.canAct[i]) {
                        tower.towerActions[i].action(this);
                        tower.canAct[i] = false;
                        this.time.addEvent({ delay: tower.towerActions[i].cd, callback: () => { tower.canAct[i] = true; } });
                        break;
                    }
                }
                return true;
            });
        }
        // Collisions
        this.physics.overlap(this.damageProjectiles, this.enemies, (projectile, enemy) => {
            this.hitEnemy(projectile, enemy);
        }, (p, e) => {
            return e.active && !p.hitEnemies.contains(e);
        });
        this.physics.overlap(this.iceProjectiles, this.slowableEnemies, (projectile, enemy) => {
            this.hitEnemy(projectile, enemy);
        }, (projectile, enemy) => { return enemy.active; });
        // Pointer processing
        if (this.selectedCard != -1 && this.selected != null) {
            this.input.activePointer.updateWorldPoint(this.cameras.main);
            this.selected.setPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);
            this.selected.rangeIndicator.setPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);
            if (this.isPlacementValid()) {
                this.selected.rangeIndicator.fillColor = this.selected.validColor;
            }
            else {
                this.selected.rangeIndicator.fillColor = this.selected.invalidColor;
            }
        }
        this.game.events.emit('updateTopBar', [this.lives, this.treasure, this.level]);
        if (!this.isSpawning && !this.time.paused && this.enemies?.getLength() < 1) {
            this.pause();
            this.damageProjectiles.clear(true, true);
            this.iceProjectiles.clear(true, true);
        }
    }
    changeSpeed() {
        if (this.isGameOver) {
            this.restart();
            return 'Play';
        }
        else if (this.isPaused) {
            this.resume();
        }
        else {
            this.gameSpeed = (this.gameSpeed + 1) % 3;
        }
        switch (this.gameSpeed) {
            case GameSpeed.Normal:
                this.timeMult = 1;
                this.time.timeScale = this.timeMult;
                this.physics.world.timeScale = 1 / this.timeMult;
                return '>';
            case GameSpeed.Fast1:
                this.timeMult = 1.8;
                this.time.timeScale = this.timeMult;
                this.physics.world.timeScale = 1 / this.timeMult;
                return '>>';
            case GameSpeed.Fast2:
                this.timeMult = 3;
                this.time.timeScale = this.timeMult;
                this.physics.world.timeScale = 1 / this.timeMult;
                return '>>>';
            default:
                return '';
        }
    }
    loadMap() {
        this.levelMap = {
            tiles: this.add.tilemap('map'),
            spawn: { x: 0, y: 0 },
            goal: { x: 0, y: 0 },
        };
        let tileset = this.levelMap.tiles.addTilesetImage('tiles', 'extruded-tiles', 32, 32, 1, 2);
        this.levelMap.tiles.createLayer('Background', tileset);
        let pathLayer = this.levelMap.tiles.createLayer('Path', tileset);
        let spawnLayer = this.levelMap.tiles.createLayer('Spawn', tileset);
        let goal = pathLayer.findTile((tile, i, arr) => { return 'isGoal' in tile.properties; });
        this.levelMap.goal = { x: goal.getCenterX(), y: goal.getCenterY() };
        let spawnTile = spawnLayer.findTile((tile, i, arr) => { return 'isSpawn' in tile.properties; });
        this.levelMap.spawn = { x: spawnTile.getCenterX(), y: spawnTile.getCenterY() };
    }
    startLevel() {
        this.isSpawning = true;
        this.level += 1;
        let enemyData = this.getLevelEnemyData();
        let totalTime = 0;
        for (let i = 0; i < enemyData.length; i++) {
            this.time.addEvent({ delay: enemyData[i].delay * 1000, repeat: enemyData[i].number - 1, startAt: (enemyData[i].delay - enemyData[i].start) * 1000, callback: () => {
                    this.spawnEnemy(this.levelMap.spawn.x, this.levelMap.spawn.y, enemyData[i].enemyType);
                } });
            totalTime = Math.max(totalTime, enemyData[i].start + enemyData[i].number * enemyData[i].delay);
        }
        this.time.addEvent({ delay: (totalTime + 1) * 1000, callback: () => {
                this.isSpawning = false;
            } });
    }
    getLevelEnemyData() {
        let levelArray = [
            [
                {
                    enemyType: EnemyTypes.Red,
                    number: 14,
                    delay: 2,
                    start: 0
                }
            ], [
                {
                    enemyType: EnemyTypes.Red,
                    number: 4,
                    delay: 1,
                    start: 0
                },
                {
                    enemyType: EnemyTypes.Red,
                    number: 4,
                    delay: 1,
                    start: 8
                },
                {
                    enemyType: EnemyTypes.Red,
                    number: 4,
                    delay: 1,
                    start: 16
                },
                {
                    enemyType: EnemyTypes.Red,
                    number: 4,
                    delay: 1,
                    start: 24
                },
            ], [
                {
                    enemyType: EnemyTypes.Green,
                    number: 5,
                    delay: 8,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Red,
                    number: 20,
                    delay: 1,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Green,
                    number: 4,
                    delay: 16,
                    start: 0,
                }, {
                    enemyType: EnemyTypes.Red,
                    number: 5,
                    delay: 0.5,
                    start: 0.5,
                }, {
                    enemyType: EnemyTypes.Red,
                    number: 5,
                    delay: 0.5,
                    start: 16.5,
                }, {
                    enemyType: EnemyTypes.Red,
                    number: 5,
                    delay: 0.5,
                    start: 32.5,
                }, {
                    enemyType: EnemyTypes.Red,
                    number: 5,
                    delay: 0.5,
                    start: 48.5,
                },
            ], [
                {
                    enemyType: EnemyTypes.Red,
                    number: 10,
                    delay: 0.5,
                    start: 0
                }, {
                    enemyType: EnemyTypes.Red,
                    number: 10,
                    delay: 0.5,
                    start: 10,
                }, {
                    enemyType: EnemyTypes.Red,
                    number: 10,
                    delay: 0.5,
                    start: 20,
                },
            ], [
                {
                    enemyType: EnemyTypes.Blue,
                    number: 4,
                    delay: 10,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Green,
                    number: 10,
                    delay: 3,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Red,
                    number: 20,
                    delay: 1,
                    start: 0
                },
                {
                    enemyType: EnemyTypes.Green,
                    number: 10,
                    delay: 2,
                    start: 0.5
                },
            ], [
                {
                    enemyType: EnemyTypes.Blue,
                    number: 5,
                    delay: 5,
                    start: 0
                }, {
                    enemyType: EnemyTypes.Red,
                    number: 25,
                    delay: 1,
                    start: 0.5
                },
            ], [
                {
                    enemyType: EnemyTypes.Blue,
                    number: 11,
                    delay: 2,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Purple,
                    number: 3,
                    delay: 5,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Red,
                    number: 30,
                    delay: 0.25,
                    start: 0
                }, {
                    enemyType: EnemyTypes.Red,
                    number: 30,
                    delay: 0.25,
                    start: 12
                },
            ], [
                {
                    enemyType: EnemyTypes.Green,
                    number: 20,
                    delay: 1.5,
                    start: 0
                }, {
                    enemyType: EnemyTypes.Blue,
                    number: 5,
                    delay: 6,
                    start: 0.75
                },
            ], [
                {
                    enemyType: EnemyTypes.Red,
                    number: 30,
                    delay: 0.75,
                    start: 0.5
                }, {
                    enemyType: EnemyTypes.Purple,
                    number: 3,
                    delay: 2,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Red,
                    number: 50,
                    delay: 0.5,
                    start: 0
                }, {
                    enemyType: EnemyTypes.Green,
                    number: 20,
                    delay: 1,
                    start: 10
                },
            ], [
                {
                    enemyType: EnemyTypes.Red,
                    number: 20,
                    delay: 0.5,
                    start: 0.25
                }, {
                    enemyType: EnemyTypes.Blue,
                    number: 10,
                    delay: 1,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Green,
                    number: 20,
                    delay: 1,
                    start: 0
                }, {
                    enemyType: EnemyTypes.Blue,
                    number: 10,
                    delay: 2,
                    start: 0.5
                },
            ], [
                {
                    enemyType: EnemyTypes.Green,
                    number: 40,
                    delay: 0.25,
                    start: 0.125
                }, {
                    enemyType: EnemyTypes.Purple,
                    number: 4,
                    delay: 5,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Blue,
                    number: 25,
                    delay: 2,
                    start: 0.5
                },
            ], [
                {
                    enemyType: EnemyTypes.Red,
                    number: 50,
                    delay: 0.25,
                    start: 0
                }, {
                    enemyType: EnemyTypes.Gold,
                    number: 1,
                    delay: 4,
                    start: 0.5
                },
            ], [
                {
                    enemyType: EnemyTypes.Blue,
                    number: 30,
                    delay: 1,
                    start: 0.5
                }, {
                    enemyType: EnemyTypes.Purple,
                    number: 6,
                    delay: 5,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Gold,
                    number: 8,
                    delay: 10,
                    start: 0
                },
            ], [
                {
                    enemyType: EnemyTypes.Purple,
                    number: 10,
                    delay: 4,
                    start: 0
                },
                {
                    enemyType: EnemyTypes.Green,
                    number: 80,
                    delay: 0.5,
                    start: 0.25
                },
            ], [
                {
                    enemyType: EnemyTypes.Gold,
                    number: 5,
                    delay: 6,
                    start: 0
                },
                {
                    enemyType: EnemyTypes.Blue,
                    number: 30,
                    delay: 1,
                    start: 0.5
                },
            ], [
                {
                    enemyType: EnemyTypes.RedBig,
                    number: 1,
                    delay: 4,
                    start: 0
                }
            ],
        ];
        if (this.level < levelArray.length) {
            return levelArray[this.level];
        }
        else {
            return [
                {
                    enemyType: EnemyTypes.Red,
                    number: 10 * (1 + 0.2 * this.level),
                    delay: 4 * (0.95 ** this.level),
                    start: 0
                }, {
                    enemyType: EnemyTypes.Green,
                    number: 10 * (1 + 0.2 * this.level),
                    delay: 4 * (0.95 ** this.level),
                    start: 0.5
                }, {
                    enemyType: EnemyTypes.Blue,
                    number: 10 * (1 + 0.2 * this.level),
                    delay: 4 * (0.95 ** this.level),
                    start: 1
                },
            ];
        }
    }
    pause() {
        this.time.paused = true;
        this.physics.pause();
        this.game.events.emit('changeSpeed', ['Play']);
        this.isPaused = true;
    }
    resume() {
        if (!this.isSpawning && this.enemies.countActive() < 1) {
            this.startLevel();
        }
        this.time.paused = false;
        this.physics.resume();
        this.isPaused = false;
    }
    gameOver() {
        this.game.events.emit('gameOver');
        this.pause();
        this.game.events.emit('changeSpeed', ['Restart']);
        this.isGameOver = true;
    }
    restart() {
        this.enemies?.destroy(true);
        this.slowableEnemies?.destroy(true);
        this.towers?.destroy(true);
        this.damageProjectiles?.destroy(true);
        this.iceProjectiles?.destroy(true);
        this.enemies = this.add.group();
        this.slowableEnemies = this.add.group();
        this.towers = this.add.group();
        this.damageProjectiles = this.add.group();
        this.iceProjectiles = this.add.group();
        this.selected = null;
        this.selectedCard = -1;
        this.isSpawning = false;
        this.lives = 20;
        this.treasure = 200;
        this.level = 0;
        this.sellMult = 0.7;
        this.gameSpeed = GameSpeed.Normal;
        this.timeMult = 1;
        this.isPaused = true;
        this.isGameOver = false;
        this.game.events.emit('populateTowerList', [
            this.towerCards
        ]);
        this.pause();
    }
    spawnEnemy(x, y, enemyType) {
        let enemy = new Enemy({ scene: this, x: x, y: y, type: enemyType });
        this.enemies.add(enemy);
        this.slowableEnemies.add(enemy);
        this.moveEnemy(enemy);
    }
    moveEnemy(enemy) {
        let tile = this.levelMap.tiles.getTileAtWorldXY(enemy.x, enemy.y, false, this.cameras.main, 'Path');
        if ('isGoal' in tile.properties) {
            this.takeDamage(1);
            enemy.destroy();
            return;
        }
        if (tile == null)
            return;
        enemy.direction = tile.properties.direction;
        let numTiles = 1;
        switch (enemy.direction) {
            case 0:
                enemy.distanceToMove = enemy.getCenter().y - numTiles * tile.height;
                enemy.angle = -90;
                break;
            case 1:
                enemy.distanceToMove = enemy.getCenter().x + numTiles * tile.width;
                enemy.angle = 0;
                break;
            case 2:
                enemy.distanceToMove = enemy.getCenter().y + numTiles * tile.height;
                enemy.angle = 90;
                break;
            case 3:
                enemy.distanceToMove = enemy.getCenter().x - numTiles * tile.width;
                enemy.angle = 180;
                break;
            default:
                break;
        }
    }
    hitEnemy(projectile, enemy) {
        if (this.iceProjectiles.contains(projectile)) {
            enemy.speedmult = projectile.slowMult;
            enemy.setTint(0x5555ff);
            this.slowableEnemies.remove(enemy);
            this.time.delayedCall(projectile.effectDuration, () => {
                enemy.speedmult = 1;
                enemy.clearTint();
                this.slowableEnemies.add(enemy);
            });
        }
        if (this.damageProjectiles.contains(projectile)) {
            enemy.currentHealth -= projectile.damage;
            if (enemy.currentHealth <= 0)
                this.enemyDeath(enemy);
            projectile.pierce--;
            if (projectile.pierce <= 0) {
                projectile.play(projectile.texture.key + '-destroy');
                this.damageProjectiles.remove(projectile);
                if ('setVelocity' in projectile.body) {
                    projectile.body.x += (enemy.x - projectile.x) / 4;
                    projectile.body.y += (enemy.y - projectile.y) / 4;
                    projectile.body.setVelocity(0);
                }
                projectile.once('animationcomplete', () => { projectile.destroy(); });
            }
            else {
                projectile.hitEnemies.add(enemy);
            }
        }
    }
    enemyDeath(enemy) {
        this.treasure += enemy.treasure;
        let deathFrame = Math.floor(Math.random() * 3);
        enemy.stop();
        enemy.setFrame(deathFrame + 3);
        enemy.setActive(false);
        this.time.delayedCall(200, () => { enemy.destroy(); });
    }
    takeDamage(damage) {
        this.lives -= damage;
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    select(tower) {
        if (this.selectedCard != -1)
            return;
        this.selected?.select(false);
        if (this.selected == tower) {
            this.selected = null;
            this.game.events.emit('selectTower', [null]);
        }
        else {
            this.selected = tower;
            tower?.select(true);
            this.game.events.emit('selectTower', [this.selected]);
        }
    }
    sell() {
        this.treasure += Math.round(this.selected.cost * this.sellMult);
        this.selected?.rangeIndicator?.destroy();
        this.selected?.destroy();
        this.selected = null;
        this.game.events.emit('selectTower', [null]);
    }
    buyToggle(index) {
        this.selected?.select(false);
        if (this.selectedCard != -1) {
            this.selected?.rangeIndicator.destroy();
            this.selected?.destroy();
            this.selected = null;
            this.game.events.emit('deselectCard', [this.selectedCard]);
        }
        if (this.selectedCard == index) {
            this.input.off('pointerup');
            this.input.on('pointerup', (pointer, gameObjects) => {
                if (gameObjects.find((value) => {
                    return value instanceof Tower;
                }) == undefined) {
                    this.select(null);
                }
            });
            this.selectedCard = -1;
        }
        else {
            let tower = this.towerCards[index].spawn(this, this.input.activePointer.worldX, this.input.activePointer.worldY);
            tower.setDepth(3);
            tower.select(true);
            this.selected = tower;
            this.selectedCard = index;
            this.input.off('pointerup');
            this.input.on('pointerup', (pointer) => {
                if (this.selected != null) {
                    if (this.isPlacementValid()) {
                        this.treasure -= this.selected.cost;
                        let newTower = this.towerCards[index].spawn(this, pointer.worldX, pointer.worldY);
                        this.towers.add(newTower);
                        newTower.setDepth(1);
                    }
                }
            });
        }
    }
    isPlacementValid() {
        return (this.selected != null
            && this.levelMap.tiles.getTileAtWorldXY(this.selected?.x, this.selected?.y, false, this.cameras.main, 'Background') != null
            && this.levelMap.tiles.getTilesWithinWorldXY(this.selected.x - this.selected.radius, this.selected.y - this.selected.radius, this.selected.radius * 2, this.selected.radius * 2, { isNotEmpty: true }, this.cameras.main, 'Path')?.length == 0
            && this.towers.getChildren().every((child) => {
                let tower = child;
                return (tower.x - this.selected.x) ** 2 + (tower.y - this.selected.y) ** 2 > (tower.radius + this.selected.radius) ** 2;
            })
            && this.treasure >= this.selected.cost);
    }
}
const config = {
    scene: DragonTD,
    parent: document.getElementById('game-canvas'),
    scale: {
        mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
    },
    max: {
        width: 900,
        height: 600,
    },
    backgroundColor: "#555555",
    physics: {
        default: "arcade",
    }
};
const game = new Phaser.Game(config);
game.events.addListener('updateTopBar', ([lives, treasure, level]) => {
    if (document.getElementById('levelCounter').textContent != `Level\n${level}`) {
        document.getElementById('levelCounter').textContent = `Level\n${level}`;
    }
    if (document.getElementById('lifeCounter').textContent != `Lives\n${lives}`) {
        document.getElementById('lifeCounter').textContent = `Lives\n${lives}`;
    }
    if (document.getElementById('treasureCounter').textContent != `Treasure\n${treasure}`) {
        document.getElementById('treasureCounter').textContent = `Treasure\n${treasure}`;
    }
});
game.events.addListener('populateTowerList', ([cards]) => {
    let scene = game.scene.getAt(0);
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('tower-list').style.display = 'flex';
    document.getElementById('tower-info').style.display = 'none';
    let towerList = document.getElementById('tower-list');
    while (towerList.lastChild != null) {
        towerList.removeChild(towerList.lastChild);
    }
    for (let i = 0; i < cards.length; i++) {
        let newTower = document.createElement("li");
        let newButton = newTower.appendChild(document.createElement("button"));
        newButton.style = "background-image: url(img/card-" + cards[i].image + ".png);\n";
        newButton.className = 'disabled';
        newButton.onclick = (() => {
            if (newButton.className != 'enabled') {
                newButton.className = 'enabled';
            }
            scene.buyToggle(i);
        });
        let towerDescBox = newTower.appendChild(document.createElement("div"));
        towerDescBox.className = "container";
        let towerDesc = towerDescBox.appendChild(document.createElement("p"));
        towerDesc.textContent = cards[i].description + '\r\nCost: ' + cards[i].cost;
        towerList.appendChild(newTower);
    }
});
game.events.addListener('deselectCard', ([index]) => {
    document.querySelectorAll('#tower-list > li > button')[index].className = 'disabled';
});
game.events.addListener('selectTower', ([tower]) => {
    let scene = game.scene.getAt(0);
    if (tower != null) {
        document.getElementById('tower-list').style.display = 'none';
        document.getElementById('tower-info').style.display = 'grid';
        document.querySelector('#tower-info p:first-child').textContent = tower.description;
        let sellButton = document.querySelector('#info-bar .sell');
        sellButton.onclick = () => { scene.sell(); };
        sellButton.textContent = 'Sell\r\n' + Math.round(tower.cost * scene.sellMult);
        let upgradeButtons = document.querySelectorAll('#info-bar .upgrade');
        for (let i = 0; i < upgradeButtons.length; i++) {
            let button = upgradeButtons[i];
            if (tower.upgrades.length <= i) {
                button.textContent = 'X';
                button.onclick = () => { };
            }
            else {
                for (let upgradeIndex = 0; upgradeIndex < tower.upgrades[i].length; upgradeIndex++) {
                    if (tower.upgrades[i][upgradeIndex] == null) {
                        if (upgradeIndex == tower.upgrades[i].length - 1) {
                            button.textContent = 'X';
                            button.onclick = () => { };
                        }
                    }
                    else {
                        button.textContent = tower.upgrades[i][upgradeIndex].description + '\r\n' + tower.upgrades[i][upgradeIndex].cost;
                        button.onclick = () => {
                            tower.upgrade(scene, i, upgradeIndex);
                        };
                        break;
                    }
                }
            }
        }
    }
    else {
        document.getElementById('tower-list').style.display = 'flex';
        document.getElementById('tower-info').style.display = 'none';
    }
});
let speedButton = document.getElementById('speedButton');
game.events.addListener('changeSpeed', ([newSpeed]) => {
    speedButton.textContent = newSpeed;
});
game.events.addListener('gameOver', () => {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('tower-list').style.display = 'none';
    document.getElementById('tower-info').style.display = 'none';
});
speedButton.onclick = () => {
    let scene = game.scene.getAt(0);
    let newText = scene.changeSpeed();
    if (newText != '')
        speedButton.textContent = newText;
};
//# sourceMappingURL=DragonTD.js.map