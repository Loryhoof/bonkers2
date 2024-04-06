import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/Addons.js'
import { loadGLB, randomFrom } from '../Utils'
import { groundMaterial } from '../Ground'
import MapGenerator from './MapGenerator'
import MapData from './data/MapData'
import MeshData from './data/MeshData'
import RAPIER from '@dimforge/rapier3d'
import PhysicsManager from '../PhysicsManager'
import LODInfo from './data/LODInfo'

const treePrefab = await loadGLB('models/tree.glb')

export default class EndlessTerrain {
    
    public static maxViewDistance: number = 240
    public viewer: THREE.Object3D

    public viewerMoveThresholdForChunkUpdate: number = 25
    public sqrViewerMoveThresholdForChunkUpdate: number = this.viewerMoveThresholdForChunkUpdate * this.viewerMoveThresholdForChunkUpdate

    public detailLevels: LODInfo[]

    public scene: THREE.Scene

    public mapGenerator: MapGenerator

    public static viewerPosition: THREE.Vector2 = new THREE.Vector2()
    public viewerPositionOld: THREE.Vector2 = new THREE.Vector2()

    private chunkSize: number = 240
    private chunksVisibleInViewDistance: number = Math.floor(EndlessTerrain.maxViewDistance / this.chunkSize)

    private terrainChunkMap: Map<string, TerrainChunk> = new Map()

    private arr: Array<TerrainChunk> = []

    public static terrainChunksVisibleLastUpdate: Array<TerrainChunk> = []

    constructor(scene: THREE.Scene, viewer: THREE.Object3D) {
        this.scene = scene
        this.viewer = viewer
        this.mapGenerator = new MapGenerator(this.scene)

        this.detailLevels = [
            {lod: 4, visibleDistanceThreshold: 155},
            {lod: 6, visibleDistanceThreshold: 180}
        ]

        EndlessTerrain.maxViewDistance = this.detailLevels[this.detailLevels.length-1].visibleDistanceThreshold
        this.updateVisibleChunks()
    }

    update(elapsedTime: number, deltaTime: number) {
        EndlessTerrain.viewerPosition = new THREE.Vector2(this.viewer.position.x, this.viewer.position.z).divideScalar(this.mapGenerator.terrainData.uniformScale)
        
        const displacementVector = this.viewerPositionOld.clone().sub(EndlessTerrain.viewerPosition.clone());
        const squareMagnitude = displacementVector.lengthSq();

        if (squareMagnitude > this.sqrViewerMoveThresholdForChunkUpdate) {
            this.viewerPositionOld.copy(EndlessTerrain.viewerPosition)
            this.updateVisibleChunks()   
        }
    }

    updateVisibleChunks() {

        for (let i = 0; i < EndlessTerrain.terrainChunksVisibleLastUpdate.length; i++) {
            EndlessTerrain.terrainChunksVisibleLastUpdate[i].setVisible(false)
        }

        EndlessTerrain.terrainChunksVisibleLastUpdate = []
   
        let currentChunkCoordX = Math.floor(EndlessTerrain.viewerPosition.x / this.chunkSize)
        let currentChunkCoordY = Math.floor(EndlessTerrain.viewerPosition.y / this.chunkSize)

        for (let yOffset = -this.chunksVisibleInViewDistance; yOffset <= this.chunksVisibleInViewDistance; yOffset++) {
            for (let xOffset = -this.chunksVisibleInViewDistance; xOffset <= this.chunksVisibleInViewDistance; xOffset++) {
                let viewedChunkCoord = new THREE.Vector2(currentChunkCoordX + xOffset, currentChunkCoordY + yOffset)
                

                let stringifiedVector = JSON.stringify(viewedChunkCoord)

                if(this.terrainChunkMap.has(stringifiedVector)) {
                    this.terrainChunkMap.get(stringifiedVector)?.updateTerrainChunk()
                    // if(this.terrainChunkMap.get(stringifiedVector)?.isVisible()) {
                    //     this.terrainChunksVisibleLastUpdate.push(this.terrainChunkMap.get(stringifiedVector) as TerrainChunk)
                    // }
                }
                else {
                    let chunka = new TerrainChunk(this, viewedChunkCoord, this.chunkSize, this.detailLevels)
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

    public detailLevels: LODInfo[]
    public lodMeshes: LODMesh[]

    public mapData: MapData | any
    public mapDataReceived: boolean = false
    public previousLODIndex: number = -1

    constructor(terrain: EndlessTerrain, coord: THREE.Vector2, size: number, detailLevels: LODInfo[]) {
        this.terrain = terrain
        let nsubdivs = 50

        this.detailLevels = detailLevels
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

        //console.log(this.position)
        let tempLOD = 2

        this.lodMeshes = new Array<LODMesh>(this.detailLevels.length)

        for (let i = 0; i < this.detailLevels.length; i++) {
            this.lodMeshes[i] = new LODMesh(this.terrain, this.detailLevels[i].lod, this.position, this.updateTerrainChunk)
        }
        
        this.terrain.mapGenerator.requestMeshFromData(this.position, tempLOD, (meshData: MeshData) => {
            this.onMeshDataReceived(meshData);
        });
    }

    // onMapDataReceived(mapData: MapData) {
    //     //this.terrain.mapGenerator.requestMeshData(mapData, this.onMeshDataReceived)

    //     this.terrain.mapGenerator.requestMeshData(mapData, (meshData: MeshData) => {
    //         this.onMeshDataReceived(meshData);
    //     });
    // }

    onMeshDataReceived(data: any) {

        let meshData = data.md
        let noiseMap = data.nm

        this.mapData = meshData
        this.mapDataReceived = true

        //meshData

        //.log(data)

        let m = meshData.createMesh()

        this.meshObject = m

        this.meshObject.position.set(this.position.x, 0, this.position.y)
        this.meshObject.material = new THREE.MeshBasicMaterial({color: 0xffffff * Math.random(), wireframe: true})
        //this.meshObject.material = groundMaterial

        this.meshObject.scale.copy(new THREE.Vector3(this.terrain.mapGenerator.terrainData.uniformScale, this.terrain.mapGenerator.terrainData.uniformScale, this.terrain.mapGenerator.terrainData.uniformScale))
        this.meshObject.position.multiplyScalar(this.terrain.mapGenerator.terrainData.uniformScale)
        this.terrain.scene.add(this.meshObject)

        // let h = noiseMap.length

        // let lvl = 2
        // const meshSimplificationIncrement = lvl == 0 ? 1 : lvl * 2;
        // let hava = Math.ceil((241 - 1) / meshSimplificationIncrement) + 1;
        // console.log(hava, "HAVHAH")
        // console.log(h, "nosemei length")
        // let groundBodyDesc = RAPIER.RigidBodyDesc.fixed();
        // let groundBody = PhysicsManager.getInstance().physicsWorld.createRigidBody(groundBodyDesc);
        // let groundCollider = RAPIER.ColliderDesc.heightfield(
        //     240, 240, new Float32Array(noiseMap), new THREE.Vector3(241, 20,241)
        // );
        // PhysicsManager.getInstance().physicsWorld.createCollider(groundCollider, groundBody);
        this.updateTerrainChunk()
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
        if(!this.mapDataReceived) {
            return
        }

        let viewerDistanceFromNearestEdge = this.bounds.distanceToPoint(EndlessTerrain.viewerPosition)
        let visible = viewerDistanceFromNearestEdge <= EndlessTerrain.maxViewDistance

        if(visible) {
            let lodIndex = 0
            
            for (let i = 0; i < this.detailLevels.length - 1; i++) {
                if (viewerDistanceFromNearestEdge > this.detailLevels[i].visibleDistanceThreshold) {
                    lodIndex = i+1
                }
                else {
                    break
                }
            }

            if(lodIndex != this.previousLODIndex) {
                let lodMesh = this.lodMeshes[lodIndex]
                if(lodMesh.hasMesh) {
                    this.previousLODIndex = lodIndex
                    this.meshObject.geometry = lodMesh.mesh.geometry
                    //this.meshObject.position.set(this.position.x, 0, this.position.y)
                    //this.meshObject.material = new THREE.MeshBasicMaterial({color: 0xffffff * Math.random(), wireframe: true})

                    //this.meshObject.scale.copy(new THREE.Vector3(this.terrain.mapGenerator.terrainData.uniformScale, this.terrain.mapGenerator.terrainData.uniformScale, this.terrain.mapGenerator.terrainData.uniformScale))
                    //this.meshObject.position.multiplyScalar(this.terrain.mapGenerator.terrainData.uniformScale)
                    //this.terrain.scene.add(this.meshObject)
                }
                else if (!lodMesh.hasRequestedMesh) {
                    lodMesh.requestMesh(this.mapData)
                }
            }
            EndlessTerrain.terrainChunksVisibleLastUpdate.push(this)
        }

        this.setVisible(visible)
    }

    setVisible(visible: boolean) {
        this.meshObject.visible = visible
    }

    isVisible() {
        return this.meshObject.visible
    }
    
}

class LODMesh {

    public mesh: any
    public hasRequestedMesh: boolean = false
    public hasMesh: boolean = false
    public lod: number

    private terrain: EndlessTerrain
    private position: THREE.Vector2

    private onMeshReceivedCallback: (mesh: any) => void

    constructor(terrain: EndlessTerrain, lod: number, position: THREE.Vector2, onMeshReceived: (mesh: any) => void) {
        this.terrain = terrain
        this.lod = lod
        this.position = position

        this.onMeshReceivedCallback = onMeshReceived
    }

    onMeshDataReceived(data: any) {
        
        let meshData = data.md
        //console.log(meshData)
        this.mesh = meshData.createMesh()
        this.hasMesh = true
    }

    requestMesh(mapData: MapData) {
        this.hasRequestedMesh = true

        this.terrain.mapGenerator.requestMeshFromData(this.position, this.lod, (meshData: MeshData) => {
            this.onMeshDataReceived(meshData);
        });
        
    }
}