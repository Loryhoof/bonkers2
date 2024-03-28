import RAPIER from "@dimforge/rapier3d";

export default interface PhysicsObject {
    rigidBody: RAPIER.RigidBody;
    collider: RAPIER.Collider;
}