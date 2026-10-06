import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/** Screen corners in host CSS pixels: top-left, top-right, bottom-right, bottom-left. */
export type Quad = [number, number][];
export type LaptopFrame = { quad: Quad; power: number; done: boolean };

type Options = {
  host: HTMLDivElement;
  canvas: HTMLCanvasElement;
  /** False skips straight to the open, front-on pose (reduced motion). */
  animate: boolean;
  frame: (state: LaptopFrame) => void;
  /** Width / height of the lit panel, known once the model has loaded. */
  ready: (aspect: number) => void;
  failed: () => void;
};

// "MacBook Pro M3 16-inch 2024" by jackbaeten (CC BY 4.0), rigged by William Laverty
// (rigged-macbook-3d, MIT). The hinge pivot and seat-lift values are baked into it.
const MODEL = '/models/macbook-rigged.glb';
const FIT_SIZE = 4.2;
const DURATION = 3.6;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ramp = (t: number, start: number, end: number) => clamp01((t - start) / (end - start));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export function createLaptopRenderer({ host, canvas, animate, frame, ready, failed }: Options) {
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
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 6, 5);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
  const root = new THREE.Group();
  scene.add(root);

  const resources: { dispose: () => void }[] = [environment, pmrem];
  let disposed = false;
  let raf = 0;
  let started = 0;
  let rig: {
    pivot: THREE.Object3D;
    screen: THREE.Mesh;
    corners: THREE.Vector3[];
    seat: { hingeY: number; relY: number; relZ: number; targetY: number; openX: number; closedX: number };
  } | null = null;
  const intro = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
  const final = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };

  function setLid(open: number) {
    if (!rig) return;
    const { pivot, seat } = rig;
    pivot.rotation.x = seat.closedX + (seat.openX - seat.closedX) * open;
    // The hinge sits below the keycaps: lift the pivot so a closing lid rests on the deck.
    const theta = pivot.rotation.x;
    const bottom = seat.hingeY + seat.relY * Math.cos(theta) - seat.relZ * Math.sin(theta);
    pivot.position.y = seat.hingeY + Math.max(0, seat.targetY - bottom);
    root.updateMatrixWorld(true);
  }

  function screenCorners() {
    return rig!.corners.map(corner => corner.clone().applyMatrix4(rig!.screen.matrixWorld));
  }

  /** Front-on pose: looking down the panel normal, so the screen projects to a true rectangle. */
  function placeFinalCamera() {
    if (!rig) return;
    setLid(1);
    const [tl, tr, br, bl] = screenCorners();
    const right = tr.clone().sub(tl);
    const up = tl.clone().sub(bl);
    const width = right.length();
    const height = up.length();
    right.normalize();
    up.normalize();
    const normal = right.clone().cross(up).normalize();
    const center = tl.clone().add(tr).add(br).add(bl).multiplyScalar(0.25);
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const narrow = camera.aspect < 1;
    const distance = Math.max(height / 2 / (tangent * (narrow ? 0.8 : 0.68)), width / 2 / (tangent * camera.aspect * (narrow ? 0.76 : 0.86)));
    // Slide the camera down the panel plane (no rotation) so the keyboard peeks in below.
    final.position.copy(center).addScaledVector(normal, distance).addScaledVector(up, -distance * tangent * (narrow ? 0.3 : 0.3));
    final.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, normal));
    // Three-quarter view from above the front-right corner, a little further out.
    const target = new THREE.Vector3(0, -0.1, 0.2);
    const span = distance * 1.25;
    intro.position.set(Math.sin(0.62) * span, Math.sin(0.5) * span, Math.cos(0.62) * span);
    const look = new THREE.Matrix4().lookAt(intro.position, target, new THREE.Vector3(0, 1, 0));
    intro.quaternion.setFromRotationMatrix(look);
    intro.position.add(new THREE.Vector3(0, -0.15, 0));
  }

  function draw(now: number) {
    if (disposed || !rig) return;
    const t = animate ? (now - started) / 1000 : DURATION;
    const rise = easeOut(ramp(t, 0, 1));
    const open = easeInOut(ramp(t, 0.45, 2.15));
    const dive = easeInOut(ramp(t, 1.15, 3.4));
    const power = easeInOut(ramp(t, 1.25, 2.3));
    root.position.y = (1 - rise) * -0.35;
    setLid(open);
    camera.position.lerpVectors(intro.position, final.position, dive);
    camera.quaternion.slerpQuaternions(intro.quaternion, final.quaternion, dive);
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
    const { width, height } = host.getBoundingClientRect();
    const quad = screenCorners().map(corner => {
      corner.project(camera);
      return [(corner.x + 1) / 2 * width, (1 - corner.y) / 2 * height] as [number, number];
    });
    // Below ~30% open the panel is too edge-on for a stable CSS projection.
    const done = t >= DURATION;
    frame({ quad, power: open > 0.3 ? power : 0, done });
    raf = done ? 0 : requestAnimationFrame(draw);
  }

  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    placeFinalCamera();
    // Mid-intro the running loop picks up the new framing; afterwards redraw once.
    if (!raf) draw(performance.now());
  }

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(MODEL, gltf => {
    if (disposed) return;
    const model = gltf.scene;
    const pivot = model.getObjectByName('LidPivot');
    const screen = model.getObjectByName('Screen') as THREE.Mesh | undefined;
    if (!pivot || !screen?.isMesh) { failed(); return; }

    model.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (material.userData?.spaceBlack && 'envMapIntensity' in material) (material as THREE.MeshStandardMaterial).envMapIntensity = 0.85;
        resources.push(material);
      }
      resources.push(mesh.geometry);
    });
    // Dark glass: it catches the studio reflections while the lid swings, then the live page sits on top.
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04 });
    screen.material = glass;
    resources.push(glass);

    // The panel is a flat slab authored at the open pose: find its face from the vertices.
    const positions = screen.geometry.getAttribute('position');
    const points = Array.from({ length: positions.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(positions, i));
    const centroid = points.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(points.length);
    let yy = 0, yz = 0, zz = 0;
    for (const p of points) { const y = p.y - centroid.y, z = p.z - centroid.z; yy += y * y; yz += y * z; zz += z * z; }
    const angle = 0.5 * Math.atan2(2 * yz, yy - zz);
    const u = new THREE.Vector3(1, 0, 0);
    const v = new THREE.Vector3(0, Math.cos(angle), Math.sin(angle));
    if (v.y < 0) v.negate();
    const normal = u.clone().cross(v);
    let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity, front = -Infinity;
    for (const p of points) {
      const d = p.clone().sub(centroid);
      uMin = Math.min(uMin, d.dot(u)); uMax = Math.max(uMax, d.dot(u));
      vMin = Math.min(vMin, d.dot(v)); vMax = Math.max(vMax, d.dot(v));
      front = Math.max(front, d.dot(normal));
    }
    const corner = (a: number, b: number) => centroid.clone().addScaledVector(u, a).addScaledVector(v, b).addScaledVector(normal, front);
    const corners = [corner(uMin, vMax), corner(uMax, vMax), corner(uMax, vMin), corner(uMin, vMin)];

    const extras = pivot.userData as Record<string, number>;
    const hingeY = pivot.position.y;
    rig = {
      pivot, screen, corners,
      seat: {
        hingeY,
        relY: (extras.screenBottomY ?? 1.25) - hingeY,
        relZ: (extras.screenBottomZ ?? -13.2) - pivot.position.z,
        targetY: extras.seatTargetY ?? 0.7,
        openX: extras.lidOpenX ?? 0,
        closedX: extras.lidClosedX ?? 1.94,
      },
    };

    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(center);
    root.scale.setScalar(FIT_SIZE / Math.max(size.x, size.y, size.z));
    root.add(model);

    // Soft contact shadow under the base.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 256;
    const context = shadowCanvas.getContext('2d')!;
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(0,0,0,0.42)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,0.16)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const shadowGeometry = new THREE.PlaneGeometry(1, 1);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(size.x * 1.35, size.z * 0.75, 1);
    shadow.position.set(0, box.min.y - center.y + 0.02, 0.12 * size.z);
    root.add(shadow);
    resources.push(shadowTexture, shadowMaterial, shadowGeometry);

    setLid(1);
    const [tl, tr, , bl] = screenCorners();
    ready(tl.distanceTo(tr) / tl.distanceTo(bl));
    setLid(0);
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
