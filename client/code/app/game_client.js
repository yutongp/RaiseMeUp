if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, scene, renderer;
var projector, plane, cube;
var mouse2D, mouse3D, raycaster,
	rollOveredFace, isShiftDown = false,
	theta = 45 * 0.5, isCtrlDown = false;

var rollOverMesh, rollOverMaterial;
var voxelPosition = new THREE.Vector3(), tmpVec = new THREE.Vector3(), normalMatrix = new THREE.Matrix3();
var cubeGeo, cubeMaterial;
var i, intersector;
var playerName, roomNumber;
var cubecolor

var gridCellSize = 100;
var gridCellNumber = 10;

$(document).ready(function() {
	signIn();
	setSocket();
	

});

function setSocket() {
	ss.rpc('demo.connectGame', playerName, roomNumber, function(err) {
		if(err) {
			console.log("connect FAILED");
		} else {
		}
	});
}


function init() {

	container = document.createElement( 'div' );
	container.setAttribute('id', 'game_board');
	document.body.appendChild( container );

	//var info = document.createElement( 'div' );
	//info.style.position = 'absolute';
	//info.style.top = '10px';
	//info.style.width = '100%';
	//info.style.textAlign = 'center';
	//info.innerHTML = '<a href="http://threejs.org" target="_blank">three.js</a> - voxel painter - webgl<br><strong>click</strong>: add voxel, <strong>control + click</strong>: remove voxel, <strong>shift + click</strong>: rotate';
	//container.appendChild( info );

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.y = 800;

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

	//console.log(parseFloat(cubecolorfeed));
	cubecolor = '0x' + (function co(lor){   return (lor +=[0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)]) && (lor.length == 6) ?  lor : co(lor); })('');

	cubeMaterial = new THREE.MeshLambertMaterial( { color: parseInt(cubecolor), ambient: 0x00ff80, shading: THREE.FlatShading } );
	//cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xfeb74c, ambient: 0x00ff80, shading: THREE.FlatShading, map: THREE.ImageUtils.loadTexture( "http://threejs.org/examples/textures/square-outline-textured.png" ) } );
	cubeMaterial.ambient = cubeMaterial.color;

	// picking

	projector = new THREE.Projector();

	// grid

	var gridSize = gridCellSize * gridCellNumber;
	
	plane = new THREE.Mesh( new THREE.PlaneGeometry( gridSize, gridSize, gridCellNumber, gridCellNumber ), new THREE.MeshBasicMaterial( { color: 0x555555, wireframe: true } ) );
	plane.rotation.x = - Math.PI / 2;
	scene.add( plane );

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

	window.addEventListener( 'resize', onWindowResize, false );
}

function signIn() {
	$('#sign_up').lightbox_me({
        	centered: true, 
        	onLoad: function() { 
			$('#sign_up').find('input:first').focus()},
		onClose: function() {
			playerName = $('input[name="player_name"]').val();
			roomNumber = $('input[name="room_number"]').val();
			setSocket();
			init();
			animate();
			ss.event.on('addBox', function(data, channelNumber) {
				if (data[0] == 0) {
					//from function onDocumentMouseDown
					if ( data[1] != plane ) {

						scene.remove( data[1] );

					}
				}

				if (data[0] == 1) {
					//from function setVoxelPosition
					normalMatrix.getNormalMatrix( data[1] );

					tmpVec.copy( data[2] );
					tmpVec.applyMatrix3( normalMatrix ).normalize();

					voxelPosition.addVectors( data[3], tmpVec );

					voxelPosition.x = Math.floor( voxelPosition.x / gridCellSize ) * gridCellSize + gridCellSize/2;
					voxelPosition.y = Math.floor( voxelPosition.y / gridCellSize ) * gridCellSize + gridCellSize/2;
					voxelPosition.z = Math.floor( voxelPosition.z / gridCellSize ) * gridCellSize + gridCellSize/2;

					//from function onDocumentMouseDown
					var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
					voxel.position.copy( voxelPosition );
					voxel.matrixAutoUpdate = false;
					voxel.updateMatrix();
					scene.add( voxel );
				}
			});
		},
		closeSelector: ".confirm"
        });
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}


function getRealIntersector( intersects ) {

	for( i = 0; i < intersects.length; i++ ) {

		intersector = intersects[ i ];

		if ( intersector.object != rollOverMesh ) {

			return intersector;

		}

	}

	return null;

}

function setVoxelPosition( intersector ) {

	normalMatrix.getNormalMatrix( intersector.object.matrixWorld );

	tmpVec.copy( intersector.face.normal );
	tmpVec.applyMatrix3( normalMatrix ).normalize();

	voxelPosition.addVectors( intersector.point, tmpVec );

	voxelPosition.x = Math.floor( voxelPosition.x / gridCellSize ) * gridCellSize + gridCellSize/2;
	voxelPosition.y = Math.floor( voxelPosition.y / gridCellSize ) * gridCellSize + gridCellSize/2;
	voxelPosition.z = Math.floor( voxelPosition.z / gridCellSize ) * gridCellSize + gridCellSize/2;

}

function onDocumentMouseMove( event ) {

	event.preventDefault();

	mouse2D.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse2D.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}

function onDocumentMouseDown( event ) {

	event.preventDefault();

	var intersects = raycaster.intersectObjects( scene.children );
	intersector = getRealIntersector( intersects );

	if ( intersects.length > 0 ) {

		intersector = getRealIntersector( intersects );

		if ( isCtrlDown ) {
			//if ( intersector.object != plane ) {
				//scene.remove( intersector.object );
			//}

			// delete cube
			ss.rpc('demo.clientMove', [0, intersector.object], roomNumber);
		} else {
			//intersector = getRealIntersector( intersects );
			//setVoxelPosition( intersector );
			//var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
			//voxel.position.copy( voxelPosition );
			//voxel.matrixAutoUpdate = false;
			//voxel.updateMatrix();
			//scene.add( voxel );

			// create cube
			ss.rpc('demo.clientMove', [1, intersector.object.matrixWorld
					, intersector.face.normal, intersector.point], roomNumber);
		}
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

//

function animate() {

	requestAnimationFrame( animate );

	render();
	stats.update();

}

function render() {

	if ( isShiftDown ) {

		theta += mouse2D.x * 1.5;

	}

	raycaster = projector.pickingRay( mouse2D.clone(), camera );

	var intersects = raycaster.intersectObjects( scene.children );

	if ( intersects.length > 0 ) {

		intersector = getRealIntersector( intersects );
		if ( intersector ) {

			setVoxelPosition( intersector );
			rollOverMesh.position = voxelPosition;

		}

	}

	camera.position.x = 1400 * Math.sin( THREE.Math.degToRad( theta ) );
	camera.position.z = 1400 * Math.cos( THREE.Math.degToRad( theta ) );

	camera.lookAt( scene.position );

	renderer.render( scene, camera );

}
