
import Noise from '../Noise';
import MeshData from '../data/MeshData'
import * as THREE from 'three'

function generateMapData(mapChunkSize, noiseData, terrainData, center, useFalloff, falloffMap) {
   
    //console.log(center)
    let newOffset = new THREE.Vector2()
    newOffset.copy(noiseData.offset).add(center)

    //console.log(newOffset)
    const noiseMap = new Noise().generateNoiseMap(mapChunkSize, mapChunkSize, noiseData.seed, noiseData.noiseScale, noiseData.octaves, noiseData.persistance, noiseData.lacunarity, newOffset);

    //console.log(noiseMap)
    if(useFalloff) {
        for (let y = 0; y < mapChunkSize; y++) {
            for (let x = 0; x < mapChunkSize; x++) {
                noiseMap[x][y] = THREE.MathUtils.clamp(noiseMap[x][y] - falloffMap[x][y], 0, 1)
            }
        }
    }

    return noiseMap;
}

function generateTerrainMesh(heightMap, heightMultiplier = 15, levelOfDetail = 6) {

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
            //let tempy = heightMap[x][y] * heightMultiplier
            meshData.vertices[vertexIndex] = new THREE.Vector3(topLeftX + x, heightMap[x][y] * heightMultiplier, topLeftZ - y);
            meshData.uvs[vertexIndex] = new THREE.Vector2(x / (width - 1), y / (height - 1));

            if (x < width - 1 && y < height - 1) {
                meshData.addTriangle(vertexIndex, vertexIndex + verticesPerLine + 1, vertexIndex + verticesPerLine);
                meshData.addTriangle(vertexIndex + verticesPerLine + 1, vertexIndex, vertexIndex + 1);

                //meshData.addTriangle(vertexIndex, vertexIndex + verticesPerLine, vertexIndex + verticesPerLine + 1);
                //meshData.addTriangle(vertexIndex, vertexIndex + verticesPerLine + 1, vertexIndex + 1);
            }

            vertexIndex++;
        }
    }

    return meshData;
}

self.onmessage = (event) => {

    const { mapChunkSize, noiseData, terrainData, levelOfDetail, requestId, center, useFalloff, falloffMap  } = event.data;

    let mapData = generateMapData(mapChunkSize, noiseData, terrainData, center, useFalloff, falloffMap);

    let result = generateTerrainMesh(mapData, terrainData.meshHeightMulitplier, levelOfDetail)

    self.postMessage({data: result, requestId: requestId, noiseData: mapData});
};
