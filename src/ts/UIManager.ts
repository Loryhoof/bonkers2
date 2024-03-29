import * as THREE from "three"
import ItemType from "../enums/ItemType"


const fpsText = document.getElementById("fpsText") as HTMLElement
const hotbarItems = document.querySelectorAll('.hotBarItem') as HTMLElement | any
const healthSlider = document.getElementById('healthSlider') as HTMLElement

let prevTime = 0
let frames = 0

export default class UIManager {
    private fps: number
    private static instance: UIManager

    constructor() {
        this.fps = 0
    }

    public static getInstance(): UIManager {
        if(!UIManager.instance) {
            UIManager.instance = new UIManager()
        }
        return UIManager.instance
    }

    initHotBar(hotBar: any) {
        let draggedItem = null
        // Add dragstart event listener to each hotbar item

        let draggedIndex = -1;

        // Add dragstart event listener to each hotbar item
        // Add dragstart event listener to each hotbar item
        hotbarItems.forEach((item: any, index: number) => {
            item.addEventListener('dragstart', (event: any) => {
                // Store the index of the dragged item

                draggedItem = hotBar[index];
                draggedIndex = index;
            });
        });

        // Convert NodeList to Array
        const hotbarArray = Array.from(hotbarItems);

        // Function to handle drop event
        function handleDrop(event: any) {
            event.preventDefault();
            // Retrieve the index of the drop target
            const dropIndex = hotbarArray.indexOf(event.target);
            // Ensure both draggedIndex and dropIndex are valid
            if (draggedIndex !== null && dropIndex !== -1) {
                // Remove the dragged item from its original position
                const draggedItem = hotBar[draggedIndex];
                hotBar[draggedIndex] = null; // Clear the original slot
                // Insert the dragged item at the drop index
                hotBar[dropIndex] = draggedItem;

                // Update the UI to reflect the changes
                //updateHotbarUI();

                // Reset dragged index
                draggedIndex = -1;
            }
        }

        // Add event listeners for dragover and drop events
        hotbarArray.forEach((item: any) => {
            item.addEventListener('dragover', (event: any) => {
                event.preventDefault();
            });
            item.addEventListener('drop', handleDrop);
        });
    }

    updateHealth(health: number) {
        if(health <= 20) {
            healthSlider.style.backgroundColor = 'rgba(203, 26, 26, 0.8)' // red
        }
        else {
            healthSlider.style.backgroundColor = 'rgba(139, 195, 74, 1)' // green
        }

        healthSlider.style.width = `${health}%`
    }

    updateHotBar(hotBar: any, selectedSlot: number) {
        hotBar.forEach((item: any, index: number) => {
            const hotBarItem = hotbarItems[index];
            if (item) {
                if (selectedSlot == index) {
                    hotBarItem.style.border = '2px solid black';
                } else {
                    hotBarItem.style.border = 'none';
                }
                
                hotBarItem.innerHTML = `
                    <img src="${item.image}" alt="Item ${index + 1}" style="object-fit: contain; width: 100%; height: 100%;">`;
            
                const itemAmount = document.createElement('span');
                itemAmount.className = 'itemAmount';

                let numToDisplay = 0;
                if(item.item_type == ItemType.FIREARM) {
                    numToDisplay = item.ammo
                } else {
                    numToDisplay = item.quantity > 1 ? item.quantity : ''
                }
                itemAmount.textContent = numToDisplay.toString();
                hotBarItem.appendChild(itemAmount);
            } else {
                
                hotBarItem.innerHTML = '';
                hotBarItem.style.border = 'none';
            }
        });
    }

    updatePosition(position: THREE.Vector3) {
        //infoText.innerHTML += `Position: ${Math.floor(position.x)}, ${Math.floor(position.y)}, ${Math.floor(position.z)}<br>`
    }

    updateFPS() {
        const currentTime = performance.now();
        const deltaTime = currentTime - prevTime;

        frames++;

        if (deltaTime >= 100) {
            this.fps = Math.round((frames * 1000) / deltaTime);
            prevTime = currentTime;
            frames = 0;
        }

        fpsText.innerHTML = `FPS: ${this.fps}<br>`
    }

    update() {
        this.updateFPS()
        
    }
}