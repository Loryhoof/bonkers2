import * as THREE from 'three'
import SelectedBuildType from "../enums/SelectedBuildType";
import Floor from "./Floor";
import Wall from './Wall';
import Connector from './Connector';
import PhysicsManager from './PhysicsManager';
import RAPIER from '@dimforge/rapier3d';
import ConnectorPosition from '../enums/ConnectorPosition';

const raycaster = new THREE.Raycaster()

const shape = new RAPIER.Cuboid(1.0, 2.0, 3.0);
const shapePos = new RAPIER.Vector3(0, 0, 0)
const shapeRot = { w: 1.0, x: 0.0, y: 0.0, z: 0.0 };

const previewMaterialValid = new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0.5})
const previewMaterialInvalid = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.5})

export default class BuildingManager {

    private floorObjects: Array<Floor> = []
    private wallObjects: Array<Wall> = []

    private currentBuildType: SelectedBuildType = SelectedBuildType.floor

    private connectorOverlapRadius: number = 1
    private maxGroundAngle: number = 45

    private isBuilding: boolean = true
    private currentBuildingIndex: number = -1

    private previewBuildObject: THREE.Group | any = null

    private isPreviewInValidPosition: boolean = false
    private modelParent: THREE.Group = new THREE.Group

    private camera: THREE.Camera
    private scene: THREE.Scene

    constructor(
        camera: THREE.Camera,
        scene: THREE.Scene
    ) {
        this.camera = camera
        this.scene = scene
       
    }

    update() {
        if(this.isBuilding) {
            this.previewBuild()
        }
        else if(this.previewBuildObject) {
            this.previewBuildObject = null
        }
    }

    build() {
        this.placeBuild()
    }

    private ghostifyModel(modelParent: THREE.Mesh, previewMaterial: THREE.Material) {
        if(previewMaterial != null) {
            modelParent.material = previewMaterial
        }
        else {
            // disable colliders
        }
    }

    private getConnectorClosestToPlayer(topBottom: boolean) {
        const cameraPosition = this.camera.position

        if(topBottom) {
            return cameraPosition.z >= this.previewBuildObject.position.z ? ConnectorPosition.bottom : ConnectorPosition.top
        }
        else {
            return cameraPosition.x >= this.previewBuildObject.position.x ? ConnectorPosition.left : ConnectorPosition.right
        }

    }

    private getOppositePosition(connector: Connector) {
        let position = connector.connectorPosition

        if(this.currentBuildType == SelectedBuildType.wall && connector.connectorParentType == SelectedBuildType.floor) {
            return ConnectorPosition.bottom
        }

        if(this.currentBuildType == SelectedBuildType.floor && connector.connectorParentType == SelectedBuildType.wall && connector.connectorPosition == ConnectorPosition.top) {
            if(connector.rotation.y == 0) {
                return this.getConnectorClosestToPlayer(true)
            }
            else {
                return this.getConnectorClosestToPlayer(false)
            }
        }

        switch(position) {
            case ConnectorPosition.left:
                return ConnectorPosition.right
            case ConnectorPosition.right:
                return ConnectorPosition.left
            case ConnectorPosition.top:
                return ConnectorPosition.bottom
            case ConnectorPosition.bottom:
                return ConnectorPosition.top
            default:
                return ConnectorPosition.bottom
        }
    }

    private findSnapConnector(snapConnector, previewConnectorParent) {
        // placeholder
        const oppositeConnectorTag = this.getOppositePosition(connector)

        for (let i = 0; i < previewConnectorParent.children.length; i++) {
            if(previewConnectorParent.children[i] instanceof Connector) {
                if(previewConnectorParent.children[i].connectorPosition == oppositeConnectorTag) {
                    return previewConnectorParent.children[i].position
                }
            }
        }

        return null
    }

    private snapPreviewPrefabToConnector(connector: Connector) {
        const previewConnector = this.findSnapConnector(connector, )
        this.previewBuildObject.position = connector.position.clone()
        .sub(previewConnector.position.sub(this.previewBuildObject.position))

        if(this.currentBuildType == SelectedBuildType.wall) {
            const newRotation = this.previewBuildObject.rotation
            const connectorRotation = connector.rotation
            newRotation.euler = new THREE.Vector3(newRotation.euler, connectorRotation.y, newRotation.euler.z)
            this.previewBuildObject.rotation = newRotation
        }

        this.ghostifyModel(this.modelParent, previewMaterialValid)
        this.isPreviewInValidPosition = true
    }

    private previewSeparateBuild() {
        raycaster.setFromCamera(new THREE.Vector2(), this.camera);

        //const objectsToIntersect = this.scene.children.filter(object => object !== this.previewBuildObject);
        const intersects = raycaster.intersectObjects(this.scene.children, true);

        if(intersects[0]) {

            if(this.currentBuildType == SelectedBuildType.wall) {
                this.isPreviewInValidPosition = false
                return
            }

            
        }

    }

    private previewConnectBuild(colliders: Array<any>) {

        let bestConnector = null

        for(let i = 0; i < colliders.length; i++) {
            if(colliders[i] instanceof Connector) {
                if(colliders[i].canConnectTo) {
                    bestConnector = colliders[i]
                    break
                }
            }
        }

        if(bestConnector == null || this.currentBuildType == SelectedBuildType.floor && bestConnector.isConnectedToFloor || 
           bestConnector == null || this.currentBuildType == SelectedBuildType.wall && bestConnector.isConnectedToWall) {
            this.ghostifyModel(this.modelParent, previewMaterialInvalid)
            this.isPreviewInValidPosition = false
            return
           }

        this.snapPreviewPrefabToConnector(bestConnector)
    }

    private checkBuildValidity() {

        let s = PhysicsManager.getInstance().intersectShape(this.previewBuildObject.position, shapeRot, shape, 0b0001)
        console.log(s)
        if(s) {
            //this.previewConnectBuild(colliders)
        } else {
            this.previewSeparateBuild()
        }

    }

    private movePreviewBuildToRaycast() {
        raycaster.setFromCamera(new THREE.Vector2(), this.camera);

        const objectsToIntersect = this.scene.children.filter(object => object !== this.previewBuildObject);
        const intersects = raycaster.intersectObjects(objectsToIntersect, true);

        if(intersects[0]) {

            const point = intersects[0].point;

            let obj = this.previewBuildObject
            obj.position.copy(point);
            obj.position.y = point.y + 1 / 2

            //this.objectPreview.visible = true
        }
    }

    private createPreviewPrefab(currentBuild: THREE.Group) {

        if(this.previewBuildObject == null) {
            //this.previewBuildObject = currentBuild.clone()
            ///this.currentBuildType = SelectedBuildType.floor
            this.previewBuildObject = new Floor()
            this.scene.add(this.previewBuildObject)
        }

    }

    private getCurrentBuild() {
        switch(this.currentBuildType) {
            case SelectedBuildType.floor:
                return new Floor()//this.floorObjects[this.currentBuildingIndex]
            case SelectedBuildType.wall:
                return this.wallObjects[this.currentBuildingIndex]
        }

        return null
    }

    private previewBuild() {
        //const currentBuild = this.getCurrentBuild()
        let currentBuild = null
        this.createPreviewPrefab(currentBuild)

        this.movePreviewBuildToRaycast()
        this.checkBuildValidity()
    }

    private placeBuild() {
        if(this.previewBuildObject && this.isPreviewInValidPosition) {
            let obj = this.getCurrentBuild()
            this.scene.add(obj)
            obj.position.copy(this.previewBuildObject.position)
            obj.quaternion.copy(this.previewBuildObject.quaternion)

            //this.scene.remove(this.previewBuildObject)
            //this.previewBuildObject = null

            this.isBuilding = false

            obj.children.forEach((child) => {
                if(child instanceof Connector) {
                    child.updateConnectors(true)
                }
            })
        }
    }
}