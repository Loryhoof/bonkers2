import * as THREE from 'three'

export default class IKBone {

    public bone: THREE.Bone

    constructor(bone: THREE.Bone) {
        this.bone = bone
    }

    update() {

        if(!this.bone) {
            return
        }

        //this.bone.position.add(new THREE.Vector3(0,0.01,0));
        //this.bone.rotation.x += 0.01
        ///this.bone.rotation.z += 0.01
        //this.bone.position.y -= 0.01

        //this.bone.lookAt(new THREE.Vector3(0,-1,0))
    }
}