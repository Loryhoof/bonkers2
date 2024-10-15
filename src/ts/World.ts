import * as THREE from "three";
import PhysicsManager from "./PhysicsManager";
import { sky } from "./Sky";
import { groundMaterial } from "./terrain/Ground";
import Player from "./Player";
import Pistol from "./weapons/Pistol";
import UIManager from "./UIManager";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { loadGLB, randomBetween } from "./Utils";
import Tree from "./Tree";
import Forest from "./Forest";
import EntityManager from "./EntityManager";
// import RAPIER from '@dimforge/rapier3d'
import Ocean from "./Ocean";
import { SimplexNoise } from "three/examples/jsm/Addons.js";
// import Terrain from './Terrain'
import Enemy from "./Enemy";
import { listener } from "./AudioManager";
import { SpawnManager } from "./SpawnManager";
import EndlessTerrain from "./terrain/EndlessTerrain";
import MapGenerator from "./terrain/MapGenerator";
import Car from "./vehicle/Car";

import { io } from "socket.io-client";
import InputManager from "./InputManager";
import RemotePlayer from "./RemotePlayer";

const loader = new GLTFLoader();

const socket = io("http://localhost:3000"); //http://159.223.23.178:3000

let lastPingTime = 0;
let currentPing = 0;

// Send a custom ping and record the precise time
socket.on("pong", () => {
  currentPing = performance.now() - lastPingTime;
  UIManager.getInstance().updatePing(currentPing.toFixed(2));
});

setInterval(() => {
  lastPingTime = performance.now(); // Record the precise time before sending the ping
  socket.emit("ping"); // Emit custom ping
}, 1000);

export default class World {
  public readonly camera: THREE.PerspectiveCamera;
  public readonly physics: PhysicsManager;
  public readonly ui: UIManager;
  public readonly scene: THREE.Scene;
  public readonly entityManager: EntityManager;

  private spawner: SpawnManager | any;

  private endlessTerrain!: EndlessTerrain;
  private mapGenerator!: MapGenerator;

  private inputManager: InputManager;

  // private static instance: World;

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer
  ) {
    this.camera = camera;
    this.scene = scene;
    this.physics = PhysicsManager.getInstance();
    this.entityManager = EntityManager.getInstance();
    this.ui = UIManager.getInstance();
    this.inputManager = InputManager.getInstance();
    this.spawner = null;

    (window as any).renderer = renderer;
  }

  // static getInstance(camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  //     if (!World.instance) {
  //         World.instance = new World(camera, scene, renderer);
  //     }
  //     return World.instance;
  // }

  // getRenderer() {
  //     return this.renderer
  // }

  async initialize() {
    //const geometry = new THREE.BoxGeometry(3, 3, 3)
    //const material = new THREE.MeshStandardMaterial({color: 0xff0000})

    //let cube = new THREE.Mesh(geometry, material)
    //cube.position.z = -15
    //cube.position.y = 1

    //this.physics.createFixedBox(cube.position, new THREE.Vector3(1.5,1.5,1.5))

    const light = new THREE.DirectionalLight(0xffffff);
    // light.position.set(0, 2, 2);
    // light.target.position.set(0, 0, 0);
    // const d = 50;
    // //light.castShadow = true;
    // light.shadow.camera.left = - d;
    // light.shadow.camera.right = d;
    // light.shadow.camera.top = d;
    // light.shadow.camera.bottom = - d;

    // light.shadow.camera.near = 1;
    // light.shadow.camera.far = 20;

    light.position.set(0, 4, 2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 2);

    this.scene.add(ambientLight);
    this.scene.add(light);
    //this.scene.fog = new THREE.Fog( 0xcccccc, 10, 15 );
    this.scene.fog = new THREE.FogExp2(0xcccccc, 0.005);
    //this.scene.add()
    //this.scene.add(cube)

    this.scene.add(sky);

    const planeGeo = new THREE.PlaneGeometry(1000, 1000);

    const planeMat = new THREE.MeshStandardMaterial();
    const ground = new THREE.Mesh(planeGeo, planeMat);
    let tl = new THREE.TextureLoader();

    const groundTexture1 = tl.load("dev.jpg");
    groundTexture1.repeat = new THREE.Vector2(100, 100);
    groundTexture1.wrapS = THREE.RepeatWrapping;
    groundTexture1.wrapT = THREE.RepeatWrapping;
    groundTexture1.magFilter = THREE.NearestFilter;

    planeMat.map = groundTexture1;

    ground.rotation.x -= Math.PI / 2;
    ground.position.y = 0.5;
    ground.visible = true;

    this.physics.createFixedBox(
      ground.position,
      new THREE.Vector3(1000, ground.position.y - 0.5, 1000)
    );
    this.scene.add(ground);

    this.camera.add(listener);

    // car test

    //let car = new Car(this.scene)

    //this.endlessTerrain = new EndlessTerrain(this.scene, player)

    let ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshStandardMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.6,
      })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = 9;
    //this.scene.add(ocean)

    //let terrain = new Terrain(this.scene)

    //this.mapGenerator = new MapGenerator(this.scene)
    //this.endlessTerrain = nwe E
    // let enemy2 = new Enemy(this.scene)
    // this.entityManager.add(enemy2)
    // this.scene.add(enemy2)
    // enemy2.setTarget(player)

    // let enemy3 = new Enemy(this.scene)
    // this.entityManager.add(enemy3)
    // this.scene.add(enemy3)
    // enemy3.setTarget(player)

    //const terrain = new Terrain(this.scene)

    //let nsubdivs = 100;
    //let scale = new RAPIER.Vector3(100.0, 10.0, 100.0);
    //this.generateTerrain(nsubdivs, scale);
    //this.generateTerrain(100, 100, 20)

    //this.spawner = new SpawnManager(this.scene, player);

    socket.on("connect", () => {
      console.log("connected!", socket.id);

      UIManager.getInstance().setNetworkIdText(socket.id as string);

      const networkId = socket.id as string;
      let player = new Player(networkId, this.scene, this.camera);
      //player.controller.teleportTo(new THREE.Vector3(0, 2, 0));
      this.entityManager.add(player);
      this.scene.add(player);
    });

    socket.on("player-list", (data) => {
      const entities = EntityManager.getInstance().getEntities();

      // Loop through each user in the data using Object.values
      for (const user of Object.values(data)) {
        let userExists = false;

        // Check if the user already exists in the entities list
        for (const entity of entities) {
          const networkId = entity.networkId;

          if (user.networkId === networkId) {
            userExists = true;
            break; // Stop checking, we found the user already exists
          }
        }

        // If the user does not exist, create a new RemotePlayer
        if (!userExists) {
          let newPlayer = new RemotePlayer(user.networkId);

          console.log(newPlayer, "newPlayer player-list");
          this.entityManager.add(newPlayer);
          this.scene.add(newPlayer);
        }
      }
    });

    socket.on("player-join", (data) => {
      console.log("new user joined the server");
      const entities = EntityManager.getInstance().getEntities();

      // Assume that the player is not already in the game
      let playerExists = false;

      // Check if the player is already in the game
      for (const entity of entities) {
        const networkId = entity.networkId;

        if (data.networkId === networkId) {
          console.log("User already in the game, skipping creation");
          playerExists = true;
          break;
        }
      }

      // If player is not in the game, create a new one
      if (!playerExists) {
        let newPlayer = new RemotePlayer(data.networkId); // Fix the use of data.networkId here

        console.log(newPlayer, "newPlayer player-join");

        this.entityManager.add(newPlayer);
        this.scene.add(newPlayer);
      }
    });

    socket.on("player-leave", (data) => {
      const entities = EntityManager.getInstance().getEntities();

      for (const entity of entities) {
        const networkId = entity.networkId;

        if (data.id == networkId) {
          this.scene.remove(entity);
          EntityManager.getInstance().remove(entity);
          break;
        }
      }
    });

    socket.on("player-update", (data) => {
      //console.log(data, "player-update DATA");

      const entities = EntityManager.getInstance().getEntities();

      for (const entity of entities) {
        const networkId = entity.networkId;

        if (data.networkId == networkId) {
          const newPosition = data.position;

          const direction = new THREE.Vector3(
            data.direction.x,
            0,
            data.direction.z
          );

          // Create a new quaternion
          const quaternion = new THREE.Quaternion();

          // The default forward direction in THREE.js is (0, 0, -1),
          // so we want to rotate this to match the direction vector.
          const forward = new THREE.Vector3(0, 0, 1); // Default forward
          quaternion.setFromUnitVectors(forward, direction.normalize());

          // Apply the quaternion to the entity
          entity.quaternion.copy(quaternion);

          entity.position.set(newPosition.x, newPosition.y, newPosition.z);

          entity.setAnimationVelocity(
            new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z)
          );

          entity.cameraParent?.position
            .copy(entity.position)
            .add(new THREE.Vector3(0, 0.25, 0)); // player height offset
        }
      }
    });
  }

  spawnTrees() {
    let forest = new Forest(250);
    this.scene.add(forest);
    this.entityManager.add(forest);
  }

  updateInput() {
    const entities = EntityManager.getInstance().getEntities();
    let dir = null;

    for (const entity of entities) {
      const networkId = entity.networkId;

      if (socket.id == networkId) {
        const cameraDirection = new THREE.Vector3();
        entity.controller.controls
          .getObject()
          .getWorldDirection(cameraDirection);
        cameraDirection.normalize();
        dir = cameraDirection;
      }
    }

    const pressedKeys = [];

    if (this.inputManager.isKeyPressed("KeyW")) pressedKeys.push("w");
    if (this.inputManager.isKeyPressed("KeyA")) pressedKeys.push("a");
    if (this.inputManager.isKeyPressed("KeyS")) pressedKeys.push("s");
    if (this.inputManager.isKeyPressed("KeyD")) pressedKeys.push("d");

    // Check for Shift key (sprint)
    const isSprinting = this.inputManager.isKeyPressed("ShiftLeft");

    if (pressedKeys.length > 0) {
      socket.emit("move", {
        keys: pressedKeys,
        dir: { x: dir?.x, y: dir?.y, z: dir?.z },
        sprint: isSprinting, // Add sprint data
      });
    } else {
      socket.emit("move", {
        keys: [],
        dir: { x: dir?.x, y: dir?.y, z: dir?.z },
        sprint: isSprinting,
      });
    }
  }

  update(elapsedTime: number, deltaTime: number) {
    this.updateInput();
    this.spawner?.update(elapsedTime, deltaTime);
    this.endlessTerrain?.update(elapsedTime, deltaTime);

    this.entityManager.update(elapsedTime, deltaTime);

    //this.physics.update(elapsedTime, deltaTime);

    this.ui.update();
  }
}
