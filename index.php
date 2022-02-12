<meta charset="UTF-8">
<script>
var full = false;
var field = "";
function isNL()	{
	return window.location.href.includes("nl");
}
function textToArr(text)        {
	console.log(text);
	let arr = text.split(",").map( Number );
	console.log(arr);
	return arr;
}
function arrToText(arr) {
	let text = arr[0];
	for (let i = 1; i < arr.length; i++)    {
		text = text + "," + arr[i];
	}
	console.log(text);
	return text;
}
function warning()	{
	return "Soll die Sitzung gelöscht werden?"						         
}
function leave()	{
	if(confirm("Die Sitzung wird durch diesen Vorgang gelöscht. Fortfahren?"))	{
		if (confirm("Sitzung löschen?"))	{
			destroySession();
			window.onbeforeunload = null;
			window.location.href = "lobby.php";
		}
	}
}
function destroySession()	{
	let req = new XMLHttpRequest;

	req.open('GET', 'server.php?op=destroySession&id=' + getCookie("session_id"), false);
	
	req.withCredentials = true;

	req.send();
	console.log("UNLOAD-----------------UNLOAD--------------------UNLOAD------EVENT FIRED: SESION DESTROYES");
}
function createSession()        {
	if (isNL())	{
		return;
	}
        let req = new XMLHttpRequest;

        req.open('GET', 'server.php?op=createSession', false);

	        req.onload = function() {
			console.log("CREATE SESSION: " + req.response);
		}
	req.withCredentials = true;
       
	req.send();
}
function joinSession()		{
	if (isNL())	{
		return;
	}
	let req = new XMLHttpRequest;

	req.open('GET', 'server.php?op=joinSession', true);

	req.onload = function() {
		say(req.response, getCookie("session_color"));
		console.log(req.response);
	}
                req.withCredentials = true;
                req.send();
}
function playerJoined()		{
	if (isNL())	{
		return;
	}
	let req = new XMLHttpRequest;

	        req.open('GET', 'server.php?op=playerJoined', false);

        req.onload = function() {
		console.log(req.response);
		if (!req.response.includes("false"))	{
			say(req.response, getCookie("session_color"));
			full = true;		
		}
        } 
                req.withCredentials = true;
                req.send();
}
function submitTurn()	{
	if (isNL())	{
		return;
	}

	document.cookie = "session_field=" + arrToText(field);
	let req = new XMLHttpRequest;

	req.open('GET', 'server.php?op=submitTurn', false);

        req.onload = function() {
                console.log(req.response);
		if (req.response.includes("Error"))    {
			alert(req.response);
		}
		else	{
			updateLoop();
			say(req.response, getCookie("session_color"));
		}
        }
      	req.withCredentials = true;
	req.send();

	getUpdate();
}
async function updateLoop()	{
	do	{
		getUpdate();
		await sleep(2000);
	} while(getCookie("session_color") !== getCookie("session_turn"));
	console.log(getCookie("session_color") + getCookie("session_turn"));
}
function getUpdate()	{
	if (isNL())	{
		return;
	}

	let req = new XMLHttpRequest;

	        req.open('GET', 'server.php?op=getUpdate', false);

        req.onload = function() {
                if (req.response.includes("false"))    {
			console.log(req.response);
			//getUpdate();
                }
                else    {
			say(req.response, getCookie("session_color"));
			field = textToArr(getCookie("session_field"));
                }
        }
        req.withCredentials = true;
        req.send();
}
</script>
<?php
if (isset($_GET['nl']))	{
	echo "<script>";
	echo "var whiteView = true;";
 	 $field = "2,3,4,5,6,4,3,2," .
	       	 "1,1,1,1,1,1,1,1," .
		 "0,0,0,0,0,0,0,0," .
		 "0,0,0,0,0,0,0,0," .
		 "0,0,0,0,0,0,0,0," .
		 "0,0,0,0,0,0,0,0," .
		 "7,7,7,7,7,7,7,7," .
                 "8,9,10,11,12,10,9,8";			 
	setcookie("session_field", $field);
	echo "field = textToArr('$field');";
	echo "full = true;";
	echo "</script>";
}
else	{
include("dbConnect.php");
if (isset($_GET['createSession']))      {


        $id = uniqid(rand());
        $sessionName = $_GET['session_name'];
	$playerColor = $_GET['color'];
	$turn = "white";


	setcookie("session_id", $id, time() + 36000);
	setcookie("session_name", $sessionName, time() + 36000);
	setcookie("session_color", $playerColor, time() + 36000);
	setcookie("session_turn", $turn, time() + 36000);
      
        echo "<script>";
	echo "createSession();\n";
	if ($playerColor == "white")	{
		echo "var whiteView = true;\n";
	}
	else	{
		echo "var whiteView = false;\n";
	}

        echo "</script>";
}
else if (isset($_GET['joinSession']))	{

	$session_id = $_GET['session_id'];

	$query = "SELECT * FROM sessions WHERE id='$session_id'";

	include("dbQuery.php");

	if($results == false)	{
		echo "<script>alert('Die ausgewählte Sitzung ist leider nicht mehr verfügbar');</script>";
		exit;
	}
	
	$results = $results[0];

	setcookie("session_id", $results['id'], time() +36000);
	setcookie("session_name", $results['name'], time() +36000);
	
	if (!isset($results['player1']))	{
		setcookie("session_color", "white");
		setcookie("session_turn", "white");
		echo "<script>var whiteView = true; var color = 'white';</script>";
	}
	else if (!isset($results['player2']))	{
		setcookie("session_color", "black");
		setcookie("session_turn", "white");
		echo "<script>var whiteView = false; var color = 'black';</script>";
	}
	else	{
		echo "<script>alert('Die Sitzung ist leider schon voll');</script>";
		exit;
	}

	echo "<script>joinSession();</script>";

}
}



?>

<!DOCTYPE html>
<style>
body	{
margin: 0;
padding: 0;
background-color: black;
}

#c	{
width: 100%;
height: calc(99vh);
}
#text {
position: fixed;
top: 0;
left: 0;
width: 100%;
font-size: 24px;
background-color: grey;
text-align: center;
}
#hints	{
position: fixed;
bottom: 0;
left: 0;
width: 100%;
font-size: 18px;
background-color: grey;
text-align: center;
}
</style>

<body onbeforeunload="return warning()" onunload="destroySession()">
<div id="loadingInfo">
<div id="text">Willkommen</div>
</div>
<div id="hints"><b>Esc:</b> Spiel beenden, <b>Pfeiltasten:</b> Cursor verschieben, <b>Leertaste:</b> Figure nehmen bzw. setzen, <b>Enter:</b> Zug bestätigen, <b>awsd:</b> Kamera Steuerung, <b>u:</b> Manuelles Update, <b>h:</b> Hilfe öffnen bzw. verstecken</div>
<canvas width="1280" height="720" id="c"></canvas>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js">
</script>
<script>


function resizeCanvasToDisplaySize(canvas)	{
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;

	console.log("width: " + width + ", height: " + height + ", canvas.width: " + canvas.width + ", canvas.height: " + canvas.height + "");

	const needResize = canvas.width !== width || canvas.height !== height;

	if (needResize)	{
		canvas.width = width;
		canvas.height = height;
	}

	return needResize;
}

function initShaderProgram(gl, vsSource, fsSource)	{

	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);


	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);


	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))	{
		alert("Program Link Error: " + gl.getProgramInfoLog(shaderProgram));
		return null;
	}

	return shaderProgram;

}

function loadShader(gl, type, source)	{
	const shader = gl.createShader(type);

	gl.shaderSource(shader, source);

	gl.compileShader(shader);


	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))	{
		alert(type + "-shader compile error: " + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;

}

function loadTexture(gl, url)	{
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);


	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([0, 0, 255, 255]);

	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
		width, height, border, srcFormat, srcType,
		pixel);


	const image = new Image();
	image.onload = function(event)	{
		console.log(event);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			srcFormat, srcType, image);

		if (isPowerOf2(image.width) && isPowerOf2(image.height))	{
			gl.generateMipmap(gl.TEXTURE_2D);
		} else	{

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	};


	image.src = url;

	return texture;
}

function isPowerOf2(value)	{
	return (value & (value -1)) == 0;
}

function initBuffers(gl, obj)	{
	const positionBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(obj.positions),
		gl.STATIC_DRAW);

	const textureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.texcoords),
		gl.STATIC_DRAW);


	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

	const normals = [];

	gl.bufferData(gl.ARRAY_BUFFER, 
		new Float32Array(obj.normals), gl.STATIC_DRAW);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

	const indices = count(0, maxPolyCount);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(indices),
		gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		textureCoord: textureCoordBuffer,
		indices: indexBuffer,
		normals: normalBuffer,
	};

}

function count(begin, end)	{

	let arr = [];
	for (let i = begin; i <= end; i++)	{
		arr.push(i);
	}
	return arr;
}

function drawScene(gl, programInfo, objects, texture, deltaTime, cameraView)	{

	gl.clearColor(0.5, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const fieldOfView = 36 * Math.PI / 180;
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
	const cameraMatrix = mat4.create();

	mat4.perspective(projectionMatrix,
		fieldOfView,
		aspect,
		zNear,
		zFar);

	mat4.rotate(projectionMatrix,
		projectionMatrix,
		cameraView.angle,
		[1, 0, 0]);

	mat4.rotate(projectionMatrix,
			projectionMatrix,
			cameraView.rotation,
			[0, 1, 0]);
	mat4.translate(projectionMatrix,
			projectionMatrix,
			cameraView.translation);

	mat4.rotate(cameraMatrix,
		cameraMatrix,
		sceneRotation,
		[0, 1, 0]);
	

	for (let i = 0; i< field.length + objects.length; i++) {
		
	let currentObject;
	if (i < field.length)	{
		if (field[i] == 0)	{
			continue;
		}
		else	{
			currentObject = figures[field[i]];
			currentObject.field = getField(i);
		}
	}
	else	{
		currentObject = objects[i - field.length];
	}	
	
	if (currentObject.field !== undefined)	{
		currentObject.translation = getChoords(currentObject.field);
	}
	
	const modelViewMatrix = mat4.create();

	if (currentObject.translation !== undefined)	{
	mat4.translate(modelViewMatrix,
		modelViewMatrix,
		currentObject.translation);
	}
	if (activeField !== null)	{
		if (getIndex(activeField) == i)	{
	mat4.translate(modelViewMatrix,
		modelViewMatrix,
		[0, 1*hoverIntensity, 0]);
		}
	}
	if (currentObject.name == "Pointer")	{
	mat4.rotate(modelViewMatrix,
		modelViewMatrix,
		pointerRotation * 0.7,
		[0, 1, 0]);
	}
	if (currentObject.rotation !== undefined)	{
	mat4.rotate(modelViewMatrix,
		modelViewMatrix,
		currentObject.rotation,
		[0, 1, 0]);
	}
	if (currentObject.scale !== undefined)	{
	mat4.scale(modelViewMatrix,
		modelViewMatrix,
		[currentObject.scale, currentObject.scale, currentObject.scale]);
	}
	{
		const numComponents = 3;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, currentObject.buffers.position);
		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexPosition,
			numComponents,
			type,
			normalize,
			stride,
			offset);
		gl.enableVertexAttribArray(
			programInfo.attribLocations.vertexPosition);

	}
	
	{
		const numComponents = 3;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, currentObject.buffers.normals);
		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexNormal,
			numComponents,
			type,
			normalize,
			stride,
			offset);
		gl.enableVertexAttribArray(
			programInfo.attribLocations.vertexNormal);
	}

	{
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, currentObject.buffers.textureCoord);
		gl.vertexAttribPointer(
			programInfo.attribLocations.textureCoord,
			numComponents,
			type,
			normalize,
			stride,
			offset);
		gl.enableVertexAttribArray(
			programInfo.attribLocations.textureCoord);
	}

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, currentObject.buffers.indices);


	gl.useProgram(programInfo.program);

	gl.uniformMatrix4fv(
		programInfo.uniformLocations.cameraMatrix,
		false,
		cameraMatrix);
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.projectionMatrix,
		false,
		projectionMatrix);
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.modelViewMatrix,
		false,
		modelViewMatrix);

	gl.activeTexture(gl.TEXTURE0);
	
	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

	gl.uniform3fv(programInfo.uniformLocations.lightDirection, lightDirection);

	gl.uniform3fv(programInfo.uniformLocations.ambientLight, ambientLight);

	gl.uniform3fv(programInfo.uniformLocations.cameraPosition, cameraView.translation);

	{
		const offset = 0;
		const vertexCount = maxPolyCount;
		const type = gl.UNSIGNED_SHORT;
		gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
	}
	}

	pointerRotation += deltaTime;
	if (hoverDirection)	{
		hoverIntensity += deltaTime * hoverSpeed;
	}
	else			{
		hoverIntensity += -deltaTime * hoverSpeed;
	}
	if (hoverIntensity > 0.1)       {
	       	hoverDirection = false;
		hoverIntensity = 0.1;
	}
	else if (hoverIntensity <= 0)        {
		hoverDirection = true;
		hoverIntensity = 0.0;
	}

}

function parseOBJ(text)	{

	const objPositions = [[0, 0, 0]];
	const objTexcoords = [[0, 0]];
	const objNormals = [[0, 0, 0]];

	const objVertexData = [
		objPositions,
		objTexcoords,
		objNormals,
	];

	let webglVertexData = [
		[],
		[],
		[],
	];

	let material = "none";


	const keywordRE = /(\w*)(?: )/;
	const lines = text.split("\n");
	for (let lineNr = 0; lineNr < lines.length; ++lineNr)	{
		const line = lines[lineNr].trim();
		if (line === '' || line.startsWith('#'))	{
			continue;
		}
		const parts = line.split(/\s+/);
		const m = keywordRE.exec(line);
		if(!m)	{
			continue;
		}
		const keyword = parts[0];
		parts.shift();
		switch(keyword)	{
		case 'o':
			break;
		case 'v':
			objPositions.push(v(parts));
			break;
		case 'vt':
			objTexcoords.push(vt(parts));
			break;
		case 'vn':
			objNormals.push(vn(parts));
			break;
		case 'usemtl':
			material = parts[0];
			break;
		case 'f':
			if (parts.length == 3)	{
			for (let i = 0; i < 3; i++)	{
				let arr = f3(parts[i]);
				assign(arr);
			}
			}
			else if (parts.length == 4)	{
			for (let i = 0; i < 3; i++)	{
				assign(f3(parts[i]));
				
			}
			assign(f3(parts[0]));
			assign(f3(parts[2]));
			assign(f3(parts[3]));
			}
			break;
		default:
			console.log("Unhandled keyword line " + lineNr + ": " + keyword);
		}


	}
	console.log(objVertexData);

	return {
		positions: webglVertexData[0],
		texcoords: webglVertexData[1],
		normals: webglVertexData[2],
		material: material,
	};
	function assign(arr)	{
	webglVertexData[0].push(arr.position[0], arr.position[1], arr.position[2]);
	webglVertexData[1].push(arr.texcoord[0], arr.texcoord[1]);
	webglVertexData[2].push(arr.normal[0], arr.normal[1], arr.normal[2]);
	}
	function o(parts)	{ return parts[0]; }
	function v(parts)	{ return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])]; }
	function vt(parts)	{ return [parseFloat(parts[0]), parseFloat(parts[1])]; }
	function vn(parts)	{return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])]; }
	function f3(part)	{ 
			
		let indices = part.split("/");

		let position = 
			objVertexData[0][indices[0]];
		let texcoord = 
			objVertexData[1][indices[1]];
		let normal =
			objVertexData[2][indices[2]];
		
		return {position: position, texcoord: texcoord, normal: normal};
       	}
	function usemtl(parts)	{ return parts[0]; }
}
function getChoords(pos)	{
	return [a1[0] + pos[0]/7*(h1[0]-a1[0]), a1[1], a1[2] + pos[1]/7*(a8[2]-a1[2])]; 
}

function toggleView(color)	{
	if (color == "w")	{
		sceneRotation = 0.0;
		whiteView = true;
	}
	else if (color == "b")	{
		sceneRotation = 9.424;
		whiteView = false;
	}
	console.log(cameraView);
}
function toggleSceneRotation()	{
	if (sceneRotation)	{
		sceneRotation = false;
	}
	else	{
		deltaTime = 0.0;
		sceneRotation = true;
	}
}
function toggleSceneAngle(nr)	{
	if (nr == 1)	{
		cameraView.angle = cameraView1.angle;
		cameraView.translation = cameraView1.translation;
	}
	else if (nr == 2)	{
		cameraView.angle = cameraView2.angle;
		cameraView.translation = cameraView2.translation;
	}
	console.log(cameraView);
}


const vsSource = `
	attribute vec4 aVertexPosition;
	attribute vec3 aVertexNormal;
	attribute vec2 aTextureCoord;

	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;
	uniform mat4 uCameraMatrix;
	uniform vec3 uCameraPosition;

	varying mediump vec3 vViewToSurface;
	varying highp vec2 vTextureCoord;
	varying mediump vec3 vVertexNormal;

	void main()     {
	gl_Position = uProjectionMatrix * uCameraMatrix * uModelViewMatrix * aVertexPosition;
	vViewToSurface = (uCameraMatrix * uModelViewMatrix * aVertexPosition).xyz - (uCameraPosition *-1.0);
	vTextureCoord = aTextureCoord;
	vVertexNormal = mat3(uModelViewMatrix) * aVertexNormal;
        }
`;

const fsSource = `
	varying mediump vec3 vViewToSurface;
	varying highp vec2 vTextureCoord;
	varying mediump vec3 vVertexNormal;

	uniform mediump vec3 uLightDirection;
	uniform sampler2D uSampler;
	uniform lowp vec3 uAmbientLight;

	void main()     {
		mediump vec3 normal = normalize(vVertexNormal);
		mediump vec3 direction = normalize(uLightDirection);
		mediump vec3 viewToSurface = normalize(vViewToSurface);
		mediump vec3 halfVector = normalize(direction + viewToSurface);

		mediump float light = dot(normal, direction);

		mediump vec3 texture = texture2D(uSampler, vTextureCoord).rgb;
		mediump vec3 clamped = texture.rgb + uAmbientLight - texture.rgb * uAmbientLight;
		mediump vec3 direct = (texture + uAmbientLight + texture *uAmbientLight) * uAmbientLight + max(clamped * light * (1.0 - uAmbientLight), 0.0);
		mediump float specular = dot(normal, halfVector);
		gl_FragColor.rgb = (vec3(1.0, 1.0, 1.0) * specular);
	}
`;
var pointerRotation = 0.0;
var hoverIntensity = 0.0;
var hoverDirection = true;
var hoverSpeed = 0.1;
var lightDirection = [1.3, 0.7, -1.0];
var ambientLight = [0.3, 0.2, 0.2];
var cameraView = {
	angle: 0.45,
	rotation: 0,
	translation: [0, 0, -2.5],
}
var objects = [];
var activeField = null;
var sceneRotation = false;
var sceneRotationIntensity = 0.0;
var sceneRotationDirection = 1;
const cameraView1 = {
	angle: 0.45,
	rotation: 0,
	translation: [0, 0, -2.5],
}
const cameraView2 = {
	angle: 0.77,
	rotation: 0,
	translation: [0, -1.5, -2.7],
}

const a1	= [-0.88, -1.1, 0.88];
const h1 	= [0.88, -1.1, 0.88];
const a8	= [-0.88, -1.1, -0.88];
const board 	= [0.0, -1.2, 0.0];
const pawnScale = 0.24;
const whiteHorseRotation = 0.7854 *2;
const blackHorseRotation = 2.3562 *2;
const maxPolyCount = 13000;
	
async function main()	{

	if (typeof whiteView === 'undefined')	{
		alert("Bitte die Lobby verwenden um einem Spiel beizutreten");
		window.location.replace("lobby.php");
	}
const canvas = document.querySelector("#c");

const gl = canvas.getContext("webgl2");

if (!gl)	{
	alert("WebGL 2.0 wird nicht unterstützt");
}

const shaderProgram = initShaderProgram(gl, vsSource, fsSource);


const programInfo =	{
	program: shaderProgram,
	attribLocations:	{
		vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
		vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
		textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
},
	uniformLocations:	{
		projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
		cameraMatrix: gl.getUniformLocation(shaderProgram, 'uCameraMatrix'),
		modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
		lightDirection: gl.getUniformLocation(shaderProgram, 'uLightDirection'),
		ambientLight: gl.getUniformLocation(shaderProgram, 'uAmbientLight'),
		uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
		cameraPosition: gl.getUniformLocation(shaderProgram, 'uCameraPosition'),
},
};

const texture = loadTexture(gl, 'chessBoard.jpg');

objects = [
{name: 'Schachfeld', url: 'cube.obj', translation: board, color: "none"},
{name: 'Pointer', url: 'pointer.obj', field: [4, 4], scale: 0.1, color: "none"},
];
figures = [
{},
{name: 'Bauer1', id: 1, url: 'weißerBauer.obj', field: [0, 1], scale: pawnScale, color: "w"},
{name: 'Turm1', id: 2, url: 'weißerTurm.obj', field: [0, 0],scale: pawnScale, color: "w"},
{name: 'Pferd1', id: 3, url: 'weißesPferd.obj', field: [1, 0], scale: pawnScale, rotation: whiteHorseRotation, color: "w"},
{name: 'Läufer1', id: 4, url: 'weißerLäufer.obj', field: [2, 0], scale: pawnScale, color: "w"},
{name: 'Dame', id: 5, url: 'weißeDame.obj', field: [3, 0], scale: pawnScale, color: "w"},
{name: 'König', id: 6, url: 'weißerKönig.obj', field: [4, 0], scale: pawnScale, color: "w"},

{name: 'Bauer1', id: 7, url: 'schwarzerBauer.obj', field: [0, 6], scale: pawnScale, color: "b"},
{name: 'Turm1', id: 8, url: 'schwarzerTurm.obj', field: [0, 7], scale: pawnScale, color: "b"},
{name: 'Pferd1', id: 9, url: 'schwarzesPferd.obj', field: [6, 7], scale: pawnScale, rotation: blackHorseRotation, color: "b"},
{name: 'Läufer1', id: 10, url: 'schwarzerLäufer.obj', field: [2, 7], scale: pawnScale, color: "b"},
{name: 'Dame', id: 11, url: 'schwarzeDame.obj', field: [3, 7], scale: pawnScale, color: "b"},
{name: 'König', id: 12, url: 'schwarzerKönig.obj', field: [4, 7], scale: pawnScale, color: "b"},
];

for (let i = 1; i < objects.length + figures.length; i++)	{
	let curr;
	if (i < figures.length)	{
		curr = figures[i];
	}
	else	{
		curr = objects[i - figures.length];
	}	
	say(curr.name + " wird geladen...", curr.color);
	let skip = false;

let file = null;
let response = await fetch(curr.url);
if (response.ok)	{
	file = await response.text();
	document.getElementById("text").textContent = curr.name + " wird verarbeitet...";
} else	{ alert("Ein Object konnte nicht geladen werden"); }	

await say( curr.name + " wird verarbeitet...", curr.color);
await sleep(1);

const obj = parseOBJ(file);

curr.buffers = initBuffers(gl, obj);
console.log("Verarbeitung Ende");
}

document.getElementById("text").textContent = "Warte auf 2. Spieler...";

while (true)	{
	if (full)	{
		break;
	}
	playerJoined();
	await sleep(1000);
}

if (whiteView)	{
	toggleView("w");
}
else	{
	toggleView("b");
}

if (getCookie("session_turn") !== getCookie("session_color"))	{
	updateLoop();
}


var then = 0;

field = textToArr(getCookie("session_field"));
console.log(field);

function render(now)	{
	
	now *= 0.001;
	const deltaTime = now -then;
	then = now;

	drawScene(gl, programInfo, objects, texture, deltaTime, cameraView);

	requestAnimationFrame(render);
}
requestAnimationFrame(render);

}
document.addEventListener("keydown", function(event) 	{
	console.log(event.keyCode);
	let pointer = objects[1];
	switch(event.keyCode)	{
	case 37:
		if (getCookie("session_color") == "white")	{assignpos(pointer, [pointer.field[0] -1, pointer.field[1]]);}
		else	{assignpos(pointer, [pointer.field[0] +1, pointer.field[1]]);} return;
	case 38:
		if (getCookie("session_color") == "white")	{assignpos(pointer, [pointer.field[0], pointer.field[1] +1]);}
		else	{assignpos(pointer, [pointer.field[0], pointer.field[1] -1])}	return;
	case 39:
		if (getCookie("session_color") == "white")	{assignpos(pointer, [pointer.field[0] +1, pointer.field[1]]); }
		else	{assignpos(pointer, [pointer.field[0] -1, pointer.field[1]]);} return;
	case 40:
		if (getCookie("session_color") == "white")	{assignpos(pointer, [pointer.field[0], pointer.field[1] -1]);}
		else	{assignpos(pointer, [pointer.field[0], pointer.field[1] +1])}	return;
	case 32:
		touchFigure(); return;
	case 13:
		if (getCookie("session_turn") == getCookie("session_color")) {submitTurn();} else {alert("Du bist nicht an der Reihe");} console.log(getCookie("session_turn") + getCookie("session_color")); return;
	case 86:
		if (whiteView)	{toggleView("b");} else {toggleView("w")}; return;
	case 65:
		sceneRotation += 0.01; return;
	case 68:
		sceneRotation += -0.01; return;
	case 87:
		toggleSceneAngle(2); return;
	case 83:
		toggleSceneAngle(1); return;
	case 85:
		getUpdate(); return;
	case 72:
		if (document.getElementById("hints").style.display == "none")	{document.getElementById("hints").style.display = "block";} else {document.getElementById("hints").style.display = "none";} return;
	case 27:
		leave(); return;
	default:
		console.log("No matching keyCode event");
	}
});

function touchFigure()	{
	if (activeField !== null)	{
		if (activeField[0] == objects[1].field[0] && activeField[1] == objects[1].field[1])	{
			activeField = null;
		}
		else	{
	
			if (field[getIndex(objects[1].field)] !== 0)	{
				console.log(field[getIndex(objects[1].field)]);
				let farbe = "Schwarz";
				if (figures[field[getIndex(objects[1].field)]].color == "w")	{
					farbe = "Weiß";
				}
				if (confirm("Soll die Figur (" + figures[field[getIndex(objects[1].field)]].name + ") der Farbe " + farbe + " wirklich geschlagen werden?"))	{
					field[getIndex(objects[1].field)] = field[getIndex(activeField)];
					field[getIndex(activeField)] = 0;
					activeField = null;
					submitTurn();
				}
			}
			else	{
				field[getIndex(objects[1].field)] = field[getIndex(activeField)];
			       	field[getIndex(activeField)] = 0;
				activeField = null;
			}
		}
		console.log(field);
		return;
	}
	if (field[getIndex(objects[1].field)] !== 0)	{
		activeField = objects[1].field;
		hoverIntensity = 0;
	}
	console.log(field);
}

function say(text, color)	{
	console.log(text);

	let t = document.getElementById("text");
	if (color == "w")	{	t.style.color = "WHITE";} 
	else if(color == "b")		{t.style.color = "BLACK";}
	else if(color !== undefined)	{t.style.color = color;}
	else				{t.style.color = "BLACK";}
	t.textContent = text;
}
function assignpos(obj, pos)	{
	if (pos[0] < 0)	{pos[0] = 0;}
	if (pos[0] > 7) {pos[0] = 7;}
	if (pos[1] < 0)	{pos[1] = 0;}
	if (pos[1] > 7)	{pos[1] = 7;}
	obj.field = pos;
}
function sleep(ms) {
	  return new Promise(resolve => setTimeout(resolve, ms));
}
function getCookie(cName) {
	const name = cName + "=";
	const cDecoded = decodeURIComponent(document.cookie); //to be careful
	const cArr = cDecoded .split('; ');
	let res;
	cArr.forEach(val => {
	if (val.indexOf(name) === 0) res = val.substring(name.length);
	})
		return res;
}

function getField(i)    {
	        return [i%8, Math.floor(i/8)];
}
function getIndex(arr)  {
	        return arr[0] + arr[1]*8;
}


main();

</script>


</body>
</html>
