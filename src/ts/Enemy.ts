import * as THREE from 'three'
import { loadFBX, loadGLB, randomBetween, randomFrom } from './Utils'
import { FBXLoader } from 'three/examples/jsm/Addons.js'
import PhysicsObject from '../interfaces/PhysicsObject'
import PhysicsManager from './PhysicsManager'
import EntityManager from './EntityManager'
import { listener } from './AudioManager'
import Wall from './Wall'
import Floor from './Floor'
import { FLOOR_DISTANCE } from './constants'
import Tree from './Tree'
import IKSystem from './IK/IKSystem'

const skinColors = [
    0xFFC6A8,
    0xd1a790,
    0xa17a65
];

export default class Enemy extends THREE.Object3D {

    private scene: THREE.Scene
    private mixer: THREE.AnimationMixer | any
    private physicsObject: PhysicsObject | any
    private velocity: THREE.Vector3 = new THREE.Vector3()
    private target: any

    private lastAttackTime: number = 0
    private canAttack: boolean = true

    private handBone: any
    private headBone: any

    private forearmRightBone: any
    private foreArmLeftBone: any

    private upperarm_left_bone: any
    private upperarm_right_bone: any
    
    private shoulder_left_bone: any
    private shoulder_right_bone: any

    

    private previewObject: any

    public health: number = 100

    private attackAnim: THREE.AnimationAction | any
    private deathAnim: THREE.AnimationAction | any
    private walkAnim: THREE.AnimationAction | any

    private footStepSound: any

    private lastStepTime: number = 0

    private ray: THREE.Raycaster = new THREE.Raycaster()

    private preview: any

    private sphere: THREE.Sphere

    private lastViewTime: number = 0

    public isDead: boolean = false;

    private ik: IKSystem 
  

    constructor(scene: THREE.Scene) {
        super()
        this.scene = scene
        this.sphere = new THREE.Sphere(new THREE.Vector3(), 0.4)
        this.ik = new IKSystem()
        this.init()
    }

    setTarget(target: any) {
        this.target = target
    }

    async init() {
        const fbxLoader = new FBXLoader();

        this.preview = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial)
        this.scene.add(this.preview)

        fbxLoader.load('chars/bot.fbx', async (model: any) => {

            //console.log(model, "zombieeeesadsad")

            //let bone = model.getObjectByName('Bone014_end')
            
            
            let clips = model.animations;

            let skin = model.children[0]

            skin.material = new THREE.MeshStandardMaterial({color: randomFrom(skinColors)})

            console.log(model, "MODELL")

            let skeleton = model.children[2].skeleton

            this.ik.build(skeleton.bones)
            
            // for (let i = 0; i < skeleton.bones.length; i++) {
            //     let mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({color: 0xff0000}))

            //     //skeleton.bones[i].getWorldPosition( mesh.position);
            //     mesh.position.copy(skeleton.bones[i].position)
            //     this.scene.add(mesh)
            // }

            model.traverse((child: any) => {
                child.userData.class = this
            })
            

            console.log("skin",skin)
        
            
            this.handBone = model.getObjectByName('mixamorigRightHand')
            this.headBone = model.getObjectByName('mixamorigHead')
            //console.log(this.headBone)

            this.foreArmLeftBone = model.getObjectByName('mixamorigLeftForeArm')
            this.forearmRightBone = model.getObjectByName('mixamorigRightForeArm')
            

            this.upperarm_left_bone = model.getObjectByName('mixamorigLeftArm')
            this.upperarm_right_bone = model.getObjectByName('mixamorigRightArm')

            this.shoulder_left_bone = model.getObjectByName('mixamorigLeftShoulder')
            this.shoulder_right_bone = model.getObjectByName('mixamorigRightShoulder')


            //console.log(this.headBone, "headbone")

            //console

            this.add(model)

            console.log(model, "ZOMBIAS")

            this.mixer = new THREE.AnimationMixer( model );

            let scale = 0.010
            model.scale.set(scale, scale, scale)
            model.position.y -= 1.3

            // clips.forEach( ( clip ) => {
            //     this.mixer.clipAction( clip ).play();
            // } ); 

       

            this.walkAnim = this.mixer.clipAction( clips[0] ) // .play();

            this.scene.add(this)

            const physics = PhysicsManager.getInstance()

            this.physicsObject = physics.createPlayerCapsule()


            // object in hand

            this.previewObject = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial())
            this.scene.add(this.previewObject)

            let attackClip = await this.getAnimation('animations/zombie_attack.fbx') as THREE.AnimationAction
            let deathClip = await this.getAnimation('animations/zombie_death.fbx') as THREE.AnimationAction

            

            this.attackAnim = this.mixer.clipAction(attackClip)
            this.deathAnim = this.mixer.clipAction(deathClip)

            this.deathAnim.clampWhenFinished = true
            this.deathAnim.loop = THREE.LoopOnce

            //this.attackAnim.clampWhenFinished = false
            //this.attackAnim.loop = THREE.LoopOnce

            PhysicsManager.getInstance().setTranslation(this.physicsObject, new THREE.Vector3(randomBetween(-50, 50), 50, randomBetween(-50, 50)))

            this.footStepSound = new THREE.PositionalAudio( listener );

            // load a sound and set it as the PositionalAudio object's buffer
            const audioLoader = new THREE.AudioLoader();
            audioLoader.load( 'audio/grass_step2.mp3', ( buffer ) => {
                this.footStepSound.setBuffer( buffer );
                this.footStepSound.setRefDistance( 2.5 );
                this.footStepSound.setVolume( 0.5 )
            });

            this.add(this.footStepSound)
            //this.footStepSound.position.set(0,0,0)

        });
    }

    async getAnimation(path: string) {
        const anim = await loadFBX(path) as any
        return anim.animations[0]
    }

    attackTarget(target: any) {
        target.damage(5)

        if(this.attackAnim) {
            this.attackAnim.play()
        }
    }
    

    updateMovement(elapsedTime: number, deltaTime: number) {

        if(this.health <= 0) {
            return
        }

        let {x, y, z} = this.physicsObject?.rigidBody.translation()

        this.position.set(x, y, z)
        
       // console.log(this.handBone)
        //.handBone.position.y += 0.0001



        let v=new THREE.Vector3()
        //.handBone.lookAt(this.handBone.worldToLocal(v.copy(this.target.position)));
        //this.handBone.updateMatrixWorld()

        return

        const physics = PhysicsManager.getInstance()

       
        const displacement = this.velocity.clone().multiplyScalar(deltaTime * 75)
        const linVel = this.physicsObject.rigidBody.linvel()
        displacement.y = linVel.y

        physics.setLinearVelocity(this.physicsObject?.rigidBody, displacement)
        
        let a = new THREE.Vector3(linVel.x, linVel.y, linVel.z)

        if(this.footStepSound && a.length() > 1) {
            if(elapsedTime - this.lastStepTime >= randomBetween(0.5, 0.7)) {
                this.lastStepTime = elapsedTime

                this.footStepSound.setDetune(randomBetween(-200, -500))

                if(this.footStepSound.isPlaying) {
                    this.footStepSound.stop()
                }
                this.footStepSound.play()
            }
        }

        this.velocity.set(0, 0, 0);

        if(this.target) {
            let dir = new THREE.Vector3()
            dir.subVectors(this.target.position, this.position)
            dir.y = 0
            dir.normalize()

            let distance = new THREE.Vector3(this.position.x, this.position.y, this.position.z).distanceTo(new THREE.Vector3(this.target.position.x, this.target.position.y, this.target.position.z))

            if(distance < 1.5 && this.canAttack) {
                this.lastAttackTime = elapsedTime
                this.canAttack = false
                this.attackTarget(this.target)
            }

            if(distance > 1.5 && this.attackAnim) {
                this.attackAnim.stop()
            }
            
            // if(distance > 1.5) {
            //     if(this.attackAnim && this.attackAnim.isRunning) {
            //         this.attackAnim.stop()
            //     } 
            // }

            // if(distance <= 2.5) {
            //     let t = new THREE.Object3D
            //     t.position.set(randomBetween(-50, 50), 0, randomBetween(-50, 50))
            //     this.setTarget(t)
            // }

            this.velocity.add(dir.multiplyScalar(deltaTime * 350))
            this.lookAt(new THREE.Vector3(this.target.position.x, this.position.y, this.target.position.z))
        }
    }

    damage(dmg: number) {
        this.health -= dmg
        console.log("damaging for", dmg)
        if(this.health <= 0) {
            //this.walkAnim.halt()
            //this.walkAnim.stop()
            //console.log(this.walkAnim)
            this.walkAnim.stop()
            this.attackAnim.stop()
            this.deathAnim.play()

            this.setTarget(null)

            this.isDead = true

            setTimeout(() => {
                EntityManager.getInstance().remove(this)
                this.scene.remove(this)
            }, 5000)
            //this.deathAnim.play()
        }
    }
    
    updateVision(elapsedTime: number, deltaTime: number) {
        let FORWARD = new THREE.Vector3(0,0,1)
        FORWARD.applyQuaternion(this.quaternion)

        let rayPos = this.position.clone().sub(new THREE.Vector3(0, 1.2, 0))

        this.ray.set(rayPos, FORWARD)

        let entities = EntityManager.getInstance().getEntities()
        const objectsToIntersect = entities.filter(object => object != this)
        const intersects = this.ray.intersectObjects(objectsToIntersect, true)

        if(intersects.length > 0) {
            let p = intersects[0].object

            let distance = this.position.distanceTo(intersects[0].point)

            if(p.userData.class) {

                if(distance <= 1.5 && p.userData.class instanceof Wall && this.canAttack) {
                    this.lastAttackTime = elapsedTime
                    this.canAttack = false
                    this.attackObstacle(p.userData.class)
                }
                else if (distance <= 1.5 && p.userData.class instanceof Tree) {
                    let evadeVector = new THREE.Vector3(1, 0, 0)
                    evadeVector.applyQuaternion(this.quaternion)
                    this.velocity.add(evadeVector.multiplyScalar(deltaTime * 500))
                }
                else if(distance <= 1.5 && p.userData.class instanceof Floor) {
                    this.velocity.set(0,0,0)
                    this.jump()
                }
            }
        }
    }

    isGrounded() {
        if(!this.physicsObject) {
            return false
        }

        let distance = PhysicsManager.getInstance().raycast(this.position, new THREE.Vector3(0, -1, 0), this.physicsObject.rigidBody)

        if(distance) {
            //console.log(distance)
           return distance <= FLOOR_DISTANCE
        }
        else {
            return false
        }
    }

    jump() {
        if (this.isGrounded()) {
            this.physicsObject?.rigidBody.applyImpulse(new THREE.Vector3(0, 0.5, 0), true)
        }
    }

    attackObstacle(obj: any) {
        //this.attackTarget(this.target)
        obj.damage(10)
    }

    solveIK(targetPosition: THREE.Vector3) {

        targetPosition = this.handBone.position
        // Define the bones
        var shoulderBone = this.shoulder_right_bone;
        var elbowBone = this.forearmRightBone;
    
        // Define parameters
        var maxIterations = 100;
        var threshold = 0.001;
    
        // Iterate to converge on solution
        for (var i = 0; i < maxIterations; i++) {
            // Calculate end-effector position
            var endEffectorPosition = elbowBone.getWorldPosition(new THREE.Vector3());
    
            // Check convergence
            if (endEffectorPosition.distanceTo(targetPosition) < threshold) {
                break;
            }
    
            // Calculate rotation to point towards target
            var direction = new THREE.Vector3().subVectors(targetPosition, endEffectorPosition).normalize();
            var rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
    
            // Apply rotation to shoulder bone
            shoulderBone.quaternion.multiply(rotation);
    
            // Update elbow bone position
            elbowBone.lookAt(targetPosition);
    
            // Update skeleton
            // (This depends on how your skeleton is set up)
            // example: scene.updateMatrixWorld(true);
        }
    }

    updateBones() {

        // function boneLookAt(bone: any, position: THREE.Vector3) {
        //         var target = new THREE.Vector3(
        //                 position.x - bone.matrixWorld.elements[12],
        //                 position.y - bone.matrixWorld.elements[13],
        //                 position.z - bone.matrixWorld.elements[14]
        //         ).normalize();
        //     var v = new THREE.Vector3(0,0,1);
        //         var q = new THREE.Quaternion().setFromUnitVectors( v, target );
        //         var tmp = -q.z;
        //         q.z = -q.y;
        //         q.y = tmp;
        //     bone.quaternion.copy(q);
        // }

        let boneTarget = new THREE.Vector3(
            this.target.position.x * 1000,
            this.target.position.y * 1000,
            this.target.position.z * 1000,
        )


        //boneLookAt(this.headBone, this.target.position)

        if(this.headBone) {
            this.headBone.lookAt(this.target.position)
        }

        

        if(this.upperarm_right_bone) {

            //var direction = new THREE.Vector3().copy(this.target.position).sub(this.forearmRightBone.position).normalize();

            // let target = new THREE.Vector3(
            //     this.target.position.x,
            //     this.target.position.z,
            //     this.target.position.y
            // )
            // target.applyQuaternion(this.headBone.quaternion)

            //this.headBone.lookAt(target)

            // Calculate the angles (yaw and pitch) to rotate the bone

            // var direction = new THREE.Vector3().subVectors(this.target.position, this.upperarm_right_bone.position).normalize();

            // // Create a rotation matrix to represent the rotation
            // var matrix = new THREE.Matrix4();
            // matrix.lookAt(this.upperarm_right_bone.position, this.target.position, new THREE.Vector3(0, 1, 0));

            // // Extract the quaternion rotation from the matrix
            // var quaternion = new THREE.Quaternion();
            // quaternion.setFromRotationMatrix(matrix);

            // // Apply the rotation to the arm bone
            // this.upperarm_right_bone.quaternion.copy(quaternion);

            //this.upperarm_right_bone.lookAt(this.target.position)

            //this.forearmRightBone.lookAt(this.target.position)
            //this.upperarm_right_bone.lookAt(this.forearmRightBone.position)
            this.solveIK(this.target.position)
        }
        

        // if(this.upperarm_right_bone) {
        //     this.upperarm_right_bone.lookAt(boneTarget)
        //     console.log(this.upperarm_right_bone.position, this.upperarm_right_bone.quaternion)
        // }
    }


    update(elapsedTime: number, deltaTime: number) {
        
        // if(!this.canAttack) {
        //     if (elapsedTime - this.lastAttackTime >= 1) {
        //         this.canAttack = true
        //     }
        // }
        
        if(!this.mixer || !this.physicsObject) {
            return
        }

        if(this.handBone) {
            //this.handBone.position.add(new THREE.Vector3(0,1,0))
            this.handBone.lookAt(this.target.position)
            this.handBone.getWorldPosition( this.previewObject.position );
        }


        if(elapsedTime - this.lastViewTime >= 0.75) {
            this.lastViewTime = elapsedTime
            this.updateVision(elapsedTime, deltaTime)   
        }


        this.ik.update()

        this.updateMovement(elapsedTime, deltaTime)
        
        //this.updateBones()

        
        this.mixer.update(deltaTime)

    }
}