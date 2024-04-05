import * as THREE from 'three'
import Noise from './Noise'
import { createTextureFrom2DArray, createTextureFromColorMap } from '../Utils'
import MeshGenerator from './MeshGenerator'

export default class MapGenerator {

    private scene: THREE.Scene

    public mapChunkSize: number = 241
    public levelOfDetail: number = 1
    public noiseScale: number = 50

    public octaves: number = 5
    public persistance: number = 0.5
    public lacunarity: number = 2

    public meshHeightMulitplier: number = 15

    public offset: THREE.Vector2 = new THREE.Vector2(0,0)

    private seed: number = 5412

    public regions: Array<TerrainType>

    public drawMode: DrawMode = DrawMode.Mesh

    constructor(scene: THREE.Scene) {
        this.scene = scene

        this.regions = [
            {
                name: 'Snow',
                height: 0.3,
                color: new THREE.Color(0xffffff)
            },
            {
                name: 'Rocks',
                height: 0.4,
                color: new THREE.Color(0x665432)
            },
            {
                name: 'Grass',
                height: 0.45,
                color: new THREE.Color(0x5dab48)
            },
            {
                name: 'Sand',
                height: 0.55,
                color: new THREE.Color(0xf7c95c)
            },
            {
                name: 'Water Shallow',
                height: 0.8,
                color: new THREE.Color(0x4287f5)
            },
            {
                name: 'Water Deep',
                height: 1,
                color: new THREE.Color(0x1251b5)
            }
        ];
        

        //this.regions.reverse()
        //console.log(this.regions)

        this.generateMap()

    }

    generateMap() {
        const noiseMap = new Noise().generateNoiseMap(this.mapChunkSize, this.mapChunkSize, this.seed, this.noiseScale, this.octaves, this.persistance, this.lacunarity, this.offset);
        const colorMap = new Uint8ClampedArray(this.mapChunkSize * this.mapChunkSize * 4); // 4 channels: RGBA
    
        for (let y = 0; y < this.mapChunkSize; y++) {
            for (let x = 0; x < this.mapChunkSize; x++) {
                const currentHeight = noiseMap[y][x]; // Access noiseMap using [y][x] for correct indexing
                for (let i = 0; i < this.regions.length; i++) {
                    if (currentHeight <= this.regions[i].height) {
                        // if(this.regions[i].height < 0.4) {
                        //     this.regions[i].height = 
                        // }
                        const color = this.regions[i].color;
                        // Assign color channels to colorMap
                        const index = (y * this.mapChunkSize + x) * 4; // Calculate index for RGBA
                        colorMap[index] = color.r * 255; // Red channel
                        colorMap[index + 1] = color.g * 255; // Green channel
                        colorMap[index + 2] = color.b * 255; // Blue channel
                        colorMap[index + 3] = 255; // Alpha channel (fully opaque)
                        break;
                    }
                }
            }
        }

        if (this.drawMode === DrawMode.NoiseMap) {
            this.display(noiseMap);
        } else if (this.drawMode == DrawMode.ColorMap) {
            this.displayColorMap(colorMap);
        }
        else {
            let lala = MeshGenerator.generateTerrainMesh(noiseMap, this.meshHeightMulitplier, this.levelOfDetail)

            let texture = createTextureFromColorMap(colorMap, this.mapChunkSize, this.mapChunkSize)
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;
            this.displayMesh(lala, texture)
        }
    }
    

    display(noiseMap: number[][]) {
        
        let texture = createTextureFrom2DArray(noiseMap)
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        let geom = new THREE.PlaneGeometry(this.mapChunkSize, this.mapChunkSize)
        let mat = new THREE.MeshBasicMaterial({map: texture})
        let mesh = new THREE.Mesh(geom, mat)
        mesh.rotation.x = -Math.PI / 2

        this.scene.add(mesh)

    }

    displayColorMap(colorMap: any) {
        
        let texture = createTextureFromColorMap(colorMap, this.mapChunkSize, this.mapChunkSize)
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        let geom = new THREE.PlaneGeometry(this.mapChunkSize, this.mapChunkSize)
        let mat = new THREE.MeshBasicMaterial({map: texture})
        let mesh = new THREE.Mesh(geom, mat)
        mesh.rotation.x = -Math.PI / 2
        mesh.position.set(0,0,100)

        this.scene.add(mesh)

    }

    displayMesh(meshData: any, texture: THREE.Texture) {
        let mesh = meshData.createMesh()
        mesh.material = new THREE.MeshBasicMaterial({map: texture, wireframe: false})

        this.scene.add(mesh)
        //console.log(mesh, "MESSHHSHSHS")
    }
}

enum DrawMode {
    NoiseMap,
    ColorMap,
    Mesh
}

interface TerrainType {
    name: string,
    height: number,
    color: THREE.Color
}