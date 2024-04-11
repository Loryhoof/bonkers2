import * as THREE from 'three'
import EntityManager from './EntityManager'
import Enemy from './Enemy'
import Player from './Player'

export class SpawnManager {

    private scene: THREE.Scene

    private lastSpawnTime: number = 0
    private spawnInterval: number = 2

    private player: Player
    
    private entities: Array<Enemy>

    private maxSpawns: number = 15

    constructor(scene: THREE.Scene, player: Player) {
        this.scene = scene
        this.player = player
        this.entities = []
    }

    spawnZombies() {

        if(this.entities.length > this.maxSpawns) {
            return
        }

       

        let enemy = new Enemy(this.scene)
        EntityManager.getInstance().add(enemy)
        this.scene.add(enemy)
        this.entities.push(enemy)

        //console.log(this.scene, "This sscene")
        console.log("spawining")
        enemy.setTarget(this.player)

    }

    update(elapsedTime: number, deltaTime: number) {

        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i]

            if (entity.isDead) {
                this.entities.splice(i, 1)
            }
        }

        if(elapsedTime - this.lastSpawnTime > this.spawnInterval) {
            this.lastSpawnTime = elapsedTime
            this.spawnZombies()
        }

    }
}