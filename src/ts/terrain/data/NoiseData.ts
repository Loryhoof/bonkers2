import * as THREE from "three"

export default class NoiseData {

    public noiseScale: number = 100
    public octaves: number = 8
    public persistance: number = 0.5
    public lacunarity: number = 2

    public seed: number = 0
    public offset: THREE.Vector2 = new THREE.Vector2(0,0)

    constructor(
        noiseScale: number, 
        octaves: number,
        persistance: number,
        lacunarity: number,
        seed: number,
        offset: THREE.Vector2
    ) {

        this.noiseScale = noiseScale
        this.octaves = octaves
        this.persistance = persistance
        this.lacunarity = lacunarity
        this.seed = seed
        this.offset = offset
    }
}