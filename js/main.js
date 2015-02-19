window.onload = function() 
{
    "use strict";
    
    var game = new Phaser.Game( 640, 480, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update } );
    game.antialias = false;

    // create a list to store our game entities
    var ents = [];
    var map = array2d(40,30,1);
    //genMap(map);
    var frameBuffer;
    var screen_shake = 0;
    var obj_player;

    // variables used to store keypresses
    var upKey, downKey, leftKey, rightKey, shootKey, jumpKey;


    var shoot1, shoot2, awwg;

    //Define some useful functions

    function array2d(xsize,ysize,val)
    {
        var array = [];
        for(var i = 0; i<xsize; i++)
        {
            array[i] = [];
        }

        for (var x=0; x<xsize; x++)
            for(var y=0; y<ysize; y++)
                array[x][y] = val;

        return array;
    }

    function clamp(val,min,max)
    {
        if (val<min)
            return min;
        if (val>max)
            return max;
        return val;
    }

    function hitscanto(x,y,x2,y2)
    {
        var dist = point_distance(x,y,x2,y2);
        var dir = point_direction(x,y,x2,y2);
        var xto = lengthdir_x(1,dir);
        var yto = lengthdir_y(1,dir);

        for (var i = 0; i<dist; i++)
        {
            x+=xto;
            y+=yto;

            if (map[~~(x)][~~(y)])
                return false;

            if (point_direction(x,y,x2,y2)<8)
                return true;

        }
        return false;
    }

    function randomInt(max)
    {
        var i = Math.random()*(max+1)
        return ~~(i);
    }

    function choose(choices)
    {
        var index = ~~(Math.random()*choices.length);
        return choices[index];
    }

    function genMap(m)
    {
        var x = 0;
        var y = 0;
        var dir = [1,0];
        // dir[0] = xto;
        // dir[1] = yto;

        var xto = 1;
        var yto = 0;

        for(var i=0; i<1000; i++)
        {

            if (x+xto > 39)
                x = 0;

            if (x+xto<0)
                x = 39;

            if (y+yto>29)
                y = 0;

            if (y+yto<0)
                y = 29;

            m[x][y] = 0;

            x+=xto
            y+=yto

            dir = choose([[1,0],[-1,0],[0,1],[0,-1]]);

            xto = dir[0];
            yto = dir[1];

            if (point_distance(0,0,x,y)>10)
            {
                if (Math.random()<0.01)
                {
                    entityCreate(new murderer(x*16+8,y*16+8))
                }
            }
        }

        m[0][0] = 0;
        m[0][1] = 1;

    }

    function degstorads(degs) 
    //Given Degrees, Return Radians
    {
        return degs * (Math.PI/180);
    }

    function lengthdir_x(len,dir)
    //given a length and an angle (in Degrees), return the horizontal (x) component of 
    //the vector of the angle and direction
    {
        return len * Math.cos(degstorads(dir));
    }

    function lengthdir_y(len,dir)
    // Performs the same function as lengthdir_x, but returns the vertical component
    {
        return len * Math.sin(degstorads(dir));
    }

    function point_distance(x1,y1,x2,y2) 
    // Returns the distance between two points
    // will be used to perform circle collisions
    {
        var xdif = x1-x2;
        var ydif = y1-y2;
        return Math.sqrt(xdif*xdif+ydif*ydif);
    }

    function point_direction(x1,y1,x2,y2)
    // return as a degree the angle between two points
    {
        var xdif = x2 - x1;
        var ydif = y2 - y1;

        return Math.atan2(ydif,xdif)*180 / Math.PI;
    }

    var SEED;
    function rand()
    // random number generator for javascript that I found on stackoverflow,
    // because you apparently can't seed javascripts built in rng
    // found here: http://stackoverflow.com/questions/521295/javascript-random-seeds
    {
        var rand = Math.sin(++SEED)*10000;
        return rand - Math.floor(rand);
    }

    function szudzkik(x,y)
    // pairing function
    {
        if (x<y)
            return y*y+x;
        else
            return x*x+x+y;
    }

    function entityCreate(ent)
    //adds an entity to the entity list 
    {
        ents.push(ent);
    }

    function entityDestroy(i)
    // destroys the entities Phaser image and removes it from the entity list
    {
        ents[i].ph.destroy();
        ents.splice(i,1);
    }

    function entity(x,y,sprite)
    {
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.radius = 8;
        this.alive = true;

        this.ph = game.make.image(this.x,this.y,this.sprite);
        this.ph.anchor.setTo(0.5);

        this.step = function(){}

        this.draw = function()
        {
            frameBuffer.renderXY(this.ph,this.x,this.y);
        }
    }

    function player(x,y)
    {
        var parent = new entity(x,y,'man');
        for (var i in parent)
            this[i] = parent[i];

        this.xspeed = 0;
        this.xdir = 1;
        this.ydir = 0;
        this.yspeed = 0;
        this.grounded = true;
        this.xprev = this.x;
        this.yprev = this.y;
        this.can_shoot = true;
        this.frame = 0;
        this.visible = true;

        this.step = function()
        {
            if (leftKey.isDown)
            {
                this.xspeed+=0.2;
                this.xdir = -1;
                this.ph.key = 'man2';
            }
            else if (rightKey.isDown)
            {
                this.xspeed+=0.2;
                this.xdir = 1;
                this.ph.key = 'man';
            }

            if (downKey.isDown || upKey.isDown)
            {
                if (downKey.isDown)
                    this.ydir = 1;
                else
                    this.ydir = -1;
            }
            else
                this.ydir = 0;

            if (shootKey.isDown && this.can_shoot)
            {
                this.can_shoot = false;
                var xx = ~~((this.x)/16);
                var yy = ~~((this.y)/16);
                var xto = this.xdir;
                var yto = this.ydir;
                var found = false;
                screen_shake+=8;
                shoot2.play();

                if (yto !== 0)
                        xto = 0;
                
                for (var ii = 0; ii<10; ii++)
                {

                    if (xx<0)
                        break;
                    if (xx>39)
                        break;

                    var w = ents.length;
                    while (w--)
                    {
                        if (ents[w] instanceof murderer && point_distance(xx*16+8,yy*16+8,ents[w].x,ents[w].y)<8)
                        {
                            entityDestroy(w);
                            found = true;
                            screen_shake+=16;
                            awwg.play();
                            break;
                        }

                        if (found)
                            break;
                    }


                    if (map[xx][yy])
                    {
                        map[xx][yy] = 0;
                        break;
                    }

                    xx+=xto;
                    yy+=yto;
                }
    
            }
            
            if (shootKey.isUp)
                this.can_shoot = true;

            if (jumpKey.isDown && this.grounded)
            {
                this.yspeed = -4;
            }

            if (this.frame<2 && this.xspeed>0)
                this.frame+=0.1;
            else
                this.frame = 0;

            this.ph.frame = ~~(this.frame);

            if (!this.grounded)
                this.ph.frame = 1;

            this.xspeed = clamp(this.xspeed,0,1.25);
            this.yspeed = clamp(this.yspeed,-4,4);

            this.xprev = this.x//16*(~~(this.x/16))+8;
            this.yprev = this.y//16*(~~(this.y/16))+8;

            this.x+=this.xspeed*this.xdir;
            this.y+=this.yspeed;

            if (this.y>478)
            {
                map = array2d(40,30,1);
                var i = ents.length;
                while(i--)
                {
                    if (ents[i] instanceof murderer)
                        entityDestroy(i);
                }
                genMap(map);
                this.x = 8;
                this.y = 8;
            }

            this.x = clamp(this.x,0,639);
            this.y = clamp(this.y,0,479);

            if (!map[~~(this.x/16)][~~((this.y+8+this.yspeed)/16)])
            {
                this.grounded = false;
                this.yspeed+=0.25;
            }
            else
            {
                this.grounded = true;
                this.yspeed = 0;
            }

            if (map[~~((this.x+this.xspeed*this.xdir)/16)][~~((this.y+this.yspeed)/16)])
            {
                this.x = this.xprev; //- this.xspeed*this.xdir;
                this.y = this.yprev; //- this.yspeed;

                if (!map[~~((this.x+this.xspeed*this.xdir)/16)][~~(this.y/16)])
                    this.x+=this.xspeed*this.xdir;
                else
                    this.xspeed = 0;

                if (!map[~~(this.x/16)][~~((this.y+this.yspeed)/16)])
                    this.y+=this.yspeed;
                else
                    this.yspeed = 0;
            }
            if (this.xspeed>0)
                this.xspeed-=0.125;
            else
                this.xspeed = 0;  
        }

    }


    function bullet(x,y)
    {
        var parent = new entity(x,y,'bullet');
        for (var i in parent)
            this[i] = parent[i];

        this.visible = false;

        var dir = point_direction(this.x,this.y,obj_player.x,obj_player.y);
        this.xto = lengthdir_x(1,dir);
        this.yto = lengthdir_y(1,dir);
        this.dist = point_distance(this.x,this.y,obj_player.x,obj_player.y);

        this.step = function()
        {
            this.x+=this.xto;
            this.y+=this.yto;
            this.dist = point_distance(this.x,this.y,obj_player.x,obj_player.y);

            if (this.dist<160)
                this.visible = true;
            else
                this.visible = false;

            if (this.x<0)
                this.alive = false;
            if (this.x>639)
                this.alive = false;
            if (this.y>479)
                this.alive = false;
            if (this.y<0)
                this.alive = false;

            this.x = clamp(this.x,0,639);
            this.y = clamp(this.y,0,479);

            var px = ~~(this.x/16);
            var py = ~~(this.y/16);

            if (map[px][py])
            {
                this.alive = false;
                map[px][py] = 0;
            }

            if (this.dist<8)
            {
                location.reload();
            }
        }

    }

    function murderer(x,y)
    {
        var parent = new entity(x,y,'man');
        for (var i in parent)
            this[i] = parent[i];

        this.visible = false;
        this.first = 1;
        this.shootTimer = 120+Math.random()*120;

        this.step = function()
        {

            if (this.first === 1)
            {    
                map[~~(this.x/16)][~~((this.y+8)/16)] = 1;
                this.first = 0;
            }
            if (this.first === 0)
            {
                map[~~(this.x/16)][~~(this.y/16)] = 0;
                this.first = -1;
            }

            if (this.first = -1)
            {
                if (!map[~~(this.x/16)][~~((this.y+8)/16)])
                    this.y++;
            }

            if (point_distance(this.x,this.y,obj_player.x,obj_player.y)<160)
                this.visible = true;
            else
                this.visible = false;

            this.shootTimer--;

            if (this.shootTimer<=0 && this.visible)
            {
                this.shootTimer = 30+Math.random()*120;
                shoot2.play();
                entityCreate(new bullet(this.x,this.y) );
            }
        }

    }

    function preload() 
    {
        game.load.image('block','assets/block.png');
        game.load.image('bullet','assets/bullet.png');
        game.load.spritesheet('man','assets/man.png',16,16);
        game.load.spritesheet('man2','assets/man2.png',16,16);


        game.load.audio('shoot1','assets/explode.ogg',true);
        game.load.audio('shoot2','assets/shoot.ogg',true);
        game.load.audio('awwg','assets/aww.ogg',true);
    }

    var block;
    var bufferSprite;;
    function create() 
    {
        game.stage.backgroundColor = '#000000';
        frameBuffer = game.add.renderTexture(640,480,'buffer');
        bufferSprite = game.add.image(0,0,frameBuffer)

        block = game.make.image(0,0,'block');
        obj_player = new player(8,8);
        ents.push(obj_player);

        genMap(map);


        shoot1 = game.add.audio('shoot1');
        shoot1.allowMultiple = true;

        shoot2 = game.add.audio('shoot2');
        shoot2.allowMultiple = true;

        awwg = game.add.audio('awwg');
        awwg.allowMultiple = true;

         // assign keys to our input variables
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        shootKey = game.input.keyboard.addKey(Phaser.Keyboard.X);
        jumpKey = game.input.keyboard.addKey(Phaser.Keyboard.Z);

        game.input.keyboard.addKeyCapture(Phaser.Keyboard.UP);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.DOWN);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.LEFT);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.RIGHT);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.X);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.Y);
        
    }
    
    function update() 
    {   
        var i = ents.length;
        while (i--)
        {
            ents[i].step();

            if (ents[i].alive === false)
                entityDestroy(i);
        }

        bufferSprite.x = Math.random()*screen_shake - screen_shake/2;
        bufferSprite.y = Math.random()*screen_shake - screen_shake/2;

        if (screen_shake>0)
            screen_shake--;
        else
            screen_shake = 0;

        frameBuffer.clear();
        var px = ~~(obj_player.x/16);
        var py = ~~(obj_player.y/16);
        for (var x=0; x<40; x++)
            for(var y=0; y<30; y++)
            {
                if(map[x][y] && point_distance(x,y,px,py)<10)
                    frameBuffer.renderXY(block,x*16,y*16,false);
            }

        i = ents.length;
        while (i--)
        {
            if (ents[i].visible)
                ents[i].draw();
        }

    }
}