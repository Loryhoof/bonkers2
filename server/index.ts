import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import { multiplyScalar, normalize, PLAYER_START_POSITION } from "./constants";
import { PlayerDictionary } from "./interfaces/General";
import PhysicsManager from "./PhysicsManager";
import PhysicsObject from "./interfaces/PhysicsObject";
import Vector3 from "./interfaces/Vector3";

// Create an Express application
const app = express();

// Create a basic HTTP server and integrate with Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow cross-origin requests (adjust as needed)
  },
});

const players: PlayerDictionary = {};

let physics: PhysicsManager | null = null;
let demoObject: PhysicsObject | null = null;

const addPlayer = (id: string) => {
  if (players[id]) {
    return console.log(`User with id: ${id} already exists.`);
  }

  if (physics == null) {
    return console.log("Physics not ready");
  }

  const physicsObject: PhysicsObject = physics.createPlayerCapsule();

  players[id] = {
    networkId: id,
    position: PLAYER_START_POSITION,
    physicsObject: physicsObject,
    velocity: new Vector3(),
  };

  return players[id];
};

const removePlayer = (id: string) => {
  if (!players[id]) {
    return console.log(
      `User with id: ${id} does not exist. Couldn't remove user`
    );
  }

  if (physics == null) {
    return console.log("Physics not ready");
  }

  physics.remove(players[id].physicsObject);

  delete players[id];
};

// Initialize the Rapier physics world and the server
async function init() {
  physics = new PhysicsManager();
  await physics.waitForPhysicsInit();

  // demoObject = physics.createDynamicBox(
  //   { x: 0, y: 100, z: 0 },
  //   { x: 1, y: 1, z: 1 }
  // );

  // Adding ground
  physics.createFixedBox({ x: 0, y: 0, z: 0 }, { x: 1000, y: 1, z: 1000 });

  tick();

  // Socket.IO connection logic
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    const client = addPlayer(socket.id);

    if (!client) {
      return;
    }

    socket.broadcast.emit("player-join", { networkId: socket.id });

    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("move", (data) => {
      const { key, dir } = data;

      const player = players[socket.id];

      if (!player) {
        console.log("Player does not exist");
      }

      const speedFactor = 10;

      const cameraForward = normalize({ x: dir.x, y: 0, z: dir.z });

      //console.log(cameraForward, "cameraForward");

      player.velocity.set(0, 0, 0);

      if (key == "w") {
        let val = multiplyScalar(cameraForward, speedFactor);
        //console.log(val, "val");
        player.velocity.add(new Vector3(val.x, val.y, val.z));
        // physics?.setLinearVelocity(
        //   player.physicsObject.rigidBody,
        //   multiplyScalar(cameraForward, speedFactor)
        // );
      }
      if (key == "a") {
        const left = { x: dir.z, y: 0, z: -dir.x };

        let val = multiplyScalar(left, speedFactor);
        player.velocity.add(new Vector3(val.x, val.y, val.z));

        // physics?.setLinearVelocity(
        //   player.physicsObject.rigidBody,
        //   multiplyScalar(left, speedFactor)
        // );
      }
      if (key == "s") {
        let val = multiplyScalar(cameraForward, -speedFactor);
        player.velocity.add(new Vector3(val.x, val.y, val.z));
        // physics?.setLinearVelocity(
        //   player.physicsObject.rigidBody,
        //   multiplyScalar(cameraForward, -speedFactor)
        // );
      }
      if (key == "d") {
        const right = { x: -dir.z, y: 0, z: dir.x };

        let val = multiplyScalar(right, speedFactor);
        player.velocity.add(new Vector3(val.x, val.y, val.z));

        // physics?.setLinearVelocity(
        //   player.physicsObject.rigidBody,
        //   multiplyScalar(right, speedFactor)
        // );
      }
    });

    // Return a list of all current players

    socket.emit("player-list", simplifyPlayerList(players));

    socket.on("disconnect", () => {
      removePlayer(socket.id);
      socket.emit("player-leave", { networkId: socket.id });
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  // Start the server on port 3000
  httpServer.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}

function simplifyPlayerList(players: PlayerDictionary) {
  const simplifiedList: {
    [id: string]: {
      networkId: string;
      position: { x: number; y: number; z: number };
    };
  } = {};

  for (const [id, player] of Object.entries(players)) {
    simplifiedList[id] = {
      networkId: player.networkId,
      position: player.position,
    };
  }

  return simplifiedList;
}

function tick() {
  if (physics !== null) {
    physics.update(0, 0);

    for (const [key, value] of Object.entries(players)) {
      const player = players[key];
      const physicsObject = player.physicsObject;
      const networkId = player.networkId;
      const displacement = player.velocity.clone().multiplyScalar(0.03 * 20);

      const linVel = player.physicsObject.rigidBody.linvel();
      displacement.y = linVel.y;

      physics.setLinearVelocity(player.physicsObject.rigidBody, displacement);

      player.velocity.set(0, 0, 0);

      const position = physicsObject.rigidBody.translation();

      const data = {
        networkId: networkId,
        position: { x: position.x, y: position.y, z: position.z },
      };

      //console.log(data);

      //console.log(data);

      io.emit("player-update", data);
    }

    // if (demoObject) {
    //   console.log(demoObject.rigidBody.translation(), "demoObject");
    // }
  }
  setTimeout(tick, 1000 / 60);
}

// Initialize the game with Rapier and set up the server
init().catch((err) => {
  console.error("Error initializing Rapier or the server:", err);
});
