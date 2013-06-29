if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var EMPTY_CELL = 0;
var VOXEL_CELL = 1;
var PLAYER_CELL = -1;
var BONUS_CELL = -2;
var SPEED = 30 / 7200;

var firstPlayer = false;
var INITIAL_CAMERA_HEIGHT = 800;

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
var playerName, roomNumber, blocksLeft;
var cubecolor;

var gridCellSize = 100;
var gridCellNumber = 10;
var gridHeight = 3000;
var worldMap = new Array();
var waterPosition = 0;
var oldWaterPosition = 0;
var oldWaterPostion = 0;
var worldIndex = 0;

var playerPosition = new Object();
var playerGeo;
var playerMaterial;
var player;

var bonusGeo;
var bonusMaterial;
var bounds = {maxX: 10, maxY: 10, minX:0, minY:0};

var initialTime;
var startTime = 0;
var countdownSecond = 10;
var clock;
var clock2;
var score = 0;
var gameOverPosition = -1;

var rewardHash = new Array();

var unCountedObjectArray;
var previousIndex;

var mouseXOnMouseDown = 0;
var mouseX = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var targetRotationOnMouseDown = 0;
var targetRotation = 0;
var mouseDown = false;


$(document).ready(function() {
	//ev.preventDefault();
	signIn();
});


function gameInit() {
	setSocket();

	ss.event.on('addBox', function(data, channelNumber) {
		if (data[0] == 0) {
			//from function onDocumentMouseDown
			if ( data[1] != plane ) {
				scene.remove( data[1] );
			}
		}
		if (data[0] == 1) {
			if (getCellType(data[1]) == 0 && blocksLeft > 0) {
				addVoxel( data[1], parseInt(data[2]) );
				setWorldMap(data[1], VOXEL_CELL);
				blocksLeft = blocksLeft - 1;
				document.getElementById('blockNum').innerHTML = blocksLeft.toString()+'<br><br>';
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
	});

	ss.event.on('addblocksLeftNum', function(data, channelNumber) {
		blocksLeft = data;
		document.getElementById('blockNum').innerHTML = blocksLeft.toString()+'<br><br>';
	});

	ss.event.on('moveBot', function(data, channelNumber) {
		movePlayer(data);
	});
}

function setSocket() {
	ss.rpc('demo.connectGame', playerName, roomNumber, function(initData, first) {
		firstPlayer = first;
		blocksLeft = initData;
		gameboard_init();
		animate();
	});
}


function requireReward(numReward, lastReward) {
	ss.rpc('demo.requireReward', numReward, lastReward, roomNumber);
}

function gameCountDown() {
	countdownSecond --;
	if (countdownSecond >= 0)
		document.getElementById('countSecond').innerHTML = countdownSecond.toString()+'<br>';
	else {
		$('#countdownBoard').attr('style','display: none;');
		clock2 = self.setInterval(function(){countScore()},100);
		clock = window.clearInterval(clock);
	}		
}

function countScore(){
	score = score + 77;
	document.getElementById('scoreboard').innerHTML = score.toString();	
}

function gameboard_init() {
	previousIndex = new Object();
	previousIndex.x = 0;
	previousIndex.y = 0;
	previousIndex.z = 0;
	unCountedObjectArray = new Array();
	initialTime = Date.now();

	for (var i = 0; i<gridCellNumber; i++) {
		worldMap[i] = new Array();
		for (var j = 0; j<gridCellNumber; j++){
			worldMap[i][j] = new Array();
			for (var k = 0; k<gridHeight; k++)
				worldMap[i][j][k] = EMPTY_CELL;
		}
	}
	playerPosition.x = 0;
	playerPosition.y = 0;
	playerPosition.z = 0;
	worldMap[playerPosition.x][playerPosition.y][playerPosition.z] = PLAYER_CELL;
	if (firstPlayer == true) {
		requireReward(5, playerPosition);
	} else {
		ss.rpc('syncWorld', roomNumber, function(worldData){
		});
	}
	container = document.createElement( 'div' );
	container.setAttribute('id', 'game_board');
	document.body.appendChild( container );

	var countdownBoard = document.createElement('div');
	countdownBoard.id = 'countdownBoard';
	countdownBoard.innerHTML = '<br><div id="countDown">Start flooding in...<br><a id="countSecond">10<br></a>';

	var info = document.createElement('div');
	info.id = 'info';
	info.innerHTML = '<br><a>SCORE: </a><br><a id="scoreboard">0</a><br><br><a>Number of CUBEs left: </a><br><a id="blockNum">'+blocksLeft+'<br><br></a><div id="team"><a>Current players:</a></div><br><br>';
	container.appendChild(countdownBoard);
	container.appendChild(info);

	initialTime = Date.now();
	clock=self.setInterval(function(){gameCountDown()},1000);
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.y = INITIAL_CAMERA_HEIGHT;

	scene = new THREE.Scene();

	// roll-over helpers

	rollOverGeo = new THREE.CubeGeometry( gridCellSize, gridCellSize, gridCellSize );
	rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
	rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
	scene.add( rollOverMesh );
	console.log(this, rollOverMesh);

	// cubes

	cubeGeo = new THREE.CubeGeometry( gridCellSize, gridCellSize, gridCellSize );
	//cubecolorfeed ="0."
	//for (var i = 0; i < playerName.length; i++) {
	//cubecolorfeed += playerName.charCodeAt(i).toString();
	//}

	//console.log(parseFloat(cubecolorfeed));
	cubecolor = '0x' + (function co(lor){   return (lor +=[0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)]) && (lor.length == 6) ?  lor : co(lor); })('');
	document.getElementById('team').innerHTML = $('#team').html()+'<br><a style="color: #'+cubecolor.substring(2)+';">'+playerName+'</a>';	

	cubeMaterial = new THREE.MeshLambertMaterial( { color: parseInt(cubecolor), ambient: 0xffffff, shading: THREE.FlatShading } );

	//cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xfeb74c, ambient: 0x00ff80, shading: THREE.FlatShading, map: THREE.ImageUtils.loadTexture( "http://threejs.org/examples/textures/square-outline-textured.png" ) } );


	playerGeo = new THREE.SphereGeometry(50,50,30);
	playerMaterial = new THREE.MeshPhongMaterial( { color: 0xfe00b7, ambient: 0xffffff, shading: THREE.FlatShading } );
	player = new THREE.Mesh(playerGeo, playerMaterial);
	player.matrixAutoUpdate = false;
	movePlayer(playerPosition);
	scene.add(player);

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
	waterMaterial.depthTest = false;
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
	$('#grid').bind('mousedown', onDocumentMouseDown);
	$('#grid').bind('mousemove', onDocumentMouseMove);

	document.addEventListener( 'keydown', onDocumentKeyDown, false );
	document.addEventListener( 'keyup', onDocumentKeyUp, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );

	$(window).keypress(function(e){
		var new_position = new Object();
		new_position.x = playerPosition.x;
		new_position.y = playerPosition.y;
		new_position.z = playerPosition.z - waterPosition - 1;
		var next_position = new Object();
		next_position.z = -2;
		switch (e.which) {
			case 115:
				console.log('down');
				next_position = canGoDown(new_position, worldMap, worldIndex, waterPosition);
				break;
			case 119:
				console.log('up');
				next_position = canGoUp(new_position, worldMap, worldIndex,  waterPosition);
				break;
			case 97:
				console.log('left');
				next_position = canGoLeft(new_position, worldMap, worldIndex,  waterPosition);
				break;
			case 100:
				console.log('right');
				next_position = canGoRight(new_position, worldMap, worldIndex,  waterPosition);
				break;
			default:
		}
		if (next_position.z != -2) {
			new_position.x = next_position.x;
			new_position.y = next_position.y;
			new_position.z = next_position.z+1;
			console.log(new_position);
			movePlayerWrapper(new_position);
		}
	});

	window.addEventListener( 'resize', onWindowResize, false );
}


function movePlayerWrapper(new_position) {
	new_position.z = (new_position.z-waterPosition) % gridHeight + worldIndex;
	ss.rpc("demo.botMove", new_position, roomNumber);
}

function signIn() {
	$('#sign_up').lightbox_me({
	centered: true,
	closeClick: false,
	onLoad: function() {
		$('#sign_up').find('input:first').focus()
	},
	onClose: function() {
		playerName = $('input[name="player_name"]').val();
		roomNumber = $('input[name="room_number"]').val();
		if (playerName == '' || roomNumber == '') {
			$('#emptyInput').attr('style','visibility: visible;');
			signIn();
		}
		else {
			gameInit();
		}
	},
	closeSelector: ".confirm"
	});
}

function gameOver() {
	clock2 = window.clearInterval(clock2);
	$('#gameOver_popup').lightbox_me( {
	centered: true,
	closeClick: false,
	onLoad: function() {
		document.getElementById('scored').innerHTML = score;
		document.getElementById('highest').innerHTML = waterPosition;
	}
	});
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
		if (intersector.object == player)
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
	
	if (index.x == playerPosition.x && index.y == playerPosition.y && index.z == playerPosition.z)
		return;
	if (index.x >= gridCellNumber || index.y >= gridCellNumber)
		return;
	
	for (var i = 0; i < unCountedObjectArray.length; i++){
		var object = unCountedObjectArray[i];
		if (index.x == object.index.x && index.y == object.index.y && index.z == object.index.z)
			return;
	}
	
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

	if ( intersects.length > 0 ) {

		intersector = getRealIntersector( intersects );
		if (intersector == null)
			return;

		if ( isCtrlDown ) {
			//if ( intersector.object != plane ) {
			//scene.remove( intersector.object );
			//}

			// delete cube
			ss.rpc('demo.clientMove', [0, intersector.object], roomNumber);
		} else {
			// create cube
			normalMatrix.getNormalMatrix( intersector.object.matrixWorld );

			tmpVec.copy( intersector.face.normal );
			tmpVec.applyMatrix3( normalMatrix ).normalize();

			// Convert into matrix index and call addVoxel function to add
			/*var index = new Object();
			index.x = Math.floor( voxelPosition.x / gridCellSize ) + gridCellNumber / 2;
			index.y = Math.floor( voxelPosition.z / gridCellSize ) + gridCellNumber / 2;
			index.z = Math.floor( voxelPosition.y / gridCellSize );*/
			if (rollOverMesh.index.x == previousIndex.x && rollOverMesh.index.y == previousIndex.y && rollOverMesh.index.z == previousIndex.z){
				previousIndex = rollOverMesh.index;
				ss.rpc('demo.clientMove', [1, rollOverMesh.index, cubecolor], roomNumber);
			} else{
				previousIndex = rollOverMesh.index;
			}
		}
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
	var currentWaterHeight = (Date.now() - initialTime ) * SPEED;
	waterPosition = Math.floor(currentWaterHeight / gridCellSize);
	waterFlow(waterPosition);
	
	theta = -targetRotation * 10;
	// check if game overs
	if (playerPosition.z + 1 <= waterPosition && playerPosition.z != gameOverPosition){
		gameOverPosition = playerPosition.z;
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
	if (position.x < 0 || position.x >= gridCellNumber)
		return;
	if (position.y < 0 || position.y >= gridCellNumber)
		return;
	if (position.z < 0) 
		return;
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
}

function movePlayer(position) {
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
	player.position.copy( new THREE.Vector3(xCoordinate,yCoordinate,zCoordinate) );
	player.updateMatrix();
	
	//update world map
	setWorldMap(playerPosition, EMPTY_CELL);
	playerPosition.x = position.x;
	playerPosition.y = position.y;
	playerPosition.z = position.z;
	setWorldMap(playerPosition, PLAYER_CELL);
}


function waterFlow(waterPos) {
	//wrap world map
	if ( waterPos - oldWaterPosition >=1 ) {
		if (worldIndex + 1 == gridHeight)
			worldIndex = 0;
		else
			worldIndex = worldIndex + 1;
		oldWaterPosition = waterPos;
	}
}

function setWorldMap(position, type) {
	var newZ = (position.z-waterPosition) % gridHeight + worldIndex;
	worldMap[position.x][position.y][newZ] = type;
}

function checkReward(position) {

	position.z = (position.z-waterPosition) % gridHeight + worldIndex;
	if (getCellType(position) == BONUS_CELL) {
		var i = 0
		for (i = 0; i < rewardHash.length; i++) {
				console.log("sadasdadsadas,");
				if (rewardHash[i] != undefined) {
					if(rewardHash[i].index.x == position.x && rewardHash[i].index.y == position.y && rewardHash[i].index.z == WorldztoAbsoz(position.z)) {
						scene.remove(rewardHash[i]);
						rewardHash[i] = undefined;
						requireReward(1, playerPosition);
					}
				}
		}
	}
}

function WorldztoAbsoz(wz) {
	if (wz >= worldIndex) {
		return (wz - worldIndex + waterPosition);
	} else {
		return (waterPosition + gridHeight - (worldIndex - wz));
	}
}

function getCellType(position) {
	var newZ = (position.z-waterPosition) % gridHeight + worldIndex;
	return worldMap[position.x][position.y][newZ];
}

function addBonus( position ) {
	//if (position.x < 0 || position.x >= gridCellNumber)
		//return;
	//if (position.y < 0 || position.y >= gridCellNumber)
		//return;
	//if (position.z < 0)
		//return;

	setWorldMap(position, BONUS_CELL);
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
	console.log(this, unCountedObjectArray);
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

	console.log(world[cube.x+1][cube.y][nextCube.z]);
	console.log(world[cube.x+1][cube.y][down1Zindex]);
	console.log(world[cube.x+1][cube.y][up1Zindex]);
	console.log(nextCube);
	console.log(WaterOffset);


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
