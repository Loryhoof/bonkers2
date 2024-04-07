import * as THREE from 'three'
import Noise from './Noise'
import { createTextureFrom2DArray, createTextureFromColorMap } from '../Utils'
import { terrainMaterial } from './TerrainMaterial'
import TerrainData from './data/TerrainData'
import NoiseData from './data/NoiseData'
import TextureData from './data/TextureData'
import MapData from './data/MapData'
import MeshData from './data/MeshData'
import { NormalizeMode } from './enum/NormalizeMode'
import FalloffGenerator from './FalloffGenerator'

export default class MapGenerator {

    private scene: THREE.Scene

    public mapChunkSize: number = 241
    public levelOfDetail: number = 2

    public drawMode: DrawMode = DrawMode.Mesh

    public terrainData: TerrainData
    public noiseData: NoiseData
    public textureData: TextureData

    public normalizeMode: NormalizeMode = NormalizeMode.Global
    public useFalloff: boolean = false

    private worker: Worker

    public falloffMap: number[][] = []

    private callbacks: { [id: string]: (data: any) => void } = {}; // for worker thread callback storage
    private currentRequestId: number = 0;
    
    constructor(scene: THREE.Scene) {
        this.scene = scene

        this.terrainData = new TerrainData(50, 1) // meshHeightMulitplier, scale
        this.noiseData = new NoiseData(100, 5, 0.3, 2, 0, new THREE.Vector2(0,0)) // noiseScale, octaves, persistance, lacunarity, seed, offsetVec2
        this.textureData = new TextureData()

        this.worker = new Worker('src/ts/terrain/workers/worker.js', { type: "module" });

        this.worker.onmessage = this.handleWorkerMessage.bind(this);

        this.falloffMap = FalloffGenerator.generateFalloffMap(this.mapChunkSize)
    }

    private handleWorkerMessage(event: MessageEvent) {
        const { data, requestId, noiseData, minMaxHeight } = event.data;
        const callback = this.callbacks[requestId];
        if (callback && typeof callback === 'function') {
            
            let { meshHeight, meshWidth, triangleIndex, triangles, uvs, vertices } = data

            let md = new MeshData(meshWidth, meshHeight)
            md.triangleIndex = triangleIndex
            md.triangles = triangles
            md.uvs = uvs
            md.vertices = vertices

            //this.terrainData.setHeight(minMaxHeight.min, minMaxHeight.max)

            //console.log(this.terrainData)

            callback({md: md, nm: noiseData, minHeight: minMaxHeight.min, maxHeight: minMaxHeight.max});
            delete this.callbacks[requestId];
        }
    }

    requestMeshFromData(center: THREE.Vector2, lod: number, callback: (meshData: MeshData) => void) {
        const requestId = this.getNextRequestId();
        this.callbacks[requestId] = callback;

        const messageData = {
            requestId: requestId,
            mapChunkSize: this.mapChunkSize,
            noiseData: this.noiseData,
            terrainData: this.terrainData,
            levelOfDetail: lod,
            center: center,
            useFalloff: this.useFalloff,
            falloffMap: this.falloffMap
        };

        this.worker.postMessage(messageData);
    }

    private getNextRequestId(): string {
        return String(this.currentRequestId++);
    }

    // generateMapData(): MapData {
    //     let newOffset = new THREE.Vector2()
    //     newOffset.copy(this.noiseData.offset).add(this.)
    //     const noiseMap = new Noise().generateNoiseMap(this.mapChunkSize, this.mapChunkSize, this.noiseData.seed, this.noiseData.noiseScale, this.noiseData.octaves, this.noiseData.persistance, this.noiseData.lacunarity, this.noiseData.offset, this.normalizeMode);

    //     for (let y = 0; y < this.mapChunkSize; y++) {
    //         for (let x = 0; x < this.mapChunkSize; x++) {
    //             if(this.useFalloff) {
    //                 noiseMap[x][y] = THREE.MathUtils.clamp(noiseMap[x][y] - this.falloffMap[x][y], 0, 1)
    //             }
    //         }
    //     }
    //     return new MapData(noiseMap)
    // }
    

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

    displayMesh(meshData: any) {
        let mesh = meshData.createMesh();
    
        // Use MeshStandardMaterial for more realistic lighting
        //mesh.material = new THREE.MeshStandardMaterial({ map: texture });
        mesh.material = terrainMaterial
        mesh.material.uniforms.minHeight.value = 0
        mesh.material.uniforms.maxHeight.value = 100
        // Properly position and rotate the mesh
        //mesh.rotation.x = -Math.PI / 2; // Rotate to lay flat on the ground
        mesh.position.set(0, 0, 0); // Set position as needed
        mesh.scale.set(this.terrainData.uniformScale, this.terrainData.uniformScale, this.terrainData.uniformScale)
        this.scene.add(mesh);
    }
}

enum DrawMode {
    NoiseMap,
    ColorMap,
    Mesh
}