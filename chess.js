"use strict";

var vsPrelude = `#version 300 es
precision highp float;
`;

var fsPrelude = `#version 300 es
precision highp float;

uniform float u_gamma;

vec4 decodeColor(vec4 color) {
  return vec4(pow(color.rgb, vec3(u_gamma)), color.a);
}

vec4 encodeColor(vec4 color) {
  color = color / (color + vec4(1.0));
  return vec4(pow(color.rgb, vec3(1.0/u_gamma)), color.a);
}

vec3 encodeColor(vec3 color) {
  color = color / (color + vec3(1.0));
  return pow(color.rgb, vec3(1.0/u_gamma));
}
`;

var vs = vsPrelude + `
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
out vec3 v_worldPosition;
out vec3 v_surfaceToView;

void main() {
  v_texcoord = a_texcoord;
  
  vec4 worldPosition = u_instanceWorld * a_position;
  v_position = u_viewProjection * worldPosition;
  v_normal = mat3(u_instanceWorld) * a_normal;
  v_worldPosition = worldPosition.xyz;
  v_surfaceToView = u_viewInverse[3].xyz - worldPosition.xyz;
  gl_Position = v_position;
}
`;

var fs = fsPrelude + `
in vec4 v_position;
in vec3 v_normal;
in vec2 v_texcoord;
in vec3 v_viewToSurface;
in vec3 v_worldPosition;
in vec3 v_surfaceToView;

uniform sampler2D u_albedo;
uniform sampler2D u_metallic;
uniform sampler2D u_roughness;
uniform sampler2D u_ao;
uniform sampler2D u_normal;

uniform samplerCube u_skybox;
uniform samplerCube u_skylight;
uniform sampler2D u_brdfLuT;

struct Light {
  vec3 position;
  vec3 color;
  float intensity;
};

uniform Light u_lights[4];
uniform int u_lightCount;

uniform vec3 u_ambient;

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

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
  return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main() {
  vec3 albedo = decodeColor(texture(u_albedo, v_texcoord)).xyz;
  float metallic = texture(u_metallic, v_texcoord).x;
  float roughness = texture(u_roughness, v_texcoord).x;
  float ao = texture(u_ao, v_texcoord).x;
  vec3 normalMap = texture(u_normal, v_texcoord).xyz;
  normalMap = normalize(normalMap * 2.0 - 1.0);

  vec3 surfaceToView = normalize(v_surfaceToView);

  vec3 normal = normalize(v_normal);

  vec3 f0 = vec3(0.04);
  f0 = mix(f0, albedo, metallic);

  vec3 Lo = vec3(0.0);
  for (int i = 0; i < u_lightCount; ++i) {
    Light light = u_lights[i];

    vec3 surfaceToLight = light.position - v_worldPosition;

    vec3 L = normalize(surfaceToLight);
    vec3 H = normalize(surfaceToView + L);
  
    float distance    = length(surfaceToLight); // Please be smart about the sqrt glsl
    float attenuation = 1.0 / (distance * distance);
    vec3 radiance     = light.color * attenuation * light.intensity; 

    vec3 f = fresnelSchlick(max(dot(H, surfaceToView), 0.0), f0);

    float NDF = DistributionGGX(normal, H, roughness);
    float G   = GeometrySmith(normal, surfaceToView, L, roughness);

    vec3 numerator    = NDF * G * f;
    float denominator = 4.0 * max(dot(normal, surfaceToView), 0.0) * max(dot(normal, L), 0.0) + 0.0001;
    vec3 specular     = numerator / denominator;  

    vec3 kS = f;
    vec3 kD = vec3(1.0) - kS;
      
    kD *= 1.0 - metallic;	

    const float PI = 3.14159265359;
    
    float NdotL = max(dot(normal, L), 0.0);        
    Lo += (kD * albedo / PI + specular) * radiance * NdotL;
  }

  {
    vec3 kS = fresnelSchlickRoughness(max(dot(normal, surfaceToView), 0.0), f0, roughness); 
    vec3 kD = 1.0 - kS;
    vec3 irradiance = texture(u_skylight, normal).rgb;
    vec3 diffuse    = irradiance * albedo;

    vec3 reflectDir = reflect(surfaceToView * -1.0, normal);
    vec3 reflectColor = texture(u_skybox, reflectDir).xyz;  // prefilteredColor but not actually pre filtered
    vec2 envBRDF = texture(u_brdfLuT, vec2(max(dot(normal, surfaceToView), 0.0), roughness)).xy;
    vec3 specular = reflectColor * (kS * envBRDF.x + envBRDF.y);

    vec3 ambient    = (kD * diffuse + specular) * ao; 

    // ambient = ambient * albedo * ao;
    vec3 color   = ambient + Lo;

    outColor = vec4(encodeColor(color), 1);
    // outColor = vec4(texture(u_brdfLuT, v_texcoord).xyz, 1);
    // outColor = vec4(vec3(pow(roughness, 10.0)), 1);
    // outColor = vec4(Lo, 1);
  }
}
`;

var skyboxVertexShaderSource = vsPrelude + `
uniform mat4 u_viewProjectionInverse;

in vec4 a_position;
out vec4 v_position;

void main() {
  v_position = u_viewProjectionInverse * vec4(a_position.xy, 1, 1);
  gl_Position = vec4(a_position.xy, 1, 1);
}
`;

var skyboxFragmentShaderSource = fsPrelude + `
uniform samplerCube u_skybox;

in vec4 v_position;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = texture(u_skybox, normalize(v_position.xyz));
}
`;

function sleep(ms)  {
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

function toWebGL(gl, programInfo, objData) {
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, objData.arrays);
  const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);

  return {
    programInfo: programInfo,
    bufferInfo: bufferInfo,
    vertexArray: vao,
  };//{ bufferInfo, vao, material: objData.material };
}

function makeObject(shape, translation, rotation, scale, material) {
  return {
    info: shape,
    isVisible: true,
    uniforms: {
      u_instanceWorld: m4.identity(),
    },
    translation: translation,
    rotation: rotation, // TODO: Use quaternion instead of euler
    scale: scale,
    material: material,
  };
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

var figuresByNumber = null;
var pointer = null;
var objects = [];
var textures = null;
var materials = null;
var debugObjects = null;
var cameraBase = [0, 0.2, 2];
var cameraZ = 0;
var cameraMomentum = 0;
var figures = [];
var activeField = null;
var hoverIntensity = 0;

var rgbLamps = 2.0;

var camera = {
  position: [0, 0, 5],
  target: [0, -1.1, 0],
  up: [0, 1, 0],
  fov: 60 * Math.PI / 180,
  near: 0.1,
  far: 2000,
  gamma: 2.2,
};

var lights = [
  { position: [1, 8, 30], color: [1, 1, 1], intensity: 6000.0 },
  { position: [1, 1, 2], color: [1, 0, 0], intensity: rgbLamps },
  { position: [1, .5, 1], color: [0, 1, 0], intensity: rgbLamps/2 },
  { position: [1, .2, 3], color: [0, 0, 1], intensity: rgbLamps },
]

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
function addVec3(a, b)	{ return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function equals2d(a, b)	{ return (a[0] == b[0] && a[1] == b[1]); }
function clamp(x, min, max) { return x < min ? min : x > max ? max : x; }

function assignpos(obj, i, j) {
  obj.i = clamp(i, 0, 7);
  obj.j = clamp(j, 0, 7);
  refreshTranslation(obj);
}

function computeMatrix(translation, rotation, scale) {
  var mat = m4.translation(translation[0], translation[1], translation[2]);
  mat = m4.xRotate(mat, rotation[0]);
  mat = m4.yRotate(mat, rotation[1]);
  mat = m4.zRotate(mat, rotation[2]);
  mat = m4.scale(mat, scale[0], scale[1], scale[2]);
  return mat;
}

function computeUniforms(object) {
  object.uniforms.u_instanceWorld = computeMatrix(
      object.translation,
      object.rotation,
      object.scale);
  object.uniforms.u_albedo = object.material.albedo ?? textures.trueBlack;
  object.uniforms.u_metallic = object.material.metallic ?? textures.trueBlack;
  object.uniforms.u_roughness = object.material.roughness ?? textures.grey;  
  object.uniforms.u_ao = object.material.ao ?? textures.trueWhite;
  object.uniforms.u_normal = object.material.normal ?? textures.defaultNormal;
}

function refreshTranslation(obj) {
  obj.obj.translation = getCoords([obj.i, obj.j]);
}

function update(time, deltaTime) {
  pointer.obj.rotation[1] -= deltaTime * 0.0005;
  cameraZ += cameraMomentum * deltaTime * 0.05;
  cameraMomentum = clamp(cameraMomentum * Math.pow(0.999, deltaTime), -.01, .01);

  camera.position = m4.transformPoint(m4.yRotation(cameraZ), cameraBase);

  lights[0].position = m4.transformPoint(m4.yRotation(deltaTime * 0.0005), lights[0].position);
  lights[1].position = m4.transformPoint(m4.zRotation(deltaTime * -0.0004), lights[1].position);
  lights[2].position = m4.transformPoint(m4.yRotation(deltaTime * 0.0006), lights[2].position);
  lights[3].position = m4.transformPoint(m4.xRotation(deltaTime * 0.0002), lights[3].position);
}

function onDraw(time, deltaTime, draw) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const figure = field[getIndex([i, j])] - 1;
      if (figure < 0) continue;
      const isBlack = figure >= 6;
      const shape = figuresByNumber[figure % 6];
      const rotation = figure % 6 != 3 ? 0 : isBlack ? blackHorseRotation : whiteHorseRotation;
      const scale = pawnScale;
      const material = isBlack ? materials.black : materials.white;
	const hover = equals2d(field, activeField) ? [0.0, 0.0, 0.0] : [0.0, hoverIntensity, 0.0];
      const obj = makeObject(shape, add(getCoords([i, j]), hover), [0, rotation, 0], [scale, scale, scale], material);
      computeUniforms(obj);
      draw(obj);
    }
  }
}

function solidTexture(gl, r, g, b, a) {
  return twgl.createTexture(gl, {src: [r, g, b, a]});
}

function solidTexture(gl, r, g, b) {
  return twgl.createTexture(gl, {src: [r, g, b, 1]});
}

function solidTexture(gl, w) {
  return twgl.createTexture(gl, {src: [w, w, w, 1]});
}

function toggleDebugObjects() {
  debugObjects.forEach(x => x.isVisible = !x.isVisible);
}

function setRgbLights(intensity) {
  rgbLamps = intensity;
  lights[1].intensity = lights[2].intensity = lights[3].intensity = intensity;
}

function closeCam() {
  cameraBase = [0, -0.3, .8];
}

async function main() {
  if (typeof whiteView === 'undefined') {
    alert("Bitte die Lobby verwenden um einem Spiel beizutreten");
    window.location.replace("lobby.php");
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

  var defaultField = "2,3,4,5,6,4,3,2," +
      "1,1,1,1,1,1,1,1," +
      "0,0,0,0,0,0,0,0," +
      "0,0,0,0,0,0,0,0," +
      "0,0,0,0,0,0,0,0," +
      "0,0,0,0,0,0,0,0," +
      "7,7,7,7,7,7,7,7," +
      "8,9,10,11,12,10,9,8";		
  field = textToArr(getCookie("session_field") ?? defaultField);
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

  // var extFBF = gl.getExtension('EXT_color_buffer_float');
  // const fbi = twgl.createFramebufferInfo(gl, [
  //   { format: extFBF.}
  // ]);

  // const rb = gl.createRenderbuffer();
  // gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
  // gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, gl.drawingBufferWidth, gl.drawingBufferHeight);
  // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rb);

  // setup GLSL program
  var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  var skyboxProgramInfo = twgl.createProgramInfo(gl, [skyboxVertexShaderSource, skyboxFragmentShaderSource]);

  var models = {
    pawn: toWebGL(gl, programInfo, await fetchOBJ('models/weißerBauer.obj')),
    king: toWebGL(gl, programInfo, await fetchOBJ('models/weißerKönig.obj')),
    queen: toWebGL(gl, programInfo, await fetchOBJ('models/weißeDame.obj')),
    tower: toWebGL(gl, programInfo, await fetchOBJ('models/weißerTurm.obj')),
    horse: toWebGL(gl, programInfo, await fetchOBJ('models/weißesPferd.obj')),
    bishop: toWebGL(gl, programInfo, await fetchOBJ('models/weißerLäufer.obj')),
    board: toWebGL(gl, programInfo, await fetchOBJ('models/cube.obj')),
    pointer: toWebGL(gl, programInfo, await fetchOBJ('models/pointer.obj')),
    sphere: toWebGL(gl, programInfo, await fetchOBJ('models/sphere.obj')),
  }

  figuresByNumber = [models.pawn, models.tower, models.bishop, models.horse, models.king, models.queen];

  textures = twgl.createTextures(gl, {
    white: {src: [255, 255, 255, 255]},
    black: {src: [40, 40, 40, 255]},

    grey: {src: [140, 140, 140, 255]},

    trueWhite: {src: [255, 255, 255, 255]},
    trueBlack: {src: [0, 0, 0, 255]},
    defaultNormal: {src: [0, 255, 0, 255]},

    board: {src: "textures/chessBoard.jpg"},
    boardNrm: {src: "textures/PlasticRough002_NRM_1K.jpg"},
    boardRefl: {src: "textures/PlasticRough002_GLOSS_1K.jpg"},

    plastic: {src: "textures/PlasticRough002_COL_1K.jpg"},

    metal: {src: "textures/MetalCorrodedHeavy001_COL_1K_METALNESS.jpg"},
    metalMetallic: {src: "textures/MetalCorrodedHeavy001_METALNESS_1K_METALNESS.jpg"},
    metalRough: {src: "textures/MetalCorrodedHeavy001_ROUGHNESS_1K_METALNESS.jpg"},

    skybox: {
      target: gl.TEXTURE_CUBE_MAP,
      src: [
        'textures/cubemap/px.jpg',
        'textures/cubemap/nx.jpg',
        'textures/cubemap/py.jpg',
        'textures/cubemap/ny.jpg',
        'textures/cubemap/pz.jpg',
        'textures/cubemap/nz.jpg',
      ],
    },
    skylight:	{
      target: gl.TEXTURE_CUBE_MAP,
      src: [
        'textures/cubemap/pxb.jpg',
        'textures/cubemap/nxb.jpg',
        'textures/cubemap/pyb.jpg',
        'textures/cubemap/nyb.jpg',
        'textures/cubemap/pzb.jpg',
        'textures/cubemap/nzb.jpg',
      ],
    },
    ibl_brdf_lut: {src: "textures/ibl_brdf_lut.png"},
  });

  materials = {
    board: { albedo: textures.board, roughness: textures.boardRefl, },
    pointer: { albedo: textures.board, metallic: solidTexture(gl, 255), },
    white: { albedo: textures.white, roughness: solidTexture(gl, 150), },
    black: { albedo: textures.black, roughness: solidTexture(gl, 130), },
    test: { albedo: textures.metal, roughness: textures.metalRough, metallic: textures.metalMetallic, },
    test2: { albedo: textures.trueBlack, roughness: solidTexture(gl, 1), metallic: solidTexture(gl, 0), },
    test3: { albedo: textures.white, roughness: solidTexture(gl, 1), metallic: solidTexture(gl, 255), },
  };

  objects.push(makeObject(models.board, board, [0, 0, 0], [1, 1, 1], materials.board));
  
  const pointerObj = makeObject(models.pointer, getCoords(initialPointerField), [0, 0, 0], [.1, .1, .1], materials.pointer);
  objects.push(pointerObj);
  pointer = { obj: pointerObj, i: initialPointerField[0], j: initialPointerField[1] };

  debugObjects = [
    makeObject(models.sphere, [0, -.8, 0], [0, 0, 0], [.2, .2, .2], materials.test),
    makeObject(models.sphere, [0.4, -.8, 0], [0, 0, 0], [.2, .2, .2], materials.test2),
    makeObject(models.sphere, [-0.4, -.8, 0], [0, 0, 0], [.2, .2, .2], materials.test3),
  ];
  toggleDebugObjects();

  objects.push(...debugObjects);

  const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
  const quadVAO = twgl.createVAOFromBufferInfo(gl, skyboxProgramInfo, quadBufferInfo);

  say("Warten auf anderen Spieler...", getCookie("session_color"));
  while (true) {
    if (full) {
      break;
    }
    playerJoined();
    await sleep(1000);
  }
  say("Weiß beginnt", "white");
  await sleep(1);

  requestAnimationFrame(drawScene);

  var lastTime = 0;

  // Draw the scene.
  function drawScene(time) {
    var deltaTime = time - lastTime;
    update(time, deltaTime);
    lastTime = time;

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(camera.fov, aspect, camera.near, camera.far);
    
    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(camera.position, camera.target, camera.up);
    
    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

	  var viewProjectionMatrix =
		  m4.multiply(projectionMatrix, viewMatrix);

    var viewProjectionInverseMatrix = 
      m4.multiply(cameraMatrix, m4.inverse(projectionMatrix));

    // Compute the matrices for each object.
    objects.forEach(computeUniforms);

    const sharedUniforms = {
      u_viewProjection: viewProjectionMatrix,
      u_viewInverse: cameraMatrix,

      u_skybox: textures.skybox,
	    u_skylight: textures.skylight,
      u_brdfLuT: textures.ibl_brdf_lut,

      u_lightCount: lights.length,
      
      u_gamma: camera.gamma,
    };

    lights.forEach((l, ndx) => {
      sharedUniforms["u_lights[" + ndx + "].position"] = l.position;
      sharedUniforms["u_lights[" + ndx + "].color"] = l.color;
      sharedUniforms["u_lights[" + ndx + "].intensity"] = l.intensity;
    });

    // ------ Draw the objects --------

    var lastUsedProgramInfo = null;
    var lastUsedVertexArray = null;

    function draw(object) {
      if (!object.isVisible) return;
      var programInfo = object.info.programInfo;
      var vertexArray = object.info.vertexArray;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);
        twgl.setUniforms(programInfo, sharedUniforms);

        // programInfo.uniformSetters["u_light.color"]([1, 1, 1]);
        // var l = gl.getUniformLocation(programInfo.program, "u_light.color");
        // gl.uniform3f(l, 1, 1, 1);
      }

      // Setup all the needed attributes.
      if (lastUsedVertexArray !== vertexArray) {
        lastUsedVertexArray = vertexArray;
        gl.bindVertexArray(vertexArray);
      }

      // Set the uniforms.
      twgl.setUniforms(programInfo, object.uniforms);

      // Draw
      twgl.drawBufferInfo(gl, object.info.bufferInfo);
    }

    gl.depthFunc(gl.LESS);

    objects.forEach(draw);

    onDraw(time, deltaTime, draw);

    gl.depthFunc(gl.LEQUAL);
 
    gl.useProgram(skyboxProgramInfo.program);
    twgl.setUniforms(skyboxProgramInfo, {
      u_viewProjectionInverse: viewProjectionInverseMatrix,
      u_skybox: textures.skybox,
      u_gamma: camera.gamma,
    });

    gl.bindVertexArray(quadVAO);
    twgl.drawBufferInfo(gl, quadBufferInfo);

    requestAnimationFrame(drawScene);
  }
}

main();
