"use strict";

let CVD = null; // return of Canvas2DDisplay
let THREECAMERA = null;
let BUFFER_LOADER = null;

const ARRAY_BILLS = [];
const filter = document.querySelector('select#faceFilter');


filter.onchange = function() {
    stopAudio();
    main(-1);
    main(0);
}

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

    if (filter.value == 1) glasses(threeStuffs);
    if (filter.value == 2) futebol_makeup(threeStuffs);
    if (filter.value == 3) la_casa_de_papel(threeStuffs);
    if (filter.value == 4) rupy_helmet(threeStuffs, spec);

    // CREATE THE CAMERA:
    THREECAMERA = JeelizThreeHelper.create_camera();

    if (filter.value == 2 || filter.value == 3 || filter.value == 4) {
        // CREATE AN AMBIENT LIGHT
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        threeStuffs.scene.add(ambientLight);

        // CREATE A DIRECTIONALLIGHT
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(100, 1000, 1000);
        threeStuffs.scene.add(dirLight);
    }
}

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
        videoSettings: videoSettings,
        callbackReady: function(errCode, spec) {
            if (errCode) {
                console.log('AN ERROR HAPPENS. ERR =', errCode);
                return;
            }

            console.log('INFO: JEELIZFACEFILTER IS READY');
            if (filter.value == 5) {
                CVD = JeelizCanvas2DHelper(spec);
                CVD.ctx.strokeStyle = 'white';
            } else {
                init_threeScene(spec);
            }
        },

        // called at each render iteration (drawing loop):
        callbackTrack: function(detectState) {

            if (filter.value == 5) {
                if (detectState.detected > 0.8) {
                    // draw a border around the face:
                    const faceCoo = CVD.getCoordinates(detectState);
                    CVD.ctx.clearRect(0, 0, CVD.canvas.width, CVD.canvas.height);
                    CVD.ctx.strokeRect(faceCoo.x, faceCoo.y, faceCoo.w, faceCoo.h);
                    CVD.update_canvasTexture();
                }
                CVD.draw();

            } else {
                JeelizThreeHelper.render(detectState, THREECAMERA);
            }
        }
    }); //end JEELIZFACEFILTER.init call
}


/*
HELPERS
*/
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

// Animate the falling bills:
function animateBill(mesh, index) {
    mesh.visible = true;

    let count = 0;
    setInterval(() => {
        if (mesh.position.y < -3) {
            mesh.position.y = 3;
        }
        mesh.position.x = mesh.position.x + (0.005 * Math.cos(Math.PI / 40 * count));

        mesh.position.y -= 0.01;

        mesh.rotation.y = mesh.rotation.y + (0.005 * Math.cos(Math.PI / 40 * count));
        mesh.rotation.x += 0.03;
        mesh.rotation.z += 0.02;

        count += 0.9;
    }, 16)
}


let contextAudio = null;
// Plays the theme song and starts animation for the bills:
function playAudio(threeStuffs) {
    ARRAY_BILLS.forEach((bill, i) => {
        setTimeout(() => {
            animateBill(bill, i);

            threeStuffs.scene.add(bill);
        }, 230 * i)
    })

    // INIT WEB AUDIO
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        contextAudio = new AudioContext();
    } catch (e) {
        alert('Web Audio API is not supported in this browser.');
    }
    if (contextAudio) {
        BUFFER_LOADER = new BufferLoader(
            contextAudio, ['./assets/audio/bella_ciao.mp3'],
            (bufferList) => {
                const around = contextAudio.createBufferSource();

                around.buffer = bufferList[0];

                around.connect(contextAudio.destination);
                around.loop = true;
                around.start();
            }
        );
        BUFFER_LOADER.load();
    }
}

function stopAudio() {
    if (BUFFER_LOADER) {
        BUFFER_LOADER.context.close();
        BUFFER_LOADER = null;
    }
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
                color: 0xffeb3b
            }));

            textMesh.rotation.y = 3;
            textMesh.rotation.z = 0.3;
            textMesh.position.x += 1.5;
            textMesh.position.y += 1;
            threeStuffs.faceObject.add(textMesh);
        }
    );

    //MT216 : create the frame. We reuse the geometry of the video
    const calqueMesh = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./assets/images/filters/cadre_france.png'), true))
    calqueMesh.renderOrder = 999; // render last
    calqueMesh.frustumCulled = false;
    threeStuffs.scene.add(calqueMesh);
}

function la_casa_de_papel(threeStuffs) {
    const casaLoader = new THREE.BufferGeometryLoader();

    casaLoader.load(
        './libs/models3D/casa_de_papel/casa_de_papel.json',
        (maskGeometry) => {
            const maskMaterial = new THREE.MeshPhongMaterial({
                map: new THREE.TextureLoader().load('./libs/models3D/casa_de_papel/CasaDePapel_DIFFUSE.png'),
                normalMap: new THREE.TextureLoader().load('./libs/models3D/casa_de_papel/CasaDePapel_NRM.png'),
                reflectivity: 1,
                emissiveMap: new THREE.TextureLoader().load('./libs/models3D/casa_de_papel/CasaDePapel_REFLECT.png')
            });

            const maskMesh = new THREE.Mesh(maskGeometry, maskMaterial);
            maskMesh.scale.multiplyScalar(0.06);
            maskMesh.position.y = -0.8;
            maskMesh.scale.x = 0.07;

            addDragEventListener(maskMesh);

            threeStuffs.faceObject.add(maskMesh);
        }
    )

    // Create the bills:
    const billGeometry = new THREE.PlaneGeometry(0.4, 0.4);
    const billMaterial = new THREE.MeshLambertMaterial({
        map: new THREE.TextureLoader().load('./assets/images/filters/billet_50.png'),
        side: THREE.DoubleSide,
        transparent: true,
    });


    // Position each bill randomly + add animations:
    for (let i = 0; i < 40; i++) {

        const xRand = Math.random() * 1 - 0.5;
        const yRand = 3;
        const zRand = (Math.random() * 3 - 1.5) - 1.5;

        const billMesh = new THREE.Mesh(billGeometry, billMaterial);
        billMesh.renderOrder = 100;
        billMesh.frustumCulled = false;
        billMesh.visible = false;

        billMesh.position.set(xRand, yRand, zRand);
        billMesh.rotation.y = xRand;
        billMesh.rotation.z = zRand;

        billMesh.scale.multiplyScalar(0.4);
        billMesh.scale.z = xRand * 10;

        ARRAY_BILLS.push(billMesh);
    }

    playAudio(threeStuffs);

    //MT216 : create the frame. We reuse the geometry of the video
    const calqueMesh = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./assets/images/filters/calque.png'), true))
    calqueMesh.renderOrder = 999; // render last
    calqueMesh.frustumCulled = false;
    threeStuffs.scene.add(calqueMesh);
}

function rupy_helmet(threeStuffs, spec) {
    const HELMETOBJ3D = new THREE.Object3D();
    let helmetMesh = null,
        visorMesh = null,
        faceMesh = null;

    const loadingManager = new THREE.LoadingManager();
    const helmetLoader = new THREE.BufferGeometryLoader(loadingManager);

    // deprecated THREE legacy JSON format. GLTF is better now
    helmetLoader.load(
        './libs/models3D/helmet/helmet.json',
        (helmetGeometry) => {
            const helmetMaterial = new THREE.MeshPhongMaterial({
                map: new THREE.TextureLoader().load('./libs/models3D/helmet/diffuse_helmet.jpg'),
                reflectionRatio: 1,
                shininess: 50
            });

            helmetMesh = new THREE.Mesh(helmetGeometry, helmetMaterial);
            helmetMesh.scale.multiplyScalar(0.037);
            helmetMesh.position.y -= 0.3;
            helmetMesh.position.z -= 0.5;
            helmetMesh.rotation.x += 0.5;
        }
    );

    const visiereLoader = new THREE.BufferGeometryLoader(loadingManager);
    visiereLoader.load(
        './libs/models3D/helmet/visiere.json',
        (visiereGeometry) => {
            const visiereMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5,
                side: THREE.FrontSide
            });

            visorMesh = new THREE.Mesh(visiereGeometry, visiereMaterial);
            visorMesh.scale.multiplyScalar(0.037);
            visorMesh.position.y -= 0.3;
            visorMesh.position.z -= 0.5;
            visorMesh.rotation.x += 0.5;
            visorMesh.frustumCulled = false;
        }
    );

    // CREATE THE MASK
    const maskLoader = new THREE.BufferGeometryLoader(loadingManager);
    /*
      faceLowPolyEyesEarsFill.json has been exported from dev/faceLowPolyEyesEarsFill.blend
      using THREE.JS blender exporter with Blender v2.76
    */
    maskLoader.load('./libs/models3D/face/faceLowPolyEyesEarsFill2.json', function(maskBufferGeometry) {
        const vertexShaderSource = 'uniform mat2 videoTransformMat2;\n\
      varying vec2 vUVvideo;\n\
      varying float vY, vNormalDotZ;\n\
      const float THETAHEAD = 0.25;\n\
      \n\
      void main() {\n\
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);\n\
        vec4 projectedPosition = projectionMatrix * mvPosition;\n\
        gl_Position = projectedPosition;\n\
        \n\
        // compute UV coordinates on the video texture:\n\
        vec4 mvPosition0 = modelViewMatrix * vec4( position, 1.0 );\n\
        vec4 projectedPosition0 = projectionMatrix * mvPosition0;\n\
        vUVvideo = vec2(0.5,0.5) + videoTransformMat2 * projectedPosition0.xy/projectedPosition0.w;\n\
        vY = position.y*cos(THETAHEAD)-position.z*sin(THETAHEAD);\n\
        vec3 normalView = vec3(modelViewMatrix * vec4(normal,0.));\n\
        vNormalDotZ = pow(abs(normalView.z), 1.5);\n\
      }';

        const fragmentShaderSource = "precision lowp float;\n\
      uniform sampler2D samplerVideo;\n\
      varying vec2 vUVvideo;\n\
      varying float vY, vNormalDotZ;\n\
      void main() {\n\
        vec3 videoColor = texture2D(samplerVideo, vUVvideo).rgb;\n\
        float darkenCoeff = smoothstep(-0.15, 0.05, vY);\n\
        float borderCoeff = smoothstep(0.0, 0.55, vNormalDotZ);\n\
        gl_FragColor = vec4(videoColor * (1.-darkenCoeff), borderCoeff );\n\
      }";

        const mat = new THREE.ShaderMaterial({
            vertexShader: vertexShaderSource,
            fragmentShader: fragmentShaderSource,
            transparent: true,
            flatShading: false,
            uniforms: {
                samplerVideo: { value: JeelizThreeHelper.get_threeVideoTexture() },
                videoTransformMat2: { value: spec.videoTransformMat2 }
            },
            transparent: true
        });
        maskBufferGeometry.computeVertexNormals();
        faceMesh = new THREE.Mesh(maskBufferGeometry, mat);
        faceMesh.renderOrder = -10000;
        faceMesh.frustumCulled = false;
        faceMesh.scale.multiplyScalar(1.12);
        faceMesh.position.set(0, 0.3, -0.25);
    })

    loadingManager.onLoad = () => {
        HELMETOBJ3D.add(helmetMesh);
        HELMETOBJ3D.add(visorMesh);
        HELMETOBJ3D.add(faceMesh);

        addDragEventListener(HELMETOBJ3D);

        threeStuffs.faceObject.add(HELMETOBJ3D);

        // MT216: create the frame. We reuse the geometry of the video
        const calqueMesh = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./assets/images/filters/frame_rupy.png'), true));
        calqueMesh.renderOrder = 999; // render last
        calqueMesh.frustumCulled = false;
        threeStuffs.scene.add(calqueMesh);
    }
}