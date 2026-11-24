import {Mesh, OrthographicCamera, PlaneGeometry, ShaderMaterial, SRGBColorSpace, Texture, Vector2} from 'three';
import type {Viseme} from './lipsync';

/**
 * Tony's advisor as a living portrait. The photo of the advisor is one dense
 * quad; a vertex shader bends her body, head, hair and jaw from a handful of
 * physical values (springs for weight, lean and hair follow-through, a breath
 * cycle, gaze and talking gestures), and a fragment shader paints what a warp
 * cannot: the dark of an open mouth, blinking lids, pupils that follow the
 * visitor and a lime rim light from the stage. Everything runs on the GPU;
 * the CPU only integrates a few springs per frame.
 *
 * Landmarks are pixel coordinates of `tony-advisor-portrait` at 1× (547×609).
 */
export const PORTRAIT = {width: 547, height: 609, centerX: 273, face: {x: 283, y: 135}, neck: {x: 283, y: 222}, eyes: [{x: 258, y: 113}, {x: 306, y: 113}], mouth: {x: 283, y: 161}, chin: 184} as const;

const VERT = /* glsl */`
uniform float uLean, uSway, uWeight, uBreath, uHeadRoll, uHeadYaw, uHeadPitch, uJaw, uWide, uShoulder;
uniform vec2 uHairLag;
varying vec2 vUv;
varying vec2 vPix;
vec2 rot(vec2 v, float a){float c=cos(a), s=sin(a); return vec2(v.x*c - v.y*s, v.x*s + v.y*c);}
void main(){
  vUv = uv;
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
  // The head turns on the neck; the face slides more than the outline, which reads as yaw.
  float headW = 1.0 - smoothstep(190.0, 238.0, y);
  p = vec2(283.0, 222.0) + rot(p - vec2(283.0, 222.0), uHeadRoll * headW);
  float faceW = (1.0 - smoothstep(38.0, 54.0, abs(x - 283.0))) * smoothstep(66.0, 90.0, y) * (1.0 - smoothstep(186.0, 202.0, y));
  p.x += uHeadYaw * (5.0 * faceW + 2.5 * headW);
  p.y += uHeadPitch * (3.0 * faceW + 1.5 * headW);
  // Hair: the long strands follow the head late and swing more at the ends.
  float hairW = smoothstep(36.0, 60.0, abs(x - 283.0)) * (1.0 - smoothstep(120.0, 150.0, abs(x - 283.0))) * (1.0 - smoothstep(420.0, 470.0, y)) * smoothstep(0.0, 30.0, y);
  hairW = max(hairW, (1.0 - smoothstep(60.0, 86.0, y)) * (1.0 - smoothstep(120.0, 150.0, abs(x - 283.0))));
  float hairLen = smoothstep(100.0, 440.0, y);
  p += uHairLag * hairW * (0.3 + 0.7 * hairLen);
  // Jaw: the lower face drops while she talks; the neck stretches to meet it.
  float jawW = smoothstep(150.0, 164.0, y) * (1.0 - smoothstep(184.0, 214.0, y)) * (1.0 - smoothstep(30.0, 46.0, abs(x - 283.0)));
  p.y += uJaw * 6.5 * jawW;
  // Lip corners: wide for "e"/"i", gathered for "o"/"u".
  float dyM = (y - 161.0) / 9.0;
  float mouthW = exp(-dyM * dyM) * (1.0 - smoothstep(14.0, 26.0, abs(x - 283.0)));
  p.x += uWide * 2.4 * sign(x - 283.0) * mouthW;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p.x, -p.y, 0.0, 1.0);
}`;

const FRAG = /* glsl */`
uniform sampler2D uMap;
uniform vec2 uSize;
uniform float uBlink, uJaw, uWide, uPupilX, uPupilY, uRim, uGlow;
varying vec2 vUv;
varying vec2 vPix;
vec2 toUv(vec2 p){return vec2(p.x / uSize.x, 1.0 - p.y / uSize.y);}
vec4 tap(vec2 p){vec4 c = texture2D(uMap, toUv(p)); c.rgb /= max(c.a, 0.002); return c;}
void main(){
  vec2 p = vPix;
  // Blink: the upper lid's skin is pulled down over each eye.
  vec2 E1 = vec2(258.0, 113.0), E2 = vec2(306.0, 113.0);
  for (int i = 0; i < 2; i++) {
    vec2 E = i == 0 ? E1 : E2;
    vec2 d = (p - E) / vec2(13.5, 8.0);
    float inEye = 1.0 - smoothstep(0.7, 1.0, dot(d, d));
    float lid = E.y - 12.0;
    float shut = p.y - uBlink * (p.y - lid);
    p.y = mix(p.y, shut, inEye);
    // Pupils drift toward where the visitor is.
    float iris = 1.0 - smoothstep(4.0, 6.5, length(vPix - E));
    p -= vec2(uPupilX, uPupilY) * 1.7 * iris * (1.0 - uBlink);
  }
  vec4 c = tap(p);
  // The inside of the mouth appears as the jaw opens.
  vec2 m = vPix - vec2(283.0, 161.5 + 3.5 * uJaw);
  float mw = 11.0 + 5.0 * max(uWide, 0.0) - 3.0 * max(-uWide, 0.0);
  float mh = 0.9 + 5.6 * uJaw;
  vec2 q = m / vec2(mw, mh);
  float cav = (1.0 - smoothstep(0.72, 1.06, dot(q, q))) * smoothstep(0.06, 0.22, uJaw);
  float teeth = cav * (1.0 - smoothstep(-mh * 0.15, mh * 0.42, m.y)) * smoothstep(0.32, 0.6, uJaw) * (1.0 - smoothstep(mw * 0.72, mw * 0.98, abs(m.x)));
  vec3 col = mix(c.rgb, vec3(0.16, 0.05, 0.06), cav * 0.92);
  col = mix(col, vec3(0.9, 0.86, 0.82), teeth * 0.8);
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
    uLean: {value: 0}, uSway: {value: 0}, uWeight: {value: 0}, uBreath: {value: 0}, uHeadRoll: {value: 0}, uHeadYaw: {value: 0}, uHeadPitch: {value: 0},
    uJaw: {value: 0}, uWide: {value: 0}, uShoulder: {value: 0}, uHairLag: {value: new Vector2()},
    uBlink: {value: 0}, uPupilX: {value: 0}, uPupilY: {value: 0}, uRim: {value: 1}, uGlow: {value: 1},
  };
  const material = new ShaderMaterial({uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, depthTest: false});
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;

  // Physical state.
  const lean = new Spring(18, 6), sway = new Spring(14, 5), weight = new Spring(3.5, 3), hairX = new Spring(60, 6.5), hairY = new Spring(80, 8);
  const yaw = new Spring(26, 7), pitch = new Spring(30, 8), roll = new Spring(34, 7), shoulder = new Spring(60, 9);
  const gazeX = new Spring(40, 10), gazeY = new Spring(40, 10), energy = new Spring(6, 4);
  let time = 0, mouthOpen = 0, mouthWide = 0, weightSide = 1, nextShift = 8, blink = 0, blinkPhase = -1, nextBlink = 2.5, nextBeat = .8, beat = 0, lastHeadX = 0, lastHeadY = 0, lastPointer = 0;
  const seed = Math.random() * 10;

  function update(input: RigInput) {
    const dt = clamp(input.dt, .001, .05);
    if (input.reduced) {
      // Still, but her mouth may follow the voice so the words are visibly hers.
      mouthOpen += (input.mouth.open * .7 - mouthOpen) * Math.min(1, dt * 18);
      uniforms.uJaw.value = mouthOpen; uniforms.uWide.value = input.mouth.wide * .5;
      return;
    }
    time += dt;
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
    uniforms.uPupilX.value = gx; uniforms.uPupilY.value = gy * .7;

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

    // Blinks: quick close, slower open, now and then a double.
    if (blinkPhase < 0 && time > nextBlink) {blinkPhase = 0; nextBlink = time + 2.2 + Math.random() * 4 + (Math.random() < .2 ? -2 : 0);}
    if (blinkPhase >= 0) {
      blinkPhase += dt;
      blink = blinkPhase < .07 ? blinkPhase / .07 : blinkPhase < .19 ? 1 - (blinkPhase - .07) / .12 : 0;
      if (blinkPhase >= .19) blinkPhase = -1;
    }
    uniforms.uBlink.value = clamp(blink, 0, 1);

    // Mouth: fast attack, softer release, so consonants stay crisp and vowels blend.
    const targetOpen = input.mouth.open, k = targetOpen > mouthOpen ? 26 : 14;
    mouthOpen += (targetOpen - mouthOpen) * Math.min(1, dt * k);
    mouthWide += (input.mouth.wide * .8 + (1 - talking) * .15 - mouthWide) * Math.min(1, dt * 16);
    uniforms.uJaw.value = clamp(mouthOpen, 0, 1);
    uniforms.uWide.value = clamp(mouthWide, -1, 1);
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
      const texture = uniforms.uMap.value;
      if (texture) {const bitmap = texture.source?.data; if (typeof ImageBitmap !== 'undefined' && bitmap instanceof ImageBitmap) bitmap.close(); texture.dispose();}
    },
  };
}
