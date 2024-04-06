import * as THREE from 'three';
import MeshData from './data/MeshData';

export default class MeshGenerator {
    public static generateTerrainMesh(heightMap: number[][], heightMultiplier: number, levelOfDetail: number) {
        const width = heightMap.length;
        const height = heightMap[0].length;

        const topLeftX = (width - 1) / -2;
        const topLeftZ = (height - 1) / 2;

        const meshSimplificationIncrement = levelOfDetail == 0 ? 1 : levelOfDetail * 2;
        const verticesPerLine = Math.ceil((width - 1) / meshSimplificationIncrement) + 1;

        const meshData = new MeshData(verticesPerLine, verticesPerLine);
        let vertexIndex = 0;

        for (let y = 0; y < height; y += meshSimplificationIncrement) {
            for (let x = 0; x < width; x += meshSimplificationIncrement) {
                meshData.vertices[vertexIndex] = new THREE.Vector3(topLeftX + x, heightMap[x][y] * heightMultiplier, topLeftZ - y);
                meshData.uvs[vertexIndex] = new THREE.Vector2(x / (width - 1), y / (height - 1));

                if (x < width - 1 && y < height - 1) {
                    meshData.addTriangle(vertexIndex, vertexIndex + verticesPerLine + 1, vertexIndex + verticesPerLine);
                    meshData.addTriangle(vertexIndex + verticesPerLine + 1, vertexIndex, vertexIndex + 1);

                    //meshData.addTriangle(vertexIndex, vertexIndex + width, vertexIndex + width + 1);
                    //meshData.addTriangle(vertexIndex, vertexIndex + width + 1, vertexIndex + 1);
                }

                vertexIndex++;
            }
        }

        return meshData;
    }
}

