class Enemy extends Phaser.GameObjects.Sprite {
    speed: number;
    speedmult = 1;
    direction = 0;
    distanceToMove = 0;
    progress = 0;
    maxHealth: number;
    currentHealth: number;
    treasure: number;
    constructor(config: EnemyOptions) {
        let texture = '';
        switch (config.type) {
            case EnemyTypes.Red:
                texture = 'red-wyvern';
                break;
            case EnemyTypes.Green:
                texture = 'green-wyvern';
                break;
            case EnemyTypes.Blue:
                texture = 'blue-wyvern';
                break;
            case EnemyTypes.Purple:
                texture = 'purple-wyvern';
                break;
            case EnemyTypes.Gold:
                texture = 'gold-wyvern';
                break;
            default:
                break;
        }
        super(config.scene, config.x, config.y, texture, 1);
        config.scene.add.existing(this);
        config.scene.physics.add.existing(this);
        if ('setImmovable' in this.body!) this.body.setImmovable();
        switch (config.type) {
            case EnemyTypes.Red:
                this.speed = 50;
                this.maxHealth = 1;
                break;
            case EnemyTypes.Green:
                this.speed = 50;
                this.maxHealth = 2;
                break;
            case EnemyTypes.Blue:
                this.speed = 50;
                this.maxHealth = 4;
                break;
            case EnemyTypes.Purple:
                this.speed = 50;
                this.maxHealth = 6;
                break;
            case EnemyTypes.Gold:
                this.speed = 50;
                this.maxHealth = 10;
                break;
        default:
            this.speed = 50;
            this.maxHealth = 1;
        }
        this.currentHealth = this.maxHealth;
        this.treasure = this.maxHealth;
        this.play(texture + '-fly');
        this.setScale(0.5);
    }
}

enum EnemyTypes {
    Red,
    Green,
    Blue,
    Purple,
    Gold,
}

interface EnemyOptions {
    scene: DragonTD,
    x: number,
    y: number,
    type: EnemyTypes,
}

abstract class Tower extends Phaser.GameObjects.Sprite {
    abstract cost: number;
    abstract range: number;
    abstract radius: number;
    abstract upgrades: (TowerUpgrade | null)[];
    abstract description: string;
    abstract towerActions: {action: (scene: DragonTD) => void, cd: number}[];
    abstract canAct: boolean[];
    target: Enemy | null = null;
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

class TowerFireball extends Tower {
    description = 'A dragon who shoots fireballs!';
    cost;
    range;
    radius;
    upgrades;
    towerActions;
    canAct = [true];
    constructor(config: TowerOptions) {
        let texture = "dragon-fire";
        let scale = 0.5;
        let radius = 96 / 2 * scale;
        let range = 120;
        super({scene:config.scene, x:config.x, y:config.y, type:config.type, texture:texture, range:range, radius:radius});
        this.radius = radius;
        this.range = range;
        this.cost = config.cost;
        this.setScale(scale);
        this.upgrades = [
            new TowerUpgrade(15, 'Increase attack speed', (tower: Tower) => {
                tower.cost += 15;
                this.towerActions[0].cd *= 0.8;
                return null;
            }),
            new TowerUpgrade(20, 'Increase range', (tower: Tower) => {
                tower.cost += 20;
                tower.range *= 1.3;
                tower.rangeIndicator.radius = tower.range;
                return null;
            }),
        ]
        this.towerActions = [{
        action: (scene: DragonTD)=>{
            let projectile = new Projectile({scene:this.scene, x:this.x, y:this.y, texture:'fireball', damage:1, lifetime:500, speed:400});
            projectile.play('fireball-idle');
            scene.damageProjectiles.add(projectile);
            scene.time.addEvent({delay:projectile.lifetime, callback: (child: Projectile) => {child.destroy()}, args:[projectile]});
            if ('setVelocity' in projectile.body!) {
                let moveVector = scene.physics.velocityFromAngle(this.angle, projectile.speed);
                projectile.body.setVelocity(moveVector.x, moveVector.y);
                projectile.x += moveVector.x * this.radius / projectile.speed;
                projectile.y += moveVector.y * this.radius / projectile.speed;
                projectile.setAngle(this.angle);
            }
            this.play(this.texture.key + '-attack');
        }, 
        cd: 1000
    },
    ];
    }
}

class TowerIce extends Tower {
    description = 'A dragon who slows enemies with an icy breath!';
    cost;
    range;
    radius;
    slowMult = 0.6;
    effectDuration = 2000;
    upgrades;
    towerActions;
    canAct = [true];
    constructor(config: TowerOptions) {
        let texture = "dragon-ice";
        let scale = 0.5;
        let radius = 96 / 2 * scale;
        let range = 60;
        super({scene:config.scene, x:config.x, y:config.y, type:config.type, texture:texture, range:range, radius:radius});
        this.radius = radius;
        this.range = range;
        this.cost = config.cost;
        this.setScale(scale);
        this.upgrades = [
            new TowerUpgrade(30, 'Improves slow effect and duration', (tower: Tower) => {
                tower.cost += 30;
                this.slowMult = 0.4;
                this.effectDuration += 1000;
                return null;
            }),
            new TowerUpgrade(20, 'Increase range', (tower: Tower) => {
                tower.cost += 20;
                tower.range *= 1.3;
                tower.rangeIndicator.radius = tower.range;
                return null;
            }),
        ]
        this.towerActions = [{
        action: (scene: DragonTD)=>{
            let projectile = new Projectile({scene:this.scene, x:this.x, y:this.y, texture:'icebreath', damage:0, speed:100, lifetime:1000, slowMult:this.slowMult, effectDuration:this.effectDuration});
            projectile.setFrame(Math.floor(Math.random() * 3));
            scene.iceProjectiles.add(projectile);
            scene.time.addEvent({delay:projectile.lifetime, callback: (child: Projectile) => {child.destroy()}, args:[projectile]});
            if ('setVelocity' in projectile.body!) {
                let variance = 45;
                let moveAngle = this.angle + Math.random() * variance - (variance / 2);
                let moveVector = scene.physics.velocityFromAngle(moveAngle, projectile.speed);
                projectile.body.setVelocity(moveVector.x, moveVector.y);
                projectile.x += moveVector.x * this.radius / projectile.speed;
                projectile.y += moveVector.y * this.radius / projectile.speed;
                projectile.setAngle(moveAngle);
            }
            this.setFrame(1);
        }, 
        cd: 50
    },
    ];
    }
}

class TowerEarth extends Tower {
    description = 'A dragon who shoots rock shards!';
    cost;
    range;
    radius;
    pierce = 1;
    upgrades;
    towerActions;
    canAct = [true];
    constructor(config: TowerOptions) {
        let texture = "dragon-earth";
        let scale = 0.5;
        let radius = 96 / 2 * scale;
        let range = 80;
        super({scene:config.scene, x:config.x, y:config.y, type:config.type, texture:texture, range:range, radius:radius});
        this.radius = radius;
        this.range = range;
        this.cost = config.cost;
        this.setScale(scale);
        this.upgrades = [
            new TowerUpgrade(15, 'Increase attack speed', (tower: Tower) => {
                tower.cost += 15;
                this.towerActions[0].cd *= 0.8;
                return null;
            }),
            new TowerUpgrade(20, 'Increase range', (tower: Tower) => {
                tower.cost += 20;
                tower.range *= 1.3;
                tower.rangeIndicator.radius = tower.range;
                return null;
            }),
        ]
        this.towerActions = [{
        action: (scene: DragonTD)=>{
            let projectile = new Projectile({scene:this.scene, x:this.x, y:this.y, texture:'rockshardlarge', damage:1, lifetime:300, speed:400, pierce: this.pierce});
            scene.damageProjectiles.add(projectile);
            scene.time.addEvent({delay:projectile.lifetime, callback: (child: Projectile) => {child.destroy()}, args:[projectile]});
            if ('setVelocity' in projectile.body!) {
                let moveVector = scene.physics.velocityFromAngle(this.angle, projectile.speed);
                projectile.body.setVelocity(moveVector.x, moveVector.y);
                projectile.x += moveVector.x * this.radius / projectile.speed;
                projectile.y += moveVector.y * this.radius / projectile.speed;
                projectile.setAngle(this.angle);
            }
            let numSmallShards = 2;
            let maxAngle = 90;
            for (let i = 0; i < numSmallShards; i++) {
                let projectile = new Projectile({scene:this.scene, x:this.x, y:this.y, texture:'rockshard', damage:1, lifetime:300, speed:200});
                scene.damageProjectiles.add(projectile);
                scene.time.addEvent({delay:projectile.lifetime, callback: (child: Projectile) => {child.destroy()}, args:[projectile]});
                if ('setVelocity' in projectile.body!) {
                    let angleOffset = (i/(numSmallShards-1))*maxAngle - maxAngle / 2
                    let moveVector = scene.physics.velocityFromAngle(this.angle + angleOffset, projectile.speed);
                    projectile.body.setVelocity(moveVector.x, moveVector.y);
                    projectile.x += moveVector.x * this.radius / projectile.speed;
                    projectile.y += moveVector.y * this.radius / projectile.speed;
                    projectile.setAngle(this.angle + angleOffset);
                }
            }
            this.play(this.texture.key + '-attack');
        }, 
        cd: 1250
    },
    ];
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
    Fireball,
    Ice,
    Earth
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
    cost: number,
}

class TowerCard {
    towerType: TowerType;
    image: string;
    description: string;
    cost: number;
    constructor(type: TowerType, image: string, description: string, cost: number) {
        this.image = image;
        this.towerType = type;
        this.description = description;
        this.cost = cost;
    }

    spawn(scene: DragonTD, x: number, y: number): Tower {
        let config = {scene:scene, x:x, y:y, type:this.towerType, cost:this.cost};
        switch (this.towerType) {
            case TowerType.Fireball:
                return new TowerFireball(config);
            case TowerType.Ice:
                return new TowerIce(config);
            case TowerType.Earth:
                return new TowerEarth(config);
            default:
                return new TowerFireball(config);
        }
    }
}

class Projectile extends Phaser.GameObjects.Sprite {
    damage = 0;
    pierce = 1;
    speed: number;
    slowMult = 1;
    lifetime: number;
    effectDuration = 0;
    constructor(config: ProjectileOptions) {
        super(config.scene, config.x, config.y, config.texture);
        this.damage = config.damage;
        this.speed = config.speed;
        this.lifetime = config.lifetime;
        if (config.pierce != undefined) this.pierce = config.pierce;
        if (config.slowMult != undefined) this.slowMult = config.slowMult;
        if (config.effectDuration != undefined) this.effectDuration = config.effectDuration;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
    }
}

interface ProjectileOptions {
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    damage: number,
    speed: number,
    lifetime: number,
    pierce?: number,
    slowMult?: number,
    effectDuration?: number,
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