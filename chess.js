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

function loadTexture(gl, url) {
	_loadTexture(gl, url, null, gl.TEXTURE_2D, gl.TEXTURE_2D.texture)
}
function _loadTexture(gl, url, texture, target, type)	{
	if (texture == null) {
		texture = gl.createTexture();
		gl.bindTexture(type, texture);
	}

	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([0, 0, 255, 255]);

	gl.texImage2D(target, level, internalFormat,
		width, height, border, srcFormat, srcType,
		pixel);


	const image = new Image();
	image.onload = function(event)	{
		console.log(event);
		gl.bindTexture(type, texture);
		gl.texImage2D(target, level, internalFormat,
			srcFormat, srcType, image);

		if (isPowerOf2(image.width) && isPowerOf2(image.height))	{
			gl.generateMipmap(type);
		} else	{

			gl.texParameteri(type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	};


	image.src = url;

	return { texture: texture, target: target };
}

function isPowerOf2(value) {
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

	const indices = range(0, maxPolyCount);
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

function range(begin, end) {
	let arr = [];
	for (let i = begin; i <= end; i++)	{
		arr.push(i);
	}
	return arr;
}

function drawScene(gl, programInfo, objects, texture, envTexture, deltaTime, cameraView)	{

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
		if (i < field.length) {
			if (field[i] == 0)	{
				continue;
			}
			else {
				currentObject = figures[field[i]];
				currentObject.field = getField(i);
			}
		}
		else {
			currentObject = objects[i - field.length];
		}	
		
		if (currentObject.field !== undefined) {
			currentObject.translation = getCoords(currentObject.field);
		}
		
		const modelViewMatrix = mat4.create();

		if (currentObject.translation !== undefined) {
			mat4.translate(modelViewMatrix,
				modelViewMatrix,
				currentObject.translation);
		}
		if (activeField !== null) {
			if (getIndex(activeField) == i)	{
				mat4.translate(modelViewMatrix,
					modelViewMatrix,
					[0, 1*hoverIntensity, 0]);
			}
		}
		if (currentObject.name == "Pointer") {
			mat4.rotate(modelViewMatrix,
				modelViewMatrix,
				pointerRotation * 0.7,
				[0, 1, 0]);
		}
		if (currentObject.rotation !== undefined) {
			mat4.rotate(modelViewMatrix,
				modelViewMatrix,
				currentObject.rotation,
				[0, 1, 0]);
		}
		if (currentObject.scale !== undefined) {
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

		gl.activeTexture(gl.TEXTURE0 + 0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

		gl.activeTexture(gl.TEXTURE0 + 1);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
		gl.uniform1i(programInfo.uniformLocations.uEnvironmentSampler, 0);

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

function getCoords(pos)	{
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

// TODO?: #version 300 es
const vsSource = `#version 300 es
	precision highp float;

	uniform mat4 u_worldViewProjection;
	uniform vec3 u_lightWorldPos;
	uniform mat4 u_world;
	uniform mat4 u_viewInverse;
	uniform mat4 u_worldInverseTranspose;

	in vec4 a_position;
	in vec3 a_normal;
	in vec2 a_texcoord;

	out vec4 v_position;
	out vec2 v_texCoord;
	out vec3 v_normal;
	out vec3 v_surfaceToLight;
	out vec3 v_surfaceToView;

	void main() {
		v_texCoord = a_texcoord;
		v_position = (u_worldViewProjection * a_position);
		v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
		v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
		v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
		gl_Position = v_position;
	}
`;

const fsSource = `#version 300 es
	precision highp float;

	in vec4 v_position;
	in vec2 v_texCoord;
	in vec3 v_normal;
	in vec3 v_surfaceToLight;
	in vec3 v_surfaceToView;

	uniform vec4 u_lightColor;
	uniform vec4 u_colorMult;
	uniform sampler2D u_diffuse;
	uniform vec4 u_specular;
	uniform float u_shininess;
	uniform float u_specularFactor;

	out vec4 outColor;

	vec4 lit(float l ,float h, float m) {
		return vec4(1.0,
					abs(l),
					(l > 0.0) ? pow(max(0.0, h), m) : 0.0,
					1.0);
	}

	void main() {
		vec4 diffuseColor = texture(u_diffuse, v_texCoord);
		vec3 a_normal = normalize(v_normal);
		vec3 surfaceToLight = normalize(v_surfaceToLight);
		vec3 surfaceToView = normalize(v_surfaceToView);
		vec3 halfVector = normalize(surfaceToLight + surfaceToView);
		vec4 litR = lit(dot(a_normal, surfaceToLight),
						dot(a_normal, halfVector), u_shininess);
		outColor = vec4((
		u_lightColor * (diffuseColor * litR.y * u_colorMult +
					u_specular * litR.z * u_specularFactor)).rgb,
			diffuseColor.a);
	}
	// void main() {
	// 	vec3 normal = normalize(vVertexNormal);
	// 	vec3 direction = normalize(uLightDirection);
	// 	vec3 viewToSurface = normalize(vViewToSurface);
	// 	vec3 reflectDirection = reflect(viewToSurface, normal);

	// 	// vec3 viewToSurface = normalize(vViewToSurface);

	// 	vec3 halfVector = normalize(direction + viewToSurface);

	// 	float light = dot(normal, direction);

	// 	vec3 color = texture(uSampler, vTextureCoord).rgb;
	// 	vec3 clamped = color.rgb + uAmbientLight - color.rgb * uAmbientLight;
	// 	vec3 direct = (color + uAmbientLight + color *uAmbientLight) * uAmbientLight + max(clamped * light * (1.0 - uAmbientLight), 0.0);
	// 	float specular = dot(normal, halfVector);
		
	// 	// outColor = vec4(specular, specular, specular, 1);
	// 	// outColor = texture(uEnvironmentSampler, vec3(1, 1, 1));
	// 	// outColor = vec4(normalize(vVertexPosition), 1);
	// }
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
	
async function main() {

	if (typeof whiteView === 'undefined')	{
		alert("Bitte die Lobby verwenden um einem Spiel beizutreten");
		window.location.replace("lobby.php");
	}

	const canvas = document.querySelector("#c");

	const gl = canvas.getContext("webgl2");

	if (!gl)	{
		alert("WebGL 2.0 wird nicht unterstützt");
		return;
	}

	twgl.setAttributePrefix("a_");
	
	var programInfo = twgl.createProgramInfo(gl, [vsShader, fsShader]);
	var vao = twgl.createVAOFromBufferInfo(
		gl, programInfo, bufferInfo);

	var uniformSetters = twgl.createUniformSetters(gl, program);
	var attribSetters  = twgl.createAttributeSetters(gl, program);

	var attribs = {
		a_position: { buffer: positionBuffer, numComponents: 3, },
		a_normal:   { buffer: normalBuffer,   numComponents: 3, },
		a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
	};
	var vao = twgl.createVAOAndSetAttributes(gl, attribSetters, attribs);

	var uniformsThatAreTheSameForAllObjects = {
		u_lightWorldPos:         [100, 200, 300],
		u_viewInverse:           computeInverseViewMatrix(),
		u_lightColor:            [1, 1, 1, 1],
	};
	
	var uniformsThatAreComputedForEachObject = {
		u_worldViewProjection:   perspective(...),
		u_world:                 computeWorldMatrix(),
		u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
	};
	
	var objects = [
		{
			translation: [10, 50, 100],
			materialUniforms: {
				u_ambient:               [0.1, 0.1, 0.1, 1],
				u_diffuse:               diffuseTexture,
				u_specular:              [1, 1, 1, 1],
				u_shininess:             60,
				u_specularFactor:        1,
			},
		},
		{
			translation: [-120, 20, 44],
			materialUniforms: {
				u_ambient:               [0.1, 0.2, 0.1, 1],
				u_diffuse:               someOtherDiffuseTexture,
				u_specular:              [1, 1, 0, 1],
				u_shininess:             30,
				u_specularFactor:        0.5,
			},
		},
	];
	
	gl.useProgram(program);
	gl.bindAttribArray(vao);
	twgl.setUniforms(uniformSetters, uniformThatAreTheSameForAllObjects);
	
	requestAnimationFrame(drawScene);

	function drawScene(time) {
		time = 5 + time * 0.0001;

		twgl.resizeCanvasToDisplaySize(gl.canvas);

		// Tell WebGL how to convert from clip space to pixels
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);

		// Compute the projection matrix
		var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		var projectionMatrix =
			m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

		// Compute the camera's matrix using look at.
		var cameraPosition = [0, 0, 100];
		var target = [0, 0, 0];
		var up = [0, 1, 0];
		gl.bindVertexArray(vao);

		// Set the uniforms that are the same for all objects.
		twgl.setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects);

		// Draw objects
		objects.forEach(function(object) {

			// Compute a position for this object based on the time.
			var worldMatrix = m4.identity();
			twgl.setUniforms(uniformSetters, uniformsThatAreComputedForEachObject);

			// Set the uniforms that are specific to the this object.
			twgl.setUniforms(uniformSetters, object.materialUniforms);

			// Draw the geometry.
			gl.drawElements(gl.TRIANGLES, buffers.numElements, gl.UNSIGNED_SHORT, 0);
		});

		requestAnimationFrame(drawScene);
	}

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
			uEnvironmentSampler: gl.getUniformLocation(shaderProgram, 'uEnvironmentSampler'),
			cameraPosition: gl.getUniformLocation(shaderProgram, 'uCameraPosition'),
		},
	};

	cubeMapTexture = null;
	_loadTexture(gl, 'stolenCubemap/pos-x.jpg', cubeMapTexture, gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP);
	_loadTexture(gl, 'stolenCubemap/pos-y.jpg', cubeMapTexture, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP);
	_loadTexture(gl, 'stolenCubemap/pos-z.jpg', cubeMapTexture, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP);

	_loadTexture(gl, 'stolenCubemap/neg-x.jpg', cubeMapTexture, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP);
	_loadTexture(gl, 'stolenCubemap/neg-y.jpg', cubeMapTexture, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP);
	_loadTexture(gl, 'stolenCubemap/neg-z.jpg', cubeMapTexture, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, gl.TEXTURE_CUBE_MAP);

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
		else {
			curr = objects[i - figures.length];
		}
		say(curr.name + " wird geladen...", curr.color);
		let skip = false;

		let file = null;
		let response = await fetch(curr.url);
		if (response.ok)	{
			file = await response.text();
			document.getElementById("text").textContent = curr.name + " wird verarbeitet...";
		} else {
			alert("Ein Object konnte nicht geladen werden");
		}	

		await say(curr.name + " wird verarbeitet...", curr.color);
		//await sleep(1);

		const obj = parseOBJ(file);

		curr.buffers = initBuffers(gl, obj);
		console.log("Verarbeitung Ende");
	}

	document.getElementById("text").textContent = "Warte auf 2. Spieler...";

	while (true) {
		if (full) {
			break;
		}
		playerJoined();
		await sleep(1000);
	}

	if (whiteView) {
		toggleView("w");
	}
	else {
		toggleView("b");
	}

	if (getCookie("session_turn") !== getCookie("session_color")) {
		updateLoop();
	}


	var then = 0;

	field = textToArr(getCookie("session_field"));
	console.log(field);

	function render(now)	{
		
		now *= 0.001;
		const deltaTime = now -then;
		then = now;

		drawScene(gl, programInfo, objects, texture, cubeMapTexture, deltaTime, cameraView);

		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);

}

document.addEventListener("keydown", function(event) {
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
		else {
	
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
	if (color == "w") { t.style.color = "WHITE";} 
	else if(color == "b") {t.style.color = "BLACK";}
	else if(color !== undefined) {t.style.color = color;}
	else {t.style.color = "BLACK";}
	t.textContent = text;
}
function assignpos(obj, pos) {
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