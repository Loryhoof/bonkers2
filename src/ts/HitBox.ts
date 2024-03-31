import * as THREE from 'three'

export default class HitBox {

    public readonly root: THREE.Object3D

    constructor(root: THREE.Object3D, scale: THREE.Vector3) {
      
    
        this.root = root

        const geometry = new THREE.BoxGeometry( scale.x, scale.y, scale.z );
        const material = new THREE.MeshBasicMaterial( { color: 0x00ff00, transparent: true, opacity: 0.5 } );
        const mesh = new THREE.Mesh( geometry, material );
        mesh.visible = true
        root.add( mesh );
    }
}