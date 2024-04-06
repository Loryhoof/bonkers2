import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/Addons.js'
import { loadGLB, randomFrom } from '../Utils'
import { groundMaterial } from '../Ground'
import MapGenerator from './MapGenerator'
import MapData from './data/MapData'
import MeshData from './data/MeshData'

const treePrefab = await loadGLB('models/tree.glb')

export default class EndlessTerrain {
    
    public static maxViewDistance: number = 240
    public viewer: THREE.Object3D

    public scene: THREE.Scene

    public mapGenerator: MapGenerator

    public static viewerPosition: THREE.Vector2 = new THREE.Vector2()

    private chunkSize: number = 240
    private chunksVisibleInViewDistance: number = Math.floor(EndlessTerrain.maxViewDistance / this.chunkSize)

    private terrainChunkMap: Map<string, TerrainChunk> = new Map()

    private arr: Array<TerrainChunk> = []

    private terrainChunksVisibleLastUpdate: Array<TerrainChunk> = []

    public scale: number = 1

    constructor(scene: THREE.Scene, viewer: THREE.Object3D) {
        this.scene = scene
        this.viewer = viewer
        this.mapGenerator = new MapGenerator(this.scene)
    }

    update(elapsedTime: number, deltaTime: number) {
        EndlessTerrain.viewerPosition = new THREE.Vector2(this.viewer.position.x, this.viewer.position.z).divideScalar(this.scale)
        this.updateVisibleChunks()
    }

    updateVisibleChunks() {

        for (let i = 0; i < this.terrainChunksVisibleLastUpdate.length; i++) {
            this.terrainChunksVisibleLastUpdate[i].setVisible(false)
        }

        this.terrainChunksVisibleLastUpdate = []
   
        let currentChunkCoordX = Math.floor(EndlessTerrain.viewerPosition.x / this.chunkSize)
        let currentChunkCoordY = Math.floor(EndlessTerrain.viewerPosition.y / this.chunkSize)

        for (let yOffset = -this.chunksVisibleInViewDistance; yOffset <= this.chunksVisibleInViewDistance; yOffset++) {
            for (let xOffset = -this.chunksVisibleInViewDistance; xOffset <= this.chunksVisibleInViewDistance; xOffset++) {
                let viewedChunkCoord = new THREE.Vector2(currentChunkCoordX + xOffset, currentChunkCoordY + yOffset)

                let stringifiedVector = JSON.stringify(viewedChunkCoord)

                if(this.terrainChunkMap.has(stringifiedVector)) {
                    this.terrainChunkMap.get(stringifiedVector)?.updateTerrainChunk()
                    if(this.terrainChunkMap.get(stringifiedVector)?.isVisible()) {
                        this.terrainChunksVisibleLastUpdate.push(this.terrainChunkMap.get(stringifiedVector) as TerrainChunk)
                    }
                }
                else {
                    let chunka = new TerrainChunk(this, viewedChunkCoord, this.chunkSize)
                    this.terrainChunkMap.set(stringifiedVector, chunka)
                    this.arr.push(chunka)
                }
            }
        }
    }
}

class TerrainChunk {

    public position: THREE.Vector2
    public meshObject: THREE.Object3D = new THREE.Object3D()

    public bounds: THREE.Box2 

    private terrain: EndlessTerrain

    private coord: any
    private size: any

    constructor(terrain: EndlessTerrain, coord: THREE.Vector2, size: number) {
        this.terrain = terrain
        let nsubdivs = 50
        //console.log(coord.multiplyScalar(size))
        this.position = coord.multiplyScalar(size)
        this.coord = coord
        this.size = size
        this.bounds = new THREE.Box2(this.position, new THREE.Vector2().multiplyScalar(size))
        //let positionV3 = new THREE.Vector3(this.position.x, 0 , this.position.y)
        //this.meshObject = new THREE.Mesh(new THREE.PlaneGeometry(size, size, nsubdivs, nsubdivs), new THREE.MeshBasicMaterial({color: 0xffffff * Math.random(), wireframe: false},))
        //this.meshObject.material = groundMaterial
        //this.meshObject.position.copy(positionV3)
        //this.meshObject.rotation.x = -Math.PI / 2
       // this.terrain.scene.add(this.meshObject)
        //his.setVisible(false)
        //this.init(this.meshObject, size, nsubdivs)

        this.terrain.mapGenerator.requestMeshFromData(this.position, (meshData: MeshData) => {
            this.onMeshDataReceived(meshData);
        });
    }

    // onMapDataReceived(mapData: MapData) {
    //     //this.terrain.mapGenerator.requestMeshData(mapData, this.onMeshDataReceived)

    //     this.terrain.mapGenerator.requestMeshData(mapData, (meshData: MeshData) => {
    //         this.onMeshDataReceived(meshData);
    //     });
    // }

    onMeshDataReceived(meshData: MeshData) {

        let m = meshData.createMesh()

        this.meshObject = m

        this.meshObject.position.set(this.position.x, 0, this.position.y)
        this.meshObject.material = new THREE.MeshBasicMaterial({color: 0xffffff * Math.random(), wireframe: true})
        //this.meshObject.material = groundMaterial
        this.meshObject.scale.copy(new THREE.Vector3(this.terrain.scale, this.terrain.scale, this.terrain.scale))
        this.meshObject.position.multiplyScalar(this.terrain.scale)
        this.terrain.scene.add(this.meshObject)
    }

    init(obj: any, scale: number, nsubdivs: number) {

        //console.log(treePrefab)

        //let tree = treePrefab.scene.clone()

        const simplex = new SimplexNoise()
        
        const vertices = obj.geometry.attributes.position.array;
        const dx = scale / nsubdivs;
        const dy = scale / nsubdivs;

        //let g = new THREE.PlaneGeometry(0.1, 1)
        //let instancedMesh = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff * Math.random(), wireframe: true}), 0)
        //instancedMesh = new THREE.InstancedMesh(tree.geometry, tree.material, vertices.length)
        //this.meshObject.add(instancedMesh)
        
        //let matrix = new THREE.Matrix4().compose()

        // for (let i = 0; i < vertices.length; i += 3) {
        //     let x = vertices[i]
        //     let y = vertices[i+1]
        //     let z = vertices[i+2]
            
        //     let newHeight = 0//simplex.noise(x * 0.5, y * 0.5) * 2
        //     vertices[i+2] = newHeight

        //     //let m = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({ color: 0xffffff * Math.random(), wireframe: true}))
        //     //this.meshObject.add(m)
        //     //EndlessTerrain.scene.add(m)

        //     //const boxPosition = new THREE.Vector3(x, y, newHeight).applyEuler(this.meshObject.rotation).add(this.meshObject.position);
        //     //m.position.copy(boxPosition)
        //     //m.position.set(x, y, newHeight)

        //     instancedMesh.setMatrixAt(i, new THREE.Matrix4().compose(
        //         new THREE.Vector3(x, y, newHeight + 1),
        //         this.meshObject.quaternion,
        //         new THREE.Vector3(1,1,1)
        //     ))
        //     //m.visible = true
        // }

        // instancedMesh.instanceMatrix.needsUpdate = true;

        //obj.updateMatrixWorld()

    }

    updateTerrainChunk() {
        let viewerDistanceFromNearestEdge = this.bounds.distanceToPoint(EndlessTerrain.viewerPosition)
        let visible = viewerDistanceFromNearestEdge <= EndlessTerrain.maxViewDistance
        this.setVisible(visible)
    }

    setVisible(visible: boolean) {
        this.meshObject.visible = visible
    }

    isVisible() {
        return this.meshObject.visible
    }
    
}

// class LODMesh {

//     public mesh: any
//     public hasRequestedMesh: boolean
//     public hasMesh: boolean
//     public lod: number

//     constructor(lod: number) {
//         this.lod = lod
//     }

//     requestMesh(mapData: MapData) {
//         this.hasRequestedMesh = true
        
//     }
// }