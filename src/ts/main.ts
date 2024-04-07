const loadDependencies = async () => {
    const RAPIER = await import('https://cdn.skypack.dev/@dimforge/rapier3d-compat');
    const THREE = await import('three');
    // const World = await import('./World');

    return { RAPIER, THREE };
};

const initializeApp = async ({ RAPIER, THREE }: any) => {

    (window as any).RAPIER = RAPIER;
    await RAPIER.init();
    

    const width = window.innerWidth;
    const height = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('app') as HTMLCanvasElement
    });

    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    const scene = new THREE.Scene();
    const clock = new THREE.Clock();

    let finishedLoading = false;

    //let world = null as any

    const World = await import('./World');
    const world = new World.default(camera, scene);
    world.initialize();

    function animate() {
        const deltaTime = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        world?.update(elapsedTime, deltaTime);

        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    let isPointerLocked = false;

    // Request pointer lock
    const requestPointerLock = () => {
        const element = document.body;
        element.requestPointerLock = element.requestPointerLock;
        element.requestPointerLock();
    };

    // Exit pointer lock
    const exitPointerLock = () => {
        document.exitPointerLock = document.exitPointerLock;
        document.exitPointerLock();
    };

    // Check if pointer is locked
    const isPointerLockEnabled = () => {
        return document.pointerLockElement === document.body;
    };

    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = isPointerLockEnabled();
    });

    // Event listener for pointer lock error
    document.addEventListener('pointerlockerror', () => {
        console.error('Pointer lock failed.');
    });

    document.addEventListener('click', (e) => {
        if (!isPointerLocked) {
            requestPointerLock();
        }

        if (e.button === 0) {
            //doShoot()
            // if(selectedItem) {
            //     selectedItem.use()
            // }
        }
    });
};

const startApp = async () => {
    const dependencies = await loadDependencies();
    initializeApp(dependencies);
};

startApp();
