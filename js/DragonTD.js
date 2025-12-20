"use strict";
class DragonTD extends Phaser.Scene {
    towerCards;
    levelMap;
    enemies;
    towers;
    projectiles;
    selected = null;
    selectedCard = -1;
    isSpawning = false;
    lives = 20;
    treasure = 10;
    level = 0;
    sellMult = 0.7;
    gameSpeed = GameSpeed.Normal;
    timeMult = 1;
    isPaused = true;
    preload() {
        this.load.tilemapTiledJSON("map", "maps/map.json");
        this.load.image('extruded-tiles', 'img/extruded-tileset.png');
        this.load.image("enemy", "img/ball.png");
        this.load.image("tower", "img/dragon.png");
        this.load.image("fireball", "img/ball.png");
    }
    create() {
        this.loadMap();
        this.cameras.main.centerOn(this.levelMap.tiles.widthInPixels / 2, this.levelMap.tiles.heightInPixels / 2);
        this.cameras.main.setZoom(this.cameras.main.height / this.levelMap.tiles.heightInPixels);
        this.enemies = this.add.group();
        this.towers = this.add.group();
        this.projectiles = this.add.group();
        this.towerCards = [
            new TowerCard(TowerType.Default, "tower", "a dragon! crispt! need to test how longer descriptions work on the layout so I'm just going to try typing for a while and then see how very long sentences do and if they fit in the box and if they wrap and all"),
        ];
        this.game.events.emit('populateTowerList', [
            this.towerCards,
        ]);
        this.pause();
    }
    update(time, delta) {
        // Enemy Movement
        if (!this.time.paused) {
            this.enemies.children.each((child) => {
                let enemy = child;
                let moveDist = enemy.speed * delta / 1000 * this.timeMult;
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
                if (tower.target == null) {
                    let maxProgress = 0;
                    for (let i = 0; i < this.enemies.children.entries.length; i++) {
                        let enemy = this.enemies.children.entries[i];
                        if (enemy.active && (tower.x - enemy.x) ** 2 + (tower.y - enemy.y) ** 2 <= tower.range ** 2) {
                            if (enemy.progress > maxProgress) {
                                maxProgress = enemy.progress;
                                tower.target = enemy;
                            }
                        }
                    }
                    if (tower.target == null)
                        return true;
                }
                // rotate towards target
                tower.setRotation(Phaser.Math.Angle.Between(tower.x, tower.y, tower.target.x, tower.target.y));
                if (tower.canAct) {
                    this.towerAction(tower);
                    tower.canAct = false;
                    this.time.addEvent({ delay: tower.cd, callback: () => { tower.canAct = true; } });
                }
                return true;
            });
        }
        // Collisions
        this.physics.collide(this.projectiles, this.enemies, (projectile, enemy) => {
            this.hitEnemy(projectile, enemy);
        });
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
        if (!this.isSpawning && !this.time.paused && this.enemies?.countActive() < 1) {
            this.pause();
            this.projectiles.clear(true, true);
        }
    }
    changeSpeed() {
        if (this.isPaused) {
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
            this.time.addEvent({ delay: enemyData[i].delay * 1000, repeat: enemyData[i].number, startAt: enemyData[i].start * 1000, callback: () => {
                    this.spawnEnemy(this.levelMap.spawn.x, this.levelMap.spawn.y, enemyData[i].enemyType);
                } });
            totalTime = Math.max(totalTime, enemyData[i].start + enemyData[i].number * enemyData[i].delay);
        }
        this.time.addEvent({ delay: (totalTime + 1) * 1000, callback: () => {
                this.isSpawning = false;
            } });
    }
    getLevelEnemyData() {
        if (this.level <= 1) {
            return [
                {
                    enemyType: EnemyTypes.Default,
                    number: 50,
                    delay: 0.75,
                    start: 0
                }
            ];
        }
        else {
            return [
                {
                    enemyType: EnemyTypes.Default,
                    number: 50 * (1.2 ** this.level),
                    delay: 0.75 * (0.85 ** this.level),
                    start: 0
                }
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
    spawnEnemy(x, y, enemyType) {
        let enemy = new Enemy({ scene: this, x: x, y: y, type: enemyType, texture: 'enemy' });
        this.enemies.add(enemy);
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
                break;
            case 1:
                enemy.distanceToMove = enemy.getCenter().x + numTiles * tile.width;
                break;
            case 2:
                enemy.distanceToMove = enemy.getCenter().y + numTiles * tile.height;
                break;
            case 3:
                enemy.distanceToMove = enemy.getCenter().x - numTiles * tile.width;
                break;
            default:
                break;
        }
    }
    hitEnemy(projectile, enemy) {
        enemy.currentHealth -= projectile.damage;
        if (enemy.currentHealth <= 0)
            this.enemyDeath(enemy);
        projectile.destroy();
    }
    enemyDeath(enemy) {
        this.treasure += enemy.treasure;
        enemy.destroy();
    }
    takeDamage(damage) {
        this.lives -= damage;
    }
    towerAction(tower) {
        let projectile = new Projectile({ scene: this, x: tower.x, y: tower.y, type: ProjectileType.Default });
        this.projectiles.add(projectile);
        this.time.addEvent({ delay: projectile.lifetime, callback: (child) => { child.destroy(); }, args: [projectile] });
        if ('setVelocity' in projectile.body) {
            this.physics.moveToObject(projectile, tower.target, projectile.speed);
            projectile.setRotation(tower.rotation);
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
    upgrade(index) {
        let tower = this.selected;
        if (this.treasure < tower.upgrades[index].cost)
            return;
        this.treasure -= tower.upgrades[index].cost;
        tower.upgrades[index] = tower.upgrades[index].upgrade(tower);
        this.game.events.emit('selectTower', [this.selected]);
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
            let tower = new DefaultTower({ scene: this, x: this.input.activePointer.worldX, y: this.input.activePointer.worldY, type: this.towerCards[index].towerType });
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
            && this.levelMap.tiles.getTilesWithinWorldXY(this.selected.x - this.selected.width / 2, this.selected.y - this.selected.height / 2, this.selected.width, this.selected.height, { isNotEmpty: true }, this.cameras.main, 'Path')?.length == 0
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
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
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
    let towerList = document.getElementById('tower-list');
    for (let i = 0; i < cards.length; i++) {
        let newTower = document.createElement("li");
        let newButton = newTower.appendChild(document.createElement("button"));
        newButton.style = "background-image: url(/img/dragon.png);\n";
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
        towerDesc.textContent = cards[i].description;
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
            if (tower.upgrades.length <= i || tower.upgrades[i] == null) {
                button.textContent = 'X';
                button.onclick = () => { };
            }
            else {
                button.textContent = tower.upgrades[i].description + '\r\n' + tower.upgrades[i].cost;
                button.onclick = () => {
                    scene.upgrade(i);
                };
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
speedButton.onclick = () => {
    let scene = game.scene.getAt(0);
    let newText = scene.changeSpeed();
    if (newText != '')
        speedButton.textContent = newText;
};
//# sourceMappingURL=DragonTD.js.map