import * as THREE from 'three'
import PhysicsManager from './PhysicsManager'
import { sky } from './Sky'
import { groundMaterial } from './terrain/Ground'
import Player from './Player'
import Pistol from './Pistol'
import UIManager from './UIManager'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadGLB, randomBetween } from './Utils'
import Tree from './Tree'
import Forest from './Forest'
import EntityManager from './EntityManager'
// import RAPIER from '@dimforge/rapier3d'
import Ocean from './Ocean'
import { SimplexNoise } from 'three/examples/jsm/Addons.js'
// import Terrain from './Terrain'
import Enemy from './Enemy'
import { listener } from './AudioManager'
import { SpawnManager } from './SpawnManager'
import EndlessTerrain from './terrain/EndlessTerrain'
import MapGenerator from './terrain/MapGenerator'
import Car from './vehicle/Car'

const loader = new GLTFLoader()

export default class World {

    public readonly camera: THREE.PerspectiveCamera
    public readonly physics: PhysicsManager
    public readonly ui: UIManager
    public readonly scene: THREE.Scene
    public readonly entityManager: EntityManager
    
    private spawner: SpawnManager | any

    private endlessTerrain!: EndlessTerrain 
    private mapGenerator!: MapGenerator
    
    constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        this.camera = camera
        this.scene = scene
        this.physics = PhysicsManager.getInstance()
        this.entityManager = EntityManager.getInstance()
        this.ui = UIManager.getInstance()
        this.spawner = null
    }

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

        
        light.position.set(0, 4, 2)

        const ambientLight = new THREE.AmbientLight(0xffffff, 2)

        this.scene.add(ambientLight)
        this.scene.add(light)
        //this.scene.fog = new THREE.Fog( 0xcccccc, 10, 15 );
        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.005)
        //this.scene.add()
        //this.scene.add(cube)

        this.scene.add(sky)

        const planeGeo = new THREE.PlaneGeometry(1000, 1000)

        const ground = new THREE.Mesh(planeGeo, groundMaterial)
        ground.rotation.x -= Math.PI/2;
        ground.position.y = 0.5
        ground.visible = false

        //this.physics.createFixedBox(ground.position, new THREE.Vector3(1000, ground.position.y - 0.5, 1000))
        //this.scene.add(ground)

        this.camera.add(listener)

        let player = new Player(this.scene, this.camera)
        this.entityManager.add(player)
        this.scene.add(player)

        // car test

        //let car = new Car(this.scene)

        this.endlessTerrain = new EndlessTerrain(this.scene, player)

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

        //this.spawner = new SpawnManager(this.scene, player)
    }

    spawnTrees() {
        let forest = new Forest(250)
        this.scene.add(forest)
        this.entityManager.add(forest)
    }

    update(elapsedTime: number, deltaTime: number) {

        
        //this.spawner.update(elapsedTime, deltaTime)
        this.endlessTerrain?.update(elapsedTime, deltaTime)

        this.entityManager.update(elapsedTime, deltaTime)

        this.physics.update(elapsedTime, deltaTime)
        
        this.ui.update()
    }
}