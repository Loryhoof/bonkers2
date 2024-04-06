
export default class TerrainData {

    public meshHeightMulitplier: number = 25
    public uniformScale: number = 5

    constructor(
        meshHeightMulitplier: number,
        scale: number
    ) {
        this.meshHeightMulitplier = meshHeightMulitplier
        this.uniformScale = scale
    }
}