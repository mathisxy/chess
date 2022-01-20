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
width: 100%;
height: 100%;
display: block;
}
</style>

<body>

<canvas id="c"></canvas>

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

function createProgram(gl, vertexShader, fragmentShader)        {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success)    {
		console.log("successfully linked program");
		return program;
	}
	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

function createShader(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success)    {
		return shader;
	}
	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

function setRectangle(gl, x1, y1, z1, x2, y2, z2, width)	{
	var x3 = x1 + width;
	var y3 = y1;
	var z3 = z1;
	var x4 = x2 + width;
	var y4 = y2;
	var z4 = z2;

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		x1, y1,
		x2, y2,
		x3, y3,
		x2, y2, 
		x4, y4,
		x3, y3]), gl.STATIC_DRAW);
}

function drawScene(gl, count)	{
	var primitiveType = gl.TRIANGLES;
	var offset = 0;
	gl.drawArrays(primitiveType, offset, count);
}

var vertexShaderSource = `#version 300 es

	layout (location = 0) in vec3 aPos;

	out vec4 vertexColor;

	void main()     {
	gl_Position = vec4(aPos, 1.0);
	vertexColor = vec4(0.5, 0.0, 0.0, 1.0);
        }
`;

var fragmentShaderSource = `#version 300 es

  	out lowp vec4 FragColor;

        in lowp vec4 vertexColor;

	void main()     {
		FragColor = vertexColor;
	}
`;

function main()	{
var canvas = document.querySelector("#c");

var gl = canvas.getContext("webgl2");

if (!gl)	{
	alert("WebGL 2.0 wird nicht unterstützt");
}

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

var program = createProgram(gl, vertexShader, fragmentShader);

var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

var positionBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

var vao = gl.createVertexArray();

gl.bindVertexArray(vao);

gl.enableVertexAttribArray(positionAttributeLocation);

var size = 2;
var type = gl.FLOAT;
var normalize = false;
var stride = 0;
var offset = 0;

gl.vertexAttribPointer(
	positionAttributeLocation, size, type, normalize, stride, offset);

resizeCanvasToDisplaySize(gl.canvas);

console.log("width: " + gl.canvas.width + ", height: " + gl.canvas.height);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);
gl.bindVertexArray(vao);

setRectangle(gl, -1, -1, 0, 0, 1, 0, 1);

drawScene(gl, 6);

}

main();

</script>
</body>
</html>
