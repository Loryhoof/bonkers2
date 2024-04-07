import * as THREE from 'three'
import { loadGLB } from './Utils'

export default class Barrel extends THREE.Object3D {
    
    private model: THREE.Group = new THREE.Group

    constructor() {
        super()
        this.init()
    }
    
    async init() {
        this.model = await loadGLB('models/barrel.glb') as any
        //this.add(this.model.scene)
    }
}