"use strict";
class Enemy extends Phaser.GameObjects.Sprite {
    speed;
    direction = 0;
    distanceToMove = 0;
    progress = 0;
    maxHealth;
    currentHealth;
    treasure;
    constructor(config) {
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
var EnemyTypes;
(function (EnemyTypes) {
    EnemyTypes[EnemyTypes["Default"] = 0] = "Default";
})(EnemyTypes || (EnemyTypes = {}));
class Tower extends Phaser.GameObjects.Sprite {
    target = null;
    canAct = true;
    validColor = 0x111111;
    invalidColor = 0x991111;
    rangeIndicator;
    constructor(config) {
        super(config.scene, config.x, config.y, config.texture);
        config.scene.add.existing(this);
        this.rangeIndicator = config.scene.add.circle(this.x, this.y, config.range - 16, this.validColor, 0.4);
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
class DefaultTower extends Tower {
    cost = 10;
    range = 120;
    cd = 1000;
    radius = 16;
    constructor(config) {
        let texture = "tower";
        super({ scene: config.scene, x: config.x, y: config.y, type: config.type, texture: texture, range: 120, radius: 16 });
    }
}
var TowerType;
(function (TowerType) {
    TowerType[TowerType["Default"] = 0] = "Default";
})(TowerType || (TowerType = {}));
class TowerCard {
    towerType;
    image;
    description;
    constructor(type, image, description) {
        this.image = image;
        this.towerType = type;
        this.description = description;
    }
    spawn(scene, x, y) {
        switch (this.towerType) {
            case TowerType.Default:
                return new DefaultTower({ scene: scene, x: x, y: y, type: this.towerType });
            default:
                return new DefaultTower({ scene: scene, x: x, y: y, type: this.towerType });
        }
    }
}
class Projectile extends Phaser.GameObjects.Sprite {
    damage;
    speed;
    lifetime;
    constructor(config) {
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
var ProjectileType;
(function (ProjectileType) {
    ProjectileType[ProjectileType["Default"] = 0] = "Default";
})(ProjectileType || (ProjectileType = {}));
var GameSpeed;
(function (GameSpeed) {
    GameSpeed[GameSpeed["Paused"] = 0] = "Paused";
    GameSpeed[GameSpeed["Normal"] = 1] = "Normal";
    GameSpeed[GameSpeed["Fast1"] = 2] = "Fast1";
    GameSpeed[GameSpeed["Fast2"] = 3] = "Fast2";
})(GameSpeed || (GameSpeed = {}));
//# sourceMappingURL=Entity.js.map