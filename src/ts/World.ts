import * as THREE from 'three'
import PhysicsManager from './PhysicsManager'
import { sky } from './Sky'
import { groundMaterial } from './Ground'
import Player from './Player'
import Pistol from './Pistol'
import UIManager from './UIManager'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadGLB, randomBetween } from './Utils'
import Tree from './Tree'
import Forest from './Forest'
import EntityManager from './EntityManager'
import RAPIER from '@dimforge/rapier3d'
import Ocean from './Ocean'
import { SimplexNoise } from 'three/examples/jsm/Addons.js'
import Terrain from './Terrain'
import Enemy from './Enemy'

const loader = new GLTFLoader()

export default class World {

    public readonly camera: THREE.PerspectiveCamera
    public readonly physics: PhysicsManager
    public readonly ui: UIManager
    public readonly scene: THREE.Scene
    public readonly entityManager: EntityManager

    private static instance: World
    
    constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        this.camera = camera
        this.scene = scene
        this.physics = PhysicsManager.getInstance()
        this.entityManager = EntityManager.getInstance()
        this.ui = UIManager.getInstance()
    }

    async initialize() {

        //const geometry = new THREE.BoxGeometry(3, 3, 3)
        //const material = new THREE.MeshStandardMaterial({color: 0xff0000})



        //let cube = new THREE.Mesh(geometry, material)
        //cube.position.z = -15
        //cube.position.y = 1

        //this.physics.createFixedBox(cube.position, new THREE.Vector3(1.5,1.5,1.5))

        const light = new THREE.DirectionalLight(0xffffff);
        // light.position.set(0, 2, 2);
        // light.target.position.set(0, 0, 0);
        // const d = 50;
        // //light.castShadow = true;
        // light.shadow.camera.left = - d;
        // light.shadow.camera.right = d;
        // light.shadow.camera.top = d;
        // light.shadow.camera.bottom = - d;
        
        // light.shadow.camera.near = 1;
        // light.shadow.camera.far = 20;

        
        light.position.set(0, 4, 2)

        const ambientLight = new THREE.AmbientLight(0xffffff, 2)

        this.scene.add(ambientLight)
        this.scene.add(light)
        //this.scene.fog = new THREE.Fog( 0xcccccc, 10, 15 );
        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.02)
        //this.scene.add()
        //this.scene.add(cube)

        this.scene.add(sky)

        const planeGeo = new THREE.PlaneGeometry(1000, 1000)

        const ground = new THREE.Mesh(planeGeo, groundMaterial)
        ground.rotation.x -= Math.PI/2;
        ground.position.y = 0.5

        //this.physics.createFixedBox(ground.position, new THREE.Vector3(1000, ground.position.y - 0.5, 1000))
        //this.scene.add(ground)

        let player = new Player(this.scene, this.camera)
        this.entityManager.add(player)
        this.scene.add(player)

        let enemy = new Enemy(this.scene)
        this.entityManager.add(enemy)
        this.scene.add(enemy)
        enemy.setTarget(player)

        let enemy2 = new Enemy(this.scene)
        this.entityManager.add(enemy2)
        this.scene.add(enemy2)
        enemy2.setTarget(player)

        let enemy3 = new Enemy(this.scene)
        this.entityManager.add(enemy3)
        this.scene.add(enemy3)
        enemy3.setTarget(enemy3)

        const terrain = new Terrain(this.scene)

        //let nsubdivs = 100;
        //let scale = new RAPIER.Vector3(100.0, 10.0, 100.0);
        //this.generateTerrain(nsubdivs, scale);
        //this.generateTerrain(100, 100, 20)
    }
    
    async generateTerrain(nsubdivs: number, scale: { x: number; y: number; z: number }) {

        const model = await loadGLB('models/tree.glb') as any        
        const simplex = new SimplexNoise();

        const heights = []
      
        // Create a plane geometry for the terrain
        const threeFloor = new THREE.Mesh(
          new THREE.PlaneGeometry(scale.x, scale.z, nsubdivs, nsubdivs),
          groundMaterial // Assuming groundMaterial is defined elsewhere
        );
      
        // Rotate the plane 90 degrees along the X-axis (makes z the "up" direction)
        threeFloor.rotateX(- Math.PI / 2);
      
        // Add the plane to the scene
        this.scene.add(threeFloor);
      
        // Get access to the vertex position data of the plane geometry
        const vertices = threeFloor.geometry.attributes.position.array;
      
        // Calculate the size of each grid cell based on subdivisions and scale
        const dx = scale.x / nsubdivs;
        const dy = scale.z / nsubdivs;
      
        // Create a Map to store height data in a column-row format
        const columsRows = new Map();
      
        // Loop through all vertices of the plane geometry
        for (let i = 0; i < vertices.length; i += 3) {
          // Calculate flipped column and row indices due to rotation
          const row = Math.floor(Math.abs(vertices[i] + (scale.x / 2)) / dx); // Use x for row
          const column = Math.floor(Math.abs(vertices[i + 1] - (scale.z / 2)) / dy); // Use z for column
      
          const xPos = vertices[i + 0]; // x position of the current vertex
          const zPos = vertices[i + 1]; // z position of the current vertex

      
          // Generate a random height value using Simplex noise
          const randomHeight = simplex.noise(xPos * 0.05, zPos * 0.05);
      
          // Update the y position of the vertex based on the generated height
          vertices[i + 2] = randomHeight * scale.y;

        //   const mesh = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshBasicMaterial())
        //   const boxPosition = new THREE.Vector3(xPos, zPos, randomHeight * scale.y).applyEuler(threeFloor.rotation).add(threeFloor.position);
        //   mesh.position.copy(boxPosition)
          //this.scene.add(mesh)

        //   let tree = new Tree(model.scene.clone())
        //   tree.position.copy(boxPosition)
        //   this.scene.add(tree)

          //mesh.updateMatrixWorld()


        //   placeMeshesAtVertices(vertices)
      
          // Store the height value in the columsRows map with flipped indices
          if (!columsRows.get(column)) {
            columsRows.set(column, new Map());
          }
          columsRows.get(column).set(row, randomHeight);
        }

        //placeMeshesAtVertices(vertices)
      
        // Calculate vertex normals for proper shading (optional, might be done elsewhere)
        threeFloor.geometry.computeVertexNormals();

        // store height data into column-major-order matrix array
        for (let i = 0; i <= nsubdivs; ++i) {
            for (let j = 0; j <= nsubdivs; ++j) {
                heights.push(columsRows.get(j).get(i));
            }
        }

        //console.log(heights)

        

        //THREE.BufferGeometry
    
        let groundBodyDesc = RAPIER.RigidBodyDesc.fixed();
        let groundBody = PhysicsManager.getInstance().physicsWorld.createRigidBody(groundBodyDesc);
        let groundCollider = RAPIER.ColliderDesc.heightfield(
            nsubdivs, nsubdivs, new Float32Array(heights), scale
        );
        PhysicsManager.getInstance().physicsWorld.createCollider(groundCollider, groundBody);

        const numBoxes = 1000; // Adjust as needed
        const boxSize = 1; // Adjust as needed
        const minY = 0; // Minimum height for box placement 

        for (let i = 0; i < numBoxes; i++) {
            let randomX, randomZ, randomY;
            do {
                randomX = Math.random() * scale.x - (scale.x / 2);
                randomZ = Math.random() * scale.z - (scale.z / 2);
                //console.log(randomX, randomZ)
                //randomY = getHeightAt(randomX, randomZ, nsubdivs, scale, columsRows);
                //randomY = 0
                //console.log(randomY)
                randomY = getHeightAtPositionPog(randomX, randomZ, heights, 100, 10, nsubdivs)
                

                //console.log(randomX,)
                
                //console.log(randomY)

                console.log(randomY)
                //console.log(randomX, randomZ)
            } while (randomY < minY); // Ensure box is not placed below minY

            const box = new THREE.Mesh(
                new THREE.BoxGeometry(boxSize, boxSize, boxSize),
                new THREE.MeshNormalMaterial()
            );
            //box.position.set(randomX, randomY + (boxSize / 2),randomZ);

            //const mesh = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshBasicMaterial())
            const boxPosition = new THREE.Vector3(randomX, randomZ, randomY).applyEuler(threeFloor.rotation).add(threeFloor.position);
            
            box.position.copy(boxPosition)
            //this.scene.add(mesh)

            this.scene.add(box);
        }

        function getHeightAtPositionPog(x: number, z: number, heightData: number[], terrainSize: number, maxHeight: number, nsubdivs: number): number | null {
            // Convert x and z coordinates to terrain grid indices
            const gridX = Math.floor((x / terrainSize + 0.5) * nsubdivs);
            const gridZ = Math.floor((z / terrainSize + 0.5) * nsubdivs);
        
            // Check if the provided coordinates are within the bounds of the terrain
            if (gridX < 0 || gridX >= nsubdivs || gridZ < 0 || gridZ >= nsubdivs) {
                return null; // Coordinates are outside the terrain bounds
            }
        
            // Calculate the index of the height value in the height data array
            const index = gridZ * (nsubdivs + 1) + gridX;
        
            // Retrieve the height value from the height data array
            const height = heightData[index];
        
            // Scale the height value to match the maximum terrain height
            return height * maxHeight;
        }
        
        

        function ssb(x, z, scale, columsRows) {
            // Calculate the size of each grid cell based on subdivisions and scale
            const dx = scale.x / nsubdivs;
            const dy = scale.z / nsubdivs;
        
            // Calculate flipped column and row indices due to rotation
            const row = Math.floor(Math.abs(x + (scale.x / 2)) / dx); // Use x for row
            const column = Math.floor(Math.abs(z - (scale.z / 2)) / dy); // Use z for column
        
            // Retrieve the heights of neighboring vertices
            const topLeftHeight = getVertexHeight(column, row, scale, columsRows);
            const topRightHeight = getVertexHeight(column, row + 1, scale, columsRows);
            const bottomLeftHeight = getVertexHeight(column + 1, row, scale, columsRows);
            const bottomRightHeight = getVertexHeight(column + 1, row + 1, scale, columsRows);
        
            // If any of the heights is null, return null
            if (topLeftHeight === null || topRightHeight === null || bottomLeftHeight === null || bottomRightHeight === null) {
                return null;
            }
        
            // Interpolate the height using bilinear interpolation
            const xRatio = (x - ((column * dx) - (scale.x / 2))) / dx;
            const zRatio = (z - ((row * dy) - (scale.z / 2))) / dy;
        
            const topHeight = topLeftHeight * (1 - xRatio) + topRightHeight * xRatio;
            const bottomHeight = bottomLeftHeight * (1 - xRatio) + bottomRightHeight * xRatio;
        
            return topHeight * (1 - zRatio) + bottomHeight * zRatio;
        }
        
        function getVertexHeight(column, row, scale, columsRows) {
            if (columsRows.has(column) && columsRows.get(column).has(row)) {
                return columsRows.get(column).get(row);
            } else {
                return null; // Return null if the vertex does not exist
            }
        }
        

        

        function findHeightAtPositions(xPos, zPos, nsubdivs, scale, vertices) {
            // Calculate the index of the vertex in the array
            const index = Math.floor((zPos / scale.z + 0.5) * nsubdivs) * (nsubdivs + 1) + Math.floor((xPos / scale.x + 0.5) * nsubdivs);
            
            // Retrieve the Y height from the vertex array
            const y = vertices[index * 3 + 2]; // Y coordinate is at index * 3 + 1
        
            return y;
        }

        function ss(xPos, zPos, nsubdivs, scale, columsRows) {
            const dx = scale.x / nsubdivs;
            const dy = scale.z / nsubdivs;
        
            // Calculate column and row indices of the lower-left vertex of the triangle containing the point
            const columnIndex = Math.floor((xPos / scale.x + 0.5) * nsubdivs); // Map X to column
            const rowIndex = Math.floor((-zPos / scale.z + 0.5) * nsubdivs); // Map Z to row
        
            // Calculate the fractional position of the point within the triangle
            const xFraction = (xPos / scale.x + 0.5) * nsubdivs - columnIndex;
            const zFraction = (-zPos / scale.z + 0.5) * nsubdivs - rowIndex;
        
            // Retrieve the heights of the vertices of the triangle
            const heights = [
                getHeightAtVertex(columnIndex, rowIndex, columsRows),
                getHeightAtVertex(columnIndex + 1, rowIndex, columsRows),
                getHeightAtVertex(columnIndex, rowIndex + 1, columsRows)
            ];
        
            // Interpolate the height using barycentric coordinates
            const height = heights[0] * (1 - xFraction - zFraction) +
                           heights[1] * xFraction +
                           heights[2] * zFraction;
        
            return height * scale.y;
        }
        
        function getHeightAtVertex(column, row, columsRows) {
            const columnMap = columsRows.get(column);
            if (columnMap) {
                const height = columnMap.get(row);
                if (height !== undefined) {
                    return height;
                }
            }
            return 0; // Defaulting to 0 if height data is not found
        }

        function findHeightAtPosition(xPos: number, zPos: number, nsubdivs: number, scale: any, columsRows: any) {
            const dx = scale.x / nsubdivs;
            const dy = scale.z / nsubdivs;
        
            // Calculate flipped column and row indices due to rotation
            const row = Math.floor(Math.abs(xPos + (scale.x / 2)) / dx); // Use x for row
            const column = Math.floor(Math.abs(zPos - (scale.z / 2)) / dy); // Use z for column
        
            // Get the height value from the Map
            const columnMap = columsRows.get(column);
            if (columnMap) {
                const height = columnMap.get(row);
                if (height !== undefined) {
                    return height * scale.y;
                }
            }
        
            // If exact height is not found, you might want to interpolate or handle this case based on your requirement
            return null; // Or handle the case differently based on your needs
        }
        

        function d(x: number, z: number, nsubdivs: number, scale: {x: number, y: number, z: number}, vertices: any) {
            // Calculate the size of each grid cell based on subdivisions and scale
            const dx = scale.x / nsubdivs;
            const dy = scale.z / nsubdivs;
        
            // Calculate the column and row indices of the grid cell
            const row = Math.floor((x + scale.x / 2) / dx);
            const column = Math.floor((z + scale.z / 2) / dy);
        
            // Determine the indices of the four surrounding vertices
            const topLeftIndex = (column * (nsubdivs + 1) + row) * 3;
            const topRightIndex = topLeftIndex + 3;
            const bottomLeftIndex = ((column + 1) * (nsubdivs + 1) + row) * 3;
            const bottomRightIndex = bottomLeftIndex + 3;
        
            // Get the positions of the four surrounding vertices
            const topLeft = new THREE.Vector3(vertices[topLeftIndex], vertices[topLeftIndex + 1], vertices[topLeftIndex + 2]);
            const topRight = new THREE.Vector3(vertices[topRightIndex], vertices[topRightIndex + 1], vertices[topRightIndex + 2]);
            const bottomLeft = new THREE.Vector3(vertices[bottomLeftIndex], vertices[bottomLeftIndex + 1], vertices[bottomLeftIndex + 2]);
            const bottomRight = new THREE.Vector3(vertices[bottomRightIndex], vertices[bottomRightIndex + 1], vertices[bottomRightIndex + 2]);
        
            // Interpolate to find the height at the given position
            const fracX = (x + scale.x / 2 - row * dx) / dx;
            const fracZ = (z + scale.z / 2 - column * dy) / dy;
        
            // Bilinear interpolation
            const topInterpolated = new THREE.Vector3().lerpVectors(topLeft, topRight, fracX);
            const bottomInterpolated = new THREE.Vector3().lerpVectors(bottomLeft, bottomRight, fracX);
            const interpolatedHeight = THREE.MathUtils.lerp(topInterpolated.y, bottomInterpolated.y, fracZ);
        
            return interpolatedHeight;
        }

        function getYPosition(x: number, z: number, scale: { x: number, y: number, z: number }, nsubdivs: number, heights: number[]): number {
            // Convert (x, z) coordinates to the range [-scale.x/2, scale.x/2] and [-scale.z/2, scale.z/2]
            const normalizedX = (x + scale.x / 2) / scale.x;
            const normalizedZ = (z + scale.z / 2) / scale.z;
        
            // Calculate the index of the height data corresponding to the vertex below and to the right of the point
            const indexX0 = Math.floor(normalizedX * nsubdivs);
            const indexX1 = Math.min(indexX0 + 1, nsubdivs);
            const indexZ0 = Math.floor(normalizedZ * nsubdivs);
            const indexZ1 = Math.min(indexZ0 + 1, nsubdivs);
        
            // Interpolate along both X and Z axes
            const tX = normalizedX * nsubdivs - indexX0;
            const tZ = normalizedZ * nsubdivs - indexZ0;
        
            // Interpolate along the X axis
            const y0 = heights[indexZ0 * (nsubdivs + 1) + indexX0];
            const y1 = heights[indexZ0 * (nsubdivs + 1) + indexX1];
            const y2 = heights[indexZ1 * (nsubdivs + 1) + indexX0];
            const y3 = heights[indexZ1 * (nsubdivs + 1) + indexX1];
        
            const interpolatedYX0 = y0 + (y1 - y0) * tX;
            const interpolatedYX1 = y2 + (y3 - y2) * tX;
        
            // Interpolate along the Z axis
            const interpolatedY = interpolatedYX0 + (interpolatedYX1 - interpolatedYX0) * tZ;
        
            // Scale the interpolated height to match the actual y scale
            const yPos = scale.y * interpolatedY;
        
            return yPos;
        }

        

        // function getHeightAt(x: number, z: number, nsubdivs: number, scale: { x: number; y: number; z: number }) {
        //     // Calculate column and row indices from x and z coordinates
        //     const dx = scale.x / nsubdivs;
        //     const dy = scale.z / nsubdivs;
        //     const column = Math.floor(Math.abs(x - (scale.x / 2)) / dx);
        //     const row = Math.floor(Math.abs(z + (scale.z / 2)) / dy); // Use z for row calculation
          
        //     // Retrieve height value or 0 if not found
        //     return 2 + columsRows.get(column)?.get(row) ?? 0 * scale.y; 
        //   }

        // efunction getHeightAt(x:number, z:number, nsubdivs:number, scale: any) {
        //     // Calculate column and row indices from x and z coordinates
        //     const dx = scale.x / nsubdivs;
        //     const dy = scale.z / nsubdivs;
        //     const column = Math.floor(Math.abs(x + (scale.x / 2)) / dx);
        //     const row = Math.floor(Math.abs(z - (scale.z / 2)) / dy);
          
        //     // Check if column-row data exists in the map
        //     // if (!generateTerrain.columsRows?.get(column)) {
        //     //   return 0; // Handle case where x, z are outside terrain bounds (optional)
        //     // }
          
        //     const heightMap = columsRows.get(column);
        //     const height = heightMap?.get(row);
          
        //     // Return the height value or 0 if not found
        //     return height === undefind ? 0 : height * scale.y;
        //   }

        function getHeightAtPosition(xPos: number, zPos: number, nsubdivs: number, columnRows: any, scale: {x: number, y: number, z: number}) {
            // Calculate column and row indices
            const dx = scale.x / nsubdivs;
            const dy = scale.z / nsubdivs;
            const column = Math.floor(Math.abs(xPos + (scale.x / 2)) / dx);
            const row = Math.floor(Math.abs(zPos - (scale.z / 2)) / dy);
        
            // Retrieve height from stored data
            const heightMap = columsRows.get(column);
            if (heightMap) {
                const randomHeight = heightMap.get(row);
                if (randomHeight !== undefined) {
                    return scale.y * randomHeight;
                }
            }
            
            // Default height if position is not found
            return 0;
        }
        

        //la.rotateY(Math.PI / 2)
        //this.scene.add(la)

        // Function to get Y-coordinate at given position
        // function getYAtPosition(x: number, z: number, heights: number[], scale: { x: number, y: number, z: number }) {
        //     const dx = scale.x / (nsubdivs); // Corrected indexing
        //     const dz = scale.z / (nsubdivs); // Corrected indexing
        //     const row = Math.floor((x + scale.x / 2) / dx);
        //     const col = Math.floor((-z + scale.z / 2) / dz);
        //     const index = col * (nsubdivs + 1) + row;
        //     const height = heights[index];
        //     return height !== undefined ? height * scale.y : 0;
        // }

        function getYAtPosition(x: number, z: number, heights: number[], scale: { x: number, y: number, z: number }) {
            const dx = scale.x / (nsubdivs); // Corrected indexing
            const dz = scale.z / (nsubdivs); // Corrected indexing
            let rotAngl = Math.PI / 2
            // Adjust x and z coordinates based on terrain rotation
            // Assuming terrain is rotated around the Y-axis
            const rotatedX = Math.cos(rotAngl) * x + Math.sin(rotAngl) * z;
            const rotatedZ = -Math.sin(rotAngl) * x + Math.cos(rotAngl) * z;
        
            const row = Math.floor((rotatedX + scale.x / 2) / dx);
            const col = Math.floor((-rotatedZ + scale.z / 2) / dz);
        
            const index = col * (nsubdivs + 1) + row;
            const height = heights[index];
        
            return height !== undefined ? height * scale.y : 0;
        }
        

        // function getHeightAtPosition(x: number, z: number, geometry: any, scale: any) {
        //     // Get the dimensions of the terrain
        //     const width = scale.x;
        //     const depth = scale.z;
        
        //     // Calculate the normalized coordinates within the terrain
        //     const u = (x + width / 2) / width;
        //     const v = (z + depth / 2) / depth;
        
        //     // Convert normalized coordinates to terrain indices
        //     const row = Math.floor(u * (geometry.parameters.widthSegments + 1));
        //     const col = Math.floor(v * (geometry.parameters.heightSegments + 1));
        
        //     // Get the height from the terrain geometry
        //     const index = col * (geometry.parameters.widthSegments + 1) + row;
        //     const position = new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, index);

        //     //const rotatedPosition = new THREE.Vector3(position.y, position.z, position.x);
        //     let rot = rotateVector(position)
        //     const rotatedPosition = new THREE.Vector3(rot.z, rot.y, rot.x);
        //     return rot
        // }

        

        // Function to get the height at a given (x, z) position on the terrain
        // function getHeightAtPosition(x: number, z: number, geometry: any, scale: any) {
        //     const width = scale.x;
        //     const depth = scale.z;
        
        //     // Calculate the normalized coordinates within the terrain
        //     const u = (x + width / 2) / width;
        //     const v = (z + depth / 2) / depth;
        
        //     // Convert normalized coordinates to terrain indices
        //     const row = Math.floor(u * (geometry.parameters.widthSegments + 1));
        //     const col = Math.floor(v * (geometry.parameters.heightSegments + 1));
        
        //     // Calculate the index of the vertex in the geometry's position attribute
        //     const vertexIndex = col * (geometry.parameters.widthSegments + 1) + row;
        
        //     // Retrieve the position of the vertex from the geometry
        //     const position = new THREE.Vector3();
        //     const positionAttribute = geometry.getAttribute('position');
        //     position.setX(positionAttribute.getZ(vertexIndex)); // Swap X and Z
        //     position.setY(positionAttribute.getY(vertexIndex));
        //     position.setZ(positionAttribute.getX(vertexIndex)); // Swap X and Z
        
        //     // Return the height (Y-coordinate) of the vertex
        //     return position
        // }

        

    }

    

    spawnTrees() {
        let forest = new Forest(250)
        this.scene.add(forest)
        this.entityManager.add(forest)
    }

    update(elapsedTime: number, deltaTime: number) {

        

        this.entityManager.update(elapsedTime, deltaTime)

        this.physics.update(elapsedTime, deltaTime)
        
        this.ui.update()
    }
}