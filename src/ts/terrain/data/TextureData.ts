import * as THREE from "three"

export default class TextureData {

    private savedMinHeight: number = 0
    private savedMaxHeight: number = 0

    // constructor(
    //     meshHeightMulitplier: number,
    //     scale: number
    // ) {
    //     this.meshHeightMulitplier = meshHeightMulitplier
    //     this.uniformScale = scale
    // }
    
    applyMaterial(material: THREE.ShaderMaterial) {
        this.updateMeshHeight(material, this.savedMinHeight, this.savedMaxHeight)
    }

    public updateMeshHeight(material: THREE.ShaderMaterial, minHeight: number, maxHeight: number) {

        this.savedMinHeight = minHeight
        this.savedMaxHeight = maxHeight

        material.uniforms.minHeight.value = minHeight
        material.uniforms.maxHeight.value = maxHeight
    }
}