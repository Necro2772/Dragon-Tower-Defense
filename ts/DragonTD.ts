class DragonTD extends Phaser.Scene {
    towerCards!: TowerCard[];
    levelMap!: LevelMap;
    enemies!: Phaser.GameObjects.Group;
    towers!: Phaser.GameObjects.Group;
    projectiles!: Phaser.GameObjects.Group;
    selected: Tower | null = null;
    selectedCard: number = -1;
    isPlaying = false;
    lives = 20;
    treasure = 10;
    level = 0;
    sellMult = 0.7;
    gameSpeed = GameSpeed.Paused;

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
            new TowerCard(TowerType.Default,
                "tower", "a dragon! crispt! need to test how longer descriptions work on the layout so I'm just going to try typing for a while and then see how very long sentences do and if they fit in the box and if they wrap and all"
            ),
        ]
        this.game.events.emit('populateTowerList', [
            this.towerCards,
        ])
        this.pause();
    }

    update(time: number, delta: number) {
        // Enemy Movement
        if (!this.time.paused) {
            this.enemies.children.each((child) => {
                let enemy = child as Enemy;
                let moveDist = enemy.speed * delta / 1000;
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
                let tower = child as Tower;
                // Update tower target if needed. exit if no target currently
                if (tower.target != null && (!tower.target.active || (tower.x - tower.target.x) ** 2 + (tower.y - tower.target.y) ** 2 > tower.range ** 2)) {
                    tower.target = null;
                }
                if (tower.target == null) {
                    let maxProgress = 0;
                    for (let i = 0; i < this.enemies.children.entries.length; i++) {
                        let enemy = this.enemies.children.entries[i] as Enemy;
                        if (enemy.active && (tower.x - enemy.x) ** 2 + (tower.y - enemy.y) ** 2 <= tower.range ** 2) {
                            if (enemy.progress > maxProgress) {
                                maxProgress = enemy.progress;
                                tower.target = enemy;
                            }
                        }
                    }
                    if (tower.target == null) return true;
                }
                // rotate towards target
                tower.setRotation(Phaser.Math.Angle.Between(tower.x, tower.y, tower.target.x, tower.target.y));
                if (tower.canAct) {
                    this.towerAction(tower);
                    tower.canAct = false;
                    this.time.addEvent({delay: tower.cd, callback: () => {tower.canAct = true;}});
                }
                return true;
            })
        }

        // Collisions
        this.physics.collide(
            this.projectiles, this.enemies, 
            (projectile, enemy) => {
                this.hitEnemy(projectile as Projectile, enemy as Enemy);
            }
        );

        // Pointer processing
        if (this.selectedCard != -1 && this.selected != null) {
            this.input.activePointer.updateWorldPoint(this.cameras.main);
            this.selected.setPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);
            this.selected.rangeIndicator.setPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);
            if (this.isPlacementValid()) {
                this.selected.rangeIndicator.fillColor = this.selected.validColor;
            } else {
                this.selected.rangeIndicator.fillColor = this.selected.invalidColor;
            }
        }
        
        // UI Processing
        this.game.events.emit('updateTopBar', [this.lives, this.treasure, this.level]);

        if (!this.isPlaying && !this.time.paused && this.enemies?.countActive() < 1) {
            this.pause();
            this.game.events.emit('changeSpeed', [this.changeSpeed()]);
        }
    }

    changeSpeed(): string {
        switch (this.gameSpeed) {
            case GameSpeed.Paused:
                this.resume();
                this.gameSpeed = GameSpeed.Normal;
                return 'Pause';
            case GameSpeed.Normal:
                this.pause();
                this.gameSpeed = GameSpeed.Paused;
                return 'Play';
            default:
                return '';
        }
    }

    loadMap() {
        this.levelMap = {
            tiles: this.add.tilemap('map'),
            spawn: {x:0, y:0},
            goal: {x:0, y:0},
        }
        let tileset = this.levelMap.tiles.addTilesetImage('tiles', 'extruded-tiles', 32, 32, 1, 2)!;
        this.levelMap.tiles.createLayer('Background', tileset)!;
        let pathLayer = this.levelMap.tiles.createLayer('Path', tileset)!;
        let spawnLayer = this.levelMap.tiles.createLayer('Spawn', tileset)!;
        let goal = pathLayer.findTile((tile: Phaser.Tilemaps.Tile, i, arr) => {return 'isGoal' in tile.properties})!;
        this.levelMap.goal = {x: goal.getCenterX(), y: goal.getCenterY()};
        let spawnTile = spawnLayer.findTile((tile: Phaser.Tilemaps.Tile, i, arr) => { return 'isSpawn' in tile.properties;})!;
        this.levelMap.spawn = {x: spawnTile.getCenterX(), y: spawnTile.getCenterY()};
    }

    startLevel() {
        this.isPlaying = true;
        this.level += 1;
        this.time.addEvent({delay: 750, repeat: 50, startAt: 2000, callback: ()=>{
            this.spawnEnemy(this.levelMap.spawn.x, this.levelMap.spawn.y);
        }});
        this.time.addEvent({delay: 2001 + 50 * 750, callback: ()=>{
            this.isPlaying = false;
        }});
    }

    pause() {
        this.time.paused = true;
        this.physics.pause();
    }

    resume() {
        if (!this.isPlaying && this.enemies.countActive() < 1) {
            this.startLevel();
        }
        this.time.paused = false;
        this.physics.resume();
    }

    spawnEnemy(x: number, y: number) {
        let enemy = new Enemy({scene:this, x:x, y:y, type: EnemyTypes.Default, texture:'enemy'});
        this.enemies.add(enemy);
        this.moveEnemy(enemy);
    }

    moveEnemy(enemy: Enemy) {
        let tile = this.levelMap.tiles.getTileAtWorldXY(enemy.x, enemy.y, false, this.cameras.main, 'Path')!;
        if ('isGoal' in tile.properties) {
            this.takeDamage(1);
            enemy.destroy();
            return;
        }
        if (tile == null) return;
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

    hitEnemy(projectile: Projectile, enemy: Enemy) {
        enemy.currentHealth -= projectile.damage;
        if (enemy.currentHealth <= 0) this.enemyDeath(enemy);
        projectile.destroy();
    }

    enemyDeath(enemy: Enemy) {
        this.treasure += enemy.treasure;
        enemy.destroy();
    }

    takeDamage(damage: number) {
        this.lives -= damage;
    }

    towerAction(tower: Tower) {
        let projectile = new Projectile({scene:this, x:tower.x, y:tower.y, type:ProjectileType.Default});
        this.projectiles.add(projectile);
        this.time.addEvent({delay:projectile.lifetime, callback: (child: Projectile) => {child.destroy()}, args:[projectile]});
        if ('setVelocity' in projectile.body!) {
            this.physics.moveToObject(projectile, tower.target!, projectile.speed);
            projectile.setRotation(tower.rotation);
        }
    }

    select(tower: Tower | null) {
        if (this.selectedCard != -1) return;
        this.selected?.select(false);
        if (this.selected == tower) {
            this.selected = null;
            this.game.events.emit('selectTower', [null]);
        } else {
            this.selected = tower;
            tower?.select(true);
            this.game.events.emit('selectTower', [this.selected]);
        }
        console.log(this.selected);
    }

    sell() {
        console.log(this.selected);
        this.treasure += Math.round(this.selected!.cost * this.sellMult);
        this.selected?.rangeIndicator?.destroy();
        this.selected?.destroy();
        this.selected = null;
        this.game.events.emit('selectTower', [null]);
    }

    upgrade(index: number) {
        let tower = this.selected!;
        if (this.treasure < tower.upgrades[index]!.cost) return;
        this.treasure -= tower.upgrades[index]!.cost;
        tower.upgrades[index] = tower.upgrades[index]!.upgrade(tower);
        this.game.events.emit('selectTower', [this.selected]);
    }

    buyToggle(index: number) {
        this.selected?.select(false);
        if (this.selectedCard != -1) {
            this.selected?.rangeIndicator.destroy();
            this.selected?.destroy();
            this.selected = null;
            this.game.events.emit('deselectCard', [this.selectedCard]);
        }
        if (this.selectedCard == index) {
            this.input.off('pointerup');
            this.input.on('pointerup', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => {
                if (gameObjects.find((value: Phaser.GameObjects.GameObject) => {
                    return value instanceof Tower;
                }) == undefined) {
                    this.select(null);
                }
            });
            this.selectedCard = -1;
        } else {
            let tower = new DefaultTower({scene:this, x:this.input.activePointer.worldX, y:this.input.activePointer.worldY, type:this.towerCards[index].towerType});
            tower.setDepth(3);
            tower.select(true);
            this.selected = tower;
            this.selectedCard = index;
            this.input.off('pointerup');
            this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
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

    isPlacementValid(): boolean {
        return (this.selected != null 
            && this.levelMap.tiles.getTileAtWorldXY(this.selected?.x, this.selected?.y, false, this.cameras.main, 'Background') != null
            && this.levelMap.tiles.getTilesWithinWorldXY(this.selected.x - this.selected.width / 2, this.selected.y - this.selected.height / 2, this.selected.width, this.selected.height, {isNotEmpty: true}, this.cameras.main, 'Path')?.length == 0
            && this.towers.getChildren().every((child: Phaser.GameObjects.GameObject) => {
                let tower = child as Tower;
                return (tower.x - this.selected!.x) ** 2 + (tower.y - this.selected!.y) ** 2 > (tower.radius + this.selected!.radius) ** 2;
            })
            && this.treasure >= this.selected.cost
        );
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

game.events.addListener('updateTopBar', ([lives, treasure, level]: [number, number, number]) => {
    if (document.getElementById('levelCounter')!.textContent != `Level\n${level}`){
        document.getElementById('levelCounter')!.textContent = `Level\n${level}`;
    }
    if (document.getElementById('lifeCounter')!.textContent != `Lives\n${lives}`){
        document.getElementById('lifeCounter')!.textContent = `Lives\n${lives}`;
    }
    if (document.getElementById('treasureCounter')!.textContent != `Treasure\n${treasure}`){
        document.getElementById('treasureCounter')!.textContent = `Treasure\n${treasure}`;
    }
});

game.events.addListener('populateTowerList', ([cards]: [TowerCard[]]) => {
    let scene = (game.scene.getAt(0) as DragonTD);
    let towerList = document.getElementById('tower-list') as HTMLOListElement;
    for (let i = 0; i < cards.length; i++) {
        let newTower = document.createElement("li");
        let newButton = newTower.appendChild(document.createElement("button"));
        newButton.style = "background-image: url(/img/dragon.png);\n"
        newButton.className = 'disabled';
        newButton.onclick = (() => {
            if (newButton.className != 'enabled') {
                newButton.className = 'enabled';
            }
            scene.buyToggle(i);
        })
        let towerDescBox = newTower.appendChild(document.createElement("div"));
        towerDescBox.className = "container";
        let towerDesc = towerDescBox.appendChild(document.createElement("p"));
        towerDesc.textContent = cards[i].description;
        towerList.appendChild(newTower);
    }
});

game.events.addListener('deselectCard', ([index]: [number]) => {
    document.querySelectorAll('#tower-list > li > button')[index].className = 'disabled';
});

game.events.addListener('selectTower', ([tower]: [Tower | null]) => {
    let scene = (game.scene.getAt(0) as DragonTD);
    if (tower != null) {
        document.getElementById('tower-list')!.style.display = 'none';
        document.getElementById('tower-info')!.style.display = 'grid';
        document.querySelector('#tower-info p:first-child')!.textContent = tower.description;
        let sellButton = document.querySelector('#info-bar .sell') as HTMLButtonElement;
        sellButton.onclick = () => {scene.sell()};
        sellButton.textContent = 'Sell\r\n' + Math.round(tower.cost * scene.sellMult);
        let upgradeButtons = document.querySelectorAll('#info-bar .upgrade');
        for (let i = 0; i < upgradeButtons.length; i++) {
            let button = upgradeButtons[i] as HTMLButtonElement;
            if (tower.upgrades.length <= i || tower.upgrades[i] == null) {
                button.textContent = 'X';
                button.onclick = () => {};
            } else {
                button.textContent = tower.upgrades[i]!.description + '\r\n' + tower.upgrades[i]!.cost;
                button.onclick = () => {
                    scene.upgrade(i);
                }
            }
        }
    } else {
        document.getElementById('tower-list')!.style.display = 'flex';
        document.getElementById('tower-info')!.style.display = 'none';
    }
});

let speedButton = document.getElementById('speedButton')!;
game.events.addListener('changeSpeed', ([newSpeed]: [string]) => {
    speedButton.textContent = newSpeed;
});

speedButton.onclick = () => {
    speedButton.textContent = (game.scene.getAt(0) as DragonTD).changeSpeed();
}