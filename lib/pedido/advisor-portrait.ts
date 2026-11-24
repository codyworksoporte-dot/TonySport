import {Mesh, OrthographicCamera, PlaneGeometry, ShaderMaterial, SRGBColorSpace, Texture, Vector2} from 'three';
import type {Viseme} from './lipsync';

/**
 * The head moves as a unit. Registered photos supply the parted lips and
 * closed eyelids. Shader coordinates are in logical pixels (the art is 2×).
 */
const PORTRAIT = {width: 547, height: 609} as const;

const VERT = /* glsl */`
uniform float uLean, uSway, uWeight, uBreath, uHeadRoll, uHeadYaw, uHeadPitch, uShoulder;
uniform vec2 uHairLag;
varying vec2 vPix;
vec2 rot(vec2 v, float a){float c=cos(a), s=sin(a); return vec2(v.x*c - v.y*s, v.x*s + v.y*c);}
void main(){
  float x = position.x, y = -position.y;
  vPix = vec2(x, y);
  vec2 p = vec2(x, y);
  // Weight on the hips: the whole figure leans from the bottom edge.
  p = vec2(273.0, 609.0) + rot(p - vec2(273.0, 609.0), uLean);
  float bodyW = pow(clamp(1.0 - y / 609.0, 0.0, 1.0), 1.15);
  p.x += uSway * bodyW;
  float hipW = smoothstep(380.0, 520.0, y) * (1.0 - smoothstep(520.0, 609.0, y));
  p.x += uWeight * hipW;
  // Breathing: the chest widens a little and everything above it rises.
  float chestW = smoothstep(200.0, 250.0, y) * (1.0 - smoothstep(330.0, 400.0, y));
  p.x += (x - 273.0) * 0.012 * uBreath * chestW;
  p.y -= 2.4 * uBreath * (1.0 - smoothstep(250.0, 340.0, y));
  // Shoulders can shrug on a spoken beat.
  float shoulderW = smoothstep(190.0, 235.0, y) * (1.0 - smoothstep(235.0, 300.0, y)) * smoothstep(40.0, 90.0, abs(x - 273.0));
  p.y -= uShoulder * shoulderW;
  // Carry the eyes, nose and cheeks together as the head turns on the neck.
  float headW = 1.0 - smoothstep(190.0, 238.0, y);
  p = vec2(283.0, 222.0) + rot(p - vec2(283.0, 222.0), uHeadRoll * headW);
  p += vec2(3.5 * uHeadYaw, 2.0 * uHeadPitch) * headW;
  // Hair: the long strands follow the head late and swing more at the ends.
  float hairW = smoothstep(48.0, 70.0, abs(x - 283.0)) * (1.0 - smoothstep(120.0, 150.0, abs(x - 283.0))) * (1.0 - smoothstep(420.0, 470.0, y)) * smoothstep(0.0, 30.0, y);
  hairW = max(hairW, (1.0 - smoothstep(60.0, 86.0, y)) * (1.0 - smoothstep(120.0, 150.0, abs(x - 283.0))));
  float hairLen = smoothstep(100.0, 440.0, y);
  p += uHairLag * hairW * (0.3 + 0.7 * hairLen);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p.x, -p.y, 0.0, 1.0);
}`;

const FRAG = /* glsl */`
uniform sampler2D uMap, uExpressions;
uniform bool uHasExpressions;
uniform vec2 uSize;
uniform float uJaw, uWide, uBlink, uRim, uGlow;
varying vec2 vPix;
vec2 toUv(vec2 p){return vec2(p.x / uSize.x, 1.0 - p.y / uSize.y);}
// Both images are authored at 2x. Compute the footprint before any facial
// branches so neighboring fragments agree on mip levels, including on mobile.
mat2 footprint;
vec4 tap(vec2 p){
  vec4 c = textureGrad(uMap, toUv(p), footprint[0] / uSize, footprint[1] / uSize);
  c.rgb /= max(c.a, 0.002);
  return c;
}
vec3 expressionAt(vec2 p){
  vec2 size = vec2(95.0, 80.0);
  vec2 uv = (p - vec2(235.0, 97.0)) / size;
  return textureGrad(uExpressions, vec2(uv.x, 1.0 - uv.y), footprint[0] / size, footprint[1] / size).rgb;
}
vec4 eyelid(vec2 p){
  vec4 photo = tap(p);
  bool left = p.x < 282.0;
  // Signed distance from the lash center, positive toward the nose.
  float x = (left ? p.x - 258.5 : 307.5 - p.x) / 13.0;
  float mask = (1.0 - smoothstep(0.98, 1.45, abs(x)))
             * smoothstep(98.0, 103.0, p.y) * (1.0 - smoothstep(122.0, 127.0, p.y));
  if (mask == 0.0) return photo;
  x = clamp(x, -1.0, 1.0);
  float closedLash = 116.7 - 2.7*x*x + 0.55*x;
  float remaining = (1.0 - uBlink) * 9.8 * (1.0 - x*x);
  float lash = closedLash - remaining;
  float lid = 1.0 - smoothstep(lash + 0.4, lash + 1.3, p.y);
  // The lid passes in front of the stationary iris. Only its own texture
  // moves. At full closure both lids meet in the photographed resting pose.
  lid = mix(lid, 1.0, smoothstep(0.80, 1.0, uBlink));
  float follow = smoothstep(99.0, lash, p.y);
  vec3 skin = expressionAt(p + vec2(0.0, remaining * follow));
  photo.rgb = mix(photo.rgb, skin, mask * lid * smoothstep(0.0, 0.22, uBlink));
  return photo;
}
vec4 samplePortrait(vec2 p){
  if (uHasExpressions && uBlink > 0.0 && p.y > 97.0 && p.y < 128.0) return eyelid(p);
  if (uJaw == 0.0 && uWide == 0.0) return tap(p);
  // Trace the lip line and feather inward from its outline. Skin around it
  // always comes from the portrait, even if a phone filters the atlas differently.
  vec2 offset = p - vec2(282.5, 161.6);
  if (abs(offset.x) > 23.0 || abs(offset.y) > 13.0) return tap(p);
  float x = offset.x / 20.5;
  float y = offset.y + 1.9 * x * x + 0.25 * x;
  vec2 contour = vec2(offset.x / 23.0, (y - 1.0) / 10.0);
  float lip = 1.0 - smoothstep(0.44, 1.0, dot(contour, contour));
  if (lip == 0.0) return tap(p);
  float lowerLip = smoothstep(-1.5, 3.0, y);
  float opening = smoothstep(0.0, 0.74, uJaw);
  float travel = lip * mix(-0.65, 1.85, lowerLip);
  p.x -= lip * uWide * x * 1.8;
  vec4 closed = tap(p - vec2(0.0, opening * travel));
  if (!uHasExpressions || opening <= 0.0) return closed;
  vec3 openColor = expressionAt(p + vec2(0.0, (1.0 - opening) * travel));
  closed.rgb = mix(closed.rgb, openColor, opening * lip);
  return closed;
}
void main(){
  vec2 p = vPix;
  footprint = mat2(dFdx(p) * vec2(1.0, -1.0), dFdy(p) * vec2(1.0, -1.0));
  vec4 c = samplePortrait(p);
  vec3 col = c.rgb;
  // Stage light: lime rim from the upper right, a cooler green from the left, and the floor glow.
  float aR = texture2D(uMap, toUv(p + vec2(2.6, -1.4))).a;
  float aL = texture2D(uMap, toUv(p + vec2(-2.4, 1.2))).a;
  float rim = clamp((c.a - aR) * 1.6, 0.0, 1.0) * uRim;
  float rim2 = clamp((c.a - aL) * 1.2, 0.0, 1.0) * uRim * 0.45;
  col += vec3(0.74, 1.0, 0.36) * rim * 0.8 + vec3(0.36, 0.9, 0.56) * rim2 * 0.5;
  col += vec3(0.32, 0.58, 0.1) * smoothstep(360.0, 609.0, vPix.y) * uGlow * 0.16;
  gl_FragColor = vec4(col, c.a);
  #include <colorspace_fragment>
}`;

export type Framing = 'full' | 'bust';
export type RigInput = {dt: number; now: number; speaking: boolean; mouth: Viseme; reduced: boolean; pointer: {x: number; y: number; active: boolean}};

class Spring {
  value = 0; velocity = 0;
  constructor(public stiffness: number, public damping: number, value = 0) {this.value = value;}
  step(target: number, dt: number) {
    const force = (target - this.value) * this.stiffness - this.velocity * this.damping;
    this.velocity += force * dt;
    this.value += this.velocity * dt;
    return this.value;
  }
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Deterministic wander from a few incommensurable sines; `seed` separates channels. */
const wander = (t: number, seed: number) => (Math.sin(t * .31 + seed) + Math.sin(t * .53 + seed * 2.1) * .6 + Math.sin(t * .17 + seed * .7) * .8) / 2.4;

export function createPortraitRig() {
  const {width: W, height: H} = PORTRAIT;
  const geometry = new PlaneGeometry(W, H, 72, 112);
  geometry.translate(W / 2, -H / 2, 0);
  const uniforms = {
    uMap: {value: null as Texture | null}, uSize: {value: new Vector2(W, H)},
    uExpressions: {value: null as Texture | null}, uHasExpressions: {value: false}, uBlink: {value: 0},
    uLean: {value: 0}, uSway: {value: 0}, uWeight: {value: 0}, uBreath: {value: 0}, uHeadRoll: {value: 0}, uHeadYaw: {value: 0}, uHeadPitch: {value: 0},
    uJaw: {value: 0}, uWide: {value: 0}, uShoulder: {value: 0}, uHairLag: {value: new Vector2()},
    uRim: {value: 1}, uGlow: {value: 1},
  };
  const material = new ShaderMaterial({uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false});
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;

  // Physical state.
  const lean = new Spring(18, 6), sway = new Spring(14, 5), weight = new Spring(3.5, 3), hairX = new Spring(60, 6.5), hairY = new Spring(80, 8);
  const yaw = new Spring(26, 7), pitch = new Spring(30, 8), roll = new Spring(34, 7), shoulder = new Spring(60, 9);
  const gazeX = new Spring(40, 10), gazeY = new Spring(40, 10), energy = new Spring(6, 4);
  let time = 0, weightSide = 1, nextShift = 8, nextBeat = .8, beat = 0, lastHeadX = 0, lastHeadY = 0, lastPointer = 0;
  const seed = Math.random() * 10;
  let nextBlink = 3 + Math.random() * 2;

  function update(input: RigInput) {
    const dt = clamp(input.dt, .001, .05);
    // Ease between syllables, and restore the exact resting portrait on the
    // last speech frame (the reduced-motion renderer may sleep immediately).
    const blend = 1 - Math.exp(-18 * dt);
    const strength = input.reduced ? 0.7 : 1;
    const jaw = uniforms.uJaw, width = uniforms.uWide;
    jaw.value = input.speaking ? jaw.value + (clamp(input.mouth.open, 0, 1) * strength - jaw.value) * blend : 0;
    width.value = input.speaking ? width.value + (clamp(input.mouth.wide, -1, 1) * strength - width.value) * blend : 0;
    uniforms.uBlink.value = 0;
    if (input.reduced) return;
    time += dt;
    const blinkTime = time - nextBlink;
    if (blinkTime >= 0) {
      const close = Math.min(blinkTime / 0.085, 1);
      const reopen = clamp((blinkTime - 0.11) / 0.13, 0, 1);
      uniforms.uBlink.value = Math.sin(close * Math.PI / 2) * Math.cos(reopen * Math.PI / 2);
      if (reopen === 1) nextBlink = time + 3 + Math.random() * 3;
    }
    const talking = energy.step(input.speaking ? 1 : 0, dt);
    const pointer = input.pointer;
    if (pointer.active) lastPointer = time;
    const recentPointer = time - lastPointer < 6;

    // Weight shifts from one hip to the other every few seconds; the lean follows.
    if (time > nextShift) {weightSide = -weightSide; nextShift = time + 7 + Math.random() * 6;}
    const w = weight.step(weightSide * 3, dt);
    const leanTarget = w * .0009 + wander(time, seed) * .006 * (1 + talking * .7) + (recentPointer ? pointer.x * .006 : 0);
    const swayTarget = wander(time * .9, seed + 3) * 3.5 * (1 + talking) + (recentPointer ? pointer.x * 2.5 : 0);
    uniforms.uLean.value = lean.step(leanTarget, dt);
    uniforms.uSway.value = sway.step(swayTarget, dt);
    uniforms.uWeight.value = w;

    // Breath: slower at rest, lighter and quicker while talking.
    const period = 3.9 - talking * 1.2;
    uniforms.uBreath.value = (Math.sin(time * Math.PI * 2 / period - 1.2) * .5 + .5) * (1 - talking * .35);

    // Gaze: toward the visitor's pointer, otherwise a slow wander; the head follows a fraction of it.
    const gxTarget = recentPointer ? pointer.x : wander(time * .6, seed + 5) * .5;
    const gyTarget = recentPointer ? pointer.y : wander(time * .5, seed + 8) * .3;
    const gx = gazeX.step(clamp(gxTarget, -1, 1), dt), gy = gazeY.step(clamp(gyTarget, -1, 1), dt);

    // Talking beats: small nods, tilts and shrugs on an irregular rhythm.
    if (time > nextBeat) {
      beat = input.speaking ? (Math.random() - .5) * 2 : 0;
      nextBeat = time + (input.speaking ? .45 + Math.random() * .7 : 1.5 + Math.random() * 2);
      if (input.speaking && Math.random() < .25) shoulder.velocity += 25;
    }
    const nod = Math.sin(time * 2.1) * .14 * talking;
    uniforms.uHeadYaw.value = yaw.step(gx * .55 + wander(time * .8, seed + 1) * .22 + beat * .25 * talking, dt);
    uniforms.uHeadPitch.value = pitch.step(gy * .4 + nod + wander(time * .7, seed + 2) * .12, dt);
    uniforms.uHeadRoll.value = roll.step(wander(time * .5, seed + 4) * .02 + beat * .035 * talking + w * .0012, dt);
    uniforms.uShoulder.value = clamp(shoulder.step(0, dt), 0, 3);

    // Hair follow-through: it lags behind the head's motion and swings back.
    const headX = uniforms.uSway.value + uniforms.uHeadYaw.value * 6 + Math.sin(uniforms.uLean.value) * 380;
    const headY = -uniforms.uBreath.value * 2.4 + uniforms.uHeadPitch.value * 3;
    const vx = (headX - lastHeadX) / dt, vy = (headY - lastHeadY) / dt;
    lastHeadX = headX; lastHeadY = headY;
    uniforms.uHairLag.value.set(hairX.step(clamp(-vx * .045, -9, 9), dt), hairY.step(clamp(-vy * .04, -5, 5) + 1.2 * (1 - Math.cos(uniforms.uLean.value * 4)) , dt));

    uniforms.uGlow.value = .8 + talking * .5;
  }

  /** Points the orthographic camera so the figure fills the stage: full body for the column, head and shoulders for the small card. */
  function frame(camera: OrthographicCamera, w: number, h: number, framing: Framing) {
    let scale: number, cx: number, topPad: number;
    if (framing === 'bust') {
      // Head and shoulders fill the small card.
      cx = 283; topPad = -2;
      scale = Math.max(w / (W * .46), (h + 6) / (H - topPad));
    } else {
      // The whole figure fits the height; a narrow column may crop the elbows, a wide scene leaves air around her.
      cx = 276; topPad = -14;
      scale = (h + 4) / (H - topPad);
      scale = Math.min(scale, (w * 1.35) / W);
      scale = Math.max(scale, (w * .5) / W);
    }
    camera.left = cx - w / (2 * scale); camera.right = cx + w / (2 * scale);
    camera.top = -topPad; camera.bottom = -(topPad + h / scale);
    camera.updateProjectionMatrix();
  }

  return {
    mesh,
    update,
    frame,
    setExpressions(texture: Texture) {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 4;
      uniforms.uExpressions.value = texture;
      uniforms.uHasExpressions.value = true;
    },
    setTexture(texture: Texture) {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 4;
      texture.needsUpdate = true;
      uniforms.uMap.value = texture;
      material.needsUpdate = true;
    },
    setPointerMotion(active: boolean) {if (active) lastPointer = time;},
    dispose() {
      geometry.dispose(); material.dispose();
      uniforms.uExpressions.value?.dispose();
      const texture = uniforms.uMap.value;
      if (texture) {const bitmap = texture.source?.data; if (typeof ImageBitmap !== 'undefined' && bitmap instanceof ImageBitmap) bitmap.close(); texture.dispose();}
    },
  };
}
