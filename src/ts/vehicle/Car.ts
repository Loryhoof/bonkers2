import * as THREE from "three";

import Vehicle from "./Vehicle";
import Player from "../Player";
import EntityManager from "../EntityManager";
import PhysicsObject from "../../interfaces/PhysicsObject";
import PhysicsManager from "../PhysicsManager";

const wheelPositions = [
  new THREE.Vector3(1, 0, 1),
  new THREE.Vector3(1, 0, -1),
  new THREE.Vector3(-1, 0, 1),
  new THREE.Vector3(-1, 0, -1),
];

const UP = new THREE.Vector3(0, -1, 0);

export default class Car implements Vehicle {
  public controllingPlayer?: Player;
  public position: THREE.Vector3;

  private scene: THREE.Scene;

  private vehicleModel: THREE.Object3D = new THREE.Object3D();
  private wheels: THREE.Object3D[];

  private physicsObject?: PhysicsObject;

  // physics constants

  private springStiffness: number = 30000;

  private restLength: number = 0.5;
  private springTravel: number = 0.2;

  private minLength: number = 0;
  private maxLength: number = 0;

  private springLength: number = 1;
  private wheelRadius: number = 0.33;

  private lastLength: number = 0;
  private damperStiffness: number = 4000;
  private damperForce: number = 0;
  private springVelocity: number = 0;
  //

  private springForce: number = 0;
  private suspensionForce: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.position = new THREE.Vector3(0, 0, 0);

    this.wheels = [];

    console.log(this.wheels);

    this.init();
  }

  init() {
    let scale = new THREE.Vector3(2, 0.5, 4.5);
    let vehicleGeom = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
    let vehicleMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.vehicleModel = new THREE.Mesh(vehicleGeom, vehicleMat);

    this.scene.add(this.vehicleModel);
    this.vehicleModel.position.set(0, 5, 0);

    const rbDesc = (window as any).RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(
        this.vehicleModel.position.x,
        this.vehicleModel.position.y,
        this.vehicleModel.position.z
      )
      .setAdditionalMass(1000)
      .setLinearDamping(0.5);

    const rigidBody =
      PhysicsManager.getInstance().physicsWorld.createRigidBody(rbDesc);

    const colDesc = (window as any).RAPIER.ColliderDesc.cuboid(
      scale.x / 2,
      scale.y / 2,
      scale.z / 2
    );
    const collider = PhysicsManager.getInstance().physicsWorld.createCollider(
      colDesc,
      rigidBody
    );

    this.physicsObject = { rigidBody, collider };

    EntityManager.getInstance().add(this);

    for (let i = 0; i < wheelPositions.length; i++) {
      let scale = new THREE.Vector3(0.15, 0.15, 0.15);
      let wheelGeom = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
      let wheelMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      this.wheels[i] = new THREE.Mesh(wheelGeom, wheelMat);
      this.wheels[i].position
        .copy(this.vehicleModel.position)
        .add(wheelPositions[i]);
      this.scene.add(this.wheels[i]);
    }

    this.minLength = this.restLength - this.springTravel;
    this.maxLength = this.restLength + this.springLength;
  }

  use(player: Player) {
    this.controllingPlayer = player;
  }

  updateWheels(elapsedTime: number, deltaTime: number) {
    if (!this.physicsObject) {
      return;
    }

    //this.physicsObject.rigidBody.resetForces(true)

    for (let i = 0; i < this.wheels.length; i++) {
      let wheelPos = this.vehicleModel.position
        .clone()
        .add(this.wheels[i].position);

      //

      let { ray, hit } = PhysicsManager.getInstance().raycastFull(
        wheelPos,
        new THREE.Vector3(0, -1, 0),
        this.physicsObject.rigidBody
      );

      if (hit !== null) {
        let hitPoint = ray.pointAt(hit.timeOfImpact);
        let distance = this.vehicleModel.position.distanceTo(hitPoint);

        if (distance <= this.maxLength + this.wheelRadius) {
          this.lastLength = this.springLength;
          this.springLength = distance - this.wheelRadius;
          this.springVelocity =
            (this.lastLength - this.springLength) / deltaTime / 1000;

          this.springLength = THREE.MathUtils.clamp(
            this.springLength,
            this.minLength,
            this.maxLength
          );
          this.damperForce = this.damperStiffness * this.springVelocity;

          this.springForce =
            this.springStiffness * (this.restLength - this.springLength);
          let lala = this.springForce + this.damperForce;
          this.suspensionForce = UP.clone()
            .applyQuaternion(this.vehicleModel.quaternion)
            .multiplyScalar(lala);
          //console.log(lala)
          this.physicsObject.rigidBody.addForceAtPoint(
            this.suspensionForce,
            hitPoint,
            true
          ); // { x: 0.0, y: 1000.0, z: 0.0 }, { x: 1.0, y: 2.0, z: 3.0 }
          this.physicsObject.rigidBody.resetForces(true);
        }

        this.wheels[i].position.y = hitPoint.y;
        //this.physicsObject.rigidBody.addForceAtPoint(new THREE.Vector3(0,0.05,0), this.vehicleModel.position.clone().add(wheelPositions[i]), true) // { x: 0.0, y: 1000.0, z: 0.0 }, { x: 1.0, y: 2.0, z: 3.0 }
      } else {
        this.wheels[i].position.y = this.vehicleModel.position.y;
      }

      this.wheels[i].position.x = this.vehicleModel.position
        .clone()
        .add(wheelPositions[i]).x;
      this.wheels[i].position.z = this.vehicleModel.position
        .clone()
        .add(wheelPositions[i]).z;
      //this.wheels[i].updateMatrixWorld()
    }
  }

  update(elapsedTime: number, deltaTime: number) {
    this.updateWheels(elapsedTime, deltaTime);

    if (this.physicsObject) {
      let { x, y, z } = this.physicsObject?.rigidBody.translation();
      let { rotW, rotX, rotY, rotZ } = this.physicsObject.rigidBody.rotation();
      //console.log(this.physicsObject.rigidBody.rotation())

      this.vehicleModel.position.set(x, y, x);
      //this.vehicleModel.rotation.set(rotW, rotX, rotY, rotZ)
      //this.vehicleModel.rotation.copy(rot)
    }

    //console.log("updating")
  }
}
