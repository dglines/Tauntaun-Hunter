var AM = new AssetManager();

function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, sheetWidth, frameDuration, frames, loop, reverse, scale) {
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight = frameHeight;
    this.sheetWidth = sheetWidth;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
    this.scale = scale;
}

Animation.prototype.drawFrame = function (tick, ctx, x, y) {
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }


    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    ctx.drawImage(this.spriteSheet,
                  index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth * this.scale,
                  this.frameHeight * this.scale);
}

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
};

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
};

function Background(game, spritesheet) {
    this.x = 0;
    this.y = 0;
    this.spritesheet = spritesheet;
    this.game = game;
    this.ctx = game.ctx;
}

Background.prototype.draw = function () {
    this.ctx.drawImage(this.spritesheet, this.x, this.y);
};

Background.prototype.update = function () {
};

var deathSound = new Audio("./tauntaunSound.m4a");
function Tauntaun(game){
    this.runAnimation = new Animation(AM.getAsset("./img/TauntaunL.png"), 0, 256, 100, 85.6, 6, 0.15, 6, true, true, 2.5);
    this.lookAnimation = new Animation(AM.getAsset("./img/TauntaunL.png"), 0, 0, 95.5, 85, 8, 0.15, 8, false, true, 2.5);
    this.deathAnimation = new Animation(AM.getAsset("./img/TauntaunL.png"), 659, 342.4, 100, 85, 2, 0.3, 2, false, true, 2.5);
    this.speed = -400;
    this.x = 1800;
    this.y = 380;
    this.isKilled = false;
    this.counter = 0;

    // hit box
    this.height = 85;
    this.width = 100;
    this.buffer = 75; // so hit bpx is smaller than sprite frame

    this.hasLooked = false;
    this.isLooking = false;
    this.ctx = game.ctx;
    Entity.call(this, game, this.x, this.y, false);
}

Tauntaun.prototype = new Entity();
Tauntaun.prototype.constructor = Tauntaun;

// Collision //
Tauntaun.prototype.isHit = function(other) {
    return (this.x + this.buffer < other.x + other.width &&
            this.x + this.buffer + this.width > other.x &&
            this.y < other.y + other.height &&
            this.height + this.y > other.y);
}

Tauntaun.prototype.update = function() {
    this.x += this.game.clockTick * this.speed;

/////***** Collision *****/////
for (var i = 0; i < this.game.entities.length; i++) {
    var ent = this.game.entities[i];
    if (ent !== this && ent.canKill && this.isHit(ent)) {
        deathSound.play();
        this.isKilled = true;
        ent.removeFromWorld = true;
        this.speed = 0;
    }
}
//*********************************//

if (this.isKilled) {

    this.width = 0;  // remove hit box
    this.height = 0;
    if (this.deathAnimation.elapsedTime + this.game.clockTick >= this.deathAnimation.totalTime) {
        this.deathAnimation.elapsedTime -= this.game.clockTick;
        this.counter++;

        if (this.counter >= 100) {  // delay before spawning new tauntaun
            this.removeFromWorld = true;
            this.game.addEntity(new Tauntaun(this.game, AM.getAsset("./img/tauntaun.png")));
        }

    }
}

    if (this.isLooking) {
        if (this.lookAnimation.elapsedTime + this.game.clockTick >= this.lookAnimation.totalTime) {
            this.lookAnimation.elapsedTime = 0;
            this.hasLooked = true;
            this.isLooking = false;
            this.speed = -400;  // px per sec
        }
    }

// run off right side and return to lefts
    if (this.x < -300) {
        this.x = 1800;
        this.hasLooked = false;
    }

// stop and look
    if (this.x <= 500 && !this.hasLooked) {
        this.speed = 0;
        this.isLooking = true;
    }
    Entity.prototype.update.call(this);
}

Tauntaun.prototype.draw = function() {
    if (this.isKilled) {
        this.deathAnimation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
    }
    else if (this.isLooking) {
        this.lookAnimation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
    } else {
        this.runAnimation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
    }
    Entity.prototype.draw.call(this);
}

function Batman(game) { // batman must create the baterang
    this.Animation =
        new Animation(AM.getAsset("./img/BF_Batman.png"), 0, 480, 57.53, 100, 7, 0.15, 7, true, false, 2.5);
    this.throwAnimation =
        new Animation(AM.getAsset("./img/BF_Batman.png"), 960, 1476, 75, 90, 3, 0.075, 3, false, false, 2.5);
    this.jumpAnimation =
        new Animation(AM.getAsset("./img/BF_Batman.png"), 0, 600, 65,100, 8, 0.075, 8, false, false, 2.5);

    this.throwSound = new Audio("throw_sound.wav");
    this.speed = 200;
    this.jumping = false;
    this.throwing = false;
    this.ground = 360;
    this.ctx = game.ctx;
    Entity.call(this, game, 0, 360, false);
}

Batman.prototype = new Entity();
Batman.prototype.constructor = Batman;

Batman.prototype.update = function() {
    if (this.game.space) {
        this.jumping = true;
    } else if (this.game.fKey) {
        this.throwing = true;
    }

// ***** Jumping *****
    if (this.jumping) {
        this.speed = 200;
        if (this.jumpAnimation.isDone()) {
            this.jumpAnimation.elapsedTime = 0;
            this.jumping = false;
        }
        var jumpDistance = this.jumpAnimation.elapsedTime / this.jumpAnimation.totalTime;
        var totalHeight = 200;

        if (jumpDistance > 0.5) {
            jumpDistance = 1-jumpDistance;
        }
        var height = totalHeight * (-4 * (jumpDistance * jumpDistance - jumpDistance));
        this.y = this.ground - height;
    }

// ***** Throwing *****
     else if (this.throwing) {
        this.throwSound.play();
        if (this.throwAnimation.elapsedTime + this.game.clockTick >= this.throwAnimation.totalTime) {
            this.game.addEntity(new Baterang(this.game, AM.getAsset("./img/BF_Batman.png")));
            this.throwAnimation.elapsedTime = 0;
            this.throwing = false;
            this.speed = 200;  // px per sec

        } else {
            this.speed = 0;
        }
    }
        this.x += this.game.clockTick * this.speed;
        batX = this.x;
        batY = this.y;
    
    if (this.x > 1700) {  // run off right side and return to lefts
        this.x = -230;
    }
    Entity.prototype.update.call(this);
}


Batman.prototype.draw = function() {  // only put draw stuff in here
    if (this.jumping) {
        this.jumpAnimation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
    } else if (this.throwing) {
        this.throwAnimation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
    } else {
        this.Animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
    }

    Entity.prototype.draw.call(this);
}

function Baterang(game) {
    this.Animation =
        new Animation(AM.getAsset("./img/BF_Batman.png"), 1210, 1494, 22, 22, 15, 0.02, 15, true, true, 2.5);
    this.speed = 1100;
    this.x = batX + 150;
    this.y = batY + 80;

    // hit box
    this.height = 22;
    this.width = 22;

    this.ctx = game.ctx;
    Entity.call(this, game, this.x, this.y, true);
}

Baterang.prototype = new Entity();
Baterang.prototype.constructor = Baterang;

Baterang.prototype.update = function() {
    this.x += this.game.clockTick * this.speed;
    baterangX = this.x;
    if (this.x > 1700) {
        this.removeFromWorld = true;
    }
    Entity.prototype.update.call(this);
}

Baterang.prototype.draw = function() {
    this.Animation.drawFrame(this.game.clockTick, this.ctx, this.x, this.y);
    Entity.prototype.draw.call(this);
}

AM.queueDownload("./img/background.jpg");
AM.queueDownload("./img/TauntaunL.png");
AM.queueDownload("./img/BF_Batman.png");

AM.downloadAll(function () {
    var canvas = document.getElementById("gameWorld");
    var ctx = canvas.getContext("2d");

    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
    gameEngine.start();

    gameEngine.addEntity(new Background(gameEngine, AM.getAsset("./img/background.jpg")));
    gameEngine.addEntity(new Tauntaun(gameEngine, AM.getAsset("./img/tauntaunRun.png")));
    gameEngine.addEntity(new Batman(gameEngine, AM.getAsset("./img/BF_Batman.png")));


});
