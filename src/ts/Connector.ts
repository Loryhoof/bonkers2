import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d';
import PhysicsManager from './PhysicsManager';
import ConnectorPosition from '../enums/ConnectorPosition';
import SelectedBuildType from '../enums/SelectedBuildType';
import { BUILDING_LAYER } from './constants';
import { getWorldPos } from './Utils';

export default class Connector extends THREE.Object3D {

    public shape = new RAPIER.Cuboid(1.0, 2.0, 3.0);
    public shapePos = new RAPIER.Vector3(0, 0, 0)
    public shapeRot = { w: 1.0, x: 0.0, y: 0.0, z: 0.0 };
    
    public connectorPosition: ConnectorPosition
    public connectorParentType: SelectedBuildType

    public isConnectedToFloor: boolean = false
    public isConnectedToWall: boolean = false
    public canConnectTo: boolean = true

    private canConnectToFloor: boolean = true
    private canConnectToWall: boolean = true

    private radius: number = 0.2
    private scene: THREE.Scene
    private preview: THREE.Mesh

    constructor(scene: THREE.Scene, conPos: ConnectorPosition, conParentType: SelectedBuildType) {
        super()

        this.scene = scene
        this.connectorPosition = conPos
        this.connectorParentType = conParentType

        const geom = new THREE.SphereGeometry(.5, 32, 16)
        const mat = new THREE.MeshBasicMaterial()
        const mesh = new THREE.Mesh(geom, mat)
        this.preview = mesh

        scene.add(this.preview)

        if(conParentType == SelectedBuildType.floor) {
            if(conPos == ConnectorPosition.left || conPos == ConnectorPosition.right) {
                this.rotation.y = Math.PI / 2
            }
        }

        //this.rotation.y = Math.PI / 2
    }

    updateConnectors(rootCall: boolean = false) {

        //let a = PhysicsManager.getInstance().intersectShape(this.position, this.shapeRot, this.shape, undefined)

        //console.log(a)
        //console.log(this)
        //console.log(this.userData.sphere.userData.class)
        if(!this.userData.sphere) {
            return
        }
        console.log(this.userData, "THISAA")
        let pos0 = this.userData.sphere.position.clone()
        let pos1 = this.userData.sphere.userData.class.position.clone()

        let pos2 = pos0.add(pos1)

        //this.preview.position.copy(pos2)

        const sphere = new THREE.Sphere(pos2, 0.3)
        //console.log(this.position)
        //sphere.intersectsSphere()

        let intersectedObjects = [] as any

        //console.log("UPDATING CONNECTORS")

        // Loop through all objects in the scene
        this.scene.traverse((object: any) => {
            // Check if the object has a geometry and bounding sphere
            if (object.geometry && object.geometry.boundingSphere && object.userData.layer == BUILDING_LAYER && object != this.userData.sphere ) {
                // Get the object's bounding sphere
                var objectSphere = object.geometry.boundingSphere.clone();
                objectSphere.applyMatrix4(object.matrixWorld);

                // Check if the object's bounding sphere intersects with the given sphere
                if (sphere.intersectsSphere(objectSphere)) {
                    intersectedObjects.push(object);
                }
            }
        });

        if(intersectedObjects.length > 0) {
            for (let i = 0; i < intersectedObjects.length; i++) {
                const foundConnector = intersectedObjects[i].userData.connector

                if(foundConnector.connectorParentType == SelectedBuildType.floor) {
                    this.isConnectedToFloor = true
                }

                if(foundConnector.connectorParentType == SelectedBuildType.wall) {
                    this.isConnectedToWall = true
                }

                if(rootCall) {
                    foundConnector.updateConnectors()
                }
            }
         }

        this.isConnectedToFloor = !this.canConnectToFloor
        this.isConnectedToWall = !this.canConnectToWall
    }

}