"use strict";
class Enemy extends Phaser.GameObjects.Sprite {
    speed;
    speedmult = 1;
    direction = 0;
    distanceToMove = 0;
    progress = 0;
    maxHealth;
    currentHealth;
    treasure;
    constructor(config) {
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
        if ('setImmovable' in this.body)
            this.body.setImmovable();
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
var EnemyTypes;
(function (EnemyTypes) {
    EnemyTypes[EnemyTypes["Red"] = 0] = "Red";
    EnemyTypes[EnemyTypes["Green"] = 1] = "Green";
    EnemyTypes[EnemyTypes["Blue"] = 2] = "Blue";
    EnemyTypes[EnemyTypes["Purple"] = 3] = "Purple";
    EnemyTypes[EnemyTypes["Gold"] = 4] = "Gold";
})(EnemyTypes || (EnemyTypes = {}));
class Tower extends Phaser.GameObjects.Sprite {
    target = null;
    validColor = 0x111111;
    invalidColor = 0x991111;
    rangeIndicator;
    constructor(config) {
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
    select(isSelected) {
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
    constructor(config) {
        let texture = "dragon-fire";
        let scale = 0.5;
        let radius = 96 / 2 * scale;
        let range = 120;
        super({ scene: config.scene, x: config.x, y: config.y, type: config.type, texture: texture, range: range, radius: radius });
        this.radius = radius;
        this.range = range;
        this.cost = config.cost;
        this.setScale(scale);
        this.upgrades = [
            new TowerUpgrade(15, 'Increase attack speed', (tower) => {
                tower.cost += 15;
                this.towerActions[0].cd *= 0.8;
                return null;
            }),
            new TowerUpgrade(20, 'Increase range', (tower) => {
                tower.cost += 20;
                tower.range *= 1.3;
                tower.rangeIndicator.radius = tower.range;
                return null;
            }),
        ];
        this.towerActions = [{
                action: (scene) => {
                    let projectile = new Projectile({ scene: this.scene, x: this.x, y: this.y, texture: 'fireball', damage: 1, lifetime: 500, speed: 400 });
                    projectile.play('fireball-idle');
                    scene.damageProjectiles.add(projectile);
                    scene.time.addEvent({ delay: projectile.lifetime, callback: (child) => { child.destroy(); }, args: [projectile] });
                    if ('setVelocity' in projectile.body) {
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
    constructor(config) {
        let texture = "dragon-ice";
        let scale = 0.5;
        let radius = 96 / 2 * scale;
        let range = 60;
        super({ scene: config.scene, x: config.x, y: config.y, type: config.type, texture: texture, range: range, radius: radius });
        this.radius = radius;
        this.range = range;
        this.cost = config.cost;
        this.setScale(scale);
        this.upgrades = [
            new TowerUpgrade(30, 'Improves slow effect and duration', (tower) => {
                tower.cost += 30;
                this.slowMult = 0.4;
                this.effectDuration += 1000;
                return null;
            }),
            new TowerUpgrade(20, 'Increase range', (tower) => {
                tower.cost += 20;
                tower.range *= 1.3;
                tower.rangeIndicator.radius = tower.range;
                return null;
            }),
        ];
        this.towerActions = [{
                action: (scene) => {
                    let projectile = new Projectile({ scene: this.scene, x: this.x, y: this.y, texture: 'icebreath', damage: 0, speed: 100, lifetime: 1000, slowMult: this.slowMult, effectDuration: this.effectDuration });
                    projectile.setFrame(Math.floor(Math.random() * 3));
                    scene.iceProjectiles.add(projectile);
                    scene.time.addEvent({ delay: projectile.lifetime, callback: (child) => { child.destroy(); }, args: [projectile] });
                    if ('setVelocity' in projectile.body) {
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
    constructor(config) {
        let texture = "dragon-earth";
        let scale = 0.5;
        let radius = 96 / 2 * scale;
        let range = 80;
        super({ scene: config.scene, x: config.x, y: config.y, type: config.type, texture: texture, range: range, radius: radius });
        this.radius = radius;
        this.range = range;
        this.cost = config.cost;
        this.setScale(scale);
        this.upgrades = [
            new TowerUpgrade(15, 'Increase attack speed', (tower) => {
                tower.cost += 15;
                this.towerActions[0].cd *= 0.8;
                return null;
            }),
            new TowerUpgrade(20, 'Increase range', (tower) => {
                tower.cost += 20;
                tower.range *= 1.3;
                tower.rangeIndicator.radius = tower.range;
                return null;
            }),
        ];
        this.towerActions = [{
                action: (scene) => {
                    let projectile = new Projectile({ scene: this.scene, x: this.x, y: this.y, texture: 'rockshardlarge', damage: 1, lifetime: 300, speed: 400, pierce: this.pierce });
                    scene.damageProjectiles.add(projectile);
                    scene.time.addEvent({ delay: projectile.lifetime, callback: (child) => { child.destroy(); }, args: [projectile] });
                    if ('setVelocity' in projectile.body) {
                        let moveVector = scene.physics.velocityFromAngle(this.angle, projectile.speed);
                        projectile.body.setVelocity(moveVector.x, moveVector.y);
                        projectile.x += moveVector.x * this.radius / projectile.speed;
                        projectile.y += moveVector.y * this.radius / projectile.speed;
                        projectile.setAngle(this.angle);
                    }
                    let numSmallShards = 2;
                    let maxAngle = 90;
                    for (let i = 0; i < numSmallShards; i++) {
                        let projectile = new Projectile({ scene: this.scene, x: this.x, y: this.y, texture: 'rockshard', damage: 1, lifetime: 300, speed: 200 });
                        scene.damageProjectiles.add(projectile);
                        scene.time.addEvent({ delay: projectile.lifetime, callback: (child) => { child.destroy(); }, args: [projectile] });
                        if ('setVelocity' in projectile.body) {
                            let angleOffset = (i / (numSmallShards - 1)) * maxAngle - maxAngle / 2;
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
    cost;
    description;
    upgrade;
    constructor(cost, description, upgradeFunction) {
        this.cost = cost;
        this.description = description;
        this.upgrade = upgradeFunction;
    }
}
var TowerType;
(function (TowerType) {
    TowerType[TowerType["Fireball"] = 0] = "Fireball";
    TowerType[TowerType["Ice"] = 1] = "Ice";
    TowerType[TowerType["Earth"] = 2] = "Earth";
})(TowerType || (TowerType = {}));
class TowerCard {
    towerType;
    image;
    description;
    cost;
    constructor(type, image, description, cost) {
        this.image = image;
        this.towerType = type;
        this.description = description;
        this.cost = cost;
    }
    spawn(scene, x, y) {
        let config = { scene: scene, x: x, y: y, type: this.towerType, cost: this.cost };
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
    speed;
    slowMult = 1;
    lifetime;
    effectDuration = 0;
    constructor(config) {
        super(config.scene, config.x, config.y, config.texture);
        this.damage = config.damage;
        this.speed = config.speed;
        this.lifetime = config.lifetime;
        if (config.pierce != undefined)
            this.pierce = config.pierce;
        if (config.slowMult != undefined)
            this.slowMult = config.slowMult;
        if (config.effectDuration != undefined)
            this.effectDuration = config.effectDuration;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
    }
}
var GameSpeed;
(function (GameSpeed) {
    GameSpeed[GameSpeed["Normal"] = 0] = "Normal";
    GameSpeed[GameSpeed["Fast1"] = 1] = "Fast1";
    GameSpeed[GameSpeed["Fast2"] = 2] = "Fast2";
})(GameSpeed || (GameSpeed = {}));
//# sourceMappingURL=Entity.js.map