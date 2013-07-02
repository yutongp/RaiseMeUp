if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var EMPTY_CELL = 0;
var VOXEL_CELL = 1;
var BOT_CELL = -1;
var BONUS_CELL = -2;
var SPEED =  50 / 7200;
//var SPEED =  000000000;
var R_ADDBLOCK = 0;
var R_ADDPLAYER = 1;


var INITIAL_CAMERA_HEIGHT = 800;
var INITBLOCKS = 50;

var firstPlayer = false;
var localPlayer, localRoom;

var bckgrd_bgm, build_block_bgm, player_move_bgm, coin_bgm;

var container, stats;
var camera, scene, renderer;
var projector, plane, cube;
var movingPlane;
var mouse2D, mouse3D, raycaster,
	rollOveredFace, isShiftDown = false,
	theta = 45 * 0.5, isCtrlDown = false;

var rollOverMesh, rollOverMaterial;
var voxelPosition = new THREE.Vector3(), tmpVec = new THREE.Vector3(), normalMatrix = new THREE.Matrix3();
var cubeGeo, cubeMaterial;
var i, intersector;


var gridCellSize = 100;
var gridCellNumber = 10;
var gridHeight = 3000;
var waterPosition = 0;
var oldWaterPosition = 0;
var oldWaterPostion = 0;
var worldIndex = 0;

var botGeo;
var botMaterial;
var bot;

var bonusGeo;
var bonusMaterial;
var bounds = {maxX: 9, maxY: 9, minX:0, minY:0};

var startTime = 0;
var clock;
var score = 0;
var gameOverPosition = -1;

var rewardHash = new Array();
var highestReward = 6;

var unCountedObjectArray;
var previousIndex;

var mouseXOnMouseDown = 0;
var mouseX = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var targetRotationOnMouseDown = 0;
var targetRotation = 0;
var mouseDown = false;

//#AI
var moveDelay = 800; //ms
var nextMoveCall;
var visited  = 1000
var fromLeft = 1001; // x + 1
var fromRight = 1002;// x - 1
var fromUp = 1003;// y + 1;
var fromBot = 1004;// y - 1
var fromNothing = 1005;
var skipDistReward = 20;
var mapHashHeight = 30;

function Player(name, color) {
	this.name = name;
	this.color = color;
}

function Room (roomn, itime) {
	this.players = {};
	this.blocks = INITBLOCKS;
	this.roomNumber = roomn;
	this.botPosition = {x:0, y:0, z: 0};
	this.initTime = itime;
	this.aiStat = true;

	this.worldMap = new Array();
	for (var i = 0; i<gridCellNumber; i++) {
		this.worldMap[i] = new Array();
		for (var j = 0; j<gridCellNumber; j++){
			this.worldMap[i][j] = new Array();
			for (var k = 0; k<gridHeight; k++)
				this.worldMap[i][j][k] = EMPTY_CELL;
		}
	}

	this.addPlayer = function (name, color) {
		if (this.players[name] == undefined) {
			this.players[name] = new Player(name, color);
		} else {
			name += "1";
			this.players[name] = new Player(name, color);
		}
	}

	this.rmPlayer = function () {
		if (this.players[name] != undefined) {
			this.players[name] = undefined;
		}
	}

	this.worldMapSetType = function(position, type) {
		this.worldMap[position.x][position.y][position.z] = type;
	}

	this.worldMapCheckType = function(position) {
		return this.worldMap[position.x][position.y][position.z];
	}

	this.botPositionUpdate = function(position) {
		this.botPosition = position
	}
}

$(document).ready(function() {
	showInstruction();

	bckgrd_bgm = new Howl({
		urls: ['https://s3.amazonaws.com/Seattle-Pong/bckgrd_music.wav'],
				 autoplay: true,
				 loop: true,
	});

	build_block_bgm = new Howl({
		urls: ['https://s3.amazonaws.com/Seattle-Pong/bk.ogg'],
					  autoplay: false,
					  loop: false,
	});


	player_move_bgm = new Howl({
		urls: ['https://s3.amazonaws.com/Seattle-Pong/move.WAV'],
				autoplay: false,
				loop: false,
				volume: 0.3
	});


	coin_bgm = new Howl({
		urls: ['https://s3.amazonaws.com/Seattle-Pong/coin.WAV'],
		 autoplay: false,
		 loop: false,
		 volume: 0.9
	});

	bckgrd_bgm.fade(0, 1, 12000);
});



function gameInit() {
	connecttoGame();

	ss.event.on('addBox', function(data, channelNumber) {
		if (data[0] == 0) {
			//from function onDocumentMouseDown
			if ( data[1] != plane ) {
				scene.remove( data[1] );
			}
		}
		if (data[0] == 1) {
			if (localRoom.worldMapCheckType(data[1]) == EMPTY_CELL && localRoom.blocks > 0) {
				addVoxel( data[1], parseInt("0x" + data[2].substring(1)) );
				localRoom.worldMapSetType(data[1], VOXEL_CELL);
				localRoom.blocks = localRoom.blocks - 1;
				if (window.innerWidth < 600) {
					document.getElementById('blockNum-d').innerHTML = localRoom.blocks.toString()+'<br><br>';
				} else {
					document.getElementById('blockNum').innerHTML = localRoom.blocks.toString()+'<br><br>';
				}
			}
		}
	});

	ss.event.on('addRewardlist', function(data, channelNumber) {
		var rewardin = false;
		for (var i = 0; i < data.length;i++) {
			rewardin = false;
			for (var j =0; j< rewardHash.length; j++) {
				if (rewardHash[j] == undefined) {
					rewardHash[j] = addBonus(data[i]);
					rewardin = true;
					break;
				}
			}
			if (rewardin == false) {
				rewardHash.push(addBonus(data[i]));
			}
		}
		if (localRoom.aiStat && firstPlayer) {
			initAI();
		}
	});

	ss.event.on('addblocksLeftNum', function(tblocks, addBlocks, channelNumber) {
		localRoom.blocks = tblocks;
		if (window.innerWidth < 600) {
			document.getElementById('blockNum-d').innerHTML = localRoom.blocks.toString()+'<br><br>';
		} else {
			document.getElementById('blockNum').innerHTML = localRoom.blocks.toString()+'<br><br>';
		}
		realtimeinfo(addBlocks, R_ADDBLOCK);
	});

	ss.event.on('newPlayerIn', function(player, channelNumber) {
		if (player.name != localPlayer.name) {
			showPlayeronMenu(player);
			realtimeinfo(player, R_ADDPLAYER);
		}
		localRoom.addPlayer(localPlayer.name, localPlayer.color);
	});

	ss.event.on('playerOut', function(player, channelNumber) {
		realtimeinfo(player, R_RMPLAYER);
		removePlayeronMenu(player);
	});

	ss.event.on('moveBot', function(data, hr, channelNumber) {
		highestReward = hr;
		moveBot(data);
	});

	ss.event.on('setAI_s', function(stat, channelNumber) {
		localRoom.aiStat = stat;
	});

}

function connecttoGame() {
	ss.rpc('demo.connectGame', localPlayer, localRoom.roomNumber, localRoom.initTime, function(initBlocks, first) {
		firstPlayer = first;
		localRoom.blocks = initBlocks;
		gameboard_init();
		animate();
	});
}


function requireReward(numReward, lastReward) {
	ss.rpc('demo.requireReward', numReward, lastReward, localRoom.roomNumber);
}

function countScore(){
	if (Date.now() - localRoom.initTime > 2000) {
		score = score + 77;
		if (window.innerWidth < 600) {
			document.getElementById('scoreboard-d').innerHTML = score.toString();
		} else {
			document.getElementById('scoreboard').innerHTML = score.toString();
		}
	}
}

function gameboard_init() {
	previousIndex = new Object();
	previousIndex.x = 0;
	previousIndex.y = 0;
	previousIndex.z = 0;
	unCountedObjectArray = new Array();
	if (firstPlayer == true) {
		requireReward(5, localRoom.botPosition);
	} else {
		ss.rpc('demo.syncWorld', localPlayer, localRoom.roomNumber, function(worldData){
			localRoom.players = worldData.players;
			localRoom.blocks = worldData.blocks;
			localRoom.botPosition = worldData.botPosition;
			localRoom.initTime = worldData.initTime;
			localRoom.worldMap = worldData.worldMap;
			localRoom.aiStat = worldData.aiStat;
			var waterPos = Math.floor(((Date.now() - localRoom.initTime ) * SPEED) / gridCellSize);
			var n = new Object();
			for (var i = 0; i < gridCellNumber; i++) {
				for (var j = 0; j < gridCellNumber; j++){
					for (var k = 0; k < gridHeight; k++) {
						n.x = i;
						n.y = j;
						n.z = k;
						if (localRoom.worldMapCheckType(n) == VOXEL_CELL) {
							addVoxel(n);
							n = new Object();
						} else if (localRoom.worldMapCheckType(n) == BOT_CELL) {
							moveBot(n);
							n = new Object();
						} else if (localRoom.worldMapCheckType(n) == BONUS_CELL) {
							if(n.z >= waterPos) {
								rewardHash.push(addBonus(n));
								n = new Object();
							}
						}
					}
				}
			}

			console.log("rewardHash", rewardHash);
			for ( var m in localRoom.players) {
				if (localRoom.players[m].name != localPlayer.name) {
					showPlayeronMenu(localRoom.players[m]);
				}
			}

		});
	}
	container = document.createElement( 'div' );
	container.setAttribute('id', 'game_board');
	document.body.appendChild( container );

	var info = document.createElement('div');
	if (window.innerWidth < 600) { //Detect devices
		//TODO change back to info-d
		info.id = 'info';
		info.innerHTML = '<br><div id="device-1"><a>SCORE: </a><a id="scoreboard-d">0</a></div><div id="device-2"><a>Number of CUBEs left: </a><a id="blockNum-d">'+localRoom.blocks+'</a></div><br>';
		container.appendChild(info);
	}
	else {
		info.id = 'info';
		//info.innerHTML = '<br><a>SCORE: </a><br><a id="scoreboard">0</a><br><br><a>Number of CUBEs left: </a><br><a id="blockNum">'+localRoom.blocks+'<br><br></a><div id="team"><a>Current players:</a></div><br><br>';
		info.innerHTML = '<br><a>SCORE: </a><br><a id="scoreboard">0</a><br><br><a>Number of CUBEs left: </a><br><a id="blockNum">'+localRoom.blocks+'<br><br></a><div id="team"><a>Current players:</a></div><br><br><input type="button" id = "mute_bckgrd_music" onlick="x,." value="Mute"/><br><input type="button" id = "unmute_bckgrd_music" onlick="x,." value="Unmute"/>';
		container.appendChild(info);
		$("#mute_bckgrd_music").click(
			function(){

				bckgrd_bgm.pause();
			}		
		);
		$("#unmute_bckgrd_music").click(
			function(){
				bckgrd_bgm.play();
			}		
		);

	}
	$("#info").css("opacity", 0.7);

	clock=self.setInterval(function(){countScore()},100);
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.y = INITIAL_CAMERA_HEIGHT;

	scene = new THREE.Scene();

	// roll-over helpers

	rollOverGeo = new THREE.CubeGeometry( gridCellSize, gridCellSize, gridCellSize );
	rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
	rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
	scene.add( rollOverMesh );

	// cubes

	cubeGeo = new THREE.CubeGeometry( gridCellSize, gridCellSize, gridCellSize );
	//cubecolorfeed ="0."
	//for (var i = 0; i < playerName.length; i++) {
	//cubecolorfeed += playerName.charCodeAt(i).toString();
	//}

	showPlayeronMenu(localPlayer);
	$(window).bind('beforeunload', function(){
		ss.rpc('demo.playerClose', localPlayer, localRoom.roomNumber);
	});

	cubeMaterial = new THREE.MeshLambertMaterial( { color: parseInt(localPlayer.color), ambient: 0xffffff, shading: THREE.FlatShading } );

	//cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xfeb74c, ambient: 0x00ff80, shading: THREE.FlatShading, map: THREE.ImageUtils.loadTexture( "http://threejs.org/examples/textures/square-outline-textured.png" ) } );


	botGeo = new THREE.SphereGeometry(50,50,30);
	botMaterial = new THREE.MeshPhongMaterial( { color: 0xfe00b7, ambient: 0xffffff, shading: THREE.FlatShading } );
	bot = new THREE.Mesh(botGeo, botMaterial);
	bot.matrixAutoUpdate = false;
	moveBot(localRoom.botPosition);
	scene.add(bot);

	bonusGeo = new THREE.TorusGeometry( 25, 10, 20, 20 );
	bonusMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00, ambient: 0x555555, specular: 0xffffff, metal: true } );


	// picking

	projector = new THREE.Projector();

	// grid

	var gridSize = gridCellSize * gridCellNumber;

	plane = new THREE.Mesh( new THREE.PlaneGeometry( gridSize, gridSize, gridCellNumber, gridCellNumber ), new THREE.MeshBasicMaterial( { color: 0x555555, wireframe: true } ) );
	plane.rotation.x = - Math.PI / 2;
	scene.add( plane );
	var waterMaterial = new THREE.MeshBasicMaterial( { color: 0x00aaaa, opacity: 0.2, transparent: true} );
	waterMaterial.depthWrite = false;
	movingPlane = new THREE.Mesh( new THREE.CubeGeometry( gridSize, gridSize, 10 ), waterMaterial);
	movingPlane.y = -100;
	movingPlane.rotation.x = - Math.PI / 2;
	scene.add( movingPlane );
	//unCountedObjectArray.push(movingPlane);

	mouse2D = new THREE.Vector3( 0, 10000, 0.5 );

	// Lights

	var ambientLight = new THREE.AmbientLight( 0x606060 );
	scene.add( ambientLight );

	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
	scene.add( directionalLight );

	renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );

	$('#game_board').append("<div id='grid'></div>");
	$('#grid').append( renderer.domElement );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	$('#grid').append( stats.domElement );
	//TODO change hard code stlye to denamic one
	$('#grid').append('<div id="realtimeinfo" style="margin-left: -100px; display: block; position: fixed; width: 200px; height: 10px; top: 50%; left: 50%; font-size: 20px;"></div>');
	$('#grid').bind('mousedown', onDocumentMouseDown);
	$('#grid').bind('mousemove', onDocumentMouseMove);

	document.addEventListener( 'keydown', onDocumentKeyDown, false );
	document.addEventListener( 'keyup', onDocumentKeyUp, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );

	$(window).keypress(function(e){
		var new_position = new Object();
		new_position.x = localRoom.botPosition.x;
		new_position.y = localRoom.botPosition.y;
		new_position.z = localRoom.botPosition.z - 1;
		var next_position = new Object();
		next_position.z = -2;
		switch (e.which) {
			case 115:
				clearTimeout(nextMoveCall);
				console.log('down');
				next_position = canGoDown(new_position, localRoom.worldMap, worldIndex, waterPosition);
				break;
			case 119:
				console.log('up');
				next_position = canGoUp(new_position, localRoom.worldMap, worldIndex,  waterPosition);
				break;
			case 97:
				console.log('left');
				next_position = canGoLeft(new_position, localRoom.worldMap, worldIndex,  waterPosition);
				break;
			case 100:
				console.log('right');
				next_position = canGoRight(new_position, localRoom.worldMap, worldIndex,  waterPosition);
				break;

			case 61:
				//#AI
				
				if (localRoom.aiStat == false) {
					setAIstate(true);
					initAI();
				} else {
					setAIstate(false);
				}
				break;
			default:
		}
		if (next_position.z != -2) {
			new_position.x = next_position.x;
			new_position.y = next_position.y;
			new_position.z = next_position.z+1;
			moveBotWrapper(new_position);
		}
	});

	window.addEventListener( 'resize', onWindowResize, false );
}

var getNearestReward = function(){
	var minDist = 9999;
	var nearestReward;
	console.log("reward L: ",rewardHash.length)
		for (var i = 0; i < rewardHash.length; i++) {

			if ((rewardHash[i] != undefined)&&rewardHash[i].index.z>=waterPosition) {
				var dist = Math.abs(rewardHash[i].index.x-localRoom.botPosition.x);
				dist+= Math.abs(rewardHash[i].index.y-localRoom.botPosition.y);
				dist+= Math.abs(rewardHash[i].index.z-localRoom.botPosition.z);
				console.log("dist: ",dist);
				if(dist<minDist){
					nearestReward = rewardHash[i];
					minDist = dist;
				}
				//Fix Me consider water level;
			}
		}
	return nearestReward;
}

function getPath3(){
	var bestScore = -99999999;
	var nearestReward;
	var bestPath;
	console.log("reward L: ",rewardHash.length)
		for (var i = 0; i < rewardHash.length; i++) {

			if ((rewardHash[i] != undefined)&&rewardHash[i].index.z>=waterPosition) {
                
                var dist = Math.abs(rewardHash[i].index.x-localRoom.botPosition.x);
				dist+= Math.abs(rewardHash[i].index.y-localRoom.botPosition.y);
				dist+= Math.abs(rewardHash[i].index.z-localRoom.botPosition.z);

                if(dist>skipDistReward)
                    continue;
                
				var target = new Object();
				target.x = rewardHash[i].index.x;
				target.y = rewardHash[i].index.y;
				target.z = rewardHash[i].index.z - 1;
				var cP = new Object();
				cP.x = localRoom.botPosition.x;
				cP.y = localRoom.botPosition.y;
				cP.z = localRoom.botPosition.z - 1;
				path = getPath2(localRoom.worldMap,cP,target);
                var findIt = path.pop();
                console.log("ssssss",path);
                var score = findIt*100000 -dist*1000 + 999 - path.length;
				if (score>bestScore){
					bestPath = path;
					bestScore = score;
				}

				//Fix Me consider water level;
			}
		}
	return bestPath;



}

var getPath2 = function(world,startCube,targetCube){
	//0 >; 1 ^ ; 2 < ; v
	var queue = [];
	queue.push(startCube);
	console.log("start:", startCube);
	console.log("target:",targetCube);
	

	var cloestCube = startCube;
	var minDist = 9999;
	var usedBlock = [];

	var tmpMap = new Array();
	for (var i = 0; i<gridCellNumber; i++) {
		tmpMap[i] = new Array();
		for (var j = 0; j<gridCellNumber; j++){
			tmpMap[i][j] = new Array();
			for (var k = waterPosition; k<waterPosition+mapHashHeight; k++){
				tmpMap[i][j][k] = world[i][j][k];
            }
		}
	}
    tmpMap[startCube.x][startCube.y][startCube.z] = fromNothing;
	//world = tmpMap;



    var findIt = false;
	while(queue.length!=0){
		var cube = queue.shift();

		var dist = blocksNeedBetweenTwoReward(cube,targetCube)
			if(minDist > dist){
				minDist = dist;
				cloestCube = cube;
			}
		if(xyzMatch(cube,targetCube)){
			cloestCube = cube;
            findIt = true;
			break;
		}else{



			var nextCube1 = canGoLeft(cube,tmpMap, worldIndex, waterPosition);
			if(nextCube1.z!=-2&&!(tmpMap[nextCube1.x][nextCube1.y][nextCube1.z]>visited)&&nextCube1.z>=waterPosition-2){
				tmpMap[nextCube1.x][nextCube1.y][nextCube1.z] = fromRight;
				queue.push(nextCube1);
				//console.log("push1: ",nextCube1);
			}

            //console.log("cube1: ",nextCube1);
            //console.log("cube1: ",nextCube1.z!=-2&&(tmpMap[nextCube1.x][nextCube1.y][nextCube1.z]>visited));
            
			var nextCube2 = canGoRight(cube,tmpMap, worldIndex, waterPosition);
			if(nextCube2.z!=-2&&!(tmpMap[nextCube2.x][nextCube2.y][nextCube2.z]>visited)&&nextCube2.z>=waterPosition-2){
				tmpMap[nextCube2.x][nextCube2.y][nextCube2.z] = fromLeft;
				queue.push(nextCube2);
				//console.log("push2: ",nextCube2);
                
			}
            
            //console.log("cube2: ",nextCube2);
            //console.log("cube2: ",nextCube2.z!=-2&&(tmpMap[nextCube2.x][nextCube2.y][nextCube2.z]>visited));

			var nextCube3 = canGoUp(cube,tmpMap, worldIndex, waterPosition);
			if(nextCube3.z!=-2&&!(tmpMap[nextCube3.x][nextCube3.y][nextCube3.z]>visited)&&nextCube3.z>=waterPosition-2){
				tmpMap[nextCube3.x][nextCube3.y][nextCube3.z] = fromBot;
				queue.push(nextCube3);
				//console.log("push3: ",nextCube3);
			}

            //console.log("cube3: ",nextCube3);
            //console.log("cube3: ",nextCube3.z!=-2&&(tmpMap[nextCube3.x][nextCube3.y][nextCube3.z]>visited));
			var nextCube4 = canGoDown(cube,tmpMap, worldIndex, waterPosition);
			if(nextCube4.z!=-2&&!(tmpMap[nextCube4.x][nextCube4.y][nextCube4.z]>visited)&&nextCube4.z>=waterPosition-2){
				tmpMap[nextCube4.x][nextCube4.y][nextCube4.z] = fromUp;
				queue.push(nextCube4);
				//console.log("push4: ",nextCube4);
			}
			//console.log("cube4: ",nextCube4);
            //console.log("cube4: ",nextCube4.z!=-2&&(tmpMap[nextCube4.x][nextCube4.y][nextCube4.z]>visited));

		}

	}

	var path = [];
    //new AI
    
	console.log("cloestCube ",cloestCube);
	var currentCube = cloestCube;
	while(!xyzMatch(currentCube,startCube)){
		//for(var i=0;i<10;i++){
		var fromDirection = tmpMap[currentCube.x][currentCube.y][currentCube.z];
		/*var fromLeft = 1001; // x + 1
		  var fromRight = 1002;// x - 1
		  var fromUp = 1003;// y + 1;
		  var fromBot = 1004;// y - 1*/
		switch (fromDirection) {
			case 1003:
				console.log('down');
				path.push(115);
				break;
			case 1004:
				console.log('up');
				path.push(119);
				break;
			case 1002:
				console.log('left');
				path.push(97);
				break;
			case 1001:
				console.log('right');
				path.push(100);
				break;              
			default:
		}

		if(fromDirection == fromRight){
			currentCube = canGoRight(currentCube,tmpMap, worldIndex, waterPosition);
		}

		if(fromDirection == fromLeft){
			currentCube = canGoLeft(currentCube,tmpMap, worldIndex, waterPosition);
		}

		if(fromDirection == fromBot){
			currentCube = canGoDown(currentCube,tmpMap, worldIndex, waterPosition);
		}

		if(fromDirection == fromUp){
			currentCube = canGoUp(currentCube,tmpMap, worldIndex, waterPosition);
		}
		console.log("fromDirection: ",fromDirection," current: ",currentCube);
	}
	//}
	console.log("hahaha",path);
	var path2 = [];
	while(path[0]!=undefined){
		path2.push(path.pop());
	}
	console.log("path2: ",path2);
    path2.push(findIt);
	return path2;

}

//#AI
function xyzMatch(cube1,cube2) {
	return ((cube1.x == cube2.x) && (cube1.y == cube2.y) && (cube1.z == cube2.z));
}

function setAIstate(stat) {
	ss.rpc("demo.setAI_c", stat, localRoom.roomNumber);
}

function initAI() {
	console.log('ai start');
	var target = new Object();
	var nearestReward = getNearestReward();
	console.log("nearest: ",nearestReward);
	target.x = nearestReward.index.x;
	target.y = nearestReward.index.y;
	target.z = nearestReward.index.z - 1;
	var cP = new Object();
	cP.x = localRoom.botPosition.x;
	cP.y = localRoom.botPosition.y;
	cP.z = localRoom.botPosition.z - 1;
	path = getPath3();//getPath2(localRoom.worldMap,cP,target);
	console.log("path init: ",path);
	aiMove(path);
}

//#AI
function findNewPath(){
	console.log('ai start');
	var target = new Object();
	var nearestReward = getNearestReward();
	console.log("nearest: ",nearestReward);
	target.x = nearestReward.index.x;
	target.y = nearestReward.index.y;
	target.z = nearestReward.index.z - 1;
	var cP = new Object();
	cP.x = localRoom.botPosition.x;
	cP.y = localRoom.botPosition.y;
	cP.z = localRoom.botPosition.z - 1;
	path = getPath3();//getPath2(localRoom.worldMap,cP,target);
	console.log("find new path: ",path);
	aiMove(path);

}

//#AI
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


function aiMove(path){
	aiMoveHelper(path,0);
}

function aiMoveHelper(path,count){

	if (count == path.length){
		return;
	}

	var new_position = new Object();
	new_position.x = localRoom.botPosition.x;
	new_position.y = localRoom.botPosition.y;
	new_position.z = localRoom.botPosition.z - 1;
	var next_position = new Object();
	next_position.z = -2;
	console.log("!!!",path[count]," ",count);
	switch (path[count]) {
		case 115:
			console.log('down');
			next_position = canGoDown(new_position, localRoom.worldMap, worldIndex, waterPosition);
			break;
		case 119:
			console.log('up');
			next_position = canGoUp(new_position, localRoom.worldMap, worldIndex,  waterPosition);
			break;
		case 97:
			console.log('left');
			next_position = canGoLeft(new_position, localRoom.worldMap, worldIndex,  waterPosition);
			break;
		case 100:
			console.log('right');
			next_position = canGoRight(new_position, localRoom.worldMap, worldIndex,  waterPosition);
			break;


		default:
	}
	if (next_position.z != -2) {
		new_position.x = next_position.x;
		new_position.y = next_position.y;
		new_position.z = next_position.z+1;
		console.log(i," ",new_position);
		moveBotWrapper(new_position);
		nextMoveCall =  setTimeout(function(){aiMoveHelper(path,count+1)},moveDelay);
	}


}

function moveBotWrapper(new_position) {
	new_position.z = (new_position.z) % gridHeight + worldIndex;
	ss.rpc("demo.botMove", new_position, localRoom.roomNumber);
	player_move_bgm.play();
}


function showInstruction() {
	$('#instruction').lightbox_me({
		centered: true,
	closeClick: false,
	onLoad: function() {
		$('#instruction').find('button').focus()
	},
	onClose: function() {
		signIn();
	},
	closeSelector: ".startGame"
	});
}

function signIn() {
	$('#sign_up').lightbox_me({
		centered: true,
	closeClick: false,
	onLoad: function() {
		$('#sign_up').find('input:first').focus()
	},
	onClose: function() {
		var playerName = $('input[name="player_name"]').val();
		var roomNumber = $('input[name="room_number"]').val();
		var cubecolor = '#' + (function co(lor){   return (lor +=[0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)]) && (lor.length == 6) ?  lor : co(lor); })('');
		var initialTime = Date.now();
		if (playerName == '' || roomNumber == '') {
			$('#emptyInput').attr('style','visibility: visible;');
			signIn();
		}
		else {
			localPlayer = new Player(playerName, cubecolor);
			localRoom = new Room(roomNumber, initialTime);
			gameInit();
		}
	},
	closeSelector: ".confirm"
	});
}

function gameOver() {
	clock = window.clearInterval(clock);
	$('#gameOver_popup').lightbox_me( {
		centered: true,
		closeClick: false,
		onLoad: function() {
			document.getElementById('scored').innerHTML = score;
			document.getElementById('highest').innerHTML = waterPosition;
		}
	});
}

function realtimeinfo(data, type) {
	if (type == R_ADDBLOCK) {
		$("#realtimeinfo").css('color', localPlayer.color);
		$("#realtimeinfo").text("+ "+ data +" CUBE");
		$("#realtimeinfo").fadeOut(1100, function() {
			$("#realtimeinfo").text("");
			$("#realtimeinfo").fadeIn();
		});
	}
	if (type == R_ADDPLAYER) {
		$("#realtimeinfo").css('color', data.color);
		$("#realtimeinfo").text("Player: "+ data.name +" in");
		$("#realtimeinfo").fadeOut(1100, function() {
			$("#realtimeinfo").text("");
			$("#realtimeinfo").fadeIn();
		});
	}
	if (type == R_RMPLAYER) {
		$("#realtimeinfo").css('color', data.color);
		$("#realtimeinfo").text("Player: "+ data.name +" leave");
		$("#realtimeinfo").fadeOut(1100, function() {
			$("#realtimeinfo").text("");
			$("#realtimeinfo").fadeIn();
		});
	}
}

function showPlayeronMenu(player) {
	if (window.innerWidth > 600) {
		$('#team').append('<br><a id="'+player.name+'"style="color:' + player.color + ';">'+player.name+'</a>');
	}
}

function removePlayeronMenu(player) {
	if (window.innerWidth > 600) {
		$('#'+player.name).remove();
	}
}

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function getRealIntersector( intersects ) {

	for( i = 0; i < intersects.length; i++ ) {

		intersector = intersects[ i ];
		if (intersector.object == movingPlane)
			continue;
		if (intersector.object == bot)
			continue;
		if (intersector.object == rollOverMesh)
			continue;
		var check = 1;
		for (var j = 0; j < unCountedObjectArray.length; j++){

			if (intersector.object == unCountedObjectArray[j]){

				check = 0;
				break;

			}
		}
		if (check == 1)
			return intersector;

	}

	return null;

}

function setVoxelPosition( intersector ) {
	var tmpPosition = new THREE.Vector3();

	normalMatrix.getNormalMatrix( intersector.object.matrixWorld );

	tmpVec.copy( intersector.face.normal );
	tmpVec.applyMatrix3( normalMatrix ).normalize();

	tmpPosition.addVectors( intersector.point, tmpVec );

	var centerPosition = new THREE.Vector3();

	centerPosition.x = Math.floor( tmpPosition.x / gridCellSize ) * gridCellSize + gridCellSize/2;
	centerPosition.y = Math.floor( tmpPosition.y / gridCellSize ) * gridCellSize + gridCellSize/2;
	centerPosition.z = Math.floor( tmpPosition.z / gridCellSize ) * gridCellSize + gridCellSize/2;
	/*	
		if (Math.abs(centerPosition.x - tmpPosition.x) > (7 / 16) * gridCellSize)
		return;
		if (Math.abs(centerPosition.y - tmpPosition.y) > (4 / 8) * gridCellSize)
		return;
		if (Math.abs(centerPosition.z - tmpPosition.z) > (7 / 16) * gridCellSize)
		return;
		*/
	var index = new Object();
	index.x = Math.floor( tmpPosition.x / gridCellSize ) + gridCellNumber / 2;
	index.y = Math.floor( tmpPosition.z / gridCellSize ) + gridCellNumber / 2;
	index.z = Math.floor( tmpPosition.y / gridCellSize );

	if (xyzMatch(index, localRoom.botPosition))
		return;
	if (index.x >= gridCellNumber || index.x < 0)
		return;
	if (index.y >= gridCellNumber || index.y < 0)
		return;
	if (index.z < 0)
		return;

	for (var i = 0; i < unCountedObjectArray.length; i++){
		var object = unCountedObjectArray[i];
		if (index.x == object.index.x && index.y == object.index.y && index.z == object.index.z)
			return;
	}
	rollOverMesh.index = index;

	voxelPosition = centerPosition;

}

function onDocumentMouseMove( event ) {
	event.preventDefault();
	if (mouseDown) {
		mouseX = event.clientX - windowHalfX;
		targetRotation = targetRotationOnMouseDown
			+ (mouseX - mouseXOnMouseDown) * 0.02;
	}


	mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	raycaster = projector.pickingRay( mouse2D.clone(), camera );

	var intersects = raycaster.intersectObjects( scene.children );

	if ( intersects.length > 0 ) {

		intersector = getRealIntersector( intersects );
		if ( intersector ) {

			setVoxelPosition( intersector );
			rollOverMesh.position = voxelPosition;

			var index = new Object();
			index.x = Math.floor( voxelPosition.x / gridCellSize ) + gridCellNumber / 2;
			index.y = Math.floor( voxelPosition.z / gridCellSize ) + gridCellNumber / 2;
			index.z = Math.floor( voxelPosition.y / gridCellSize );

			rollOverMesh.index = index;

		}

	}
}

function onDocumentMouseDown( event ) {

	event.preventDefault();

	mouseDown = true;
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'mouseout', onDocumentMouseOut, false );
	mouseXOnMouseDown = event.clientX - windowHalfX;
	targetRotationOnMouseDown = targetRotation;

	var intersects = raycaster.intersectObjects( scene.children );
	intersector = getRealIntersector( intersects );
	console.log(rollOverMesh.index);
	console.log(previousIndex);
	//ss.rpc('demo.clientMove', [1, rollOverMesh.index, cubecolor], roomNumber);
	if ( intersects.length > 0 ) {

		intersector = getRealIntersector( intersects );
		if (intersector == null){
			if (xyzMatch(rollOverMesh.index, previousIndex)) {
				ss.rpc('demo.clientMove', [1, rollOverMesh.index, localPlayer.color], localRoom.roomNumber);
			}
			previousIndex = rollOverMesh.index;
			return;
		}

		if ( isCtrlDown ) {

			// delete cube
			ss.rpc('demo.clientMove', [0, intersector.object], localRoom.roomNumber);
		} else {
			// create cube
			normalMatrix.getNormalMatrix( intersector.object.matrixWorld );

			tmpVec.copy( intersector.face.normal );
			tmpVec.applyMatrix3( normalMatrix ).normalize();
			if (xyzMatch(rollOverMesh.index, previousIndex)) {
				previousIndex = rollOverMesh.index;
				ss.rpc('demo.clientMove', [1, rollOverMesh.index, localPlayer.color], localRoom.roomNumber);
			} else {
				previousIndex = rollOverMesh.index;
			}
		}
	} else {

		if (xyzMatch(rollOverMesh.index, previousIndex)) {
			ss.rpc('demo.clientMove', [1, rollOverMesh.index, localPlayer.color], localRoom.roomNumber);
		}
		previousIndex = rollOverMesh.index;
	}
}

function onDocumentMouseUp( event ) {
	mouseDown = false;
}

function onDocumentMouseOut( event ) {
	mouseDown = false;
}

function onDocumentTouchStart( event ) {

	if ( event.touches.length === 1 ) {

		//event.preventDefault();

		mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
		targetRotationOnMouseDown = targetRotation;

	}

}

function onDocumentTouchMove( event ) {

	if ( event.touches.length === 1 ) {

		event.preventDefault();

		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.05;

	}

}

function onDocumentKeyDown( event ) {

	switch( event.keyCode ) {

		case 16: isShiftDown = true; break;
		case 17: isCtrlDown = true; break;

	}

}

function onDocumentKeyUp( event ) {

	switch ( event.keyCode ) {

		case 16: isShiftDown = false; break;
		case 17: isCtrlDown = false; break;

	}

}

function animate() {

	requestAnimationFrame( animate );

	render();
	stats.update();

}

function render() {

	if ( isShiftDown ) {

		theta += mouse2D.x * 1.5;

	}

	/*raycaster = projector.pickingRay( mouse2D.clone(), camera );

	  var intersects = raycaster.intersectObjects( scene.children );

	  if ( intersects.length > 0 ) {

	  intersector = getRealIntersector( intersects );
	  if ( intersector ) {

	  setVoxelPosition( intersector );
	  rollOverMesh.position = voxelPosition;

	  }

	  }*/

	var currentWaterHeight = (Date.now() - localRoom.initTime ) * SPEED;
	waterPosition = Math.floor(currentWaterHeight / gridCellSize);
	waterFlow(waterPosition);

	theta = -targetRotation * 10;
	// check if game overs
	if (localRoom.botPosition.z + 1 <= waterPosition && localRoom.botPosition.z != gameOverPosition){
		gameOverPosition = localRoom.botPosition.z;
		gameOver();
	}


	camera.position.x = 1400 * Math.sin( THREE.Math.degToRad( theta ) );
	camera.position.z = 1400 * Math.cos( THREE.Math.degToRad( theta ) );
	camera.position.y = currentWaterHeight + INITIAL_CAMERA_HEIGHT;

	movingPlane.position.copy( new THREE.Vector3(0,currentWaterHeight / 2,0) );
	movingPlane.scale.z = (currentWaterHeight) / 10;

	camera.lookAt( new THREE.Vector3(0,currentWaterHeight,0));
	renderer.render( scene, camera );

	//if (Date.now() - initialTime > 10000) {
	//if (startTime == 0)
	//startTime = Date.now();
	//var currentWaterHeight = (Date.now() - startTime ) * SPEED;
	//waterPosition = Math.floor(currentWaterHeight / gridCellSize);
	//camera.position.x = 1400 * Math.sin( THREE.Math.degToRad( theta ) );
	//camera.position.z = 1400 * Math.cos( THREE.Math.degToRad( theta ) );
	//camera.position.y = currentWaterHeight + INITIAL_CAMERA_HEIGHT;
	//movingPlane.position.y = currentWaterHeight;
	//camera.lookAt( new THREE.Vector3(0,currentWaterHeight,0));
	//renderer.render( scene, camera );
	//}
	//else {
	//camera.position.x = 1400 * Math.sin( THREE.Math.degToRad( theta ) );
	//camera.position.z = 1400 * Math.cos( THREE.Math.degToRad( theta ) );
	//camera.position.y = INITIAL_CAMERA_HEIGHT;
	//camera.lookAt( new THREE.Vector3(0,0,0));
	//renderer.render( scene, camera );
	//}
}

function addVoxel(position, materialColor) {
	//if (position.x < 0 || position.x >= gridCellNumber)
		//return;
	//if (position.y < 0 || position.y >= gridCellNumber)
		//return;
	//if (position.z < 0)
		//return;

	//stop ai move #AI
	clearTimeout(nextMoveCall);
	if (localRoom.aiStat) {
		nextMoveCall =  setTimeout( function(){findNewPath()},moveDelay);
	}

	cubeMaterial = new THREE.MeshLambertMaterial( { color: materialColor, ambient: 0xffffff, shading: THREE.FlatShading } );
	var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
	var gridSize = gridCellSize * gridCellNumber;
	var xCoordinate = position.x * gridCellSize + gridCellSize / 2 - gridSize / 2;
	var yCoordinate = position.z * gridCellSize + gridCellSize / 2;
	var zCoordinate = position.y * gridCellSize + gridCellSize / 2 - gridSize / 2;
	voxel.position.copy( new THREE.Vector3(xCoordinate,yCoordinate,zCoordinate) );
	voxel.matrixAutoUpdate = false;
	voxel.updateMatrix();
	scene.add( voxel );


	build_block_bgm.play();
}

function moveBot(position) {
	//if (position.x < 0 || position.x >= gridCellNumber)
	//return;
	//if (position.y < 0 || position.y >= gridCellNumber)
	//return;
	//if (position.z < 0) 
	//return;
	//var xMoved = Math.abs(position.x - playerPosition.x);
	//var yMoved = Math.abs(position.y - playerPosition.y);
	//if (xMoved + yMoved > 1)
	//return;
	//if (position.z - playerPosition.z > 1)
	//return;
	///////

	///////

	checkReward(position);
	//webGL update bot object
	var gridSize = gridCellSize * gridCellNumber;
	var xCoordinate = position.x * gridCellSize + gridCellSize / 2 - gridSize / 2;
	var yCoordinate = position.z * gridCellSize + gridCellSize / 2;
	var zCoordinate = position.y * gridCellSize + gridCellSize / 2 - gridSize / 2;
	bot.position.copy( new THREE.Vector3(xCoordinate,yCoordinate,zCoordinate) );
	bot.updateMatrix();

	//update world map
	localRoom.worldMapCheckType(localRoom.botPosition, EMPTY_CELL);
	localRoom.botPosition.x = position.x;
	localRoom.botPosition.y = position.y;
	localRoom.botPosition.z = position.z;
	localRoom.worldMapCheckType(localRoom.botPosition, BOT_CELL);
}


function waterFlow(waterPos) {
	//wrap world map
	if ( waterPos - oldWaterPosition >=1 ) {
		//if (worldIndex + 1 == gridHeight)
		//worldIndex = 0;
		//else
		//worldIndex = worldIndex + 1;
		oldWaterPosition = waterPos;
		for (var i = 0; i < rewardHash.length; i++) {
			if (rewardHash[i] != undefined) {
				if(rewardHash[i].index.z == waterPos) {
					rewardHash[i] = undefined;
					requireReward(1, highestReward, localRoom.roomNumber);
					console.log('water flow reward');
				}
			}
		}
	}
}

function checkReward(position) {

	if (localRoom.worldMapCheckType(position) == BONUS_CELL) {
		for ( var i = 0; i < rewardHash.length; i++) {
			if (rewardHash[i] != undefined) {
				if(xyzMatch(rewardHash[i].index, position)) {
					console.log("reach reward",position);
					scene.remove(rewardHash[i]);
					rewardHash[i] = undefined;
					break;
				}
			}
		}
		//#AI
		if (localRoom.aiStat) {
			nextMoveCall =  setTimeout( function(){findNewPath()},500);
		}
		coin_bgm.play();//play eat coin sound
		return true;
	}
	return false;
}


function addBonus( position ) {
	if (position.x < 0 || position.x >= gridCellNumber)
		return;
	if (position.y < 0 || position.y >= gridCellNumber)
		return;
	if (position.z < 0)
		return;

	localRoom.worldMapSetType(position, BONUS_CELL);
	var bonus = new THREE.Mesh( bonusGeo, bonusMaterial );
	var gridSize = gridCellSize * gridCellNumber;
	var xCoordinate = position.x * gridCellSize + gridCellSize / 2 - gridSize / 2;
	var yCoordinate = position.z * gridCellSize + gridCellSize / 2;
	var zCoordinate = position.y * gridCellSize + gridCellSize / 2 - gridSize / 2;
	bonus.position.copy( new THREE.Vector3(xCoordinate,yCoordinate,zCoordinate) );
	bonus.matrixAutoUpdate = false;
	bonus.updateMatrix();
	bonus.index = position;
	scene.add( bonus );
	unCountedObjectArray.push(bonus);
	return bonus;
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

	if(cube.z>-1&&world[cube.x-1][cube.y][nextCube.z]<=0&&((nextCube.z==0)||world[cube.x-1][cube.y][down1Zindex]>=1)&&world[cube.x-1][cube.y][up1Zindex]<=0){

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

	if(cube.x+1>bounds.maxX){
		nextCube.z = -2;
		return nextCube;
	}

	if((cube.z == -1||world[cube.x+1][cube.y][nextCube.z]>=1)&&world[cube.x+1][cube.y][up1Zindex]<=0){

		return nextCube;
	}

	if(cube.z>-1&&world[cube.x+1][cube.y][nextCube.z]<=0&&((nextCube.z==0)||world[cube.x+1][cube.y][down1Zindex]>=1)&&world[cube.x+1][cube.y][up1Zindex]<=0){

		nextCube.z = down1Zindex;
		return nextCube;
	}

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

	if(cube.z>-1&&world[cube.x][cube.y-1][nextCube.z]<=0&&((nextCube.z==0)||world[cube.x][cube.y-1][down1Zindex]>=1)&&world[cube.x][cube.y-1][up1Zindex]<=0){

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
		nextCube.z = -2;
		return nextCube;
	}

	if((cube.z == -1||world[cube.x][cube.y+1][nextCube.z]>=1)&&world[cube.x][cube.y+1][up1Zindex]<=0){

		return nextCube;
	}

	if(cube.z>-1&&world[cube.x][cube.y+1][nextCube.z]<=0&&((nextCube.z==0)||world[cube.x][cube.y+1][down1Zindex]>=1)&&world[cube.x][cube.y+1][up1Zindex]<=0){

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
