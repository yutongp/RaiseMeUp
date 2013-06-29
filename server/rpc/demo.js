// Server-side Code
var rewardCubeHeightRange = 9;
var rewardCubeDistanceRange = 9;
var bounds = {maxX: 10, maxY: 10};
var heightDeltaRange = 6;
var MaxReward = 5;

var roomMap = {}

function Room (roomn) {
	this.players = new Array();
	this.blocks = 10;
	this.roomNumber = roomn;
	this.botposition = {x:0, y:0, z: 0};
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

	for(i = 0; i < numOfReward; i++){

		var newX = Math.random()*(bounds.maxX-bounds.minX)+bounds.minX;
		var newY = Math.random()*(bounds.maxY-bounds.minY)+bounds.minY;
		if(newX == curHigestReward.x){
			newX+=1;
		}
		if(newY == curHigestReward.y){
			newY+=1;
		}

		newZ += Math.random()*heightDeltaRange;

		curHigestReward.x = newX;
		curHigestReward.y = newY;
		curHigestReward.z = newZ;
		rewardCubes[i] = curHigestReward;

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
			ss.publish.channel(channel, 'addRewardlist', getReward(numReward, lastReward));
		},

	};

};
