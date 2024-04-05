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

    constructor(scene: THREE.Scene, player: Player) {
        this.scene = scene
        this.player = player
        this.entities = []
    }

    spawnZombies() {

        if(this.entities.length > 5) {
            return
        }

       

        let enemy = new Enemy(this.scene)
        EntityManager.getInstance().add(enemy)
        this.scene.add(enemy)
        this.entities.push(enemy)

        //console.log(this.scene, "This sscene")
        enemy.setTarget(this.player)

    }

    update(elapsedTime: number, deltaTime: number) {

        if(elapsedTime < 20) {
            return
        }

        if(elapsedTime - this.lastSpawnTime > this.spawnInterval) {
            this.lastSpawnTime = elapsedTime
            this.spawnZombies()
        }

    }
}