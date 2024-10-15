import PhysicsObject from "./PhysicsObject";
import Vector3 from "./Vector3";

interface Player {
  networkId: string;
  position: { x: number; y: number; z: number };
  direction: { x: number; y: number; z: number };
  physicsObject: PhysicsObject;
  velocity: Vector3;
}

interface PlayerDictionary {
  [id: string]: Player;
}

export type { Player, PlayerDictionary };
