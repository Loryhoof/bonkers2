import * as THREE from 'three';

export default class MeshGenerator {
    public static generateTerrainMesh(heightMap: number[][], heightMultiplier: number, levelOfDetail: number) {
        const width = heightMap.length;
        const height = heightMap.length > 0 ? heightMap[0].length : 0;
        const topLeftX = (width - 1) / -2;
        const topLeftZ = (height - 1) / 2;
        
        function smoothHeightCurve(value: number) {
            // Define the height modifiers for different ranges
            const heightModifiers = [1, 1, 0.8, 0.5, 0.2, 0];
            //const heightModifiers = [0, 0.2, 0.5, 0.8, 1, 1];
        
            // Cubic interpolation function
            function cubicInterpolate(t: number, a: number, b: number, c: number, d: number) {
                const p = (d - c) - (a - b);
                return t * t * t * p + t * t * (a - b - p) + t * (c - a) + b;
            }
        
            // Determine the range of the value and apply cubic interpolation
            if (value <= 0.3) {
                return 0; // Keep it flat for water
            } else if (value <= 0.5) {
                return cubicInterpolate(value, 0, heightModifiers[2], 0.5, 0); // Smooth transition for lower terrain
            } else if (value <= 0.7) {
                return cubicInterpolate(value, heightModifiers[2], heightModifiers[3], 0.5, 0); // Gradual transition for mid-level terrain
            } else {
                return cubicInterpolate(value, heightModifiers[3], heightModifiers[4], 0.7, 0); // Maintain higher terrain
            }
        }

        const meshSimplificationIncrement = levelOfDetail == 0 ? 1 : levelOfDetail * 2
        const verticesPerLine = (width-1) / meshSimplificationIncrement + 1

        const meshData = new MeshData(verticesPerLine, verticesPerLine);
        let vertexIndex = 0;

        for (let y = 0; y < height; y += meshSimplificationIncrement) {
            for (let x = 0; x < width; x += meshSimplificationIncrement) {
                let heights = heightMap[y][x]
                let v = 0
                if(heights < 0.5) {
                    v = 0
                }
                else {
                    v = heights
                }
                meshData.vertices[vertexIndex] = new THREE.Vector3(topLeftX + x, v * heightMultiplier, topLeftZ - y);
                meshData.uvs[vertexIndex] = new THREE.Vector2(x / width, y / height);

                if (x < width - 1 && y < height - 1) {
                    meshData.addTriangle(vertexIndex, vertexIndex + verticesPerLine + 1, vertexIndex + verticesPerLine);
                    meshData.addTriangle(vertexIndex + verticesPerLine + 1, vertexIndex, vertexIndex + 1);
                }

                vertexIndex++;
            }
        }

        return meshData
    }
}

class MeshData {
    public vertices: THREE.Vector3[] = [];
    public triangles: number[] = [];
    public uvs: THREE.Vector2[] = [];
    private triangleIndex: number = 0;

    constructor(meshWidth: number, meshHeight: number) {
        this.vertices = new Array<THREE.Vector3>(meshWidth * meshHeight);
        this.uvs = new Array<THREE.Vector2>(meshWidth * meshHeight);
        this.triangles = new Array<number>((meshWidth - 1) * (meshHeight - 1) * 6);
    }

    public addTriangle(a: number, b: number, c: number) {
        this.triangles[this.triangleIndex] = a;
        this.triangles[this.triangleIndex + 1] = b;
        this.triangles[this.triangleIndex + 2] = c;
        this.triangleIndex += 3;
    }

    public createMesh(): THREE.Mesh {
        const geometry = new THREE.BufferGeometry();

        // Convert vertices and triangles arrays into Float32Arrays
        const verticesArray = this.vertices.flatMap(vertex => [vertex.x, vertex.y, vertex.z]);
        const trianglesArray = new Uint32Array(this.triangles);

        // Set positions attribute
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesArray), 3));

        // Set indices attribute (for triangles)
        geometry.setIndex(new THREE.BufferAttribute(trianglesArray, 1));

        // Set UVs attribute
        const uvsArray = this.uvs.flatMap(uv => [uv.x, uv.y]);
        geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvsArray), 2));

        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const mesh = new THREE.Mesh(geometry, material);

        return mesh;
    }
}
