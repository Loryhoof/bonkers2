import * as THREE from 'three'
import { loadGLB, randomBetween } from '../Utils'
import { groundMaterial } from './Ground'
import MapGenerator from './MapGenerator'
import MapData from './data/MapData'
import MeshData from './data/MeshData'
// import RAPIER from '@dimforge/rapier3d'
import PhysicsManager from '../PhysicsManager'
import LODInfo from './data/LODInfo'
import { terrainMaterial } from './TerrainMaterial'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
const treePrefab = await loadGLB('models/tree_test.glb')
const plantPrefab = await loadGLB('models/plant.glb')

export default class EndlessTerrain {
    
    public static maxViewDistance: number = 600
    public viewer: THREE.Object3D

    public viewerMoveThresholdForChunkUpdate: number = 50
    public sqrViewerMoveThresholdForChunkUpdate: number = this.viewerMoveThresholdForChunkUpdate * this.viewerMoveThresholdForChunkUpdate

    public detailLevels: LODInfo[]

    public scene: THREE.Scene

    public mapGenerator: MapGenerator

    public static viewerPosition: THREE.Vector2 = new THREE.Vector2()
    public viewerPositionOld: THREE.Vector2 = new THREE.Vector2()

    public chunkSize: number = 240
    private chunksVisibleInViewDistance: number = Math.floor(EndlessTerrain.maxViewDistance / this.chunkSize)

    private terrainChunkMap: Map<string, TerrainChunk> = new Map()

    private arr: Array<TerrainChunk> = []

    public static terrainChunksVisibleLastUpdate: Array<TerrainChunk> = []

    public showWireframe: boolean = false

    constructor(scene: THREE.Scene, viewer: THREE.Object3D) {
        this.scene = scene
        this.viewer = viewer
        this.mapGenerator = new MapGenerator(this.scene)

        this.detailLevels = [
            {lod: 6, visibleDistanceThreshold: 200},
            {lod: 6, visibleDistanceThreshold: 400}
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
    public meshObject: THREE.Mesh | any

    public bounds: THREE.Box2 

    private terrain: EndlessTerrain

    private coord: any
    private size: any

    public detailLevels: LODInfo[]
    public lodMeshes: LODMesh[]

    public mapData: MapData | any
    public mapDataReceived: boolean = false
    public previousLODIndex: number = -1

    public minHeight: number = 0
    public maxHeight: number = 0

    private entities: Array<any> = []

    constructor(terrain: EndlessTerrain, coord: THREE.Vector2, size: number, detailLevels: LODInfo[]) {
        this.terrain = terrain

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
        let tempLOD = 6

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

        this.minHeight = data.minHeight * this.terrain.mapGenerator.terrainData.uniformScale * this.terrain.mapGenerator.terrainData.meshHeightMulitplier
        this.maxHeight = data.maxHeight * this.terrain.mapGenerator.terrainData.uniformScale * this.terrain.mapGenerator.terrainData.meshHeightMulitplier

        //console.log(this.minHeight, this.maxHeight)

        this.mapData = meshData
        this.mapDataReceived = true

        //meshData

        //.log(data)

        let m = meshData.createMesh()

        this.meshObject = m

        this.meshObject.position.set(this.position.x, 0, this.position.y)
        //this.meshObject.material = new THREE.MeshBasicMaterial({color: 0xffffff * Math.random(), wireframe: this.terrain.showWireframe})
        this.meshObject.material = terrainMaterial
        this.meshObject.material.uniforms.minHeight.value = 0//this.terrain.mapGenerator.terrainData.uniformScale * this.terrain.mapGenerator.terrainData.meshHeightMulitplier //this.minHeight
        this.meshObject.material.uniforms.maxHeight.value =  this.terrain.mapGenerator.terrainData.uniformScale * this.terrain.mapGenerator.terrainData.meshHeightMulitplier//this.maxHeight

        //console.log(this.terrain.mapGenerator.terrainData.interpolateHeight(this.terrain.mapGenerator.terrainData.minHeight, this.terrain.mapGenerator.terrainData.maxHeight, 0.1))

        this.meshObject.material.wireframe = this.terrain.showWireframe;

        this.meshObject.scale.copy(new THREE.Vector3(this.terrain.mapGenerator.terrainData.uniformScale, this.terrain.mapGenerator.terrainData.uniformScale, this.terrain.mapGenerator.terrainData.uniformScale))
        this.meshObject.position.multiplyScalar(this.terrain.mapGenerator.terrainData.uniformScale)
        this.terrain.scene.add(this.meshObject)

        this.meshObject.geometry.update

        this.updateTerrainChunk()
        this.makeObjects(this.meshObject.geometry.attributes.position.array, meshData, this.meshObject.position)
        this.makeCollider(this.meshObject.geometry.attributes.position.array, meshData, this.meshObject.position)
    }

    makeObjects(vertices: any, meshData: MeshData, pos: any) {

        let obj = treePrefab.scene.clone()

        let bark = treePrefab.scene.getObjectByName('tree_bark')
        let leaves = treePrefab.scene.getObjectByName('tree_leaves')

        //leaves.material.alphaTest = 0.7
        leaves.material.depthWrite = true

        let plant = plantPrefab.scene.clone().getObjectByName('plant')

        console.log(plant)


        //console.log(bark.geometry, bark.material)

        var mergedGeometry = BufferGeometryUtils.mergeGeometries([bark.geometry, leaves.geometry]);

        //console.log(mergedGeometry)


        
        
        //this.terrain.scene.add(instancedMesh)


        let positions = []
        let positions2 = []

        // for (let i = 0; i < vertices.length; i += 3) {
        //     nums.push(Math.random())
        // }

        //let instancedMesh = new THREE.InstancedMesh(bark.geometry, bark.material, nums.length)

        //console.log(nums)

        for (let i = 0; i < vertices.length; i += 3) {

            
            let x = vertices[i]
            let y = vertices[i+1]
            let z = vertices[i+2]

            

            obj.position.set(x,y,z).add(pos)

            if(Math.random() > 0.6 && y > 10) {
                positions.push(new THREE.Vector3(x,y,z).add(pos))
            }
            else {
                positions2.push(new THREE.Vector3(x,y,z).add(pos))
            }

            // if(i <= 500) {
            //     let instanceMatrix = new THREE.Matrix4
            //     var position = new THREE.Vector3(Math.random() * 100 - 50, 0, Math.random() * 100 - 50);
            //     var rotation = new THREE.Euler(-Math.PI / 2, 0, 0);
            //     var scale = new THREE.Vector3(0.25, 0.25, 0.25)

            //     // Create a transformation matrix for the instance
            //     instanceMatrix.compose(new THREE.Vector3(x,y,z).add(pos), new THREE.Quaternion().setFromEuler(rotation), scale);
            //     instancedMesh.setMatrixAt(i, instanceMatrix)
            // }

            

            // if(Math.random() > 0.99) {
            //     this.terrain.scene.add(obj)
            // }


            
        }

        let instancedMesh = new THREE.InstancedMesh(bark.geometry, bark.material, positions.length)
        let instancedMesh2 = new THREE.InstancedMesh(leaves.geometry, leaves.material, positions.length)

        let plantInstancedMesh = new THREE.InstancedMesh(plant.geometry, plant.material, positions2.length)

        for (let i = 0; i < positions.length; i++) {

            let instanceMatrix = new THREE.Matrix4
            var position = new THREE.Vector3(Math.random() * 100 - 50, 0, Math.random() * 100 - 50);
            var rotation = new THREE.Euler(-Math.PI / 2, 0, 0);
            let randScale = randomBetween(0.1, 0.25)
            var scale = new THREE.Vector3(randScale, randScale, randScale)

            //   //Create a transformation matrix for the instance
            instanceMatrix.compose(positions[i].clone(), new THREE.Quaternion().setFromEuler(rotation), scale);
            instancedMesh.setMatrixAt(i, instanceMatrix)
            instancedMesh2.setMatrixAt(i, instanceMatrix)
        }

        for (let i = 0; i < positions2.length; i++) {

            let instanceMatrix = new THREE.Matrix4
           // var position = new THREE.Vector3(Math.random() * 100 - 50, 0, Math.random() * 100 - 50);
            var rotation = new THREE.Euler(-Math.PI / 2, 0, 0);
            let randScale = randomBetween(0.1, 0.25)
            var scale = new THREE.Vector3(randScale, randScale, randScale)

            //   //Create a transformation matrix for the instance
            instanceMatrix.compose(positions2[i].clone(), new THREE.Quaternion().setFromEuler(rotation), scale);
            plantInstancedMesh.setMatrixAt(i, instanceMatrix)

            //console.log('yla')
            //instancedMesh2.setMatrixAt(i, instanceMatrix)

        }
        

        //console.log(positions)

        instancedMesh.updateMatrixWorld()
        instancedMesh2.updateMatrixWorld()
        plantInstancedMesh.updateMatrixWorld()
        this.terrain.scene.add(instancedMesh, instancedMesh2)
        this.entities.push(instancedMesh, instancedMesh2)
        //console.log(this.entities, "entities")
    }

    makeCollider(vertices: any, meshData: MeshData, pos: any) {

        let nsubdivs =  meshData.meshHeight
        let size = this.terrain.chunkSize + 1 // chunkGridSize
        const scale = new THREE.Vector3(size, 1, size)
        const heights = []

        const dx = scale.x / nsubdivs;
        const dy = scale.z / nsubdivs;
        const columsRows = new Map();

        for (let i = 0; i < vertices.length; i += 3) {

            // convert terrain vert positions to correct grid-based values
            let xIndex = Math.floor(Math.abs((vertices[i] + (scale.x / 2)) / dx))
            let height = vertices[i+1]
            let zIndex = Math.floor(Math.abs((vertices[i+2]  + (scale.z / 2)) / dy))

            if (!columsRows.get(zIndex)) {
                columsRows.set(zIndex, new Map());
            }
            columsRows.get(zIndex).set(xIndex, height);
        }
        
        // store height data into column-major-order matrix array
        for (let i = 0; i < nsubdivs; ++i) {
            for (let j = 0; j < nsubdivs; ++j) {
                heights.push(columsRows.get(j).get(i));
            }
        }   

        let groundBodyDesc = (window as any).RAPIER.RigidBodyDesc.fixed();
        let groundBody = PhysicsManager.getInstance().physicsWorld.createRigidBody(groundBodyDesc);
        let groundCollider = (window as any).RAPIER.ColliderDesc.heightfield(
            nsubdivs -1 , nsubdivs -1, new Float32Array(heights), scale
        );
        PhysicsManager.getInstance().physicsWorld.createCollider(groundCollider, groundBody);
        groundBody.setTranslation(new (window as any).RAPIER.Vector3(this.meshObject.position.x, 0, this.meshObject.position.z), true)
        //groundBody.setRotation({w: 1, x: this.meshObject.rotation.x, y: this.meshObject.rotation.y, z: this.meshObject.rotation.z}, true)
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

        this.entities.forEach((entity) => {
            entity.visible = visible
        })
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