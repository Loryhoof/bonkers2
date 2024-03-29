import Bullet from "../ts/Bullet";
import UsableItem from "./UsableItem";

export default interface Tool extends UsableItem {
    setHold(bool: boolean): void;
}