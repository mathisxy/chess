"use strict";

var vs = `#version 300 es

in vec4 a_position;
in vec3 a_normal;
in vec4 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_projection;

out vec2 v_texcoord;
out vec4 v_color;

void main() {
  gl_Position = u_projection * u_matrix * a_position;

  v_texcoord = a_texcoord;
  v_color = vec4(1, 1, 1, 1);
}
`;

var fs = `#version 300 es
precision highp float;

in vec2 v_texcoord;
in vec4 v_color;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
   outColor = texture(u_texture, v_texcoord);
}
`;

async function fetchOBJ(url) {
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
  for (let lineNr = 0; lineNr < lines.length; ++lineNr)  {
    const line = lines[lineNr].trim();
    if (line === '' || line.startsWith('#'))  {
      continue;
    }
    const parts = line.split(/\s+/);
    const m = keywordRE.exec(line);
    if(!m)  {
      continue;
    }
    const keyword = parts[0];
    parts.shift();
    switch(keyword)  {
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
      if (parts.length == 3)  {
      for (let i = 0; i < 3; i++)  {
        let arr = f3(parts[i]);
        assign(arr);
      }
      }
      else if (parts.length == 4)  {
      for (let i = 0; i < 3; i++)  {
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
  function usemtl(parts)  { return parts[0]; }
}

function toWebGL(gl, meshProgramInfo, objData) {
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, objData.arrays);
  const vao = twgl.createVAOFromBufferInfo(gl, meshProgramInfo, bufferInfo);

  return { bufferInfo, vao, material: objData.material };
}

async function main() {
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

  var figures = {
    pawn: toWebGL(gl, programInfo, await fetchOBJ('weißerBauer.obj')),
    king: toWebGL(gl, programInfo, await fetchOBJ('weißerKönig.obj')),
    queen: toWebGL(gl, programInfo, await fetchOBJ('weißeDame.obj')),
    tower: toWebGL(gl, programInfo, await fetchOBJ('weißerTurm.obj')),
    horse: toWebGL(gl, programInfo, await fetchOBJ('weißesPferd.obj')),
    bishop: toWebGL(gl, programInfo, await fetchOBJ('weißerLäufer.obj')),
  }

  var figureByNumber = [figures.pawn, figures.tower, figures.bishop, figures.horse, figures.king, figures.queen];

  function makeObject(shape, translation, rotation, scale, material) {
    return {
      programInfo: programInfo,
      isVisible: true,
      bufferInfo: shape.bufferInfo,
      vertexArray: shape.vao,
      uniforms: {
        u_matrix: m4.identity(),
      },
      translation: translation,
      rotation: rotation, // TODO: Use quaternion instead of euler
      scale: scale,
      material: material,
    };
  }

  function degToRad(d) { return d * Math.PI / 180; }

  var fieldOfViewRadians = degToRad(60);

  const textures = twgl.createTextures(gl, {
    white: {src: [255, 255, 255, 255]},
    black: {src: [50, 50, 50, 255]},
    board: {src: "chessBoard.jpg"},
  });
  
  var objects = [];
  makeObject
  fields

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const figure = fields[[i, j]] - 1;
      if (figure < 0) continue;
      const isBlack = figure >= 6;
      const shape = figures[figure % 6];
      objects.push(makeObject(shape, ))
    }
  }

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

  // Draw the scene.
  function drawScene(time) {
    time = time * 0.0005;

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
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // Compute the matrices for each object.
    objects.forEach(function(object) {
      object.uniforms.u_matrix = computeMatrix(
          object.translation,
          object.rotation,
          object.scale);
    });

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_projection: viewProjectionMatrix,
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

    requestAnimationFrame(drawScene);
  }
}

main();
