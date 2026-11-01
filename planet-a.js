/* A · 苹果星球：一颗星球只学一个字母 a。苹果园的刺猬奶奶给孩子三个任务：
   一、找到水晶，认识 A a（认识它 / 两种样子 / 跟着说 / 描大写小写 / 听出它 / 挖水晶）；
   二、五棵苹果树上挂着写着 A a 的大苹果，描一描它就掉下来（提示一次比一次少）；
   三、单词野餐：cat、hat、bag、map、ant，把单词里缺的 a 描出来，再一起读。
   所有模型都用代码积木拼成，参照用户给的低多边形果园参考图。 */
(() => {
  const RED = "#e8655a";

  // 第几次描（按完成数，不按木牌）：提示从完整虚线 → 只有圆点 → 只有起点
  const LEVELS = [
    { cases: ["upper"], guide: "full", voice: "a01-upper", text: "这是<b>大写 A</b>。" },
    { cases: ["lower"], guide: "full", voice: "a01-lower", text: "这是<b>小写 a</b>。" },
    { cases: ["upper"], guide: "dots", pre: "a01-upper", voice: "a01-dots", text: "<b>大写 A</b>：这次只有小圆点，把它们连起来。" },
    { cases: ["lower"], guide: "dots", pre: "a01-lower", voice: "a01-dots", text: "<b>小写 a</b>：这次只有小圆点，把它们连起来。" },
    { cases: ["upper", "lower"], guide: "start", pre: "a01-both", voice: "a01-start", text: "大写和小写都要描。这次只有起点，你自己来写！" },
  ];

  // 任务二：五棵苹果树，每棵挂一个写着 A a 的大苹果
  const STATIONS = [
    { id: "apple1", title: "第 1 个字母苹果", icon: "🍎", spot: [44, 105] },
    { id: "apple2", title: "第 2 个字母苹果", icon: "🍎", spot: [66, -148] },
    { id: "apple3", title: "第 3 个字母苹果", icon: "🍎", spot: [92, 24] },
    { id: "apple4", title: "第 4 个字母苹果", icon: "🍎", spot: [112, 168] },
    { id: "apple5", title: "第 5 个字母苹果", icon: "🍎", spot: [62, -38] },
  ];
  // 任务三：单词野餐。都是孩子单词卡里最简单的短 a 词，读音都已经有了
  const WORD_CARDS = [
    { id: "w-cat", word: "cat", emoji: "🐱", zh: "小猫" },
    { id: "w-hat", word: "hat", emoji: "🎩", zh: "帽子" },
    { id: "w-bag", word: "bag", emoji: "🎒", zh: "书包" },
    { id: "w-map", word: "map", emoji: "🗺️", zh: "地图" },
    { id: "w-ant", word: "ant", emoji: "🐜", zh: "蚂蚁" },
  ];
  // 单词里那个 a 用哪种提示：前两个完整、中间两个圆点、最后一个只有起点
  const WORD_GUIDES = ["full", "full", "dots", "dots", "start"];

  const planet = {
    id: "a01",
    kind: "letters",
    practice: true,
    code: "A",
    name: "苹果星球",
    vowel: "/æ/",
    seed: 31,
    grass: [0.30, 0.055],
    first: [],
    later: [],
    next: "s01",
    order: ["a"],
    letters: { a: { color: RED, freq: 587.33 } },
    // 只有一个字母时，听辨题的另外两个声音从这里挑
    quizOthers: ["s", "t", "m", "p"],
    words: Object.fromEntries([...STATIONS.map((s) => [s.id, s.title]), ...WORD_CARDS.map((w) => [w.id, w.word])]),
    spots: { a: [30, 28] },
    clearSpots: STATIONS.filter((s) => s.spot).map((s) => s.spot),
    tent: [30, -72],
    // tree / treeHigh 在这颗星球上换成自己做的低多边形圆树和塔形松树
    props: { tree: 20, treeHigh: 14, rocks: 5, stones: 6, plant: 22 },
    // 镜头比别的星球低一点、往前看一点：既能看到天空，又能看到一片树林
    camera: { lift: 0.82, ahead: 1.8, dist: 10.5 },
    // 出生点和石台周围留的空地小一点，让树把平台围起来
    clearRadius: 2.85,
    crystalClear: 2.4,
    challenges: {},
    intro: "苹果园的刺猬奶奶遇到了麻烦。<br />帮她完成三个任务，认识 <b>大写 A 和小写 a</b>，<br />再读一读藏着 a 的小单词。",
    introVoice: "a01-intro2",
    introSay: "这里是<b>苹果星球</b>！苹果园的奶奶，正在等你呢。跟着<b>金色光点</b>，去找她吧！",
    done: {
      emoji: "🍎🦔🥧",
      title: "A a！",
      text: "你学会了 <b>A a</b>，大写、小写都会写啦，<br />还读了 <b>cat、hat、bag、map、ant</b>。奶奶做了一个苹果派！",
      voice: "a01-done",
    },
  };

  // 后面两颗还在建造：星球地图上先露个脸
  const soon = {
    s01: { id: "s01", soon: true, kind: "letters", code: "S", name: "沙漠星球", order: ["s"], words: {}, letters: {} },
    t01: { id: "t01", soon: true, kind: "letters", code: "T", name: "海岛星球", order: ["t"], words: {}, letters: {} },
  };

  // ---------- 积木模型 ----------
  function apple(T, r = 0.12) {
    const g = new T.Group();
    const body = new T.Mesh(window.YayaRound3.roundedBox(T, 0.3), new T.MeshStandardMaterial({ color: "#e2463f", roughness: 0.45 }));
    body.scale.set(r * 1.9, r * 1.75, r * 1.9);
    body.castShadow = true;
    const shine = new T.Mesh(window.YayaRound3.roundedBox(T, 0.3), new T.MeshBasicMaterial({ color: "#ffb3a1" }));
    shine.scale.setScalar(r * 0.42);
    shine.position.set(-r * 0.42, r * 0.38, r * 0.6);
    const stem = new T.Mesh(new T.CylinderGeometry(r * 0.08, r * 0.1, r * 0.55, 5), new T.MeshLambertMaterial({ color: "#7a5233" }));
    stem.position.y = r * 1.05;
    const leaf = new T.Mesh(window.YayaRound3.roundedBox(T, 0.3), new T.MeshLambertMaterial({ color: "#6fb24f" }));
    leaf.scale.set(r * 0.5, r * 0.2, r * 0.3);
    leaf.position.set(r * 0.28, r * 1.05, 0);
    leaf.rotation.z = -1.1;
    g.add(body, shine, stem, leaf);
    return g;
  }

  function appleTree(T, rnd, scale = 1) {
    const g = new T.Group();
    const trunk = new T.Mesh(new T.CylinderGeometry(0.11, 0.18, 1.0, 8), new T.MeshStandardMaterial({ color: "#9b6a45", roughness: 0.9 }));
    trunk.position.y = 0.5;
    trunk.castShadow = true;
    g.add(trunk);
    const blobs = [[0, 1.35, 0, 0.62], [-0.38, 1.12, 0.1, 0.44], [0.36, 1.18, -0.12, 0.46], [0.05, 1.7, 0.05, 0.4]];
    const crown = blob(T, blobs.map(([x, y, z, r]) => [x, y, z, r * 1.05, r * 0.95, r * 1.05]), LOWP ? 0.3 : 0.24, LOWP ? 0.34 : 0.28, ["#7cbe58", "#67aa4c", "#94cf68", "#6fb552"], rnd);
    g.add(crown);
    for (let i = 0; i < 7; i += 1) {
      const [x, y, z, r] = blobs[i % 3];
      const a = rnd() * Math.PI * 2;
      const h = (rnd() - 0.6) * 0.9;
      const fruit = apple(T, 0.085 + rnd() * 0.02);
      fruit.position.set(x + Math.cos(a) * r * 1.1 * Math.sqrt(1 - h * h), y + h * r * 1.05, z + Math.sin(a) * r * 1.1 * Math.sqrt(1 - h * h));
      g.add(fruit);
    }
    flatten(T, g);
    g.scale.setScalar(scale);
    return g;
  }

  // 刺猬奶奶：棕色身子、背上一排排小刺、红头巾、圆眼镜、奶油色围裙
  function hedgehog(T, kit) {
    const { group, batch } = kit;
    const root = new T.Group();
    const body = group(root, "HedgehogBody", [0, 0, 0]);
    const fur = "#b07a55", face = "#f7dfc4", quill = "#6e4630", quill2 = "#8a5a3a";
    batch(body, [
      [[-0.13, 0.05, 0.06], [0.15, 0.1, 0.22], "#5a3b2b"], [[0.13, 0.05, 0.06], [0.15, 0.1, 0.22], "#5a3b2b"],
      [[0, 0.38, 0], [0.6, 0.56, 0.52], fur],
      [[0, 0.33, 0.25], [0.42, 0.44, 0.05], "#fff4e4"], [[0, 0.54, 0.258], [0.44, 0.06, 0.04], "#e98d86"],
      [[0, 0.3, 0.282], [0.13, 0.12, 0.02], "#e2534a"], [[0.04, 0.38, 0.284], [0.06, 0.035, 0.015], "#6fb24f"],
      [[-0.33, 0.42, 0.08], [0.1, 0.24, 0.12], fur, [0, 0, 0.35]], [[0.33, 0.42, 0.08], [0.1, 0.24, 0.12], fur, [0, 0, -0.35]],
    ], true);
    const head = group(body, "HedgehogHead", [0, 0.84, 0.04]);
    batch(head, [
      [[0, 0, 0], [0.48, 0.42, 0.44], fur],
      [[0, -0.04, 0.17], [0.36, 0.3, 0.12], face],
      [[0, -0.08, 0.27], [0.15, 0.11, 0.13], face],
      [[0, -0.06, 0.34], [0.065, 0.055, 0.04], "#3a2828"],
      [[-0.085, 0.05, 0.235], [0.05, 0.065, 0.02], "#2c2230"], [[0.085, 0.05, 0.235], [0.05, 0.065, 0.02], "#2c2230"],
      [[-0.075, 0.07, 0.248], [0.018, 0.022, 0.008], "#ffffff"], [[0.095, 0.07, 0.248], [0.018, 0.022, 0.008], "#ffffff"],
      [[-0.14, -0.06, 0.23], [0.07, 0.035, 0.015], "#f2a39c"], [[0.14, -0.06, 0.23], [0.07, 0.035, 0.015], "#f2a39c"],
      [[-0.18, 0.19, 0.0], [0.1, 0.09, 0.07], "#8d5b3d"], [[0.18, 0.19, 0.0], [0.1, 0.09, 0.07], "#8d5b3d"],
      // 红头巾和白点点
      [[0, 0.21, -0.03], [0.52, 0.09, 0.48], "#e2534a"], [[0, 0.15, -0.2], [0.5, 0.12, 0.12], "#e2534a"],
      [[-0.12, 0.257, 0.08], [0.05, 0.012, 0.05], "#fff1e6"], [[0.1, 0.257, -0.05], [0.05, 0.012, 0.05], "#fff1e6"], [[0.0, 0.257, 0.17], [0.045, 0.012, 0.045], "#fff1e6"],
    ], true);
    // 小刺：从背后向外、微微朝上
    const quills = [];
    for (const [y, r, n] of [[0.24, 0.31, 9], [0.42, 0.33, 10], [0.6, 0.3, 9], [0.8, 0.27, 8], [0.98, 0.2, 6]]) {
      for (let i = 0; i < n; i += 1) {
        const a = -1.35 + (2.7 * i) / (n - 1);
        const x = Math.sin(a) * r, z = -Math.cos(a) * r * 0.92 - 0.02;
        quills.push([[x, y, z], [0.085, 0.085, 0.24], (i + n) % 2 ? quill : quill2, [-0.45, Math.PI - a, 0, "YXZ"]]);
      }
    }
    batch(body, quills, true);
    // 圆眼镜
    const rim = new T.MeshStandardMaterial({ color: "#5a4636", roughness: 0.5 });
    for (const x of [-0.085, 0.085]) {
      const ring = new T.Mesh(new T.TorusGeometry(0.058, 0.012, 6, 14), rim);
      ring.position.set(x, 0.05, 0.255);
      head.add(ring);
    }
    const bridge = new T.Mesh(new T.BoxGeometry(0.06, 0.012, 0.012), rim);
    bridge.position.set(0, 0.06, 0.255);
    head.add(bridge);
    root.userData.kind = "grandma";
    return { root, body, head };
  }

  function basket(T) {
    const g = new T.Group();
    const wicker = new T.MeshStandardMaterial({ color: "#c98f55", roughness: 0.95, flatShading: true });
    const bowl = new T.Mesh(new T.CylinderGeometry(0.34, 0.26, 0.26, 10, 1, true), wicker);
    bowl.position.y = 0.15;
    const bottom = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.04, 10), wicker);
    bottom.position.y = 0.03;
    const rimRing = new T.Mesh(new T.TorusGeometry(0.34, 0.035, 5, 14), new T.MeshStandardMaterial({ color: "#a8703f", roughness: 0.9 }));
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 0.28;
    const handle = new T.Mesh(new T.TorusGeometry(0.3, 0.03, 5, 14, Math.PI), rimRing.material);
    handle.position.y = 0.28;
    // 一圈深浅相间的编织纹
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      const band = new T.Mesh(new T.BoxGeometry(0.05, 0.24, 0.02), new T.MeshStandardMaterial({ color: i % 2 ? "#b77d47" : "#dca46a", roughness: 0.95 }));
      band.position.set(Math.cos(a) * 0.305, 0.15, Math.sin(a) * 0.305);
      band.rotation.y = -a + Math.PI / 2;
      g.add(band);
    }
    g.add(bowl, bottom, rimRing, handle);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const slots = [[-0.12, 0.26, 0.05], [0.12, 0.27, -0.04], [0, 0.29, -0.14], [-0.03, 0.31, 0.15], [0.02, 0.4, 0.0]];
    return { group: g, slots, apples: [] };
  }

  function pie(T) {
    const g = new T.Group();
    const plate = new T.Mesh(new T.CylinderGeometry(0.42, 0.38, 0.04, 20), new T.MeshStandardMaterial({ color: "#fffaf0", roughness: 0.4 }));
    plate.position.y = 0.02;
    const crust = new T.Mesh(new T.CylinderGeometry(0.33, 0.3, 0.14, 16), new T.MeshStandardMaterial({ color: "#e8b46a", roughness: 0.8, flatShading: true }));
    crust.position.y = 0.11;
    const filling = new T.Mesh(new T.CylinderGeometry(0.29, 0.29, 0.02, 16), new T.MeshStandardMaterial({ color: "#c9573e", roughness: 0.6 }));
    filling.position.y = 0.185;
    g.add(plate, crust, filling);
    const lattice = new T.MeshStandardMaterial({ color: "#d99b52", roughness: 0.8 });
    for (let i = -2; i <= 2; i += 1) {
      const a = new T.Mesh(new T.BoxGeometry(0.56 - Math.abs(i) * 0.1, 0.03, 0.05), lattice);
      a.position.set(0, 0.2, i * 0.1);
      const b = a.clone();
      b.rotation.y = Math.PI / 2;
      b.position.set(i * 0.1, 0.205, 0);
      g.add(a, b);
    }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return g;
  }

  const glowTex = (T) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 18, 64, 64, 62);
    grad.addColorStop(0, "rgba(255,226,140,0)");
    grad.addColorStop(0.55, "rgba(255,214,110,.55)");
    grad.addColorStop(0.75, "rgba(255,240,190,.9)");
    grad.addColorStop(1, "rgba(255,226,140,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  };

  // ---------- 参考图里的低多边形树：圆圆的大树冠、一层层的塔形松树、小灌木 ----------
  const jitter = (geo, amount, rnd) => {
    const pos = geo.attributes.position;
    const seen = new Map();
    for (let i = 0; i < pos.count; i += 1) {
      const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
      if (!seen.has(key)) seen.set(key, 1 + (rnd() - 0.5) * amount);
      const k = seen.get(key);
      pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const matCache = new Map();
  const toon = (T, color, rough = 0.88) => {
    const key = color + rough;
    if (!matCache.has(key)) matCache.set(key, new T.MeshStandardMaterial({ color, roughness: rough, metalness: 0, flatShading: true }));
    return matCache.get(key);
  };

  // ---------- Round 4: rounded-cube clusters (same look as the big trees on the A planet) ----------
  let RB = null, CUBEG = null, blobMat = null;
  function blobMaterial(T) { return blobMat || (blobMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 })); }
  // lobes: [cx,cy,cz,rx,ry,rz] super-ellipsoids; only the visible shell of the voxel fill is emitted, merged into ONE mesh.
  function blob(T, lobes, step, size, palette, rnd, opts = {}) {
    const src = opts.cube ? (CUBEG || (CUBEG = new T.BoxGeometry(1, 1, 1))) : (RB || (RB = window.YayaRound3.roundedBox(T, 0.2)));
    const sg = src.index ? src.toNonIndexed() : src, sp = sg.attributes.position, sn = sg.attributes.normal;
    const P = 2.7, inside = (x, y, z) => lobes.some(([cx, cy, cz, rx, ry, rz]) => Math.pow(Math.abs((x - cx) / rx), P) + Math.pow(Math.abs((y - cy) / ry), P) + Math.pow(Math.abs((z - cz) / rz), P) < 1);
    let minY = 1e9, maxY = -1e9;
    lobes.forEach(([, cy, , , ry]) => { minY = Math.min(minY, cy - ry); maxY = Math.max(maxY, cy + ry); });
    const x0 = Math.min(...lobes.map((l) => l[0] - l[3])), x1 = Math.max(...lobes.map((l) => l[0] + l[3]));
    const z0 = Math.min(...lobes.map((l) => l[2] - l[5])), z1 = Math.max(...lobes.map((l) => l[2] + l[5]));
    const positions = [], normals = [], colors = [], col = new T.Color();
    for (let y = minY; y <= maxY + 1e-6; y += step) for (let x = x0; x <= x1; x += step) for (let z = z0; z <= z1; z += step) {
      if (!inside(x, y, z)) continue;
      if (inside(x + step, y, z) && inside(x - step, y, z) && inside(x, y + step, z) && inside(x, y - step, z) && inside(x, y, z + step) && inside(x, y, z - step)) continue;
      const t = (y - minY) / Math.max(0.01, maxY - minY), sz = size * (0.92 + rnd() * 0.14);
      col.set(palette[Math.floor(rnd() * palette.length)]).multiplyScalar((0.82 + 0.36 * t) * (0.96 + rnd() * 0.08));
      const ox = x + (rnd() - 0.5) * step * 0.12, oy = y + (rnd() - 0.5) * step * 0.12, oz = z + (rnd() - 0.5) * step * 0.12;
      for (let i = 0; i < sp.count; i += 1) {
        positions.push(sp.getX(i) * sz + ox, sp.getY(i) * sz + oy, sp.getZ(i) * sz + oz);
        normals.push(sn.getX(i), sn.getY(i), sn.getZ(i)); colors.push(col.r, col.g, col.b);
      }
    }
    if (sg !== src) sg.dispose();
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    g.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
    g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    g.computeBoundingSphere();
    const m = new T.Mesh(g, blobMaterial(T)); m.castShadow = true; m.receiveShadow = true; return m;
  }
  // Merge every mesh under g into ONE vertex-coloured mesh (fewer draw calls; materials' colours baked to vertices).
  function flatten(T, g) {
    g.updateMatrixWorld(true);
    const inv = new T.Matrix4().copy(g.matrixWorld).invert(), m4 = new T.Matrix4(), nm = new T.Matrix3(), v = new T.Vector3(), n = new T.Vector3();
    const positions = [], normals = [], colors = [], meshes = [];
    g.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) {
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, pp = geo.attributes.position, nn = geo.attributes.normal, cc = geo.attributes.color;
      m4.multiplyMatrices(inv, o.matrixWorld); nm.getNormalMatrix(m4);
      const base = o.material.color ? o.material.color : new T.Color('#ffffff');
      for (let i = 0; i < pp.count; i += 1) {
        v.fromBufferAttribute(pp, i).applyMatrix4(m4); n.fromBufferAttribute(nn, i).applyMatrix3(nm).normalize();
        positions.push(v.x, v.y, v.z); normals.push(n.x, n.y, n.z);
        if (cc && o.material.vertexColors) colors.push(cc.getX(i), cc.getY(i), cc.getZ(i)); else colors.push(base.r, base.g, base.b);
      }
      if (geo !== o.geometry) geo.dispose();
      o.parent.remove(o);
    }
    const out = new T.BufferGeometry();
    out.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    out.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
    out.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    out.computeBoundingSphere();
    const mesh = new T.Mesh(out, blobMaterial(T)); mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
    return g;
  }
  const LOWP = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const CANOPY = ["#7fc04f", "#68b04a", "#93cf5c", "#57a24c", "#a9d65f", "#d4d885", "#e6b7c2", "#ecd69b"];
  function roundTree(T, rnd) {
    const g = new T.Group();
    const h = 0.9 + rnd() * 0.5;
    const trunk = new T.Mesh(new T.CylinderGeometry(0.11, 0.2, h, 8), toon(T, "#8f6040"));
    trunk.position.y = h / 2;
    g.add(trunk);
    const r = 0.75 + rnd() * 0.35, pal = [CANOPY[Math.floor(rnd() * 4)], CANOPY[Math.floor(rnd() * 4)], CANOPY[(Math.floor(rnd() * 4) + 1) % 4]];
    const lobes = [[0, h + r * 0.78, 0, r, r * 0.88, r]];
    if (rnd() < 0.55) lobes.push([(rnd() < 0.5 ? -1 : 1) * r * 0.75, h + r * 0.35, (rnd() - 0.5) * 0.4, r * 0.58, r * 0.5, r * 0.58]);
    const crown = blob(T, lobes, r * (LOWP ? 0.5 : 0.4), r * (LOWP ? 0.56 : 0.46), pal, rnd);
    g.add(crown);
    return flatten(T, g);
  }
  const PINE = [["#3f9a6a", "#4fae73"], ["#2f8a78", "#43a28a"], ["#6cb7a0", "#8fd0b5"], ["#4c9f57", "#67b862"]];
  function pineTree(T, rnd) {
    const g = new T.Group();
    const [dark, light] = PINE[Math.floor(rnd() * PINE.length)];
    const trunk = new T.Mesh(new T.CylinderGeometry(0.09, 0.14, 0.5, 8), toon(T, "#7d5438"));
    trunk.position.y = 0.25;
    g.add(trunk);
    const tiers = 3 + Math.floor(rnd() * 2), lobes = [];
    for (let i = 0; i < tiers; i += 1) { const k = 1 - i / (tiers + 0.6); lobes.push([0, 0.78 + i * 0.5, 0, 0.66 * k, 0.3, 0.66 * k]); }
    g.add(blob(T, lobes, LOWP ? 0.28 : 0.22, LOWP ? 0.32 : 0.26, [dark, light, dark], rnd));
    return flatten(T, g);
  }
  function bush(T, rnd) {
    const g = new T.Group();
    const lobes = [];
    for (let i = 0; i < 3; i += 1) { const r = 0.22 + rnd() * 0.16; lobes.push([(i - 1) * 0.25, r * 0.75, (rnd() - 0.5) * 0.2, r * 1.1, r * 0.9, r * 1.1]); }
    g.add(blob(T, lobes, 0.14, 0.17, [CANOPY[Math.floor(rnd() * 4)], CANOPY[Math.floor(rnd() * 4)], CANOPY[1]], rnd));
    return flatten(T, g);
  }

  // 任务二的苹果树：比普通树大一圈，侧枝上挂一个大大的字母苹果
  function letterTexture(T) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 160;
    const g = c.getContext("2d");
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = '900 120px "Arial Rounded MT Bold", "Nunito", Arial, sans-serif';
    g.lineJoin = "round";
    for (const [ch, x] of [["A", 84], ["a", 176]]) {
      g.lineWidth = 16;
      g.strokeStyle = "rgba(120,30,30,.35)";
      g.strokeText(ch, x, 88);
      g.fillStyle = "#fffaf0";
      g.fillText(ch, x, 84);
    }
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    return tex;
  }
  function letterTree(T, rnd) {
    const root = new T.Group();
    const tree = appleTree(T, rnd, 1.45);
    root.add(tree);
    const hang = new T.Group();
    // 挂在树冠下沿、朝石台那一面（孩子多半从石台那边走过来），不会被树干挡住
    hang.position.set(0.5, 0.98, 0.85);
    const string = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.5, 4), toon(T, "#7a5233"));
    string.position.y = 0.44;
    const big = apple(T, 0.42);
    const label = new T.Sprite(new T.SpriteMaterial({ map: letterTexture(T), depthWrite: false }));
    label.scale.set(0.92, 0.58, 1);
    hang.add(string, big, label);
    root.add(hang);
    return { root, hang, big, label };
  }

  // ---------- 装饰：果树、落地的苹果、彩旗、野餐垫、刺猬奶奶和篮子 ----------
  function decorate(ctx) {
    const { THREE: T, scene, STAGE, freeSpot, obstacles, place, rng, dirFrom, kit } = ctx;
    const root = new T.Group();
    root.name = "a01-orchard";
    scene.add(root);
    // 平台四周围一圈树（参考图里树林把画面框起来）：正前方是镜头和角色之间，留空不种
    if (ctx.registerProp && ctx.blocked) {
      const up = STAGE.up, fwd = STAGE.front;
      const side = new T.Vector3().crossVectors(up, fwd);
      for (let i = 0; i < 30; i += 1) {
        const a = (i / 30) * Math.PI * 2 + (rng() - 0.5) * 0.2;
        if (Math.cos(a) > 0.55) continue;
        const dist = 3.7 + rng() * 1.6;
        const t = fwd.clone().multiplyScalar(Math.cos(a)).addScaledVector(side, Math.sin(a));
        const spot = ctx.moveAlong(STAGE.center, t, dist).normalize();
        if (ctx.blocked(spot)) continue;
        const pine = rng() < 0.42;
        const tree = pine ? pineTree(T, rng) : roundTree(T, rng);
        tree.scale.setScalar(0.85 + rng() * 0.45);
        place(tree, spot, new T.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5), -0.05);
        ctx.registerProp(tree, spot, 0.5);
      }
    }
    // 几棵挂满小苹果的果树（会被当作道具：挡住角色时变半透明）
    for (let i = 0; i < 6; i += 1) {
      const spot = freeSpot(0.9);
      if (!spot) continue;
      const tree = appleTree(T, rng, 0.95 + rng() * 0.45);
      place(tree, spot, new T.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5));
      if (ctx.registerProp) ctx.registerProp(tree, spot, 0.6);
      else { root.add(tree); obstacles.push({ dir: spot, r: 0.6 }); }
      // 树下掉了一两个苹果
      for (let k = 0; k < 2; k += 1) {
        const a = apple(T, 0.1);
        const off = ctx.moveAlong(spot, ctx.tangent(new T.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5), spot), 0.7 + rng() * 0.4);
        place(a, off.normalize(), new T.Vector3(1, 0, 0), 0.08);
        a.rotation.z += rng();
        root.add(a);
      }
    }
    // 石台两根星星柱子之间拉一串彩旗
    const flagColors = ["#f39a8f", "#f7c65d", "#8fcaa9", "#9cc4ec", "#d6a6e4"];
    const rope = [];
    for (let i = 0; i <= 12; i += 1) {
      const t = i / 12;
      rope.push(new T.Vector3(-2.45 + 4.9 * t, 1.62 - Math.sin(t * Math.PI) * 0.38, -0.5));
    }
    const ropeMesh = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rope), 24, 0.012, 4), new T.MeshBasicMaterial({ color: "#fff3dc" }));
    STAGE.group.add(ropeMesh);
    const flagGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(-0.11, 0, 0), new T.Vector3(0.11, 0, 0), new T.Vector3(0, -0.24, 0)]);
    flagGeo.computeVertexNormals();
    for (let i = 1; i < 12; i += 1) {
      const flag = new T.Mesh(flagGeo, new T.MeshLambertMaterial({ color: flagColors[i % 5], side: T.DoubleSide }));
      flag.position.copy(rope[i]);
      STAGE.group.add(flag);
    }
    // 野餐垫（红白格子）在石台后面那片平地上：从出生点看过去，越过石台就能看到奶奶
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g2 = cv.getContext("2d");
    for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) {
      g2.fillStyle = (x + y) % 2 ? "#fff6ea" : "#ef7d73";
      g2.fillRect(x * 16, y * 16, 16, 16);
    }
    const blanketTex = new T.CanvasTexture(cv);
    blanketTex.encoding = T.sRGBEncoding;
    blanketTex.magFilter = T.NearestFilter;
    const local = (x, z) => STAGE.group.localToWorld(new T.Vector3(x, STAGE.top, z)).normalize();
    const blanket = new T.Mesh(new T.BoxGeometry(1.7, 0.03, 1.25), new T.MeshLambertMaterial({ map: blanketTex }));
    blanket.receiveShadow = true;
    const blanketDir = local(0.95, -1.95);
    place(blanket, blanketDir, STAGE.front, 0.02);
    root.add(blanket);
    // 刺猬奶奶站在垫子旁边，面朝出生点那边
    const granny = hedgehog(T, kit(T));
    const grannyDir = local(2.0, -1.75);
    place(granny.root, grannyDir, new T.Vector3(-0.35, 0, 1));
    granny.root.scale.setScalar(1.05);
    root.add(granny.root);
    obstacles.push({ dir: grannyDir, r: 0.45 });
    // 篮子放在垫子上
    const bk = basket(T);
    place(bk.group, local(0.45, -1.75), STAGE.front, 0.04);
    root.add(bk.group);
    const piePlate = pie(T);
    place(piePlate, local(1.3, -2.05), STAGE.front, 0.04);
    piePlate.visible = false;
    root.add(piePlate);
    return { root, granny, basket: bk, pie: piePlate, local };
  }

  const TASKS = [
    {type:'lesson',icon:'💎',title:'找到发光的水晶<br>认识新字母 <b>A a</b>',voice:'a01-task1',lines:[['你好呀，小探险家！我是<b>苹果园的奶奶</b>。','a01-g1'],['我的果园里，住着一个新字母。听，它的声音是这样的：','a01-g2','ls-a'],['你能帮我找到它，和它交个朋友吗？','a01-g3']]},
    {type:'apples',icon:'🍎',title:'摘下五个<br><b>字母苹果</b>',voice:'a01-task2',lines:[['你认识它啦！真棒！','a01-g4'],['昨晚刮大风，五个<b>字母苹果</b>都挂在树上，下不来了。','a01-g5'],['每个苹果上，都写着 <b>A a</b>。用手指描一描，苹果就会掉下来！','a01-g6']]},
    {type:'words',icon:'🧺',title:'单词野餐<br><b>描一描，读一读</b>',voice:'a01-task3',lines:[['苹果都摘回来啦！谢谢你！','a01-g7'],['野餐垫上还有<b>五张单词卡</b>，每个单词里，都藏着 <b>a</b>。','a01-g8'],['把它描出来，我们一起读一读！','a01-g9']]}
  ];
  window.YAYA_PLANET_A = { planet, soon, TASKS, LEVELS, STATIONS, WORD_CARDS, WORD_GUIDES, RED };
  window.YayaPlanetA = { flatten, blob, decorate, apple, appleTree, roundTree, pineTree, bush, letterTree, glowTex };
})();
