import Placeable from "./Placeable";

export default interface Interactable extends Placeable {
    interact(): void;
}
