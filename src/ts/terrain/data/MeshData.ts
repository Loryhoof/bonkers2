import * as THREE from 'three'
import { randomBetween, randomFrom } from '../../Utils';

export default class MeshData {
    public vertices: THREE.Vector3[] = [];
    public triangles: number[] = [];
    public uvs: THREE.Vector2[] = [];
    public triangleIndex: number = 0;
    public meshWidth: number
    public meshHeight: number

    constructor(meshWidth: number, meshHeight: number) {
        this.meshWidth = meshWidth
        this.meshHeight = meshHeight
        this.vertices = new Array<THREE.Vector3>(meshWidth * meshHeight);
        this.uvs = new Array<THREE.Vector2>(meshWidth * meshHeight);
        this.triangles = new Array<number>((meshWidth - 1) * (meshHeight - 1) * 6);
    }

    public updateMeshHeight(material: THREE.ShaderMaterial, minHeight: number, maxHeight: number) {
        material.uniforms.minHeight.value = minHeight
        material.uniforms.maxHeight.value = maxHeight
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
        const uvsArray = this.uvs.flatMap(uv => [uv.y, uv.y]);
        geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvsArray), 2));

        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const mesh = new THREE.Mesh(geometry, material);

        return mesh;
    }
}