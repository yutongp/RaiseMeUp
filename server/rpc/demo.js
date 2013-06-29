// Server-side Code
var rewardCubeHeightRange = 9;
var rewardCubeDistanceRange = 9;
var bounds = {maxX: 10, maxY: 10, minX:0, minY:0};
var heightDeltaRange = 6;
var MaxReward = 5;
var visited  = 1000
var fromLeft = 1001; // x + 1
var fromRight = 1002;// x - 1
var fromUp = 1003;// y + 1;
var fromBot = 1004;// y - 1
var fromNothing = 1005;
var WaterOffset;
var indexOffset;
var zLength;


var roomMap = {}

function Room (roomn) {
	this.players = new Array();
	this.blocks = 10;
	this.roomNumber = roomn;
	this.botposition = {x:0, y:0, z: 0};
}


var getPath = function(world,startCube,targetCube){
	//0 >; 1 ^ ; 2 < ; v
	path = [];
	queue = [];
	queue.push(startCube);
	world[startCube.x][startCube.y][startCube.z] = fromNothing;



	while(queue.length!=0){
		var cube = queue.shift();
		if(xyzMatch(cube,targetCube)){
			var currentCube = cube;
			while(!xyzMatch(currentCube,startCube)){
				var fromDirection = world[currentCube.x][currentCube.y][currentCube.z];
				path.push(fromDirection);
				if(fromDirection == fromRight){
					currentCube = canGoRight(currentCube,world);
				}

				if(fromDirection == fromLeft){
					currentCube = canGoLeft(currentCube,world);
				}

				if(fromDirection == fromBot){
					currentCube = canGoDown(currentCube,world);
				}

				if(fromDirection == fromUp){
					currentCube = canGoUp(currentCube,world);
				}

			}
			return path;
		}else{


			var nextCube = canGoLeft(cube,world);
			if(nextCube.z!=-2&&world[nextCube.x][nextCube.y][nextCube.z]>visited){
				world[nextCube.x][nextCube.y][nextCube.z] = fromRight;
				queue.push(nextCube);
			}

			nextCube = canGoRight(cube,world);
			if(nextCube.z!=-2&&world[nextCube.x][nextCube.y][nextCube.z]>visited){
				world[nextCube.x][nextCube.y][nextCube.z] = fromLeft;
				queue.push(nextCube);
			}

			nextCube = canGoUp(cube,world);
			if(nextCube.z!=-2&&world[nextCube.x][nextCube.y][nextCube.z]>visited){
				world[nextCube.x][nextCube.y][nextCube.z] = fromBot;
				queue.push(nextCube);
			}

			nextCube = canGoDown(cube,world);
			if(nextCube.z!=-2&&world[nextCube.x][nextCube.y][nextCube.z]>visited){
				world[nextCube.x][nextCube.y][nextCube.z] = fromUp;
				queue.push(nextCube);
			}


		}

	}

	return path;


}




var getPath2 = function(world,startCube,targetCube){
	//0 >; 1 ^ ; 2 < ; v
	queue = [];
	queue.push(startCube);
	world[startCube.x][startCube.y][startCube.z] = fromNothing;

	var cloestCube = startCube;
	var minDist = 9999;


	while(queue.length!=0){
		var cube = queue.shift();

		var dist = blocksNeedBetweenTwoReward(cube,targetCube)
			if(minDist > dist){
				minDist = dist;
				cloestCube = cube;
			}
		if(xyzMatch(cube,targetCube)){
			cloestCube = cube;
			break;           
		}else{


			var nextCube = canGoLeft(cube,world);
			if(nextCube.z!=-2&&world[nextCube.x][nextCube.y][nextCube.z]>visited){
				world[nextCube.x][nextCube.y][nextCube.z] = fromRight;
				queue.push(nextCube);               
			}

			nextCube = canGoRight(cube,world);
			if(nextCube.z!=-2&&world[nextCube.x][nextCube.y][nextCube.z]>visited){
				world[nextCube.x][nextCube.y][nextCube.z] = fromLeft;
				queue.push(nextCube);

			}

			nextCube = canGoUp(cube,world);
			if(nextCube.z!=-2&&world[nextCube.x][nextCube.y][nextCube.z]>visited){
				world[nextCube.x][nextCube.y][nextCube.z] = fromBot;
				queue.push(nextCube);
			}

			nextCube = canGoDown(cube,world);
			if(nextCube.z!=-2&&world[nextCube.x][nextCube.y][nextCube.z]>visited){
				world[nextCube.x][nextCube.y][nextCube.z] = fromUp;
				queue.push(nextCube);
			}


		}

	}

	path = [];
	var currentCube = cloestCube;
	while(!xyzMatch(currentCube,startCube)){        
		var fromDirection = world[currentCube.x][currentCube.y][currentCube.z];
		path.push(fromDirection - 1000);
		if(fromDirection == fromRight){
			currentCube = canGoRight(currentCube,world);
		}

		if(fromDirection == fromLeft){
			currentCube = canGoLeft(currentCube,world);
		}

		if(fromDirection == fromBot){
			currentCube = canGoDown(currentCube,world);
		}

		if(fromDirection == fromUp){
			currentCube = canGoUp(currentCube,world);
		}

	}

	return path;

}




//x - 1
function canGoLeft(cube,world){
	var nextCube = new Object();
	nextCube.x = cube.x;
	nextCube.y = cube.y;
	nextCube.z = (cube.z+indexOffset)%zLength;
	var currentZindex = nextCube.z;
	var up1Zindex = (nextCube.z + 1)%zLength;
	var up2Zindex = (nextCube.z + 2)%zLength;
	var down1Zindex = (nextCube.z - 1)%zLength;
	nextCube.x -= 1;

	if(cube.x-1<bounds.minX){
		nextCube.z = -2;
		return nextCube;
	}

	if((cube.z=-1||world[cube.x-1][cube.y][nextCube.z]>=1)&&world[cube.x-1][cube.y][up1Zindex]==0){

		return nextCube;
	}

	if(cube.z>-1&&world[cube.x-1][cube.y][nextCube.z]==0&&((nextCube.z==0&&WaterOffset==0)||world[cube.x-1][cube.y][down1Zindex]>=1)&&world[cube.x-1][cube.y][up1Zindex]==0){

		nextCube.z -= 1;
		return nextCube;
	}

	if(world[cube.x-1][cube.y][up1Zindex]>=1&&world[cube.x-1][cube.y][up2Zindex]==0){
		nextCube.z += 1;
		return nextCube;
	}


	nextCube.z = -2;
	return nextCube;
}

//x+1
function canGoRight(cube,world){
	var nextCube = new Object();
	nextCube.x = cube.x;
	nextCube.y = cube.y;
	nextCube.z = (cube.z+indexOffset)%zLength;
	var up1Zindex = (nextCube.z + 1)%zLength;
	var up2Zindex = (nextCube.z + 2)%zLength;
	var down1Zindex = (nextCube.z - 1)%zLength;
	nextCube.x += 1;

	if(cube.x+1>bounds.maxX){
		nextCube.z = -2;
		return nextCube;
	}

	if((cube.z=-1||world[cube.x+1][cube.y][nextCube.z]>=1)&&world[cube.x+1][cube.y][up1Zindex]==0){

		return nextCube;
	}

	if(cube.z>-1&&world[cube.x+1][cube.y][nextCube.z]==0&&((nextCube.z==0&&WaterOffset==0)||world[cube.x+1][cube.y][down1Zindex]>=1)&&world[cube.x+1][cube.y][up1Zindex]==0){

		nextCube.z -= 1;
		return nextCube;
	}

	if(world[cube.x+1][cube.y][up1Zindex]>=1&&world[cube.x+1][cube.y][up2Zindex]==0){
		nextCube.z += 1;
		return nextCube;
	}


	nextCube.z = -2;

	return nextCube;
}

//y-1
function canGoUp(cube,world){
	var nextCube = new Object();
	nextCube.x = cube.x;
	nextCube.y = cube.y;
	nextCube.z = (cube.z+indexOffset)%zLength;
	var up1Zindex = (nextCube.z + 1)%zLength;
	var up2Zindex = (nextCube.z + 2)%zLength;
	var down1Zindex = (nextCube.z - 1)%zLength;
	nextCube.y -= 1;

	if(cube.y-1<bounds.minY){
		nextCube.z = -2;
		return nextCube;
	}

	if((cube.z=-1||world[cube.x][cube.y-1][nextCube.z]>=1)&&world[cube.x][cube.y-1][up1Zindex]==0){

		return nextCube;
	}

	if(cube.z>-1&&world[cube.x][cube.y-1][nextCube.z]==0&&((nextCube.z==0&&WaterOffset==0)||world[cube.x][cube.y-1][down1Zindex]>=1)&&world[cube.x][cube.y-1][up1Zindex]==0){

		nextCube.z -= 1;
		return nextCube;
	}

	if(world[cube.x][cube.y-1][up1Zindex]>=1&&world[cube.x][cube.y-1][up2Zindex]==0){
		nextCube.z += 1;
		return nextCube;
	}


	nextCube.z = -2;

	return nextCube;
}


//y+1
function canGoDown(cube,world){
	var nextCube = new Object();
	nextCube.x = cube.x;
	nextCube.y = cube.y;
	nextCube.z = (cube.z+indexOffset)%zLength;
	var up1Zindex = (nextCube.z + 1)%zLength;
	var up2Zindex = (nextCube.z + 2)%zLength;
	var down1Zindex = (nextCube.z - 1)%zLength;
	nextCube.y += 1;

	if(cube.y+1<bounds.maxY){
		nextCube.z = -2;
		return nextCube;
	}

	if((cube.z=-1||world[cube.x][cube.y+1][nextCube.z]>=1)&&world[cube.x][cube.y+1][up1Zindex]==0){

		return nextCube;
	}

	if(cube.z>-1&&world[cube.x][cube.y+1][nextCube.z]==0&&((nextCube.z==0&&WaterOffset==0)||world[cube.x][cube.y+1][down1Zindex]>=1)&&world[cube.x][cube.y+1][up1Zindex]==0){

		nextCube.z -= 1;
		return nextCube;
	}

	if(world[cube.x][cube.y+1][up1Zindex]>=1&&world[cube.x][cube.y+1][up2Zindex]==0){
		nextCube.z += 1;
		return nextCube;
	}


	nextCube.z = -2;

	return nextCube;
}



function xyzMatch(cube1,cube2){
	return (cube1.x==cube2.x)&&(cube1.y==cube2.y)&&(cube1.z==cube2.z);
}

var getReward = function(currentNumOfBlocks, currentReward,nextReward,Map) {

	var blocksNeed = blocksNeedBetweenTwoReward(currentReward,nextReward);
	var blockRatio = currentNumOfBlocks/blocksNeed;
	return Math.random()*MaxReward/(blockRatio);
}

function blocksNeedBetweenTwoReward(r1,r2)
{
	var distx = Math.abs(r1.x-r2.x);
	var disty = Math.abs(r1.y-r2.y);
	var distz = Math.abs(r1.z-r2.z);
	if(distx+disty-distz<0){
		distz = distz + (distz - distx - disty)*2
	}
	return distx+disty+distz;
}

var getRewardCubePosition = function (numOfReward,curHigestReward){
	rewardCubes = new Array();

	var temp = new Object();
	temp = curHigestReward;
	for( var i = 0; i < numOfReward; i++){

		var newX = Math.floor(Math.random()*(bounds.maxX-bounds.minX))+bounds.minX;
		var newY = Math.floor(Math.random()*(bounds.maxY-bounds.minY))+bounds.minY;
		if(newX == temp.x){
			newX+=1;
		}
		if(newY == temp.y){
			newY+=1;
		}

		var newZ = temp.z;
		newZ += Math.floor(Math.random()*heightDeltaRange);

		temp = new Object();
		temp.x = newX;
		temp.y = newY;
		temp.z = newZ;
		rewardCubes[i] = temp;
	}
	return rewardCubes;
}



exports.actions = function(req, res, ss) {

	// Example of pre-loading sessions into req.session using internal middleware
	req.use('session');

	// Uncomment line below to use the middleware defined in server/middleware/example
	//req.use('example.authenticated')

	//this function will calculate how many new blocks the user get.
	return {

		sendMessage: function(message) {
			if (message && message.length > 0) {         // Check for blank messages
				ss.publish.all('newMessage', message);     // Broadcast the message to everyone
				return res(true);                          // Confirm it was sent to the originating client
			} else {
				return res(false);
			}
		},

			clientMove: function(data, channel) {
				ss.publish.channel(channel, 'addBox', data);
				roomMap[channel].blocks--;
				return res(true);
			},

			connectGame: function(playerName, roomNumber) {
				if (roomMap[roomNumber] == undefined) {
					roomMap[roomNumber] = new Room(roomNumber);
				}

				thisRoom = roomMap[roomNumber];
				thisRoom.players.push(playerName);
				req.session.channel.subscribe(roomNumber);
				ss.publish.channel(roomNumber, 'addPlayer', playerName);
				return res(thisRoom.blocks);
			},

			requireReward: function(numReward, lastReward, channel) {
				ss.publish.channel(channel, 'addRewardlist', getRewardCubePosition(numReward, lastReward));
			},

	};

};
