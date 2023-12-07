"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import Stats from "three/addons/libs/stats.module.js";
import { GroundProjectedSkybox } from "three/addons/objects/GroundProjectedSkybox.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import * as CANNON from "cannon-es";
import io from "socket.io-client";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const socket = io("http://10.12.4.5:6060"); // Replace with your Socket.io server URL
const Obj_loadings = {
  paddle: {
    name: "paddle",
    obj: "paddlev3.obj",
    mtl: "paddlev3.mtl",
    loadingg: undefined,
  },
  paddle2: {
    name: "paddle",
    obj: "paddlev3.obj",
    mtl: "paddlev3.mtl",
    loadingg: undefined,
  },
  table: {
    name: "table",
    obj: "tableTennisTable3.obj",
    mtl: "tableTennisTable3.mtl",
  },
  ball: {
    name: "ball",
    obj: "aball.obj",
    mtl: "aball.mtl",
  },
};

const OBJ_elements = {
  paddle_1: {
    name: "paddle_1",
    laoding: Obj_loadings["paddle"],
    mesh: null,
    position: { x: 10.7, y: 5.5, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    scale: { x: 4, y: 4, z: 4 },
  },
  paddle_2: {
    name: "paddle_2",
    laoding: Obj_loadings["paddle2"],
    mesh: null,
    position: { x: -10.85, y: 5, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    scale: { x: 4, y: 4, z: 4 },
  },
  table: {
    name: "table",
    laoding: Obj_loadings["table"],
    mesh: null,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    scale: { x: 3.5, y: 3.5, z: 3.5 },
  },
  // ball: {
  //   name: "ball",
  //   laoding: Obj_loadings["ball"],
  //   mesh: null,
  //   position: { x: 0, y: 1, z: 0 },
  //   rotation: { x: 0, y: Math.PI / 2, z: 0 },
  //   scale: { x: 60, y: 60, z: 60 },
  // },
};
const GTL_elements = {
  // paddle_1: {
  //   name: "paddle_1",
  //   file_name: "gltf/export.glb",
  //   mesh: null,
  //   position: { x: 10.85, y: 5, z: 0 },
  //   rotation: { x: 0, y: Math.PI / 2, z: 0 },
  //   scale: { x: 4, y: 4, z: 4 },
  // },
  // paddle_2: {
  //   name: "paddle_2",
  //   file_name: "gltf/tableTennisTable.glb",
  //   mesh: null,
  //   position: { x: -10.85, y: 5, z: 0 },
  //   rotation: { x: 0, y: Math.PI / 2, z: 0 },
  //   scale: { x: 4, y: 4, z: 4 },
  // },
  table: {
    name: "table",
    file_name: "gltf/ss/New Folder/yyy/scene.gltf",
    mesh: null,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    scale: { x: 5000, y: 5000, z: 5000 },
  },
};

class element {
  constructor(obj, mtl, position, rotation, scale) {
    this.obj = obj;
    this.mtl = mtl;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.mesh = null;
  }

  define_mesh(the_new_mesh) {
    this.mesh = the_new_mesh;
  }
}

export default function Home() {
  const containerRef = useRef(null);
  const started = useRef(false);
  const [score, setScore] = useState({ player1: 0, player2: 0 });
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (started.current) return;
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    // setSize({
    //   width: window.innerWidth,
    //   height: window.innerHeight,
    // });
    started.current = true;
    // Constants
    const WIDTH = window.innerWidth - 10,
      HEIGHT = 1200,
      FIELD_WIDTH = 960,
      FIELD_LENGTH = 10,
      PADDLE_WIDTH = 300,
      PADDLE_HEIGHT = 30,
      BALL_RADIUS = 100,
      Player_GeoList = [],
      Player_OP_GeoList = [],
      trailEnabled = 1;

    let renderer,
      Ball_path = null,
      trail,
      scene,
      camera,
      paddle1,
      paddle2,
      ball,
      paddle1_player,
      stats,
      model;
    let BALL_DX = 0.15,
      CLIKED_RIGHT = false,
      CLIKED_LEFT = false,
      player1_rotation = Math.PI / 2;

    const params = {
      camerax: 30,
      cameray: 12,
      cameraz: 0,
      cameraangle: 45,
      cameraaround: 20,
    };

    socket.on("connect", () => {
      console.log("Connected to Socket.io server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.io server");
    });
    socket.on("id", (data) => {
      console.log(data);
    });
    socket.on("ballmove", (data) => {
      // console.log(data);
    });
    socket.on("paddlemove", (data) => {
      console.log(data);
      if (OBJ_elements["paddle_2"].mesh) {
        for (let geo of OBJ_elements["paddle_2"].mesh) {
          geo.position.x = data.x * -1;
          geo.position.y = data.y;
          geo.position.z = data.z;
          geo.rotation.x = data.rotationx;
          geo.rotation.y = -data.rotationy;
          geo.rotation.z = -data.rotationz;
        }
      }
    });

    let angle = 0; // Initialize rotation angle
    let object;

    // Initialize Three.js

    function containerMouseMove(e) {
      var mouseX = e.clientX;
      var mouseY = e.clientY;
      var posiiy = 0.5 - mouseY / size.height;
      // console.log(posiiy, mouseY);
      // console.log(mouseX);
      var posii =
        ((size.width - mouseX) / size.width) * FIELD_WIDTH - FIELD_WIDTH / 2;
      // console.log(posii);

      //   paddle1_player.position.z = posii;
      // console.log(paddle1_player.position);
      for (let geo of OBJ_elements["paddle_1"].mesh) {
        geo.position.z = posii / 40;
        player1_rotation = 0.015;
        // geo.rotateOnAxis(new THREE.Vector3(0, -0.7, 1), player1_rotation);
        // geo.position.y = geo.position.y + 0.2;
        // console.log(geo.position);
        geo.position.y = 5 + (3.5 - Math.abs(geo.position.z)) / 5;
        geo.position.x = 10.5 + (3.5 - Math.abs(geo.position.z)) / 10;
        geo.position.y = OBJ_elements["paddle_1"].position.y + posiiy * 4;
        geo.position.x = OBJ_elements["paddle_1"].position.x - posiiy * 15;
      }
    }

    const init = () => {
      // --------------------------
      const world = new CANNON.World();
      world.gravity.set(0, -9.8, 0); // Set gravity

      // Ball material
      const ballMaterial = new CANNON.Material();
      ballMaterial.restitution = 0.5;

      // Ball body
      const ballBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 10, 0),
        shape: new CANNON.Sphere(0.23),
        material: ballMaterial,
        angularVelocity: new CANNON.Vec3(0, 0, 0.5),
        velocity: new CANNON.Vec3(-5, 0, 0),
      });
      world.addBody(ballBody);

      // Assuming the table dimensions are known
      const tableWidth = 50; // Example width
      const tableHeight = 50; // Assuming a thin table for height
      const tableDepth = 0.51; // Example depth

      const tableShape = new CANNON.Box(
        new CANNON.Vec3(tableWidth / 2, tableHeight / 2, tableDepth / 2)
      );

      // Ground material
      const groundMaterial = new CANNON.Material("groundMaterial");

      // Contact material
      const ballGroundContactMaterial = new CANNON.ContactMaterial(
        ballMaterial,
        groundMaterial,
        {
          friction: 0,
          restitution: 1.0001,
        }
      );
      world.addContactMaterial(ballGroundContactMaterial);

      // Ground body
      const groundBody = new CANNON.Body({
        mass: 0,
        shape: tableShape,
        position: new CANNON.Vec3(0, 5.2, 0),
        material: groundMaterial,
      });
      groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Correctly set the quaternion
      world.addBody(groundBody);

      // --------------------------

      const gui = new GUI();
      gui.add(params, "camerax", 0, 50, 0.1).onChange(() => {
        camera.position.x = params.camerax;
        renderer.render(scene, camera);
      });
      gui.add(params, "cameray", 0, 50, 0.1).onChange(() => {
        camera.position.y = params.cameray;
        renderer.render(scene, camera);
      });
      gui.add(params, "cameraz", 0, 50, 0.1).onChange(() => {
        camera.position.z = params.cameraz;
        renderer.render(scene, camera);
      });
      gui.add(params, "cameraangle", 30, 180, 0.1).onChange(() => {
        camera.fov = params.cameraangle;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      });
      gui.add(params, "cameraaround", -20, 20, 0.1).onChange(() => {
        const radius = 20;
        camera.position.x = radius * Math.sin(params.cameraaround);
        camera.position.z = radius * Math.cos(params.cameraaround);
        camera.lookAt(scene.position);
      });
      stats = new Stats();

      // console.log(geometries);
      // create a scene, that will hold all our elements
      // such as objects, cameras and lights.
      scene = new THREE.Scene();

      const ambientLight = new THREE.AmbientLight(0xffffff);
      ambientLight.intensity = 4;
      scene.add(ambientLight);
      // const light = new THREE.PointLight(0xffffff, 1, 100);
      // light.position.set(10, 10, 10);
      // scene.add(light);

      async function loadSkybox() {
        const hdrLoader = new RGBELoader();
        const envMap = await hdrLoader.loadAsync("pic6.pic");
        envMap.mapping = THREE.EquirectangularReflectionMapping;

        const skybox = new GroundProjectedSkybox(envMap);
        skybox.scale.setScalar(100);
        scene.add(skybox);
      }
      loadSkybox();
      //Create a closed wavey loop

      if (trailEnabled) {
        // create a gradient texture on canvas and apply it on material

        Ball_path = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.1, 0),
        ]);
        const trailgeometry = new THREE.TubeGeometry(
          Ball_path,
          30,
          0.01,
          8,
          false
        );
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");

        const gradient = ctx.createLinearGradient(0, 0, 200, 0);
        gradient.addColorStop(0, "rgba(249, 252, 86, 0)");
        gradient.addColorStop(1, "rgba(249, 252, 86, 0.3)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        const trailTexture = new THREE.Texture(canvas);
        trailTexture.needsUpdate = true;

        const trailmaterial = new THREE.MeshBasicMaterial({
          map: trailTexture,
          transparent: true,
        });
        trail = new THREE.Mesh(trailgeometry, trailmaterial);
        scene.add(trail);
        Ball_path = null;
      }
      // new RGBELoader().load("pic2.pic", function (texture) {
      //   texture.mapping = THREE.EquirectangularRefractionMapping;

      //   scene.background = texture;
      //   scene.environment = texture;
      // render();

      // const gltfloader = new GLTFLoader();
      // gltfloader.load(
      //   "gltf/yes.glb", // resource URL
      //   async function (gltf) {
      //     // called when the resource is loaded
      //     model = gltf.scene;
      //     model.scale.set(4, 4, 4);

      //     await renderer.compileAsync(model, camera, scene);

      //     scene.add(gltf.scene);
      //   },
      //   function (xhr) {
      //     // called while loading is progressing
      //     console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      //   },
      //   function (error) {
      //     // called when loading has errors
      //     console.error("An error happened", error);
      //   }
      // );
      // });
      // add field
      const fieldtextureLoader = new THREE.TextureLoader();
      const fieldTexture = fieldtextureLoader.load("galaxy.jpg"); // Path to the converted texture
      const fieldGeometry = new THREE.PlaneGeometry(20, 20);
      const fieldMaterial = new THREE.MeshBasicMaterial({
        map: fieldTexture,
      });
      const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
      field.position.x = 0;
      field.position.y = 0;
      field.position.z = 0;
      field.rotation.x = -Math.PI / 2;
      // scene.add(field);

      camera = new THREE.PerspectiveCamera(
        params.cameraangle,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.x = params.camerax;
      camera.position.y = params.cameray;
      camera.position.z = params.cameraz;
      camera.lookAt(scene.position);

      // create a renderer, set the background color and size
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.domElement.addEventListener("mousemove", containerMouseMove);
      renderer.domElement.style.cursor = "none";

      // window resize handler
      window.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        size.width = window.innerWidth;
        size.height = window.innerHeight;
      });
      const controls = new OrbitControls(camera, renderer.domElement);

      renderer.setPixelRatio(window.devicePixelRatio);
      // renderer.setClearColor(0x000000, 1.0);
      renderer.setSize(window.innerWidth, window.innerHeight - 10);

      //   loadModels();

      for (let ele in OBJ_elements) {
        for (let elmesh in OBJ_elements[ele].mesh) {
          scene.add(OBJ_elements[ele].mesh[elmesh]);
          if (OBJ_elements[ele].name == "paddle_1") {
            paddle1_player = OBJ_elements[ele].mesh[elmesh];
          }
          if (OBJ_elements[ele].name == "paddle_2") {
            Player_OP_GeoList.push(OBJ_elements[ele].mesh[elmesh]);
          }
          if (OBJ_elements[ele].name == "table") {
            Player_OP_GeoList.push(OBJ_elements[ele].mesh[elmesh]);
          }
          //   if (OBJ_elements[ele].name == "ball") {
          //     Player_OP_GeoList.push(OBJ_elements[ele].laoding.loadingg[mesh]);
          //   }
        }
      }
      // for (let ele in GTL_elements) {
      //   scene.add(GTL_elements[ele].mesh);
      //   if (GTL_elements[ele].name == "paddle_1") {
      //     paddle1_player = GTL_elements[ele].mesh;
      //   }
      //   if (GTL_elements[ele].name == "paddle_2") {
      //     Player_OP_GeoList.push(GTL_elements[ele].mesh);
      //   }
      //   if (GTL_elements[ele].name == "table") {
      //     Player_OP_GeoList.push(GTL_elements[ele].mesh);
      //   }
      // }

      // async function loadball() {
      const textureLoader = new THREE.TextureLoader();
      const ballTexture = textureLoader.load("Earth.png"); // Path to the converted texture

      const ballGeometry = new THREE.SphereGeometry(0.23, 32, 32);
      const pballMaterial = new THREE.MeshBasicMaterial({
        map: ballTexture,
      });
      ball = new THREE.Mesh(ballGeometry, pballMaterial);
      ball.position.x = 0;
      ball.position.y = 1;
      ball.position.z = 0;
      scene.add(ball);
      // }
      // loadball();

      // ... rest of the init function ...

      // add the output of the renderer to the html element
      containerRef.current.appendChild(renderer.domElement);
      containerRef.current.appendChild(stats.dom);

      // call the render function
      renderer.render(scene, camera);
      const handleKeyDown = (event) => {
        // Movement speed of the paddle
        const paddleMoveSpeed = 1;

        console.log("right");
        if (event.key === "a") {
          CLIKED_RIGHT = true;
        }
        if (event.key === "d") {
          CLIKED_LEFT = true;
        }
      };
      const handleKeyUp = (event) => {
        if (event.key === "a") {
          CLIKED_RIGHT = false;
        }
        if (event.key === "d") {
          CLIKED_LEFT = false;
        }
      };
      // Attach the event listener
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      ballBody.addEventListener("collide", (event) => {
        console.log("The sphere just collided with the ground!");
        console.log(event);
      });
      // // Start the game loop
      // Ball_path.push(
      //   new THREE.Vector3(
      //     ball.position.x,
      //     ball.position.y,
      //     ball.position.z + 0.001
      //   )
      // );
      const animate = () => {
        ball.quaternion.x += 1;
        ball.quaternion.y += 1;
        ball.quaternion.z += 1;

        function updateTrail() {
          if (!trailEnabled) {
            return;
          }
          // the points array is a first in first out queue
          if (!Ball_path) {
            Ball_path = new THREE.CatmullRomCurve3([
              ball.position.clone(),
              new THREE.Vector3(
                ball.position.x,
                ball.position.y,
                ball.position.z + 0.001
              ),
            ]);
          } else {
            Ball_path.points.push(ball.position.clone());
          }
          if (Ball_path.points.length > 20) {
            Ball_path.points.shift();
          }
          trail.geometry.dispose();
          trail.geometry = new THREE.TubeGeometry(Ball_path, 8, 0.1, 8, false);
        }
        updateTrail();

        if (model) model.rotation.y += 0.01;

        world.step(1 / 60); // Assuming 60 FPS

        stats.update();
        ball.rotation.x += 0.04;
        ball.rotation.y += 0.04;

        socket.emit("ballmove", {
          x: ball.position.x,
          y: ball.position.y,
          z: ball.position.z,
        });
        socket.emit("paddlemove", {
          x: OBJ_elements["paddle_1"].mesh[0].position.x,
          y: OBJ_elements["paddle_1"].mesh[0].position.y,
          z: OBJ_elements["paddle_1"].mesh[0].position.z,
          rotationx: OBJ_elements["paddle_1"].mesh[0].rotation.x,
          rotationy: OBJ_elements["paddle_1"].mesh[0].rotation.y,
          rotationz: OBJ_elements["paddle_1"].mesh[0].rotation.z,
        });

        if (CLIKED_RIGHT == CLIKED_LEFT) {
          //
        } else if (CLIKED_RIGHT) {
          for (let geo of OBJ_elements["paddle_1"].mesh) {
            geo.position.z = geo.position.z + 0.2;
          }
        } else if (CLIKED_LEFT) {
          for (let geo of OBJ_elements["paddle_1"].mesh) {
            console.log(geo.position);
            player1_rotation = -0.015;
            geo.position.z = geo.position.z - 0.2;
          }
        }

        if (
          Math.abs(
            ball.position.x - OBJ_elements["paddle_1"].mesh[0].position.x - 0.1
          ) < 0.1 &&
          Math.abs(
            ball.position.z - OBJ_elements["paddle_1"].mesh[0].position.z
          ) < 0.73
        ) {
          // console.log(ball.position);
          // console.log(OBJ_elements["paddle_1"].mesh[0].position);
          // ball.position.x = FIELD_LENGTH / 2 - BALL_RADIUS;
          BALL_DX = -BALL_DX;
        } else if (
          ball.position.x >
          OBJ_elements["paddle_1"].mesh[0].position.x + 2
        ) {
          ball.position.x = 0;
          BALL_DX = -BALL_DX;
          setScore((prev) => {
            return { ...prev, player1: prev.player1 + 1 };
          });
        }
        if (ball.position.x < OBJ_elements["paddle_2"].mesh[0].position.x) {
          // ball.position.x = FIELD_LENGTH / 2 - BALL_RADIUS;
          BALL_DX = -BALL_DX;
        }
        ball.position.x = ball.position.x + BALL_DX;
        ball.position.y =
          12.5 - (Math.abs(ball.position.x) * Math.abs(ball.position.x)) / 20;
        // console.log(ball.position.y);
        // if (paddle1_player.mesh) console.log(paddle1_player.mesh[0].position);

        requestAnimationFrame(animate);

        const animatescene = () => {
          // Update angle for rotation
          angle += 0.01; // Adjust this value to control the speed of rotation

          // Calculate new camera position
          const radius = 20; // Distance of the camera from the center of the field
          camera.position.x = radius * Math.sin(angle);
          camera.position.y = 16; // Keep the height constant or adjust as needed
          camera.position.z = radius * Math.cos(angle);

          // Make the camera look towards the center of the field
          camera.lookAt(scene.position);
        };
        // animatescene();

        // Update game state
        // Here you would include logic for ball movement, collision detection, scoring etc.
        // if (ball.position.x > FIELD_LENGTH / 2 - BALL_RADIUS) {
        //   ball.position.x = FIELD_LENGTH / 2 - BALL_RADIUS;
        //   BALL_DX = -BALL_DX;
        // }
        // controls.maxDistance = 70;
        // controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
        // controls.target.set(0.25, 0.5, 0);
        // controls.update();

        function predictPositionAtHeight(ballBody, targetHeight) {
          const g = 9.82; // Gravity
          const initialHeight = ballBody.position.y;
          const initialVelocity = ballBody.velocity;

          // Calculate time to reach targetHeight
          const a = -0.5 * g;
          const b = initialVelocity.y;
          const c = initialHeight - targetHeight;

          // Solve quadratic equation: at^2 + bt + c = 0
          const discriminant = b * b - 4 * a * c;
          if (discriminant < 0) {
            return null; // No real roots, target height not reached
          }

          const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
          const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

          const timeToTargetHeight = Math.max(t1, t2); // Choose the positive root

          // Horizontal position at target height
          const positionAtHeightX = initialVelocity.x * timeToTargetHeight;
          const positionAtHeightZ = initialVelocity.z * timeToTargetHeight;

          return new CANNON.Vec3(
            positionAtHeightX,
            targetHeight,
            positionAtHeightZ
          );
        }

        // Example usage
        const landingPosition = predictPositionAtHeight(ballBody, 5.2);
        // console.log("Landing Position:", landingPosition);
        // console.log(ballBody.position);
        if (ballBody.position.x <= -10 || ballBody.position.x >= 20) {
          ballBody.velocity.x *= -1; // Reverse direction on X-axis
          ballBody.velocity.x += 1.2 * Math.sign(ballBody.velocity.x);
          if (Math.abs(ballBody.velocity.x) < 10)
            ballBody.velocity.x = 10 * Math.sign(ballBody.velocity.x);
          if (Math.abs(ballBody.velocity.x) > 15)
            ballBody.velocity.x = 15 * Math.sign(ballBody.velocity.x);
          if (ballBody.velocity.y < 5) ballBody.velocity.y = 5;
          ballBody.velocity.z =
            ((Math.random() * 10000) % 5) * Math.sign(ballBody.position.z);
        }

        if (ballBody.position.z <= -5) {
          ballBody.velocity.z *= Math.sign(ballBody.position.z);
        }
        if (ballBody.position.z >= 5) {
          ballBody.velocity.z *= -Math.sign(ballBody.position.z);
        }

        ball.position.copy(ballBody.position);
        ball.quaternion.copy(ballBody.quaternion);
        const boundingBox = new THREE.Box3();
        var j = 0;
        // for (let geo of OBJ_elements["paddle_1"].mesh) {
        boundingBox.setFromObject(OBJ_elements["paddle_1"].mesh[0]);
        // console.log(
        //   boundingBox.intersectsSphere(ball.geometry.boundingSphere)
        // );
        var center = boundingBox.getCenter(new THREE.Vector3());
        var disss = center.distanceTo(ball.position);

        if (
          Math.abs(ball.position.x - center.x) < 0.4 &&
          Math.sign(ballBody.velocity.x) == 1
        ) {
          console.log(disss);
        }
        if (
          disss < 1 &&
          Math.abs(ball.position.x - center.x) < 0.4 &&
          Math.sign(ballBody.velocity.x) == 1
        ) {
          console.log(ballBody.velocity);
          ballBody.velocity.x *= -1; // Reverse direction on X-axis
          ballBody.velocity.x += 0.9 * Math.sign(ballBody.velocity.x);
          if (Math.abs(ballBody.velocity.x) < 10)
            ballBody.velocity.x = 10 * Math.sign(ballBody.velocity.x);
          if (Math.abs(ballBody.velocity.x) > 15)
            ballBody.velocity.x = 15 * Math.sign(ballBody.velocity.x);
          if (ballBody.velocity.y < 5) ballBody.velocity.y = 5;
          ballBody.velocity.z =
            ((Math.random() * 10000) % 5) * -Math.sign(ballBody.position.z);
        }
        // console.log(ball.position);

        // j++;

        // console.log(ball.position);
        // console.log("hit");
        // }
        // }

        renderer.render(scene, camera);

        // console.log("animate");
        // console.log(camera.rotation);

        function nextpositions() {
          var tt = 2;
          var nvx = -ballBody.velocity.x / tt;
          var nvy = (5 - ballBody.position.y + 9.8 * tt * tt) / tt;
          var nvz = -ballBody.velocity.z / tt;
          console.log(nvx, nvy, nvz);
        }
        // nextpositions();
      };
      animate();
    };

    function loadmodel_obj22(the_element) {
      return new Promise((resolve, reject) => {
        const mtloader = new MTLLoader();
        mtloader.load(the_element.mtl, (mtl) => {
          mtl.preload();
          loader.setMaterials(mtl);
          loader.load(
            the_element.obj,
            (obj) => {
              const new_mesh_list = [];
              obj.traverse((child) => {
                if (child.isMesh) {
                  // console.log(child);
                  const mesh = new THREE.Mesh(
                    child.geometry,
                    new THREE.MeshBasicMaterial({
                      color: child.material.color,
                    })
                  );
                  new_mesh_list.push(mesh);
                  //   scene.add(mesh);
                }
              });
              the_element.loadingg = new_mesh_list;
              resolve(); // Resolve the promise after loading is complete
            },
            undefined,
            reject
          ); // Reject the promise on error
        });
      });
    }
    const loader = new OBJLoader();

    // for ele in OBJ_elements load the obj and mtl

    async function loadModels2test() {
      for (let ele in Obj_loadings) {
        await loadmodel_obj22(Obj_loadings[ele]);
        console.log(Obj_loadings[ele]);
      }
      for (let ele in OBJ_elements) {
        console.log(OBJ_elements[ele]);
        OBJ_elements[ele].mesh = OBJ_elements[ele].laoding.loadingg;
        for (let elmesh in OBJ_elements[ele].mesh) {
          OBJ_elements[ele].mesh[elmesh].position.set(
            OBJ_elements[ele].position.x,
            OBJ_elements[ele].position.y,
            OBJ_elements[ele].position.z
          );
          OBJ_elements[ele].mesh[elmesh].rotation.set(
            OBJ_elements[ele].rotation.x,
            OBJ_elements[ele].rotation.y,
            OBJ_elements[ele].rotation.z
          );
          OBJ_elements[ele].mesh[elmesh].scale.set(
            OBJ_elements[ele].scale.x,
            OBJ_elements[ele].scale.y,
            OBJ_elements[ele].scale.z
          );
          if (OBJ_elements[ele].name == "paddle_1") {
            const boundingBox = new THREE.Box3();
            boundingBox.setFromObject(OBJ_elements[ele].mesh[elmesh]);
            // console.log(boundingBox.getSize(new THREE.Vector3()));
            // console.log(
            //   boundingBox.distanceToPoint(new THREE.Vector3(0, 0, 0))
            // );
            // console.log(
            //   "ww",
            //   boundingBox.expandByPoint(new THREE.Vector3(0, 0, 0))
            // );
          }
        }
      }
    }

    async function gltfload(file_name) {
      console.log(file_name);
      return new Promise((resolve, reject) => {
        const gltfloader = new GLTFLoader();
        gltfloader.load(
          file_name, // resource URL
          async function (gltf) {
            // called when the resource is loaded
            model = gltf.scene;
            model.scale.set(4, 4, 4);
            resolve(model);
          },
          function (xhr) {
            // called while loading is progressing
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
          },
          function (error) {
            // called when loading has errors
            console.error("An error happened", error);
          }
        );
      });
    }
    async function gltfsload() {
      for (let ele in GTL_elements) {
        GTL_elements[ele].mesh = await gltfload(GTL_elements[ele].file_name);
        console.log(GTL_elements[ele]);
      }
    }
    // gltfsload().then(() => {
    //   for (let ele in GTL_elements) {
    //     console.log(GTL_elements[ele].mesh);
    //     GTL_elements[ele].mesh.position.set(
    //       GTL_elements[ele].position.x,
    //       GTL_elements[ele].position.y,
    //       GTL_elements[ele].position.z
    //     );
    //     GTL_elements[ele].mesh.rotation.set(
    //       GTL_elements[ele].rotation.x,
    //       GTL_elements[ele].rotation.y,
    //       GTL_elements[ele].rotation.z
    //     );
    //     GTL_elements[ele].mesh.scale.set(
    //       GTL_elements[ele].scale.x,
    //       GTL_elements[ele].scale.y,
    //       GTL_elements[ele].scale.z
    //     );
    //   }
    // });
    loadModels2test().then(() => init());

    // loader.load("paddle.obj", (obj) => init(obj.children));

    // init();

    return () => {
      // Perform cleanup
      // renderer.dispose();
    };
  }, []);

  // Render the game container
  return (
    <div
      ref={containerRef}
      tabIndex="0"
      style={{ width: size.width, height: size.height }}
    >
      <div>
        Player 1: {score.player1} Player 2: {score.player2}
      </div>
    </div>
  );
}
