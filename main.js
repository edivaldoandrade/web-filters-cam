"use strict";

let THREECAMERA = null;

const filter = document.querySelector('select#faceFilter');

//For Butterfly filter
/* let BUTTERFLYOBJ3D = null;
const NUMBERBUTTERFLIES = 10;
const MIXERS = [];
const ACTIONS = [];
let ISANIMATED = false; */


/* filter.onchange = function() {
    JEELIZFACEFILTER.destroy();
    main(0);
} */

// callback: launched if a face is detected or lost.
function detect_callback(faceIndex, isDetected) {
    if (isDetected) {
        console.log('INFO in detect_callback(): DETECTED');
    } else {
        console.log('INFO in detect_callback(): LOST');
    }
}

// build the 3D. called once when Jeeliz Face Filter is OK:
function init_threeScene(spec) {
    const threeStuffs = JeelizThreeHelper.init(spec, detect_callback);

    console.log(filter.value);
    if (filter.value == 1) glasses(threeStuffs);
    if (filter.value == 2) futebol_makeup(threeStuffs);
    //if (filter.value == 3) butterflies();

    // CREATE THE CAMERA:
    THREECAMERA = JeelizThreeHelper.create_camera();
} // end init_threeScene()

// entry point:
function main(a) {
    if (a == 0) {
        JeelizResizer.size_canvas({
            canvasId: 'jeeFaceFilterCanvas',
            callback: function(isError, bestVideoSettings) {
                init_faceFilter(bestVideoSettings);
            }
        })
    }

    if (a == -1) {
        JEELIZFACEFILTER.destroy();
    }
}

function init_faceFilter(videoSettings) {
    JEELIZFACEFILTER.init({
        followZRot: true,
        canvasId: 'jeeFaceFilterCanvas',
        NNCPath: './libs/neuralNets/', // path of NN_DEFAULT.json file
        maxFacesDetected: 1,
        callbackReady: function(errCode, spec) {
            if (errCode) {
                console.log('AN ERROR HAPPENS. ERR =', errCode);
                return;
            }

            console.log('INFO: JEELIZFACEFILTER IS READY');
            init_threeScene(spec);
        },

        // called at each render iteration (drawing loop):
        callbackTrack: function(detectState) {
            /* if (filter.value == 3) {

                TWEEN.update();

                if (MIXERS.length > 1) {
                    MIXERS.forEach((m) => {
                        m.update(0.13);
                    });
                }
            } */

            JeelizThreeHelper.render(detectState, THREECAMERA);
        }
    }); //end JEELIZFACEFILTER.init call
}

/**
 * FACE FILTERS
 */

function glasses(threeStuffs) {
    // improve WebGLRenderer settings:
    threeStuffs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    threeStuffs.renderer.outputEncoding = THREE.sRGBEncoding;

    // CREATE THE GLASSES AND ADD THEM
    const r = JeelizThreeGlassesCreator({
        envMapURL: "./assets/images/filters/envMap.jpg",
        frameMeshURL: "./libs/models3D/glassesFramesBranchesBent.json",
        lensesMeshURL: "./libs/models3D/glassesLenses.json",
        occluderURL: "./libs/models3D/face.json"
    });

    // vertical offset:
    const dy = 0.07;

    // create and add the occluder:
    r.occluder.rotation.set(0.3, 0, 0);
    r.occluder.position.set(0, 0.03 + dy, -0.04);
    r.occluder.scale.multiplyScalar(0.0084);
    threeStuffs.faceObject.add(r.occluder);

    // create and add the glasses mesh:
    const threeGlasses = r.glasses;
    //threeGlasses.rotation.set(-0.15,0,0); / /X neg -> rotate branches down
    threeGlasses.position.set(0, dy, 0.4);
    threeGlasses.scale.multiplyScalar(0.006);
    threeStuffs.faceObject.add(threeGlasses);
}

function futebol_makeup(threeStuffs) {
    // Add our face model:
    const loader = new THREE.BufferGeometryLoader();

    loader.load(
        './libs/models3D/football_makeup/face.json',
        (geometry) => {
            const mat = new THREE.MeshBasicMaterial({
                // DEBUG: uncomment color, comment map and alphaMap
                map: new THREE.TextureLoader().load('./libs/models3D/football_makeup/texture.png'),
                alphaMap: new THREE.TextureLoader().load('./libs/models3D/football_makeup/alpha_map_256.png'),
                transparent: true,
                opacity: 0.6
            });

            const faceMesh = new THREE.Mesh(geometry, mat);
            faceMesh.position.y += 0.15;
            faceMesh.position.z -= 0.25;

            addDragEventListener(faceMesh);

            threeStuffs.faceObject.add(faceMesh);
        }
    )

    // We load the font that we'll use to display 3D text:
    const fontLoader = new THREE.FontLoader();

    fontLoader.load(
        './assets/fonts/helvetiker_regular.typeface.json',
        (font) => {
            const textGeometry = new THREE.TextGeometry('Goloooo', {
                font: font,
                size: 0.25,
                height: 0.1,
                curveSegments: 12,
            });

            const textMesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({
                color: 0x2951A7
            }));

            textMesh.rotation.y = 3;
            textMesh.rotation.z = 0.3;
            textMesh.position.x += 1.5;
            textMesh.position.y += 1;
            threeStuffs.faceObject.add(textMesh);
        }
    );

    // CREATE THE VIDEO BACKGROUND
    function create_mat2d(threeTexture, isTransparent) { //MT216 : we put the creation of the video material in a func because we will also use it for the frame
        return new THREE.RawShaderMaterial({
            depthWrite: false,
            depthTest: false,
            transparent: isTransparent,
            vertexShader: "attribute vec2 position;\n\
                    varying vec2 vUV;\n\
                    void main(void){\n\
                    gl_Position=vec4(position, 0., 1.);\n\
                    vUV=0.5+0.5*position;\n\
                }",
            fragmentShader: "precision lowp float;\n\
                    uniform sampler2D samplerVideo;\n\
                    varying vec2 vUV;\n\
                    void main(void){\n\
                    gl_FragColor=texture2D(samplerVideo, vUV);\n\
                }",
            uniforms: {
                samplerVideo: { value: threeTexture }
            }
        });
    }

    //MT216 : create the frame. We reuse the geometry of the video
    const calqueMesh = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./assets/images/filters/cadre_france.png'), true))
    calqueMesh.renderOrder = 999; // render last
    calqueMesh.frustumCulled = false;
    threeStuffs.scene.add(calqueMesh);
}

/* function butterflies(threeStuffs) {

    // ADD OUR BUTTERFLY:
    const butterflyLoader = new THREE.JSONLoader();

    butterflyLoader.load(
        './libs/models3D/butterfly/butterfly.json',
        (geometry) => {
            const materialBody = new THREE.MeshBasicMaterial({
                color: 0x000000,
                depthWrite: false,
                opacity: 0
            });

            // let butterFlyInstance
            // let action;
            let clips = null;
            let clip = null;
            let xRand = null;
            let yRand = null;
            let zRand = null;
            let sign = null;

            BUTTERFLYOBJ3D = new THREE.Object3D();

            for (let i = 2; i <= NUMBERBUTTERFLIES; i++) {
                const indexTexture = i % 6 === 0 ? 1 : i % 6;

                const materialWings = new THREE.MeshLambertMaterial({
                    map: new THREE.TextureLoader().load(`./libs/models3D/butterfly/Wing_Diffuse_${indexTexture}.jpg`),
                    alphaMap: new THREE.TextureLoader().load('./libs/models3D/butterfly/Wing_Alpha.jpg'),
                    transparent: true,
                    morphTargets: true,
                    opacity: 0
                });
                const butterFlyInstance = new THREE.Mesh(geometry, [materialWings, materialBody]);

                xRand = Math.random() * 2 - 1;
                yRand = Math.random() * 1 + 0.1;
                zRand = Math.random() * 1 + 0.5;

                sign = i % 2 === 0 ? -1 : 1;

                butterFlyInstance.position.set(xRand, yRand, zRand);
                butterFlyInstance.scale.multiplyScalar(0.55);
                butterFlyInstance.visible = false;
                let BUTTERFLYINSTANCEOBJ3D = new THREE.Object3D();
                setTimeout(() => {
                    animateFly(butterFlyInstance, 0.01 * (i + 3) * 0.1 + 0.002, i)
                    butterFlyInstance.material[0].opacity = 1;
                    butterFlyInstance.material[1].opacity = 1;
                    butterFlyInstance.visible = true
                    BUTTERFLYINSTANCEOBJ3D.add(butterFlyInstance)
                }, 600 * i);


                // CREATE WING FLAP ANIMATION
                if (!ISANIMATED) {
                    // This is where adding our animation begins
                    const mixer = new THREE.AnimationMixer(butterFlyInstance);

                    clips = butterFlyInstance.geometry.animations;

                    clip = clips[0];


                    const action = mixer.clipAction(clip);


                    ACTIONS.push(action);
                    MIXERS.push(mixer);
                }


                // ADD OUR LIGHTS INSIDE THE BUTTERFLY TO CREATE A GLOWING EFFECT
                let pointLight = new THREE.PointLight(0x77ffff, 1, 1, 0.1);
                pointLight.position.set(xRand, yRand, zRand);


                setTimeout(() => {
                    animatePointLightButterfly(pointLight);
                    animateFly(pointLight, 0.01 * (i + 3) * 0.1 + 0.002, i);
                }, 600 * i);

                BUTTERFLYINSTANCEOBJ3D.add(pointLight);


                BUTTERFLYOBJ3D.add(BUTTERFLYINSTANCEOBJ3D);
            }

            // We play the animation for each butterfly and shift their cycles
            // by adding a small timeout
            ACTIONS.forEach((a, index) => {
                setTimeout(() => {
                    a.play();
                }, index * 33)
            })

            ISANIMATED = true;

            threeStuffs.faceObject.add(BUTTERFLYOBJ3D);
        }
    );
} */