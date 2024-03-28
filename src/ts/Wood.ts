import ItemType from "../enums/ItemType"

export default class Wood {
    
    public readonly quantity: number
    public readonly name: string
    public readonly item_type: ItemType
    public readonly image: string
    public readonly passive: boolean

    constructor(quantity: number) {
        this.quantity = quantity
        this.name = "Wood"
        this.item_type = ItemType.RESOURCES
        this.image = "items/wood.jpg"
        this.passive = true
    }
}