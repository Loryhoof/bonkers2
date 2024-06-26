import Bullet from "../ts/Bullet";
import UsableItem from "./UsableItem";

export default interface Building extends UsableItem {
    switch(): void,
    rotate(): void
}