class Enemy extends Phaser.GameObjects.Sprite {
    speed: number;
    direction = 0;
    distanceToMove = 0;
    progress = 0;
    maxHealth: number;
    currentHealth: number;
    treasure: number;
    constructor(config: EnemyOptions) {
        super(config.scene, config.x, config.y, config.texture);
        config.scene.add.existing(this);
        config.scene.physics.add.existing(this);
        switch (config.type) {
        default:
            this.speed = 50;
            this.maxHealth = 1;
            this.currentHealth = 1;
            this.treasure = 1;
        }
    }
}

enum EnemyTypes {
    Default,
}

interface EnemyOptions {
    scene: DragonTD,
    x: number,
    y: number,
    type: EnemyTypes,
    texture: string,
}

abstract class Tower extends Phaser.GameObjects.Sprite {
    abstract cost: number;
    abstract range: number;
    abstract radius: number;
    abstract cd: number;
    abstract upgrades: (TowerUpgrade | null)[];
    abstract description: string;
    target: Enemy | null = null;
    canAct = true;
    validColor = 0x111111;
    invalidColor = 0x991111;
    rangeIndicator: Phaser.GameObjects.Arc;
    constructor(config: AbstractTowerOptions) {
        super(config.scene, config.x, config.y, config.texture);
        config.scene.add.existing(this);
        this.rangeIndicator = config.scene.add.circle(this.x, this.y, config.range, this.validColor, 0.4);
        this.rangeIndicator.setDepth(0.5);
        this.rangeIndicator.setVisible(false);
        this.setInteractive(new Phaser.Geom.Circle(this.width / 2, this.height / 2, config.radius), Phaser.Geom.Circle.Contains);
        this.on('pointerup', () => {
            config.scene.select(this);
        });
    }

    select(isSelected: boolean) {
        this.rangeIndicator.setVisible(isSelected);
    }
}

class DefaultTower extends Tower {
    description = 'A default tower!';
    cost = 10;
    range = 120;
    cd = 1000;
    radius = 16;
    upgrades: (TowerUpgrade | null)[];
    constructor(config: TowerOptions) {
        let texture = "tower";
        super({scene:config.scene, x:config.x, y:config.y, type:config.type, texture:texture, range:120, radius:16});
        this.upgrades = [
            new TowerUpgrade(15, 'Increase attack speed', (tower: Tower) => {
                tower.cost += this.cost;
                tower.cd *= 0.8;
                return null;
            }),
            new TowerUpgrade(20, 'Increase range', (tower: Tower) => {
                tower.cost += this.cost;
                tower.range *= 1.3;
                tower.rangeIndicator.radius = tower.range;
                return null;
            }),
        ]
    }
}

class TowerUpgrade {
    cost: number;
    description: string;
    upgrade: (tower: Tower) => TowerUpgrade | null;
    constructor(cost: number, description: string, upgradeFunction: (tower: Tower) => TowerUpgrade | null) {
        this.cost = cost;
        this.description = description;
        this.upgrade = upgradeFunction;
    }
}

enum TowerType {
    Default
}

interface AbstractTowerOptions {
    scene: DragonTD,
    x: number,
    y: number,
    type: TowerType,
    texture: string,
    range: number,
    radius: number,
}

interface TowerOptions {
    scene: DragonTD,
    x: number,
    y: number,
    type: TowerType,
}

class TowerCard {
    towerType: TowerType;
    image: string;
    description: string;
    constructor(type: TowerType, image: string, description: string) {
        this.image = image;
        this.towerType = type;
        this.description = description;
    }

    spawn(scene: DragonTD, x: number, y: number): Tower {
        switch (this.towerType) {
            case TowerType.Default:
                return new DefaultTower({scene:scene, x:x, y:y, type:this.towerType});
            default:
                return new DefaultTower({scene:scene, x:x, y:y, type:this.towerType});
        }
    }
}

class Projectile extends Phaser.GameObjects.Sprite {
    damage: number;
    speed: number;
    lifetime: number;
    constructor(config: ProjectileOptions) {
        let texture = "";
        switch (config.type) {
            default: 
                texture = "fireball";
        }
        super(config.scene, config.x, config.y, texture);
        switch (config.type) {
            default: 
                this.damage = 1;
                this.speed = 400;
                this.lifetime = 1500;
        }
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
    }
}

enum ProjectileType {
    Default
}

interface ProjectileOptions {
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: ProjectileType,
}

interface LevelMap {
    tiles: Phaser.Tilemaps.Tilemap,
    spawn: {x: number, y: number},
    goal: {x: number, y: number},
}

enum GameSpeed {
    Normal,
    Fast1,
    Fast2,
}