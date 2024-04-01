import * as THREE from "three"
import Connector from "./Connector"
import ConnectorPosition from "../enums/ConnectorPosition"
import SelectedBuildType from "../enums/SelectedBuildType"
import { BUILDING_LAYER } from "./constants"
import PhysicsManager from "./PhysicsManager"
import PhysicsObject from "../interfaces/PhysicsObject"

let TOP = new THREE.Vector3(0, 0, -1.5)
let BOTTOM = new THREE.Vector3(0, 0, 1.5)
let LEFT = new THREE.Vector3(0, 1.5, 0)
let RIGHT = new THREE.Vector3(0, -1.5, 0)

const scale = new THREE.Vector3(0.5, 3, 3)

let positions = [
    LEFT,
    RIGHT,
    TOP,
    BOTTOM
]

// const rotationMatrix = new THREE.Matrix4().makeRotationX(Math.PI / 2);

// // Rotate the vectors
// LEFT = LEFT.clone().applyMatrix4(rotationMatrix).multiply(scale);
// RIGHT = RIGHT.clone().applyMatrix4(rotationMatrix).multiply(scale);
// TOP = TOP.clone().applyMatrix4(rotationMatrix).multiply(scale);
// BOTTOM = BOTTOM.clone().applyMatrix4(rotationMatrix).multiply(scale);

// console.log("Rotated LEFT:", rotatedLEFT);
// console.log("Rotated RIGHT:", rotatedRIGHT);
// console.log("Rotated TOP:", rotatedTOP);
// console.log("Rotated BOTTOM:", rotatedBOTTOM);


export default class Wall extends THREE.Object3D {

    public connectors: Array<Connector> = new Array().fill(4)
    private floorObject: THREE.Object3D = new THREE.Object3D
    private physicsObject: PhysicsObject | any = null
    public height: number = scale.y / 2

    constructor(scene: THREE.Scene) {
        super()

        this.connectors[0] = new Connector(scene, ConnectorPosition.top, SelectedBuildType.wall)
        this.connectors[1] = new Connector(scene, ConnectorPosition.bottom, SelectedBuildType.wall)
        this.connectors[2] = new Connector(scene, ConnectorPosition.left, SelectedBuildType.wall)
        this.connectors[3] = new Connector(scene, ConnectorPosition.right, SelectedBuildType.wall)


        this.init()
    }

    cook() {
        this.physicsObject = PhysicsManager.getInstance().createFixedBox(this.position, new THREE.Vector3(scale.x / 2, scale.y / 2, scale.z / 2))
    }

    init() {

        const geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
        const material = new THREE.MeshStandardMaterial({ color: 0xeb8436, transparent: true, opacity: 1 });
        
        const model = new THREE.Mesh(geometry, material);

        this.add(model)

        this.connectors.forEach((connector, index) => {
            let pos = new THREE.Vector3()
            let radius = 0.2

            const geometry = new THREE.SphereGeometry( .4, 32, 16 ); 
            const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
            const sphere = new THREE.Mesh( geometry, material );

            //let offset = new THREE.Vector3(1.5, 0, 0)
            sphere.position.copy(this.position).add(positions[index])

            // if(index == 2 || index == 3) {
            //     sphere.rotation.y = (Math.PI / 2)
            // }  

            const worldPosition = sphere.position.clone().applyMatrix4(model.matrixWorld);
            connector.position.copy(worldPosition)

            sphere.userData.layer = BUILDING_LAYER;
            sphere.userData.connector = connector
            sphere.userData.class = this
            sphere.visible = true
            
            model.add(sphere)
            connector.userData.sphere = sphere
            this.floorObject = model
            this.floorObject.userData.class = this
        })
    }

    update() {

        if(!this.physicsObject) {
            return
        }  

        //console.log(this.position)

        //this.physicsObject.rigidBody.setTranslation(new THREE.Vector3().copy(this.position), true)

        //console.log(this.floorObject, "floor obj")

        //this.floorObject.userData.class

        // for(let i = 0; i < this.connectors.length; i++) {
        //     //const worldPosition = this.connectors[i].userData.sphere.position.clone().applyMatrix4(this.floorObject.matrixWorld);
        //     //connector.position.copy(worldPosition)
        //     //this.connectors[i].position.copy(worldPosition)
        // }

    }
}