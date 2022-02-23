# Chess

## Options to run:

- Visit mirror [without logic](https://www.mathis.party/game/index.php?nl) or [create a lobby here](https://www.mathis.party/game/lobby.php)

- Start using `python3 -m http.server` or `python -m http.server`, then visit [localhost:8000/chessNL.html?nl](localhost:8000/chessNL.html?nl)
* Start using `php -S localhost:8000` and visit [localhost:8000/index.php?nl](localhost:8000/index.php?nl)

## Features and Sources

* PBR
  
  * Based on the [Learn OpenGL article](https://learnopengl.com/PBR/Lighting)
  * BRDF integration map ~~stolen~~ borrowed from [the follow-up article](https://learnopengl.com/PBR/IBL/Specular-IBL)

* Cubemap Reflections
  
  * Skybox converted from Panorama to cubemap [here](https://jaxry.github.io/panorama-to-cubemap/)

* [WebGL2 Fundamentals](https://webgl2fundamentals.org/) was a great reference
  
  * The library [TWGL](https://twgljs.org/) recommended by WebGL2 Fundamentals made WebGL2 way more bearable

## For experimentation

In the browser debug console run:

* `toggleDebugObjects()` to show some spheres with materials for testing lighting
  
  * Center sphere is textured with albedo, roughness and metallic maps from [Poliigon](poliigon.com/)
  
  * Other spheres have solid color with no roughness
    
    * One side is fully metallic, other is fully dielectric

* `closeCam()` moves the camera closer to the center

* `setRgbLights(500)` sets the brightness of the red, green and blue lights to 400

* Edit `objects[0].translation/rotation/scale` to move the board around