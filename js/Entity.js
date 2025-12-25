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
            case EnemyTypes.RedBig:
            case EnemyTypes.Red:
                texture = 'red-wyvern';
                break;
            case EnemyTypes.GreenBig:
            case EnemyTypes.Green:
                texture = 'green-wyvern';
                break;
            case EnemyTypes.BlueBig:
            case EnemyTypes.Blue:
                texture = 'blue-wyvern';
                break;
            case EnemyTypes.PurpleBig:
            case EnemyTypes.Purple:
                texture = 'purple-wyvern';
                break;
            case EnemyTypes.GoldBig:
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
                this.maxHealth = 2;
                this.treasure = 2;
                break;
            case EnemyTypes.Green:
                this.speed = 50;
                this.maxHealth = 6;
                this.treasure = 4;
                break;
            case EnemyTypes.Blue:
                this.speed = 50;
                this.maxHealth = 10;
                this.treasure = 7;
                break;
            case EnemyTypes.Purple:
                this.speed = 50;
                this.maxHealth = 20;
                this.treasure = 10;
                break;
            case EnemyTypes.Gold:
                this.speed = 50;
                this.maxHealth = 50;
                this.treasure = 25;
                break;
            case EnemyTypes.RedBig:
                this.speed = 20;
                this.maxHealth = 200;
                this.treasure = 50;
                break;
            case EnemyTypes.GreenBig:
                this.speed = 20;
                this.maxHealth = 400;
                this.treasure = 100;
                break;
            case EnemyTypes.BlueBig:
                this.speed = 20;
                this.maxHealth = 800;
                this.treasure = 200;
                break;
            case EnemyTypes.PurpleBig:
                this.speed = 20;
                this.maxHealth = 2500;
                this.treasure = 500;
                break;
            case EnemyTypes.GoldBig:
                this.speed = 20;
                this.maxHealth = 5000;
                this.treasure = 2500;
                break;
            default:
                this.speed = 50;
                this.maxHealth = 1;
                this.treasure = this.maxHealth;
        }
        this.currentHealth = this.maxHealth;
        this.play(texture + '-fly');
        if (config.type < EnemyTypes.RedBig) {
            this.setScale(0.5);
        }
    }
}
var EnemyTypes;
(function (EnemyTypes) {
    EnemyTypes[EnemyTypes["Red"] = 0] = "Red";
    EnemyTypes[EnemyTypes["Green"] = 1] = "Green";
    EnemyTypes[EnemyTypes["Blue"] = 2] = "Blue";
    EnemyTypes[EnemyTypes["Purple"] = 3] = "Purple";
    EnemyTypes[EnemyTypes["Gold"] = 4] = "Gold";
    EnemyTypes[EnemyTypes["RedBig"] = 5] = "RedBig";
    EnemyTypes[EnemyTypes["GreenBig"] = 6] = "GreenBig";
    EnemyTypes[EnemyTypes["BlueBig"] = 7] = "BlueBig";
    EnemyTypes[EnemyTypes["PurpleBig"] = 8] = "PurpleBig";
    EnemyTypes[EnemyTypes["GoldBig"] = 9] = "GoldBig";
})(EnemyTypes || (EnemyTypes = {}));
class Tower extends Phaser.GameObjects.Sprite {
    target = null;
    validColor = 0x111111;
    invalidColor = 0x991111;
    rangeIndicator;
    damage = 1;
    pierce = 0;
    slowMult = 1;
    spreadHits = 1;
    maxAngle = 0;
    effectDuration = 0;
    projectileSpeed = 200;
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
    upgrade(scene, upgradePath, index) {
        let towerUpgrade = this.upgrades[upgradePath][index];
        if (towerUpgrade == null)
            return;
        if (scene.treasure < towerUpgrade.cost)
            return;
        this.cost += towerUpgrade.cost;
        scene.treasure -= towerUpgrade.cost;
        if (towerUpgrade.upgradeData.texture != undefined) {
            this.setTexture(towerUpgrade.upgradeData.texture);
        }
        if (towerUpgrade.upgradeData.range != undefined) {
            this.range = towerUpgrade.upgradeData.range;
            this.rangeIndicator.setRadius(this.range);
        }
        if (towerUpgrade.upgradeData.radius != undefined) {
            this.radius = towerUpgrade.upgradeData.radius;
        }
        if (towerUpgrade.upgradeData.cd != undefined) {
            this.towerActions[0].cd = towerUpgrade.upgradeData.cd;
        }
        if (towerUpgrade.upgradeData.damage != undefined) {
            this.damage = towerUpgrade.upgradeData.damage;
        }
        if (towerUpgrade.upgradeData.slowMult != undefined) {
            this.slowMult = towerUpgrade.upgradeData.slowMult;
        }
        if (towerUpgrade.upgradeData.effectDuration != undefined) {
            this.effectDuration = towerUpgrade.upgradeData.effectDuration;
        }
        if (towerUpgrade.upgradeData.pierce != undefined) {
            this.pierce = towerUpgrade.upgradeData.pierce;
        }
        if (towerUpgrade.upgradeData.spreadHits != undefined) {
            this.spreadHits = towerUpgrade.upgradeData.spreadHits;
        }
        if (towerUpgrade.upgradeData.maxAngle != undefined) {
            this.maxAngle = towerUpgrade.upgradeData.maxAngle;
        }
        if (towerUpgrade.upgradeData.projectileSpeed != undefined) {
            this.projectileSpeed = towerUpgrade.upgradeData.projectileSpeed;
        }
        if (towerUpgrade.upgradeData.action0 != undefined) {
            this.towerActions[0].action = towerUpgrade.upgradeData.action0;
        }
        this.upgrades[upgradePath][index] = null;
        if (index == 2) {
            this.upgrades[(upgradePath + 1) % 2][2] = null;
        }
        scene.game.events.emit('selectTower', [this]);
    }
}
class TowerFireball extends Tower {
    description = 'A dragon who shoots fireballs!';
    cost;
    range;
    radius;
    damage = 1;
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
            [
                { cost: 80, description: 'Increase attack speed',
                    upgradeData: {
                        cd: 1000,
                    }
                }, { cost: 200, description: 'Increase damage',
                    upgradeData: {
                        damage: 2,
                    }
                }, { cost: 2400, description: 'Continuous fire breath',
                    upgradeData: {
                        cd: 100,
                        action0: (scene) => {
                            let projectile = new Projectile({ scene: this.scene, x: this.x, y: this.y, texture: 'fireball', damage: this.damage, lifetime: 1800, speed: 100 });
                            projectile.play('fireball-idle');
                            scene.damageProjectiles.add(projectile);
                            scene.time.addEvent({ delay: projectile.lifetime, callback: (child) => { child.destroy(); }, args: [projectile] });
                            if ('setVelocity' in projectile.body) {
                                let angle = this.angle + Math.random() * 45 - 22.5;
                                let moveVector = scene.physics.velocityFromAngle(angle, projectile.speed);
                                projectile.body.setVelocity(moveVector.x, moveVector.y);
                                projectile.x += moveVector.x * this.radius / projectile.speed;
                                projectile.y += moveVector.y * this.radius / projectile.speed;
                                projectile.setAngle(angle);
                            }
                            this.play(this.texture.key + '-attack');
                        },
                    }
                }
            ],
            [
                { cost: 50, description: 'Increase range',
                    upgradeData: {
                        range: 140
                    }
                }, { cost: 100, description: 'Increase range further',
                    upgradeData: {
                        range: 175
                    }
                }, null
            ],
        ];
        this.towerActions = [{
                action: (scene) => {
                    let projectile = new Projectile({ scene: this.scene, x: this.x, y: this.y, texture: 'fireball', damage: this.damage, lifetime: 500, speed: 400 });
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
                cd: 1300,
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
        let range = 70;
        super({ scene: config.scene, x: config.x, y: config.y, type: config.type, texture: texture, range: range, radius: radius });
        this.radius = radius;
        this.range = range;
        this.cost = config.cost;
        this.setScale(scale);
        this.upgrades = [
            [
                {
                    cost: 70, description: 'Improves slow effect',
                    upgradeData: {
                        slowMult: 0.4,
                    }
                }, {
                    cost: 90, description: 'Improves slow duration',
                    upgradeData: {
                        slowMult: 0.4,
                        effectDuration: 1000,
                    }
                },
            ],
            [
                {
                    cost: 50, description: 'Increase range',
                    upgradeData: {
                        range: 100
                    }
                },
            ],
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
    damage = 1;
    spreadHits = 2;
    maxAngle = 90;
    projectileSpeed = 400;
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
            [
                {
                    cost: 110, description: 'Add pierce effect to main hit',
                    upgradeData: {
                        pierce: 4,
                    }
                }, {
                    cost: 180, description: 'Increase damage of main hit',
                    upgradeData: {
                        damage: 3,
                    }
                }, {
                    cost: 1800, description: 'Improved piercing shot',
                    upgradeData: {
                        pierce: 10,
                        projectileSpeed: 800,
                    }
                },
            ],
            [
                {
                    cost: 120, description: 'Increase number of hits',
                    upgradeData: {
                        spreadHits: 4
                    }
                }, {
                    cost: 220, description: 'Increase number of hits further',
                    upgradeData: {
                        spreadHits: 8,
                        maxAngle: 120,
                    }
                }, {
                    cost: 900, description: 'Scattershot',
                    upgradeData: {
                        spreadHits: 16,
                        maxAngle: 180,
                    }
                },
            ],
        ];
        this.towerActions = [{
                action: (scene) => {
                    let projectile = new Projectile({ scene: this.scene, x: this.x, y: this.y, texture: 'rockshardlarge', damage: this.damage, lifetime: 300, speed: this.projectileSpeed, pierce: this.pierce });
                    scene.damageProjectiles.add(projectile);
                    scene.time.addEvent({ delay: projectile.lifetime, callback: (child) => { child.destroy(); }, args: [projectile] });
                    if ('setVelocity' in projectile.body) {
                        let moveVector = scene.physics.velocityFromAngle(this.angle, projectile.speed);
                        projectile.body.setVelocity(moveVector.x, moveVector.y);
                        projectile.x += moveVector.x * this.radius / projectile.speed;
                        projectile.y += moveVector.y * this.radius / projectile.speed;
                        projectile.setAngle(this.angle);
                    }
                    for (let i = 0; i < this.spreadHits; i++) {
                        let projectile = new Projectile({ scene: this.scene, x: this.x, y: this.y, texture: 'rockshard', damage: 1, lifetime: 300, speed: 200 });
                        scene.damageProjectiles.add(projectile);
                        scene.time.addEvent({ delay: projectile.lifetime, callback: (child) => { child.destroy(); }, args: [projectile] });
                        if ('setVelocity' in projectile.body) {
                            let angleOffset = (i / (this.spreadHits - 1)) * this.maxAngle - this.maxAngle / 2;
                            let moveVector = scene.physics.velocityFromAngle(this.angle + angleOffset, projectile.speed);
                            projectile.body.setVelocity(moveVector.x, moveVector.y);
                            projectile.x += moveVector.x * this.radius / projectile.speed;
                            projectile.y += moveVector.y * this.radius / projectile.speed;
                            projectile.setAngle(this.angle + angleOffset);
                        }
                    }
                    this.play(this.texture.key + '-attack');
                },
                cd: 1800
            },
        ];
    }
}
class TowerLight extends Tower {
    description = 'A dragon who shoots long ranged bolts of light!';
    cost;
    range;
    radius;
    damage = 1;
    pierce = 3;
    projectileSpeed = 1000;
    upgrades;
    towerActions;
    canAct = [true];
    constructor(config) {
        let texture = "dragon-light";
        let scale = 0.5;
        let radius = 96 / 2 * scale;
        let range = 250;
        super({ scene: config.scene, x: config.x, y: config.y, type: config.type, texture: texture, range: range, radius: radius });
        this.radius = radius;
        this.range = range;
        this.cost = config.cost;
        this.setScale(scale);
        this.upgrades = [
            [
                { cost: 210, description: 'Increase attack speed',
                    upgradeData: {
                        cd: 1500
                    }
                }, { cost: 550, description: 'Drastically increase attack speed',
                    upgradeData: {
                        cd: 400,
                    }
                }
            ],
            [
                { cost: 120, description: 'Increase range',
                    upgradeData: {
                        range: 300,
                    }
                }, { cost: 300, description: 'Increase pierce',
                    upgradeData: {
                        pierce: 4,
                    }
                }
            ],
        ];
        this.towerActions = [{
                action: (scene) => {
                    let projectile = new Projectile({ scene: this.scene, x: this.x, y: this.y, texture: 'lightbolt', damage: this.damage, lifetime: 400, speed: this.projectileSpeed, pierce: this.pierce });
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
                cd: 2250,
            },
        ];
    }
}
var TowerType;
(function (TowerType) {
    TowerType[TowerType["Fireball"] = 0] = "Fireball";
    TowerType[TowerType["Ice"] = 1] = "Ice";
    TowerType[TowerType["Earth"] = 2] = "Earth";
    TowerType[TowerType["Light"] = 3] = "Light";
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
            case TowerType.Light:
                return new TowerLight(config);
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
    hitEnemies;
    constructor(config) {
        super(config.scene, config.x, config.y, config.texture);
        this.hitEnemies = config.scene.add.group();
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