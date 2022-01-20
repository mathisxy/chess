<!DOCTYPE html>
<style>
body	{
position: absolute;
top: 0;
bottom: 0;
left: 0;
right: 0;
height: 100%;
margin: 0;
background-color: #333;
}

#c	{
width: 1280px;
height: 720px;
display: block;
}
</style>

<body>

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

function initBuffers(gl)	{
	const positionBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const positions = [
		-1.0, -0.2, 1.0,
		1.0, -0.2, 1.0,
		1.0, 0.0, 1.0,
		-1.0, 0.0, 1.0,


		-1.0, -0.2, -1.0,
		-1.0, 0.0, -1.0,
		1.0, 0.0, -1.0,
		1.0, -0.2, -1.0,


		-1.0, 0.0, -1.0,
		-1.0, 0.0, 1.0,
		1.0, 0.0, 1.0,
		1.0, 0.0, -1.0,

		
		-1.0, -0.2, -1.0,
		1.0, -0.2, -1.0,
		1.0, -0.2, 1.0,
		-1.0, -0.2, 1.0,


		1.0, -0.2, -1.0,
		1.0, 0.0, -1.0,
		1.0, 0.0, 1.0, 
		1.0, -0.2, 1.0,

		-1.0, -0.2, -1.0,
		-1.0, -0.2, 1.0,
		-1.0, 0.0, 1.0, 
		-1.0, 0.0, -1.0,
	];

	gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(positions),
		gl.STATIC_DRAW);

	const textureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

	const fillMapping = [

		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
	];

	var textureCoordinates = [];

	for (var i = 0; i < 6; i++)	{

		for(var j = 0; j < fillMapping.length; j++)	{

			textureCoordinates.push(fillMapping[j]);
		}
	}
	console.log(textureCoordinates);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
		gl.STATIC_DRAW);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

	const indices = [
		0, 1, 2,	0, 2, 3,
		4, 5, 6,	4, 6, 7,
		8, 9, 10,	8, 10, 11,
		12, 13, 14,	12, 14, 15,
		16, 17, 18,	16, 18, 19,
		20, 21, 22,	20, 22, 23,
	];

	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(indices), gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		textureCoord: textureCoordBuffer,
		indices: indexBuffer,
	};

}

function drawScene(gl, programInfo, buffers, texture, deltaTime)	{
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

	mat4.perspective(projectionMatrix,
		fieldOfView,
		aspect,
		zNear,
		zFar);

	const modelViewMatrix = mat4.create();

	mat4.translate(modelViewMatrix,
		modelViewMatrix,
		[-0.0, -1.3, -3.0]);

	mat4.rotate(modelViewMatrix,
		modelViewMatrix,
		cubeRotation * 0.0,
		[0, 1, 0]);

	mat4.rotate(projectionMatrix,
		projectionMatrix,
		0.3,
		[1, 0, 0]);
	{
		const numComponents = 3;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
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
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
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

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);


	gl.useProgram(programInfo.program);

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

	{
		const offset = 0;
		const vertexCount = 36;
		const type = gl.UNSIGNED_SHORT;
		gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
	}

	cubeRotation += deltaTime;
}

const vsSource = `
	attribute vec4 aVertexPosition;
	attribute vec2 aTextureCoord;

	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;

	varying highp vec2 vTextureCoord;

	void main()     {
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
	vTextureCoord = aTextureCoord;
        }
`;

const fsSource = `
	varying highp vec2 vTextureCoord;

	uniform sampler2D uSampler;

	void main()     {
		gl_FragColor = texture2D(uSampler, vTextureCoord);
	}
`;
var cubeRotation = 0.0;
function main()	{
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
		textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
},
	uniformLocations:	{
	projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
		modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
		uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
},
};

const buffers = initBuffers(gl);

const texture = loadTexture(gl, 'chessBoard.jpg');

var then = 0;

function render(now)	{
	now *= 0.001;
	const deltaTime = now -then;
	then = now;

	drawScene(gl, programInfo, buffers, texture, deltaTime);

	requestAnimationFrame(render);
}
requestAnimationFrame(render);

}

main();

</script>
</body>
</html>
