import ItemType from "../enums/ItemType"

export default class Bullet {
    
    public readonly quantity: number
    public readonly name: string
    public readonly item_type: ItemType
    public readonly image: string
    public readonly passive: boolean

    constructor(quantity: number) {
        this.quantity = quantity
        this.name = "Bullet"
        this.item_type = ItemType.AMMO
        this.image = "items/bullet.jpg"
        this.passive = true
    }
}