import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/Addons.js'
import { loadGLB } from './Utils'
import { groundMaterial } from './Ground'

const treePrefab = await loadGLB('models/tree.glb')

export default class EndlessTerrain {
    
    public static maxViewDistance: number = 240
    public viewer: THREE.Object3D

    public static scene: THREE.Scene

    public static viewerPosition: THREE.Vector2 = new THREE.Vector2()

    private chunkSize: number = 240
    private chunksVisibleInViewDistance: number = Math.floor(EndlessTerrain.maxViewDistance / this.chunkSize)

    private terrainChunkMap: Map<string, TerrainChunk> = new Map()

    private arr: Array<TerrainChunk> = []

    private terrainChunksVisibleLastUpdate: Array<TerrainChunk> = []

    constructor(scene: THREE.Scene, viewer: THREE.Object3D) {
        EndlessTerrain.scene = scene
        this.viewer = viewer
    }

    update(elapsedTime: number, deltaTime: number) {
        EndlessTerrain.viewerPosition = new THREE.Vector2(this.viewer.position.x, this.viewer.position.z)
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
                    let chunka = new TerrainChunk(viewedChunkCoord, this.chunkSize)
                    this.terrainChunkMap.set(stringifiedVector, chunka)
                    this.arr.push(chunka)
                }
            }
        }
    }
}

class TerrainChunk {

    public position: THREE.Vector2
    public meshObject: THREE.Mesh

    public bounds: THREE.Box2 

    constructor(coord: THREE.Vector2, size: number) {
        let nsubdivs = 50
        this.position = coord.multiplyScalar(size)
        this.bounds = new THREE.Box2(this.position, new THREE.Vector2().multiplyScalar(size))
        let positionV3 = new THREE.Vector3(this.position.x, 0 , this.position.y)
        this.meshObject = new THREE.Mesh(new THREE.PlaneGeometry(size, size, nsubdivs, nsubdivs), new THREE.MeshBasicMaterial({color: 0xffffff * Math.random(), wireframe: false},))
        this.meshObject.material = groundMaterial
        this.meshObject.position.copy(positionV3)
        this.meshObject.rotation.x = -Math.PI / 2
        EndlessTerrain.scene.add(this.meshObject)
        this.setVisible(false)
        this.init(this.meshObject, size, nsubdivs)
    }

    init(obj: any, scale: number, nsubdivs: number) {

        console.log(treePrefab)

        //let tree = treePrefab.scene.clone()

        const simplex = new SimplexNoise()
        
        const vertices = obj.geometry.attributes.position.array;
        const dx = scale / nsubdivs;
        const dy = scale / nsubdivs;

        let g = new THREE.PlaneGeometry(0.1, 1)
        let instancedMesh = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff * Math.random(), wireframe: true}), 0)
        //instancedMesh = new THREE.InstancedMesh(tree.geometry, tree.material, vertices.length)
        this.meshObject.add(instancedMesh)
        
        //let matrix = new THREE.Matrix4().compose()

        for (let i = 0; i < vertices.length; i += 3) {
            let x = vertices[i]
            let y = vertices[i+1]
            let z = vertices[i+2]
            
            let newHeight = 0//simplex.noise(x * 0.5, y * 0.5) * 2
            vertices[i+2] = newHeight

            //let m = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({ color: 0xffffff * Math.random(), wireframe: true}))
            //this.meshObject.add(m)
            //EndlessTerrain.scene.add(m)

            //const boxPosition = new THREE.Vector3(x, y, newHeight).applyEuler(this.meshObject.rotation).add(this.meshObject.position);
            //m.position.copy(boxPosition)
            //m.position.set(x, y, newHeight)

            instancedMesh.setMatrixAt(i, new THREE.Matrix4().compose(
                new THREE.Vector3(x, y, newHeight + 1),
                this.meshObject.quaternion,
                new THREE.Vector3(1,1,1)
            ))
            //m.visible = true
        }

        instancedMesh.instanceMatrix.needsUpdate = true;

        obj.updateMatrixWorld()

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