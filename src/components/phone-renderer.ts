import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { DeviceRendererOptions } from './laptop-renderer';

// "Apple iPhone 15 Pro Max Black" by polyman (CC BY 4.0), re-encoded with meshopt.
const MODEL = '/models/iphone-15-pro-max.glb';
/** The display mesh is the one carrying this material in the source file. */
const SCREEN_MATERIAL = 'pIJKfZsazmcpEiU';
const DURATION = 3;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ramp = (t: number, start: number, end: number) => clamp01((t - start) / (end - start));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * The phone turns in from a three-quarter view of its back, settles face-on and
 * wakes its screen. Same contract as the laptop: the screen quad goes out every frame.
 */
export function createPhoneRenderer({ host, canvas, animate, frame, ready, failed }: DeviceRendererOptions) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  scene.environment = environment;
  room.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 5, 6);
  scene.add(key);

  // A long lens keeps the phone's proportions true, like a product shot.
  const camera = new THREE.PerspectiveCamera(22, 1, 0.01, 100);
  const root = new THREE.Group();
  scene.add(root);

  const resources: { dispose: () => void }[] = [environment, pmrem];
  let disposed = false;
  let raf = 0;
  let started = 0;
  let rig: { screen: THREE.Mesh; corners: THREE.Vector3[]; height: number } | null = null;
  let distance = 1;

  const screenCorners = () => rig!.corners.map(corner => corner.clone().applyMatrix4(rig!.screen.matrixWorld));

  function frameCamera() {
    if (!rig) return;
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const narrow = camera.aspect < 1;
    const body = rig.height;
    distance = Math.max(body / 2 / (tangent * (narrow ? 0.9 : 0.86)), body * 0.49 / 2 / (tangent * camera.aspect * 0.8));
  }

  function draw(now: number) {
    if (disposed || !rig) return;
    const t = animate ? (now - started) / 1000 : DURATION;
    const spin = easeInOut(ramp(t, 0, 2.5));
    const rise = easeOut(ramp(t, 0, 1.3));
    const dolly = easeInOut(ramp(t, 0, 2.7));
    const power = easeInOut(ramp(t, 1.9, 2.8));
    root.rotation.set((1 - spin) * 0.38, (1 - spin) * -2.5, (1 - spin) * -0.16);
    root.position.y = (1 - rise) * -0.22 * rig.height;
    camera.position.set(0, 0, distance * (1 + (1 - dolly) * 0.3));
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    root.updateMatrixWorld(true);
    renderer.render(scene, camera);

    const corners = screenCorners();
    const { width, height } = host.getBoundingClientRect();
    // Only show the page while the glass faces the camera; edge-on it would smear.
    const normal = corners[1].clone().sub(corners[0]).cross(corners[3].clone().sub(corners[0])).normalize();
    const center = corners.reduce((sum, c) => sum.add(c), new THREE.Vector3()).multiplyScalar(0.25);
    const facing = -normal.dot(camera.position.clone().sub(center).normalize());
    const quad = corners.map(corner => {
      corner.project(camera);
      return [(corner.x + 1) / 2 * width, (1 - corner.y) / 2 * height] as [number, number];
    });
    const done = t >= DURATION;
    frame({ quad, power: facing > 0.6 ? power : 0, done });
    raf = done ? 0 : requestAnimationFrame(draw);
  }

  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    frameCamera();
    if (!raf) draw(performance.now());
  }

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(MODEL, gltf => {
    if (disposed) return;
    const model = gltf.scene;
    let screen: THREE.Mesh | undefined;
    model.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (material.name === SCREEN_MATERIAL) screen = mesh;
        resources.push(material);
      }
      resources.push(mesh.geometry);
    });
    if (!screen) { failed(); return; }

    // Dark glass instead of the source's white emissive panel; the live page sits on top.
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 });
    screen.material = glass;
    resources.push(glass);

    // The display is a flat rounded rectangle in its local XY plane, facing -Z.
    screen.geometry.computeBoundingBox();
    const { min, max } = screen.geometry.boundingBox!;
    // Seen from the front, local +X is the viewer's left.
    const corners = [
      new THREE.Vector3(max.x, max.y, 0), new THREE.Vector3(min.x, max.y, 0),
      new THREE.Vector3(min.x, min.y, 0), new THREE.Vector3(max.x, min.y, 0),
    ];

    // Turn the phone to face the camera (+Z) and centre it on the origin.
    const turn = new THREE.Group();
    turn.rotation.y = Math.PI;
    turn.add(model);
    turn.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(turn);
    const center = box.getCenter(new THREE.Vector3());
    turn.position.sub(center);
    root.add(turn);
    root.updateMatrixWorld(true);
    rig = { screen, corners, height: box.getSize(new THREE.Vector3()).y };

    const [tl, tr, , bl] = screenCorners();
    ready(tl.distanceTo(tr) / tl.distanceTo(bl));
    started = performance.now();
    resize();
  }, undefined, () => { if (!disposed) failed(); });

  const observer = new ResizeObserver(resize);
  observer.observe(host);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      for (const resource of resources) resource.dispose();
      renderer.dispose();
    },
  };
}
