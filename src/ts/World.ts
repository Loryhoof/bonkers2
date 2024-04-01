import * as THREE from 'three'
import PhysicsManager from './PhysicsManager'
import { sky } from './Sky'
import { groundMaterial } from './Ground'
import Player from './Player'
import Pistol from './Pistol'
import UIManager from './UIManager'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { randomBetween } from './Utils'
import Tree from './Tree'
import Forest from './Forest'
import EntityManager from './EntityManager'

const loader = new GLTFLoader()

export default class World {

    public readonly camera: THREE.PerspectiveCamera
    public readonly physics: PhysicsManager
    public readonly ui: UIManager
    public readonly scene: THREE.Scene
    public readonly entityManager: EntityManager

    private static instance: World

    constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        this.camera = camera
        this.scene = scene
        this.physics = PhysicsManager.getInstance()
        this.entityManager = EntityManager.getInstance()
        this.ui = UIManager.getInstance()
    }

    async initialize() {

        const geometry = new THREE.BoxGeometry(3, 3, 3)
        const material = new THREE.MeshStandardMaterial({color: 0xff0000})

        let cube = new THREE.Mesh(geometry, material)
        cube.position.z = -15
        cube.position.y = 1

        this.physics.createFixedBox(cube.position, new THREE.Vector3(1.5,1.5,1.5))

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
        this.scene.add(cube)

        this.scene.add(sky)

        const planeGeo = new THREE.PlaneGeometry(1000, 1000)

        const ground = new THREE.Mesh(planeGeo, groundMaterial)
        ground.rotation.x -= Math.PI/2;
        ground.position.y = 0.5

        this.physics.createFixedBox(ground.position, new THREE.Vector3(1000, ground.position.y - 0.5, 1000))

        this.scene.add(ground)

        let player = new Player(this.scene, this.camera)
        this.entityManager.add(player)
        this.scene.add(player)



        //console.log(player)
        //console.log(this.physics)
        
        //let gun = new Pistol(15, this.camera, this.scene)
        //this.entities.push(gun)
        this.spawnTrees()
    }

    spawnTrees() {
        let forest = new Forest(250)
        this.scene.add(forest)
        this.entityManager.add(forest)
    }

    update(elapsedTime: number, deltaTime: number) {

        this.entityManager.update(elapsedTime, deltaTime)

        this.physics.update(elapsedTime, deltaTime)
        
        this.ui.update()
    }
}