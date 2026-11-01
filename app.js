// 芽芽小星球 · 3D 试玩版
// 用普通 <script> 加载 three.js（不用 importmap / ES 模块），老款 iPhone、iPad 也能运行，双击 index.html 也能打开。
(async () => {
  const $ = (selector) => document.querySelector(selector);
  const startButton = $("#start");

  const THREE = window.THREE;
  const GLTFLoader = THREE && THREE.GLTFLoader;
  if (!GLTFLoader) {
    startButton.textContent = "3D 引擎加载失败，请联网后刷新";
    return;
  }
  // 与新版 three.js 一致的颜色和灯光计算
  THREE.ColorManagement.legacyMode = false;
  let maxAnisotropy = 1;
  const srgb = (tex) => {
    tex.encoding = THREE.sRGBEncoding;
    // 斜着看的时候文字也清楚
    tex.anisotropy = maxAnisotropy;
    return tex;
  };
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  // 手机省电模式：简化阴影和灯光、限制到每秒 30 帧；分辨率先用 2 倍，跑不动再自动降
  const LOW_POWER = isTouch || new URLSearchParams(location.search).get("lowpower") === "1";

  const V3 = THREE.Vector3;
  const ASSETS = window.YAYA_ASSETS || {};

  // ---------- 世界参数 ----------
  const SUN_DIR = new V3(0.35, 0.3, -1).normalize();
  const UP0 = new V3(0, 1, 0);
  const FWD0 = new V3(0, 0, -1);
  const RIGHT0 = new V3(1, 0, 0);

  // ---------- 星球配置：每颗星球练一个短元音、一个词族 ----------
  // 选项 audio 对应 assets/audio/<audio>.(mp3|m4a)；ls- 开头的是单独的字母音
  // 单独的辅音直接用字母音（ls-<字母>），整个游戏里同一个音只有一种声音
  const phoneme = (value, note) => ({ value, label: `/${value}/`, note, audio: `ls-${value}` });
  const wordChoice = (value) => ({ value, label: value.toLowerCase(), note: "", audio: value });
  // 每个字母的例词和图：和家里用的《26 个字母表及单词卡》一致。
  // x 用 fox 不用 x-ray：x-ray 开头读的是字母名 "ex"，不是自然拼读要教的 /ks/
  const KEYWORDS = {
    a: ["apple", "🍎"], b: ["band-aid", "🩹"], c: ["cow", "🐮"], d: ["dog", "🐶"], e: ["elephant", "🐘"],
    f: ["fish", "🐟"], g: ["goat", "🐐"], h: ["house", "🏠"], i: ["igloo", "🧊"], j: ["jelly", "🍇"],
    k: ["key", "🔑"], l: ["lip", "👄"], m: ["mouse", "🐭"], n: ["nest", "🐣"], o: ["octopus", "🐙"],
    p: ["pig", "🐷"], q: ["quilt", "🛏️"], r: ["rainbow", "🌈"], s: ["soap", "🧼"], t: ["turtle", "🐢"],
    u: ["umbrella", "☂️"], v: ["volcano", "🌋"], w: ["web", "🕸️"], x: ["fox", "🦊"], y: ["yarn", "🧶"],
    z: ["zebra", "🦓"],
  };
  const VOWELS = ["a", "e", "i", "o", "u"];
  const PLANETS = {
    // 第一阶段：字母星球。每颗学 6 个字母（只学声音），最后用这几个字母拼 2–3 个词
    l01: {
      id: "l01",
      kind: "letters",
      code: "A-01",
      name: "字母星球",
      vowel: "s a t i p n",
      seed: 41,
      grass: [0.31, 0.05],
      first: [],
      later: [],
      next: "b01",
      order: ["s", "a", "t", "i", "p", "n"],
      letters: {
        s: { color: "#e0705f", freq: 523.25 },
        a: { color: "#f0b84d", freq: 587.33 },
        t: { color: "#5fb0cf", freq: 659.25 },
        i: { color: "#62b85a", freq: 698.46 },
        p: { color: "#9b7fe0", freq: 783.99 },
        n: { color: "#f08fb0", freq: 880 },
      },
      // 认识它：例词和图
      keywords: KEYWORDS,
      // 拼词：按顺序拼，只用这颗星球学过的字母
      blend: ["sit", "ant", "pan"],
      words: { sit: "小板凳", ant: "小蚂蚁", pan: "平底锅" },
      spots: { s: [34, 15], a: [58, 100], t: [84, 200], i: [62, -85], p: [108, 40], n: [118, -145] },
      tent: [30, -70],
      props: { tree: 14, treeHigh: 6, rocks: 5, stones: 6, plant: 18 },
      challenges: {},
      altarLabel: ["🔤 ?", "拼一拼"],
      intro: "这颗星球上住着 6 个字母。<br />认识它们、描一描、听一听，<b>最后用它们拼出词</b>。",
      done: { emoji: "🐜🍳🪑", title: "s a t i p n！", text: "6 个字母都学会了，还拼出了 <b>sit、ant、pan</b>。<br />天上的<b>猫星球</b>亮起来了！", voice: "done-l01" },
    },
    // 第二阶段：词语星球
    b01: {
      id: "b01",
      code: "B-01",
      name: "猫星球",
      vowel: "/æ/",
      family: "at",
      seed: 7,
      grass: [0.26, 0.06],
      first: ["c", "a", "t"],
      later: ["h", "b"],
      next: "b02",
      letters: {
        c: { color: "#e0705f", freq: 523.25 },
        a: { color: "#f0b84d", freq: 659.25 },
        t: { color: "#5fb0cf", freq: 783.99 },
        h: { color: "#62b85a", freq: 587.33 },
        b: { color: "#9b7fe0", freq: 698.46 },
      },
      words: { cat: "方方猫", hat: "帽子", bat: "小蝙蝠" },
      spots: { c: [36, 10], a: [72, 120], t: [100, 235], h: [62, -110], b: [125, 40] },
      tent: [30, -70],
      props: { tree: 16, treeHigh: 6, rocks: 5, stones: 6, plant: 16 },
      challenges: {
        c: { type: "first", audio: "cat", answer: "k", question: "听 <b>cat</b>，开头是什么声音？",
          choices: [phoneme("k", "轻轻咳一下"), phoneme("h", "呼一口气"), phoneme("p", "双唇弹开")] },
        a: { type: "middle", audio: "cat", answer: "bag", question: "哪个词中间的声音和 <b>cat</b> 一样？",
          choices: [wordChoice("bag"), wordChoice("bug"), wordChoice("big")] },
        t: { type: "end", audio: "cat", answer: "hat", question: "哪个词和 <b>cat</b> 一样，用 /t/ 结尾？",
          choices: [wordChoice("hat"), wordChoice("hen"), wordChoice("sun")] },
        h: { type: "first", audio: "hat", answer: "h", question: "听 <b>hat</b>，开头是什么声音？",
          choices: [phoneme("h", "呼一口气"), phoneme("k", "轻轻咳一下"), phoneme("b", "双唇一碰")] },
        b: { type: "first", audio: "bat", answer: "b", question: "听 <b>bat</b>，开头是什么声音？",
          choices: [phoneme("b", "双唇一碰"), phoneme("p", "双唇弹开"), phoneme("d", "舌尖轻点")] },
      },
      done: { emoji: "🐱🎩🦇", title: "cat、hat、bat！", text: "只换第一个字母，就变出了新的词。<br />它们都是 <b>-at</b> 家族的。天上那颗<b>小鸡星球</b>亮起来了！", voice: "done" },
    },
    b02: {
      id: "b02",
      code: "B-02",
      name: "小鸡星球",
      vowel: "/e/",
      family: "en",
      seed: 23,
      grass: [0.15, 0.05],
      first: ["h", "e", "n"],
      later: ["p", "t"],
      next: null,
      letters: {
        h: { color: "#62b85a", freq: 523.25 },
        e: { color: "#f08fb0", freq: 659.25 },
        n: { color: "#5fb0cf", freq: 783.99 },
        p: { color: "#9b7fe0", freq: 587.33 },
        t: { color: "#e0705f", freq: 698.46 },
      },
      words: { hen: "绒绒鸡", pen: "彩虹笔", ten: "十颗星星" },
      spots: { h: [38, -25], e: [74, 95], n: [104, 215], p: [64, 150], t: [118, -70] },
      tent: [28, 60],
      props: { tree: 8, treeHigh: 12, rocks: 7, stones: 8, plant: 22 },
      challenges: {
        h: { type: "first", audio: "hen", answer: "h", question: "听 <b>hen</b>，开头是什么声音？",
          choices: [phoneme("h", "呼一口气"), phoneme("k", "轻轻咳一下"), phoneme("m", "闭嘴哼一声")] },
        e: { type: "middle", audio: "hen", answer: "bed", question: "哪个词中间的声音和 <b>hen</b> 一样？",
          choices: [wordChoice("bed"), wordChoice("bag"), wordChoice("big")] },
        n: { type: "end", audio: "hen", answer: "sun", question: "哪个词和 <b>hen</b> 一样，用 /n/ 结尾？",
          choices: [wordChoice("sun"), wordChoice("cat"), wordChoice("hat")] },
        p: { type: "first", audio: "pen", answer: "p", question: "听 <b>pen</b>，开头是什么声音？",
          choices: [phoneme("p", "双唇弹开"), phoneme("b", "双唇一碰"), phoneme("t", "舌尖弹一下")] },
        t: { type: "first", audio: "ten", answer: "t", question: "听 <b>ten</b>，开头是什么声音？",
          choices: [phoneme("t", "舌尖弹一下"), phoneme("d", "舌尖轻点"), phoneme("k", "轻轻咳一下")] },
      },
      done: { emoji: "🐥🖍️⭐", title: "hen、pen、ten！", text: "又一个词族学会啦！它们都是 <b>-en</b> 家族的。<br />下一颗星球还在建造中，先回猫星球看看小伙伴吧。", voice: "done-b02" },
    },
  };

  PLANETS.l02 = { ...window.YAYA_SECOND_PLANET.planet, keywords: KEYWORDS };
  PLANETS.l01.next = "l02";
  PLANETS.l01.done = window.YAYA_SECOND_PLANET.previousDone;
  // 新路线：一颗星球只学一个字母（A → S → T → I → P），每颗有自己的故事和玩法。
  // 旧的六字母星球和词族星球留在代码里，但不再出现在路线上。
  PLANETS.a01 = { ...window.YAYA_PLANET_A.planet, keywords: KEYWORDS };
  Object.assign(PLANETS, window.YAYA_PLANET_A.soon);
  if(window.YAYA_PLANET_S) PLANETS.s01={...YAYA_PLANET_S.planet,keywords:KEYWORDS};
  if(window.YAYA_PLANET_T) PLANETS.t01={...YAYA_PLANET_T.planet,keywords:KEYWORDS};
  const PLANET_ROUTE = ["a01", "s01", "t01", "i01", "p01"];
  if(window.YAYA_PLANET_I) PLANETS.i01={...YAYA_PLANET_I.planet,keywords:KEYWORDS};
  // P 泡泡星球：完整课程；preview / r2test 仍使用隔离存档。
  if(window.YAYA_PLANET_P) PLANETS.p01={...YAYA_PLANET_P.planet,keywords:KEYWORDS};
  const PREVIEW_ONLY = [];
  const requestedPreview = new URLSearchParams(location.search).get("preview");
  // Preview uses isolated progress; the normal route includes all five completed planets.
  const PREVIEW_PLANET = (PLANET_ROUTE.includes(requestedPreview) || (PREVIEW_ONLY.includes(requestedPreview) && PLANETS[requestedPreview])) && !PLANETS[requestedPreview].soon ? requestedPreview : null;
  const STORE_PREFIX = PREVIEW_PLANET ? (new URLSearchParams(location.search).has("r2test")?"yaya-round2-test-"+(new URLSearchParams(location.search).get("r2test")||"1").replace(/[^a-z0-9_-]/gi,"")+":":"yaya-preview:") : "";
  const storageKey = key => STORE_PREFIX + key;

  // 试玩使用独立命名空间；保存、旅行和清空均不能碰正式冒险。
  function readStore(key) {
    try {
      return JSON.parse(localStorage.getItem(storageKey(key)));
    } catch (error) {
      return null;
    }
  }
  function writeStore(key, value) {
    try {
      if (value === null) localStorage.removeItem(storageKey(key));
      else localStorage.setItem(storageKey(key), JSON.stringify(value));
    } catch (error) {
      // 存不了就算了
    }
  }
  const PROGRESS_KEY = "yaya-progress";
  const planetSaveKey = (id) => `yaya-planet-${id}`;
  const progress = readStore(PROGRESS_KEY) || { current: "a01" };
  // 换成“一颗星球一个字母”以后，老进度从苹果星球重新开始；旧星球的存档原样保留
  if (!progress.single) {
    progress.current = "a01";
    progress.letters = true;
    progress.single = true;
    writeStore(PROGRESS_KEY, progress);
  }
  if (PREVIEW_PLANET) {
    progress.current = PREVIEW_PLANET;
    writeStore(PROGRESS_KEY, progress);
  }
  const playable = (id) => Boolean(PLANETS[id] && !PLANETS[id].soon && (PLANET_ROUTE.includes(id) || (PREVIEW_PLANET && id === PREVIEW_PLANET)));
  const PLANET = playable(progress.current) ? PLANETS[progress.current] : PLANETS.a01;
  const LARGE_WORLD = PLANET.id === "a01" || (PLANET.id === "s01" && !!window.YayaPlanetSWorld) || (PLANET.id === "t01" && !!window.YayaPlanetTWorld) || (PLANET.id === "i01" && !!window.YayaPlanetIWorld) || (PLANET.id === "p01" && !!window.YayaPlanetPWorld);
  const R = LARGE_WORLD ? 16 : 9;
  const SURF = R + 0.7;
  const WALK_SPEED = LARGE_WORLD ? 4.2 : 3.2;
  let routeSpeed = 1;   // T race: multiplier for the route speed (Toto runs slower)
  document.body.dataset.planet=PLANET.id;
  document.title=`芽芽小星球｜${PLANET.code} ${PLANET.name}`;
  const COURSE=PLANET.id==="s01"?window.YAYA_PLANET_S:PLANET.id==="t01"?window.YAYA_PLANET_T:PLANET.id==="i01"?window.YAYA_PLANET_I:PLANET.id==="p01"?window.YAYA_PLANET_P:window.YAYA_PLANET_A;
  const IS_I = PLANET.id === "i01";
  const IS_P = PLANET.id === "p01";
  // The final-planet branch keeps its shared key, with the current planet's family and place.
  if (IS_P) {
    window.YAYA_VOICE_LINES['welcome-last'] = window.YAYA_VOICE_LINES['p01-welcome-last'];
    ASSETS['voice/welcome-last.m4a'] = ASSETS['voice/p01-welcome-last.m4a'];
  }
  const LETTER=(PLANET.order||["a"])[0];
  const planetDone = (id) => {
    const data = readStore(planetSaveKey(id));
    const total = Object.keys(PLANETS[id].words).length;
    return Boolean(total && data?.made && Object.keys(PLANETS[id].words).every(key=>data.made.includes(key)));
  };
  // 第一颗随时能去；后面的星球要先完成前一颗（已经玩过的星球也能回去）；还在建造的去不了
  const planetUnlocked = (id) => playable(id) && (id === PLANET_ROUTE[0]
    || Object.values(PLANETS).some((pl) => pl.next === id && planetDone(pl.id)));

  const IS_LETTERS = PLANET.kind === "letters";
  const ORDER = PLANET.order || [];
  const LETTERS = PLANET.letters;
  const WORD = PLANET.first; // 第一个词
  const LATER = PLANET.later; // 拼出第一个词以后才亮起来的水晶
  const ALL_LETTERS = IS_LETTERS ? ORDER : [...WORD, ...LATER];
  const FAMILY = PLANET.family || ""; // 词族：只换第一个字母，就变出新东西
  const FIRST_WORD = WORD.join("");
  const WORDS = PLANET.words;
  const CHALLENGES = PLANET.challenges;

  // ---------- 小工具 ----------
  function mulberry32(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(PLANET.seed);
  const ease = (k) => 1 - Math.pow(1 - k, 3);
  const arc = (a, b) => a.angleTo(b) * SURF;

  // 从出生点（星球顶部）出发，偏离 polar 度、朝 azim 度方向的球面方向
  function dirFrom(polarDeg, azimDeg) {
    const p = THREE.MathUtils.degToRad(polarDeg);
    const a = THREE.MathUtils.degToRad(azimDeg);
    const side = FWD0.clone().multiplyScalar(Math.cos(a)).addScaledVector(RIGHT0, Math.sin(a));
    return UP0.clone().multiplyScalar(Math.cos(p)).addScaledVector(side, Math.sin(p)).normalize();
  }

  function tangent(vec, up) {
    return vec.clone().addScaledVector(up, -vec.dot(up)).normalize();
  }

  // 沿球面从 dir 朝切向 tan 走 dist 距离
  function moveAlong(dir, tan, dist) {
    const axis = new V3().crossVectors(dir, tan);
    if (axis.lengthSq() < 1e-10) return dir.clone();
    return dir.clone().applyAxisAngle(axis.normalize(), dist / SURF);
  }

  const basis = new THREE.Matrix4();
  function orient(obj, up, fwd) {
    const f = tangent(fwd, up);
    const x = new V3().crossVectors(up, f);
    basis.makeBasis(x, up, f);
    obj.quaternion.setFromRotationMatrix(basis);
  }

  const tweens = [];
  function tween(duration, fn) {
    return new Promise((resolve) => tweens.push({ t: 0, duration, fn, resolve }));
  }
  const wait = (seconds) => tween(seconds, () => {});

  // ---------- 渲染器与场景 ----------
  const canvas = $("#world");
  window.YayaBoot && window.YayaBoot.step("创建 3D 画面");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: LOW_POWER ? "low-power" : "default" });
  let pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = LOW_POWER ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;
  // Round 4: warm filmic grade for the big world only (S/T planets keep their original look).
  if (LARGE_WORLD) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = PLANET.id === "i01" ? .76 : .92; }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1200);
  let camDist = (PLANET.camera && PLANET.camera.dist) || 9;

  function resize() {
    const width = window.innerWidth, height = window.innerHeight;
    if (!(width > 0 && height > 0)) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camDist = PLANET.camera ? PLANET.camera.dist + (camera.aspect < .8 ? (LARGE_WORLD?3:.6) : 0) : camera.aspect < 0.8 ? 12 : 9;
    camera.fov = LARGE_WORLD ? (camera.aspect < .8 ? 66 : 55) : camera.aspect < 0.8 ? (PLANET.practice?60:70) : 55;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // 天空：太阳那一侧是黄昏，背面是星夜
  const skyGroup = new THREE.Group();
  scene.add(skyGroup);
  skyGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(500, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { sunDir: { value: SUN_DIR } },
      vertexShader: `varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 sunDir; varying vec3 vDir;
        void main() {
          float t = dot(normalize(vDir), sunDir);
          vec3 c = mix(vec3(0.46, 0.43, 0.69), vec3(0.71, 0.61, 0.81), smoothstep(-0.75, 0.65, t));
          float warm = smoothstep(-0.35, 0.65, -vDir.x + 0.12);
          c = mix(c, vec3(1.0, 0.75, 0.66), warm * 0.9);
          c = mix(c, vec3(1.0, 0.93, 0.72), pow(warm, 4.0) * 0.6);
          float haze = sin(vDir.x*17.0 + sin(vDir.y*12.0))*sin(vDir.y*15.0-vDir.z*9.0);
          c += haze * 0.018;
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  ));

  {
    const count = 700;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const d = new V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize();
      positions.set(d.clone().multiplyScalar(450).toArray(), i * 3);
      const b = (1 - THREE.MathUtils.smoothstep(d.dot(SUN_DIR), -0.3, 0.55)) * (0.5 + rng() * 0.5);
      colors.set([b, b, b * 0.9 + 0.1], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    skyGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 1.4, sizeAttenuation: false, vertexColors: true, depthWrite: false, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending,
    })));
  }

  function glowTexture(inner, outer) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, inner);
    grad.addColorStop(1, outer);
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    return srgb(tex);
  }
  {
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture("rgba(255,244,214,1)", "rgba(255,180,120,0)"),
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sunSprite.position.copy(SUN_DIR).multiplyScalar(420);
    sunSprite.scale.setScalar(PLANET.id === "i01" ? 42 : PLANET.id === "p01" ? 50 : 85);
    sunSprite.material.opacity = PLANET.id === "i01" ? .055 : PLANET.id === "p01" ? .07 : .22;
    skyGroup.add(sunSprite);
  }

  // ---------- 灯光（主光跟着角色走，保证孩子身边永远亮） ----------
  // Round 4: sunset hemisphere (pink-lavender sky / peach bounce) instead of flat ambient on the big world.
  scene.add(LARGE_WORLD ? new THREE.HemisphereLight(0xffe0f0, 0xffc7a0, 2.5) : new THREE.AmbientLight(0xe8e9df,1.2));
  const sun = new THREE.DirectionalLight(LARGE_WORLD?0xffe4c0:0xfff1d7,LARGE_WORLD?2.7:2.75);
  sun.castShadow = true;
  sun.shadow.mapSize.set(LOW_POWER?1024:2048, LOW_POWER?1024:2048);
  sun.shadow.radius=3;
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  // ---------- 方块星球 ----------
  const cells = [];
  for (let x = -R - 1; x <= R + 1; x += 1) {
    for (let y = -R - 1; y <= R + 1; y += 1) {
      for (let z = -R - 1; z <= R + 1; z += 1) {
        const d = Math.hypot(x, y, z);
        if (d <= R + 0.5 && d > R - 1.6) cells.push([x, y, z]);
      }
    }
  }
  const planetMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  // v2 只替换表面着色，原球体和随机布置保持一致。
  YayaArtWorld.terrain(THREE, planetMat,PLANET.theme);
  const planet = new THREE.InstancedMesh(LARGE_WORLD && !LOW_POWER ? YayaRound3.makeGroundGeometry(THREE) : new THREE.BoxGeometry(1, 1, 1), planetMat, cells.length);
  {
    const m = new THREE.Matrix4();
    const color = new THREE.Color();
    cells.forEach(([x, y, z], i) => {
      m.makeTranslation(x, y, z);
      planet.setMatrixAt(i, m);
      const flower = rng() < 0.04;
      if (flower) color.setHSL(PLANET.grass[0] - 0.06, 0.6, 0.6);
      else color.setHSL(PLANET.grass[0] + rng() * PLANET.grass[1], 0.5 + rng() * 0.1, 0.4 + rng() * 0.1);
      planet.setColorAt(i, color);
    });
  }
  YayaArtWorld.colorTerrain(THREE, planet, cells);
  if (PLANET.id === "l02") YayaSecondArt.terrain(THREE, planetMat, planet, cells);
  // 星球自己投影要把两千多块方块再画一遍，手机上只接收阴影
  planet.castShadow = !LOW_POWER;
  planet.receiveShadow = true;
  planet.userData.kind = "ground";
  scene.add(planet);

  const downRay = new THREE.Raycaster();
  // 地面高度不会变，按方向缓存，省掉每帧对两千多块方块的射线检测
  const surfaceCache = new Map();
  let planetSurfaceOverride=null;
  function surfaceRadius(dir) {
    const key = `${Math.round(dir.x * 400)},${Math.round(dir.y * 400)},${Math.round(dir.z * 400)}`;
    const cached = surfaceCache.get(key);
    if (cached !== undefined) return cached;
    let r;
    if (LARGE_WORLD) {
      // Exact voxel-grid traversal: intersect only the cells crossed by this ray,
      // rather than raycasting the whole enlarged InstancedMesh on every step.
      const edges = [R + 1.4, R - 2];
      for (const d of [Math.abs(dir.x), Math.abs(dir.y), Math.abs(dir.z)]) {
        if (d < 1e-7) continue;
        for (let n = Math.ceil((R - 2) * d - .5); n <= Math.floor((R + 1.4) * d - .5); n++) edges.push((n + .5) / d);
      }
      edges.sort((a,b) => b-a);
      r = R + .5;
      for (let i=0;i<edges.length-1;i++) {
        const t=(edges[i]+edges[i+1])*.5;
        const d=Math.hypot(Math.round(dir.x*t),Math.round(dir.y*t),Math.round(dir.z*t));
        if(d<=R+.5 && d>R-1.6){r=edges[i]-.015;break;}
      }
      if (arc(dir, STAGE.center)<3.4) {
        downRay.set(dir.clone().multiplyScalar(R+4),dir.clone().negate());downRay.far=8;
        const hit=downRay.intersectObjects(groundMeshes.slice(1),false)[0];
        if(hit)r=Math.max(r,hit.point.length());
      }
    } else {
      downRay.set(dir.clone().multiplyScalar(R + 4), dir.clone().negate());
      downRay.far = 8;
      const hit = downRay.intersectObjects(groundMeshes, false)[0];
      r = hit ? hit.point.length() : R + 0.5;
    }
    if (planetSurfaceOverride) r=planetSurfaceOverride(dir,r);
    if (surfaceCache.size > 20000) surfaceCache.clear();
    surfaceCache.set(key, r);
    return r;
  }
  const groundMeshes = [planet];

  // ---------- 拼词石台：固定在星球顶上那片平地，出生点就在它前面 ----------
  // 方块球体只有斜坡上是台阶，顶面是平的；格子和字母都放在抬高的台面上，从远处也看得清
  const STAGE = (() => {
    const up = UP0.clone();
    const front = new V3(0, 0, 1); // 朝着出生点和镜头
    downRay.set(up.clone().multiplyScalar(R + 4), up.clone().negate());
    downRay.far = 8;
    const terrain = downRay.intersectObject(planet, false)[0].point.length();
    const group = new THREE.Group();
    group.position.copy(up).multiplyScalar(terrain - 0.05);
    orient(group, up, front);

    const stone = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      const r = mulberry32(99);
      g.fillStyle = "#ddd6c8";
      g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 220; i += 1) {
        const v = 190 + Math.floor(r() * 50);
        g.fillStyle = `rgb(${v + 6},${v},${v - 12})`;
        g.fillRect(Math.floor(r() * 16) * 8, Math.floor(r() * 16) * 8, 8, 8);
      }
      g.strokeStyle = "rgba(40,36,60,.35)";
      g.lineWidth = 6;
      g.strokeRect(3, 3, 122, 122);
      const tex = srgb(new THREE.CanvasTexture(c));
      tex.magFilter = THREE.NearestFilter;
      return tex;
    })();
    const stoneMat = new THREE.MeshLambertMaterial({ map: stone });
    const part = (w, h, d, x, y, z, mat = stoneMat) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };
    const TOP = 0.6;
    const slab = part(4.2, TOP, 1.8, 0, TOP / 2, 0);
    const step = part(3.0, TOP / 2, 0.7, 0, TOP / 4, 1.2);
    // 台面上三个刻出来的凹槽，提示“字母放在这里”
    const grooveTex = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      g.fillStyle = "#4b4763";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "rgba(255,255,255,.25)";
      g.lineWidth = 6;
      g.strokeRect(6, 6, 116, 116);
      g.fillStyle = "rgba(255,255,255,.45)";
      g.font = '900 72px Arial, sans-serif';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("?", 64, 70);
      return srgb(new THREE.CanvasTexture(c));
    })();
    const grooveGeo = new THREE.PlaneGeometry(0.92, 0.92).rotateX(-Math.PI / 2);
    // 一颗星球只学一个字母：台面正中间只有一个凹槽，学会的字母就住在这里
    for (const i of PLANET.practice ? [0] : [-1, 0, 1]) {
      const groove = new THREE.Mesh(grooveGeo, new THREE.MeshLambertMaterial({ map: grooveTex }));
      groove.position.set(i * 1.05, TOP + 0.006, 0);
      groove.receiveShadow = true;
      group.add(groove);
    }
    // 两头的灯柱：保留石柱，以厚实的五角星代替黄色方灯。
    const stars = [];
    for (const side of [-1, 1]) {
      part(0.5, 1.4, 0.5, side * 2.45, 0.7, -0.5);
      part(0.62, 0.12, 0.62, side * 2.45, 1.45, -0.5);
      const star = YayaArtWorld.makeStar(THREE);
      star.position.set(side * 2.45, 1.83, -0.5);
      group.add(star);
      stars.push(star);
    }
    group.traverse((o) => { if (o.isMesh) o.userData.kind = "ground"; });
    scene.add(group);
    group.updateMatrixWorld(true);
    groundMeshes.push(slab, step);
    const toDirection = (x, z) => group.localToWorld(new V3(x, TOP, z)).normalize();
    return {
      up,
      front,
      group,
      stars,
      top: TOP,
      center: toDirection(0, 0),
      slotDirs: [-1, 0, 1].map((i) => toDirection(i * 1.05, 0)),
      pillarDirs: [-1, 1].map((side) => toDirection(side * 2.45, -0.5)),
    };
  })();
  // 石台上的东西都和台面一样朝上，不跟着星球的弧度歪
  const upAt = (dir) => (arc(dir, STAGE.up) < 2.8 ? STAGE.up : dir);

  // 远处的其他声音星球：看得见、暂时去不了，制造好奇心
  const farPlanets = [];
  function labelTexture(main, note, opts = {}) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 280;
    const g = c.getContext("2d");
    g.scale(2, 2);
    g.fillStyle = opts.bg || "rgba(255,250,240,.95)";
    // 手画圆角矩形：老款 iOS 没有 roundRect
    g.beginPath();
    g.moveTo(38, 8);
    g.arcTo(248, 8, 248, 132, 30);
    g.arcTo(248, 132, 8, 132, 30);
    g.arcTo(8, 132, 8, 8, 30);
    g.arcTo(8, 8, 248, 8, 30);
    g.closePath();
    g.fill();
    g.fillStyle = opts.fg || "#2b2440";
    g.textAlign = "center";
    g.font = `900 ${note ? 56 : 68}px "PingFang SC", Arial, sans-serif`;
    g.fillText(main, 128, note ? 74 : 92);
    if (note) {
      g.font = '600 26px "PingFang SC", Arial, sans-serif';
      g.fillStyle = "#7a7091";
      g.fillText(note, 128, 112);
    }
    const tex = new THREE.CanvasTexture(c);
    return srgb(tex);
  }
  // 天上的其他星球：完成前一颗以后，点它就能飞过去
  const SKY_PLANETS = [
    { id: "a01", pos: [-30, -70, 120], r: 6, hue: 0.27, label: "A 苹果星球" },
    { id: "s01", pos: [70, 30, 120], r: 6, hue: 0.07, label: "S 沙漠星球" },
    { id: "t01", pos: [-70, 38, -120], r: 6, hue: 0.5, label: "T 海岛星球" },
    { id: null, pos: [110, -10, -60], r: 5, hue: 0.78, label: "?", ring: true },
  ];
  SKY_PLANETS.filter((sp) => sp.id !== PLANET.id).forEach((sp) => {
    const group = new THREE.Group();
    const cubes = [];
    for (let x = -sp.r; x <= sp.r; x += 1) {
      for (let y = -sp.r; y <= sp.r; y += 1) {
        for (let z = -sp.r; z <= sp.r; z += 1) {
          const d = Math.hypot(x, y, z);
          if (d <= sp.r + 0.3 && d > sp.r - 1.2) cubes.push([x, y, z]);
        }
      }
    }
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: new THREE.Color().setHSL(sp.hue, 0.6, 0.5), emissiveIntensity: 0.15 });
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, cubes.length);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    cubes.forEach(([x, y, z], i) => {
      m.makeTranslation(x, y, z);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.setHSL(sp.hue + rng() * 0.05, 0.55, 0.45 + rng() * 0.12));
    });
    group.add(mesh);
    if (sp.ring) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(sp.r * 1.5, sp.r * 1.85, 48),
        new THREE.MeshBasicMaterial({ color: 0xf6e7ff, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }),
      );
      ring.rotation.x = 1.2;
      group.add(ring);
    }
    const label = new THREE.Sprite(new THREE.SpriteMaterial({
      map: labelTexture(sp.label, "", { bg: "rgba(20,18,48,.6)", fg: "#fff" }), depthWrite: false,
    }));
    label.scale.set(sp.r * 2.6, sp.r * 1.4, 1);
    label.position.y = sp.r * 2;
    // the big A world shows these far planets right under the top subtitle: keep the planet, drop its name tag
    label.visible = !LARGE_WORLD;
    group.add(label);
    group.position.set(...sp.pos);
    group.userData = { kind: "sky-planet", id: sp.id };
    scene.add(group);
    farPlanets.push({ id: sp.id, sp, group, mesh, label, home: group.position.clone(), base: sp.id && planetUnlocked(sp.id) ? 0.45 : 0.15 });
  });

  // 云朵和飘浮的萤光
  const clouds = new THREE.Group();
  clouds.name = "world-clouds";
  {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff4ea, transparent: true, opacity: 0.8 });
    const geo = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 9; i += 1) {
      const cloud = new THREE.Group();
      const pieces = 3 + Math.floor(rng() * 3);
      for (let j = 0; j < pieces; j += 1) {
        const b = new THREE.Mesh(geo, mat);
        b.scale.set(1.6 + rng() * 1.6, 0.6 + rng() * 0.4, 1.2 + rng() * 1.2);
        b.position.set(j * 1.3 - pieces * 0.6, rng() * 0.4, rng() * 1.2 - 0.6);
        cloud.add(b);
      }
      const d = new V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize();
      cloud.position.copy(d).multiplyScalar(R + 11 + rng() * 3);
      orient(cloud, d, new V3(rng(), rng(), rng()));
      clouds.add(cloud);
    }
    scene.add(clouds);
  }
  YayaArtWorld.softenClouds(THREE, clouds);
  if (PLANET.id === "l02") YayaSecondArt.sky(THREE, skyGroup, clouds);
  const fireflies = new THREE.Group();
  {
    const count = 140;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const d = new V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize();
      positions.set(d.multiplyScalar(R + 1.2 + rng() * 3).toArray(), i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    fireflies.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.08, color: 0xffe9a0, transparent: true, opacity: 0.38,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })));
    scene.add(fireflies);
  }

  // ---------- 模型加载 ----------
  async function loadModel(key) {
    const base = key.slice(0, key.lastIndexOf("/") + 1);
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => ASSETS[url] || url);
    const loader = new GLTFLoader(manager);
    // 直接解码 base64，不用 fetch：发布页面的安全策略可能不允许 fetch data: 地址
    const bytes = Uint8Array.from(atob(ASSETS[key].split(",")[1]), (ch) => ch.charCodeAt(0));
    // 让 GLTFLoader 用 <img> 读贴图，而不是 fetch + createImageBitmap
    const imageBitmap = window.createImageBitmap;
    window.createImageBitmap = undefined;
    try {
      return await new Promise((resolve, reject) => {
        loader.parse(bytes.buffer, base, resolve, reject);
        window.createImageBitmap = imageBitmap;
      });
    } finally {
      window.createImageBitmap = imageBitmap;
    }
  }

  // 把模型缩放到指定高度，脚底放在原点
  function fitModel(model, height) {
    const box = new THREE.Box3().setFromObject(model);
    const s = height / Math.max(0.001, box.max.y - box.min.y);
    model.scale.setScalar(s);
    const center = box.getCenter(new V3());
    model.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material.map) o.material.map.anisotropy = maxAnisotropy;
      }
    });
    const pivot = new THREE.Group();
    pivot.add(model);
    return pivot;
  }

  function placeOnSurface(obj, dir, heading, lift = 0) {
    obj.position.copy(dir).multiplyScalar(surfaceRadius(dir) + lift);
    orient(obj, upAt(dir), heading);
  }

  const modelKeys = {
    player: "models/characters/explorer.glb",
    cat: "models/pets/animal-cat.glb",
    chick: "models/pets/animal-chick.glb",
    tree: "models/forest/tree.glb",
    treeHigh: "models/forest/tree-high.glb",
    plant: "models/forest/plant.glb",
    rocks: "models/forest/rocks-low.glb",
    stones: "models/forest/stones.glb",
    tent: "models/forest/tent.glb",
  };
  const models = {};
  window.YayaBoot && window.YayaBoot.step("加载角色模型");
  try {
    let loaded = 0;
    await Promise.all(Object.entries(modelKeys).map(async ([name, key]) => {
      models[name] = await loadModel(key);
      loaded += 1;
      startButton.textContent = `正在加载星球… ${loaded}/${Object.keys(modelKeys).length}`;
    }));
  } catch (error) {
    startButton.textContent = "模型加载失败，请刷新重试";
    console.error(error);
    return;
  }

  window.YayaBoot && window.YayaBoot.step("搭建星球");
  YayaArtFoliage.regrade(THREE, models);
  if (PLANET.id === "l02") YayaSecondArt.models(THREE, models);

  // ---------- 水晶 ----------
  function letterTexture(letter, color) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    g.scale(2, 2);
    const r = mulberry32(letter.charCodeAt(0));
    g.fillStyle = color;
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 70; i += 1) {
      g.fillStyle = `rgba(255,255,255,${r() * 0.2})`;
      g.fillRect(Math.floor(r() * 16) * 8, Math.floor(r() * 16) * 8, 8, 8);
    }
    g.strokeStyle = "rgba(0,0,0,.22)";
    g.lineWidth = 10;
    g.strokeRect(5, 5, 118, 118);
    g.font = '900 86px "Arial Rounded MT Bold", Arial, sans-serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 12;
    g.strokeStyle = "rgba(50,30,20,.5)";
    g.strokeText(letter.toLowerCase(), 64, 70);
    g.fillStyle = "#fff";
    g.fillText(letter.toLowerCase(), 64, 70);
    const tex = new THREE.CanvasTexture(c);
    return srgb(tex);
  }
  const letterTextures = Object.fromEntries(Object.keys(LETTERS).map((l) => [l, letterTexture(l, LETTERS[l].color)]));

  // 同一组裂纹逐步增加，冰壳每次重玩都长得一样。
  const iceTextures = [0, 2, 5].map((cracks) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 128, 128);
    grad.addColorStop(0, "#f5fcff");
    grad.addColorStop(0.5, "#c5e7f3");
    grad.addColorStop(1, "#e6f5ff");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "rgba(255,255,255,.85)";
    g.lineWidth = 5;
    g.lineCap = "round";
    for (const x of [20, 34]) {
      g.beginPath();
      g.moveTo(x, 38);
      g.lineTo(x + 18, 15);
      g.stroke();
    }
    const random = mulberry32(5503);
    for (let i = 0; i < cracks; i += 1) {
      const angle = i * Math.PI * 2 / 5 + (random() - 0.5) * 0.5;
      const points = [[64, 64]];
      for (let j = 1; j <= 4; j += 1) {
        const radius = j * 17;
        const bend = (random() - 0.5) * 12;
        points.push([
          64 + Math.cos(angle) * radius - Math.sin(angle) * bend,
          64 + Math.sin(angle) * radius + Math.cos(angle) * bend,
        ]);
      }
      for (const [width, color] of [[5, "#ffffff"], [1.5, "#527b9f"]]) {
        g.lineWidth = width;
        g.strokeStyle = color;
        g.beginPath();
        points.forEach(([x, y], index) => index ? g.lineTo(x, y) : g.moveTo(x, y));
        g.stroke();
      }
    }
    return srgb(new THREE.CanvasTexture(c));
  });

  const beamAlpha = (() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, "#000");
    grad.addColorStop(0.7, "#888");
    grad.addColorStop(1, "#fff");
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 128);
    return new THREE.CanvasTexture(c);
  })();

  const crystals = {};
  const crystalSpots = Object.fromEntries(ALL_LETTERS.map((l) => [l, dirFrom(...PLANET.spots[l])]));
  for (const letter of ALL_LETTERS) {
    const dir = crystalSpots[letter];
    const color = new THREE.Color(LETTERS[letter].color);
    const group = new THREE.Group();
    const float = new THREE.Group();
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ map: letterTextures[letter], emissive: color, emissiveIntensity: 0.35 }),
    );
    cube.castShadow = true;
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.3, 1.3),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    float.add(cube, shell);
    if(LARGE_WORLD){
      cube.visible=false;
      const gem=YayaRound3Crystals.create(THREE,letter);float.add(gem.group);
      shell.geometry.dispose();shell.geometry=new THREE.OctahedronGeometry(.91,0);shell.geometry.scale(.8,1.36,.72);
      shell.material.opacity=.12;
    }
    float.position.y = LARGE_WORLD ? 2.0 : 1.5;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 26, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color, alphaMap: beamAlpha, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    beam.position.y = LARGE_WORLD?4:14;
    if(LARGE_WORLD){beam.scale.y=.25;beam.material.opacity=.15;}
    beam.userData.isBeam = true;
    // 手机上不用点光源（每盏灯都要算到每个像素上），水晶靠自发光和光柱
    const light = LOW_POWER ? null : new THREE.PointLight(color, 8, 7, 2);
    group.add(float, beam);
    if (light) {
      light.position.y = 1.5;
      group.add(light);
    }
    group.userData.kind = "crystal";
    group.userData.letter = letter;
    placeOnSurface(group, dir, FWD0);
    scene.add(group);
    const active = IS_LETTERS ? letter === ORDER[0] : WORD.includes(letter);
    group.visible = active;
    crystals[letter] = { letter, dir, group, float, cube, shell, beam, light, collected: false, active };
  }

  // ---------- 装饰与障碍 ----------
  const START_DIR = dirFrom(14, 180);
  const obstacles = STAGE.pillarDirs.map((dir) => ({ dir, r: 0.45 }));
  const props = [];
  const keepClear = [
    { dir: START_DIR, r: PLANET.clearRadius || 3.6 },
    { dir: STAGE.center, r: PLANET.clearRadius || 3.6 },
    ...ALL_LETTERS.map((l) => ({ dir: crystalSpots[l], r: PLANET.crystalClear || 4.8 })),
    // 苹果星球：五棵字母苹果树和石台后面的野餐垫附近不长别的树
    ...(PLANET.clearSpots || []).map((s) => ({ dir: dirFrom(...s), r: 2.2 })),
    ...(PLANET.practice ? [{ dir: STAGE.group.localToWorld(new V3(0, STAGE.top, -1.9)).normalize(), r: 2.4, party: true }] : []),
  ];
  function freeSpot(minGap) {
    for (let tries = 0; tries < 200; tries += 1) {
      const d = new V3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).normalize();
      if (keepClear.some((k) => arc(d, k.dir) < k.r)) continue;
      if (obstacles.some((o) => arc(d, o.dir) < o.r + minGap)) continue;
      return d;
    }
    return null;
  }
  // 苹果星球：树和灌木换成自己做的低多边形模型（参考图里圆圆的大树冠、塔形松树）
  const CUSTOM_PROPS = PLANET.id === "a01" ? { tree: ["roundTree", 2.9], treeHigh: ["pineTree", 2.9], plant: ["bush", 0.55] } : {};
  function addProp(name, height, radius, dir = null) {
    const spot = dir || freeSpot(radius > 0 ? 0.9 : 0.2);
    if (!spot) return;
    const custom = CUSTOM_PROPS[name];
    let prop;
    if (COURSE.propModels?.[name]) {
      prop=COURSE.propModels[name](THREE,rng);
    } else if (custom) {
      prop = YayaPlanetA[custom[0]](THREE, rng);
      prop.scale.setScalar(height / custom[1]);
    } else {
      prop = fitModel(models[name].scene.clone(true), height);
    }
    placeOnSurface(prop, spot, new V3(rng() - 0.5, rng() - 0.5, rng() - 0.5), -0.05);
    registerProp(prop, spot, radius);
  }
  function registerProp(prop, spot, radius) {
    // 每个道具独立材质，挡住角色时可以单独变透明
    const mats = [];
    prop.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.transparent = true;
        mats.push(o.material);
      }
    });
    props.push({ obj: prop, mats, baseOpacities:mats.map(m=>m.opacity), fade: 1, dir: spot });
    scene.add(prop);
    if (radius > 0) obstacles.push({ dir: spot, r: radius });
  }
  addProp("tent", 1.7, 1.0, dirFrom(...PLANET.tent));
  keepClear.push({ dir: dirFrom(...PLANET.tent), r: 1.5 });
  const counts = PLANET.props;
  for (let i = 0; i < counts.tree; i += 1) addProp("tree", 2.2 + rng() * 0.8, 0.55);
  for (let i = 0; i < counts.treeHigh; i += 1) addProp("treeHigh", 3.2 + rng() * 0.8, 0.55);
  for (let i = 0; i < counts.rocks; i += 1) addProp("rocks", 0.6, 0.5);
  for (let i = 0; i < counts.stones; i += 1) addProp("stones", 0.4, 0);
  for (let i = 0; i < counts.plant; i += 1) addProp("plant", 0.55 + rng() * 0.3, 0);
  for (const letter of IS_LETTERS ? ORDER.slice(0, 1) : WORD) obstacles.push({ dir: crystalSpots[letter], r: 0.7, crystal: letter });
  // 苹果星球：果树、彩旗、野餐垫、刺猬奶奶和篮子（放在撒星星之前，星星不会长在树里）
  const orchard = PLANET.practice ? (COURSE.decorate || YayaPlanetA.decorate)({
    THREE, scene, STAGE, freeSpot, obstacles, rng, dirFrom, moveAlong, tangent, kit: YayaCharacters.kit, registerProp,
    blocked: (d) => keepClear.slice(2).some((k) => !k.party && arc(d, k.dir) < k.r) || obstacles.some((o) => arc(d, o.dir) < o.r + 0.75),
    place: (obj, dir, heading, lift = 0) => placeOnSurface(obj, dir, heading, lift),
  }) : null;

  // ---------- 星星：草地上散落 14 颗，走近就被吸过来；学会字母、答对、拼出词也会奖励 ----------
  // 星星总数跨星球累计；每颗星球上捡过哪几颗记在这颗星球的存档里
  const STAR_KEY = "yaya-stars";
  const petLedger = YayaCompanion.ledger(readStore,writeStore,Number((readStore(STAR_KEY)||{}).total)||0);
  const starBank = { get total(){return petLedger.balance;} };
  const starGeo = (() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 ? 0.1 : 0.24;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 1 });
    geo.center();
    return geo;
  })();
  const starMat = new THREE.MeshLambertMaterial({ color: "#ffd23f", emissive: "#ffb300", emissiveIntensity: 0.55 });
  const fieldStars = [];
  for (let i = 0; i < 14; i += 1) {
    const spot = freeSpot(0.3);
    if (!spot) continue;
    const mesh = new THREE.Object3D();
    fieldStars.push({ index: i, instance: fieldStars.length, dir: spot, mesh, taken: false, fly: -1 });
  }

  const fieldStarMesh = new THREE.InstancedMesh(starGeo, starMat, fieldStars.length);
  fieldStarMesh.name = 'field-stars';fieldStarMesh.castShadow = true;fieldStarMesh.frustumCulled = false;
  const hiddenStarMatrix = new THREE.Matrix4().makeScale(0,0,0);
  fieldStars.forEach(star => fieldStarMesh.setMatrixAt(star.instance, hiddenStarMatrix));
  scene.add(fieldStarMesh);
  function syncFieldStars() {
    for (const star of fieldStars) {
      star.mesh.updateMatrix();
      fieldStarMesh.setMatrixAt(star.instance, star.mesh.visible ? star.mesh.matrix : hiddenStarMatrix);
    }
    fieldStarMesh.instanceMatrix.needsUpdate = true;
  }

  if(!LARGE_WORLD&&(!PLANET.theme||PLANET.theme==="forest")) YayaArtWorld.meadowDetails(THREE, scene, cells, obstacles, arc);
  const habitat = PLANET.practice ? YayaWorld.create({registerProp,props,THREE,scene,skyGroup,clouds,planet,cells,PLANET,STAGE,obstacles,place:placeOnSurface,moveAlong,tangent,arc,surfaceRadius,orient,rng,LOW_POWER}) : null;
  const round3 = LARGE_WORLD ? (PLANET.id === "s01" ? YayaPlanetSWorld : PLANET.id === "t01" && window.YayaPlanetTWorld ? YayaPlanetTWorld : PLANET.id === "i01" && window.YayaPlanetIWorld ? YayaPlanetIWorld : PLANET.id === "p01" && window.YayaPlanetPWorld ? YayaPlanetPWorld : YayaRound3).create({registerProp,props,THREE,scene,skyGroup,clouds,planet,cells,PLANET,STAGE,obstacles,place:placeOnSurface,moveAlong,tangent,arc,surfaceRadius,orient,rng,LOW_POWER,R,START_DIR,crystals,habitat,orchard,camera,setSurfaceOverride:fn=>{planetSurfaceOverride=fn;surfaceCache.clear();}}) : null;
  // T：终点拱门挡在镜头和角色之间时，像树一样变透明（不加障碍，跑道照常通过）
  if (PLANET.id === "t01" && round3?.landmarks?.finish?.object) { registerProp(round3.landmarks.finish.object, round3.landmarks.finish.dir, 0); round3.landmarks.finish.object.userData.fadeNearCam = 11; }
  const navigation = LARGE_WORLD ? YayaNavigation.create({THREE,obstacles,arc,moveAlong,tangent,SURF,playerRadius:.24}) : null;
  if(navigation){
    for(const w of habitat.walkers){w.dir.copy(navigation.constrain(w.dir));w.home.copy(w.dir);w.target=null;placeOnSurface(w.m,w.dir,w.heading);}
    for(const star of fieldStars)star.dir.copy(navigation.constrain(star.dir));
  }
  const wildlife = PLANET.theme&&PLANET.theme!=="forest"?{update(){},snapshot:()=>[]}:YayaWildlife.create({getPlayer:()=>player, THREE, scene, surfaceRadius, orient, dirFrom, moveAlong, tangent, arc, STAGE, obstacles, LOW_POWER, crystals, props });

  if (PLANET.id === "l02") YayaSecondArt.decorate({ THREE, scene, cells, obstacles, crystals, arc, STAGE });

  // ---------- 角色 ----------
  function makeCharacter(gltf, height) {
    const pivot = fitModel(gltf.scene, height);
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const actions = {};
    for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
    return { obj: pivot, mixer, actions, current: null, oneShot: false };
  }
  function playLoop(ch, name) {
    if (ch.current === name || !ch.actions[name]) return;
    const next = ch.actions[name];
    next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.2).play();
    if (ch.current) ch.actions[ch.current].fadeOut(0.2);
    ch.current = name;
  }
  function playOnce(ch, name, then = "idle") {
    const action = ch.actions[name];
    if (!action) return;
    ch.oneShot = true;
    action.reset().setLoop(THREE.LoopOnce, 1).fadeIn(0.15).play();
    action.clampWhenFinished = true;
    if (ch.current && ch.current !== name) ch.actions[ch.current].fadeOut(0.15);
    ch.current = name;
    const done = (event) => {
      if (event.action !== action) return;
      ch.mixer.removeEventListener("finished", done);
      ch.oneShot = false;
      ch.current = null;
      action.fadeOut(0.2);
      playLoop(ch, then);
    };
    ch.mixer.addEventListener("finished", done);
  }

  // 水晶已经亮起来、还没被收集
  const available = (crystal) => crystal.active && !crystal.collected;

  const player = makeCharacter(YayaCharacters.explorer(THREE, (readStore("yaya-profile") || {}).avatar || "boy"), 1.5);
  Object.assign(player, { dir: START_DIR.clone(), heading: FWD0.clone(), radius: surfaceRadius(START_DIR) });
  scene.add(player.obj);
  playLoop(player, "idle");

  function changeAvatar(avatar) {
    const previous=player.obj, replacement=makeCharacter(YayaCharacters.explorer(THREE,avatar),1.5);
    replacement.obj.position.copy(previous.position);replacement.obj.quaternion.copy(previous.quaternion);
    player.mixer.stopAllAction();scene.remove(previous);Object.assign(player,replacement);scene.add(player.obj);playLoop(player,"idle");
  }
  function makePet(name, height, side, word) {
    const pet = makeCharacter(models[name], height);
    Object.assign(pet, { name, word, side, dir: START_DIR.clone(), heading: FWD0.clone(), radius: R + 0.5, active: false, dancing: false });
    pet.obj.visible = false;
    pet.obj.traverse((o) => { o.userData.kind = "pet"; o.userData.pet = name; });
    scene.add(pet.obj);
    return pet;
  }
  const pets = {
    cat: makePet("cat", 0.75, -0.7, "cat"),
    chick: makePet("chick", 0.6, 0.7, "hen"),
  };
  // 让小伙伴出现在 spot 位置（animated 时跳舞着冒出来）
  function summonPet(pet, spot, animated) {
    pet.dir.copy(spot).normalize();
    pet.heading.copy(tangent(player.dir.clone().sub(pet.dir), pet.dir));
    pet.radius = surfaceRadius(pet.dir);
    pet.obj.visible = true;
    pet.active = true;
    if (!animated) return;
    pet.dancing = true;
    pet.obj.scale.setScalar(0.01);
    playLoop(pet, "dance");
    tween(0.6, (k) => pet.obj.scale.setScalar(Math.max(0.01, ease(k) * 1.0 + Math.sin(k * Math.PI) * 0.25)));
    burst(pet.obj.position.clone().addScaledVector(pet.dir, 0.5), 0xffe39a, 24, 1);
  }

  // ---------- 声音：全部用 WebAudio 实时合成，不需要音频文件 ----------
  const sound = { ctx: null, music: null, sfx: null, reverb: null, noise: null, musicOn: true, timer: null };
  function initAudio() {
    if (sound.ctx) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    sound.ctx = ctx;
    // 一点回声，让铃声更像在空旷的星球上
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.32;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(ctx.destination);
    sound.reverb = delay;

    sound.sfx = ctx.createGain();
    sound.sfx.connect(ctx.destination);
    const sfxSend = ctx.createGain();
    sfxSend.gain.value = 0.18;
    sound.sfx.connect(sfxSend).connect(delay);

    sound.music = ctx.createGain();
    sound.music.gain.value = sound.musicOn ? 0.5 : 0;
    sound.music.connect(ctx.destination);
    sound.music.connect(delay);

    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    sound.noise = buffer;

    startMusic();
  }

  // 输出口：音量包络 + 左右声道
  function voiceOut(t0, { gain, attack = 0.005, decay = 0.4, pan = 0, dest = null }) {
    const ctx = sound.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = THREE.MathUtils.clamp(pan, -1, 1);
      g.connect(p).connect(dest || sound.sfx);
    } else {
      g.connect(dest || sound.sfx);
    }
    return g;
  }
  // 单个振荡器，可以滑音：glide = [起始频率, 中间频率?, 结束频率]
  function osc(type, freq, { when = 0, gain = 0.1, attack, decay = 0.3, pan, dest, glide, vibrato } = {}) {
    const ctx = sound.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(glide ? glide[0] : freq, t0);
    if (glide) {
      const total = (attack || 0.005) + decay;
      glide.slice(1).forEach((f, i, rest) => {
        o.frequency.exponentialRampToValueAtTime(f, t0 + (total * (i + 1)) / rest.length);
      });
    }
    if (vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = vibrato[0];
      depth.gain.value = vibrato[1];
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t0);
      lfo.stop(t0 + (attack || 0.005) + decay + 0.05);
    }
    o.connect(voiceOut(t0, { gain, attack, decay, pan, dest }));
    o.start(t0);
    o.stop(t0 + (attack || 0.005) + decay + 0.05);
    return o;
  }
  // 八音盒铃声：基音 + 两个泛音
  function bell(freq, { when = 0, gain = 0.08, decay = 1.1, pan = 0, dest } = {}) {
    osc("sine", freq, { when, gain, decay, pan, dest });
    osc("sine", freq * 2, { when, gain: gain * 0.35, decay: decay * 0.6, pan, dest });
    osc("sine", freq * 3.01, { when, gain: gain * 0.12, decay: decay * 0.3, pan, dest });
  }
  // 滤波噪声：脚步、翅膀、风声
  function noise({ when = 0, gain = 0.05, decay = 0.08, attack = 0.003, type = "bandpass", freq = 1500, q = 1, sweep, pan, dest } = {}) {
    const ctx = sound.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = sound.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t0);
    if (sweep) filter.frequency.exponentialRampToValueAtTime(sweep, t0 + attack + decay);
    filter.Q.value = q;
    src.connect(filter).connect(voiceOut(t0, { gain, attack, decay, pan, dest }));
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + attack + decay + 0.05);
  }
  // 兼容原来的调用：简单的一个音
  function tone(freq, { dur = 0.6, type = "sine", gain = 0.12, pan = 0, when = 0, dest = null } = {}) {
    osc(type, freq, { when, gain, decay: dur, pan, dest });
  }

  let stepSide = 1;
  const sfx = {
    // 软软的草地脚步，左右脚轮流
    step: () => {
      stepSide = -stepSide;
      noise({ gain: 0.035, decay: 0.05, freq: 1800 + Math.random() * 900, q: 1.4, pan: stepSide * 0.15 });
      osc("sine", 0, { glide: [190, 120], gain: 0.03, decay: 0.06, pan: stepSide * 0.15 });
    },
    // 冒泡：选中字母
    bubble: (when = 0, base = 420) => {
      osc("sine", 0, { when, glide: [base, base * 2.8], gain: 0.11, attack: 0.01, decay: 0.11 });
    },
    // 一串冒泡：答案方块从地里升起
    bloops: () => [0, 0.11, 0.22].forEach((w, i) => sfx.bubble(w, 360 + i * 120)),
    // 轻轻一点地面
    tick: () => osc("sine", 1700, { gain: 0.025, decay: 0.04 }),
    // 答错：可爱的“咚嘤”，不吓人
    boing: () => osc("triangle", 0, { glide: [330, 150], gain: 0.13, attack: 0.01, decay: 0.42, vibrato: [16, 28] }),
    // 答对：亮晶晶的上行琶音
    sparkle: () => {
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) => bell(f, { when: i * 0.07, gain: 0.07, decay: 0.7 }));
      noise({ when: 0.05, gain: 0.02, decay: 0.45, type: "highpass", freq: 6000 });
    },
    // 水晶碎开：一把玻璃珠
    glass: () => {
      for (let i = 0; i < 7; i += 1) {
        bell(2000 + Math.random() * 2200, { when: Math.random() * 0.25, gain: 0.03, decay: 0.3, pan: Math.random() - 0.5 });
      }
    },
    // 飞走的“咻”
    whoosh: () => noise({ gain: 0.45, attack: 0.06, decay: 0.3, freq: 400, sweep: 3200, q: 2 }),
    // 落进背包的“啵”
    pop: () => osc("sine", 0, { glide: [500, 1500], gain: 0.13, decay: 0.07 }),
    // 捡到星星：亮亮的两声“叮叮”
    star: (when = 0) => {
      bell(1568, { when, gain: 0.07, decay: 0.4 });
      bell(2093, { when: when + 0.07, gain: 0.06, decay: 0.5 });
    },
    // 木头方块落地的“哒”
    place: () => {
      osc("sine", 0, { glide: [560, 250], gain: 0.16, decay: 0.09 });
      noise({ gain: 0.05, decay: 0.03, freq: 1300, q: 3 });
    },
    // 魔法出现：五声音阶往上刷
    magic: () => {
      [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7, 1318.5].forEach((f, i) => bell(f, { when: i * 0.05, gain: 0.045, decay: 0.6 }));
    },
    // 拼出新词：小号角式的旋律 + 和弦
    fanfare: () => {
      [783.99, 1046.5, 1318.5, 1568].forEach((f, i) => bell(f, { when: i * 0.12, gain: 0.08, decay: 0.5 }));
      [1046.5, 1318.5, 1568, 2093].forEach((f) => bell(f, { when: 0.52, gain: 0.05, decay: 1.6 }));
      osc("triangle", 261.6, { when: 0.52, gain: 0.06, decay: 1.2 });
      noise({ when: 0.52, gain: 0.025, decay: 0.8, type: "highpass", freq: 7000 });
    },
    // 小猫“喵”
    meow: () => {
      const ctx = sound.ctx;
      if (!ctx) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(620, t0);
      o.frequency.exponentialRampToValueAtTime(980, t0 + 0.14);
      o.frequency.exponentialRampToValueAtTime(700, t0 + 0.5);
      const formant = ctx.createBiquadFilter();
      formant.type = "bandpass";
      formant.Q.value = 5;
      formant.frequency.setValueAtTime(1100, t0);
      formant.frequency.exponentialRampToValueAtTime(1800, t0 + 0.15);
      formant.frequency.exponentialRampToValueAtTime(900, t0 + 0.5);
      o.connect(formant).connect(voiceOut(t0, { gain: 0.65, attack: 0.05, decay: 0.48 }));
      o.start(t0);
      o.stop(t0 + 0.6);
    },
    // 蝙蝠：扑扑翅膀 + 吱吱
    squeak: () => {
      for (let i = 0; i < 6; i += 1) noise({ when: i * 0.05, gain: 0.2, decay: 0.03, freq: 900, q: 2 });
      osc("sine", 0, { when: 0.3, glide: [2300, 3200, 2500], gain: 0.08, decay: 0.14 });
      osc("sine", 0, { when: 0.5, glide: [2500, 3400, 2700], gain: 0.08, decay: 0.12 });
    },
    // 小鸡“叽叽叽”
    chirp: () => {
      [0, 0.13, 0.26].forEach((w) => osc("sine", 0, { when: w, glide: [2400, 3300, 2600], gain: 0.07, decay: 0.09 }));
    },
    // 帽子掉下来：滑音口哨 + 落地“啵”
    hatDrop: () => {
      osc("sine", 0, { glide: [1700, 480], gain: 0.07, attack: 0.02, decay: 0.62 });
      osc("sine", 0, { when: 0.7, glide: [500, 1500], gain: 0.13, decay: 0.07 });
      bell(1568, { when: 0.72, gain: 0.05, decay: 0.5 });
    },
  };

  // 背景音乐：八音盒弹 C - Am - F - G，偶尔有小鸟叫
  const CHORDS = [
    [523.25, 659.25, 783.99, 1046.5], // C
    [440, 523.25, 659.25, 880], // Am
    [349.23, 440, 523.25, 698.46], // F
    [392, 493.88, 587.33, 783.99], // G
  ];
  const PATTERN = [0, 1, 2, 1, 3, 2, 1, 2];
  function startMusic() {
    const ctx = sound.ctx;
    const beat = 60 / 92 / 2; // 八分音符
    let next = ctx.currentTime + 0.3;
    let step = 0;
    let nextBird = ctx.currentTime + 4;
    sound.timer = setInterval(() => {
      while (next < ctx.currentTime + 0.4) {
        const when = next - ctx.currentTime;
        const chord = CHORDS[Math.floor(step / 8) % CHORDS.length];
        const i = step % 8;
        if (i === 0) osc("triangle", chord[0] / 4, { when, gain: 0.045, attack: 0.02, decay: 1.4, dest: sound.music });
        // 偶尔漏掉一个音，听起来更像在随手弹
        if (i === 0 || Math.random() > 0.18) bell(chord[PATTERN[i]], { when, gain: 0.028, decay: 0.9, dest: sound.music });
        next += beat;
        step += 1;
      }
      if (ctx.currentTime > nextBird) {
        const pan = Math.random() * 1.6 - 0.8;
        const base = 2600 + Math.random() * 900;
        osc("sine", 0, { glide: [base, base * 1.35], gain: 0.012, decay: 0.08, pan, dest: sound.music });
        osc("sine", 0, { when: 0.12, glide: [base * 1.1, base * 1.5], gain: 0.012, decay: 0.08, pan, dest: sound.music });
        nextBird = ctx.currentTime + 6 + Math.random() * 8;
      }
    }, 100);
  }
  function duckMusic(seconds = 1.4) {
    if (!sound.ctx) return;
    const g = sound.music.gain;
    const now = sound.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(0.12, now, 0.05);
    g.setTargetAtTime(sound.musicOn ? 0.5 : 0, now + seconds, 0.4);
  }
  let currentWordAudio = null;
  // Public builds fetch audio on demand. Wait for playback, not a timer started
  // before the download; always stop abandoned audio before releasing the queue.
  function playMediaAudio(a) {
    return new Promise((resolve) => {
      let settled = false, timer;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        for (const event of ["ended", "error", "pause"]) a.removeEventListener(event, finish);
        for (const event of ["playing", "timeupdate"]) a.removeEventListener(event, progress);
        a.pause();
        resolve();
      };
      const progress = () => {
        clearTimeout(timer);
        timer = setTimeout(finish, 20000);
      };
      for (const event of ["ended", "error", "pause"]) a.addEventListener(event, finish);
      for (const event of ["playing", "timeupdate"]) a.addEventListener(event, progress);
      timer = setTimeout(finish, 30000);
      a.play().catch(finish);
    });
  }
  // 单独的 /r/ 字母音录得不好，先整体屏蔽（以后有合格的录音再去掉这里）
  const BLOCKED_SOUNDS = new Set(["ls-r"]);
  function rawPlayWord(word) {
    if (BLOCKED_SOUNDS.has(word)) return Promise.resolve();
    const src = ASSETS[`audio/${word}.mp3`] || ASSETS[`audio/${word}.m4a`];
    if (!src) return Promise.resolve();
    const a = new Audio(src);
    if (currentWordAudio) currentWordAudio.pause();
    currentWordAudio = a;
    a.currentTime = 0;
    duckMusic();
    return playMediaAudio(a);
  }

  // ---------- 界面 ----------
  const captionEl = $("#caption");
  const captionText = $("#caption-text");
  const replayButton = $("#replay");
  // 语音提示：assets/voice/<key>.m4a；没有文件时用系统朗读兜底
  const VOICE_LINES = window.YAYA_VOICE_LINES || {};
  const voice = { audio: null, key: null, at: 0, token: 0 };
  function playVoice(key) {
    return new Promise((resolve) => {
      if (!key) {
        resolve();
        return;
      }
      stopVoice();
      const token = voice.token;
      voice.key = key;
      voice.at = performance.now();
      captionEl.classList.add("is-speaking");
      let fallbackTimer;
      const finish = () => {
        clearTimeout(fallbackTimer);
        if (voice.pending === finish) voice.pending = null;
        if (token === voice.token) captionEl.classList.remove("is-speaking");
        resolve();
      };
      voice.pending = finish;
      const src = ASSETS[`voice/${key}.m4a`];
      if (src) {
        const a = new Audio(src);
        voice.audio = a;
        playMediaAudio(a).then(finish);
        duckMusic(6);
      } else if (window.speechSynthesis && VOICE_LINES[key]) {
        const u = new SpeechSynthesisUtterance(VOICE_LINES[key]);
        u.lang = "zh-CN";
        u.rate = 0.95;
        u.onend = finish;
        u.onerror = finish;
        fallbackTimer = setTimeout(() => {
          if (token === voice.token) window.speechSynthesis.cancel();
          finish();
        }, 12000);
        window.speechSynthesis.speak(u);
      } else if (/^p01-/.test(key)) {
        fallbackTimer = setTimeout(finish, 3800);   // 资源加载失败时保留字幕阅读时间，不阻塞任务
      } else {
        finish();
      }
    });
  }
  function stopVoice() {
    voice.token += 1;
    if (voice.audio) voice.audio.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    captionEl.classList.remove("is-speaking");
    if (voice.pending) voice.pending();
  }

  // ---------- 说话排队：系统的提示一句接一句说，不会叠在一起；
  // 只有孩子自己点了东西（hear / interrupt），才打断正在说的话，马上播他点的声音 ----------
  const speech = { chain: Promise.resolve(), gen: 0 };
  function enqueueSpeech(task) {
    const gen = speech.gen;
    speech.chain = speech.chain.then(() => (gen === speech.gen ? task() : null)).catch(() => {});
    return speech.chain;
  }
  function interruptSpeech() {
    speech.gen += 1;
    speech.chain = Promise.resolve();
    stopVoice();
    if (currentWordAudio) currentWordAudio.pause();
  }
  async function waitForSpeechIdle() {
    let current;
    do { current = speech.chain; await current; } while (current !== speech.chain);
  }
  // 排在队尾播一个英文单词 / 字母音
  function playWord(word) {
    return enqueueSpeech(() => rawPlayWord(word));
  }
  // 孩子点的：打断正在说的，马上播
  function hear(word) {
    interruptSpeech();
    return playWord(word);
  }

  // A letter's English name is distinct from its phonics sound. Keep the
  // original narrated comparisons and add a short, separately replayable name.
  const hasLetterName = l => 'astip'.includes(l) && !!ASSETS[`audio/name-${l}.m4a`];
  async function sayCaseWithName(html, key, letter, { interrupt = false, phoneme = false } = {}) {
    const then = [];
    if (hasLetterName(letter)) then.push(`name-${letter}`);
    if (phoneme) then.push(`ls-${letter}`);
    await say(html, { voice: key, then, interrupt });
  }

  // 字幕 + 语音：voice 是语音条目，then 是语音说完以后再播的英文单词
  // speaker：谁在说话。默认是独角兽星朵；苹果星球的奶奶说话时，字幕换成奶奶的头像和名字
  const captionFriend = captionEl.querySelector(".caption-friend");
  const guideAvatar = captionFriend.getAttribute("src");
  const speakers = { guide: { src: guideAvatar, cls: "" } };
  function say(html, { replay = false, voice: key = null, then = null, interrupt = false, speaker = "guide" } = {}) {
    if (interrupt) interruptSpeech();
    const gen = speech.gen;
    return enqueueSpeech(async () => {
      const who = speakers[speaker] || speakers.guide;
      captionEl.dataset.speaker = speaker;
      const speakerName=who.name||(speaker==="grandma"?(PA.npcName||"苹果园奶奶"):"独角兽向导星朵");
      captionFriend.alt=speakerName;captionFriend.title=speakerName+" · 点提示可以再听一次";
      if (captionFriend.getAttribute("src") !== who.src) captionFriend.setAttribute("src", who.src);
      captionEl.hidden = false;
      captionText.innerHTML = html;
      replayButton.hidden = !replay;
      captionEl.style.animation = "none";
      void captionEl.offsetWidth;
      captionEl.style.animation = "";
      say.last = { html, key, then, replay, speaker };
      await playVoice(key);
      for (const word of (Array.isArray(then) ? then : then ? [then] : [])) {
        if (gen !== speech.gen) break;
        await rawPlayWord(word);
      }
    });
  }
  // 点字幕可以再听一遍
  captionEl.addEventListener("click", (event) => {
    if (replayButton.contains(event.target)) return;
    lastInput = performance.now();
    if (say.last) say(say.last.html, { voice: say.last.key, then: say.last.then, replay: say.last.replay, interrupt: true, speaker: say.last.speaker });
  });
  replayButton.addEventListener("click", (event) => {
    event.stopPropagation();
    lastInput = performance.now();
    if ((swipe.active || state.digging || state.digPending) && say.last) {
      say(say.last.html, { voice: say.last.key, then: say.last.then, replay: true, interrupt: true, speaker: say.last.speaker });
    } else if (IS_LETTERS && blend.waiting) hear(`ls-${blend.word[blend.pos]}`);
    else if (state.challenge) hear(CHALLENGES[state.challenge].audio);
    else if (say.last) say(say.last.html, { voice: say.last.key, then: say.last.then, replay: true, interrupt: true, speaker: say.last.speaker });
    else if (FIRST_WORD) hear(FIRST_WORD);
  });

  const state = {
    started: false,
    bag: Object.fromEntries(ALL_LETTERS.map((l) => [l, "empty"])), // empty | has | placed
    spelling: false,
    selected: null,
    challenge: null,
    digging: null,
    digPending: null,
    done: false,
    lastProgress: 0,
  };

  const soundGroup = l => (PLANET.soundGroups || {})[l] || l;
  function blendDeck(word) {
    const required = [...new Set(word)];
    const candidates = ALL_LETTERS.filter(l => !required.includes(l)
      && !required.some(r => soundGroup(r) === soundGroup(l)));
    const selected = new Set([...required, ...candidates.slice(0, 6 - required.length)]);
    return [...new Set([...ALL_LETTERS, ...(PLANET.reviewLetters || []), ...(PLANET.giftLetters || [])])].filter(l => selected.has(l));
  }
  // 每轮最多六格；a/p 是已经学过的复习牌，不增加水晶和课程计数。
  function renderBag(letters = ALL_LETTERS) {
    $("#bag").innerHTML = '<span class="bag-identity"><img src="assets/art/pixel-backpack.svg?v=55-consistent" alt="" /><span>背包</span></span>' + letters.map(l => {
      const review = (PLANET.reviewLetters || []).includes(l), gift = (PLANET.giftLetters || []).includes(l);
      return `<button class="slot is-empty" type="button" data-letter="${l}" aria-label="小写 ${l.toLowerCase()}${review ? '，复习字母' : gift ? '，新字母' : ''}" style="--slot-color:${LETTERS[l].color}"><span>${l.toLowerCase()}</span>${review ? '<small class="review-tag">复习</small>' : gift ? '<small class="review-tag">新</small>' : ''}</button>`;
    }).join("");
  }
  renderBag();

  function syncBag() {
    document.querySelectorAll(".slot").forEach((slot) => {
      const letter = slot.dataset.letter;
      const s = state.bag[letter];
      slot.className = "slot";
      slot.classList.add(state.selected === letter ? "is-selected" : `is-${s}`);
      // 字母星球拼词时字母放在石台上，不是地上
      slot.dataset.where = IS_LETTERS ? "在石台" : "在地上";
      slot.hidden = crystals[letter] ? !crystals[letter].active : false;
      const ready = altar.slots.length > 0 && !state.done && !state.spelling;
      slot.classList.toggle("is-hint", ready && s === "has" && !state.selected);
    });
  }
  $("#bag").addEventListener("click", (event) => {
      const slot = event.target.closest(".slot");
      if (!slot) return;
      lastInput = performance.now();
      if (!state.started || state.done || state.spelling || pGame?.locked) return;
      initAudio();
      const letter = slot.dataset.letter;
      const s = state.bag[letter];
      const L = letter.toLowerCase();
      if (IS_LETTERS) {
        if (s === "empty") return;
        if (blend.waiting) blendPick(letter);
        else {
          sfx.bubble();
          hear(`ls-${letter}`);
        }
        return;
      }
      if (s === "empty") {
        say(`还没找到 <b>${L}</b> 水晶。看看天上的光柱在哪里？`, { voice: "empty-letter" });
      } else if (s === "placed") {
        say(`<b>${L}</b> 已经放在格子里了。点它可以把它拿回来。`, { voice: "pick-swap" });
      } else if (state.selected === letter) {
        state.selected = null;
        say(`把 <b>${L}</b> 收回了背包。`, { voice: "picked-back" });
      } else {
        state.selected = letter;
        sfx.bubble();
        const full = altar.slots.length && altar.slots.every(slotTaken);
        if (full) {
          const first = slotLetter(altar.slots[0]).toLowerCase();
          say(`点格子里的 <b>${first}</b>，<b>${L}</b> 就会换进去！`, { voice: "pick-swap" });
        } else if (altar.slots.length) {
          say(`点一个<b>发光的格子</b>，把 <b>${L}</b> 放进去。`, { voice: "pick-letter" });
        } else {
          say(`点一块草地，把 <b>${L}</b> 放在那里。`, { voice: "pick-ground" });
        }
      }
      syncBag();
  });

  function flyToBag(letter, worldPos) {
    const p = worldPos.clone().project(camera);
    const x = ((p.x + 1) / 2) * window.innerWidth;
    const y = ((1 - p.y) / 2) * window.innerHeight;
    const target = document.querySelector(`.slot[data-letter="${letter}"]`) || $("#bag");
    const slot = target.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "fly";
    el.textContent = letter.toLowerCase();
    el.style.background = LETTERS[letter].color;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    $("#fly-layer").appendChild(el);
    sfx.whoosh();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transform = `translate(${slot.left + slot.width / 2 - x}px, ${slot.top + slot.height / 2 - y}px)`;
    }));
    setTimeout(() => {
      el.remove();
      const s = document.querySelector(`.slot[data-letter="${letter}"]`);
      if (!s) return;
      s.classList.remove("pop");
      void s.offsetWidth;
      s.classList.add("pop");
      sfx.pop();
    }, 850);
  }

  // ---------- 星星计数：右上角 ⭐，奖励时几颗星星飞过去 ----------
  const starCountEl = $("#star-count b");
  function showStarCount() {
    starCountEl.textContent = String(starBank.total);
  }
  function bumpStarCount() {
    const chip = $("#star-count");
    chip.classList.remove("is-bump");
    void chip.offsetWidth;
    chip.classList.add("is-bump");
  }
  function addStars(n, worldPos = null) {
    const grew=petLedger.earn(n);
    companionUI.reward(grew);
    writeStore(STAR_KEY, { total: starBank.total });
    const target = $("#star-count").getBoundingClientRect();
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.45;
    if (worldPos) {
      const p = worldPos.clone().project(camera);
      if (p.z < 1) {
        x = ((p.x + 1) / 2) * window.innerWidth;
        y = ((1 - p.y) / 2) * window.innerHeight;
      }
    }
    // 奖励的数字先在原地冒出来
    if (n > 1) {
      const plus = document.createElement("div");
      plus.className = "star-plus";
      plus.textContent = `+${n} ⭐`;
      plus.style.left = `${x}px`;
      plus.style.top = `${y}px`;
      $("#fly-layer").appendChild(plus);
      setTimeout(() => plus.remove(), 1300);
    }
    const shown = Math.min(n, 5);
    for (let i = 0; i < shown; i += 1) {
      const el = document.createElement("div");
      el.className = "fly-star";
      el.textContent = "⭐";
      el.style.left = `${x + (Math.random() - 0.5) * 40}px`;
      el.style.top = `${y + (Math.random() - 0.5) * 30}px`;
      $("#fly-layer").appendChild(el);
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${target.left + target.width / 2 - (r.left + r.width / 2)}px, ${target.top + target.height / 2 - (r.top + r.height / 2)}px) scale(.6)`;
        el.style.opacity = "0.3";
      }, 60 + i * 110);
      setTimeout(() => {
        el.remove();
        sfx.star();
        bumpStarCount();
        if (i === shown - 1) showStarCount();
      }, 760 + i * 110);
    }
  }
  // 草地上的星星：一边转一边上下飘；走近就被吸到角色身上
  function updateFieldStars(dt, time) {
    for (const star of fieldStars) {
      if (star.taken && star.fly < 0) continue;
      const up = upAt(star.dir);
      if (star.fly >= 0) {
        star.fly += dt / 0.28;
        const from = star.dir.clone().multiplyScalar(surfaceRadius(star.dir) + 0.75);
        const to = player.obj.position.clone().addScaledVector(player.dir, 0.9);
        star.mesh.position.lerpVectors(from, to, ease(Math.min(1, star.fly)));
        star.mesh.scale.setScalar(Math.max(0.01, 1 - star.fly * 0.7));
        if (star.fly >= 1) {
          star.fly = -1;
          star.mesh.visible = false;
          addStars(1);
        }
        continue;
      }
      star.mesh.position.copy(star.dir).multiplyScalar(surfaceRadius(star.dir) + 0.75 + Math.sin(time * 2.2 + star.index) * 0.1);
      orient(star.mesh, up, FWD0);
      star.mesh.rotateY(time * 2.2 + star.index);
      if (state.started && !traveling && arc(player.dir, star.dir) < 1.1) {
        star.taken = true;
        star.fly = 0;
        sfx.star();
      }
    }
    syncFieldStars();
  }

  // ---------- 粒子与点击标记 ----------
  const particles = [];
  const particleGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  function burst(pos, color, count = 22, power = 1) {
    if((IS_I || IS_P) && round3?.burst){round3.burst(pos,color,count,power);return;}
    const mat = new THREE.MeshBasicMaterial({ color });
    const up = pos.clone().normalize();
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(particleGeo, mat);
      mesh.position.copy(pos);
      const side = tangent(new V3(rng() - 0.5, rng() - 0.5, rng() - 0.5), up);
      const vel = side.multiplyScalar((1 + rng() * 2) * power).addScaledVector(up, (2 + rng() * 3) * power);
      scene.add(mesh);
      particles.push({ mesh, vel, life: 0.9 + rng() * 0.5 });
    }
  }

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.36, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
  );
  scene.add(marker);
  let markerLife = 0;
  function showMarker(point) {
    const up = point.clone().normalize();
    marker.position.copy(point).addScaledVector(up, 0.05);
    marker.quaternion.setFromUnitVectors(new V3(0, 0, 1), up);
    markerLife = 0.6;
    sfx.tick();
  }

  // ---------- 移动 ----------
  let route = null;
  function routeTo(dir, stop, onArrive = null) {
    const goal = dir.clone().normalize();
    const waypoints = navigation ? navigation.plan(player.dir, goal, stop) : null;
    if(navigation && !navigation.snapshot().found){route=null;return;}
    route = { dir: goal, stop, onArrive, waypoints, index:0 };
    if(LARGE_WORLD) camFwdTarget = tangent(goal.clone().sub(player.dir),player.dir);
  }

  const camFwd = FWD0.clone();
  let camShot = null;
  let camYawDelta = 0;
  let camFwdTarget = null;

  function camRightAt(dir) {
    return tangent(camFwd, dir).cross(dir).normalize();
  }

  let stepTimer = 0, playerMoving = false;
  const snakeRide = PLANET.id==="s01" && LARGE_WORLD && window.YayaSnakeRide ? YayaSnakeRide.create({THREE,scene,player,SURF,arc,moveAlong,tangent,orient,surfaceRadius,navigation,obstacles,camera,sfx,burst,tween,wait,LOW_POWER,
    routeTo:(d,stop)=>routeTo(d,stop),stopRoute:()=>{route=null},moving:()=>playerMoving,cameraShot:s=>{camShot=s},occluders:()=>props.map(p=>p.obj),avoid:[{dir:STAGE.center,r:4.2}],openSpots:()=>[START_DIR,moveAlong(STAGE.center,FWD0,7).normalize(),moveAlong(STAGE.center,FWD0.clone().negate(),7).normalize()],faceTo:d=>{camFwdTarget=tangent(d.clone().sub(player.dir),player.dir)},setAvatarVisible:v=>{player.obj.visible=v}}) : null;
  // S 任务一开场：先找三块会唱 /s/ 的小水晶，集齐后合成大水晶
  // T 任务二：孩子陪托托在星球上沿沙砖跑道赛跑（planet-t-race.js）
  const tRace = PLANET.id==="t01" && LARGE_WORLD && window.YayaTRace && round3?.raceTrack ? YayaTRace.create({THREE,scene,player,SURF,arc,moveAlong,tangent,orient,surfaceRadius,navigation,obstacles,camera,sfx,burst,tween,wait,LOW_POWER,world:round3,
    routeTo:(d,stop)=>routeTo(d,stop),stopRoute:()=>{route=null},routing:()=>!!route,moving:()=>playerMoving,cameraShot:s=>{camShot=s},setSpeed:v=>{routeSpeed=v},sparkle:p=>round3.sparkleBurst(p),
    faceTo:d=>{camFwdTarget=tangent(d.clone().sub(player.dir),player.dir)},setAvatarVisible:v=>{player.obj.visible=v},chip:()=>document.querySelector("#chip-sub"),refreshChip:()=>updateWordCount()}) : null;
  const sShards = PLANET.id==="s01" && LARGE_WORLD && window.YayaSShards ? YayaSShards.create({THREE,scene,player,arc,moveAlong,tangent,surfaceRadius,orient,navigation,obstacles,STAGE,sfx,burst,tween,wait,read:readStore,write:writeStore,
    crystal:()=>crystals[LETTER],activate:()=>activateLetter(LETTER,true),shouldRun:()=>state.started&&practice.stage===1&&!crystals[LETTER].collected&&!crystals[LETTER].lessonDone&&!lesson.active,
    playWord:w=>playWord(w),say:(h,o)=>say(h,o),sing:()=>{if(performance.now()-voice.at>2500)playWord('ls-s')},onCount:()=>{},stopRoute:()=>{route=null},routeTo:(d,stop)=>routeTo(d,stop),faceTo:d=>{camFwdTarget=tangent(d.clone().sub(player.dir),player.dir)}}) : null;
  const iGame=IS_I&&window.YayaIGame?YayaIGame.create({THREE,scene,player,world:round3,orchard,STAGE,surfaceRadius,orient,tangent,arc,tween,wait,sfx,burst,LOW_POWER,camera,
    routeTo,ready:()=>state.started,free:()=>!learningNow()&&!iGame?.iceActive,stopRoute:()=>{route=null},cameraShot:v=>{camShot=v},crystal:()=>crystals[LETTER],activate:()=>activateLetter(LETTER,true),
    has:id=>made.has(id),mark:id=>made.add(id),save:()=>save(),stars:n=>addStars(n),trace:i=>courseTrace(i),playWord:w=>playWord(w),say:(h,o)=>say(h,o),sing:()=>{if(performance.now()-voice.at>3500&&!practice.busy)playWord('ls-i')}
  }):null;
  function updatePlayer(dt) {
    if(iGame?.riding || pGame?.riding){playerMoving=false;return;}
    let moving = false;
    if (route) {
      const destination = route.waypoints ? route.waypoints[route.index] : route.dir;
      const dist = destination ? arc(player.dir, destination) : 0;
      const stop = route.waypoints ? 0 : route.stop;
      if (dist <= stop + 0.045) {
        if (route.waypoints && route.index < route.waypoints.length-1) route.index++;
        else { const done = route.onArrive; route = null; if (done) done(); }
      } else {
        moving = true;
        const step = Math.min(WALK_SPEED * routeSpeed * dt, dist - stop);   // T race: Toto runs slower (routeSpeed)
        const toward = tangent(destination.clone().sub(player.dir), player.dir);
        const next = moveAlong(player.dir, toward, step).normalize();
        if (navigation) player.dir.copy(navigation.constrain(next,toward));
        else {
          player.dir.copy(next);
          for (const o of obstacles) {
            if (route && o.crystal && route.stop > 0 && arc(route.dir, o.dir) < 0.1) continue;
            if (arc(player.dir, o.dir) >= o.r) continue;
            const a = player.dir.clone().applyAxisAngle(o.dir, 0.2);
            const b = player.dir.clone().applyAxisAngle(o.dir, -0.2);
            const sign = route && arc(a, route.dir) < arc(b, route.dir) ? 1 : -1;
            player.dir.applyAxisAngle(o.dir, (sign * WALK_SPEED * dt) / Math.max(o.r, 0.3));
            const axis = new V3().crossVectors(o.dir, player.dir);
            if (axis.lengthSq() < 1e-10) axis.copy(RIGHT0);
            player.dir.copy(o.dir).applyAxisAngle(axis.normalize(), o.r / SURF).normalize();
          }
        }
        const desired = moving ? toward : player.heading;
        player.heading.lerp(desired, 1 - Math.exp(-dt * 12));
        stepTimer -= dt;
        if (stepTimer <= 0) {
          if (!round3?.onBoat?.()) sfx.step();
          stepTimer = 0.32;
        }
      }
    }
    player.heading.copy(tangent(player.heading, player.dir));
    playerMoving = moving;
    // 坐在船上：船在动，人不迈腿（也不响脚步声），站着就好
    const aboard = Boolean(round3?.onBoat?.());
    if (moving && !aboard) {
      player.oneShot = false;
      playLoop(player, "walk");
    } else if (aboard && !player.oneShot) {
      playLoop(player, "idle");
    } else if (!player.oneShot) {
      playLoop(player, "idle");
    }
    player.radius += (surfaceRadius(player.dir) - player.radius) * Math.min(1, dt * 14);
    player.obj.position.copy(player.dir).multiplyScalar(player.radius);
    orient(player.obj, player.dir, player.heading);
  }

  function updatePet(pet, dt) {
    if (!pet.active) return;
    if (!pet.dancing) {
      const right = new V3().crossVectors(player.heading, player.dir).normalize();
      const behind = moveAlong(player.dir, player.heading.clone().negate(), 1.3);
      const target = moveAlong(behind, right, pet.side);
      const d = arc(pet.dir, target);
      if (d > 0.35) {
        const toward = tangent(target.clone().sub(pet.dir), pet.dir);
        pet.dir.copy(moveAlong(pet.dir, toward, Math.min(d, Math.min(WALK_SPEED * 1.15, d * 3) * dt))).normalize();
        pet.heading.lerp(toward, 1 - Math.exp(-dt * 10));
        playLoop(pet, d > 2.5 ? "run" : "walk");
      } else {
        pet.heading.lerp(tangent(player.dir.clone().sub(pet.dir), pet.dir), 1 - Math.exp(-dt * 4));
        if (!pet.oneShot) playLoop(pet, "idle");
      }
    }
    pet.heading.copy(tangent(pet.heading, pet.dir));
    pet.radius += (surfaceRadius(pet.dir) - pet.radius) * Math.min(1, dt * 14);
    pet.obj.position.copy(pet.dir).multiplyScalar(pet.radius);
    orient(pet.obj, pet.dir, pet.heading);
  }

  const camTarget = new V3();
  const camPos = new V3();
  const camFocus = new V3();
  let camLift = 0.72;
  let camZoom = 1;
  let camAhead = 0;
  const occluderRay = new THREE.Raycaster();
  const blocking = new Set();
  let occluderTimer = 0;
  function updateCamera(dt, snap = false) {
    const up = player.dir;
    if (camFwdTarget) {
      camFwd.lerp(tangent(camFwdTarget, up), 1 - Math.exp(-dt * 3));
      if (camFwd.angleTo(tangent(camFwdTarget, up)) < 0.02) camFwdTarget = null;
    }
    camFwd.copy(tangent(camFwd, up));
    if (camYawDelta) {
      camFwd.applyAxisAngle(up, camYawDelta);
      camYawDelta = 0;
    }
    const playerPos = player.obj.position;
    const k = snap ? 1 : 1 - Math.exp(-dt * 5);
    // 答题时镜头拉高，把角色、水晶和三个答案方块都框进来
    const focus = playerPos.clone();
    // 每颗星球可以有自己的镜头：苹果星球放低一点、往前看，能看到地平线和天空
    let lift = (PLANET.camera && PLANET.camera.lift) || 0.72;
    let ahead = (PLANET.camera && PLANET.camera.ahead) || 0;
    // Round 4: look further ahead (raises the horizon) so the sunset sky, small planets and lighthouse fit like the concept.
    if (LARGE_WORLD) { ahead += camera.aspect > 1.2 ? 4.8 : 2.2; if (camera.aspect > 1.2) lift *= .8; }
    let zoom = 1;
    if (state.challenge && !LARGE_WORLD) {
      focus.lerp(crystals[state.challenge].group.position, 0.45);
      lift = 1.05;
      ahead = 0;
      // 竖屏手机上拉近一些，答案方块大一点、好点
      zoom = camera.aspect < 0.8 ? 0.68 : 0.85;
    }
    if (camShot) { if(Number.isFinite(camShot.lift)) lift = camShot.lift; if(Number.isFinite(camShot.zoom)) zoom = camShot.zoom; if (camShot.ahead !== undefined) ahead = camShot.ahead; if (camShot.focus) focus.copy(camShot.focus); }
    if (snap) camFocus.copy(focus);
    else camFocus.lerp(focus, k);
    camLift += (lift - camLift) * k;
    camZoom += (zoom - camZoom) * k;
    camAhead += (ahead - camAhead) * k;
    camTarget.copy(camFocus).addScaledVector(up, 1.2).addScaledVector(camFwd, camAhead);
    // 降落时从远处慢慢拉近；起飞时由 travelTo 拉远
    if (!traveling && state.started) camBoost += (1 - camBoost) * (snap ? 1 : 1 - Math.exp(-dt * 1.2));
    const dist = camDist * camZoom * camBoost;
    camPos.copy(camFocus).addScaledVector(up, dist * camLift).addScaledVector(camFwd, -dist);
    if(camShot?.position)camPos.copy(camShot.position);
    if(camShot?.position&&camShot.focus)camTarget.copy(camShot.focus);
    if(camShot?.direct)camera.position.copy(camPos);else camera.position.lerp(camPos, k);
    if(LARGE_WORLD){const cameraDir=camera.position.clone().normalize();const minRadius=surfaceRadius(cameraDir)+1.1;if(camera.position.length()<minRadius)camera.position.copy(cameraDir).multiplyScalar(minRadius);}
    if(camShot?.direct)camera.up.copy(camShot.up||up).normalize();else camera.up.lerp(camShot?.up||up, k).normalize();
    camera.lookAt(camTarget);
    skyGroup.position.copy(camera.position);
    // 拉远看全貌时，挡在镜头前面的近处云朵先藏起来；拉近后再还原（只还原这里藏的）
    if (LARGE_WORLD) {
      const zoomed = camDist > 18, wp = new V3();
      for (const cl of clouds.children) {
        const hide = zoomed && cl.getWorldPosition(wp).distanceTo(camera.position) < 30;
        if (hide && cl.visible) { cl.visible = false; cl.userData.zoomHidden = true; }
        else if (!hide && cl.userData.zoomHidden) { cl.visible = true; cl.userData.zoomHidden = false; }
      }
    }

    // 挡在镜头和角色之间的树变半透明（每 0.15 秒检查一次就够）
    occluderTimer -= dt;
    if (occluderTimer <= 0 || snap) {
      occluderTimer = 0.15;
      const chest = playerPos.clone().addScaledVector(up, 0.8);
      const toPlayer = chest.clone().sub(camera.position);
      const far = toPlayer.length();
      occluderRay.set(camera.position, toPlayer.normalize());
      occluderRay.far = far - 0.3;
      blocking.clear();
      for (const hit of occluderRay.intersectObjects(props.map((p) => p.obj), true)) {
        let o = hit.object;
        while (o.parent && o.parent !== scene) o = o.parent;
        blocking.add(o);
      }
    }
    for (const p of props) {
      const goal = blocking.has(p.obj) || (p.obj.userData.fadeNearCam && (p.box || (p.box = new THREE.Box3().setFromObject(p.obj))).distanceToPoint(camera.position) < p.obj.userData.fadeNearCam) ? 0.28 : 1;
      if (Math.abs(p.fade - goal) < 0.01) continue;
      p.fade += (goal - p.fade) * Math.min(1, dt * 8);
      p.mats.forEach((m,i) => {
        m.opacity = p.fade * (p.baseOpacities[i] ?? 1);
        m.depthWrite = p.fade > 0.95;
      });
    }

    const st = tangent(SUN_DIR, up);
    const lightDir = up.clone().addScaledVector(st, 0.7).normalize();
    sun.target.position.copy(playerPos);
    sun.position.copy(playerPos).addScaledVector(lightDir, 25);
  }

  // ---------- 答案：三个会唱歌的果冻小方块 ----------
  const BUDDY_COLORS = ["#ff9ec7", "#7fe0b5", "#8fc8ff"];
  function makeBuddy(color) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.15 });
    const body = new THREE.Group();
    const add = (parent, w, h, d, x, y, z, mat) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    const core = add(body, 0.8, 0.72, 0.72, 0, 0.36, 0, bodyMat);
    core.castShadow = true;
    // 头顶一块亮亮的高光，让它看起来像果冻
    add(body, 0.5, 0.05, 0.4, -0.06, 0.735, -0.04, new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55 }));
    const dark = new THREE.MeshBasicMaterial({ color: "#2b2440" });
    const white = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    const eyes = [-1, 1].map((side) => {
      const eye = add(body, 0.12, 0.16, 0.03, side * 0.17, 0.46, 0.365, dark);
      add(eye, 0.04, 0.04, 0.02, 0.02, 0.03, 0.015, white);
      return eye;
    });
    const cheekMat = new THREE.MeshBasicMaterial({ color: "#ff6f9a", transparent: true, opacity: 0.6 });
    const cheeks = [-1, 1].map((side) => add(body, 0.13, 0.06, 0.02, side * 0.29, 0.33, 0.365, cheekMat));
    const mouth = add(body, 0.16, 0.06, 0.03, 0, 0.29, 0.365, dark);
    group.add(body);
    return { group, body, bodyMat, eyes, cheeks, mouth };
  }
  // 点到它：跳一下、张嘴“唱”，冒出小音符
  function sing(u, strength = 1) {
    const { buddy } = u;
    tween(0.55, (k) => {
      buddy.mouth.scale.set(1 + Math.sin(k * Math.PI) * 0.4 * strength, 1 + Math.sin(k * Math.PI) * 3 * strength, 1);
      buddy.group.position.y = Math.sin(k * Math.PI) * 0.3 * strength;
    });
    for (let i = 0; i < 3; i += 1) {
      const note = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTexture, transparent: true, depthWrite: false }));
      note.scale.setScalar(0.32);
      u.label.parent.add(note);
      const x0 = (Math.random() - 0.5) * 0.5;
      tween(0.9, (k) => {
        note.position.set(x0 + Math.sin(k * 6 + i) * 0.12, 0.9 + k * 0.9, 0.2);
        note.material.opacity = 1 - k;
      }).then(() => note.parent && note.parent.remove(note));
    }
  }
  const noteTexture = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    g.font = '96px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("🎵", 64, 70);
    return srgb(new THREE.CanvasTexture(c));
  })();
  // 答案上方的标签：大喇叭 + （有的话）选项文字 + 小提示
  function answerLabelTexture(label, note, selected = false) {
    return YayaListeningUI.texture(THREE, label, note, selected);
  }
  function refreshAnswerLabel(block) {
    const u = block.userData;
    if (u.worldGem) {u.buddy.halo.material.opacity=u.tried?1:.65;return;}
    const previous = u.label.material.map;
    u.label.material.map = answerLabelTexture(u.choice.label, u.choice.note || "点我听听", u.tried);
    previous.dispose();
  }
  function listeningHit(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const right = new V3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new V3().setFromMatrixColumn(camera.matrixWorld, 1);
    const items = answers.filter(b => !b.userData.disabled && (!LARGE_WORLD || arc(player.dir,b.userData.dir)<16)).map(block => {
      const label = block.userData.label, pos = label.getWorldPosition(new V3());
      const scale = label.getWorldScale(new V3()), center = screenPoint(pos);
      if (!center) return null;
      const edgeX = screenPoint(pos.clone().addScaledVector(right, scale.x / 2));
      const edgeY = screenPoint(pos.clone().addScaledVector(up, scale.y / 2));
      if (!edgeX || !edgeY || center.x < rect.left || center.x > rect.right || center.y < rect.top || center.y > rect.bottom) return null;
      return {block, cx:center.x, cy:center.y, width:Math.abs(edgeX.x-center.x)*2, height:Math.abs(edgeY.y-center.y)*2};
    }).filter(Boolean);
    return YayaListeningUI.hitTarget(clientX, clientY, items);
  }

  // ---------- 水晶挑战：题目就在世界里 ----------
  let answers = [];
  const answerTrail = document.createElement("nav");
  answerTrail.id="answer-trail";answerTrail.hidden=true;answerTrail.setAttribute("aria-label","寻找答案水晶");
  document.body.append(answerTrail);
  function visitAnswer(block) {
    if(block.userData.disabled||state.digPending)return;
    if(LARGE_WORLD && arc(player.dir,block.userData.dir)>1.75) {
      routeTo(block.userData.dir,1.45,()=>hitAnswer(block));
      say("沿着小路，去听听这颗水晶。",{interrupt:true});
    } else {route=null;hitAnswer(block);}
  }
  function updateAnswerTrail() {
    answerTrail.hidden=!LARGE_WORLD||!state.challenge||!!state.digPending;
    if(answerTrail.hidden)return;
    for(const block of answers){const u=block.userData,b=answerTrail.querySelector(`[data-choice="${u.choice.value}"]`);if(!b)continue;
      b.disabled=u.disabled;const d=arc(player.dir,u.dir);b.querySelector('small').textContent=d>1.75?`${Math.ceil(d)} 米`:u.tried?'选它':'听听';
      b.classList.toggle('is-near',d<=1.75);
    }
  }
  function clearAnswers(animated = true) {
    const list = answers;
    answers = [];
    answerTrail.hidden=true;answerTrail.replaceChildren();
    list.forEach((block) => {
      if (!animated) {
        scene.remove(block);
        return;
      }
      const start = block.userData.lift;
      tween(0.4, (k) => {
        block.userData.lift = start - ease(k) * 1.2;
        block.scale.setScalar(1 - k * 0.6);
      }).then(() => scene.remove(block));
    });
  }

  function startChallenge(letter) {
    const crystal = crystals[letter];
    if (!crystal || crystal.collected || state.digging || state.digPending || state.spelling) return;
    clearAnswers(false);
    const def = CHALLENGES[letter] || (IS_LETTERS && (CHALLENGES[letter] = makeLetterQuiz(letter)));
    if (!def) return;
    state.challenge = letter;
    if(LARGE_WORLD)crystal.group.visible=false;
    const f = tangent(crystal.dir.clone().sub(player.dir), player.dir);
    player.heading.copy(f);
    camFwdTarget = f.clone();
    const right = new V3().crossVectors(f, player.dir).normalize();
    const base = moveAlong(player.dir, f, 1.7);
    const choices = LARGE_WORLD ? [...def.choices].sort((a,b)=>a.value.localeCompare(b.value)) : [...def.choices].sort(() => Math.random() - 0.5);
    choices.forEach((choice, i) => {
      const dir = LARGE_WORLD ? round3.answerDirs[i].clone() : moveAlong(base, right, (i - 1) * 1.7).normalize();
      const block = new THREE.Group();
      const buddy = LARGE_WORLD ? YayaRound3Crystals.create(THREE,"",["#b69be8","#c391d4","#9faee9"][i]) : makeBuddy(BUDDY_COLORS[i % BUDDY_COLORS.length]);
      const label = LARGE_WORLD ? buddy.label : new THREE.Sprite(new THREE.SpriteMaterial({ map: answerLabelTexture(choice.label, choice.note || "点我听听"), depthWrite: false, depthTest: false }));
      // Large world: the letter lives inside the crystal (child of the gem body), so leave it there.
      if (!LARGE_WORLD) {
        label.renderOrder = 20; // Keep learning cards legible in front of crystal beams.
        label.scale.set(1.6, 1.05, 1);
        label.position.y = 1.45;
      }
      block.add(buddy.group);
      if (!LARGE_WORLD) block.add(label);
      block.userData = { kind: "answer", worldGem:LARGE_WORLD, letter, choice, dir, lift: -0.8, tried: false, disabled: false, cube: buddy.group, buddy, label };
      scene.add(block);
      answers.push(block);
      tween(0.5, (k) => { block.userData.lift = -0.8 + ease(k) * (LARGE_WORLD?2.3:1.2); });
      if(LARGE_WORLD){const button=document.createElement('button');button.type='button';button.dataset.choice=choice.value;button.innerHTML=`<b>${choice.value.toUpperCase()}</b><small>去听听</small>`;button.setAttribute('aria-label',`走到 ${choice.value.toUpperCase()} 水晶`);button.onclick=()=>visitAnswer(block);answerTrail.append(button);}
    });
    sfx.bloops();
    state.heardHint = false;
    state.wrongTries = 0;
    say(`${def.question}<br><small>${LARGE_WORLD?"点水晶，走过去听听；再点一次选它":"每个方块先点一下听，再点一下选它"}</small>`, { replay: true, voice: `q-${def.type}`, then: def.audio, interrupt: true });
  }

  function updateAnswers(time) {
    for (const block of answers) {
      const u = block.userData;
      const bob = u.disabled ? 0 : Math.sin(time * 2.4 + u.dir.x * 9) * 0.06;
      // 果冻一样轻轻地一鼓一鼓；眨眼
      if (!u.disabled) {
        const squash = Math.sin(time * 4.8 + u.dir.x * 9) * 0.04;
        u.buddy.body.scale.set(1 - squash, 1 + squash, 1 - squash);
        const blink = (time * 0.7 + u.dir.z * 3) % 3 < 0.12 ? 0.15 : 1;
        u.buddy.eyes.forEach((eye) => { eye.scale.y = blink; });
      }
      block.position.copy(u.dir).multiplyScalar(surfaceRadius(u.dir) + u.lift + bob);
      orient(block, u.dir, camFwd.clone().negate());
    }
  }

  async function hitAnswer(block) {
    const u = block.userData;
    if (u.disabled || state.challenge !== u.letter || (LARGE_WORLD && arc(player.dir,u.dir)>1.8)) return;
    const def = CHALLENGES[u.letter];
    player.heading.copy(tangent(u.dir.clone().sub(player.dir), player.dir));
    playOnce(player, "interact-right");
    const bounce = tween(0.3, (k) => { u.cube.position.y = Math.sin(k * Math.PI) * 0.35; });
    if (!u.tried) {
      // 第一次点：只听这个选项的声音
      answers.forEach((b) => { b.userData.tried = false; });
      u.tried = true;
      answers.forEach(refreshAnswerLabel);
      sing(u);
      hear(u.choice.audio);
      // 第一次听完提示一句“再点一次就选它”，之后只显示字幕，不再重复念
      const tip = def.type === "letter" ? "觉得是它，就再点一次它。" : `这是 <b>${u.choice.label}</b>。觉得对，就再点一次它。`;
      say(tip, { replay: true, voice: state.heardHint ? null : "choose-again" });
      state.heardHint = true;
      return;
    }
    if (u.choice.value === def.answer) {
      try { round3?.sparkleBurst(block.getWorldPosition(new V3()).addScaledVector(u.dir, 0.5)); } catch (e) {}
      // 动画期间就锁住答案，连点也只奖励一次、只开始一次挖掘。
      state.digPending = u.letter;
      answers.forEach((answer) => { answer.userData.disabled = true; });
      // 一次就选对：奖励 1 颗星星（答错不扣）
      if (!state.wrongTries) addStars(1, block.position.clone().addScaledVector(u.dir, 1));
      await bounce;
      if(LARGE_WORLD){
        const c=crystals[u.letter];
        const obstacle=obstacles.find(o=>o.crystal===u.letter);
        c.dir.copy(u.dir);if(obstacle)obstacle.dir=c.dir;
        placeOnSurface(c.group,c.dir,player.heading);c.group.visible=true;
        camFwdTarget=tangent(c.dir.clone().sub(player.dir),player.dir);
      }
      startDig(u.letter, block);
    } else {
      sfx.boing();
      try { round3?.wrongFeedback(block.getWorldPosition(new V3())); } catch (e) {}
      state.wrongTries = (state.wrongTries || 0) + 1;
      u.disabled = true;
      u.buddy.bodyMat.color.set(0xb7b3c2);
      u.buddy.bodyMat.emissiveIntensity = 0;
      u.buddy.mouth.scale.set(1.4, 0.5, 1);
      u.buddy.cheeks.forEach((c) => { c.visible = false; });
      u.label.material.opacity = 0.45;
      setTimeout(() => playOnce(player, "emote-no"), 250);
      tween(0.4, (k) => { u.cube.rotation.y = Math.sin(k * Math.PI * 6) * 0.25 * (1 - k); });
      say("再听一次，慢慢来，你可以的！", { replay: true, voice: "wrong", then: def.audio, interrupt: true });
    }
  }

  async function startDig(letter, block) {
    const crystal = crystals[letter];
    if (crystal.collected || state.digging) return;
    state.lastProgress = performance.now();
    block.userData.buddy.bodyMat.emissive.set(0xfff1a0);
    block.userData.buddy.bodyMat.emissiveIntensity = 0.7;
    sing(block.userData, 0.6);
    sfx.sparkle();
    playOnce(player, "emote-yes");
    say("答对啦！用手指戳一戳水晶，把它敲开！", { voice: "dig-start", interrupt: true, replay: true });
    await wait(0.45);
    clearAnswers();
    state.challenge = null;
    state.digPending = null;
    state.digging = { letter, hits: 0, need: 3 };
    route = null;
    lastInput = performance.now();
    crystal.shell.material.dispose();
    crystal.shell.material = new THREE.MeshLambertMaterial({
      map: iceTextures[0],
      color: new THREE.Color("#ffffff").lerp(new THREE.Color(LETTERS[letter].color), 0.25),
      transparent: true,
      opacity: 0.92,
      emissive: new THREE.Color(LETTERS[letter].color),
      emissiveIntensity: 0.25,
    });
    tween(0.5, (k) => crystal.shell.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.15));
  }

  function digHit(crystal) {
    const digging = state.digging;
    if (!digging || digging.letter !== crystal.letter || crystal.collected) return;
    lastInput = performance.now();
    state.lastProgress = lastInput;
    player.heading.copy(tangent(crystal.dir.clone().sub(player.dir), player.dir));
    playOnce(player, "interact-right");
    tween(0.3, (k) => { crystal.float.rotation.z = Math.sin(k * Math.PI * 8) * 0.25 * (1 - k); });
    const worldPos = crystal.float.getWorldPosition(new V3());
    burst(worldPos, "#ffffff", 7, 0.5);
    burst(worldPos, LETTERS[crystal.letter].color, 7, 0.5);
    bell(1600 + digging.hits * 300, { gain: 0.09, decay: 0.3 });
    const hitSound = hear(`ls-${crystal.letter}`);
    digging.hits += 1;
    crystal.shell.material.map = iceTextures[Math.min(digging.hits, 2)];
    if (digging.hits >= digging.need) {
      state.digging = null;
      shatterCrystal(crystal.letter, hitSound);
    }
  }

  async function shatterCrystal(letter, hitSound = Promise.resolve()) {
    const crystal = crystals[letter];
    if (crystal.collected) return;
    crystal.collected = true;
    state.lastProgress = performance.now();
    // 碎裂立即发生，第三下的字母音播完再说结果，避免把它截断。
    const speechGen = speech.gen;
    hitSound.then(() => {
      if (speech.gen === speechGen) say("答对啦！水晶碎开了！", { voice: "right", interrupt: true });
    });
    const worldPos = crystal.float.getWorldPosition(new V3());
    burst(worldPos, LETTERS[letter].color, 30, 1.2);
    sfx.glass();
    flyToBag(letter, worldPos);
    tween(0.35, (k) => crystal.float.scale.setScalar(1 - k));
    tween(1.2, (k) => {
      crystal.beam.material.opacity = 0.55 * (1 - k);
      if (crystal.light) crystal.light.intensity = 8 * (1 - k);
    }).then(() => { crystal.group.visible = false; });
    const idx = obstacles.findIndex((o) => o.crystal === letter);
    if (idx >= 0) obstacles.splice(idx, 1);
    await wait(0.85);
    state.bag[letter] = "has";
    syncBag();
    await wait(1.4);
    if (IS_LETTERS) {
      learnedLetter(letter);
      return;
    }
    if (LATER.includes(letter)) {
      const L = letter.toLowerCase();
      say(`收好了 <b>${L}</b>！跟着金色光点回到<b>石台</b>那里。先点背包里的 <b>${L}</b>，再点格子里的第一个字母，${L} 就会换进去。`, { voice: "got-later" });
      syncBag();
      return;
    }
    const left = WORD.filter((l) => !crystals[l].collected).length;
    if (left > 0) {
      say(`收好了 <b>${letter.toLowerCase()}</b>！跟着地上的<b>金色光点</b>，去找下一块水晶。还有 ${left} 块。`, { voice: "got-more" });
    } else {
      spawnAltar();
      say("三块水晶都找到啦！跟着金色光点回到<b>石台</b>那里。先点背包里的字母，再点<b>发光的格子</b>，把它放进去。", { voice: "got-all" });
    }
  }

  // ---------- 拼词格子：收齐字母后出现在角色面前，告诉孩子“放到这里” ----------
  const altar = { slots: [], label: null, dirs: null, fwd: null };
  const slotGeo = new THREE.PlaneGeometry(0.95, 0.95).rotateX(-Math.PI / 2);
  const slotTexture = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    g.scale(2, 2);
    g.fillStyle = "rgba(255,190,46,.75)";
    g.fillRect(8, 8, 112, 112);
    g.strokeStyle = "#ffffff";
    g.lineWidth = 12;
    g.setLineDash([20, 10]);
    g.strokeRect(8, 8, 112, 112);
    g.fillStyle = "rgba(255,255,255,.9)";
    g.font = '900 64px Arial, sans-serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("+", 64, 68);
    return srgb(new THREE.CanvasTexture(c));
  })();
  // 收齐第一个词的字母后，石台上的三个凹槽亮成发光的格子
  // restoring：读存档时直接摆好、不播动画
  function spawnAltar(restoring = false) {
    if (altar.slots.length) return;
    const f = STAGE.front.clone();
    const center = STAGE.center;
    const dirs = STAGE.slotDirs;
    altar.dirs = dirs;
    altar.fwd = f.clone();
    if (!restoring) for (const letter of [...placed.keys()]) returnToBag(letter);
    dirs.forEach((dir, index) => {
      const mesh = new THREE.Mesh(slotGeo, new THREE.MeshBasicMaterial({
        map: slotTexture, transparent: true, depthWrite: false,
      }));
      mesh.userData = { kind: "slot", index, dir };
      mesh.position.copy(dir).multiplyScalar(surfaceRadius(dir) + 0.03);
      orient(mesh, STAGE.up, f.clone().negate());
      scene.add(mesh);
      altar.slots.push(mesh);
      if (!restoring) {
        mesh.scale.setScalar(0.01);
        tween(0.5, (k) => mesh.scale.setScalar(Math.max(0.01, ease(k))));
      }
    });
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: YayaArtUI.createAltarLabel(THREE, ...(PLANET.altarLabel || ["", "拼一拼"]), { anisotropy: maxAnisotropy }), depthWrite: false }));
    label.scale.set(1.85, 0.925, 1);
    label.userData.art = "altar-plaque";
    // 标签立在石台后面，高过字母，不挡住格子
    const labelDir = moveAlong(center, f, -1.3).normalize();
    label.position.copy(labelDir).multiplyScalar(surfaceRadius(STAGE.center) + (camera.aspect < 0.8 ? (window.innerHeight < 700 ? 2.95 : 2.6) : 1.95));
    scene.add(label);
    altar.label = label;
    if (!restoring) sfx.magic();
    syncBag();
  }
  function slotLetter(slot) {
    for (const [letter, block] of placed) {
      if (arc(block.userData.dir, slot.userData.dir) < 0.45) return letter;
    }
    return null;
  }
  function slotTaken(slot) {
    return slotLetter(slot) !== null;
  }
  function nearestSlot(dir, within) {
    let best = null;
    for (const slot of altar.slots) {
      const d = arc(slot.userData.dir, dir);
      if (d < within && (!best || d < arc(best.userData.dir, dir))) best = slot;
    }
    return best;
  }
  // 把字母放进格子；格子里原来有字母，就让它飞回背包
  function swapIntoSlot(letter, slot) {
    if (state.spelling || state.done) return;
    const old = slotLetter(slot);
    if (old === letter) return;
    if (old) returnToBag(old);
    if (placed.has(letter)) {
      // 这个字母已经摆在别处（比如另一个格子），先收起来再放
      const block = placed.get(letter);
      placed.delete(letter);
      const idx = obstacles.findIndex((o) => o.placed === letter);
      if (idx >= 0) obstacles.splice(idx, 1);
      scene.remove(block);
    }
    placeLetter(letter, slot.userData.dir, true);
  }
  // 背包里能拼出新词的字母；格子有空位时，任何字母都算
  function usefulLetter() {
    return ALL_LETTERS.find((l) => state.bag[l] === "has" && WORDS[`${l}at`] && !made.has(`${l}at`))
      || (altar.slots.some((slot) => !slotTaken(slot)) ? ALL_LETTERS.find((l) => state.bag[l] === "has") : null);
  }
  function updateAltar(time) {
    altar.slots.forEach((slot, i) => {
      slot.visible = !state.done && !slotTaken(slot);
      slot.material.opacity = 0.75 + Math.sin(time * 4 - i * 0.7) * 0.25;
      slot.scale.setScalar(1 + Math.max(0, Math.sin(time * 4 - i * 0.7)) * 0.08);
    });
    if (altar.label) {
      altar.label.visible = !state.done;
      altar.label.material.opacity = 0.98 + Math.sin(time * 2) * 0.02;
    }
  }

  // ---------- 拼词：把字母放到地上 ----------
  const placed = new Map();
  function placeLetter(letter, dir, exact = false) {
    let target = dir.clone();
    // 放在已有字母旁边时自动对齐成一排，方便小朋友排整齐
    let best = null;
    let bestD = 2.2;
    for (const [other, block] of placed) {
      if (other === letter) continue;
      const d = arc(block.userData.dir, dir);
      if (d < bestD) {
        bestD = d;
        best = block;
      }
    }
    if (best && !exact) {
      const right = camRightAt(best.userData.dir);
      let side = Math.sign(dir.clone().sub(best.userData.dir).dot(right)) || 1;
      let spot = moveAlong(best.userData.dir, right.clone().multiplyScalar(side), 1.05);
      if ([...placed.values()].some((b) => arc(b.userData.dir, spot) < 0.6)) {
        side = -side;
        spot = moveAlong(best.userData.dir, right.clone().multiplyScalar(side), 1.05);
      }
      target = spot;
    }
    const block = addBlock(letter, target, 1.5);
    tween(0.3, (k) => {
      block.userData.lift = 1.5 - ease(k) * 1.05;
      placeOnSurface(block, block.userData.dir, camFwd.clone().negate(), block.userData.lift);
    }).then(() => {
      sfx.place();
      burst(block.position.clone().addScaledVector(block.userData.dir, -0.4), 0xd8c6a0, 8, 0.4);
      checkSpelling();
    });
    state.bag[letter] = "placed";
    state.selected = null;
    playOnce(player, "interact-right");
    syncBag();
  }

  // 在地上摆一块字母方块（放字母和读存档都用它）
  function addBlock(letter, dir, lift = 0.45) {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshLambertMaterial({ map: letterTextures[letter], emissive: new THREE.Color(LETTERS[letter].color), emissiveIntensity: 0.15 }),
    );
    block.castShadow = true;
    block.userData = { kind: "placed", letter, dir: dir.clone().normalize(), lift };
    placeOnSurface(block, block.userData.dir, camFwd.clone().negate(), lift);
    scene.add(block);
    placed.set(letter, block);
    obstacles.push({ dir: block.userData.dir, r: 0.5, placed: letter });
    return block;
  }

  function returnToBag(letter) {
    const block = placed.get(letter);
    if (!block) return;
    placed.delete(letter);
    const idx = obstacles.findIndex((o) => o.placed === letter);
    if (idx >= 0) obstacles.splice(idx, 1);
    flyToBag(letter, block.position.clone());
    scene.remove(block);
    setTimeout(() => {
      state.bag[letter] = "has";
      syncBag();
    }, 850);
  }

  function pickUpLetter(letter) {
    const block = placed.get(letter);
    if (!block || state.done || state.spelling) return;
    placed.delete(letter);
    const idx = obstacles.findIndex((o) => o.placed === letter);
    if (idx >= 0) obstacles.splice(idx, 1);
    playOnce(player, "pick-up");
    flyToBag(letter, block.position.clone());
    scene.remove(block);
    setTimeout(() => {
      state.bag[letter] = "has";
      syncBag();
    }, 850);
    say(altar.slots.length
      ? `把 <b>${letter.toLowerCase()}</b> 拿回背包了。再从背包里选一个字母，放进空格子。`
      : `把 <b>${letter.toLowerCase()}</b> 拿回背包了。`, { voice: altar.slots.length ? "more-slots" : "picked-back" });
  }

  function checkSpelling() {
    if (IS_LETTERS) return;
    if (state.done || state.spelling || !altar.slots.length) return;
    const letters = altar.slots.map(slotLetter);
    if (letters.includes(null)) {
      const empty = letters.filter((l) => !l).length;
      if (ALL_LETTERS.some((l) => state.bag[l] === "has")) {
        say(`放好了！还有 ${empty} 个空格子，从背包里选字母放进去。`, { voice: "more-slots" });
      }
      return;
    }
    const word = letters.join("");
    if (WORDS[word]) {
      if (made.has(word)) {
        say(`<b>${word.toLowerCase()}</b> 已经变出来啦！点<b>第一个格子里的字母</b>，换一个试试。`, { voice: "made-again" });
        return;
      }
      makeWord(word);
      return;
    }
    if (word === [...FIRST_WORD].reverse().join("")) {
      say(`读出来是 <b>${letters.join("-").toLowerCase()}</b> 呢！英语要<b>从左往右</b>读，把 ${WORD[0].toLowerCase()} 放到左边试试。`, { voice: "reversed", then: FIRST_WORD });
      return;
    }
    const firsts = [WORD[0], ...LATER].filter((l) => crystals[l].collected).map((l) => l.toLowerCase()).join("、");
    const [mid, last] = FAMILY.toLowerCase().split("");
    say(`<b>${letters.join("-").toLowerCase()}</b> 拼不成词哦。中间放 <b>${mid}</b>，最后放 <b>${last}</b>，第一个格子放 ${firsts} 试试。`, { voice: "not-word" });
  }

  // ---------- 拼出的词变成真的 ----------
  const made = new Set();
  function updateWordCount() {
    if (IS_LETTERS) {
      const learned = ORDER.filter((l) => crystals[l].collected).length;
      const total = Object.keys(WORDS).length;
      const stage = PLANET.practice ? practice.stage : 0;
      $("#chip-sub").textContent = PLANET.practice
        ? `${PLANET.code} · ${stage <= 1 ? `任务一 · 认识 ${LETTER.toUpperCase()} ${LETTER}` : stage === 2 || stage === 4 ? `回去找${PA.npcName||"奶奶"} · 领新任务` : stage === 3 ? `任务二 · ${PA.gameTitle||"字母苹果"} ${COURSE_GAME?[...made].filter(k=>k.startsWith("feed")||k.startsWith("gate")||k.startsWith("brick")||k.startsWith("step")).length:applesDone()}/5` : stage === 5 ? `任务三 · ${PA.TASKS?.[2].type==="blend"?((IS_I||IS_P)?"拼词和单词卡":"第一次拼词"):"单词卡"} ${wordsDone()}/${PA.WORD_CARDS.length}` : "三个任务都完成啦"}`
        : learned < ORDER.length
          ? `${PLANET.code} · 学会 ${learned}/${ORDER.length} 个字母`
          : `${PLANET.code} · 拼出 ${made.size}/${total} 个词`;
      return;
    }
    $("#chip-sub").textContent = `${PLANET.code} · ${PLANET.vowel} · 拼出 ${made.size}/${Object.keys(WORDS).length} 个词`;
  }

  async function makeWord(word) {
    state.spelling = true;
    state.selected = null;
    route = null;
    syncBag();
    const blocks = altar.slots.map((slot) => placed.get(slotLetter(slot)));
    await swipeBlend(blocks, word);
    playWord(word);
    say(`<b>${word.toLowerCase()}</b>！`);
    await wait(0.9);
    blocks.forEach((block) => {
      burst(block.position.clone(), LETTERS[block.userData.letter].color, 14, 0.8);
      block.material.emissiveIntensity = 0.15;
    });
    sfx.fanfare();
    made.add(word);
    updateWordCount();
    addStars(5, blocks[1].position.clone());
    await GIFTS[word].show(altar.slots[1].userData.dir.clone());
    state.spelling = false;

    if (made.size === Object.keys(WORDS).length) {
      state.done = true;
      save();
      for (const fp of farPlanets) if (fp.id && planetUnlocked(fp.id)) fp.base = 0.6;
      syncBag();
      await wait(1.6);
      sfx.magic();
      showDoneCard();
      return;
    }
    if (word === FIRST_WORD) {
      lightUpLater();
    } else {
      const left = Object.keys(WORDS).filter((w) => !made.has(w)).map((w) => w.toLowerCase());
      say(`还差 <b>${left.join("、")}</b>！再换一个字母试试。`, { voice: "still-left" });
    }
    syncBag();
  }

  // 拼出第一个词以后，远处亮起后面两块水晶
  function lightUpLater(animated = true) {
    for (const letter of LATER) {
      const crystal = crystals[letter];
      crystal.active = true;
      if (crystal.collected) continue;
      crystal.group.visible = true;
      obstacles.push({ dir: crystal.dir, r: 0.7, crystal: letter });
      if (animated) {
        tween(1.2, (k) => {
          crystal.beam.material.opacity = 0.55 * k;
          crystal.beam.scale.y = Math.max(0.01, ease(k));
        });
      }
    }
    if (altar.label) {
      altar.label.material.map.dispose();
      altar.label.material.map = YayaArtUI.createAltarLabel(THREE, `? ${FAMILY.toLowerCase().split("").join(" ")}`, "换第一个字母", { anisotropy: maxAnisotropy });
    }
    if (animated) {
      sfx.magic();
      const names = LATER.map((l) => `<b>${l.toLowerCase()}</b>`).join(" 和 ");
      say(`远处又亮起两道光：${names}！把它们找回来，换掉 ${WORD[0].toLowerCase()} 试试，看看会变出什么？`, { voice: "light-later" });
    }
  }

  // 拼出的词变成真的：show 播出现动画，restore 读存档 / 换星球时直接摆好
  const besidePlayer = () => moveAlong(player.dir, player.heading.clone().negate(), 1.3).normalize();
  const GIFTS = {
    cat: {
      async show(center) {
        const spot = moveAlong(center, tangent(player.dir.clone().sub(center), center), 1.0).normalize();
        summonPet(pets.cat, spot, true);
        setTimeout(sfx.meow, 600);
        playOnce(player, "emote-yes");
        say("你拼出了 <b>cat</b>，方方猫从字母里跳出来了！", { voice: "reward-cat" });
        await wait(2.6);
        pets.cat.dancing = false;
      },
      restore() {
        summonPet(pets.cat, besidePlayer(), false);
      },
    },
    hat: {
      async show() {
        const hat = makeHat();
        sfx.hatDrop();
        playOnce(player, "emote-yes");
        say("你拼出了 <b>hat</b>，一顶帽子戴到了你头上！", { voice: "reward-hat" });
        await tween(0.7, (k) => {
          hat.position.y = 1.52 + (1 - ease(k)) * 2.5;
          hat.rotation.y = (1 - k) * Math.PI * 2;
        });
        await wait(1.6);
      },
      restore() {
        makeHat();
      },
    },
    bat: {
      async show(center) {
        const bat = makeBat();
        bat.position.copy(center).multiplyScalar(surfaceRadius(center) + 0.8);
        batPet.obj = bat;
        batPet.from = bat.position.clone();
        batPet.arrive = 0;
        setTimeout(sfx.squeak, 500);
        playOnce(player, "emote-yes");
        say("你拼出了 <b>bat</b>，一只小蝙蝠飞出来，围着你转圈圈！", { voice: "reward-bat" });
        await wait(2.2);
      },
      restore() {
        batPet.obj = makeBat();
        batPet.arrive = 1;
      },
    },
    // hen：绒绒鸡跑出来，和方方猫一起跟着你
    hen: {
      async show(center) {
        const spot = moveAlong(center, tangent(player.dir.clone().sub(center), center), 1.0).normalize();
        summonPet(pets.chick, spot, true);
        setTimeout(sfx.chirp, 500);
        playOnce(player, "emote-yes");
        say("你拼出了 <b>hen</b>，一只绒绒鸡跑出来啦！", { voice: "reward-hen" });
        await wait(2.6);
        pets.chick.dancing = false;
      },
      restore() {
        summonPet(pets.chick, besidePlayer(), false);
      },
    },
    // pen：手里多了一支彩虹笔，走到哪里画到哪里
    pen: {
      async show() {
        const pen = makePen();
        pen.scale.setScalar(0.01);
        sfx.magic();
        playOnce(player, "emote-yes");
        say("你拼出了 <b>pen</b>，一支彩虹笔！你走到哪里，就画到哪里！", { voice: "reward-pen" });
        await tween(0.5, (k) => pen.scale.setScalar(Math.max(0.01, ease(k))));
        paint.active = true;
        await wait(2);
      },
      restore() {
        makePen();
        paint.active = true;
      },
    },
    // ten：十颗小星星一颗一颗跳出来，一起数，然后围着你转
    ten: {
      async show() {
        makeStars();
        playOnce(player, "emote-yes");
        await say("你拼出了 <b>ten</b>，十颗小星星！我们一起数一数！", { voice: "reward-ten" });
        for (let i = 1; i <= 10; i += 1) {
          starRing.shown = i;
          bell(523.25 * Math.pow(2, (i - 1) / 7), { gain: 0.1, decay: 0.6 });
          captionText.innerHTML = `<b>${Array.from({ length: i }, (_, n) => n + 1).join(" ")}</b>`;
          await wait(0.35);
        }
        playWord("ten");
        await wait(1.2);
      },
      restore() {
        makeStars();
        starRing.shown = 10;
      },
    },
  };

  // 方块礼帽，戴在角色头顶
  function makeHat() {
    player.obj.children.filter(o => o.userData.headwear).forEach(o => { o.visible = false; });
    const existing = player.obj.children.find(o => o.userData.headwear === "hat");
    if (existing) { existing.visible = true; return existing; }
    const hat = new THREE.Group();
    hat.userData.headwear = "hat";
    const part = (w, h, d, color, y) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
      mesh.position.y = y;
      mesh.castShadow = true;
      hat.add(mesh);
      return mesh;
    };
    part(0.78, 0.07, 0.78, "#3a3768", 0);
    part(0.5, 0.42, 0.5, "#3a3768", 0.24);
    part(0.52, 0.1, 0.52, "#f0b84d", 0.1);
    part(0.12, 0.12, 0.04, "#e0705f", 0.1).position.set(0.2, 0.1, 0.27);
    hat.position.y = 1.52;
    player.obj.add(hat);
    return hat;
  }

  // 方块小蝙蝠，翅膀在 updateBat 里扇动
  function makeBat() {
    const bat = new THREE.Group();
    const dark = new THREE.MeshLambertMaterial({ color: "#4b3f6b" });
    const wingMat = new THREE.MeshLambertMaterial({ color: "#6a5a94" });
    bat.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.26), dark));
    [-1, 1].forEach((side) => {
      const pivot = new THREE.Group();
      pivot.position.x = side * 0.15;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.24), wingMat);
      wing.position.x = side * 0.21;
      pivot.add(wing);
      pivot.userData.side = side;
      bat.add(pivot);
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.05), dark);
      ear.position.set(side * 0.09, 0.18, 0);
      bat.add(ear);
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: "#fff6c8" }));
      eye.position.set(side * 0.07, 0.04, 0.135);
      bat.add(eye);
    });
    bat.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(bat);
    return bat;
  }

  // 方块彩虹笔，拿在角色右手边
  function makePen() {
    const pen = new THREE.Group();
    ["#e0705f", "#f0b84d", "#62b85a", "#5fb0cf", "#9b7fe0"].forEach((color, i) => {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.14), new THREE.MeshLambertMaterial({ color }));
      band.position.y = i * 0.12;
      band.castShadow = true;
      pen.add(band);
    });
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), new THREE.MeshLambertMaterial({ color: "#3a3768" }));
    tip.position.y = -0.14;
    tip.rotation.x = Math.PI;
    pen.add(tip);
    pen.position.set(-0.42, 0.62, 0.12);
    pen.rotation.z = -0.35;
    player.obj.add(pen);
    return pen;
  }
  const paint = { active: false, timer: 0, hue: 0, dots: [], next: 0 };
  {
    const geo = new THREE.CircleGeometry(0.2, 10).rotateX(-Math.PI / 2);
    for (let i = 0; i < 90; i += 1) {
      const dot = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
      dot.visible = false;
      dot.userData.life = 0;
      scene.add(dot);
      paint.dots.push(dot);
    }
  }
  function updatePaint(dt) {
    for (const dot of paint.dots) {
      if (!dot.visible) continue;
      dot.userData.life -= dt;
      dot.material.opacity = Math.min(0.9, dot.userData.life / 3);
      if (dot.userData.life <= 0) dot.visible = false;
    }
    if (!paint.active || !route) return;
    paint.timer -= dt;
    if (paint.timer > 0) return;
    paint.timer = 0.14;
    paint.hue = (paint.hue + 0.07) % 1;
    const dot = paint.dots[paint.next];
    paint.next = (paint.next + 1) % paint.dots.length;
    const dir = player.dir.clone();
    dot.position.copy(dir).multiplyScalar(surfaceRadius(dir) + 0.05);
    dot.quaternion.setFromUnitVectors(UP0, dir);
    dot.material.color.setHSL(paint.hue, 0.75, 0.62);
    dot.userData.life = 9;
    dot.visible = true;
  }

  const starRing = { group: null, shown: 0 };
  function makeStars() {
    if (starRing.group) return;
    const group = new THREE.Group();
    const geo = new THREE.OctahedronGeometry(0.13);
    for (let i = 0; i < 10; i += 1) {
      const star = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.12 + (i % 3) * 0.03, 0.9, 0.65) }));
      star.visible = false;
      group.add(star);
    }
    scene.add(group);
    starRing.group = group;
  }
  function updateStars(time) {
    if (!starRing.group) return;
    const up = player.dir;
    const f = player.heading;
    const r = new V3().crossVectors(f, up).normalize();
    starRing.group.children.forEach((star, i) => {
      star.visible = i < starRing.shown;
      const a = time * 0.9 + (i / 10) * Math.PI * 2;
      star.position.copy(player.obj.position)
        .addScaledVector(up, 2.45 + Math.sin(time * 2.5 + i) * 0.08)
        .addScaledVector(f, Math.cos(a) * 0.75)
        .addScaledVector(r, Math.sin(a) * 0.75);
      star.rotation.y = time * 3 + i;
    });
  }

  const batPet = { obj: null, from: null, arrive: 1 };
  function updateBat(dt, time) {
    const bat = batPet.obj;
    if (!bat) return;
    const up = player.dir;
    const f = player.heading;
    const r = new V3().crossVectors(f, up).normalize();
    const angle = time * 1.6;
    const goal = player.obj.position.clone()
      .addScaledVector(up, 2.1 + Math.sin(time * 3) * 0.15)
      .addScaledVector(f, Math.cos(angle) * 1.2)
      .addScaledVector(r, Math.sin(angle) * 1.2);
    batPet.arrive = Math.min(1, batPet.arrive + dt / 1.2);
    const prev = bat.position.clone();
    if (batPet.arrive < 1) bat.position.lerpVectors(batPet.from, goal, ease(batPet.arrive));
    else bat.position.copy(goal);
    const move = bat.position.clone().sub(prev);
    orient(bat, up, move.lengthSq() > 1e-8 ? move : f);
    bat.children.forEach((c) => {
      if (c.userData.side) c.rotation.z = c.userData.side * Math.sin(time * 18) * 0.7;
    });
  }

  // ---------- 字母星球：认识它 → 跟着说 → 描一描 → 听出它，学完 6 个再拼词 ----------
  // 描一描的笔画：单位方框里的点（x 向右、y 向下），一个数组是一笔；只有一个点的是“点一下”
  const TRACE = {
    s: [[[0.7, 0.3], [0.6, 0.22], [0.45, 0.21], [0.33, 0.28], [0.33, 0.4], [0.46, 0.48], [0.6, 0.54], [0.69, 0.64], [0.66, 0.76], [0.53, 0.82], [0.38, 0.81], [0.29, 0.73]]],
    // 小写 a：从右上方起笔，逆时针画一个圆圆的肚子，再从上往下写一竖（圆滑的弧线，不是多边形）
    a: [Array.from({ length: 29 }, (_, i) => {
      const t = -0.72 - (i / 28) * (Math.PI * 2 - 1.44);
      return [0.5 + 0.17 * Math.cos(t), 0.575 + 0.23 * Math.sin(t)];
    }), [[0.67, 0.33], [0.67, 0.82]]],
    t: [[[0.5, 0.14], [0.5, 0.72], [0.55, 0.81], [0.66, 0.82]], [[0.33, 0.38], [0.67, 0.38]]],
    i: [[[0.5, 0.4], [0.5, 0.82]], [[0.5, 0.22]]],
    p: [[[0.36, 0.36], [0.36, 0.94]], [[0.36, 0.48], [0.45, 0.37], [0.58, 0.35], [0.68, 0.45], [0.69, 0.59], [0.6, 0.71], [0.46, 0.72], [0.36, 0.62]]],
    n: [[[0.34, 0.36], [0.34, 0.82]], [[0.34, 0.5], [0.43, 0.38], [0.56, 0.35], [0.65, 0.42], [0.66, 0.55], [0.66, 0.82]]],
  };
  Object.assign(TRACE, window.YAYA_TRACE_EXTENSIONS, YayaLetterCases.upperPaths);
  // 把折线按固定间距重新取点，方便判断“描到哪里了”
  function resampleStroke(points, step = 0.025) {
    if (points.length === 1) return points.map((pt) => pt.slice());
    const out = [points[0].slice()];
    for (let i = 1; i < points.length; i += 1) {
      const [ax, ay] = points[i - 1];
      const [bx, by] = points[i];
      const len = Math.hypot(bx - ax, by - ay);
      for (let d = step; d <= len; d += step) out.push([ax + ((bx - ax) * d) / len, ay + ((by - ay) * d) / len]);
    }
    out.push(points[points.length - 1].slice());
    return out;
  }

  const lessonEl = $("#lesson");
  const lesson = { active: false, letter: null, traceCase: null, completedCases: [] };
  function setLessonStep(step) {
    lessonEl.querySelectorAll(".lesson-steps i").forEach((dot, i) => dot.classList.toggle("is-on", i < step));
    lessonEl.dataset.step = String(step);
  }

  // 描一描：手指沿着发光的线走；描完所有笔画就完成。手指离开再按下，会从刚才描到的地方继续
  // guide：full 宽底线 + 白色虚线；dots 只有一串小圆点；start 只有很淡的影子和起点（自己写）
  function traceLetter(letter, { guide = "full" } = {}) {
    return YayaTrace.run({canvas: $("#lesson-trace"), strokes: TRACE[letter].map(st => resampleStroke(st)), color: LETTERS[letter.toLowerCase()].color, guide,
      pop: () => sfx.pop(), next: dot => say(dot ? "再点一下上面的小圆点。" : "真棒！再描下一笔。", {voice: dot ? "l-dot" : "l-stroke-next", interrupt:true}),
      hint: () => say("从亮亮的圆点开始，沿着线描。", {voice:"l-trace-hint"})});
  }

  async function traceBothCases(letter) {
    lesson.completedCases = [];
    const badges = [...$("#trace-case-label").querySelectorAll("[data-trace-case]")];
    await YayaLetterCases.traceBoth(letter, {
      trace: traceLetter,
      setCase(form, glyph, index) {
        // 描之前先说清楚：这是大写 / 这是小写
        say(form === "upper" ? `这是<b>大写 ${glyph}</b>，描一描它。` : `这是<b>小写 ${glyph}</b>，描一描它。`, { voice: form === "upper" ? "case-upper" : "case-lower" });
        lesson.traceCase = form;
        lessonEl.dataset.traceCase = form;
        $("#lesson-trace").setAttribute("aria-label", `描写${form === "upper" ? "大写" : "小写"}字母 ${glyph}，第 ${index + 1} 项，共 2 项`);
        badges.forEach((badge, i) => {
          badge.classList.toggle("is-current", i === index);
          badge.classList.toggle("is-done", i < index);
          const label = i === 0 ? "大写" : "小写";
          const char = i === 0 ? letter.toUpperCase() : letter;
          badge.textContent = `${label} ${char}${i < index ? " ✓" : ` · ${i + 1}/2`}`;
        });
      },
      onCaseDone(form, index) {
        lesson.completedCases.push(form);
        badges[index].classList.remove("is-current");
        badges[index].classList.add("is-done");
        badges[index].textContent = `${form === "upper" ? "大写" : "小写"} ${form === "upper" ? letter.toUpperCase() : letter} ✓`;
      },
    });
  }

  // 听出它：目标字母 + 两个别的字母的声音，方块上不写字母，只能靠耳朵
  function makeLetterQuiz(letter) {
    if(LARGE_WORLD && PLANET.id==="a01") return {type:"letter",audio:`ls-${letter}`,answer:letter,question:`找一找，哪个水晶发出 <b>/${PLANET.vowel.replaceAll('/','')}/</b> 的声音？`,choices:['a','b','c'].map(l=>({value:l,label:l.toUpperCase(),note:'走近听听',audio:`ls-${l}`}))};
    const differentSound = l => soundGroup(l) !== soundGroup(letter);
    const learned = ORDER.filter((l) => differentSound(l) && crystals[l].collected);
    const others = ORDER.filter((l) => differentSound(l) && !learned.includes(l));
    // 一颗星球只学一个字母时，另外两个声音从 quizOthers 里挑（只用来比一比，不用认识）
    const extra = (PLANET.quizOthers || []).filter((l) => differentSound(l) && !ORDER.includes(l)).sort(() => Math.random() - 0.5);
    const pool = [...learned.sort(() => Math.random() - 0.5), ...others.sort(() => Math.random() - 0.5), ...extra];
    const options = [letter, ...pool.slice(0, 2)].sort(() => Math.random() - 0.5);
    return {
      type: "letter",
      audio: `ls-${letter}`,
      answer: letter,
      question: `哪个是 <b>${letter}</b> 的声音？`,
      choices: options.map((l) => ({ value: l, label: "", note: "点我听听", audio: `ls-${l}` })),
    };
  }

  async function runLesson(letter) {
    if (lesson.active) return;
    lesson.active = true;
    lesson.letter = letter;
    route = null;
    const crystal = crystals[letter];
    player.heading.copy(tangent(crystal.dir.clone().sub(player.dir), player.dir));
    const [word, emoji] = PLANET.keywords[letter];
    const big = $("#lesson-letter");
    YayaLetterCases.showPair(big, letter, LETTERS[letter].color);
    lesson.traceCase = null;
    lesson.completedCases = [];
    $("#lesson-emoji").textContent = emoji;
    $("#lesson-word").textContent = word;
    delete lessonEl.dataset.mode;
    lessonEl.hidden = false;
    lessonEl.classList.remove("show-keyword", "show-say", "show-trace", "is-listening");
    sfx.magic();

    // 1 认识它
    setLessonStep(1);
    await say(`你好！我是 <b>${letter}</b>。`, { voice: "l-meet" });
    await waitForSpeechIdle();
    if (PLANET.practice && hasLetterName(letter)) await playWord(`name-${letter}`);
    await waitForSpeechIdle();
    if (PLANET.practice) await wait(0.5);
    // 一颗星球一个字母：先认识它的两种样子（大写、小写），再听声音
    if (PLANET.practice) await meetBothCases(letter);
    await say("听，我的声音是——", { voice: "l-sound" });
    await playWord(`ls-${letter}`);
    await wait(PLANET.practice ? 0.5 : 0.25);
    await playWord(`ls-${letter}`);
    if (PLANET.practice) await wait(0.4);
    lessonEl.classList.add("show-keyword");
    await say(`就像这个词：<b>${word}</b>`, { voice: "l-like" });
    await playWord(word);
    await wait(PLANET.practice ? 0.8 : 0.4);

    // 2 跟着说（不打分，只为了开口）
    setLessonStep(2);
    lessonEl.classList.add("show-say");
    await say("跟我一起说！", { voice: "l-say" });
    await playWord(`ls-${letter}`);
    lessonEl.classList.add("is-listening");
    await wait(2.6);
    await waitForSpeechIdle();
    lessonEl.classList.remove("is-listening");
    await say("我们继续吧。", { voice: "l-continue" });

    // 3 描一描
    setLessonStep(3);
    lessonEl.classList.remove("show-keyword", "show-say");
    lessonEl.classList.add("show-trace");
    say("用手指，描一描我。", { voice: "l-trace" });
    say("从亮亮的<b>绿色圆点</b>开始，沿着线描。", { voice: "l-trace-hint" });
    await traceBothCases(letter);
    sfx.sparkle();
    playWord(`ls-${letter}`);
    await say("描好啦，真漂亮！", { voice: "l-traced" });

    // 4 听出它：回到星球上答题
    setLessonStep(4);
    lessonEl.hidden = true;
    lesson.active = false;
    crystal.lessonDone = true;
    CHALLENGES[letter] = makeLetterQuiz(letter);
    startChallenge(letter);
  }
  // 大写像一座尖尖的小帐篷，小写像圆圆的苹果靠着一根小棍；两个是同一个字母、同一个声音
  async function meetBothCases(letter) {
    const forms = [...$("#lesson-letter").querySelectorAll(".lesson-form")];
    const focus = (i) => forms.forEach((f, k) => {
      f.classList.toggle("is-focus", i === k || i === "both");
      f.classList.toggle("is-dim", i !== "both" && i !== k);
    });
    // 节奏放慢：每次放大先停一下让孩子看清，再开口；说完再停一会儿才换下一个
    await say("我有<b>两种样子</b>。", { voice: "a01-two" });
    await wait(0.5);
    await waitForSpeechIdle();
    focus(0);
    sfx.pop();
    await wait(0.6);
    await sayCaseWithName(`这是<b>大写 ${letter.toUpperCase()}</b>，${PA.metaphors?.[0]||"像一座尖尖的小帐篷"}。`, PA.metaphors?PLANET.id+"-big":"a01-big", letter);
    await wait(1.0);
    await waitForSpeechIdle();
    focus(1);
    sfx.pop();
    await wait(0.6);
    await sayCaseWithName(`这是<b>小写 ${letter}</b>，${PA.metaphors?.[1]||"像一个圆圆的苹果，旁边靠着一根小棍"}。`, PA.metaphors?PLANET.id+"-small":"a01-small", letter);
    await wait(1.0);
    await waitForSpeechIdle();
    focus("both");
    bell(LETTERS[letter].freq, { gain: 0.1, decay: 0.8 });
    await wait(0.6);
    await say("大写和小写，是<b>同一个字母</b>，声音也一样：", { voice: "a01-same" });
    await wait(0.3);
    await playWord(`ls-${letter}`);
    await wait(0.9);
    await waitForSpeechIdle();
    forms.forEach((f) => f.classList.remove("is-focus", "is-dim"));
    await wait(0.4);
  }
  // 点课上的大写 / 小写字母卡：说“这是大写 S，像……”，再播一下声音
  document.querySelectorAll("#lesson-letter .lesson-form").forEach((el, i) => el.addEventListener("click", () => {
    if (!lesson.letter) return;
    const l = lesson.letter;
    if (lessonEl.dataset.step === "1") document.querySelectorAll("#lesson-letter .lesson-form").forEach((f, k) => {
      f.classList.toggle("is-focus", k === i); f.classList.toggle("is-dim", k !== i);
    });
    el.classList.remove("is-tapped"); void el.offsetWidth; el.classList.add("is-tapped");
    sayCaseWithName(i === 0 ? `这是<b>大写 ${l.toUpperCase()}</b>，${PA.metaphors?.[0] || "像一座尖尖的小帐篷"}。` : `这是<b>小写 ${l}</b>，${PA.metaphors?.[1] || "像一个圆圆的苹果，旁边靠着一根小棍"}。`,
      PA.metaphors ? PLANET.id + (i === 0 ? "-big" : "-small") : (i === 0 ? "a01-big" : "a01-small"), l, { interrupt: true, phoneme: true });
  }));
  $("#lesson-replay").addEventListener("click", () => {
    if (!lesson.letter) return;
    const [word] = PLANET.keywords[lesson.letter];
    hear(`ls-${lesson.letter}`);
    playWord(word);
  });

  // 学会的字母住进石台：台面后排一排小方块，点它能听声音
  const shelf = new Map();
  function placeShelfBlock(letter, animated) {
    if (shelf.has(letter) || !IS_LETTERS) return;
    const i = ORDER.indexOf(letter);
    const size = PLANET.practice ? 0.82 : 0.44;
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshLambertMaterial({ map: letterTextures[letter], emissive: new THREE.Color(LETTERS[letter].color), emissiveIntensity: 0.2 }),
    );
    block.castShadow = true;
    if (PLANET.practice) block.position.set(0, STAGE.top + size / 2 + 0.02, 0);
    else block.position.set(-1.75 + i * 0.7, STAGE.top + 0.24, -0.6);
    block.userData = { kind: "shelf", letter };
    STAGE.group.add(block);
    shelf.set(letter, block);
    if (animated) {
      block.scale.setScalar(0.01);
      tween(0.5, (k) => block.scale.setScalar(Math.max(0.01, ease(k) + Math.sin(k * Math.PI) * 0.3)));
      bell(LETTERS[letter].freq, { gain: 0.1, decay: 0.8 });
    }
  }

  function activateLetter(letter, animated) {
    const crystal = crystals[letter];
    if (crystal.active) return;
    crystal.active = true;
    crystal.group.visible = true;
    obstacles.push({ dir: crystal.dir, r: 0.7, crystal: letter });
    if (animated) {
      sfx.magic();
      tween(1.2, (k) => {
        crystal.beam.material.opacity = 0.55 * k;
        crystal.beam.scale.y = Math.max(0.01, ease(k));
      });
    }
    syncBag();
  }

  async function learnedLetter(letter) {
    placeShelfBlock(letter, true);
    addStars(3, shelf.get(letter).getWorldPosition(new V3()));
    updateWallBadge();
    const btn = $("#wall-open");
    btn.classList.remove("is-new");
    void btn.offsetWidth;
    btn.classList.add("is-new");
    updateWordCount();
    syncBag();
    save();
    const learned = ORDER.filter((l) => crystals[l].collected).length;
    const next = ORDER.find((l) => !crystals[l].collected);
    await say(`<b>${letter}</b> 住进石台啦！`, { voice: "l-home" });
    if (learned === 1) await say("点背包里的字母，就能听到它的声音。", { voice: "l-bag-sound" });
    if (!next && PLANET.practice) {
      startPractice(true);
      return;
    }
    if (next) {
      activateLetter(next, true);
      if (learned === 3) say("已经学会三个啦！累了可以休息一下哦。", { voice: "l-rest" });
      else say("跟着金色光点，去找下一个字母。", { voice: "l-next" });
    } else {
      enterBlend(false);
    }
  }

  // ---------- 苹果星球：刺猬奶奶的三个任务 ----------
  // stage：0 去找奶奶 → 1 认识 A a → 2 回奶奶那里 → 3 摘五个字母苹果 → 4 回奶奶那里 → 5 单词野餐 → 6 完成
  // 描字母的提示多少看第几次描，不看是哪棵树：完整虚线 → 只有圆点 → 只有起点、大小写一起写
  const PA = COURSE;
  const COURSE_GAME = PA.TASKS?.[1].type !== "apples";
  const practice = { active: false, busy: false, stage: 0, stations: [], cheer: 0 };
  const practiceGlow = PLANET.practice ? YayaPlanetA.glowTex(THREE) : null;
  const applesDone = () => practice.stations.filter((st) => st.done).length;
  const wordsDone = () => (PA ? PA.WORD_CARDS.filter((w) => made.has(w.id)).length : 0);
  const TASK1 = "任务一：跟着<b>金色光点</b>，找到发光的水晶，认识新字母！";
  const GO_GRANDMA = "回到<b>奶奶</b>那里，看看她还要你帮什么忙。";
  const MORE_APPLES = "跟着<b>金色光点</b>，去摘下一个字母苹果。";

  // 奶奶的头像：把奶奶的模型单独渲染成一张小图，她说话时放在字幕气泡里
  function grandmaPortrait(source = orchard.granny.root) {
    const size = 160;
    const rt = new THREE.WebGLRenderTarget(size, size);
    rt.texture.encoding = THREE.sRGBEncoding;
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xfff6ea, 0xc9a98f, 1.25));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(1.2, 2, 3);
    sc.add(key);
    const copy = source.clone(true);
    // 头像用自己的材质：场景里的“靠近镜头变透明”会把 2.4 米外的头像相机也当成太近
    copy.traverse((o) => { if (o.material) { o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone(); for (const m of [].concat(o.material)) { m.onBeforeCompile = () => {}; m.customProgramCacheKey = () => "portrait"; } } });
    copy.position.set(0, 0, 0);
    copy.quaternion.identity();
    if (PLANET.id === "i01" || IS_P) copy.scale.copy(source.scale); else copy.scale.setScalar(1);
    sc.add(copy);
    const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 20);
    cam.position.set(0.28, 1.0, 2.3);
    if (PLANET.id === "i01") { cam.position.set(.2,1.3,3.0);cam.lookAt(0,1.2,0); } else if (IS_P) { const ratio=source.scale.x/orchard.granny.root.scale.x;cam.position.set(.25,1.45,3.6).multiplyScalar(ratio);cam.lookAt(0,1.3*ratio,0); } else cam.lookAt(0, 0.86, 0);
    const prevColor = renderer.getClearColor(new THREE.Color());
    const prevAlpha = renderer.getClearAlpha();
    renderer.setRenderTarget(rt);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(sc, cam);
    const px = new Uint8Array(size * size * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, size, size, px);
    renderer.setRenderTarget(null);
    renderer.setClearColor(prevColor, prevAlpha);
    rt.dispose();
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const img = g.createImageData(size, size);
    for (let y = 0; y < size; y += 1) img.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
    g.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function buildStations() {
    if (practice.stations.length || !orchard) return;
    const rnd = mulberry32(PLANET.seed + 5);
    for (const def of PA.STATIONS) {
      const dir = dirFrom(...def.spot);
      const tree = YayaPlanetA.letterTree(THREE, rnd);
      if(LARGE_WORLD)tree.root.scale.setScalar(1.4);
      tree.root.userData = { kind: "station", station: def.id };
      const ring = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({
        map: practiceGlow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      ring.position.y = 0.05;
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 18, 12, 1, true), new THREE.MeshBasicMaterial({
        color: "#ffd56e", alphaMap: beamAlpha, transparent: true, opacity: 0.3,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      }));
      beam.position.y = 9.6;
      beam.userData.isBeam = true;
      tree.root.add(ring, beam);
      placeOnSurface(tree.root, dir, tangent(STAGE.center.clone().sub(dir), dir));
      scene.add(tree.root);
      obstacles.push({ dir, r: LARGE_WORLD?.9:.75,kind:"apple-tree" });
      practice.stations.push({ def, dir, ...tree, ring, beam, done: false, hangY: tree.hang.position.y });
    }
  }
  // 任务二开始以前，字母苹果挂在树上但不发光；摘下来以后树上就空了
  function setAppleState(st) {
    st.ring.visible = st.beam.visible = practice.stage === 3 && !st.done;
    st.hang.visible = !st.done;
  }
  function addBasketApple(animated) {
    const b = orchard.basket;
    const slot = b.slots[Math.min(b.apples.length, b.slots.length - 1)];
    const fruit = YayaPlanetA.apple(THREE, 0.11);
    fruit.position.set(...slot);
    fruit.rotation.set(rng(), rng() * 6, rng() * 0.5);
    b.group.add(fruit);
    b.apples.push(fruit);
    if (animated) {
      fruit.scale.setScalar(0.01);
      tween(0.4, (k) => fruit.scale.setScalar(Math.max(0.01, ease(k) + Math.sin(k * Math.PI) * 0.35)));
    }
  }
  // 苹果从树下飞起，划一道弧线落进奶奶的篮子
  async function flyApple(from) {
    const fruit = YayaPlanetA.apple(THREE, 0.2);
    scene.add(fruit);
    const to = orchard.basket.group.localToWorld(new V3(0, 0.45, 0));
    const lift = from.clone().add(to).multiplyScalar(0.5).normalize().multiplyScalar(Math.max(from.length(), to.length()) + 4);
    sfx.whoosh();
    await tween(1.3, (k) => {
      const e = ease(k);
      const a = from.clone().lerp(lift, e);
      const b = lift.clone().lerp(to, e);
      fruit.position.copy(a.lerp(b, e));
      fruit.rotation.y = k * 9;
      fruit.scale.setScalar(1 - k * 0.45);
    });
    scene.remove(fruit);
    sfx.pop();
    bell(880, { gain: 0.1, decay: 0.7 });
    addBasketApple(true);
    practice.cheer = 1.4;
  }
  // 描好以后，大苹果从树枝上掉下来，在草地上弹两下
  async function dropApple(st) {
    sfx.boing();
    const top = st.hangY;
    await tween(0.75, (k) => {
      const fall = k < 0.6 ? (k / 0.6) ** 2 : 1;
      const bounce = k < 0.6 ? 0 : Math.abs(Math.sin(((k - 0.6) / 0.4) * Math.PI * 2)) * (1 - k) * 0.6;
      st.hang.position.y = top + (0.36 - top) * fall + bounce;
      st.hang.rotation.z = k * 0.6;
    });
    sfx.pop();
  }

  function practiceTargets() {
    if (!orchard) return [];
    return [...practice.stations.map((st) => st.root), orchard.granny.root];
  }
  const grandmaDir = () => orchard.granny.root.position.clone().normalize();
  function practiceTarget() {
    const stage = practice.stage;
    if ([0, 2, 4, 5].includes(stage)) {
      return { dir: grandmaDir(), pos: orchard.granny.root.localToWorld(new V3(0, 1.3, 0)), letter: LETTER, stop: 1.5 };
    }
    if (stage !== 3) return null;
    if(COURSE_GAME)return {dir:grandmaDir(),pos:orchard.granny.root.localToWorld(new V3(0,1.3,0)),letter:LETTER,stop:1.5};
    let best = null;
    for (const st of practice.stations) {
      if (st.done) continue;
      if (!best || arc(player.dir, st.dir) < arc(player.dir, best.dir)) best = st;
    }
    return best ? { dir: best.dir, pos: best.big.getWorldPosition(new V3()), letter: LETTER, stop: 1.9 } : null;
  }

  // ---------- 和奶奶说话、领任务 ----------
  const G = (html, voice, then = null) => ({ html, voice, then });
  function faceGrandma() {
    player.heading.copy(tangent(grandmaDir().sub(player.dir), player.dir));
    // 镜头斜一点：奶奶站在角色旁边，不会被角色挡住
    camFwdTarget = player.heading.clone().applyAxisAngle(player.dir, 0.6);
  }
  async function grandmaTalk(lines) {
    route = null;
    faceGrandma();
    for (const line of lines) {
      practice.cheer = 0.7;
      await say(line.html, { voice: line.voice, then: line.then, speaker: "grandma" });
      await wait(0.2);
    }
  }
  const taskEl = $("#task-card");
  function showTask(n, icon, title, line, voice) {
    return new Promise((resolve) => {
      $("#task-num").textContent = `任务${"一二三"[n - 1]}`;
      $("#task-icon").textContent = icon;
      $("#task-title").innerHTML = title;
      taskEl.hidden = false;
      sfx.magic();
      say(line, { voice, replay: true });
      const go = $("#task-go");
      const done = () => {
        go.removeEventListener("click", done);
        taskEl.hidden = true;
        lastInput = performance.now();
        sfx.pop();
        resolve();
      };
      go.addEventListener("click", done);
    });
  }
  function grandmaTap() {
    if (practice.busy || lesson.active) return;
    sfx.bubble();
    practice.cheer = 0.8;
    showMarker(orchard.granny.root.position);
    routeTo(grandmaDir(), 1.35, grandmaTurn);
  }

  async function courseTurn(){
    if(practice.busy||lesson.active)return;practice.busy=true;route=null;
    const stage=practice.stage,task=PA.TASKS[stage<=1?0:stage<=3?1:2];
    try{
      if([0,2,4].includes(stage)){
        await grandmaTalk(task.lines.map(([html,voice,then])=>G(html,voice,then)));
        await showTask(stage/2+1,task.icon,task.title,window.YAYA_VOICE_LINES[task.voice]||task.title,task.voice);
        practice.stage=stage+1;
        if(task.type==='lesson'){if(pGame&&!pGame.popDone()){pGame.startPop();}else if(iGame&&!iGame.iceDone()){iGame.startIce();}else if(sShards&&!sShards.done()){sShards.start();say('沙地里藏着三块会唱歌的小水晶，它们都在唱这个声音。看到天上的光柱了吗？去找找吧！',{voice:'s01-shard-go',speaker:'grandma',then:'ls-s'});}else activateLetter(LETTER,true);}
        if(task.type==='apples'){for(const st of practice.stations){setAppleState(st);st.ring.scale.setScalar(.01);tween(.8,k=>st.ring.scale.setScalar(Math.max(.01,ease(k))))}say(MORE_APPLES,{voice:'a01-more2',replay:true});}
        save();updateWordCount();
      }else if(stage===1){say(window.YAYA_VOICE_LINES[task.voice]||task.title,{voice:task.voice,replay:true});}
      else if(stage===3&&task.type==='apples'){say(MORE_APPLES,{voice:'a01-more2',replay:true});}
      else if(stage===6){say('谢谢你，我的好朋友！',{voice:'r2-thanks',speaker:'grandma'});}
    }finally{practice.busy=false}
    if(practice.stage===3&&task.type!=='apples')runCourseGame();else if(practice.stage===5){if(task.type==='blend')runCourseBlend();else runWords();}
  }
  async function courseTrace(index,forms=null){
    const cases=forms||[index%2?'lower':'upper'],guide=index<2?'full':index<4?'dots':'start';
    openPracticeCard({mode:'practice',icon:PA.gameIcon,title:PA.gameTitle,total:5,done:index,cases});
    for(const form of cases){setPracticeCase(form);const tracing=traceLetter(form==='upper'?LETTER.toUpperCase():LETTER,{guide});say(form==='upper'?'描一描这个大写字母吧。':'描一描这个小写字母吧。',{voice:'r2-'+form});await tracing;markPracticeCase(form);sfx.pop();await wait(.2)}
    closePracticeCard();
  }
  let courseBlendResolve=null;
  async function runIslandRace(){if(tRace)return runTRace();return YayaGames.race({THREE,gates:PA.GATES,done:i=>made.has('gate'+i),sound:hear,onGate:async(c,i,correct)=>{if(correct){sfx.magic();unicornGuide.cheer()}else await say('慢一点没有关系，再听听这个声音。',{voice:'t01-wrong'});await playWord(c.word);await say(`就是<b>${c.zh}</b>。`,{voice:'meaning-'+c.word});if(!made.has('gate'+i)){made.add('gate'+i);addStars(correct?2:1);save()}},onFinish:async()=>{habitat.complete();sfx.fanfare();await say('我们赢啦！雨停了，彩虹出来了！',{voice:'t01-g4',speaker:'grandma'});await courseTrace(0,['upper','lower']);}})}
  // T：陪托托在星球上赛跑；5 个岔口，每个岔口两道拱门，孩子点 /t/ 开头的那道（没有 T 世界时回退到上面的平面小游戏）
  async function runTRace(){
    if(orchard)orchard.granny.root.visible=false;
    try{
      if(!PA.GATES.some((c,i)=>made.has('gate'+i)))await say('我们出发啦！到了岔口，听听两道门的名字，选我声音开头的那道门！',{voice:'t01-race-go',speaker:'grandma'});
      return await tRace.play({gates:PA.GATES,done:i=>made.has('gate'+i),sound:hear,say:(h,o)=>say(h,o),
        onWrong:()=>say('慢一点没有关系，再听听这个声音。',{voice:'t01-wrong',speaker:'grandma'}),
        onGate:async(c,i,firstTry)=>{if(!made.has('gate'+i)){made.add('gate'+i);addStars(firstTry?2:1);save()}sfx.magic();unicornGuide.cheer();await playWord('ls-t');await playWord(c.word);await say(`就是<b>${c.zh}</b>。`,{voice:'meaning-'+c.word,speaker:'grandma'})},
        onFinish:async()=>{habitat.complete();sfx.fanfare();await say('我们赢啦！雨停了，彩虹出来了！',{voice:'t01-g4',speaker:'grandma'});await round3.turtle.wake?.();await say('看，大海龟驮着我们的小岛，在大海上游起来啦！',{voice:'t01-swim',speaker:'grandma'});if(!window.__skipTrace)await courseTrace(0,['upper','lower'])}});
    }finally{if(orchard)orchard.granny.root.visible=true}
  }
  async function runCourseBlend(){
    if(practice.busy||lesson.active)return;practice.busy=true;blend.active=true;route=null;
    for(const b of shelf.values())b.visible=false;
    for(const card of PA.WORD_CARDS){if(made.has(card.id))continue;await new Promise(resolve=>{courseBlendResolve=resolve;startBlendWord(card.word)})}
    blend.active=false;practice.busy=false;if(PA.TRACE_WORDS)runWords();else finishPractice();
  }
  async function finishCourseBlend(word){
    const blocks=STAGE.slotDirs.slice(0,word.length).map(d=>[...placed.values()].find(b=>arc(b.userData.dir,d)<.45));
    await swipeBlend(blocks,word);const card=PA.WORD_CARDS.find(c=>c.word===word);
    blocks.forEach(b=>burst(b.position.clone(),LETTERS[b.userData.letter].color,10,.8));
    await say(`就是<b>${card.zh}</b>。`,{voice:'meaning-'+word});
    if(IS_P && word==='tap'){round3.machine.tapFlow(3.5);round3.machine.tapTap();await say(YAYA_VOICE_LINES['p01-tap'],{voice:'p01-tap',speaker:'grandma'});}
    if(!made.has(card.id)){made.add(card.id);addStars(5);save()}
    state.spelling=false;blend.word=null;blend.waiting=false;updateWordCount();
    for(const letter of [...placed.keys()])returnToBag(letter);await wait(1);
    const resolve=courseBlendResolve;courseBlendResolve=null;resolve?.();
  }
  async function runCourseGame(){
    if(practice.busy||lesson.active)return;practice.busy=true;route=null;
    let complete=false;
    try{
      if(PA.TASKS[1].type==='snake'&&snakeRide)complete=await runSnakeRide();
      else if(PA.TASKS[1].type==='snake')complete=await YayaGames.snake({THREE,cards:PA.WORD_CARDS,done:c=>made.has('feed'+PA.WORD_CARDS.findIndex(w=>w.word===c.word)),sound:hear,wrong:()=>say('这个不是这个声音开头的哦，再试试吧。',{voice:'s01-wrong'}),onEat:async(c,i)=>{sfx.magic();await playWord('ls-s');await playWord(c.word);await say(`就是<b>${c.zh}</b>。`,{voice:'meaning-'+c.word});await courseTrace(i);made.add('feed'+i);addStars(2);save();updateWordCount();}});
      else if(IS_I)complete=await iGame.play();
      else if(IS_P)complete=await pGame.play();
      else complete=await runIslandRace();
      if(complete){practice.stage=4;save();updateWordCount();say(PLANET.id==='s01'?'快回去找你的<b>小蛇朋友</b>，领下一个任务吧！':`回去找<b>${PA.npcName}</b>，领新任务吧。`,{voice:IS_P?'p01-go-npc':IS_I?'i01-go-npc':PLANET.id==='s01'?'s01-go-npc':'r2-go-npc'});}
    }finally{practice.busy=false;lastInput=performance.now()}
  }

  // S：孩子直接当小蛇嘶嘶，在星球上爬过去吃 /s/ 开头的食物，吃完盘成大 S
  async function runSnakeRide(){
    const feedId=c=>'feed'+PA.WORD_CARDS.findIndex(w=>w.word===c.word);
    if(orchard)orchard.granny.root.visible=false;
    try{
      await say('点一点沙地，我就爬过去。靠近食物会听到它的名字，只吃这个声音开头的哦！',{voice:'s01-ride',speaker:'grandma'});
      await playWord('ls-s');
      return await snakeRide.play({cards:PA.WORD_CARDS,camFwd:()=>camFwd,done:c=>made.has(feedId(c)),sound:hear,
        wrong:()=>say('呸呸，这个不是这个声音开头的，再找找吧。',{voice:'s01-spit',speaker:'grandma'}),
        onEat:async(c,i)=>{sfx.magic();unicornGuide.cheer();await playWord('ls-s');await playWord(c.word);await say(`就是<b>${c.zh}</b>。`,{voice:'meaning-'+c.word});if(!window.__skipTrace)await courseTrace(i);made.add(feedId(c));addStars(2);save();updateWordCount();if(i<PA.WORD_CARDS.length-1)say('我又变长了一截！还想吃，再找找吧。',{voice:'s01-grow',speaker:'grandma'});},
        onTapS:async(tapped)=>{await say('我吃饱啦，身子变得好长好长！看，我盘成了这个字母的样子！',{voice:'s01-coil',speaker:'grandma'});
          say('点一点我盘成的大字母，听听它的声音！',{voice:'s01-tap-s',speaker:'grandma',replay:true});
          const ok=await tapped;sfx.magic();await playWord('ls-s');if(ok===true)await say('对啦，这就是它的声音！',{voice:'s01-tap-yes',speaker:'grandma'});await playWord('ls-s');},
        onCoil:async()=>{await wait(.4);
          // 大沙蛇被叫醒：镜头转过去，身子一浪一浪地动，翻个身睁开眼；天慢慢变成傍晚，星星亮起来
          const big=round3?.snake;
          if(big?.wake){const hp=big.head.group.getWorldPosition(new THREE.Vector3());camFwdTarget=tangent(hp.clone().normalize().sub(player.dir),player.dir);camShot={lift:.75,zoom:2.3,ahead:0,focus:player.obj.position.clone().lerp(hp,.55)};
            habitat?.complete();sfx.whoosh();const waking=big.wake();setTimeout(()=>{sfx.fanfare();unicornGuide.cheer()},3600);await waking;
            await say('大沙蛇也醒啦，还翻了个身！天黑了，沙漠的星星亮起来啦！',{voice:'s01-wake',speaker:'grandma'});await wait(1.2);}
          else await wait(1.2);}});
    }finally{if(orchard)orchard.granny.root.visible=true}
  }

  // Every planet reads the same task-list schema; each activity keeps its own controller.
  async function grandmaTurn() { return courseTurn(); }

  // 学会 a 以后（learnedLetter 调用）：回去找奶奶领下一个任务
  function startPractice(animated) {
    if (!orchard || !animated) return;
    practice.stage = 2;
    save();
    updateWordCount();
    say(COURSE_GAME?(PLANET.id==='s01'?'快回去找你的<b>小蛇朋友</b>，领下一个任务吧！':`回去找<b>${PA.npcName}</b>，领新任务吧。`):GO_GRANDMA, { voice: COURSE_GAME?(IS_P?"p01-go-npc":IS_I?"i01-go-npc":PLANET.id==="s01"?"s01-go-npc":"r2-go-npc"):"a01-go-grandma", replay: true });
  }
  // 读档以后摆好任务进度：苹果挂在哪、篮子里有几个、水晶亮不亮
  function initPractice(data) {
    if (!orchard) return;
    practice.active = true;
    try {
      speakers.grandma = { src: grandmaPortrait() };
    } catch (error) {
      speakers.grandma = speakers.guide;
    }
    if(IS_P) speakers.tangtang = {src:grandmaPortrait(round3.island.tangtang.root),name:'糖糖'};
    buildStations();
    let stage = data && Number.isInteger(data.quest) ? data.quest : 0;
    if (crystals[LETTER].collected && stage < 2) stage = 2;
    if (state.done) stage = 6;
    if (PLANET.id === "i01" && (state.done || stage >= 6 || made.has("i-finale"))) round3?.setNight?.(true);   // I：读档时 state.done 在 startPractice 之后才设，按进度判断
    practice.stage = stage;
    if(IS_P){
      if(stage>=4 || readStore('yaya-p-activity')?.rescued)round3.returnHome?.();
      if(state.done || stage>=6 || made.has('p-finale'))round3.setFixed({immediate:true});
      if(stage>=5)for(const b of shelf.values())b.visible=false;
      if(stage===1&&!pGame.popDone())pGame.startPop();
    }
    if(IS_I){round3.setHouse([0,1,2,3,4].filter(i=>made.has("brick"+i)).length);if(stage>=5)for(const b of shelf.values())b.visible=false;if(stage===1&&!iGame.iceDone())iGame.startIce();}
    for (const st of practice.stations) {
      st.done = made.has(st.def.id);
      setAppleState(st);
    }
    while (orchard.basket.apples.length < applesDone()) addBasketApple(false);
    if (PLANET.id === "t01" && (stage >= 6 || (PA.TASKS?.[1].type === "race" && stage >= 4))) round3?.setDry?.();   // T：读档直接是雨后、彩虹已出现、大海龟醒着
    if (stage >= 6) {orchard.pie.visible = true;habitat?.complete();}
    if(PA.TASKS?.[1].type==="race"&&stage>=4)habitat?.complete();
    if(PA.TASKS?.[1].type==="snake"&&stage>=4){habitat?.complete();round3?.snake?.wake?.(true);}
    if (stage === 0) {
      const c = crystals[LETTER];
      c.active = false;
      c.group.visible = false;
      const idx = obstacles.findIndex((o) => o.crystal === LETTER);
      if (idx >= 0) obstacles.splice(idx, 1);
    }
    updateWordCount();
  }

  function practiceTap(id) {
    const st = practice.stations.find((s) => s.def.id === id);
    if (!st || practice.busy || lesson.active) return;
    if (st.done) {
      sfx.bubble();
      hear("ls-a");
      return;
    }
    if (practice.stage < 3) {
      if (practice.stage === 1) say(TASK1, { voice: "a01-task1", replay: true, interrupt: true });
      else say(GO_GRANDMA, { voice: "a01-go-grandma", replay: true, interrupt: true });
      return;
    }
    showMarker(st.root.position);
    routeTo(st.dir, 1.6, () => runApple(st));
  }

  // ---------- 描字卡（练习模式 / 单词模式）：沿用学习卡的外框 ----------
  function openPracticeCard({ mode, icon, title, total, done, cases }) {
    lesson.active = true;
    lesson.letter = LETTER;
    lessonEl.dataset.mode = mode;
    lessonEl.classList.remove("show-keyword", "show-say", "is-listening", "word-done");
    lessonEl.classList.add("show-trace");
    // 先擦掉上一次描的字，免得新卡片一打开闪一下旧的
    const cv = $("#lesson-trace");
    cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
    YayaLetterCases.showPair($("#lesson-letter"), LETTER, LETTERS[LETTER].color);
    $("#practice-icon").textContent = icon;
    $("#practice-title").textContent = title;
    $("#practice-apples").innerHTML = Array.from({ length: total }, (_, i) => `<i class="${i < done ? "is-on" : ""}"></i>`).join("");
    $("#trace-case-label").querySelectorAll("[data-trace-case]").forEach((badge) => {
      const form = badge.dataset.traceCase;
      badge.hidden = !cases.includes(form);
      badge.classList.remove("is-current", "is-done");
      badge.textContent = form === "upper" ? `大写 ${LETTER.toUpperCase()}` : `小写 ${LETTER}`;
    });
    lessonEl.hidden = false;
  }
  function setPracticeCase(form) {
    lesson.traceCase = form;
    lessonEl.dataset.traceCase = form;
    $("#lesson-trace").setAttribute("aria-label", `描写${form === "upper" ? `大写字母 ${LETTER.toUpperCase()}` : `小写字母 ${LETTER}`}`);
    $("#trace-case-label").querySelectorAll("[data-trace-case]").forEach((badge) => {
      badge.classList.toggle("is-current", badge.dataset.traceCase === form);
    });
  }
  function markPracticeCase(form) {
    const badge = $(`#trace-case-label [data-trace-case="${form}"]`);
    badge.classList.remove("is-current");
    badge.classList.add("is-done");
    badge.textContent = `${form === "upper" ? `大写 ${LETTER.toUpperCase()}` : `小写 ${LETTER}`} ✓`;
  }
  function closePracticeCard() {
    lessonEl.hidden = true;
    lessonEl.classList.remove("show-trace", "show-say", "is-listening", "word-done");
    delete lessonEl.dataset.mode;
    delete lessonEl.dataset.traceCase;
    $("#trace-case-label").querySelectorAll("[data-trace-case]").forEach((badge) => { badge.hidden = false; });
    $("#word-row").innerHTML = "";
    lesson.active = false;
  }
  async function sayTogether() {
    lessonEl.classList.remove("show-trace");
    lessonEl.classList.add("show-say");
    await say("跟我一起说！", { voice: "l-say" });
    await playWord(`ls-${LETTER}`);
    lessonEl.classList.add("is-listening");
    await wait(2.2);
    await waitForSpeechIdle();
    lessonEl.classList.remove("is-listening");
    await say("我们继续吧。", { voice: "l-continue" });
  }

  // ---------- 任务二：摘字母苹果 ----------
  async function runApple(st) {
    if (practice.busy || st.done || lesson.active) return;
    practice.busy = true;
    route = null;
    player.heading.copy(tangent(st.dir.clone().sub(player.dir), player.dir));
    playOnce(player, "interact-right");
    const level = PA.LEVELS[Math.min(applesDone(), PA.LEVELS.length - 1)];
    sfx.magic();
    openPracticeCard({ mode: "practice", icon: st.def.icon, title: st.def.title, total: PA.STATIONS.length, done: applesDone(), cases: level.cases });
    for (const [i, form] of level.cases.entries()) {
      setPracticeCase(form);
      // 一打开就能描：提示语音和描字同时进行，孩子不用干等
      const tracing = traceLetter(form === "upper" ? "A" : "a", { guide: level.guide });
      if (i === 0) {
        if (level.pre) await say(level.cases.length > 1 ? "这次<b>大写小写</b>，都要描哦。" : form === "upper" ? "这是<b>大写 A</b>。" : "这是<b>小写 a</b>。", { voice: level.pre });
        say(level.text, { voice: level.voice });
      } else {
        say(form === "upper" ? "这是<b>大写 A</b>。" : "这是<b>小写 a</b>。", { voice: form === "upper" ? "a01-upper" : "a01-lower", interrupt: true });
      }
      await tracing;
      markPracticeCase(form);
      sfx.sparkle();
      await playWord(`ls-${LETTER}`);
    }
    await sayTogether();
    closePracticeCard();

    st.done = true;
    made.add(st.def.id);
    st.ring.visible = st.beam.visible = false;
    say("描好了！苹果掉下来啦！", { voice: "a01-fall" });
    await dropApple(st);
    const from = st.big.getWorldPosition(new V3());
    burst(from.clone(), PLANET.letters.a.color, 24, 1);
    addStars(2, from.clone());
    st.hang.visible = false;
    updateWordCount();
    save();
    await flyApple(from);
    practice.busy = false;
    if (applesDone() >= PA.STATIONS.length) {
      practice.stage = 4;
      save();
      updateWordCount();
      say(GO_GRANDMA, { voice: "a01-go-grandma", replay: true });
    } else {
      say(MORE_APPLES, { voice: "a01-more2", replay: true });
    }
  }

  // ---------- 任务三：单词野餐。单词卡上缺一个 a，描出来以后一个音一个音地读 ----------
  async function runWordCard(card, n) {
    const guide = PA.WORD_GUIDES[Math.min(n, PA.WORD_GUIDES.length - 1)];
    openPracticeCard({ mode: "word", icon: PA.wordIcon || "🧺", title: PA.wordTitle || "单词野餐", total: (PA.TRACE_WORDS || PA.WORD_CARDS).length, done: n, cases: [] });
    const pic = $("#word-pic");
    if (card.emoji.startsWith("<")) pic.innerHTML = card.emoji; else pic.textContent = card.emoji;
    $("#word-meaning").textContent = card.zh;
    pic.classList.remove("is-bounce");
    $("#word-row").innerHTML = card.word.split("").map((ch,i) => {const gap=ch===LETTER&&(!IS_P||i===0);return `<span class="word-tile${gap ? " is-gap" : ""}">${gap ? "" : ch}</span>`;}).join("");
    lesson.traceCase = "lower";
    // 单词里有几个空（比如 turtle、tent 有两个 t），就描几次，一个一个填上
    const gaps = [...$("#word-row").querySelectorAll(".is-gap")];
    for (const [gi, gap] of gaps.entries()) {
      gaps.forEach((g) => g.classList.toggle("is-current", g === gap));
      const tracing = traceLetter(LETTER, { guide: gi ? "dots" : guide });
      if (gi === 0) {
        await playWord(card.word);
        say(n === 0 ? "这张单词卡上，少了一个字母。把它描出来！" : "下一张单词卡！", { voice: n === 0 ? "a01-word-miss" : "a01-word-next" });
      } else say("这里还少一个，再描一次！", { voice: "word-gap-again" });
      await tracing;
      sfx.sparkle();
      gap.textContent = LETTER;
      gap.classList.remove("is-current");
      gap.classList.add("is-filled");
      if (gi < gaps.length - 1) await wait(0.5);
    }
    lessonEl.classList.add("word-done");
    await say("我们一起读：", { voice: "a01-word-read" });
    const tiles = [...$("#word-row").children];
    // 能一个字母一个字母拼读的词（cat、ten、top）才逐个播字母音；turtle、tiger、soup 这种不规则的词直接整词读
    let tileOffset = 0;
    if (card.sayLetters !== false) for (const group of (card.soundGroups || card.word.split(""))) {
      const activeTiles = tiles.slice(tileOffset, tileOffset + group.length);
      tileOffset += group.length;
      activeTiles.forEach(t => t.classList.add("is-on"));
      await playWord(`ls-${group === 'ck' ? 'k' : group}`);
      await wait(0.12);
      activeTiles.forEach(t => t.classList.remove("is-on"));
    }
    tiles.forEach((t) => t.classList.add("is-on"));
    pic.classList.add("is-bounce");
    await playWord(card.word);
    await wait(0.3);
    await say(`就是<b>${card.zh}</b>。`, {voice:`meaning-${card.word}`});
    await wait(0.5);
    closePracticeCard();
  }
  async function runWords() {
    if (practice.busy || lesson.active) return;
    practice.busy = true;
    route = null;
    faceGrandma();
    if (PA.TRACE_WORDS && PA.TRACE_WORDS.some(c => !made.has(c.id))) await say(PA.wordsIntro, { voice: PA.wordsIntroVoice, speaker: "grandma" });
    for (const card of PA.TRACE_WORDS || PA.WORD_CARDS) {
      if (made.has(card.id)) continue;
      await runWordCard(card, (PA.TRACE_WORDS || PA.WORD_CARDS).filter(c => made.has(c.id)).length);
      made.add(card.id);
      practice.cheer = 1;
      addStars(2, orchard.basket.group.localToWorld(new V3(0, 0.6, 0)));
      updateWordCount();
      save();
      await wait(0.4);
    }
    practice.busy = false;
    finishPractice();
  }

  async function finishPractice() {
    if(IS_P){
      if(practice.busy||state.done)return;practice.busy=true;route=null;
      for(const b of shelf.values())b.visible=false;
      try{
        await pGame.ending();await pGame.showReward();
        made.add('p-finale');practice.stage=6;state.done=true;save();updateWordCount();showDoneCard();
      }finally{practice.busy=false;pGame.endDone();}return;
    }
    if(IS_I){
      if(practice.busy||state.done)return;practice.busy=true;route=null;
      for(const b of shelf.values())b.visible=false;
      try{
        await iGame.ending();await iGame.showReward();
        made.add('i-finale');practice.stage=6;state.done=true;save();updateWordCount();showDoneCard();
      }finally{practice.busy=false;iGame.endDone();}return;
    }
    if(COURSE_GAME){practice.stage=6;state.done=true;save();updateWordCount();for(const fp of farPlanets)if(fp.id&&planetUnlocked(fp.id))fp.base=0.6;habitat.complete();orchard.pie.visible=true;unicornGuide.cheer();sfx.fanfare();burst(orchard.granny.root.position,"#ffdc7a",30,1.2);
      if(PA.rewardText){
        // 奖励：礼物从台子上弹出来，彩虹色的星星一圈圈炸开，NPC 跳两下
        const pie=orchard.pie,s0=pie.scale.x;pie.scale.setScalar(.01);await tween(.6,k=>pie.scale.setScalar(Math.max(.01,s0*(1-Math.pow(1-k,3))*(1+.25*Math.sin(k*Math.PI)))));
        const at=pie.getWorldPosition(new V3()).addScaledVector(pie.position.clone().normalize(),.8);
        ["#ff9aa8","#ffc78a","#fff09a","#a8e6a1","#9fd3ff","#c9a6ff"].forEach((c,i)=>setTimeout(()=>{burst(at,c,14,1.1);sfx.star&&sfx.star()},i*180));
        practice.cheer=1.6;await say(PA.rewardText,{voice:PA.rewardVoice,speaker:"grandma"});
      }
      await say(PA.finishText,{voice:PLANET.id+"-done",speaker:"grandma"});showDoneCard({narrate:false});return;}
    practice.stage = 6;
    state.done = true;
    save();
    updateWordCount();
    // 走到野餐垫左边，侧着看奶奶和苹果派，角色不挡住她们
    const party = orchard.local(-0.55, -1.75);
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 12000);
      routeTo(party, 0.25, () => { clearTimeout(timer); resolve(); });
    });
    route = null;
    player.heading.copy(tangent(orchard.local(2.4, -3.1).sub(player.dir), player.dir));
    camFwdTarget = player.heading.clone();
    camDist = Math.min(camDist, 7);
    await wait(0.8);
    const pie = orchard.pie;
    pie.visible = true;
    pie.scale.setScalar(0.01);
    sfx.fanfare();
    tween(0.7, (k) => pie.scale.setScalar(Math.max(0.01, ease(k) + Math.sin(k * Math.PI) * 0.3)));
    const center = orchard.granny.root.position.clone();
    ["#e8655a", "#f7c65d", "#8fcaa9", "#9cc4ec"].forEach((c, i) => setTimeout(() => burst(center.clone().addScaledVector(center.clone().normalize(), 1.4), c, 22, 1.2), i * 220));
    practice.cheer = 3;
    await say("太棒啦！大写和小写你都会写了，还读了五个单词！奶奶做了<b>苹果派</b>，奖励你！", { voice: "a01-end", speaker: "grandma" });
    for (const fp of farPlanets) if (fp.id && planetUnlocked(fp.id)) fp.base = 0.6;
    await wait(0.6);
    sfx.magic();
    showDoneCard();
  }

  const npcTag=document.createElement('button');npcTag.id='npc-guide';npcTag.className='npc-guide';npcTag.type='button';npcTag.hidden=true;npcTag.innerHTML='<img alt=""><b></b>';document.body.append(npcTag);npcTag.onclick=grandmaTap;
  // NPC 头顶的金色“！”气泡：下一步要找 NPC 时才出现，远处也看得见
  const npcCall=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#f08a2c';g.beginPath();g.moveTo(48,98);g.lineTo(64,126);g.lineTo(80,98);g.fill();g.beginPath();g.arc(64,56,52,0,Math.PI*2);g.fill();g.fillStyle='#ffffff';g.beginPath();g.arc(64,56,42,0,Math.PI*2);g.fill();g.fillStyle='#e0661c';g.font='900 72px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('!',64,60);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:srgb(new THREE.CanvasTexture(c)),depthTest:false,transparent:true}));sp.renderOrder=9;sp.visible=false;scene.add(sp);return sp;})();
  let npcAutoAt=0;
  function updatePractice(dt, time) {
    if (!orchard) return;
    {const tgt=state.started&&!practice.busy&&!lesson.active&&!state.challenge?guideTarget():null;const calling=Boolean(tgt&&arc(tgt.dir,grandmaDir())<1.2);
     npcTag.classList.toggle('is-calling',calling);
     // 走到 NPC 身边（3 米内，NPC 站在台子上走不到更近、没在走路）就自动开始说话，不用再点名牌
     if(calling&&!route&&arc(player.dir,grandmaDir())<3.1&&performance.now()>npcAutoAt){npcAutoAt=performance.now()+5000;grandmaTurn();}
     // 名牌在画面里、NPC 也不远时，金色名牌就够了；名牌看不到或者 NPC 很远时，头顶的“！”从远处指路
     const top=orchard.granny.root.localToWorld(new V3(0,(PLANET.id === "i01" ? 3.8 : IS_P ? 2.6 : 2.4)+Math.abs(Math.sin(time*3))*.3,0)),cd=top.distanceTo(camera.position),far=arc(player.dir,grandmaDir())>14;
     npcCall.visible=calling&&cd>7&&(IS_I||IS_P||npcTag.hidden||far);
     if(npcCall.visible){npcCall.position.copy(top);const k=THREE.MathUtils.clamp(cd*.06,1.2,3.5);npcCall.scale.set(k,k,1);}}
    // 刺猬奶奶：轻轻呼吸、点头；说话、收到苹果或者被点的时候跳两下
    const g = orchard.granny;
    const marker=g.root.localToWorld(new V3(0,PLANET.id === "i01" ? 3.1 : IS_P ? 2.0 : 1.25,0)),p=screenPoint(marker),facing=marker.clone().normalize().dot(camera.position.clone().sub(marker))>0;
    npcTag.hidden=!state.started||practice.busy||lesson.active||state.challenge||companionUI.open||!$("#planet-map").hidden||!$("#done").hidden||!facing||!p||p.x<32||p.x>innerWidth-32||p.y<140||p.y>innerHeight-140;
    if(!npcTag.hidden){npcTag.style.left=p.x+'px';npcTag.style.top=p.y+'px';const src=speakers.grandma?.src;if(src&&npcTag.firstChild.src!==src)npcTag.firstChild.src=src;npcTag.lastChild.textContent=PA.npcName||'苹果园奶奶';npcTag.setAttribute('aria-label','和'+(PA.npcName||'苹果园奶奶')+'说话')}
    practice.cheer = Math.max(0, practice.cheer - dt);
    const hop = practice.cheer ? Math.abs(Math.sin(practice.cheer * Math.PI * 2.2)) * 0.14 : 0;
    g.body.position.y = hop;
    g.body.scale.set(1, 1 + Math.sin(time * 2.2) * 0.018, 1);
    g.head.rotation.x = Math.sin(time * 1.3) * 0.05 + (practice.cheer ? Math.sin(time * 14) * 0.1 : 0);
    g.head.rotation.z = Math.sin(time * 0.7) * 0.04;
    if (!practice.active) return;
    const toCam = new V3();
    for (const [i, st] of practice.stations.entries()) {
      if (!st.hang.visible) continue;
      // 字母贴在苹果朝镜头的那一面，从哪边看都清楚
      toCam.copy(camera.position);
      st.hang.worldToLocal(toCam);
      st.label.position.copy(toCam.normalize().multiplyScalar(0.4));
      if (!st.done) st.hang.rotation.z = Math.sin(time * 1.6 + i) * 0.07;
      if (st.ring.visible) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 2.4 + i);
        st.ring.material.opacity = 0.55 + pulse * 0.45;
        st.beam.material.opacity = 0.18 + pulse * 0.12;
        st.big.scale.setScalar(1 + pulse * 0.05);
      }
    }
  }

  // ---------- 字母墙：按 A–Z 排的 26 格，学会的亮起来，点它听声音和例词 ----------
  function learnedLetters() {
    const set = new Set();
    for (const pl of Object.values(PLANETS)) {
      if (pl.kind !== "letters" || !PLANET_ROUTE.includes(pl.id)) continue;
      if (pl.id === PLANET.id) {
        for (const l of ORDER) if (crystals[l].collected) set.add(l);
      } else {
        const data = readStore(planetSaveKey(pl.id));
        for (const l of (data && data.collected) || []) set.add(l);
      }
    }
    return set;
  }
  const wallEl = $("#wall");
  function renderWall() {
    const learned = learnedLetters();
    $("#wall-grid").innerHTML = "abcdefghijklmnopqrstuvwxyz".split("").map((l) => {
      const [word, emoji] = KEYWORDS[l];
      const on = learned.has(l);
      const vowel = VOWELS.includes(l) ? " is-vowel" : "";
      return `<button class="wall-cell${on ? " is-on" : ""}${vowel}" type="button" data-letter="${l}" aria-label="大写 ${l.toUpperCase()}，小写 ${l}${on ? "，" + word : "，还没学"}">`
        + `<b>${l.toUpperCase()} ${l}</b><span>${on ? emoji : "?"}</span><small>${on ? word : ""}</small></button>`;
    }).join("");
    $("#wall-count").textContent = `${learned.size}/26`;
    $("#wall-sub").textContent = learned.size ? `大写 / 小写对照 · 已学会 ${learned.size} 个字母` : "大写 / 小写对照 · 学会后会亮起来";
  }
  function updateWallBadge() {
    $("#wall-badge").textContent = String(learnedLetters().size);
  }
  $("#wall-open").addEventListener("click", () => {
    initAudio();
    lastInput = performance.now();
    renderWall();
    wallEl.hidden = false;
    sfx.bubble();
  });
  $("#wall-close").addEventListener("click", () => {
    wallEl.hidden = true;
    lastInput = performance.now();
  });
  wallEl.addEventListener("click", (event) => {
    if (event.target === wallEl) wallEl.hidden = true;
    const cell = event.target.closest(".wall-cell");
    if (!cell) return;
    const letter = cell.dataset.letter;
    cell.classList.remove("is-pop");
    void cell.offsetWidth;
    cell.classList.add("is-pop");
    if (cell.classList.contains("is-on")) {
      hear(`ls-${letter}`);
      playWord(KEYWORDS[letter][0]);
    } else {
      sfx.boing();
    }
  });

  // ---------- 字母星球的拼词：听一个声音，点出对应的字母，三个都放好再连起来读 ----------
  const blend = { active: false, word: null, pos: 0, waiting: false, cooldown: 0 };
  const swipe = {
    active: false, word: null, blocks: [], idx: 0, times: [], tries: 0,
    resolve: null, lastX: null, lastY: null, moreAt: -Infinity, gesture: 0,
  };
  function dimSwipeBlocks() {
    swipe.blocks.forEach((block) => { block.material.emissiveIntensity = 0.25; });
  }
  function screenPoint(pos) {
    const p = pos.clone().project(camera);
    const rect = canvas.getBoundingClientRect();
    return p.z >= -1 && p.z < 1 ? {
      x: rect.left + (p.x + 1) * rect.width / 2,
      y: rect.top + (1 - p.y) * rect.height / 2,
    } : null;
  }
  function swipeBlend(blocks, word) {
    state.spelling = true;
    state.selected = null;
    route = null;
    camYawDelta = 0;
    camFwdTarget = STAGE.front.clone().negate();
    Object.assign(swipe, {
      active: false, word, blocks, idx: 0, times: [], tries: 0,
      lastX: null, lastY: null, moreAt: -Infinity, gesture: swipe.gesture + 1,
    });
    dimSwipeBlocks();
    syncBag();
    return new Promise((resolve) => {
      swipe.resolve = resolve;
      routeTo(moveAlong(STAGE.center, STAGE.front, 2.7), 0.3, () => {
        player.heading.copy(tangent(STAGE.center.clone().sub(player.dir), player.dir));
        camFwdTarget = STAGE.front.clone().negate();
        swipe.active = true;
        lastInput = performance.now();
        say(`用手指<b>从左往右</b>，划过这${blocks.length===2?"两个":"三个"}字母，把声音连起来！`, { voice: blocks.length===2?"t01-swipe-two":"swipe-start", replay: true });
      });
    });
  }
  function swipeMove(x, y) {
    if (!swipe.active || swipe.lastX === null) return;
    const points = swipe.blocks.map((block) => screenPoint(block.position));
    const from = { x: swipe.lastX, y: swipe.lastY };
    swipe.lastX = x;
    swipe.lastY = y;
    if (points.some((p) => !p)) return;
    const spacing = Math.min(...points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y)));
    const radius = Math.max(44, spacing * 0.45);
    // 纵向缩小坐标，相当于给孩子 1.6 倍高的命中区域。
    const dx = x - from.x;
    const dy = (y - from.y) / 1.6;
    if (dx <= 0) return;
    const length2 = dx * dx + dy * dy;
    let previousT = -1;
    while (swipe.idx < swipe.blocks.length) {
      const p = points[swipe.idx];
      // 窄屏的 44px 容错区可能重叠；至少划过两格的中线才进入下一格。
      if (swipe.idx > 0 && x < (points[swipe.idx - 1].x + p.x) / 2) break;
      const px = p.x - from.x;
      const py = (p.y - from.y) / 1.6;
      const t = length2 ? THREE.MathUtils.clamp((px * dx + py * dy) / length2, 0, 1) : 0;
      // 同一段可以穿过多个字母，但必须依次经过，反向划不能完成。
      if (t < previousT || Math.hypot(px - t * dx, py - t * dy) > radius) break;
      previousT = t;
      const block = swipe.blocks[swipe.idx];
      swipe.times.push(performance.now());
      block.material.emissiveIntensity = 0.9;
      hopBlock(block, 0.35);
      hear(`ls-${block.userData.letter}`);
      swipe.idx += 1;
    }
  }
  async function swipeEnd() {
    if (!swipe.active || !swipe.idx) return;
    const gesture = swipe.gesture;
    if (swipe.idx < swipe.blocks.length) {
      const now = performance.now();
      if (now - swipe.moreAt >= 3000) {
        swipe.moreAt = now;
        say("要一直划到<b>最后一个字母</b>哦！", { voice: "swipe-more", interrupt: true });
      }
      await wait(0.6);
      if (swipe.active && swipe.gesture === gesture) dimSwipeBlocks();
      return;
    }
    swipe.tries += 1;
    const fast = swipe.times[swipe.times.length - 1] - swipe.times[0] < 1000;
    if (fast || swipe.tries >= 3) {
      swipe.active = false;
      const resolve = swipe.resolve;
      swipe.resolve = null;
      if (!fast) await say("我们把声音连起来读！", { voice: "b-blend" });
      await playWord(swipe.word);
      resolve();
      return;
    }
    await wait(0.5);
    // 新的一划已经开始时，旧提示和变暗计时不能覆盖它。
    if (!swipe.active || swipe.gesture !== gesture) return;
    say("真棒！再划快一点，声音就会连成一个词！", { voice: "swipe-faster", replay: true });
    dimSwipeBlocks();
  }
  function swipeGlow(x, y) {
    const dot = document.createElement("i");
    dot.className = "swipe-glow";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    $("#fly-layer").appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  }
  function enterBlend(restoring) {
    blend.active = true;
    spawnAltar(restoring);
    if (!restoring) say(`${ORDER.length} 个字母都学会啦！回到石台，我们来拼词。`, { voice: "l-all" });
  }
  const nextBlendWord = () => (PLANET.blend || []).find((w) => !made.has(w));
  async function startBlendWord(word) {
    blend.word = word;
    blend.pos = 0;
    blend.waiting = false;
    const previous = [...placed.keys()];
    for (const letter of previous) returnToBag(letter);
    // 收回动画结束后再换背包，避免旧计时器覆盖新一轮的 placed 状态。
    if (previous.length) await wait(0.9);
    const deck = blendDeck(word);
    for (const letter of [...(PLANET.reviewLetters || []), ...(PLANET.giftLetters || [])]) state.bag[letter] = "has";
    renderBag(deck);
    syncBag();
    if (PLANET.reviewText && deck.some(l => (PLANET.reviewLetters || []).includes(l))) {
      await say(PLANET.reviewText, { voice: PLANET.reviewVoice });
    }
    // 这个词里有还没学过的字母：NPC 先把它当礼物送给孩子，听一遍它的声音
    for (const l of deck.filter(l => (PLANET.giftLetters || []).includes(l) && word.includes(l))) {
      if (blend.gifted?.has(l)) continue; (blend.gifted ||= new Set()).add(l);
      document.querySelector(`.slot[data-letter="${l}"]`)?.classList.add("is-gift");
      await say(PLANET.giftText, { voice: PLANET.giftVoice, speaker: "grandma" });
      await playWord(`ls-${l}`);
    }
    await say("我们来拼一个词！", { voice: "b-start" });
    askBlendSound();
  }
  async function askBlendSound() {
    const word = blend.word;
    const pos = blend.pos;
    const letter = word[pos];
    const first = pos === 0;
    const last = pos === word.length - 1;
    blend.waiting = false;
    await say(first ? "第一个声音是——" : last ? "最后一个声音是——" : "下一个声音是——", { voice: first ? "b-first" : last ? "b-last" : "b-next" });
    await playWord(`ls-${letter}`);
    if (blend.word !== word || blend.pos !== pos) return;
    say("哪个字母是这个声音？点它。", { voice: "b-pick", replay: true });
    blend.waiting = true;
    lastInput = performance.now();
  }
  async function blendPick(letter) {
    if (!blend.waiting || state.spelling) return;
    const needed = blend.word[blend.pos];
    if (letter !== needed) {
      sfx.boing();
      say("不是它哦，再听一听。", { voice: "b-wrong", then: `ls-${needed}`, replay: true, interrupt: true });
      return;
    }
    blend.waiting = false;
    sfx.bubble();
    placeLetter(letter, STAGE.slotDirs[blend.pos], true);
    await wait(0.5);
    blend.pos += 1;
    if (blend.pos < blend.word.length) askBlendSound();
    else blendWord(blend.word);
  }
  function hopBlock(block, height = 0.6) {
    const start = block.userData.hopBase ?? block.userData.lift;
    block.userData.hopBase = start;
    const hop = block.userData.hop = (block.userData.hop || 0) + 1;
    return tween(0.35, (k) => {
      if (block.userData.hop !== hop) return;
      block.userData.lift = start + Math.sin(k * Math.PI) * height;
      placeOnSurface(block, block.userData.dir, camFwd.clone().negate(), block.userData.lift);
    }).then(() => {
      if (block.userData.hop === hop) block.userData.lift = start;
    });
  }
  async function blendWord(word) {
    if(PA.TASKS?.[2].type==="blend")return finishCourseBlend(word);
    state.spelling = true;
    syncBag();
    const blocks = STAGE.slotDirs.map((d) => [...placed.values()].find((b) => arc(b.userData.dir, d) < 0.45));
    await swipeBlend(blocks, word);
    // 划过三个声音以后，方块依次跳起来，再听一次整个词。
    blocks.forEach((block, i) => setTimeout(() => hopBlock(block, 0.4), i * 120));
    await playWord(word);
    say(`<b>${word.toLowerCase()}</b>！`);
    sfx.fanfare();
    blocks.forEach((block) => {
      burst(block.position.clone(), LETTERS[block.userData.letter].color, 14, 0.8);
      block.material.emissiveIntensity = 0.15;
    });
    made.add(word);
    updateWordCount();
    addStars(5, blocks[1].position.clone());
    await GIFTS[word].show(STAGE.center.clone());
    state.spelling = false;
    blend.word = null;
    blend.cooldown = performance.now() + 2500;
    save();
    if (made.size === Object.keys(WORDS).length) {
      state.done = true;
      save();
      for (const fp of farPlanets) if (fp.id && planetUnlocked(fp.id)) fp.base = 0.6;
      syncBag();
      await wait(1.2);
      sfx.magic();
      showDoneCard();
      return;
    }
    say("还有一个词，我们接着拼！", { voice: "b-more" });
  }

  // ---------- 字母星球的奖励 ----------
  const woodMat = new THREE.MeshLambertMaterial({ color: "#c08a52" });
  function stagePart(w, h, d, x, y, z, mat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
  // sit：石台旁边多一张小板凳
  function makeBench() {
    const bench = new THREE.Group();
    bench.add(stagePart(1.1, 0.12, 0.42, 0, 0.44, 0, woodMat));
    for (const x of [-0.45, 0.45]) for (const z of [-0.15, 0.15]) bench.add(stagePart(0.1, 0.4, 0.1, x, 0.2, z, woodMat));
    bench.position.set(-3.3, 0.05, 1.1);
    STAGE.group.add(bench);
    return bench;
  }
  // pan：石台右前角一个平底锅，里面煎着蛋
  function makePan() {
    const pan = new THREE.Group();
    const dark = new THREE.MeshLambertMaterial({ color: "#3a3768" });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.27, 0.09, 16), dark);
    body.castShadow = true;
    pan.add(body);
    pan.add(stagePart(0.5, 0.05, 0.08, 0.55, 0.02, 0, dark));
    const white = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 14), new THREE.MeshLambertMaterial({ color: "#fffdf3" }));
    white.position.y = 0.055;
    pan.add(white);
    const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshLambertMaterial({ color: "#ffbe2e", emissive: "#ff9a00", emissiveIntensity: 0.2 }));
    yolk.position.set(0.03, 0.08, 0.02);
    yolk.scale.y = 0.6;
    pan.add(yolk);
    pan.position.set(1.55, STAGE.top + 0.05, 0.55);
    STAGE.group.add(pan);
    return pan;
  }
  // ant：一只方块小蚂蚁，跟在你脚边爬
  const antPet = { obj: null, dir: null, heading: FWD0.clone() };
  function makeAnt(spot) {
    const ant = new THREE.Group();
    const body = new THREE.MeshLambertMaterial({ color: "#5a3a2a" });
    [-0.16, 0, 0.17].forEach((z, i) => ant.add(stagePart(i === 1 ? 0.12 : 0.16, 0.12, i === 2 ? 0.2 : 0.14, 0, 0.12, z, body)));
    const legs = [];
    for (const side of [-1, 1]) {
      for (const z of [-0.08, 0, 0.08]) {
        const leg = stagePart(0.16, 0.03, 0.03, side * 0.1, 0.07, z, body);
        leg.userData.side = side;
        leg.userData.phase = z * 20 + (side > 0 ? Math.PI : 0);
        ant.add(leg);
        legs.push(leg);
      }
      const feeler = stagePart(0.02, 0.14, 0.02, side * 0.05, 0.22, 0.26, body);
      feeler.rotation.x = 0.6;
      ant.add(feeler);
    }
    const eye = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    for (const side of [-1, 1]) ant.add(stagePart(0.04, 0.04, 0.02, side * 0.045, 0.15, 0.27, eye));
    ant.userData.legs = legs;
    scene.add(ant);
    antPet.obj = ant;
    antPet.dir = spot.clone().normalize();
    return ant;
  }
  function updateAnt(dt, time) {
    const ant = antPet.obj;
    if (!ant) return;
    const target = moveAlong(player.dir, player.heading.clone().negate(), 0.9);
    const d = arc(antPet.dir, target);
    let moving = false;
    if (d > 0.25) {
      const toward = tangent(target.clone().sub(antPet.dir), antPet.dir);
      antPet.dir.copy(moveAlong(antPet.dir, toward, Math.min(d, Math.min(WALK_SPEED * 1.2, d * 3) * dt))).normalize();
      antPet.heading.lerp(toward, 1 - Math.exp(-dt * 10));
      moving = true;
    }
    antPet.heading.copy(tangent(antPet.heading, antPet.dir));
    ant.position.copy(antPet.dir).multiplyScalar(surfaceRadius(antPet.dir) + 0.02);
    orient(ant, upAt(antPet.dir), antPet.heading);
    ant.userData.legs.forEach((leg) => { leg.rotation.y = moving ? Math.sin(time * 22 + leg.userData.phase) * 0.5 : 0; });
  }

  Object.assign(GIFTS, {
    sit: {
      carry: false,
      async show() {
        const bench = makeBench();
        bench.scale.setScalar(0.01);
        sfx.place();
        await tween(0.5, (k) => bench.scale.setScalar(Math.max(0.01, ease(k))));
        playOnce(player, "sit");
        say("你拼出了 <b>sit</b>，一张小板凳，坐下来歇一歇！", { voice: "reward-sit" });
        await wait(2.6);
      },
      restore() {
        makeBench();
      },
    },
    ant: {
      async show(center) {
        const ant = makeAnt(center);
        ant.scale.setScalar(0.01);
        tween(0.5, (k) => ant.scale.setScalar(Math.max(0.01, ease(k))));
        sfx.chirp();
        playOnce(player, "emote-yes");
        say("你拼出了 <b>ant</b>，一只小蚂蚁爬出来啦！", { voice: "reward-ant" });
        await wait(2.4);
      },
      restore() {
        makeAnt(besidePlayer());
      },
    },
    pan: {
      carry: false,
      async show() {
        const pan = makePan();
        pan.scale.setScalar(0.01);
        tween(0.5, (k) => pan.scale.setScalar(Math.max(0.01, ease(k))));
        for (let i = 0; i < 8; i += 1) noise({ when: i * 0.12, gain: 0.05, decay: 0.1, type: "highpass", freq: 4000 + Math.random() * 3000 });
        playOnce(player, "emote-yes");
        say("你拼出了 <b>pan</b>，一个小平底锅，还煎了一个蛋！", { voice: "reward-pan" });
        await wait(2.6);
      },
      restore() {
        makePan();
      },
    },
  });

  const secondRewards = window.YayaSecondRewards.create({
    THREE, scene, player, STAGE, surfaceRadius, moveAlong, tangent, arc,
    orient, upAt, tween, wait, ease, sfx, say, playOnce, obstacles, LOW_POWER,
  });
  Object.assign(GIFTS, secondRewards.gifts);
  const unicornGuide = YayaCharacters.createGuide({
    THREE, scene, player, moveAlong, tangent, arc, orient, upAt, surfaceRadius, obstacles,
    getContext: () => ({
      target: guideTarget(),
      mode: lesson.active ? "lesson" : state.challenge ? "listen" : (state.digging || state.digPending) ? "dig" : swipe.active ? "swipe" : blend.waiting ? "letters" : state.done ? "done" : "explore",
      progress: Object.values(crystals).filter(c => c.collected).length + made.size * 6,
    }),
  });


  const pGame=IS_P&&window.YayaPGame?YayaPGame.create({THREE,scene,player,companion:unicornGuide,world:round3,orchard,STAGE,surfaceRadius,orient,tangent,arc,tween,wait,sfx,burst,LOW_POWER,camera,
    routeTo,ready:()=>state.started,free:()=>!learningNow()&&!pGame?.popActive,stopRoute:()=>{route=null},cameraShot:v=>{camShot=v},crystal:()=>crystals[LETTER],activate:()=>activateLetter(LETTER,true),
    has:id=>made.has(id),mark:id=>{made.add(id);updateWordCount()},save:()=>save(),read:readStore,write:writeStore,stars:n=>addStars(n),trace:i=>courseTrace(i,[i===0?'upper':'lower']),playWord:w=>playWord(w),say:(h,o)=>say(h,o)
  }):null;

  // ---------- 点击与拖动 ----------
  const pickRay = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function kindOf(object) {
    let o = object;
    while (o) {
      if (o.userData && o.userData.kind) return o;
      o = o.parent;
    }
    return null;
  }

  function handleTap(clientX, clientY) {
    if (!state.started) return;
    initAudio();
    if(pGame?.locked){pGame.tap(clientX,clientY);return;}
    if(IS_P&&(practice.busy||lesson.active))return;
    if(iGame?.riding){iGame.tapSide(clientX<innerWidth/2);return;}
    if(iGame?.locked)return;
    if(IS_I&&(practice.busy||lesson.active))return;
    if (state.challenge && !lesson.active && !state.digging && !state.digPending && !state.spelling) {
      const answer = listeningHit(clientX, clientY);
      if (answer) { visitAnswer(answer); return; }
    }
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    pickRay.setFromCamera(ndc, camera);
    const targets = [planet, STAGE.group, ...Object.values(crystals).filter(available).map((c) => c.group), ...answers, ...placed.values()];
    if (!state.done) targets.push(...altar.slots.filter((slot) => !slotTaken(slot)));
    for (const pet of Object.values(pets)) if (pet.active) targets.push(pet.obj);
    // Learning hit targets take priority; the guide is tappable only between tasks.
    if (!lesson.active && !state.challenge && !state.digging && !state.digPending && !state.spelling && !swipe.active) targets.push(unicornGuide.root);
    targets.push(...shelf.values());
    if (!state.challenge && !state.digging && !state.digPending) targets.push(...practiceTargets());
    if (snakeRide?.active) targets.push(...snakeRide.targets());
    if (tRace?.active) targets.push(...tRace.targets());
    if (sShards?.active) targets.push(...sShards.targets());
    if(iGame?.iceActive)targets.push(...iGame.targets());
    if(pGame?.popActive)targets.push(...pGame.targets());
    if(IS_I&&!learningNow()&&!iGame?.iceActive)targets.push(...round3.atmosphere.targets());
    if(IS_P&&!learningNow()&&!pGame?.popActive&&round3?.machine?.targets)targets.push(...round3.machine.targets());
    for (const fp of farPlanets) targets.push(fp.group);
    const hits = pickRay.intersectObjects(targets, true);
    // P: the machine tap wins over anything else the ray passes (ground, stage pedestal) so it is always clickable
    if (IS_P && hits.some((h) => kindOf(h.object)?.userData.kind === "p-tap")) { sfx.bubble(); round3.machine.tapTap(); return; }
    for (const hit of hits) {
      // 答题时光柱挡在答案标签后面，不让它抢走点击
      if (state.challenge && hit.object.userData.isBeam) continue;
      const owner = kindOf(hit.object);
      if (!owner) continue;
      const kind = owner.userData.kind;
      if (kind === "snake-food") { snakeRide.tapFood(owner.userData.food); return; }
      if (kind === "snake-s") { snakeRide.tapS(); return; }
      if (kind === "t-gate") { tRace.tapGate(owner.userData.gate); return; }
      if (tRace?.active && kind === "ground") { tRace.tapSide(clientX < innerWidth / 2); return; }   // 赛跑中点地面 = 点左 / 右半边
      if(kind==="p-tap"){sfx.bubble();round3.machine.tapTap();return;}
      if(kind==="i-animal"){round3.atmosphere.tap(owner.userData.animal);return;}
      if(kind==="p-pop"){pGame.tapPop(owner.userData.pop);return;}
      if(kind==="i-icicle"){iGame.tapIce(owner.userData.ice);return;}
      if (kind === "s-shard") { sShards.tap(owner.userData.shard); return; }
      if (kind === "guide") {
        sfx.bubble();
        companionUI.nuzzle();return;
        if (say.last) say(say.last.html, { voice: say.last.key, then: say.last.then, replay: true, interrupt: true });
        else say("跟着金色光点，一起去找字母吧！", { voice: "welcome-letters" });
        return;
      }
      if (kind === "crystal") {
        const crystal = crystals[owner.userData.letter];
        if (state.digging && state.digging.letter === crystal.letter) {
          digHit(crystal);
          return;
        }
        if (state.digging || state.digPending || state.spelling) return;
        if (state.challenge && state.challenge !== crystal.letter) {
          state.challenge = null;
          clearAnswers();
        }
        if (state.challenge === crystal.letter) {
          hear(CHALLENGES[crystal.letter].audio);
          return;
        }
        showMarker(crystal.group.position);
        if (IS_LETTERS) {
          if (lesson.active) return;
          routeTo(crystal.dir, 2.6, () => (crystal.lessonDone ? startChallenge(crystal.letter) : runLesson(crystal.letter)));
          return;
        }
        routeTo(crystal.dir, 2.6, () => startChallenge(crystal.letter));
        return;
      }
      if (state.digging || state.digPending) return;
      // 连读期间点字母仍能听音，其余点击不能把角色带离石台。
      if (state.spelling && kind !== "placed") return;
      if (kind === "station") {
        practiceTap(owner.userData.station);
        return;
      }
      if (kind === "grandma") {
        grandmaTap();
        return;
      }
      if (kind === "shelf") {
        sfx.bubble();
        hear(`ls-${owner.userData.letter}`);
        return;
      }
      if (kind === "answer") {
        visitAnswer(owner);
        return;
      }
      if (kind === "placed") {
        if (IS_LETTERS) {
          hear(`ls-${owner.userData.letter}`);
          return;
        }
        if (state.spelling || state.done) return;
        const letter = owner.userData.letter;
        const slot = altar.slots.find((s) => slotLetter(s) === letter);
        // 手里拿着字母时点格子里的字母：直接换进去，原来的字母自己飞回背包
        if (state.selected && slot) {
          const incoming = state.selected;
          showMarker(owner.position);
          routeTo(owner.userData.dir, 1.1, () => {
            if (state.selected === incoming) swapIntoSlot(incoming, slot);
          });
          return;
        }
        routeTo(owner.userData.dir, 1.0, () => pickUpLetter(letter));
        return;
      }
      if (kind === "slot") {
        if (state.spelling) return;
        if (!state.selected) {
          const next = ALL_LETTERS.find((l) => state.bag[l] === "has");
          say(next ? "先点<b>下面背包里的字母</b>，再点这个格子。" : "字母都放好了。点格子里的字母可以拿起来换位置。", { voice: next ? "need-letter" : "made-again" });
          return;
        }
        const letter = state.selected;
        const dir = owner.userData.dir.clone();
        showMarker(owner.position);
        routeTo(dir, 1.1, () => {
          if (state.selected === letter && !slotTaken(owner)) placeLetter(letter, dir, true);
        });
        return;
      }
      if (kind === "pet") {
        const pet = pets[owner.userData.pet];
        hear(pet.word);
        setTimeout(pet.name === "cat" ? sfx.meow : sfx.chirp, 750);
        playOnce(pet, "dance");
        return;
      }
      if (kind === "sky-planet") {
        travelTo(owner.userData.id);
        return;
      }
      if (kind === "ground") {
        const dir = hit.point.clone().normalize();
        showMarker(hit.point);
        if (state.selected && !state.done) {
          const letter = state.selected;
          // 点在格子附近：放进最近的格子（有字母就互换），不会落在格子外面
          const slot = nearestSlot(dir, 2.2);
          if (slot) {
            routeTo(slot.userData.dir, 1.1, () => {
              if (state.selected === letter) swapIntoSlot(letter, slot);
            });
            return;
          }
          if (altar.slots.length) {
            // 有格子以后，字母只能放进格子
            say(`跟着<b>金色光点</b>回到<b>石台</b>那里，再把 <b>${letter.toLowerCase()}</b> 放进格子。`, { voice: "go-altar" });
            routeTo(dir, 0);
            return;
          }
          routeTo(dir, 1.0, () => {
            if (state.selected === letter) placeLetter(letter, dir);
          });
        } else {
          routeTo(dir, 0);
        }
        return;
      }
    }
    if (tRace?.active) tRace.tapSide(clientX < innerWidth / 2);   // 点到天空等没有东西的地方：也算左 / 右半边
  }

  let pointer = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (pointer || !e.isPrimary) return;
    lastInput = performance.now();
    pointer = {
      id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, drag: false,
      at:performance.now(), swipe: swipe.active, glowX: e.clientX, glowY: e.clientY,
    };
    pointer.pBlow=!!pGame?.pointerDown(e.clientX,e.clientY,e.pointerId);
    if(pointer.pBlow)initAudio();
    if (pointer.swipe) {
      initAudio();
      swipe.gesture += 1;
      swipe.idx = 0;
      swipe.times = [];
      swipe.lastX = e.clientX;
      swipe.lastY = e.clientY;
      dimSwipeBlocks();
    }
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pointer || pointer.id !== e.pointerId) return;
    lastInput = performance.now();
    if (!pointer.drag && Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 8) pointer.drag = true;
    if (pointer.swipe) {
      if (pointer.drag) {
        swipeMove(e.clientX, e.clientY);
        const dx = e.clientX - pointer.glowX;
        const dy = e.clientY - pointer.glowY;
        const distance = Math.hypot(dx, dy);
        const steps = Math.floor(distance / 18);
        for (let i = 1; i <= steps; i += 1) {
          swipeGlow(pointer.glowX + dx * i * 18 / distance, pointer.glowY + dy * i * 18 / distance);
        }
        if (steps) {
          pointer.glowX += dx * steps * 18 / distance;
          pointer.glowY += dy * steps * 18 / distance;
        }
      }
      return;
    }
    if(iGame?.locked||pGame?.locked){if(pGame?.riding&&pointer.drag&&!pointer.pBlow)pGame.orbitCamera?.((e.clientX-pointer.lastX)*0.007);pointer.lastX=e.clientX;return;}
    if (pointer.drag) {
      camYawDelta += (e.clientX - pointer.lastX) * 0.007;
      camFwdTarget = null;
    }
    pointer.lastX = e.clientX;
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!pointer || pointer.id !== e.pointerId) return;
    lastInput = performance.now();
    const wasBlow=pointer.pBlow;
    const wasSwipe = pointer.swipe;
    const dragged = pointer.drag || Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 8;
    const shakeSwipe=iGame?.endingActive&&performance.now()-pointer.at<800&&Math.abs(e.clientX-pointer.x)>60;
    pointer = null;
    if(shakeSwipe)iGame.shake();
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if(wasBlow){pGame.pointerUp(e.pointerId,false);return;}
    if (!dragged) handleTap(e.clientX, e.clientY);
    else if (wasSwipe) {
      swipeMove(e.clientX, e.clientY);
      swipeEnd();
    }
  });
  function cancelPointer(e) {
    if (!pointer || pointer.id !== e.pointerId) return;
    if(pointer.pBlow)pGame.pointerUp(e.pointerId,true);
    if (pointer.swipe && swipe.active) {
      swipe.gesture += 1;
      swipe.idx = 0;
      swipe.times = [];
      dimSwipeBlocks();
    }
    pointer = null;
    lastInput = performance.now();
  }
  canvas.addEventListener("pointercancel", cancelPointer);
  canvas.addEventListener("lostpointercapture", cancelPointer);
  // 缩放：滚轮，或两根手指捏合 / 张开。大世界可以拉远到看见整颗星球
  const CAM_MIN = 6, CAM_MAX = LARGE_WORLD ? (PLANET.id === "i01" ? 72 : 44) : 16;
  canvas.addEventListener("wheel", (e) => {
    if(pGame?.locked)return;
    camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.02, CAM_MIN, CAM_MAX);
  }, { passive: true });
  const touches = new Map();
  let pinch = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch" || pGame?.locked) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, dist: camDist };
      pointer = null;   // 两根手指时不算点击、也不转镜头
    }
  }, true);
  canvas.addEventListener("pointermove", (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && touches.size >= 2) {
      const [a, b] = [...touches.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      camDist = THREE.MathUtils.clamp(pinch.dist * pinch.d / d, CAM_MIN, CAM_MAX);
      lastInput = performance.now();
      e.stopImmediatePropagation();
    }
  }, true);
  const endTouch = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; };
  canvas.addEventListener("pointerup", endTouch, true);
  canvas.addEventListener("pointercancel", endTouch, true);

  // ---------- 按钮 ----------
  const musicButton = $("#music");
  musicButton.addEventListener("click", () => {
    initAudio();
    sound.musicOn = !sound.musicOn;
    musicButton.classList.toggle("is-on", sound.musicOn);
    sound.music.gain.setTargetAtTime(sound.musicOn ? 0.5 : 0, sound.ctx.currentTime, 0.2);
    if (sound.musicOn) sfx.bubble();
  });
  // 重新开始要连点两次，免得小朋友误点清掉进度
  let resetArmed = 0;
  $("#reset").addEventListener("click", () => {
    if (performance.now() - resetArmed < 3000) {
      // 从头开始：所有星球的进度都清掉，回到猫星球
      clearSave(true);
      window.location.reload();
      return;
    }
    resetArmed = performance.now();
    say("再点一次 <b>↺</b> 就会从头开始，所有星球的词和伙伴都会清空。", { voice: "reset-confirm" });
  });
  $("#play-again").addEventListener("click", () => {
    clearSave();
    window.location.reload();
  });
  $("#keep-walking").addEventListener("click", () => {
    $("#done").hidden = true;
    // 最后一颗星球（没有 next）天上没有能飞的星球，不播这句
    if (PLANET.next) say("小伙伴们会一直跟着你。点一点天上发光的星球，就能飞过去。", { voice: "tap-planet" });
  });
  $("#travel").addEventListener("click", () => travelTo($("#travel").dataset.target));

  function showDoneCard({ narrate = true } = {}) {
    const d = PLANET.done;
    $("#done-emoji").textContent = d.emoji;
    $("#done-title").textContent = d.title;
    $("#done-text").innerHTML = d.text;
    // 有下一颗、而且已经造好，就去下一颗；还在建造中就先留在这里
    const target = PLANET.next && planetUnlocked(PLANET.next) ? PLANET.next : null;
    const button = $("#travel");
    button.hidden = !target;
    button.dataset.target = target || "";
    if (target) button.textContent = `飞往${PLANETS[target].name} 🚀`;
    $("#done").hidden = false;
    if (narrate) say(`<b>${d.title}</b>`, { voice: d.voice });
  }

  // ---------- 星际旅行：存好进度，镜头拉远飞走，刷新后在新星球降落 ----------
  let traveling = false;
  let camBoost = 1;
  function closePlanetMap() {
    $("#planet-map").hidden = true;
    $("#planet-open").setAttribute("aria-expanded", "false");
    $("#planet-open").focus({ preventScroll: true });
  }
  function openPlanetMap() {
    if (!state.started || traveling || iGame?.locked || pGame?.locked || ((IS_I||IS_P)&&practice.busy)) return;
    if (lesson.active || state.challenge || state.digging || state.digPending || state.spelling || blend.word) {
      say("先完成这一小步，再去看看其他星球吧。");
      return;
    }
    route = null;
    save();
    $("#planet-cards").innerHTML = PLANET_ROUTE.map((id, i) => {
      const pl = PLANETS[id], current = id === PLANET.id, unlocked = planetUnlocked(id), done = planetDone(id);
      const data = readStore(planetSaveKey(id));
      const count = current ? made.size : ((data && data.made) || []).length;
      const total = Object.keys(pl.words).length;
      const caption = current ? "正在探索" : pl.soon ? "正在建造中" : done ? "已完成 · 再去逛逛" : unlocked ? "可以出发" : `完成${PLANETS[PLANET_ROUTE[i - 1]].name}后开启`;
      const course = pl.practice || pl.soon ? (pl.order || []).map((l) => `${l.toUpperCase()} ${l}`).join(' · ') : (pl.order || Object.keys(pl.words)).join(' · ').toLowerCase();
      const unit = pl.practice ? "项" : "个词";
      return `<button type="button" class="planet-choice${current ? ' is-current' : ''}" data-planet="${id}" ${!unlocked && !current ? 'disabled' : ''} aria-label="${pl.name}，${caption}"><span class="map-orb orb-${id}" aria-hidden="true"><i></i><i></i><i></i></span><small>${pl.code}</small><b>${pl.name}</b><span class="map-course">${course}</span><span class="map-status">${caption}</span><span class="map-progress">${total ? `${count} / ${total} ${unit}` : "敬请期待"}</span></button>`;
    }).join("");
    $("#planet-map").hidden = false;
    $("#planet-open").setAttribute("aria-expanded", "true");
    $("#planet-close").focus({ preventScroll: true });
  }
  $("#planet-open").addEventListener("click", openPlanetMap);
  $("#planet-close").addEventListener("click", closePlanetMap);
  $("#planet-cards").addEventListener("click", event => {
    const choice = event.target.closest("[data-planet]");
    if (choice && !choice.disabled) travelTo(choice.dataset.planet);
  });
  $("#planet-map").addEventListener("click", event => {
    if (event.target === $("#planet-map")) closePlanetMap();
  });
  $("#planet-map").addEventListener("keydown", event => {
    if (event.key === "Escape") closePlanetMap();
    if (event.key === "Tab") {
      const focusable = [...$("#planet-map").querySelectorAll("button:not(:disabled)")];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  $("#preview-badge").hidden = !PREVIEW_PLANET;
  async function travelTo(id) {
    if (iGame?.locked || pGame?.locked || ((IS_I||IS_P)&&practice.busy) || traveling || lesson.active || state.challenge || state.digging || state.digPending || state.spelling || blend.word) return;
    if (id === PLANET.id) { closePlanetMap(); return; }
    if (!id || !playable(id)) {
      say("那颗星球还在建造中，以后再去吧。", { voice: "locked-planet" });
      return;
    }
    if (!planetUnlocked(id)) {
      say("先完成这颗星球的三个任务，再出发吧！", { voice: "r2-finish-tasks" });
      return;
    }
    traveling = true;
    closePlanetMap();
    $("#done").hidden = true;
    route = null;
    state.challenge = null;
    clearAnswers(false);
    save();
    writeStore(PROGRESS_KEY, { ...progress, ...readStore(PROGRESS_KEY), current: id, letters: true });
    try {
      sessionStorage.setItem(storageKey("yaya-arrive"), id);
    } catch (error) {
      // 没有 sessionStorage 也能飞，只是少了降落动画
    }
    sfx.magic();
    await say(`坐上星星飞船，出发去${PLANETS[id].name}！`, { voice: "travel" });
    sfx.whoosh();
    playOnce(player, "emote-yes");
    const warp = $("#warp");
    warp.hidden = false;
    await tween(1.8, (k) => {
      camBoost = 1 + ease(k) * 9;
      warp.style.opacity = String(Math.max(0, (k - 0.45) / 0.55));
    });
    if (PREVIEW_PLANET) {
      const url = new URL(location.href);
      url.searchParams.set("preview", id);
      window.location.assign(url.href);
    } else window.location.reload();
  }

  // ---------- 进度保存：存在这台设备的浏览器里，刷新后还在 ----------
  const SAVE_KEY = planetSaveKey(PLANET.id);
  const toArr = (v) => v.toArray().map((n) => Number(n.toFixed(5)));
  const toDir = (a) => new V3().fromArray(a).normalize();

  let saveDisabled = false;
  function save() {
    if (!state.started || saveDisabled) return;
    const data = {
      v: 1,
      collected: ALL_LETTERS.filter((l) => crystals[l].collected),
      bag: { ...state.bag },
      placed: [...placed].map(([letter, block]) => ({ letter, dir: toArr(block.userData.dir) })),
      made: [...made],
      altar: altar.dirs ? { dirs: altar.dirs.map(toArr), fwd: toArr(altar.fwd) } : null,
      player: { dir: toArr(player.dir), heading: toArr(player.heading) },
      camFwd: toArr(camFwd),
      starsPicked: fieldStars.filter((st) => st.taken).map((st) => st.index),
      quest: PLANET.practice ? practice.stage : undefined,
    };
    writeStore(SAVE_KEY, data);
  }
  function loadSave() {
    try {
      const data = readStore(SAVE_KEY);
      return data && data.v === 1 ? data : null;
    } catch (error) {
      return null;
    }
  }
  // all = true 时清掉所有星球和当前在哪颗星球
  function clearSave(all = false) {
    // 清掉之后页面马上刷新，离开页面时的自动保存不能再把进度写回去
    saveDisabled = true;
    if (all) {
      for (const id of Object.keys(PLANETS)) writeStore(planetSaveKey(id), null);
      writeStore(PROGRESS_KEY, null);
      writeStore(STAR_KEY, null);
      writeStore("yaya-unicorn",null);
      writeStore("yaya-i-animal-friends",null);
      writeStore("yaya-p-activity",null);
    } else {
      writeStore(SAVE_KEY, null);
      if(IS_I)writeStore("yaya-i-animal-friends",null);
      if(IS_P)writeStore("yaya-p-activity",null);
    }
  }

  function restore(data) {
    for (const star of fieldStars) {
      if ((data.starsPicked || []).includes(star.index)) {
        star.taken = true;
        star.mesh.visible = false;
      }
    }
    syncFieldStars();
    player.dir.copy(toDir(data.player.dir));
    player.heading.copy(tangent(toDir(data.player.heading), player.dir));
    player.radius = surfaceRadius(player.dir);
    camFwd.copy(tangent(toDir(data.camFwd), player.dir));

    for (const letter of data.collected) {
      const crystal = crystals[letter];
      crystal.active = true;
      crystal.collected = true;
      crystal.group.visible = false;
      const idx = obstacles.findIndex((o) => o.crystal === letter);
      if (idx >= 0) obstacles.splice(idx, 1);
    }
    Object.assign(state.bag, data.bag);
    if (IS_LETTERS) {
      for (const letter of [...(PLANET.reviewLetters || []), ...(PLANET.giftLetters || [])]) state.bag[letter] = "has";
      for (const letter of ORDER) {
        if (!crystals[letter].collected) continue;
        placeShelfBlock(letter, false);
        state.bag[letter] = "has";
      }
      // 一开始只亮第一个字母；读档后改成亮下一个还没学的
      const next = ORDER.find((l) => !crystals[l].collected);
      for (const letter of ORDER) {
        if (letter === next || crystals[letter].collected) continue;
        crystals[letter].active = false;
        crystals[letter].group.visible = false;
        const idx = obstacles.findIndex((o) => o.crystal === letter);
        if (idx >= 0) obstacles.splice(idx, 1);
      }
      for (const word of data.made) if (WORDS[word]) made.add(word);
      if (next) activateLetter(next, false);
      else if (PLANET.practice) startPractice(false);
      else enterBlend(true);
      for (const word of made) if (GIFTS[word]) GIFTS[word].restore();
      if (made.size === Object.keys(WORDS).length) state.done = true;
      updateWordCount();
      syncBag();
      return;
    }
    let placedList = data.placed.map((p) => ({ letter: p.letter, dir: toDir(p.dir) }));
    if (data.altar) {
      // 旧版本的格子在别处：按第几个格子，把字母搬到石台上对应的位置
      const oldDirs = data.altar.dirs.map(toDir);
      placedList = placedList.map((p) => {
        const index = oldDirs.findIndex((d) => arc(d, p.dir) < 0.45);
        return index >= 0 ? { letter: p.letter, dir: STAGE.slotDirs[index] } : p;
      });
      spawnAltar(true);
    } else if (WORD.every((l) => crystals[l].collected)) {
      spawnAltar(true);
    }
    for (const p of placedList) addBlock(p.letter, p.dir);
    // 旧版本可能把字母留在格子外面的地上：收回背包
    if (altar.slots.length) {
      for (const [letter, block] of [...placed]) {
        if (altar.slots.some((slot) => slotLetter(slot) === letter)) continue;
        placed.delete(letter);
        const idx = obstacles.findIndex((o) => o.placed === letter);
        if (idx >= 0) obstacles.splice(idx, 1);
        scene.remove(block);
        state.bag[letter] = "has";
      }
    }
    // 存档时字母正在飞：收集了却不在背包、标着“在地上”却没有方块，都放回背包
    for (const letter of ALL_LETTERS) {
      const lost = state.bag[letter] === "empty" && crystals[letter].collected;
      const ghost = state.bag[letter] === "placed" && !placed.has(letter);
      if (lost || ghost) state.bag[letter] = "has";
    }

    for (const word of data.made) if (WORDS[word]) made.add(word);
    if (made.has(FIRST_WORD)) lightUpLater(false);
    for (const word of made) GIFTS[word].restore();
    if (made.size === Object.keys(WORDS).length) state.done = true;
    updateWordCount();
    syncBag();
  }

  // 返回 [字幕, 语音条目]
  function welcomeBack() {
    if (IS_I && !state.done) return [PLANET.introSay, "i01-intro"];
    if (IS_P && !state.done) return [PLANET.introSay, "p01-intro"];
    if (PLANET.practice && !state.done) {
      return COURSE_GAME?(PLANET.id==="s01"?["欢迎回来！跟着<b>金色光点</b>，继续帮助<b>小蛇朋友</b>吧！","s01-welcome"]:[`欢迎回来！跟着<b>金色光点</b>，继续帮${PA.npcName}的忙吧。`,"r2-welcome"]):["欢迎回来！跟着<b>金色光点</b>，继续帮奶奶的忙吧。", "a01-welcome2"];
    }
    if (IS_LETTERS && !state.done) {
      return blend.active
        ? ["欢迎回来！回到石台那里，我们接着拼词。", "go-altar"]
        : ["欢迎回来！跟着金色光点，继续学字母。", "welcome-letters"];
    }
    if (state.done && !PLANET.next) return [YAYA_VOICE_LINES["welcome-last"], "welcome-last"];
    if (state.done) return ["欢迎回来！你的小伙伴们都还在这里。点一点天上发光的星球，就能飞过去。", "welcome-done"];
    const useful = altar.slots.length ? usefulLetter() : null;
    if (useful && WORDS[`${useful}${FAMILY}`]) {
      return [`欢迎回来！背包里的 <b>${useful.toLowerCase()}</b> 可以换进格子，跟着金色光点回去试试。`, "welcome-slot"];
    }
    if (ALL_LETTERS.some((l) => crystals[l].active && !crystals[l].collected)) {
      return ["欢迎回来！跟着地上的<b>金色光点</b>，继续去找水晶。", "welcome-find"];
    }
    return ["欢迎回来！字母还在格子里等你，换一个字母试试？", "welcome-slot"];
  }

  const savedGame = loadSave();
  if (savedGame) {
    try {
      restore(savedGame);
    } catch (error) {
      // 存档坏了就从头开始
      console.error(error);
      clearSave();
      window.location.reload();
      return;
    }
  }
  // 其他星球上拼出来的小伙伴和装扮，也跟着来到这颗星球
  for (const other of Object.values(PLANETS)) {
    if (other.id === PLANET.id || !PLANET_ROUTE.includes(other.id)) continue;
    const data = readStore(planetSaveKey(other.id));
    for (const word of (data && data.made) || []) {
      // 当前星球获得的帽子优先；旧存档的装扮不能覆盖这次的奖励。
      if ((word === "hat" && made.has("cap")) || (word === "cap" && made.has("hat"))) continue;
      if (GIFTS[word] && GIFTS[word].carry !== false) GIFTS[word].restore();
    }
  }
  for (const fp of farPlanets) if (fp.id && state.done && planetUnlocked(fp.id)) fp.base = 0.6;
  if (PLANET.practice) initPractice(savedGame);
  if(navigation){
    player.dir.copy(navigation.constrain(player.dir));player.radius=surfaceRadius(player.dir);
    player.heading.copy(tangent(player.heading,player.dir));camFwd.copy(tangent(camFwd,player.dir));
  }
  updateWordCount();
  syncBag();
  updateWallBadge();
  showStarCount();

  setInterval(save, 2000);
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });

  // 调试入口：在控制台里可以直接操作
  window.__yaya = {get unicorn(){return unicornGuide},iGame,pGame,camera,player,guideTarget:()=>guideTarget(),routeTo:(d,s)=>routeTo(d,s),get tRace(){return tRace},setCamShot:v=>{camShot=v},get snakeRide(){return snakeRide},get state(){return state},get farPlanets(){return farPlanets},round3,camYaw:(a)=>{camYawDelta+=a;},navigation,obstacles,props,R,WALK_SPEED,START_DIR,arc,moveAlong,tangent,getRoute:()=>route,runCourseBlend,runIslandRace, courseTurn,runCourseGame,runWordCard,courseTrace,get companionUI(){return companionUI;},petLedger, habitat, get profileUI(){return profileUI;}, changeAvatar, practice, runApple, runWords, grandmaTurn, initPractice, orchard, traceLetter, speakers, listeningHit, traceBothCases, unicornGuide, tracePaths: TRACE, storageKeys: {progress:storageKey(PROGRESS_KEY), stars:storageKey(STAR_KEY), planet:storageKey(SAVE_KEY), namespace:STORE_PREFIX}, getLearnedLetters: () => [...learnedLetters()], planetUnlocked, secondRewards, scene, clouds, surfaceRadius, wildlife, artVersion: "v55-consistent", camera, swipe, blendWord, hitAnswer, makeLetterQuiz, screenPoint, getAnswers: () => answers, getCameraForward: () => camFwd.toArray(), fieldStars, addStars, starBank, PLANET, pets, travelTo, showDoneCard, lesson, blend, runLesson, blendPick, STAGE, state, crystals, player, placed, altar, made, routeTo, startChallenge, placeLetter, pickUpLetter, spawnAltar, syncBag, dirFrom, save, checkSpelling, makeWord, sound, sfx, bell, startMusic, renderer, getPixelRatio: () => pixelRatio };

  const arriving = (() => {
    try {
      const id = sessionStorage.getItem(storageKey("yaya-arrive"));
      sessionStorage.removeItem(storageKey("yaya-arrive"));
      return id === PLANET.id;
    } catch (error) {
      return false;
    }
  })();
  if (arriving) camBoost = 9;
  $(".chip b").textContent = `芽芽 · ${PLANET.name}`;
  $("#intro .tag").textContent = `${PLANET.name} · ${["s01","t01"].includes(PLANET.id)?"字母音":"短音"} ${PLANET.vowel}`;
  if (arriving) $("#intro h1").textContent = `到达${PLANET.name}！`;
  if (PLANET.intro) $("#intro .card p").innerHTML = PLANET.intro;
  window.YayaBoot && window.YayaBoot.step("准备角色选择");
  const profileUI = YayaProfile.create({THREE,renderer,read:readStore,write:writeStore,change:changeAvatar,start:startButton});
  profileUI.refresh();
  const companionUI=YayaCompanion.create({THREE,renderer,ledger:petLedger,guide:unicornGuide,profile:profileUI,say,quiet:()=>performance.now()-voice.at>8000,onBalance:showStarCount,point:screenPoint,busy:()=>!state.started||lesson.active||practice.busy||state.spelling||!!state.challenge||!!state.digging||!$("#task-card").hidden});
  startButton.textContent = arriving ? "走下飞船" : savedGame ? "继续冒险" : "降落到小星球";
  async function showTurtleArrival(){
    const overview = (PLANET.id === "i01" || PLANET.id === "t01" || IS_P) ? round3?.turtle?.overview : null;
    const arrivalKey = PLANET.id === "i01" ? "yaya-globe-arrival" : IS_P ? "yaya-bubble-arrival" : "yaya-turtle-arrival";
    if(!overview || readStore(arrivalKey))return;
    const wasBusy=practice.busy,cloudsWereVisible=clouds.visible;practice.busy=true;camBoost=1;clouds.visible=false;
    const veil=document.createElement('div');veil.id='turtle-arrival';veil.setAttribute('aria-label',PLANET.id === 'i01' ? '第一次降落：雪花玻璃球全景' : IS_P ? '第一次降落：泡泡星球全景' : '第一次降落：海龟岛全景');
    Object.assign(veil.style,{position:'fixed',inset:'0',zIndex:'35',touchAction:'none'});document.body.append(veil);document.body.classList.add('turtle-arriving');
    const shot=overview(camera.aspect);camShot=shot;updateCamera(0,true);
    try{
      await wait(2);
      const fromPos=shot.position.clone(),fromFocus=shot.focus.clone(),fromUp=shot.up.clone(),up=player.dir.clone(),fwd=camFwd.clone();
      let lift=PLANET.camera?.lift||.72;if(camera.aspect>1.2)lift*=.8;
      const toPos=player.obj.position.clone().addScaledVector(up,camDist*lift).addScaledVector(fwd,-camDist);
      const toFocus=player.obj.position.clone().addScaledVector(up,1.2).addScaledVector(fwd,(PLANET.camera?.ahead||0)+(camera.aspect>1.2?4.8:2.2));
      await tween(3,k=>{const t=k*k*(3-2*k);shot.position.lerpVectors(fromPos,toPos,t);shot.focus.lerpVectors(fromFocus,toFocus,t);shot.up.lerpVectors(fromUp,up,t).normalize();});
      writeStore(arrivalKey,true);
    }finally{camShot=null;practice.busy=wasBusy;clouds.visible=cloudsWereVisible;veil.remove();document.body.classList.remove('turtle-arriving');lastInput=performance.now();}
  }
  startButton.addEventListener("click", () => {
    if(!profileUI.selected) return;
    initAudio();
    state.started = true;
    state.lastProgress = performance.now();
    lastInput = performance.now();
    $("#intro").hidden = true;
    showTurtleArrival();
    sfx.magic();
    if (arriving) {
      say(PLANET.introSay||`欢迎来到<b>${PLANET.name}</b>！跟着金色光点，去找会唱歌的水晶吧！`, { voice: PLANET.introVoice||`arrive-${PLANET.id}` });
    } else if (savedGame) {
      const [html, key] = welcomeBack();
      say(html, { voice: key });
    } else {
      if (IS_LETTERS) say(PLANET.introSay || PLANET.intro ||"这颗星球上住着六个字母。跟着<b>金色光点</b>，去找它们吧！", { voice: PLANET.introVoice || "l-intro" });
      else if (IS_P) say(PLANET.introSay, { voice: PLANET.introVoice });
      else say("跟着地上的<b>金色光点</b>走，去找会唱歌的水晶吧！", { voice: "intro" });
    }
    if(IS_I&&!savedGame)say(YAYA_VOICE_LINES['i01-shake-hint'],{voice:'i01-shake-hint'});
    // 滑到一半刷新后，格子还在，重新等孩子划一次才能领奖。
    if (!IS_LETTERS && savedGame && !state.done && altar.slots.length) {
      const letters = altar.slots.map(slotLetter);
      const word = letters.includes(null) ? "" : letters.join("");
      if (WORDS[word] && !made.has(word)) makeWord(word);
    }
  });

  // ---------- 引导：金色光点、屏幕边箭头、小手 ----------
  let lastInput = performance.now();
  function nearestCrystal() {
    let best = null;
    for (const c of Object.values(crystals)) {
      if (!available(c)) continue;
      if (!best || arc(player.dir, c.dir) < arc(player.dir, best.dir)) best = c;
    }
    return best;
  }

  const trail = [];
  {
    // 光点是带白边的金色圆片，在草地上也看得清
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    g.scale(2, 2);
    g.fillStyle = "#fffbe8";
    g.beginPath();
    g.arc(32, 32, 30, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffbe2e";
    g.beginPath();
    g.arc(32, 32, 21, 0, Math.PI * 2);
    g.fill();
    const tex = srgb(new THREE.CanvasTexture(c));
    const geo = new THREE.PlaneGeometry(0.5, 0.5).rotateX(-Math.PI / 2);
    for (let i = 0; i < 12; i += 1) {
      const dot = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      dot.visible = false;
      scene.add(dot);
      trail.push(dot);
    }
  }
  // 引导目标：手里有能拼新词的字母就回格子，否则去最近的水晶
  function guideTarget() {
    if(LARGE_WORLD && state.started && state.challenge && !state.digPending){
      const candidates=answers.filter(a=>!a.userData.disabled);
      const block=(route && candidates.find(a=>arc(a.userData.dir,route.dir)<.05)) || candidates.sort((a,b)=>arc(player.dir,a.userData.dir)-arc(player.dir,b.userData.dir))[0];
      return block?{dir:block.userData.dir,pos:block.position.clone(),letter:LETTER,stop:1.45,answer:block}:null;
    }
    if (!state.started || state.challenge || state.digging || state.digPending || state.done || state.spelling || lesson.active) return null;
    if (practice.active && practice.stage !== 1) return practice.busy ? null : practiceTarget();
    const letter = altar.slots.length ? usefulLetter() : null;
    if (letter) {
      const dir = altar.dirs[1];
      return { dir, pos: dir.clone().multiplyScalar(surfaceRadius(dir) + 0.5), letter, stop: 1.6 };
    }
    if(pGame?.popActive){const pop=pGame.target();if(pop)return pop;}
    if(iGame?.iceActive){const ice=iGame.target();if(ice)return ice;}
    const shard = sShards?.target();
    if (shard) return shard;
    const crystal = nearestCrystal();
    return crystal ? { dir: crystal.dir, pos: crystal.float.getWorldPosition(new V3()), letter: crystal.letter, stop: 1.8 } : null;
  }

  const guidePathCache={target:null,from:null,time:-2,points:[]};
  function updateTrail(time) {
    const target = guideTarget();
    const total = target ? arc(player.dir, target.dir) - target.stop : 0;
    const f = target ? tangent(target.dir.clone().sub(player.dir), player.dir) : null;
    let path=null;
    if(navigation && target){
      if(route?.waypoints && arc(route.dir,target.dir)<.05)path=route.waypoints.slice(route.index);
      else {
        if(!guidePathCache.target||arc(target.dir,guidePathCache.target)>.05||!guidePathCache.from||arc(player.dir,guidePathCache.from)>1.8||(guidePathCache.points[0]&&!navigation.isClear(player.dir,guidePathCache.points[0]))){
          guidePathCache.target=target.dir.clone();guidePathCache.from=player.dir.clone();guidePathCache.points=navigation.plan(player.dir,target.dir,target.stop);
        }
        path=guidePathCache.points;
      }
    }
    trail.forEach((dot, i) => {
      const d = 0.9 + i * 0.8;
      dot.visible = Boolean(target) && d < total;
      if (!dot.visible) return;
      let dir;
      if(path){let left=d,from=player.dir;for(const next of path){const length=arc(from,next);if(left<=length){dir=moveAlong(from,tangent(next.clone().sub(from),from),left).normalize();break;}left-=length;from=next;}if(!dir){dot.visible=false;return;}}
      else dir=moveAlong(player.dir,f,d).normalize();
      dot.position.copy(dir).multiplyScalar(surfaceRadius(dir) + 0.06);
      dot.quaternion.setFromUnitVectors(UP0, dir);
      const wave = 0.5 + 0.5 * Math.sin(time * 5 - i * 0.9);
      dot.material.opacity = 0.55 + wave * 0.45;
      dot.scale.setScalar(0.75 + wave * 0.45);
    });
  }

  const arrowEl = $("#crystal-arrow");
  // The edge marker is a real touch target: following it still walks over the planet.
  arrowEl.addEventListener("click", () => {
    const target=guideTarget();if(!target)return;
    if(target.answer){visitAnswer(target.answer);return;}
    if(practice.active&&practice.stage!==1){
      if(practice.stage===3&&!COURSE_GAME){const st=practice.stations.filter(s=>!s.done).sort((a,b)=>arc(player.dir,a.dir)-arc(player.dir,b.dir))[0];if(st)practiceTap(st.def.id);}
      else grandmaTap();
    }else if(pGame?.popActive){const t=pGame.target();if(t)routeTo(t.dir,1.2);}else if(iGame?.iceActive){const t=iGame.target();if(t)routeTo(t.dir,1.2);}else if(sShards?.active){const t=sShards.target();if(t)routeTo(t.dir,.3);}else{const c=nearestCrystal();if(c)routeTo(c.dir,2.6,()=>c.lessonDone?startChallenge(c.letter):runLesson(c.letter));}
  });
  function updateArrow() {
    const target = guideTarget();
    if (!target) {
      arrowEl.hidden = true;
      return;
    }
    const pos = target.pos;
    const view = new V3().setFromMatrixColumn(camera.matrixWorld, 2).negate();
    const behind = pos.clone().sub(camera.position).dot(view) < 0;
    const p = pos.clone().project(camera);
    if (!behind && pos.clone().normalize().dot(camera.position.clone().sub(pos))>0 && Math.abs(p.x) < 0.85 && Math.abs(p.y) < 0.8) {
      arrowEl.hidden = true;
      return;
    }
    let x = behind ? -p.x : p.x;
    let y = behind ? -p.y : p.y;
    if (behind && Math.hypot(x, y) < 0.01) y = -1;
    const scale = 1 / Math.max(Math.abs(x) / 0.82, Math.abs(y) / 0.72);
    x *= scale;
    y *= scale;
    arrowEl.hidden = false;
    const edge=36;
    const screenX=THREE.MathUtils.clamp(((x+1)/2)*innerWidth,edge,innerWidth-edge);
    let screenY=THREE.MathUtils.clamp(((1-y)/2)*innerHeight,innerHeight<500?100:144,innerHeight-edge);
    // Direction controls stay above the subtitle, never underneath its replay hit area.
    const caption=document.querySelector('#caption');
    if(!caption.hidden){const r=caption.getBoundingClientRect();if(screenX+edge>r.left&&screenX-edge<r.right&&screenY+edge>r.top&&screenY-edge<r.bottom)screenY=r.top<innerHeight*.4?Math.min(innerHeight-120,r.bottom+edge+8):Math.max(innerHeight<500?100:144,r.top-edge-8);}
    arrowEl.style.left = `${screenX}px`;
    arrowEl.style.top = `${screenY}px`;
    arrowEl.style.setProperty("--angle", `${Math.atan2(-y, x)}rad`);
    arrowEl.style.setProperty("--tint", LETTERS[target.letter].color);
    arrowEl.querySelector("b").textContent = target.answer ? target.answer.userData.choice.value.toUpperCase() : target.letter.toLowerCase();
  }

  const handEl = $("#hint-hand");
  function updateHand() {
    YayaArtUI.updateHintPath([], false);
    let target = null;
    const toScreen = screenPoint;
    handEl.classList.remove("is-swipe");
    if (state.digging || swipe.active) {
      const idle = performance.now() - lastInput;
      if (state.digging && idle > 2500) {
        target = toScreen(crystals[state.digging.letter].float.getWorldPosition(new V3()));
      } else if (swipe.active && !(pointer && pointer.swipe) && idle > 2000) {
        const first = toScreen(swipe.blocks[0].position);
        const last = toScreen(swipe.blocks[swipe.blocks.length - 1].position);
        if (first && last) {
          const phase = (performance.now() % 2000) / 1000;
          const k = THREE.MathUtils.clamp((phase - 0.3) / 1.2, 0, 1);
          target = { x: first.x + (last.x - first.x) * k, y: first.y + (last.y - first.y) * k };
          handEl.classList.add("is-swipe");
          YayaArtUI.updateHintPath(swipe.blocks.map(b => toScreen(b.position)), true, { offsetY: window.innerWidth <= 600 ? -16 : -42 });
        }
      }
      handEl.hidden = !target;
      if (target) {
        handEl.style.left = `${target.x}px`;
        handEl.style.top = `${target.y}px`;
      }
      return;
    }
    if (IS_LETTERS) {
      if (blend.waiting && !lesson.active && performance.now() - lastInput > 4000) {
        const r = document.querySelector(`.slot[data-letter="${blend.word[blend.pos]}"]`).getBoundingClientRect();
        target = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
      handEl.hidden = !target;
      if (target) {
        handEl.style.left = `${target.x}px`;
        handEl.style.top = `${target.y}px`;
      }
      return;
    }
    if (altar.slots.length && !state.done && !state.spelling && !state.challenge && !route && performance.now() - lastInput > 3500) {
      const emptySlot = altar.slots.find((s) => !slotTaken(s));
      const next = usefulLetter();
      const nearAltar = arc(player.dir, altar.dirs[1]) < 5;
      if (state.selected && nearAltar) {
        // 有空格子指空格子；格子满了就指第一个格子里要被换掉的字母
        const first = placed.get(slotLetter(altar.slots[0]));
        if (emptySlot) target = toScreen(emptySlot.position);
        else if (first) target = toScreen(first.position);
      } else if (next && !state.selected && nearAltar) {
        const r = document.querySelector(`.slot[data-letter="${next}"]`).getBoundingClientRect();
        target = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    }
    handEl.hidden = !target;
    if (target) {
      handEl.style.left = `${target.x}px`;
      handEl.style.top = `${target.y}px`;
    }
  }

  // ---------- 主循环 ----------
  const clock = new THREE.Clock();
  let pingTimer = 1.5;
  // 正在学习互动（上课、描字母、听音选、拼词、单词卡、喂蛇、赛跑、和 NPC 说话）时，引路的叮叮声和“我在这里等你”都不出声，免得和发音混在一起
  const learningNow = () => lesson.active || !lessonEl.hidden || state.challenge || state.digging || state.digPending || state.spelling || blend.active || blend.word
    || practice.busy || !!snakeRide?.active || !!tRace?.active || !!iGame?.locked || !!pGame?.locked || swipe.active;
  if(IS_P){
    round3.bubbles.block(()=>!state.started||learningNow()||pGame?.popActive||companionUI.open||!$("#planet-map").hidden||!$("#done").hidden);
    round3.bubbles.onPop(n=>{if(n%3===1&&performance.now()-voice.at>1800)say('噗！',{voice:'p01-sky-pop'});});
  }
  if(IS_I&&round3.atmosphere){
    const ledger=readStore('yaya-i-animal-friends')||{};
    round3.atmosphere.bind({player,arc,routeTo,burst:(...args)=>round3.burst(...args),
      blocked:()=>!state.started||learningNow()||iGame?.iceActive||companionUI.open||!$('#planet-map').hidden||!$('#done').hidden,
      reward:kind=>{if(ledger[kind])return;ledger[kind]=true;writeStore('yaya-i-animal-friends',ledger);addStars(1);},
      sound:kind=>{initAudio();const notes={penguin:[720,980,760],bear:[105,130,95],seal:[330,440,350],fox:[1200,960,1320],snowman:[880,1320,1760]}[kind];notes.forEach((f,i)=>kind==='snowman'?bell(f,{when:i*.08,gain:.045,decay:.25}):tone(f,{when:i*.07,dur:.10,type:kind==='bear'?'triangle':'sine',gain:.055}));}
    });
  }
  updatePlayer(0);
  updateCamera(0, true);

  const renderStats={frames:0,started:performance.now(),lowPower:LOW_POWER};
  window.__yaya.renderStats=renderStats;
  const FRAME_GAP = LOW_POWER ? 1000 / 30 - 2 : 0;
  let lastFrame = 0;
  const perf = { frames: 0, start: 0 };
  function watchFrameRate(now, gap) {
    // 切到后台或卡了一下不算，重新计时
    if (gap > 400 || document.hidden) {
      perf.frames = 0;
      perf.start = now;
      return;
    }
    perf.frames += 1;
    if (now - perf.start < 3000) return;
    const fps = (perf.frames * 1000) / (now - perf.start);
    if (fps < 24 && pixelRatio > 1.25) {
      pixelRatio = Math.max(1.25, pixelRatio - 0.25);
      renderer.setPixelRatio(pixelRatio);
      resize();
    }
    perf.frames = 0;
    perf.start = now;
  }
  function frame(now = 0) {
    if (FRAME_GAP && now - lastFrame < FRAME_GAP) {
      requestAnimationFrame(frame);
      return;
    }
    const gap = now - lastFrame;
    lastFrame = now;
    if (LOW_POWER && state.started) watchFrameRate(now, gap);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    for (let i = tweens.length - 1; i >= 0; i -= 1) {
      const tw = tweens[i];
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.duration);
      tw.fn(k);
      if (k >= 1) {
        tweens.splice(i, 1);
        tw.resolve();
      }
    }

    updatePlayer(dt);
    snakeRide?.update(dt, time);
    tRace?.update(dt, time);
    sShards?.update(dt, time);
    iGame?.update(dt,time);
    if (PLANET.id === "s01" && LARGE_WORLD && habitat?.weather) renderer.toneMappingExposure = .92 - .2 * habitat.weather.value;
    wildlife.update(dt, time);
    secondRewards.update(dt, time);
    if(!pGame?.riding)unicornGuide.update(dt, time);
    companionUI.update();
    habitat?.update(dt,time);
    round3?.update(dt,time,{dir:player.dir,heading:player.heading,obj:player.obj,moving:playerMoving,speed:1});
    STAGE.stars.forEach((star, i) => { star.material.emissiveIntensity = 0.52 + 0.06 * Math.sin(time * 1.6 + i); });
    for (const pet of Object.values(pets)) updatePet(pet, dt);
    if(!iGame?.riding&&!pGame?.riding)player.mixer.update(dt);
    pGame?.update(dt,time);
    for (const pet of Object.values(pets)) pet.mixer.update(dt);
    updateCamera(dt);
    updateAnswers(time);
    updateAnswerTrail();

    for (const crystal of Object.values(crystals)) {
      if (!crystal.active || (crystal.collected && !crystal.group.visible)) continue;
      // 答题时水晶飘高一点，不挡住中间那个答案
      const lift = !LARGE_WORLD && state.challenge === crystal.letter ? 3.1 : 1.5;
      crystal.baseY = crystal.baseY === undefined ? lift : crystal.baseY + (lift - crystal.baseY) * Math.min(1, dt * 4);
      crystal.float.position.y = crystal.baseY + Math.sin(time * 1.8 + crystal.dir.x * 5) * 0.15;
      crystal.float.rotation.y += dt * (state.digging && state.digging.letter === crystal.letter ? 0.25 : 0.8);
    }

    // 水晶“唱歌”：越近越响，左右声道跟着方向走
    pingTimer -= dt;
    if (pingTimer <= 0 && state.started && !learningNow() && sound.ctx) {
      pingTimer = 2.4;
      const right = new V3().setFromMatrixColumn(camera.matrixWorld, 0);
      for (const crystal of Object.values(crystals)) {
        if (!available(crystal)) continue;
        const d = arc(player.dir, crystal.dir);
        const gain = Math.max(0, 1 - d / 22) * 0.11;
        if (gain < 0.008) continue;
        const toCrystal = crystal.group.position.clone().sub(camera.position).normalize();
        bell(LETTERS[crystal.letter].freq * 2, { gain, decay: 1.4, pan: toCrystal.dot(right) * 1.4 });
        bell(LETTERS[crystal.letter].freq * 3, { when: 0.14, gain: gain * 0.4, decay: 1, pan: toCrystal.dot(right) * 1.4 });
      }
    }

    if (state.challenge) {
      const c = crystals[state.challenge];
      if (!LARGE_WORLD && arc(player.dir, c.dir) > 5.5) {
        state.challenge = null;
        clearAnswers();
        say("水晶还在原地等你，随时可以回去。");
      }
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life -= dt;
      p.vel.addScaledVector(p.mesh.position.clone().normalize(), -9 * dt);
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.scale.setScalar(Math.max(0.01, p.life));
      if (p.life <= 0) {
        scene.remove(p.mesh);
        particles.splice(i, 1);
      }
    }

    if (markerLife > 0) {
      markerLife -= dt;
      marker.material.opacity = Math.max(0, markerLife / 0.6) * 0.9;
      marker.scale.setScalar(1 + (0.6 - markerLife) * 1.5);
    }

    clouds.rotation.y += dt * 0.012;
    fireflies.rotation.x += dt * 0.01;
    fireflies.rotation.y += dt * 0.006;
    farPlanets.forEach((p, i) => {
      p.mesh.rotation.y += dt * (0.05 + i * 0.02);
      p.mesh.material.emissiveIntensity = p.base + (p.base > 0.3 ? Math.sin(time * 3) * 0.15 : 0);
      // 大世界：学完以后，下一颗星球挂到镜头前方的天上（总在视野里），带光晕和“点我飞过去”
      if (LARGE_WORLD && state.done && p.id && p.id === PLANET.next && p.base >= 0.6) {
        if (!p.halo) {
          const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 8, 64, 64, 64);
          gr.addColorStop(0, "rgba(255,246,200,.95)"); gr.addColorStop(.45, "rgba(255,214,120,.45)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
          p.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: srgb(new THREE.CanvasTexture(c)), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
          p.halo.scale.setScalar(p.sp.r * 2.7); p.group.add(p.halo);
          p.label.material.map = labelTexture(p.sp.label.replace(/^[A-Z] /, ""), "点我飞过去", { bg: "rgba(255,248,228,.95)", fg: "#6a3f12" }); p.label.material.fog = false; p.label.material.needsUpdate = true;
          p.label.visible = true; p.label.position.y = -p.sp.r * 1.75; p.label.scale.set(p.sp.r * 2.6, p.sp.r * 1.4, 1);
          // 挂得离镜头很近（按比例缩小），所以不会被云、沙丘、树挡住
          p.group.traverse((o) => { if (o.material) { o.material.fog = false; if (o.isSprite) { o.material.depthTest = false; o.material.depthWrite = false; } o.material.needsUpdate = true; } o.renderOrder = 30; });
          p.halo.renderOrder = 29;
        }
        // 放在镜头自己的坐标里：屏幕右上方、字幕下面，镜头怎么转都在画面里
        const D = 11, half = D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const want = new V3(half * camera.aspect * (camera.aspect < 1 ? 0.45 : 0.6), half * 0.22, -D).applyMatrix4(camera.matrixWorld);
        p.group.scale.setScalar((camera.aspect < 1 ? .9 : 1.05) * D / 60);
        p.group.position.lerp(want, p.placed ? 1 - Math.exp(-dt * 2) : 1); p.placed = true;
        p.group.quaternion.copy(camera.quaternion);
        p.halo.material.opacity = 0.2 + Math.sin(time * 2.4) * 0.08;
        p.mesh.material.emissiveIntensity = 0.14 + Math.sin(time * 3) * 0.06;
      }
    });

    if (state.started && !traveling && $("#planet-map").hidden && IS_LETTERS && blend.active && !blend.word && !state.spelling && !state.done && !lesson.active
      && performance.now() > blend.cooldown && arc(player.dir, STAGE.center) < 3.4) {
      const word = nextBlendWord();
      if (word) startBlendWord(word);
    }
    updateAnt(dt, time);
    updatePractice(dt, time);
    if(IS_P)round3.familyPose?.(time);
    if (state.started && !state.spelling && !state.challenge && !state.digging && !state.digPending && !blend.word && !traveling && !lesson.active && $("#done").hidden && say.last && say.last.key
      && !companionUI.open && !learningNow() && performance.now() - lastInput > 25000 && performance.now() - voice.at > 25000) {
      say("我在这里等你，跟着金色光点走吧。",{voice:"pet-idle"});
    }
    updateFieldStars(dt, time);
    updateBat(dt, time);
    updatePaint(dt);
    updateStars(time);
    updateTrail(time);
    updateAltar(time);
    updateArrow();
    updateHand();

    renderer.render(scene, camera);
    if(renderStats.frames===0)window.YayaBoot && window.YayaBoot.ready();
    renderStats.frames++;renderStats.calls=renderer.info.render.calls;renderStats.triangles=renderer.info.render.triangles;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})().catch(function(error){if(window.YayaBoot)window.YayaBoot.fail(error);console.error(error);});
