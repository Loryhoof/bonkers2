import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d';
import PhysicsManager from './PhysicsManager';
import ConnectorPosition from '../enums/ConnectorPosition';
import SelectedBuildType from '../enums/SelectedBuildType';

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

    constructor(conPos: ConnectorPosition, conParentType: SelectedBuildType) {
        super()

        this.connectorPosition = conPos
        this.connectorParentType = conParentType

    }

    updateConnectors(rootCall: boolean = false) {

        let a = PhysicsManager.getInstance().intersectShape(this.position, this.shapeRot, this.shape)

        console.log(a)

        this.isConnectedToFloor = !this.canConnectToFloor
        this.isConnectedToWall = !this.canConnectToWall

        if(rootCall) {

        }
    }

}