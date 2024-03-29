import ItemType from "../enums/ItemType";
import Player from "../ts/Player";

export default interface UsableItem {
    use(): void;
    update(elapsedTime: number, deltaTime: number): void;
    setActive(bool: boolean, owner: Player): void;
    item_type: ItemType;
}
