import { randomBetween } from "../Utils"
import IKBone from "./IKBone"
import * as THREE from 'three'
import IK from "./v2/IK"
import IKChain from "./v2/IKChain"
import IKJoint from "./v2/IKJoint"
import IKBallConstraint from "./v2/IKBallConstraint"
import { setZForward } from "./v2/AxisUtils"

export default class IKSystem {

    private bones: IKBone[] = []

    private targetPreview: THREE.Object3D | null = null

    private scene: THREE.Scene

    private ik: IK | any

    constructor(scene: THREE.Scene) {
        this.scene = scene

        this.targetPreview = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true}))
        //this.targetPreview.position.set(0,1,0)
        this.scene.add(this.targetPreview)

    }

    build(bones: THREE.Bone[]) {
        
        // bones.forEach((bone: THREE.Bone) => {
        //     let ikBone = new IKBone(bone)
        //     this.add(ikBone)
        // })

        // start

        this.ik = new IK()
        const chain = new IKChain()

        const bones2 = [];

        console.log(bones)
        
        //setZForward(bones[0])

        for (let i = 0; i < bones.length; i++) {

            const constraints = [new IKBallConstraint(90)]
            
            const bone = bones[i]
            bone.position.y = i === 0 ? 0 : 0.25;

            // if (bones2[i - 1]) { 
            //     bones2[i - 1].add(bone); 
            // }

            bones2.push(bone);

            // The last IKJoint must be added with a `target` as an end effector.
            const target = i === bones.length - 1 ? this.targetPreview : null;
            chain.add(new IKJoint(bone, { constraints }), { target });
        }

        //var boneGroup = bones[0];
        //var ik = new IK.IK();
        //const chain = new IK.IKChain();
        //var currentBone = boneGroup
        // for (let i = 0; i < bones.length; i++) {
        //     var constraints = [new IKBallConstraint(90)];
        //     const target = i === bones.length - 1 ? THREE.Object3D : null;
        //     chain.add(new IKJoint(bones[i], { constraints }), { target });
        //     //currentBone = currentBone.children[0]
        //   }
          //this.ik.add(chain);

        //console.log(chain)
        this.ik.add(chain)
        //this.scene.add(this.ik.getRootBone())


    }

    add(bone: IKBone) {
        //let ik = new IK()
        //console.log(ik, 'threeik')
        this.bones.push(bone)
    }

    update3(targetPosition: THREE.Vector3, maxIterations: number = 10, tolerance: number = 0.1) {
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let endEffector = this.bones[this.bones.length - 1].bone;
            let endEffectorPosition = endEffector.getWorldPosition(new THREE.Vector3());
            // targetPosition = endEffectorPosition
            let distanceToTarget = endEffectorPosition.distanceTo(targetPosition);
            //console.log(distanceToTarget)

            if (distanceToTarget < tolerance) {
                break; // If end effector is close enough to the target, stop iterating
            }

            for (let i = this.bones.length - 2; i >= 0; i--) {
                let bone = this.bones[i].bone;
                if(!bone.parent) {
                    return
                }
                let boneDirection = new THREE.Vector3().subVectors(bone.getWorldPosition(new THREE.Vector3()), bone.parent.getWorldPosition(new THREE.Vector3())).normalize();
                let targetDirection = new THREE.Vector3().subVectors(targetPosition, bone.parent.getWorldPosition(new THREE.Vector3())).normalize();
                
                // Calculate the rotation angle
                let angle = boneDirection.angleTo(targetDirection);

                // Apply rotation
                bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().crossVectors(boneDirection, targetDirection).normalize(), angle));
            }
        }
    }

    update() {

        
        
        

        //console.log(this.ik.getRootBone().position)

        // const targetPos = new THREE.Vector3(0,1,2)
        // let t = this.bones[this.bones.length - 1].bone;
        // let x = new THREE.Vector3()
        // t.getWorldPosition(x)
        // let fin = x.clone().add(new THREE.Vector3(-0.1,0,-0.25))

        //this.targetPreview?.position.copy(fin)

        let lastBone = this.ik.chains[0].joints[this.ik.chains[0].joints.length - 1]

        //const targetPos = new THREE.Vector3(0,1,2)
        let t = lastBone.bone
        let x = new THREE.Vector3()
        t.getWorldPosition(x)
        let fin = x.clone().add(new THREE.Vector3(0,0,0.01))

        fin.y += Math.sin(0.1 * (performance.now() /100))

        this.targetPreview?.position.copy(fin)

        this.ik?.solve()
        
        for (let i = 0; i < this.bones.length; i++) {
            if(this.bones[i+1]) {
                this.bones[i].bone.lookAt(this.bones[i+1].bone.position)
            }
        }

        

        //console.log(this.ik)

        // fin.add(new THREE.Vector3(0,0,randomBetween(-0.01, 0.01)))

        // if(this.targetPreview == null) {
        //     console.log("yea")
        //     this.targetPreview = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({color: 0xff0000}))
        //     this.scene.add(this.targetPreview)
        //     this.targetPreview.position.copy(fin)
        // }
        // else {
        //     this.targetPreview.position.copy(fin)
        // }

        //this.update3(fin)

        // for (let i = this.bones.length - 1; i >= 0; i--) {
        //     const bone = this.bones[i].bone

        //     const targetDirection = new THREE.Vector3().subVectors(targetPos, bone.getWorldPosition(new THREE.Vector3()));

        //     if(i === this.bones.length - 1) {
        //         bone.lookAt(targetPos)
        //         bone.position.x += 0.01
        //     }
        //     else {
        //         const matrix = new THREE.Matrix4();
        //         matrix.lookAt(bone.position, targetPos, bone.parent.up);
        //         bone.setRotationFromMatrix(matrix);
        //     }
        // }
        // for (let i = 0; i < this.bones.length; i++) {
        //     if(this.bones[i+1]) {
        //         this.bones[i].bone.lookAt(this.bones[i+1].bone.position)
        //         //this.bones[i].bone.position.y +=
        //     }
        //     else {
        //         this.bones[i].bone.lookAt(this.bones[this.bones.length - 1].bone.position)
        //     }

        //     this.bones[this.bones.length - 1].bone.position.x -= 0.01
        //     // else {
        //     //     this.bones[i].bone.lookAt(new THREE.Vector3(0,1,0))
        //     // }
        //     //this.bones[i].update()
        // }
    }


}