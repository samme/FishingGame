var TopDownGame = TopDownGame || {};

//title screen
TopDownGame.Game = function() {
    this.didFirstCreate = false;
    this.didFirstInit = false;
};

TopDownGame.Game.prototype = {
    init: function(caughtFish, fishOnLine) {

        if (caughtFish === true) {
            var fish = fishOnLine;
            this.makeFlowersDance();
            console.log('caught a ' + fish.name);
            //show the fish on screen above player
            this.displayFish(fish);
            //add a copy of the fish to player's inventory
            var fishCopy = new this.Fish(fish.name, fish.size, fish.price);
            this.addFishToInventory(fishCopy);
        } else if (caughtFish === false){
            console.log('no fish, sorry man');
        } else {
            // something else …
        }

        this.didFirstInit = true;
    },
    create: function() {
        // to help see overlapping/duplicate objects:
        // this.world.alpha = 0.5;

        if (!this.didFirstCreate) {
            this.map = this.game.add.tilemap('beach');

            //the first parameter is the tileset name as specified in Tiled, the second is the key to the asset
            this.map.addTilesetImage('basicTiles', 'gameTiles');

            //create layers
            this.backgroundlayer = this.map.createLayer('background');
            this.blockedLayer = this.map.createLayer('blockedLayer');
            //console.log(this.blockedLayer);
            //console.log(this.blockedLayer._results);
            //console.log(TopDownGame.fishJSON);

            //create yellow flowers group
            this.yellowFlowers = this.game.add.group();
            for (var i = 0; i < 5; i++) {
                this.yellowFlowers.create(this.game.rnd.integerInRange(0, 400), this.game.rnd.integerInRange(100, 300), 'yellowFlower', 0);
            }

            this.yellowFlowers.callAll('scale.setTo', 'scale', .5, .5);
            this.yellowFlowers.callAll('animations.add', 'animations', 'dance', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 8, false);

            //create purple flower sprite
            this.purpleFlower = this.game.add.sprite(150, 240, 'purpleFlower');
            this.purpleFlower.animations.add('dance', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 8, false);
            this.purpleFlower.scale.setTo(.5, .5)

            //create fishing group
            this.fishingZones = [];
            for (var i = 0; i < this.map.objects.objectsLayer.length; i++) {
                var zone = this.createFishingTiles(this.map.objects.objectsLayer[i]);
                this.fishingZones.push(zone);
            }
            //collision on blockedLayer
            this.map.setCollisionBetween(1, 2000, true, 'blockedLayer');

            //resizes the game world to match the layer dimensions
            this.backgroundlayer.resizeWorld();

            //Get the Hour
            this.hour = this.getTime();
            //and draw it in the top left corner
            this.getTimeText(this.hour);
            //Get Time of Day: Morning, Day or Night
            this.timeOfDay = this.getTimeOfDay(this.hour);
            //for testing only
            this.timeOfDay = "day";

            //create inventory
            this.inventory = [];

            //create player
            this.player = this.game.add.sprite(100, 300, 'player');
            this.player.animations.add('right', [0, 1, 2, 3], 10, true);
            this.player.animations.add('left', [4, 5, 6, 7], 10, true);
            this.game.physics.arcade.enable(this.player);
            this.player.body.collideWorldBounds = true;
        }

        //the camera will follow the player in the world
        this.game.camera.follow(this.player);

        //move player with cursor keys
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.spacebar = this.game.input.keyboard.addKey(32);

        this.spacebar.onDown.add(this.fishCheck, this);

        //this.displayFish(TopDownGame.fishJSON.zone.beachfront.time.day.fish[1]);

        this.didFirstCreate = true;

    },
    createFishingTiles: function(obj) {
        var fishingTiles = new Phaser.Rectangle(obj.x, obj.y, obj.width, obj.height);
        fishingTiles.name = obj.name;
        return fishingTiles;
    },
    update: function() {

        //collisions
        this.game.physics.arcade.collide(this.player, this.blockedLayer);

        //player movement
        this.player.body.velocity.y = 0;
        this.player.body.velocity.x = 0;

        if (this.cursors.up.isDown) {
            this.player.body.velocity.y -= 50;
            this.player.facing = "up";
        } else if (this.cursors.down.isDown) {
            this.player.body.velocity.y += 50;
            this.player.facing = "down";
        }
        if (this.cursors.left.isDown) {
            this.player.body.velocity.x -= 50;
            this.player.animations.play('left');
            this.player.facing = "left";
        } else if (this.cursors.right.isDown) {
            this.player.body.velocity.x += 50;
            this.player.animations.play('right');
            this.player.facing = "right";
        } else {
            this.player.animations.stop();
        }

    },
    render: function() {
        var debug = this.game.debug;

        debug.pixel(this.player.centerX, this.player.centerY, "yellow");

        for (var zone of this.fishingZones) {
            debug.geom(zone, "aqua", false);
        }

        if (this.fishAboveHead) {
            debug.spriteBounds(this.fishAboveHead, "yellow", false);
        }
    },
    fishCheck: function() {
        for (var x = 0; x < this.fishingZones.length; x++) {
            //if the center of the player is in range
            console.debug()
            if (this.fishingZones[x].contains(this.player.centerX, this.player.centerY)) {
                console.log('fishing ' + this.fishingZones[x].name);
                //get the fish to be caught from zone and time of day
                var fish = this.getFish(this.fishingZones[x].name, this.timeOfDay);

                //start the mini-game
                this.chanceToCatch(fish);
            }
        }
    },
    getTime: function() {
        var d = new Date();
        var hour = d.getHours();

        return hour;
    },
    getTimeText: function(hour) {
        var meridiem = "am"
        if (hour > 12) {
            hour = hour - 12;
            meridiem = "pm"
        }
        hour = hour + meridiem;

        this.style = {
            font: "12px Arial",
            fill: "white",
            wordWrap: true,
            wordWrapWidth: 100,
            align: "center",
            backgroundColor: "black"
        };

        text = this.game.add.text(0, 0, hour, this.style);
        text.fixedToCamera = true;
    },
    getTimeOfDay: function(hour) {
        //console.log(hour);
        if (hour < 5) {
            return "night";
        } else if (hour >= 5 && hour < 11) {
            return "morning";
        } else if (hour >= 11 && hour < 19) {
            return "day";
        } else if (hour >= 19 && hour < 24) {
            return "night";
        }
    },
    makeFlowersDance: function() {
        this.yellowFlowers.getRandom().animations.play('dance')
        this.purpleFlower.animations.play('dance');
    },
    chanceToCatch: function(fishOnLine) {
        /*
        var num = this.game.rnd.integerInRange(0, 1);
        if(num == 0){
          return true;
        } else {
          return false;
        }
        */
        this.state.start('miniGame', false, false, fishOnLine);
    },
    getFish: function(zone, timeOfDay) {
        //zone and timeOfDay are working as a way to get into the object
        zone = zone.toLowerCase();
        console.log(TopDownGame.fishJSON.zone[zone].time[timeOfDay]);
        return TopDownGame.fishJSON.zone[zone].time[timeOfDay].fish[1];
    },
    displayFish: function(fish) {
        console.log("within displayFish: "+fish);
        var sprite = fish.name.toString().toLowerCase();
        this.butter = this.game.add.sprite(100, 100, 'player');

        this.fishAboveHead = this.game.add.sprite(this.player.x + 8, this.player.y - 16, sprite);
        this.fishAboveHead.animations.add('wiggle', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 8, true);

        this.fishAboveHead.animations.play('wiggle', 8, false, true);

        console.log(this.fishAboveHead);

    },
    addFishToInventory: function(fish) {
        this.inventory.push(fish);
        console.log("In your inventory: "+JSON.stringify(this.inventory));
        this.updateInventoryDisplay();
    },
    Fish: function(name, size, value) {
        this.name = name;
        this.size = size;
        this.value = value;
    },
    updateInventoryDisplay: function() {
        //for every item in the inventory
        for (var i = 0; i < this.inventory.length; i++) {
            //get the sprite image from the name in the inventory
            var sprite = this.inventory[i].name.toString().toLowerCase();
            // add the sprite
            var invFish = this.game.add.sprite(350, 10 * i, sprite);
            invFish.scale.setTo(.5, .5);
            invFish.fixedToCamera = true
        }
    }
}
