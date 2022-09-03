/* eslint-disable @typescript-eslint/no-explicit-any */

import FastAnimation, { FastAnimationTimingFunc } from '../miscellaneous/fastAnimation';
import $ from '../$';
import { IComponent } from '../component'
import anemoUtils from '../utils/anemoUtils';
import configManager from '../managers/configManager';

// config data
const animation_cameraIn = new FastAnimation<number[]>({
  keyframes: [
    { progress: 0, value: [0, 250, 550] },
    { progress: 60, value: [0, 80, 480] },
    { progress: 100, value: [0, 100, 500] }
  ],
  transitions: [
    'easeOut',
    'easeOut'
  ],
  delay: 0,
  time: 4,
});

const animation_paimonIn = new FastAnimation<number[]>({
  keyframes: [
    { progress: 0, value: [-300, -250, -3] },
    { progress: 50, value: [-180, 65, -3] },
    { progress: 100, value: [-170, 60, -3] },
  ],
  transitions: [
    'easeOut',
    'easeOut'
  ],
  delay: 2.5,
  time: 1
});

const animation_yingIn = new FastAnimation<number[]>({
  keyframes: [
    { progress: 0, value: [300, -250, -3] },
    { progress: 50, value: [210, 65, -3] },
    { progress: 100, value: [200, 60, -3] },
  ],
  transitions: [
    'easeOut',
    'easeOut'
  ],
  delay: 2,
  time: 1
});

const animation_cameraZoom = new FastAnimation<number[]>({
  keyframes: [
    { progress: 0, value: [0, 100, 500] },
    { progress: 100, value: [0, 150, 250] }
  ],
  transitions: [
    'linear'
  ],
  delay: 0, // useless
  time: 0, // useless
});

const spineObjects = [
  {
    skeletonFile: 'index_paimon.skeleton.json',
    atlasFile: 'index_paimon.atlas',
    animation: undefined,
    pos: [-400, 0, -3],
    scale: 0.6,
    animatedIn: animation_paimonIn
  },
  {
    skeletonFile: 'index_yan.skeleton.json',
    atlasFile: 'index_yan.atlas',
    animation: undefined,
    pos: [400, 0, -3],
    scale: 0.6,
    animatedIn: animation_yingIn
  },
  {
    skeletonFile: 'index_desk.skeleton.json',
    atlasFile: 'index_desk.atlas',
    animation: 'animation',
    pos: [-13, 40, -2],
    scale: 0.6
  },
  {
    skeletonFile: 'index_light.skeleton.json',
    atlasFile: 'index_light.atlas',
    animation: 'animation',
    pos: [0, -150, -1],
    scale: 0.6
  },
  // {
  //   skeletonFile: "index_page.skeleton.json",
  //   atlasFile: "index_page.atlas",
  //   animation: "loop",
  //   pos: [-30, 40, 0],
  //   scale: 0.5
  // }
];

const spineAssetBaseUrl = 'https://gcore.jsdelivr.net/gh/Jin-Yuhan/WebAssetStorage@latest/genshin_index_spine/';
const characterAnimations = ['01惊讶', '02干劲', '03思考', '04烦恼', '05大悟'];

// declare plugins
declare const spine: any;
declare const THREE: any;

// stores
const skeletonMeshes: any[] = [];
const randomAnimationMeshes: any[] = [];
const posAnimatedObjects: {
  obj: any;
  animation: FastAnimation<number[]>;
  finish: boolean;
}[] = [];

// three js
let scene: any;
let camera: any;
let renderer: any;
let canvas: HTMLCanvasElement;

// spine
let assetManager: any;

// frame data
let lastFrameTime: number | undefined = undefined;
let accumulatedTime = 0;

// other data
let active = false;
let initialized = false;
let banner_mask_color: string;


// functions
function interpolateVector3(a: number[], b: number[], timing: FastAnimationTimingFunc): number[] {
  return [0, 0, 0].map((_, i) => timing(a[i], b[i]));
}

function render() {
  if (!active) {
    return;
  }

  // calculate delta time for animation purposes
  const now = Date.now() / 1000;

  if (!lastFrameTime) {
    // 第一帧就不渲染了
    lastFrameTime = now;
  } else {
    const delta = now - lastFrameTime;
    accumulatedTime += delta;
    lastFrameTime = now;

    // resize canvas to use full page, adjust camera/renderer
    resize();

    // update the position of animated objects
    posAnimatedObjects.forEach(o => {
      if (o.finish) {
        return;
      }

      const time = accumulatedTime - o.animation.delay;
      const progress = Math.max(Math.min(time / o.animation.time, 1), 0) * 100;
      const pos = o.animation.update(progress, interpolateVector3);
      o.obj.position.set(...pos);

      if (progress === 100) {
        o.finish = true;
      }
    });

    if (posAnimatedObjects.every(obj => obj.finish)) {
      document.body.attr('index-banner-lock', null);
    } else {
      document.body.attr('index-banner-lock', '');
    }

    // update the animation
    skeletonMeshes.forEach(mesh => mesh.update(delta));

    // render the scene
    renderer.render(scene, camera);
  }

  requestAnimationFrame(render);
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
}

function windowScroll() {
  const currentTop = window.scrollY || document.documentElement.scrollTop;
  const content = $.assert<HTMLElement>('header');
  const progress = content.clientHeight <= 0 ? 1 :
    (Math.max(0, currentTop - content.top()) / content.clientHeight);
  const pos = animation_cameraZoom.update(progress * 100, interpolateVector3);
  camera.position.set(...pos);
}

function createCamera() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera = new THREE.PerspectiveCamera(75, width / height, 1, 3000);
  camera.position.y = 100;
  camera.position.z = 500;

  posAnimatedObjects.push({
    obj: camera,
    animation: animation_cameraIn,
    finish: false
  });
}

function createScene() {
  scene = new THREE.Scene();
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer();
  canvas = renderer.domElement;
}

function createBackground() {
  const geometry = new THREE.PlaneGeometry(2048, 1024);
  const material = new THREE.MeshBasicMaterial();
  const loader = new THREE.TextureLoader();
  material.map = loader.load(spineAssetBaseUrl + 'index_room.jpg');

  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(0, 185, -95);
  scene.add(plane);
}

function createSpineObject(config: any) {
  // Load the texture atlas using name.atlas and name.png from the AssetManager.
  // The function passed to TextureAtlas is used to resolve relative paths.
  const atlas = assetManager.require(config.atlasFile);

  // Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
  const atlasLoader = new spine.AtlasAttachmentLoader(atlas);

  // Create a SkeletonJson instance for parsing the .json file.
  const skeletonJson = new spine.SkeletonJson(atlasLoader);

  // Set the scale to apply during parsing, parse the file, and create a new skeleton.
  skeletonJson.scale = config.scale;
  const skeletonData = skeletonJson.readSkeletonData(assetManager.require(config.skeletonFile));

  // Create a SkeletonMesh from the data and attach it to the scene
  const skeletonMesh = new spine.SkeletonMesh(skeletonData, (parameters: any) => {
    parameters.depthTest = true;
    parameters.depthWrite = true;
    parameters.alphaTest = 0.001;
  });

  if (config.animation) {
    skeletonMesh.state.setAnimation(0, config.animation, true);
  } else {
    randomAnimationMeshes.push(skeletonMesh);
  }

  skeletonMesh.position.set(...config.pos);
  skeletonMeshes.push(skeletonMesh);

  const mesh = new THREE.Mesh();
  mesh.add(skeletonMesh);
  scene.add(mesh);

  if (config.animatedIn) {
    posAnimatedObjects.push({
      obj: skeletonMesh,
      animation: config.animatedIn,
      finish: false
    });
  }
}

const component_genshinBanner: IComponent = {
  name: 'genshin-banner',

  initialize(): boolean {
    return configManager.siteConfig.index.special_banner.enable;
  },

  cleanup(): void {
    if (!active) {
      return;
    }

    active = false;

    // reset frame data
    lastFrameTime = undefined;
    accumulatedTime = 0;

    // reset pos animation states
    posAnimatedObjects.forEach(obj => obj.finish = false);

    // remove the canvas
    canvas.remove();

    // reset mask color
    const mask = $.assert<HTMLElement>('.banner-mask');
    mask.css('background-color', banner_mask_color);

    // remove scroll event listener
    window.removeEventListener('scroll', windowScroll);
  },

  async refresh(): Promise<void> {
    if (!('spine_threejs' in configManager.pageAssetConfig)) {
      return;
    }

    if (!initialized) {
      initialized = true;

      createCamera();
      createScene();
      createRenderer();
      createBackground();

      // load the assets required to display the Raptor model
      assetManager = new spine.AssetManager(spineAssetBaseUrl);

      for (const obj of spineObjects) {
        assetManager.loadText(obj.skeletonFile);
        assetManager.loadTextureAtlas(obj.atlasFile);
        await assetManager.loadAll();

        createSpineObject(obj);
      }
    }

    active = true;

    // set random animations
    randomAnimationMeshes.forEach(mesh => {
      const i = anemoUtils.randomInt(0, characterAnimations.length);
      mesh.state.setAnimation(0, characterAnimations[i], true);
    });

    // insert the canvas into dom
    const header = $.assert('header');
    header.insertAdjacentElement('afterbegin', canvas);

    // change mask color
    const mask = $.assert<HTMLElement>('.banner-mask');
    banner_mask_color = mask.css('background-color');
    mask.css('background-color', 'rgba(0, 0, 0, 0.1)');

    // handle scroll event
    window.addEventListener('scroll', windowScroll);

    // start rendering
    requestAnimationFrame(render);
  }
};

export default component_genshinBanner;