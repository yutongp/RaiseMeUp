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
var gridHeight = 3000;

var gridCellNumber = 10;
var EMPTY_CELL = 0;
var VOXEL_CELL = 1;
var PLAYER_CELL = -1;
var BONUS_CELL = -2;

var roomMap = {}

function Room (roomn, itime) {
	this.players = new Array();
	this.playercolors = new Array();
	this.blocks = 50;
	this.roomNumber = roomn;
	this.botPosition = {x:0, y:0, z: 0};
	this.waterPosition = 0;
	this.initTime = itime;
	this.waterIndex = 0;
	this.worldMap = new Array();
	for (var i = 0; i<gridCellNumber; i++) {
		this.worldMap[i] = new Array();
		for (var j = 0; j<gridCellNumber; j++){
			this.worldMap[i][j] = new Array();
			for (var k = 0; k<gridHeight; k++)
				this.worldMap[i][j][k] = EMPTY_CELL;
		}
	}
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
function canGoLeft(cube, world, indexOffset, WaterOffset) {
	var nextCube = new Object();
	nextCube.x = cube.x;
	nextCube.y = cube.y;
	nextCube.z = (cube.z+indexOffset)%gridHeight;
	var currentZindex = nextCube.z;
	var up1Zindex = (nextCube.z + 1)%gridHeight;
	var up2Zindex = (nextCube.z + 2)%gridHeight;
	var down1Zindex = (nextCube.z - 1)%gridHeight;
	nextCube.x -= 1;

	if(cube.x-1<bounds.minX){
		nextCube.z = -2;
		return nextCube;
	}

	if((cube.z == -1||world[cube.x-1][cube.y][nextCube.z]>=1)&&world[cube.x-1][cube.y][up1Zindex]<=0){

		return nextCube;
	}

	if(cube.z>-1&&world[cube.x-1][cube.y][nextCube.z]<=0&&((nextCube.z==0&&WaterOffset==0)||world[cube.x-1][cube.y][down1Zindex]>=1)&&world[cube.x-1][cube.y][up1Zindex]<=0){

		nextCube.z = down1Zindex;
		return nextCube;
	}

	if(world[cube.x-1][cube.y][up1Zindex]>=1&&world[cube.x-1][cube.y][up2Zindex]<=0){
		nextCube.z = up1Zindex;
		return nextCube;
	}


	nextCube.z = -2;
	return nextCube;
}

//x+1
function canGoRight(cube, world, indexOffset, WaterOffset) {
	var nextCube = new Object();
	nextCube.x = cube.x;
	nextCube.y = cube.y;
	nextCube.z = (cube.z+indexOffset)%gridHeight;
	var up1Zindex = (nextCube.z + 1)%gridHeight;
	var up2Zindex = (nextCube.z + 2)%gridHeight;
	var down1Zindex = (nextCube.z - 1)%gridHeight;
	nextCube.x += 1;

	console.log('***:');
	console.log(nextCube);
	console.log('////:');
	console.log(cube);
	if(cube.x+1>bounds.maxX){
		nextCube.z = -2;
		return nextCube;
	}

	if((cube.z == -1||world[cube.x+1][cube.y][nextCube.z]>=1)&&world[cube.x+1][cube.y][up1Zindex]<=0){

		return nextCube;
	}

	if(cube.z>-1&&world[cube.x+1][cube.y][nextCube.z]<=0&&((nextCube.z==0&&WaterOffset==0)||world[cube.x+1][cube.y][down1Zindex]>=1)&&world[cube.x+1][cube.y][up1Zindex]<=0){

		nextCube.z = down1Zindex;
		return nextCube;
	}

	console.log(world[cube.x+1][cube.y][up1Zindex]);
	console.log(world[cube.x+1][cube.y][up2Zindex]);
	console.log(up2Zindex);
	console.log(indexOffset);
	console.log(nextCube);
	if(world[cube.x+1][cube.y][up1Zindex]>=1&&world[cube.x+1][cube.y][up2Zindex]<=0){
		nextCube.z = up1Zindex;
		return nextCube;
	}


	nextCube.z = -2;

	return nextCube;
}

//y-1
function canGoUp(cube, world, indexOffset, WaterOffset) {
	var nextCube = new Object();
	var nextCube = new Object();
	nextCube.x = cube.x;
	nextCube.y = cube.y;
	nextCube.z = (cube.z+indexOffset)%gridHeight;
	var up1Zindex = (nextCube.z + 1)%gridHeight;
	var up2Zindex = (nextCube.z + 2)%gridHeight;
	var down1Zindex = (nextCube.z - 1)%gridHeight;
	nextCube.y -= 1;

	if(cube.y-1<bounds.minY){
		nextCube.z = -2;
		return nextCube;
	}

	if((cube.z == -1||world[cube.x][cube.y-1][nextCube.z]>=1)&&world[cube.x][cube.y-1][up1Zindex]<=0){

		return nextCube;
	}

	if(cube.z>-1&&world[cube.x][cube.y-1][nextCube.z]<=0&&((nextCube.z==0&&WaterOffset==0)||world[cube.x][cube.y-1][down1Zindex]>=1)&&world[cube.x][cube.y-1][up1Zindex]<=0){

		nextCube.z = down1Zindex;
		return nextCube;
	}

	if(world[cube.x][cube.y-1][up1Zindex]>=1&&world[cube.x][cube.y-1][up2Zindex]<=0){
		nextCube.z = up1Zindex;
		return nextCube;
	}


	nextCube.z = -2;

	return nextCube;
}


//y+1
function canGoDown(cube, world, indexOffset, WaterOffset) {
	var nextCube = new Object();
	nextCube.x = cube.x;
	nextCube.y = cube.y;
	nextCube.z = (cube.z+indexOffset)%gridHeight;
	var up1Zindex = (nextCube.z + 1)%gridHeight;
	var up2Zindex = (nextCube.z + 2)%gridHeight;
	var down1Zindex = (nextCube.z - 1)%gridHeight;
	nextCube.y += 1;

	if(cube.y+1 > bounds.maxY){
		console.log(1);
		nextCube.z = -2;
		return nextCube;
	}

	if((cube.z == -1||world[cube.x][cube.y+1][nextCube.z]>=1)&&world[cube.x][cube.y+1][up1Zindex]<=0){

		console.log(2);
		return nextCube;
	}

	if(cube.z>-1&&world[cube.x][cube.y+1][nextCube.z]<=0&&((nextCube.z==0&&WaterOffset==0)||world[cube.x][cube.y+1][down1Zindex]>=1)&&world[cube.x][cube.y+1][up1Zindex]<=0){

		console.log(3);
		nextCube.z  = down1Zindex;
		return nextCube;
	}

	if(world[cube.x][cube.y+1][up1Zindex]>=1&&world[cube.x][cube.y+1][up2Zindex]<=0){
		nextCube.z = up1Zindex;
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

//input is index in the world index
var getRewardCubePositionwithIndex = function (curHigestReward,indexOffset){
	rewardCubes = new Array();
	var count = 0;
	var max;
	if(curHigestReward.z<indexOffset){
		max = indexOffset - curHigestReward.z -1;
	}else{
		max = gridHeight - (curHigestReward.z - indexOffset + 1);
	}

	var temp = new Object();
	temp = curHigestReward;
	for( var i = 0;; i++){

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
		count += newZ - temp.z;
		if(count>max)
			break;
		newZ = (newZ + indexOffset)%gridHeight;


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
				roomMap[channel].worldMap[data[1].x][data[1].y][data[1].z]=VOXEL_CELL;
				return res(true);
			},

			connectGame: function(playerName, roomNumber, initialTime) {
				var first = false;
				if (roomMap[roomNumber] == undefined) {
					roomMap[roomNumber] = new Room(roomNumber, initialTime);
					first = true;
				}

				thisRoom = roomMap[roomNumber];
				thisRoom.players.push(playerName);
				req.session.channel.subscribe(roomNumber);
				ss.publish.channel(roomNumber, 'addPlayer', playerName);
				req.session.setUserId(playerName);
				return res(thisRoom.blocks, first);
			},

			requireReward: function(numReward, lastReward, channel) {
				var data = getRewardCubePosition(numReward, lastReward);
				for (var i = 0; i < data.length;i++) {
					roomMap[channel].worldMap[data[i].x][data[i].y][data[i].z] = BONUS_CELL;
				}
				ss.publish.channel(channel, 'addRewardlist', data);
			},

			botMove: function(position, channel) {
				if (roomMap[channel].worldMap[position.x][position.y][position.z] == BONUS_CELL) {
					var nextReward = new Object();
					nextReward.x = position.x;
					nextReward.y = position.y;
					nextReward.z = position.z + 15;
					//FIXME
					roomMap[channel].blocks += Math.floor(getReward(roomMap[channel].blocks, position,nextReward,2)) + 1;
					var data = getRewardCubePosition(1, position);
					ss.publish.channel(channel, 'addblocksLeftNum', roomMap[channel].blocks);
					ss.publish.channel(channel, 'addRewardlist', data);
				}
				roomMap[channel].worldMap[roomMap[channel].botPosition.x][roomMap[channel].botPosition.y][roomMap[channel].botPosition.z] = EMPTY_CELL;
				roomMap[channel].botPssition = position;
				roomMap[channel].worldMap[position.x][position.y][position.z] = PLAYER_CELL;
				ss.publish.channel(channel, 'moveBot', position);
			},

			getRewardNum: function(currentReward, nextReward, channel) {
			},

			syncWorld: function(channel) {
				 return res(roomMap[channel]);
			},

	};

};
