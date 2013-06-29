// Server-side Code
var rewardCubeHeightRange = 9;
var rewardCubeDistanceRange = 9;
var bounds;
var heightDeltaRange = 6;
var MaxReward = 5;
// Define actions which can be called from the client using ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {

	// Example of pre-loading sessions into req.session using internal middleware
	req.use('session');

	// Uncomment line below to use the middleware defined in server/middleware/example
	//req.use('example.authenticated')

    //this function will calculate how many new blocks the user get.
    var getAward = function(currentNumOfBlocks, currentReward,nextReward,Map) {
        
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
        //if
    }
    
    var getRewardCubePosition = function (numOfReward,curHigestReward){
        rewardCubes = new Array();
        
        for(i = 0; i < numOfReward; i++){
            
            //random one howmany block we want user to put
           /* var rewardDistance = Math.floor(Math.random()*rewardCubeDistanceRange)+1;
            
            //random how many block we want user to put on the flat based
            //
            var flatDist = Math.min(Math.floor(Math.random()*rewardDistance)+1,(Math.max(bounds.maxX-curHigestReward.x,curHigestReward.x-1)+Math.max(bounds.maxY-curHigestReward.x,curHigestReward.y-1)));
            
            var xMax = Math.min(curHigestReward.x + flatDist,bounds.maxX);
            
            var xMin = Math.max(curHigestReward.x - flatDist,bounds.minX);
            
            var newX = Math.random()*(xMax-xMin);
            
            if(newX==curHigestReward.x){
                newX +=1;
            }
            
            var newY1 = curHigestReward.y + (flatDist - newX);
            var newY2 = curHigestReward.y - (flatDist - newX);
            var newY
            
            if(newY2<bounds.minY){
                newY = newY1;
            }else if(newY1>bounds.maxY){
                newY = newY2;
            }else{
                if(Math.random()>=0.5){
                    newY = newY1;
                }else{
                    newY = newY2;
                }
            }
            
            
            
            
            
            if(deltaX>curHigestReward-1){
                curHigestReward += deltaX;
            }else if(deltaX>bounds.maxX-curHigestReward.x){
                curHigestReward -= deltaX;
            }else{
               
            }
            
            
            var heightDist = (rewardDistance - flatDist);
            if(heightDist>flatDist){
                heightDist = (heightDist - flatDist)/2+flatDist;
            
            }
            
            var newZ = curHigestReward.z + heightDist;
            

            curHigestReward.distanceToNextReward = rewardDistance;
            rewardCubes[i] = curHigestReward;
            
            curHigestReward.x = newX;
            curHigestReward.y = newY;
            curHigestReward.z = newZ;*/
            
            var newX = Math.random()*bounds.maxX;
            var newY = Math.random()*bounds.maxX;
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
    
	return {

		sendMessage: function(message) {
			if (message && message.length > 0) {         // Check for blank messages
				ss.publish.all('newMessage', message);     // Broadcast the message to everyone
				return res(true);                          // Confirm it was sent to the originating client
			} else {
				return res(false);
			}
		},

		clientMove: function(data) {
			ss.publish.all('addBox', data)
			return res(true)
		}
	};

};
