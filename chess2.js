"use strict";

var vs = `#version 300 es
precision highp float;

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_instanceWorld;

uniform mat4 u_viewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_viewInverse;

out vec4 v_position;
out vec3 v_normal;
out vec2 v_texcoord;
out vec3 v_viewToSurface;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;

void main() {
  v_texcoord = a_texcoord;
  
  vec4 worldPosition = u_instanceWorld * a_position;
  v_position = u_viewProjection * worldPosition;
  v_normal = mat3(u_instanceWorld) * a_normal;
  v_surfaceToLight = u_lightWorldPos - worldPosition.xyz;
  v_surfaceToView = u_viewInverse[3].xyz - worldPosition.xyz;
  gl_Position = v_position;
}
`;

var fs = `#version 300 es
precision highp float;

in vec4 v_position;
in vec3 v_normal;
in vec2 v_texcoord;
in vec3 v_viewToSurface;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform sampler2D u_texture;
uniform samplerCube u_skybox;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

out vec4 outColor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

float DistributionGGX(vec3 N, vec3 H, float a)
{
  float a2     = a*a;
  float NdotH  = max(dot(N, H), 0.0);
  float NdotH2 = NdotH*NdotH;

  float nom    = a2;
  float denom  = (NdotH2 * (a2 - 1.0) + 1.0);
  denom        = 3.141592653589793 * denom * denom;

  return nom / denom;
}

float GeometrySchlickGGX(float NdotV, float k)
{
  float nom   = NdotV;
  float denom = NdotV * (1.0 - k) + k;

  return nom / denom;
}
  
float GeometrySmith(vec3 N, vec3 V, vec3 L, float k)
{
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float ggx1 = GeometrySchlickGGX(NdotV, k);
  float ggx2 = GeometrySchlickGGX(NdotL, k);

  return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

void main() {
  vec4 diffuseColor = texture(u_texture, v_texcoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);

  vec3 halfVector = normalize(surfaceToLight + surfaceToView);

  vec3 reflectDir = reflect(surfaceToView, v_normal);
  vec4 reflectColor = texture(u_skybox, reflectDir);

  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);

  vec4 finalColor = vec4(
      (u_lightColor
        * (diffuseColor * litR.y
          + diffuseColor * u_ambient
          + reflectColor * u_specular * litR.z * u_specularFactor)
      ).rgb,
      diffuseColor.a);

  outColor = finalColor;
  // outColor = vec4(v_texcoord.x * 1.0, v_texcoord.y * 1.0, 1, 1);
  // outColor = texture(u_skybox, normalize(vec3(a_position)));
}
`;

function sleep(ms)	{
return new Promise(resolve => setTimeout(resolve, ms));  
}
async function fetchOBJ(url) {
  say(url + " wird geladen...", null);
  const response = await fetch(url);
  const text = await response.text();

  return parseOBJ(text);
}

function parseOBJ(text) {

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
  for (let lineNr = 0; lineNr < lines.length; ++lineNr) {
    const line = lines[lineNr].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const parts = line.split(/\s+/);
    const m = keywordRE.exec(line);
    if(!m) {
      continue;
    }
    const keyword = parts[0];
    parts.shift();
    switch(keyword) {
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
      if (parts.length == 3) {
      for (let i = 0; i < 3; i++) {
        let arr = f3(parts[i]);
        assign(arr);
      }
      }
      else if (parts.length == 4) {
      for (let i = 0; i < 3; i++) {
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
    arrays: {
      position: webglVertexData[0],
      texcoord: webglVertexData[1],
      normal: webglVertexData[2],
    },
    material: material,
  };

  function assign(arr) {
    webglVertexData[0].push(arr.position[0], arr.position[1], arr.position[2]);
    webglVertexData[1].push(arr.texcoord[0], arr.texcoord[1]);
    webglVertexData[2].push(arr.normal[0], arr.normal[1], arr.normal[2]);
  }
  function o(parts) { return parts[0]; }
  function v(parts) { return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])]; }
  function vt(parts) { return [parseFloat(parts[0]), parseFloat(parts[1])]; }
  function vn(parts) {return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])]; }
  function f3(part) { 
      
    let indices = part.split("/");

    let position = objVertexData[0][indices[0]];
    let texcoord = objVertexData[1][indices[1]];
    let normal = objVertexData[2][indices[2]];
    
    return {position: position, texcoord: texcoord, normal: normal};
  }
  function usemtl(parts) { return parts[0]; }
}

function toWebGL(gl, meshProgramInfo, objData) {
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, objData.arrays);
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);

  return { bufferInfo, vao, material: objData.material };
}

function getCoords(pos) {
  return [a1[0] + pos[0]/7*(h1[0]-a1[0]), a1[1], a1[2] + pos[1]/7*(a8[2]-a1[2])]; 
}

// --------------------------------------
//               Globals
// --------------------------------------

const a1  = [-0.88, -1.1, 0.88];
const h1   = [0.88, -1.1, 0.88];
const a8  = [-0.88, -1.1, -0.88];
const board   = [0.0, -1.2, 0.0];
const pawnScale = 0.24;
const whiteHorseRotation = 0.7854 *2;
const blackHorseRotation = 2.3562 *2;
const initialPointerField = [4, 4];
const figureNames = ["Bauer", "Turm", "Pferd", "Läufer", "König", "Dame"];
var pointer = null;
var objects = [];
var cameraBase = [0, 0.2, 2];
var cameraZ = 0;
var cameraMomentum = 0;
var figures = [];
var activeField = null;
var hoverIntensity = 0;

var camera = {
  position: [0, 0, 5],
  target: board,
  up: [0, 1, 0],
  fov: 60 * Math.PI / 180,
};

function toggleView(color) {
  if (color == "w") {
    cameraZ = 0;
    whiteView = true;
  }
  else if (color == "b") {
    cameraZ = Math.PI;
    whiteView = false;
  }
}

function toggleSceneAngle(num) {
  cameraBase = [0, -1 + 0.8 * num, 2];
}

document.addEventListener("keydown", function(event) {
  console.log(event.keyCode);
  switch(event.keyCode) {
  case 37:
    if (getCookie("session_color") == "white") {assignpos(pointer, pointer.i-1, pointer.j);}
    else {assignpos(pointer, pointer.i+1, pointer.j);} return;
  case 38:
    if (getCookie("session_color") == "white") {assignpos(pointer, pointer.i, pointer.j+1);}
    else {assignpos(pointer, pointer.i, pointer.j-1);}  return;
  case 39:
    if (getCookie("session_color") == "white") {assignpos(pointer, pointer.i+1, pointer.j); }
    else {assignpos(pointer, pointer.i-1, pointer.j);} return;
  case 40:
    if (getCookie("session_color") == "white") {assignpos(pointer, pointer.i, pointer.j-1);}
    else {assignpos(pointer, pointer.i, pointer.j+1);}  return;
  case 32:
    touchFigure(); return;
  case 13:
    if (getCookie("session_turn") == getCookie("session_color")) {submitTurn();} else {alert("Du bist nicht an der Reihe");} console.log(getCookie("session_turn") + getCookie("session_color")); return;
  case 86:
    if (whiteView) {toggleView("b");} else {toggleView("w")}; return;
  case 65:
    cameraMomentum += -0.01; return;
  case 68:
    cameraMomentum += 0.01; return;
  case 87:
    toggleSceneAngle(2); return;
  case 83:
    toggleSceneAngle(1); return;
  case 85:
    getUpdate(); return;
  case 72:
    if (document.getElementById("hints").style.display == "none") {document.getElementById("hints").style.display = "block";} else {document.getElementById("hints").style.display = "none";} return;
  case 27:
    leave(); return;
  default:
    console.log("No matching keyCode event");
  }
});

function getField(i) {  return [i%8, Math.floor(i/8)]; }
function getIndex(arr) { return arr[0] + arr[1]*8; }

function touchFigure() {
  if (activeField !== null) {
    if (activeField[0] == pointer.i && activeField[1] == pointer.j) {
      activeField = null;
    }
    else {
  
      if (field[getIndex([pointer.i, pointer.j])] !== 0) {
        console.log(field[getIndex([pointer.i, pointer.j])]);
        let farbe = "Schwarz";
        if (field[getIndex([pointer.i, pointer.j])] <= 6) {
          farbe = "Weiß";
        }
        if (confirm("Soll die Figur (" + figureNames[(field[getIndex([pointer.i, pointer.j])]-1) % 6] + ") der Farbe " + farbe + " wirklich geschlagen werden?")) {
          field[getIndex([pointer.i, pointer.j])] = field[getIndex(activeField)];
          field[getIndex(activeField)] = 0;
          activeField = null;
          submitTurn();
        }
      }
      else {
        field[getIndex([pointer.i, pointer.j])] = field[getIndex(activeField)];
               field[getIndex(activeField)] = 0;
        activeField = null;
      }
    }
    console.log(field);
    return;
  }
  if (field[getIndex([pointer.i, pointer.j])] !== 0) {
    activeField = [pointer.i, pointer.j];
    hoverIntensity = 0;
  }
  console.log(field);
}

function clamp(x, min, max) { return x < min ? min : x > max ? max : x; }

function assignpos(obj, i, j) {
  obj.i = clamp(i, 0, 7);
  obj.j = clamp(j, 0, 7);
  refreshTranslation(obj);
}

function refreshTranslation(obj) {
  obj.obj.translation = getCoords([obj.i, obj.j]);
}

function update(time, deltaTime) {
  pointer.obj.rotation[1] -= deltaTime * 0.0005;
  cameraZ += cameraMomentum * deltaTime * 0.05;
  cameraMomentum = clamp(cameraMomentum * Math.pow(0.999, deltaTime), -.01, .01);

  camera.position = m4.transformPoint(m4.yRotation(cameraZ), cameraBase);
}

async function main() {
  if (typeof whiteView === 'undefined') {
    alert("Bitte die Lobby verwenden um einem Spiel beizutreten");
    window.location.replace("lobby.php");
  }

  document.getElementById("text").textContent = "Warte auf 2. Spieler...";

  while (true) {
    if (full) {
      break;
    }
    playerJoined();
    await sleep(1000);
  }

  toggleSceneAngle(1);

  if (whiteView) {
    toggleView("w");
  }
  else {
    toggleView("b");
  }

  if (getCookie("session_turn") !== getCookie("session_color")) {
    updateLoop();
  }

	say("Weiß beginnt", "w");
	await sleep(1);

  field = textToArr(getCookie("session_field"));
  console.log(field);

  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  // Tell the twgl to match position with a_position, n
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");

  // setup GLSL program
  var programInfo = twgl.createProgramInfo(gl, [vs, fs]);

  var models = {
    pawn: toWebGL(gl, programInfo, await fetchOBJ('weißerBauer.obj')),
    king: toWebGL(gl, programInfo, await fetchOBJ('weißerKönig.obj')),
    queen: toWebGL(gl, programInfo, await fetchOBJ('weißeDame.obj')),
    tower: toWebGL(gl, programInfo, await fetchOBJ('weißerTurm.obj')),
    horse: toWebGL(gl, programInfo, await fetchOBJ('weißesPferd.obj')),
    bishop: toWebGL(gl, programInfo, await fetchOBJ('weißerLäufer.obj')),
    board: toWebGL(gl, programInfo, await fetchOBJ('cube.obj')),
    pointer: toWebGL(gl, programInfo, await fetchOBJ('pointer.obj')),
  }

  document.getElementById("text").textContent = "Warte auf 2. Spieler...";

  var figuresByNumber = [models.pawn, models.tower, models.bishop, models.horse, models.king, models.queen];

  function makeObject(shape, translation, rotation, scale, material) {
    return {
      programInfo: programInfo,
      isVisible: true,
      bufferInfo: shape.bufferInfo,
      vertexArray: shape.vao,
      uniforms: {
        u_instanceWorld: m4.identity(),
      },
      translation: translation,
      rotation: rotation, // TODO: Use quaternion instead of euler
      scale: scale,
      material: material,
    };
  }

  const textures = twgl.createTextures(gl, {
    white: {src: [255, 255, 255, 255]},
    black: {src: [50, 50, 50, 255]},
    board: {src: "chessBoard.jpg"},
    skybox: {
      target: gl.TEXTURE_CUBE_MAP,
      src: [
        'skybox2.png',
        'skybox4.png',
        'skybox3.png',
        'skybox5.png',
        'skybox1.png',
        'skybox6.png',
      ],
    }
  });

  objects.push(makeObject(models.board, board, [0, 0, 0], [1, 1, 1], "board"));

  const pointerObj = makeObject(models.pointer, getCoords(initialPointerField), [0, 0, 0], [.1, .1, .1], "board");
  objects.push(pointerObj);
  pointer = { obj: pointerObj, i: initialPointerField[0], j: initialPointerField[1] };

	var figures = [];
	for (let i = 0; i < 12; i++)	{
		const isBlack = i >= 6;
		const shape = figuresByNumber[i % 6];
		const rotation = i % 6 != 3 ? 0 : isBlack ? blackHorseRotation : whiteHorseRotation;
		const scale = pawnScale;
		const material = isBlack ? "black" : "white";
		const obj = makeObject(shape, getCoords([-1, -1]), [0, rotation, 0], [scale, scale, scale], material);
		figures.push(obj);
	}
	console.log(figures);
	console.log(field);

  function computeMatrix(translation, rotation, scale) {
    var matrix = m4.translation(translation[0], translation[1], translation[2]);
    // var matrix = m4.translation(translation);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    // return m4.multiply(viewProjectionMatrix, matrix);
    return matrix;
  }

  requestAnimationFrame(drawScene);

  var lastTime = 0;

  // Draw the scene.
  function drawScene(time) {
    update(time, time - lastTime);
    lastTime = time;

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(camera.fov, aspect, 0.1, 2000);

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(camera.position, camera.target, camera.up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    // Compute the matrices for each object.
    objects.forEach(function(object) {
      object.uniforms.u_instanceWorld = computeMatrix(
          object.translation,
          object.rotation,
          object.scale);
      object.uniforms.u_texture = textures[object.material];
    });


    const sharedUniforms = {
      u_viewProjection: m4.multiply(projectionMatrix, viewMatrix),
      u_viewInverse: cameraMatrix,

      u_skybox: textures.skybox,
      u_lightWorldPos: [1, 8, -30],
      u_lightColor: [1, 1, 1, 1],
      u_ambient: [0, 0, 0, 1],
      u_specular: [1, 1, 1, 1],
      u_shininess: 50,
      u_specularFactor: 1,
    };

    // ------ Draw the objects --------

    var lastUsedProgramInfo = null;
    var lastUsedVertexArray = null;

    objects.forEach(function(object) {
      if (!object.isVisible) return;
      var programInfo = object.programInfo;
      var vertexArray = object.vertexArray;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);
        twgl.setUniforms(programInfo, sharedUniforms);
      }

      // Setup all the needed attributes.
      if (lastUsedVertexArray !== vertexArray) {
        lastUsedVertexArray = vertexArray;
        gl.bindVertexArray(vertexArray);
      }

      // Set the uniforms.
      twgl.setUniforms(programInfo, object.uniforms);

      // Draw
      twgl.drawBufferInfo(gl, object.bufferInfo);
    });

	  for(let i = 0; i < field.length; i++)	{
		  if (field[i] == 0)	{
			  continue;
		  }
		  let object = figures[field[i] -1];

		  object.uniforms.u_instanceWorld = computeMatrix(
			  getCoords(getField(i)),
			  object.rotation,
			  object.scale);
		  object.uniforms.u_texture = textures[object.material];

		  var programInfo = object.programInfo;
		  var vertexArray = object.vertexArray;

		   if (programInfo !== lastUsedProgramInfo) {
			   lastUsedProgramInfo = programInfo;
			   gl.useProgram(programInfo.program);
			   twgl.setUniforms(programInfo, sharedUniforms);
		   }

		  if (lastUsedVertexArray !== vertexArray) {
			  lastUsedVertexArray = vertexArray;
			  gl.bindVertexArray(vertexArray);
		  }

		  twgl.setUniforms(programInfo, object.uniforms);
		  twgl.drawBufferInfo(gl, object.bufferInfo);
	  }


    requestAnimationFrame(drawScene);
  }
}

main();
