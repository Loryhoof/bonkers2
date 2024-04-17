import IKBone from "./IKBone"
import * as THREE from 'three'

export default class IKSystem {

    private bones: IKBone[] = []

    constructor() {

    }

    build(bones: THREE.Bone[]) {
        bones.forEach((bone: THREE.Bone) => {
            let ikBone = new IKBone(bone)
            this.add(ikBone)
        })
    }

    add(bone: IKBone) {
        this.bones.push(bone)
    }
    
    update() {
        for (let i = 0; i < this.bones.length; i++) {
            this.bones[i].update()
        }
    }


}