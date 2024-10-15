// RemotePlayer.ts

import * as THREE from "three";
import PlayerInventory from "./PlayerInventory";
import UsableItem from "../interfaces/UsableItem";
import { CCDIKSolver } from "three/examples/jsm/animation/CCDIKSolver.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { loadFBX, loadGLB } from "./Utils";
import Pistol from "./weapons/Pistol";

export default class RemotePlayer extends THREE.Object3D {
  private model: THREE.Mesh | null = null;
  private health: number = 100;
  private hunger: number = 100;

  public readonly inventory: PlayerInventory;
  public selectedItem: UsableItem | null = null;
  public selectedSlot: number = -1;
  public readonly hotBar: Array<any> = Array(6).fill(null);

  private mixer: THREE.AnimationMixer | null = null;
  private walkAnim: THREE.AnimationAction | null = null;
  private idleAnim: THREE.AnimationAction | null = null;
  private runningAnim: THREE.AnimationAction | null = null;
  private currentAnim: THREE.AnimationAction | null = null;

  private walkAnimIK: THREE.AnimationAction | null = null;
  private idleAnimIK: THREE.AnimationAction | null = null;
  private runningAnimIK: THREE.AnimationAction | null = null;

  private ikSolverRightArm: CCDIKSolver | null = null;
  private ikSolverLeftArm: CCDIKSolver | null = null;
  private demoObjectRight: THREE.Object3D | null = null;
  private demoObjectLeft: THREE.Object3D | null = null;
  private playerModel: THREE.Object3D | null = null;
  private targetBoneRight: THREE.Bone | null = null;
  private targetBoneLeft: THREE.Bone | null = null;
  private skeleton: THREE.Skeleton | null = null;

  private rightHandBone: THREE.Bone | null = null;
  private rightForeArmBone: THREE.Bone | null = null;
  private rightUpperArmBone: THREE.Bone | null = null;

  private leftHandBone: THREE.Bone | null = null;
  private leftForeArmBone: THREE.Bone | null = null;
  private leftUpperArmBone: THREE.Bone | null = null;

  private leftTargetBone: THREE.Bone | null = null;
  private rightTargetBone: THREE.Bone | null = null;

  private animationVelocity: THREE.Vector3 = new THREE.Vector3();

  public networkId: string;

  // IK mode toggle
  public ikEnabled: boolean = true;

  private equipedItem: THREE.Object3D | any;

  constructor(networkId: string) {
    super();
    this.networkId = networkId;
    this.inventory = new PlayerInventory(this.hotBar);
    this.init();
  }

  async getAnimation(path: string): Promise<THREE.AnimationClip> {
    const anim = await loadFBX(path);
    return anim.animations[0];
  }

  private async init() {
    let obj = (await loadGLB("models/gunReal.glb")) as any;
    this.equipedItem = obj.scene;

    this.equipedItem.scale.set(0.4, 0.4, 0.4);
    this.equipedItem.rotateZ(-Math.PI);
    this.equipedItem.rotateX(-Math.PI / 2);

    //console.log(obj)
    // this.model = obj.scene
    // this.model_slide = obj.scene.getObjectByName('Slide')

    // //console.log(this.model_slide)

    // if(this.model) {
    //     this.scene.add(this.model)
    //     //this.scene.add(this)
    // }
    // this.model.visible = false

    // Create the demo objects (targets for the hands to reach)
    this.demoObjectRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    this.add(this.demoObjectRight);
    this.demoObjectRight.position.set(-0.2, 0.1, 0.4);

    this.demoObjectLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    this.add(this.demoObjectLeft);
    this.demoObjectLeft.visible = false;
    this.demoObjectRight.visible = false;
    this.demoObjectLeft.position.set(0, 0.1, 0.9);

    // Load the character model
    const fbxLoader = new FBXLoader();
    fbxLoader.load("chars/bot2.fbx", async (model: any) => {
      model.scale.set(0.01, 0.01, 0.01);
      model.position.y -= 1.3;

      this.add(model);
      this.playerModel = model;
      this.mixer = new THREE.AnimationMixer(model);

      // Load original animations (with full bone animations)
      const walkClip = await this.getAnimation("animations/player_walk.fbx");
      const idleClip = await this.getAnimation("animations/player_idle.fbx");
      const runClip = await this.getAnimation("animations/player_run.fbx");

      // Create copies of the animations for IK mode
      const walkClipIK = walkClip.clone();
      const idleClipIK = idleClip.clone();
      const runClipIK = runClip.clone();

      // Adjust the IK animations to neutralize IK bones
      this.adjustIKBoneTracks(walkClipIK);
      this.adjustIKBoneTracks(idleClipIK);
      this.adjustIKBoneTracks(runClipIK);

      // Create animation actions
      this.walkAnim = this.mixer.clipAction(walkClip);
      this.idleAnim = this.mixer.clipAction(idleClip);
      this.runningAnim = this.mixer.clipAction(runClip);

      this.walkAnimIK = this.mixer.clipAction(walkClipIK);
      this.idleAnimIK = this.mixer.clipAction(idleClipIK);
      this.runningAnimIK = this.mixer.clipAction(runClipIK);

      // Set loop modes
      [
        this.walkAnim,
        this.idleAnim,
        this.runningAnim,
        this.walkAnimIK,
        this.idleAnimIK,
        this.runningAnimIK,
      ].forEach((anim) => {
        anim.loop = THREE.LoopRepeat;
      });

      // Start with idle animation
      this.playAnimation(this.idleAnim, this.idleAnimIK);

      // Get the skinned mesh and skeleton
      let skinnedMesh: THREE.SkinnedMesh | null = null;

      model.traverse((child) => {
        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
          skinnedMesh = child as THREE.SkinnedMesh;
          this.skeleton = skinnedMesh.skeleton;
        }
      });

      if (!this.skeleton || !skinnedMesh) {
        console.error("No skeleton found in the model.");
        return;
      }

      const bones = this.skeleton.bones;

      // Right arm bones
      this.rightHandBone = model.getObjectByName(
        "mixamorigRightHand"
      ) as THREE.Bone;
      this.rightForeArmBone = model.getObjectByName(
        "mixamorigRightForeArm"
      ) as THREE.Bone;
      this.rightUpperArmBone = model.getObjectByName(
        "mixamorigRightArm"
      ) as THREE.Bone;

      // Left arm bones
      this.leftHandBone = model.getObjectByName(
        "mixamorigLeftHand"
      ) as THREE.Bone;
      this.leftForeArmBone = model.getObjectByName(
        "mixamorigLeftForeArm"
      ) as THREE.Bone;
      this.leftUpperArmBone = model.getObjectByName(
        "mixamorigLeftArm"
      ) as THREE.Bone;

      this.leftTargetBone = model.getObjectByName(
        "IK_TARGET_LEFT_HAND"
      ) as THREE.Bone;

      this.rightTargetBone = model.getObjectByName(
        "IK_TARGET_RIGHT_HAND"
      ) as THREE.Bone;

      console.log(
        this.leftTargetBone,
        this.rightTargetBone,
        "LEFT RIGHT TARGET BONES"
      );

      this.rightHandBone.add(this.equipedItem);
      this.equipedItem.position.set(0, 0, 0);
      this.equipedItem.scale.set(35, 35, 35);
      console.log(this.equipedItem.position);

      // Right arm bone indices
      const rightHandIndex = bones.indexOf(this.rightHandBone);
      const rightForeArmIndex = bones.indexOf(this.rightForeArmBone);
      const rightUpperArmIndex = bones.indexOf(this.rightUpperArmBone);

      // Left arm bone indices
      const leftHandIndex = bones.indexOf(this.leftHandBone);
      const leftForeArmIndex = bones.indexOf(this.leftForeArmBone);
      const leftUpperArmIndex = bones.indexOf(this.leftUpperArmBone);

      const leftTargetBoneIndex = bones.indexOf(this.leftTargetBone);
      const rightTargetBoneIndex = bones.indexOf(this.rightTargetBone);

      const worldPos = new THREE.Vector3();

      // // Create the target bones
      // this.targetBoneRight = new THREE.Bone();
      // this.targetBoneRight.name = "IK_Target_Bone_Right";

      // this.targetBoneLeft = new THREE.Bone();
      // this.targetBoneLeft.name = "IK_Target_Bone_Left";

      // // Position the target bones at the hands' positions
      // const rightHandWorldPos = new THREE.Vector3();
      // this.rightHandBone.getWorldPosition(rightHandWorldPos);
      // this.playerModel.worldToLocal(rightHandWorldPos);
      // this.targetBoneRight.position.copy(rightHandWorldPos);

      // const leftHandWorldPos = new THREE.Vector3();
      // this.leftHandBone.getWorldPosition(leftHandWorldPos);
      // this.playerModel.worldToLocal(leftHandWorldPos);
      // this.targetBoneLeft.position.copy(leftHandWorldPos);

      // Add the target bones to the skeleton and the model
      //bones.push(this.targetBoneRight);
      //bones.push(this.targetBoneLeft);
      //this.playerModel.add(this.targetBoneRight);
      //this.playerModel.add(this.targetBoneLeft);

      // Recompute skeleton bone inverses
      //this.skeleton.calculateInverses();

      //const targetBoneRightIndex = bones.indexOf(this.targetBoneRight);
      //const targetBoneLeftIndex = bones.indexOf(this.targetBoneLeft);

      // IK chain for the right arm
      if (
        rightHandIndex !== -1 &&
        rightForeArmIndex !== -1 &&
        rightUpperArmIndex !== -1 &&
        rightTargetBoneIndex !== -1
      ) {
        const iksRight = [
          {
            target: rightTargetBoneIndex,
            effector: rightHandIndex,
            links: [
              {
                index: rightForeArmIndex,
                rotationMin: new THREE.Vector3(
                  THREE.MathUtils.degToRad(-90),
                  THREE.MathUtils.degToRad(-90),
                  THREE.MathUtils.degToRad(-90)
                ),
                rotationMax: new THREE.Vector3(
                  THREE.MathUtils.degToRad(90),
                  THREE.MathUtils.degToRad(90),
                  THREE.MathUtils.degToRad(90)
                ),
              },
              {
                index: rightUpperArmIndex,
                rotationMin: new THREE.Vector3(
                  THREE.MathUtils.degToRad(-45),
                  THREE.MathUtils.degToRad(-45),
                  THREE.MathUtils.degToRad(-45)
                ),
                rotationMax: new THREE.Vector3(
                  THREE.MathUtils.degToRad(45),
                  THREE.MathUtils.degToRad(45),
                  THREE.MathUtils.degToRad(45)
                ),
              },
            ],
            iteration: 10,
          },
        ];

        // Create the IK solver for the right arm
        this.ikSolverRightArm = new CCDIKSolver(skinnedMesh, iksRight);
      } else {
        console.error(
          "Could not find the correct bone indices for the right arm!"
        );
      }

      // IK chain for the left arm
      if (
        leftHandIndex !== -1 &&
        leftForeArmIndex !== -1 &&
        leftUpperArmIndex !== -1 &&
        leftTargetBoneIndex !== -1
      ) {
        const iksLeft = [
          {
            target: leftTargetBoneIndex,
            effector: leftHandIndex,
            links: [
              {
                index: leftForeArmIndex,
                rotationMin: new THREE.Vector3(
                  THREE.MathUtils.degToRad(-90),
                  THREE.MathUtils.degToRad(-90),
                  THREE.MathUtils.degToRad(-90)
                ),
                rotationMax: new THREE.Vector3(
                  THREE.MathUtils.degToRad(90),
                  THREE.MathUtils.degToRad(90),
                  THREE.MathUtils.degToRad(90)
                ),
              },
              {
                index: leftUpperArmIndex,
                rotationMin: new THREE.Vector3(
                  THREE.MathUtils.degToRad(-45),
                  THREE.MathUtils.degToRad(-45),
                  THREE.MathUtils.degToRad(-45)
                ),
                rotationMax: new THREE.Vector3(
                  THREE.MathUtils.degToRad(45),
                  THREE.MathUtils.degToRad(45),
                  THREE.MathUtils.degToRad(45)
                ),
              },
            ],
            iteration: 10,
          },
        ];

        // Create the IK solver for the left arm
        this.ikSolverLeftArm = new CCDIKSolver(skinnedMesh, iksLeft);
      } else {
        console.error(
          "Could not find the correct bone indices for the left arm!"
        );
      }
    });

    // Set userData for picking or other interactions
    this.traverse((child) => {
      child.userData.class = this;
    });
  }

  // Method to adjust IK bone tracks in animation clips
  private adjustIKBoneTracks(clip: THREE.AnimationClip) {
    clip.tracks = clip.tracks.filter(
      (track) =>
        !track.name.includes("mixamorigRightHand") &&
        !track.name.includes("mixamorigRightForeArm") &&
        !track.name.includes("mixamorigRightArm") &&
        !track.name.includes("mixamorigLeftHand") &&
        !track.name.includes("mixamorigLeftForeArm") &&
        !track.name.includes("mixamorigLeftArm")
    );
  }

  // Method to toggle IK mode
  public setIKEnabled(enabled: boolean) {
    this.ikEnabled = enabled;

    // Switch animations based on IK mode
    if (this.ikEnabled) {
      // Play IK animations
      this.playAnimation(this.currentAnimIK);
    } else {
      // Play original animations
      this.playAnimation(this.currentAnim);
    }
  }

  private playAnimation(
    newAnim: THREE.AnimationAction | null,
    fadeDuration: number = 0.25
  ) {
    if (this.currentAnim === newAnim) {
      return;
    }

    if (this.currentAnim) {
      this.currentAnim.fadeOut(fadeDuration);
    }

    if (newAnim) {
      newAnim.reset().fadeIn(fadeDuration).play();
      this.currentAnim = newAnim;
    }
  }

  damage(dmg: number) {
    this.health -= dmg;
  }

  setAnimationVelocity(vector: THREE.Vector3) {
    this.animationVelocity.copy(vector);
  }

  updateAnimation(elapsedTime: number, deltaTime: number) {
    if (
      !this.mixer ||
      !this.walkAnim ||
      !this.idleAnim ||
      !this.runningAnim ||
      !this.walkAnimIK ||
      !this.idleAnimIK ||
      !this.runningAnimIK
    ) {
      return;
    }

    // Determine which animation to play based on movement
    let newAnim: THREE.AnimationAction | null = null;

    if (Math.ceil(this.animationVelocity.length()) >= 10) {
      newAnim = this.ikEnabled ? this.runningAnimIK : this.runningAnim;
    } else if (Math.ceil(this.animationVelocity.length()) > 0) {
      newAnim = this.ikEnabled ? this.walkAnimIK : this.walkAnim;
    } else {
      newAnim = this.ikEnabled ? this.idleAnimIK : this.idleAnim;
    }

    this.playAnimation(newAnim);

    // Update the mixer
    this.mixer.update(deltaTime);
  }

  updateEquipedPosition() {
    // if (this.equipedItem && this.rightTargetBone) {
    //   var worldPosition = new THREE.Vector3();
    //   this.rightTargetBone.getWorldPosition(worldPosition);
    //   this.equipedItem.position.copy(worldPosition);
    //   this.equipedItem.updateMatrixWorld();
    //   console.log(worldPosition);
    // }
  }

  update(elapsedTime: number, deltaTime: number) {
    this.updateEquipedPosition();
    // Update the demo objects' positions (you can adjust this as needed)
    // if (this.demoObjectRight) {
    //   this.demoObjectRight.position.x += 0.001;
    // }
    // if (this.demoObjectLeft) {
    //   this.demoObjectLeft.position.x -= 0.001;
    // }

    // Update animations before IK solver
    this.updateAnimation(elapsedTime, deltaTime);

    // Update the target bones' positions to match the demo objects
    if (this.ikEnabled) {
      if (this.rightTargetBone && this.demoObjectRight && this.playerModel) {
        const targetPositionWorld = new THREE.Vector3();
        this.demoObjectRight.getWorldPosition(targetPositionWorld);

        const parent = this.rightTargetBone.parent;
        if (parent) {
          const targetPositionLocal = parent.worldToLocal(
            targetPositionWorld.clone()
          );

          this.rightTargetBone.position.copy(targetPositionLocal);
        }
      }

      if (this.leftTargetBone && this.demoObjectLeft && this.playerModel) {
        const targetPositionWorld = new THREE.Vector3();
        this.demoObjectLeft.getWorldPosition(targetPositionWorld);

        const parent = this.leftTargetBone.parent;
        if (parent) {
          const targetPositionLocal = parent.worldToLocal(
            targetPositionWorld.clone()
          );

          this.leftTargetBone.position.copy(targetPositionLocal);
        }
      }
    }

    // Update matrices before IK solving
    if (this.playerModel) {
      this.playerModel.updateMatrixWorld(true);
    }

    if (this.ikEnabled) {
      if (this.targetBoneRight) {
        this.targetBoneRight.updateMatrixWorld(true);
      }

      if (this.targetBoneLeft) {
        this.targetBoneLeft.updateMatrixWorld(true);
      }

      // Update the IK solvers
      if (this.ikSolverRightArm) {
        this.ikSolverRightArm.update();
      }
      if (this.ikSolverLeftArm) {
        this.ikSolverLeftArm.update();
      }
    }

    // Additional updates (health checks, inventory, etc.)
    if (this.health <= 0) {
      this.health = 100;
      // Handle player respawn or death logic here
    }

    // Update inventory or other systems if necessary
    // this.inventory.update();
  }

  // Additional methods (e.g., input handling, inventory management) can be added here
}
