interface InventoryItem {
  name: string;
  quantity: number;
}

export default class PlayerInventory {
  public readonly inventory: { [name: string]: InventoryItem };
  private hotBar: Array<any>;

  constructor(hotBar: Array<any>) {
    this.inventory = {};
    this.hotBar = hotBar;
  }

  add(item: InventoryItem) {
    this.inventory[item.name] = item;
  }

  remove(item: InventoryItem) {
    if (this.inventory[item.name]) {
      delete this.inventory[item.name];
    }
  }

  update() {
    for (let key in this.inventory) {
      let item = this.inventory[key] as InventoryItem;
      let quantity = item.quantity;

      if (quantity <= 0) {
        this.hotBar[this.hotBar.indexOf(item)] = null;
        delete this.inventory[key];
      }
    }
  }
}
