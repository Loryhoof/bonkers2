import * as THREE from 'three';
import PhysicsManager from './PhysicsManager';
import RAPIER from '@dimforge/rapier3d';
import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { groundMaterial } from './Ground';
import { loadGLB, randomBetween, randomFrom } from './Utils';
import { math } from './math';
import Tree from './Tree';
import EntityManager from './EntityManager';
import Barrel from './Barrel';


const treePrefab = await loadGLB('models/tree.glb') as any
const bushPrefab = await loadGLB('models/bush.glb') as any

let prefabs = [
    treePrefab,
    bushPrefab
]

const textureLoader = new THREE.TextureLoader() 

const ray = new THREE.Raycaster()





export default class Terrain {

    private scene: THREE.Scene

    constructor(scene: THREE.Scene) {
        this.scene = scene
        //this.init()
        //this.makeTerrain()
        this.init()
    }

    spawnTrees(amount: number, middle: THREE.Vector3, radius: number, terrainMesh: any) {
        const treeGeometry = new THREE.BoxGeometry(1, 1, 1); // Example geometry for trees
    
        for (let i = 0; i < amount; i++) {
            const theta = Math.random() * Math.PI * 2; // Random angle
            const r = Math.random() * radius; // Random radius within given radius
            const x = middle.x + r * Math.cos(theta);
            const z = middle.z + r * Math.sin(theta);
    
            ray.set(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0)); // Start raycast from above the terrain
    
            // Perform raycast
            const intersects = ray.intersectObject(terrainMesh, true);
    
            if (intersects.length > 0) {
                const treeMesh = new THREE.Mesh(treeGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
                treeMesh.position.copy(intersects[0].point); // Position the tree at the intersection point with the terrain
                terrainMesh.add(treeMesh);
            }
        }
    }
    


    async init() {
        const simplex = new SimplexNoise()

        //prefab
        let geom1 = new THREE.BoxGeometry(1,1,1)
        let mat1 = new THREE.MeshBasicMaterial({color: 0x00ff00})
        let prefab = new THREE.Mesh(geom1, mat1)
        //
        
        //plane

        let nsubdivs = 50
        let size = 500
        const scale = new THREE.Vector3(size, 5, size)
        const heights = []

        let geom = new THREE.PlaneGeometry(scale.x, scale.z, nsubdivs, nsubdivs)
        let mat = new THREE.MeshStandardMaterial({wireframe: true, color: 0xff00ff})
        mat = groundMaterial as any

        let mesh = new THREE.Mesh(geom, mat)
        mesh.rotation.x = -Math.PI / 2
        this.scene.add(mesh)
        
        const vertices = geom.attributes.position.array;
        const dx = scale.x / nsubdivs;
        const dy = scale.z / nsubdivs;
        // store height data in map column-row map
        const columsRows = new Map();

        let treeCount = 0   

        //console.log(bushModel)

        //console.log(bushModel.scene.children[0])

        // let bushInstancedMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshBasicMaterial, 5); 

        // if(bushModel.scene.children[0]) {
        //     bushInstancedMesh = new THREE.InstancedMesh(bushModel.scene.children[0].geometry, bushModel.scene.children[0].material, 5000);
        // }
        


        for (let i = 0; i < vertices.length; i += 3) {
            // translate into colum / row indices
            let xIndex = Math.floor(Math.abs((vertices as any)[i] + (scale.x / 2)) / dx);
            let zIndex = Math.floor(Math.abs((vertices as any)[i + 1] - (scale.z / 2)) / dy);

            let x = vertices[i]
            let y = vertices[i+1]
            let z = vertices[i+2]

            
            // generate height for this column & row
            const randomHeight = simplex.noise(xIndex * 0.05, zIndex * 0.1) as any
            (vertices as any)[i + 2] = scale.y * randomHeight;


            //make box and spawn on terrain randomly
            let height = scale.y * randomHeight

            // if(Math.random() > 0) {
            //     //console.log(height)
            //     let p = prefab.clone()
            //     p.position.set(x + Math.random() * 10, y + Math.random() * 10, height)
            //     treeCount++
            //     mesh.add(p)
            // }
            // if(Math.random() > 0.7) {
            //     let height = scale.y * randomHeight
            //     console.log(height)

            //     let p = randomFrom(prefabs).scene.clone()

            //     if(p instanceof Tree) {}

            //     p.position.set(x, y, height)
            //     const boxPosition = new THREE.Vector3(x, y, height).applyEuler(mesh.rotation).add(mesh.position);
            //     p.position.copy(boxPosition)
            //     treeCount++
            //     this.scene.add(p)
            // }
            if(Math.random() > 0.9) {
                let val = Math.random()
                if (val < 0.4) {
                    let height = scale.y * randomHeight
                  
                    let prefab = treePrefab.scene.clone()
                    let p = new Tree(prefab)
                    EntityManager.getInstance().add(p)
    
                    p.position.set(x, y, height)
                    const boxPosition = new THREE.Vector3(x, y, height).applyEuler(mesh.rotation).add(mesh.position);
                    p.position.copy(boxPosition)
                    treeCount++
                    this.scene.add(p)
                    p.init()
                }
                else if (val < 0.5) {
                    let height = scale.y * randomHeight
                  
                    let p = new Barrel()
                    
    
                    p.position.set(x, y, height)
                    const boxPosition = new THREE.Vector3(x, y, height).applyEuler(mesh.rotation).add(mesh.position);
                    p.position.copy(boxPosition)
                    treeCount++
                    this.scene.add(p)
                }
                else if (val < 0.6) {
                    let height = scale.y * randomHeight
                  
                    let p = bushPrefab.scene.clone()
                    
    
                    p.position.set(x, y, height)
                    const boxPosition = new THREE.Vector3(x, y, height).applyEuler(mesh.rotation).add(mesh.position);
                    p.position.copy(boxPosition)
                    treeCount++
                    this.scene.add(p)
                }
                else if (val < 0.7) {
                    let height = scale.y * randomHeight
                  
                    let p = new THREE.Mesh(new THREE.BoxGeometry(3,3,3), new THREE.MeshStandardMaterial({color: 0x757575}))
                    
    
                    p.position.set(x, y, height)
                    const boxPosition = new THREE.Vector3(x, y, height).applyEuler(mesh.rotation).add(mesh.position);
                    p.position.copy(boxPosition)
                    treeCount++
                    this.scene.add(p)
                }
            }

            // if(i < 5000) {
            //     const matrix = new THREE.Matrix4().makeTranslation(x, y, (scale.y * randomHeight) + 0.5);
            //     bushInstancedMesh.setMatrixAt(i, matrix);
            // }
            
            

            // if(Math.random() > 0) {
            //     //console.log(height)
            //     let tree = model.scene.clone()
                
            //     tree.position.set(x + Math.random() * 5, y + Math.random() * 5, height)
                
            //     treeCount++
            //     mesh.add(tree)
            //     tree.rotateX(Math.PI / 2)
            // }
            

            // store height
            if (!columsRows.get(zIndex)) {
                columsRows.set(zIndex, new Map());
            }
            columsRows.get(zIndex).set(xIndex, randomHeight);
        }
        geom.computeVertexNormals();
        
        console.log(treeCount, "trees")
        // store height data into column-major-order matrix array
        for (let i = 0; i <= nsubdivs; ++i) {
            for (let j = 0; j <= nsubdivs; ++j) {
                heights.push(columsRows.get(j).get(i));
            }
        }   

        // bushInstancedMesh.instanceMatrix.needsUpdate = true;
        // mesh.add(bushInstancedMesh)

        // for (let i = 0; i < 100; i++) {
        //     let x = randomBetween(-100, 100)
        //     let z = randomBetween(-100, 100)
        //     let y = getHeightAtPosition(x, z, mesh)
        //     console.log(y)
        //     let p = prefab.clone()
        //     //p.position.set(x, y, z)
        //     this.scene.add(p)
        // }

        

        
        //add to scene

        let groundBodyDesc = RAPIER.RigidBodyDesc.fixed();
        let groundBody = PhysicsManager.getInstance().physicsWorld.createRigidBody(groundBodyDesc);
        let groundCollider = RAPIER.ColliderDesc.heightfield(
            nsubdivs, nsubdivs, new Float32Array(heights), scale
        );
        PhysicsManager.getInstance().physicsWorld.createCollider(groundCollider, groundBody);

        //this.spawnTrees(5000, new THREE.Vector3(0,0,0), 500, mesh)

    }
}