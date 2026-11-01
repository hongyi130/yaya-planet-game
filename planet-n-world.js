/* N · 月亮鸟巢星球 (large world, phase 1) — the whole sphere is a giant bird's nest: the stepped voxel shell is recoloured as woven
   twig bands (light brown / lavender-brown / straw) with mint-moss paths; a big woven nest holds glowing moon eggs; 夜莺妈妈 perches on
   its rim; a tall pointed twig hut is the landmark; feather tufts, twig bundles, moss and little nests cover every side. Night sky:
   lavender -> navy with stars, two moons, warm golden rim light. Eggs glow with emissive + one Points halo draw (no per-egg lights).
   Mirrors planet-p-world.js's api so app.js uses it as the "round3" world of n01. Loaded after planet-n-art.js, before app.js. NEW FILE. */
(() => {
  'use strict';
  const roundedBox = (T, b) => window.YayaRound3.roundedBox(T, b);
  function radialTex(T, stops) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    stops.forEach(([k, c]) => gr.addColorStop(k, c)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new T.CanvasTexture(cv); return t; }

  function create(c) {
    const { THREE: T, scene, skyGroup, clouds, planet, cells, STAGE, obstacles, props, arc, surfaceRadius, LOW_POWER, habitat, START_DIR } = c;
    const A = window.YAYA_N_ART, IA = window.YAYA_I_ART, L = A.LAYOUT, CC = A.C, R = c.R || 16, SURF = R + .7, V3 = T.Vector3;
    const makeBatch = IA.makeBatch;
    const root = new T.Group(); root.name = 'n-large-world'; scene.add(root);
    const P = (x, a) => { const l = x / SURF, f = a / SURF; return new V3(Math.sin(l), Math.cos(l) * Math.cos(f), -Math.cos(l) * Math.sin(f)).normalize(); };
    const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    const prng = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(20261031);
    const proj = (v, up) => v.clone().addScaledVector(up, -v.dot(up)).normalize();
    const mergeColored = (parts, name, mat, woven = 0) => { const P3 = [], N3 = [], C3 = [], cc = new T.Color(); parts.forEach(([g0, col, M]) => { const g = (g0.index ? g0.toNonIndexed() : g0); if (M) g.applyMatrix4(M); cc.set(col);
        const pa = g.attributes.position, na = g.attributes.normal; for (let i = 0; i < pa.count; i++) { P3.push(pa.getX(i), pa.getY(i), pa.getZ(i)); N3.push(na.getX(i), na.getY(i), na.getZ(i)); const k = woven ? (Math.floor(i / woven) % 2 ? .8 : 1.04) : .92 + .1 * Math.sin(i * .41); C3.push(cc.r * k, cc.g * k, cc.b * k); } });
      const mg = new T.BufferGeometry(); mg.setAttribute('position', new T.Float32BufferAttribute(P3, 3)); mg.setAttribute('normal', new T.Float32BufferAttribute(N3, 3)); mg.setAttribute('color', new T.Float32BufferAttribute(C3, 3)); const m = new T.Mesh(mg, mat); m.name = name; return m; };
    const cellHash = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };

    // ---- remove the superseded small-world props of the shared scene (same cleanup as planets S / T / I / P) -------------------
    for (const p of props) { p.obj.visible = false; for (let i = obstacles.length - 1; i >= 0; i--) if (!obstacles[i].crystal && arc(obstacles[i].dir, p.dir) < .001) obstacles.splice(i, 1); }
    props.splice(0, props.length);
    if (habitat?.pond) habitat.pond.visible = false;
    for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].kind === 'pond') obstacles.splice(i, 1);
    habitat?.root.traverse(o => { if (o.isMesh && (o.material.wireframe || o.material.isShaderMaterial)) o.visible = false; });
    const oldMeadow = scene.getObjectByName('art-meadow-details'); if (oldMeadow) oldMeadow.visible = false;
    if (habitat) for (const ch of [...habitat.root.children]) {
      if (ch.isLineSegments || (ch.isMesh && ch.geometry.type === 'SphereGeometry' && Math.abs(ch.geometry.parameters.radius - 9.35) < .01)) ch.visible = false;
      else if (ch.isMesh && ch.geometry.type === 'IcosahedronGeometry' && Math.abs(ch.scale.x - .22) < .001) ch.visible = false;
      else if (ch.isGroup && Math.abs(ch.position.length() - 31) < 1.6) ch.visible = false;
    }
    if (c.orchard && c.orchard.basket && c.orchard.basket.group) c.orchard.basket.group.visible = false;
    const oldBirds = (habitat?.root.children || []).filter(g => g.isGroup && g.children.length === 3 && Math.abs((g.children[0].scale.x || 0) - .09) < .001);
    oldBirds.forEach(g => g.visible = false);

    // ---- layout + moss paths (N / n shapes on the sides, loops round the back) ---------------------------------------------------
    const SPAWN = P(0, L.spawnA), NEST = P(L.nest.x, L.nest.a), HUT = P(L.hut.x, L.hut.a);
    const BACK = new V3(-.1, -.55, -.83).normalize(), RIGHT = new V3(.95, -.2, .1).normalize(), LEFT = new V3(-.95, -.15, -.2).normalize();
    const slerpDirs = (a, b, n) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, ang = a.angleTo(b); out.push(ang < 1e-5 ? a.clone() : a.clone().multiplyScalar(Math.sin((1 - t) * ang)).add(b.clone().multiplyScalar(Math.sin(t * ang))).divideScalar(Math.sin(ang)).normalize()); } return out; };
    const pathLines = [
      [P(.4, -4.6), P(2.0, -1.8), P(2.6, 1.6)],                            // spawn -> nest
      [P(-.4, -4.6), P(-3.2, -1.6), P(-5.6, 1.4)],                         // spawn -> twig hut door
      [P(10.5, -6), P(10.5, 3), P(15.5, -6), P(15.5, 3)],                  // a big "N" traced on the right flank
      [P(-13, -8), P(-13, -1.5), P(-15.5, 1.2), P(-18, -1.5), P(-18, -8)], // a little "n" on the left flank
      [P(2.0, -1.8), P(10.5, -6)], [P(-3.2, -1.6), P(-13, -8)],
      [P(15.5, 3), RIGHT, new V3(.7, -.6, -.4).normalize(), BACK],          // round the right side to the back
      [P(-18, -1.5), LEFT, new V3(-.6, -.7, -.35).normalize(), BACK],       // round the left side to the back
      [P(-5.6, 1.4), P(-6, 11), P(-2, 19), new V3(0, .2, -.98).normalize(), BACK],   // behind the hut, over the far side
      [P(2.6, 1.6), P(9, 11), P(6, 19)],
    ];
    const pathSegs = [];
    for (const line of pathLines) { for (let i = 0; i < line.length - 1; i++) { const n = Math.max(2, Math.ceil(arc(line[i], line[i + 1]) / .25)); const s = slerpDirs(line[i], line[i + 1], n); pathSegs.push(...(i ? s.slice(1) : s)); } }
    const pathDist = d => { let m = 99; for (const p of pathSegs) { const a = arc(d, p); if (a < m) m = a; } return m; };
    const taken = [];
    const free = (d, r) => taken.every(t => arc(d, t.dir) > r + t.r);
    const claim = (d, r, solid = true) => { taken.push({ dir: d, r }); if (solid) obstacles.push({ dir: d.clone(), r: Math.max(.3, r * .85) }); };

    // ---- ground: ONE smooth sphere (no stepped terraces). Walking follows it (surface override = constant radius). ---------------
    //      Shader paints: woven honey/caramel twig ropes on the sides (rounded rope shading, over/under segments), a soft lavender-cream
    //      felt cap on top, mint-moss paths (per-vertex mask) — all with a fine voxel grain so it stays in the blocky family.
    const RS = surfaceRadius(new V3(0, 1, 0));
    c.setSurfaceOverride?.(() => RS);
    {
      const segW = LOW_POWER ? 88 : 128, segH = LOW_POWER ? 60 : 88, g = new T.SphereGeometry(RS, segW, segH), pa = g.attributes.position, moss = new Float32Array(pa.count);
      const v = new V3(); for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).normalize(); moss[i] = smooth(1.05, .5, pathDist(v)); }
      g.setAttribute('mossK', new T.BufferAttribute(moss, 1));
      planet.geometry.dispose(); planet.geometry = g; planet.count = 1; planet.setMatrixAt(0, new T.Matrix4()); if (planet.instanceColor) { planet.setColorAt(0, new T.Color('#ffffff')); planet.instanceColor.needsUpdate = true; }
      planet.instanceMatrix.needsUpdate = true; planet.frustumCulled = false; planet.castShadow = false; planet.receiveShadow = true;
    }
    planet.material = new T.MeshLambertMaterial({ color: '#ffffff', emissive: '#3a2a3a', emissiveIntensity: .08 });
    planet.material.onBeforeCompile = sh => {
      sh.uniforms.uSpawn = { value: SPAWN.clone() };
      sh.vertexShader = 'attribute float mossK;varying float vMoss;varying vec3 vDirN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvMoss=mossK;vDirN=normalize(position);');
      sh.fragmentShader = 'uniform vec3 uSpawn;varying float vMoss;varying vec3 vDirN;\nfloat hh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        vec3 d=normalize(vDirN);float lat=asin(clamp(d.y,-1.,1.)),lon=atan(d.z,d.x);
        vec3 vox=floor(d*${(SURF * 3.2).toFixed(1)});float gr=hh(vox);              // ~0.3 m voxel grain
        // ropes follow (wobbly) latitude bands; each rope is a rounded cylinder in section, broken into over/under segments
        float v=lat*${(SURF / .62).toFixed(2)}+.55*sin(lon*5.+lat*4.)+.3*sin(lon*11.-lat*7.);
        float ri=floor(v),rf=fract(v);float sec=sqrt(max(0.,1.-pow(rf*2.-1.,2.)));
        float sg=lon*cos(lat)*${(SURF / 1.5).toFixed(2)}+hh(vec3(ri,1.,2.))*7.+ri*.5;float si=floor(sg),sf=fract(sg);
        float under=mod(si+ri,2.);float dip=smoothstep(0.,.12,sf)*smoothstep(1.,.88,sf);
        float rh=hh(vec3(ri,si*.0+3.,5.));
        vec3 honey=vec3(.86,.64,.40),caramel=vec3(.76,.52,.32),straw=vec3(.93,.78,.55),rosy=vec3(.80,.58,.50);
        vec3 tw=rh<.3?honey:rh<.55?caramel:rh<.8?straw:rosy;
        tw*=.62+.42*sec;tw*=mix(.86,1.,dip);tw*=mix(1.,.9,under*(1.-sec*.6));tw*=.95+.08*gr;
        // felt cap: soft lavender-cream, a few feather-down specks
        float capK=smoothstep(.42,.62,d.y+.06*sin(lon*6.));
        vec3 felt=mix(vec3(.56,.46,.72),vec3(.68,.58,.8),smoothstep(.2,.9,hh(floor(d*${(SURF * .9).toFixed(1)}))*.6+.2*sin(lon*3.+lat*5.)));
        felt*=.95+.06*gr;
        vec3 col=mix(tw,felt,capK);
        // mint moss paths: ragged voxel edge, tufted grain
        float mk=smoothstep(.35,.65,vMoss+(gr-.5)*.35);vec3 moss=mix(vec3(.5,.76,.48),vec3(.62,.84,.54),gr)*(.93+.1*hh(vox+7.));
        col=mix(col,moss,mk);
        diffuseColor.rgb=pow(col,vec3(2.2));`);
    };
    planet.material.customProgramCacheKey = () => 'n-smooth-woven-ground';
    // thick 3D twig ropes on the sides: a few smooth tubes riding the painted bands (over / under wave), honey + caramel
    {
      const ropeMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .78, emissive: '#3a2a20', emissiveIntensity: .15 });
      const geos = [];
      const lats = LOW_POWER ? [-.16, -.36, -.56, -.76, .06] : [-.1, -.26, -.42, -.58, -.74, -.88, .08];
      lats.forEach((la, k) => {
        const pts = [], n = 90, ph = k * 1.7;
        for (let i = 0; i < n; i++) { const lo = i / n * Math.PI * 2, lat = Math.asin(la) + .08 * Math.sin(lo * 3 + ph) + .03 * Math.sin(lo * 7 - ph), r = RS + .1 + .2 * Math.sin(lo * 14 + ph);
          pts.push(new V3(Math.cos(lat) * Math.cos(lo) * r, Math.sin(lat) * r, Math.cos(lat) * Math.sin(lo) * r)); }
        const tg = new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), LOW_POWER ? 120 : 200, .34, LOW_POWER ? 6 : 8, true);
        const cc = new T.Color(['#d8a065', '#c48852', '#e2b77d', '#b97c4d'][k % 4]), col = new Float32Array(tg.attributes.position.count * 3);
        for (let i = 0; i < tg.attributes.position.count; i++) { const kk = .9 + .12 * Math.sin(i * .37); col.set([cc.r * kk, cc.g * kk, cc.b * kk], i * 3); }
        tg.setAttribute('color', new T.BufferAttribute(col, 3)); geos.push(tg);
      });
      // merge
      let total = 0; geos.forEach(g => total += g.index.count);
      const P3 = [], N3 = [], C3 = []; geos.forEach(g => { const ng = g.toNonIndexed(); P3.push(...ng.attributes.position.array); N3.push(...ng.attributes.normal.array); C3.push(...ng.attributes.color.array); });
      const mg = new T.BufferGeometry(); mg.setAttribute('position', new T.Float32BufferAttribute(P3, 3)); mg.setAttribute('normal', new T.Float32BufferAttribute(N3, 3)); mg.setAttribute('color', new T.Float32BufferAttribute(C3, 3));
      const rope = new T.Mesh(mg, ropeMat); rope.name = 'n-twig-ropes'; root.add(rope);
    }

    // ---- night light, fog, sky with stars, two moons ----------------------------------------------------------------------------
    scene.fog = new T.Fog('#8a76b4', 45, 170);
    scene.traverse(o => { if (o.isDirectionalLight) { o.color.set('#ffd8a6'); } else if (o.isHemisphereLight) { o.color.set('#d9d0ff'); o.groundColor.set('#a48fb8'); } });
    const sunLight = (() => { let l = null; scene.traverse(o => { if (o.isDirectionalLight && o.castShadow && !l) l = o; }); return l; })();
    const sky = skyGroup.children.find(o => o.isMesh && o.material.isShaderMaterial);
    const uGlow = { value: new V3(-.5, .6, -.6).normalize() }, uTime = { value: 0 };
    if (sky) {
      sky.material.uniforms.uSunGlow = uGlow; sky.material.uniforms.uTime = uTime;
      sky.material.fragmentShader = `uniform float sunset; uniform vec3 uSunGlow; uniform float uTime; varying vec3 vDir;
        float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
        void main(){vec3 d=normalize(vDir);float y=d.y;
          vec3 top=vec3(.2,.2,.48),mid=vec3(.46,.38,.7),low=vec3(.86,.66,.84);
          vec3 c=mix(mid,top,smoothstep(.05,.85,y));c=mix(c,low,smoothstep(.1,-.55,y)*.85);
          float cl=sin(d.x*4.+d.z*2.7+.5)*sin(d.z*3.6-d.y*5.+1.)+.4*sin(d.x*9.-d.y*7.);
          c=mix(c,vec3(.88,.68,.86),smoothstep(.6,1.1,cl)*.4*smoothstep(.45,-.35,y));
          vec3 q=d*240.;vec3 g=floor(q);float s=h3(g);float tw=.55+.45*sin(uTime*2.2+s*60.);float r1=length(fract(q)-.5);
          c+=vec3(1.,.95,.86)*step(.975,s)*smoothstep(.32,.05,r1)*tw*smoothstep(-.4,.2,y)*.9;
          vec3 q2=d*90.;vec3 g2=floor(q2);float s2=h3(g2+7.);float r2=length(fract(q2)-.5);c+=vec3(1.,.92,.76)*step(.985,s2)*(smoothstep(.22,.0,r2)+.25*smoothstep(.45,.1,r2))*(.75+.25*sin(uTime*1.3+s2*30.));
          float gl=max(dot(d,normalize(uSunGlow)),0.);c=mix(c,vec3(1.,.84,.6),pow(gl,7.)*.32);
          gl_FragColor=vec4(c,1.);}`;
      sky.material.needsUpdate = true;
    }
    {
      const camR = new V3(), camF = new V3(), sup = new V3(), ld = new V3(), prevBR = scene.onBeforeRender;
      scene.onBeforeRender = function (r, sc, cam, ...rest) {
        if (prevBR) prevBR.call(this, r, sc, cam, ...rest);
        if (!sunLight || !cam) return;
        camR.setFromMatrixColumn(cam.matrixWorld, 0).normalize(); camF.setFromMatrixColumn(cam.matrixWorld, 2).negate().normalize();
        sup.copy(sunLight.target.position).normalize(); if (sup.lengthSq() < .5) sup.set(0, 1, 0);
        ld.copy(sup).addScaledVector(camR, -.7).addScaledVector(camF, .35).normalize();   // a bit from behind: warm golden rim light
        sunLight.position.copy(sunLight.target.position).addScaledVector(ld, 25); sunLight.updateMatrixWorld(); sunLight.target.updateMatrixWorld();
        uGlow.value.setFromMatrixColumn(cam.matrixWorld, 1).multiplyScalar(.6).addScaledVector(camR, -.85).addScaledVector(camF, .9).normalize();
      };
    }
    skyGroup.children.filter(o => o.isPoints).forEach(o => { o.visible = false; });
    // moons: soft cream / lavender spheres with painted craters + a halo each (fixed in the sky far away)
    {
      const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = '#fbf3e2'; g.fillRect(0, 0, 128, 64);
      for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(190,170,200,${.12 + .15 * Math.random()})`; g.beginPath(); g.arc(Math.random() * 128, 8 + Math.random() * 48, 2 + Math.random() * 6, 0, 7); g.fill(); }
      const tex = new T.CanvasTexture(cv), halo = radialTex(T, [[0, 'rgba(255,240,200,.55)'], [.35, 'rgba(255,230,190,.18)'], [1, 'rgba(255,230,190,0)']]);
      [[new V3(-40, 52, -60), 11, '#fff6e4'], [new V3(48, 40, -46), 7.5, '#ece2ff']].forEach(([p, r, col]) => {
        const m = new T.Mesh(new T.SphereGeometry(r, 24, 16), new T.MeshBasicMaterial({ map: tex, color: col, fog: false, toneMapped: false })); m.position.copy(p); m.name = 'n-moon'; root.add(m);
        const s = new T.Sprite(new T.SpriteMaterial({ map: halo, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending })); s.scale.setScalar(r * 4.2); s.position.copy(p); root.add(s);
        const ring = new T.Mesh(new T.TorusGeometry(r * 1.32, r * .06, 6, 40), new T.MeshBasicMaterial({ color: '#ffd98a', fog: false, toneMapped: false, transparent: true, opacity: .75 })); ring.position.copy(p); ring.lookAt(0, 0, 0); ring.name = 'n-moon-ring'; root.add(ring);
      });
    }
    // clouds: none as geometry (the shared cloud group renders as hard white squares at this scale); the sky shader paints soft pink cloud bands
    clouds.clear(); clouds.visible = false;

    // ---- props: three merged draws — PB rounded (44-tri) hero blocks, SB soft 12-tri blocks (radial normals read round), GB glowing --
    const propMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .86, metalness: 0, emissive: '#2a2040', emissiveIntensity: .18 });
    const PB = makeBatch(T, roundedBox(T, .22));
    const softBox = (() => { const g = new T.BoxGeometry(1, 1, 1).toNonIndexed(), pa = g.attributes.position, na = g.attributes.normal, v = new V3(), n = new V3();
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); n.fromBufferAttribute(na, i); n.multiplyScalar(.45).add(v.normalize().multiplyScalar(.55)).normalize(); na.setXYZ(i, n.x, n.y, n.z); } return g; })();
    const SB = makeBatch(T, softBox), GB = makeBatch(T, softBox);
    const BB = makeBatch(T, softBox), bobs = []; let bob0 = 0, bobUp = null;
    const PBc = SB;   // cheap blocks
    const setBases = M => { PB.setBase(M); SB.setBase(M); GB.setBase(M); BB.setBase(M); };
    const frameAt = (dir, face, sink = .04, lift = 0) => {
      const up = dir.clone().normalize(); let f = face ? proj(face.clone().sub(up), up) : proj(new V3(.3, .1, -1), up);
      const r = new V3().crossVectors(up, f).normalize(); f = new V3().crossVectors(r, up);
      return new T.Matrix4().makeBasis(r, up, f).setPosition(up.clone().multiplyScalar(surfaceRadius(up) - sink + lift));
    };
    const eggs = [];   // {pos, up, s, phase, nest}
    const eggAt = (M, x, y, z, s, nest, up) => eggs.push({ pos: new V3(x, y, z).applyMatrix4(M), up: up.clone(), s, phase: eggs.length * .77, nest });
    const TW = [CC.twig, '#d8a065', '#b97c4d', '#e2b77d', '#c48852'], TWT = ['#dcab74', '#ecc08a', '#cf9462', '#f0cc98', '#d9a06c'];
    // woven nest wall: two layers of slanted twig blocks crossing (+/-) => real over/under weave, plus a rim of fat rope blocks
    function wovenNest(B, r, h, rows) {
      for (let ri = 0; ri < rows; ri++) { const y = .2 + ri * h / rows, kr = r * (1 + .1 * Math.sin(ri / (rows - 1) * Math.PI)), n = Math.max(8, Math.round(2 * Math.PI * kr / .5));
        for (let i = 0; i < n; i++) { const a = (i + (ri % 2) * .5) / n * Math.PI * 2, c = (i + ri) % 5;
          for (const sgn of [-1, 1]) B.block(Math.cos(a) * (kr + (sgn > 0 ? .07 : -.07)), y, Math.sin(a) * (kr + (sgn > 0 ? .07 : -.07)), .62, .16, .2, TW[(c + (sgn > 0 ? 2 : 0)) % 5], { ry: -a + Math.PI / 2, rz: sgn * .5, top: TWT[c] }); } }
      const n = Math.round(2 * Math.PI * r * 1.08 / .55); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; B.block(Math.cos(a) * r * 1.08, .3 + h, Math.sin(a) * r * 1.08, .66, .3, .34, TW[i % 5], { ry: -a + Math.PI / 2 + .35, rz: .2 * Math.sin(i * 1.7), top: TWT[i % 5] }); }
    }
    function feather(B, x, y, z, len, col, top, ry = 0, rz = 0) {   // a soft feather: quill + 5 vane blocks tapering
      const e = new T.Euler(0, ry, rz), up = new V3(0, 1, 0).applyEuler(e);
      B.block(x + up.x * len * .5, y + up.y * len * .5, z + up.z * len * .5, .05, len, .05, '#f6efe4', { ry, rz });
      for (let k = 0; k < 5; k++) { const t = .2 + k * .17, w = len * (.32 - Math.abs(k - 1.6) * .06); B.block(x + up.x * len * t, y + up.y * len * t, z + up.z * len * t, Math.max(.08, w), len * .2, .06, col, { ry, rz, top }); }
    }
    // THE GIANT NEST TREE (centerpiece, like P's giant bubble machine): fat trunk + roots over the woven ball, big clustered
    // canopy balls (lavender / mint / pink) with chunky leaf shapes, a big woven nest on top holding TEN moon eggs, 夜莺妈妈 on the rim
    let birdTop = null;
    const treeM = () => frameAt(NEST, SPAWN, .3).multiply(new T.Matrix4().makeScale(.95, .95, .95));
    { const M = treeM(); setBases(M);
      const BARK = ['#9a6440', '#a8704a', '#8c5a3a'], BT = '#b77d55';
      for (let i = 0; i < 12; i++) { const y = i * .8 + .4, w = 2.7 - i * .1 + (i < 2 ? .5 : 0); PB.block(Math.sin(i * .5) * .25, y, Math.cos(i * .4) * .15, w, .95, w * .92, BARK[i % 3], { ry: i * .25, top: BT }); }
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + .3; for (let k = 0; k < 3; k++) { const r = 1.6 + k * 1.1; PB.block(Math.cos(a) * r, .45 - k * .14, Math.sin(a) * r, 1.4, .75 - k * .15, .8 - k * .15, BARK[(i + k) % 3], { ry: -a, rz: -.25, top: BT }); } }
      // branches
      [[1, 0, 1.2, 7.8], [-1, .3, 1.0, 8.4], [.2, 1, .9, 9.0], [-.3, -1, .9, 7.4]].forEach(([dx, dz, w, y]) => { const a = Math.atan2(dz, dx); for (let k = 0; k < 3; k++) PB.block(Math.cos(a) * (1.6 + k * 1.1), y + k * .55, Math.sin(a) * (1.6 + k * 1.1), 1.4, w - k * .2, w - k * .2, BARK[k % 3], { ry: -a, rz: .45, top: BT }); });
      // canopy: chunky leaf balls (each = big rounded cube + 45deg rotated cube + flattened cap)
      const LEAF = [['#b9a3dc', '#d6c8f0'], ['#9fd2a6', '#c2e6c0'], ['#c7aee0', '#e2d2f2'], ['#f0bcd3', '#f9dbe8'], ['#a9c7e8', '#cde0f4']];
      const balls = [[0, 11.2, 0, 4.4], [3.2, 10.4, .6, 3.4], [-3.0, 10.6, .4, 3.5], [.4, 10.2, 3.0, 3.3], [-.6, 10.4, -3.0, 3.3], [2.4, 12.0, -2.2, 3.0], [-2.4, 12.2, 2.2, 3.0], [2.6, 12.3, 2.4, 2.8], [-2.5, 12.0, -2.4, 2.8], [4.3, 9.2, -1.6, 2.4], [-4.2, 9.3, -1.4, 2.4], [1.2, 9.0, 4.2, 2.4]];
      balls.forEach(([x, y, z, r], k) => { const c = LEAF[k % 5]; PB.block(x, y, z, r, r * .82, r, c[0], { ry: k, top: c[1] }); PB.block(x, y + r * .05, z, r * .84, r * .9, r * .84, c[0], { ry: k + .78, top: c[1] }); PB.block(x, y + r * .38, z, r * .66, r * .3, r * .66, c[1], { ry: k + .4 });
        for (let q = 0; q < 4; q++) { const a = q / 4 * 6.28 + k, lx = x + Math.cos(a) * r * .52, lz = z + Math.sin(a) * r * .52, ly = y + (q % 2 ? .3 : -.4) * r * .4;   // leaf decals: pointed leaf = 2 rotated blocks
          SB.block(lx, ly, lz, .9, .7, .14, c[1], { ry: -a + Math.PI / 2, rz: .785 }); SB.block(lx, ly, lz, .05, .9, .16, c[0], { ry: -a + Math.PI / 2, rz: .785 }); } });
      // the big woven nest on top + TEN moon eggs in a ring (+ feathers)
      const NY = 13.4; setBases(M.clone().multiply(new T.Matrix4().makeTranslation(0, NY, 0)));
      wovenNest(SB, 2.4, 1.3, 5); SB.block(0, .55, 0, 3.4, .7, 3.4, CC.straw, { top: CC.strawTop }); SB.block(0, .6, 0, 3.2, .7, 3.2, CC.strawTop, { ry: .78 });
      const NM = SB.base().clone();
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; eggAt(NM, Math.cos(a) * 1.45, 1.55, Math.sin(a) * 1.45, .5, true, NEST); }
      eggAt(NM, 0, 1.9, 0, .78, true, NEST);
      eggs.slice(-11, -1).forEach((e, j) => {
        e.top = true;
        const up = NEST.clone().normalize(), side = new V3(1, 0, 0).cross(up).normalize(), across = new V3().crossVectors(up, side).normalize();
        const row = Math.floor(j / 5), x = (j % 5 - 2) * 4.6 + (row ? 1.15 : -1.15);
        // Two gentle, staggered arcs keep all ten moons distinct in the finale camera.
        const target = up.clone().multiplyScalar(44 + row * 5.4 + 1.1 * (1 - Math.abs(x) / 11)).addScaledVector(across, x);
        e.tgt = target.sub(e.pos);
      });
      for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + .9; feather(SB, Math.cos(a) * 2.6, 1.2, Math.sin(a) * 2.6, 1.8, i % 2 ? CC.feather : CC.cream, i % 2 ? CC.featherTop : CC.creamTop, -a, .55 * (i % 2 ? 1 : -1)); }
      birdTop = new V3(-1.4, 1.65, 2.15).applyMatrix4(NM);
      // HAMMOCK hung from the low left branch (nap / net): two ropes + a sagging lavender cloth + pillows
      setBases(M); const hx = -4.4, hz = -1.0;
      PB.block(-2.6, 6.2, -1.2, 4.4, .7, .7, BARK[0], { ry: .4, rz: -.12, top: BT });
      for (const dz of [-1.5, 1.5]) SB.block(hx + dz * .35, 3.9, hz + dz, .08, 4.0, .08, '#f6efe4');
      for (let i = 0; i < 9; i++) { const t = i / 8, z = -1.5 + t * 3, y = 2.2 - .6 * Math.sin(t * Math.PI); SB.block(hx + (z * .35), y, hz + z, 1.3, .14, .44, i % 2 ? '#c9a8f0' : '#e6d6fa', { ry: .35 }); }
      PB.block(hx - .1, 1.85, hz - .2, 1.0, .4, .8, '#fff1c9', { top: '#fff8e4', ry: .35 }); PB.block(hx + .2, 1.8, hz + .6, .6, .35, .55, '#f3c9d9', { top: '#fbe2ec' });
      claim(NEST, 2.6); claim(NEST, 6.5, false); }
    const bird = c.orchard?.granny;
    const BIRD = P(L.bird.x, L.bird.a);
    { const M = frameAt(BIRD, SPAWN, .05); setBases(M); PB.block(0, .45, 0, 1.3, .9, 1.3, '#a8704a', { top: '#d9a96e' }); PB.block(0, .92, 0, 1.0, .08, 1.0, '#e8c08a'); for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28 + .4; PB.block(Math.cos(a) * .7, .15, Math.sin(a) * .7, .6, .3, .35, '#9a6440', { ry: -a }); } claim(BIRD, .9); }
    if (bird?.root) { root.updateMatrixWorld(true); bird.root.parent.updateMatrixWorld(true); const wp = BIRD.clone().multiplyScalar(surfaceRadius(BIRD) + .9); bird.root.position.copy(bird.root.parent.worldToLocal(root.localToWorld(wp))); bird.root.quaternion.setFromRotationMatrix(frameAt(BIRD, SPAWN, 0)); bird.root.scale.setScalar(1.0); }
    // the pointed twig hut (N-peak landmark) + a warm glowing doorway + lanterns either side
    { const M = frameAt(HUT, SPAWN, .15); setBases(M); A.hut(PB, L.hut.scale); claim(HUT, 1.8 * L.hut.scale);
      GB.block(0, 1.0, .66, .9, 1.9, .08, '#ffd27a'); GB.block(0, 1.75, .66, .62, .35, .08, '#ffe3a0');
      for (const sx of [-1.45, 1.45]) { SB.block(sx, .7, 1.3, .1, 1.4, .1, CC.twigDark); SB.block(sx, 1.4, 1.3, .3, .06, .3, CC.twigDark); GB.block(sx, 1.25, 1.3, .22, .26, .22, '#ffd98a'); } }
    claim(P(0, L.spawnA), 1.6, false);

    const LP = LOW_POWER ? .85 : 1, N = n => Math.round(n * LP);
    // fewer, bigger moon eggs along the wide paths (every ~6 m)
    { let k = 0; for (let i = 0; i < pathSegs.length && eggs.length < 7 + N(20); i += 24) { const d = pathSegs[i]; if (arc(d, SPAWN) < 3 || arc(d, NEST) < L.nest.r + 1.5 || arc(d, HUT) < 2.6) continue;
        const side = (k++ % 2 ? 1 : -1) * .75, up = d.clone(), t = proj(Math.abs(up.y) < .95 ? new V3(0, 1, 0).cross(up) : new V3(1, 0, 0), up);
        const p = up.clone().addScaledVector(t, side / SURF).normalize(); if (!free(p, .6)) continue; claim(p, .6, false); eggs.push({ pos: p.clone().multiplyScalar(RS + .55), up: p, s: .62, phase: k * .9, nest: false }); } }
    const scatter = (n, r, fn, cond, sc = 1, pathGap = .9) => { let k = 0, tries = 0; while (k < n && tries++ < n * 80) { const d = new V3(prng() * 2 - 1, prng() * 2 - 1, prng() * 2 - 1).normalize();
      if ((cond && !cond(d)) || !free(d, r) || pathDist(d) < pathGap || arc(d, SPAWN) < 2.4) continue;
      claim(d, r, false); setBases(frameAt(d, null, .04).multiply(new T.Matrix4().makeRotationY(prng() * 6.28)).multiply(new T.Matrix4().makeScale(sc, sc, sc))); fn(k, d); k++; } };
    const heroAt = (x, a, r, face = SPAWN, sc = 1) => { const d = P(x, a); setBases(frameAt(d, face, .06).multiply(new T.Matrix4().makeScale(sc, sc, sc))); claim(d, r); return d; };
    // GIANT ACORN ('nut') front-left of the spawn: chunky nut, ribbed cap, stalk — taller than the girl x2
    heroAt(-3.4, -.2, 2.0, SPAWN, 1.25);
    { const prof = [[.3, .55], [.8, 1.25], [1.35, 1.75], [1.9, 2.0], [2.4, 1.95]];   // round nut: stacked rings shaped like a ball, pointed tip
      PB.block(0, .2, 0, .5, .4, .5, '#d9a368'); prof.forEach(([y, w], i) => { PB.block(0, y, 0, w, .6, w, i % 2 ? '#ecbd7e' : '#f2c98c', { top: '#f8d9a4' }); PB.block(0, y, 0, w * .9, .58, w * .9, i % 2 ? '#ecbd7e' : '#f2c98c', { ry: .785 }); });
      [[2.75, 2.4], [3.05, 2.1], [3.3, 1.5], [3.5, .8]].forEach(([y, w], i) => { PB.block(0, y, 0, w, .38, w, i % 2 ? '#8a5a3a' : '#7d5034', { top: '#a5714a' }); PB.block(0, y, 0, w * .9, .36, w * .9, '#8a5a3a', { ry: .785 }); });
      PB.block(.12, 3.95, 0, .22, .6, .22, '#6f4630', { rz: -.3 }); PB.block(.5, 4.2, 0, .7, .14, .42, '#9fd18f', { rz: .3, top: '#b8e2a6' }); }
    // BIG NAP PILLOW pile + giant feather (side, visible from landing)
    heroAt(-9.5, -5.5, 2.0);
    PB.block(0, .45, 0, 2.6, .9, 1.9, '#d9ccf2', { top: '#ece4fa' }); PB.block(.2, 1.25, .1, 2.0, .7, 1.5, '#f3c9d9', { ry: .3, top: '#fbe2ec' }); PB.block(-.2, 1.85, 0, 1.4, .5, 1.1, '#fff1c9', { ry: -.25, top: '#fff8e4' });
    // GIANT FEATHERS stuck in the ball (2.5-3.5 m), all round
    const bigFeather = (len, c) => { PB.block(0, len * .5, 0, .14, len, .14, '#f6efe4', { rz: .25 }); for (let k = 0; k < 6; k++) { const t = .22 + k * .13, w = len * (.36 - Math.abs(k - 2) * .06); PB.block(Math.sin(.25) * -len * t, len * t, 0, Math.max(.3, w), len * .17, .16, c[0], { rz: .25, top: c[1] }); } };
    const FC = [['#c7aee0', '#e2d2f2'], ['#efb9cf', '#f8d8e5'], ['#f0dcc0', '#fbeedb']];
    [[-2.5, 7.8], [9.5, 1.5], [-12, 1], [3, -11], [14, -8], [-6, 12]].forEach(([x, a], k) => { if (!free(P(x, a), 1)) return; heroAt(x, a, 1.0, null); bigFeather(2.6 + (k % 3) * .4, FC[k % 3]); });
    // BIG TWIG ARCHES over the paths (chunky hoops of rounded twig blocks)
    const arch = (w, h) => { const segs = 9; for (let i = 0; i < segs; i++) { const t0 = i / segs, t1 = (i + 1) / segs, x0 = (t0 - .5) * w, x1 = (t1 - .5) * w, y0 = Math.sin(t0 * Math.PI) * h, y1 = Math.sin(t1 * Math.PI) * h, l = Math.hypot(x1 - x0, y1 - y0);
      PB.block((x0 + x1) / 2, (y0 + y1) / 2, 0, l * 1.15, .5, .5, TW[i % 5], { rz: Math.atan2(y1 - y0, x1 - x0), top: TWT[i % 5] }); SB.block((x0 + x1) / 2, (y0 + y1) / 2 + .1, .2, l * .9, .16, .16, TW[(i + 2) % 5], { rz: Math.atan2(y1 - y0, x1 - x0) + .3 }); }
      PB.block(-w * .1, h + .35, .1, .6, .3, .5, '#a9d39a', { top: '#c2e5b2' }); };
    { let n = 0; for (let i = 60; i < pathSegs.length && n < 5; i += 140) { const d = pathSegs[i], nx = pathSegs[Math.min(pathSegs.length - 1, i + 2)]; if (arc(d, SPAWN) < 5 || arc(d, NEST) < 5 || arc(d, HUT) < 4) continue;
        const t = proj(nx.clone().sub(d), d); setBases(frameAt(d, d.clone().add(new V3().crossVectors(d, t)), .1)); arch(3.4, 3.0); n++; } }
    // secondary nests: three medium woven nests with big eggs (side + back)
    [[13, 6], [-14, -9], [2, 16]].forEach(([x, a]) => { const d = P(x, a); if (!free(d, 2)) return; heroAt(x, a, 2.0, null); wovenNest(PB, 1.4, .9, 3); SB.block(0, .35, 0, 1.9, .4, 1.9, CC.straw, { top: CC.strawTop }); const M = PB.base().clone();
      for (let i = 0; i < 3; i++) { const aa = i / 3 * 6.28; eggAt(M, Math.cos(aa) * .55, 1.0, Math.sin(aa) * .55, .55, true, d); } });
    // a few big lanterns on tall twig posts along the paths
    scatter(N(8), 1.0, k => { PB.block(0, 1.1, 0, .22, 2.2, .22, CC.twigDark); PB.block(.35, 2.15, 0, .8, .16, .16, CC.twigDark); GB.block(.7, 1.75, 0, .44, .55, .44, '#ffd98a'); PB.block(.7, 2.05, 0, .58, .14, .58, CC.twigDark); }, null, 1, 1.2);
    // big lavender bush clumps spread evenly over the whole ball (the greenery), chunky rounded blocks
    const BUSH = [['#b9a3dc', '#d3c2ee'], ['#a58fcf', '#c4b2e6'], ['#9fcf9a', '#bde3b2'], ['#c7aee0', '#e2d2f2']];
    scatter(N(55), 1.2, k => { const c = BUSH[k % 4], n2 = 3 + k % 3; for (let i = 0; i < n2; i++) { const a = i / n2 * 6.28 + k, rr = i ? .6 : 0, s2 = i ? .9 : 1.25; PB.block(Math.cos(a) * rr, s2 * .45, Math.sin(a) * rr, s2, s2 * .85, s2, c[0], { ry: a, top: c[1] }); } }, null, 1, 1.3);
    scatter(N(12), 1.0, k => { const c = BUSH[k % 4]; PB.block(0, .5, 0, 1.2, 1.0, 1.2, c[0], { top: c[1] }); PB.block(.6, .35, .3, .8, .7, .8, c[0], { ry: .5, top: c[1] }); }, d => arc(d, SPAWN) < 9, 1, 1.0);
    // medium-large stylized trees (rounded-cube, egg, tiered pine, leaf-ball, tiered bush, palm) in the N palette
    const TRK = ['#c98f5a', '#d9a06c', '#b98050'];
    const mTree = (k, sc) => { const c = BUSH[k % 4], c2 = BUSH[(k + 1) % 4], tk = TRK[k % 3], type = k % 6;
      if (type === 5) { PB.block(0, 1.3, 0, .45, 2.6, .45, tk, { rz: .12 }); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; PB.block(Math.cos(a) * .9 + .3, 2.55, Math.sin(a) * .9, 1.9, .2, .6, c[0], { ry: -a, rz: -.35, top: c[1] }); } PB.block(.3, 2.7, 0, .7, .6, .7, c2[0], { top: c2[1] }); return; }
      PB.block(0, .9, 0, .5, 1.8, .5, tk, { top: tk });
      if (type === 0) { PB.block(0, 2.6, 0, 2.3, 2.0, 2.3, c[0], { top: c[1] }); PB.block(0, 2.7, 0, 2.0, 2.1, 2.0, c[0], { ry: .785, top: c[1] }); }
      else if (type === 1) { [[2.0, 1.6], [2.9, 1.9], [3.8, 1.5], [4.5, .8]].forEach(([y, w]) => { PB.block(0, y, 0, w, 1.0, w, c[0], { top: c[1] }); PB.block(0, y, 0, w * .88, .98, w * .88, c[0], { ry: .785 }); }); }
      else if (type === 2) { [[2.0, 2.4], [3.0, 1.8], [3.9, 1.2], [4.6, .6]].forEach(([y, w], i) => PB.block(0, y, 0, w, .8, w, i % 2 ? c2[0] : c[0], { ry: i * .4, top: i % 2 ? c2[1] : c[1] })); }
      else if (type === 3) { [[0, 2.8, 0, 1.8], [.9, 2.3, .3, 1.3], [-.8, 2.4, -.2, 1.4]].forEach(([x, y, z, r], i) => { PB.block(x, y, z, r, r * .9, r, i ? c2[0] : c[0], { ry: i, top: i ? c2[1] : c[1] }); PB.block(x, y, z, r * .84, r, r * .84, i ? c2[0] : c[0], { ry: i + .785 }); }); }
      else { [[1.6, 2.0], [2.5, 1.6], [3.3, 1.1]].forEach(([y, w], i) => { PB.block(0, y, 0, w, .7, w, c[0], { top: c[1] }); PB.block(0, y - .3, 0, w * .9, .3, w * .9, c2[0], { ry: .785 }); }); } };
    scatter(N(18), 1.6, k => mTree(k, 1), null, 1, 1.4);
    { const d = P(-3.2, -6.0); if (true) { setBases(frameAt(d, SPAWN, .04).multiply(new T.Matrix4().makeScale(.8, .8, .8))); claim(d, 1.6); mTree(3, 1); } }
    { const d = P(2.5, -5.4); if (true) { setBases(frameAt(d, SPAWN, .06)); claim(d, 1.8); wovenNest(PB, 1.3, .8, 3); SB.block(0, .35, 0, 1.8, .4, 1.8, CC.straw, { top: CC.strawTop }); const M = PB.base().clone(); eggAt(M, -.35, .95, 0, .55, true, d); eggAt(M, .4, .9, .2, .5, true, d); } }
    [[-6.5, -1.5, 0], [6.8, -3.2, 3], [-2.2, 2.6, 1], [8.5, 1.0, 2]].forEach(([x, a, t]) => { const d = P(x, a); if (!free(d, 1.4)) return; setBases(frameAt(d, null, .04)); claim(d, 1.4); mTree(t, 1); });
    // Crossy-Road style blocky voxel birds + little critters (merged into the static batches)
    const bobStart = up => { bob0 = BB.count(); bobUp = up.clone().normalize(); }, bobEnd = () => bobs.push([bob0, BB.count(), bobUp, prng() * 6.28]);
    const vbird = (t, y0 = 0) => { const B = { chicken: ['#fbf7f0', '#ffffff', '#f2a03c', '#f07a9a'], flamingo: ['#f59ab8', '#fbb9cf', '#2a2033', '#f59ab8'], pigeon: ['#a9a9bd', '#c4c4d4', '#e9b04a', '#7fb7a8'],
        blue: ['#7f8be0', '#a3aef0', '#f2b23c', '#5d67c4'], gull: ['#ffffff', '#f4f4f8', '#f5b83a', '#b8bccb'], cardinal: ['#e04848', '#ef6464', '#f29a2e', '#2a2033'], cube: ['#5aa9e8', '#7cc0f2', '#f2c23c', '#f7e9c8'] }[t];
      const tall = t === 'flamingo';
      if (tall) { BB.block(0, .55 + y0, 0, .07, 1.1, .07, '#e77fa2'); BB.block(.12, .75 + y0, -.05, .06, .3, .06, '#e77fa2', { rz: 1.2 }); }
      else for (const sx of [-.12, .12]) BB.block(sx, .08 + y0, 0, .07, .16, .07, B[2]);
      const by = (tall ? 1.35 : .45) + y0, bw = t === 'cube' || t === 'cardinal' ? .62 : .5, bh = t === 'cube' || t === 'cardinal' ? .62 : .55;
      BB.block(0, by, 0, bw, bh, t === 'gull' ? .75 : .6, B[0], { top: B[1] });
      if (t === 'flamingo') { BB.block(0, by + .45, .2, .1, .55, .1, B[0]); BB.block(0, by + .8, .25, .28, .28, .3, B[0], { top: B[1] }); BB.block(0, by + .72, .45, .1, .14, .18, '#2a2033'); }
      const hy = t === 'flamingo' ? by + .8 : by + bh * .15, hz = t === 'flamingo' ? .41 : (t === 'gull' ? .38 : .31);
      for (const sx of [-1, 1]) { BB.block(sx * (t === 'flamingo' ? .1 : bw * .26), hy + .06, hz, .1, .12, .03, '#2a2033'); BB.block(sx * (t === 'flamingo' ? .08 : bw * .23), hy + .1, hz + .015, .035, .035, .02, '#ffffff');
        BB.block(sx * bw * .52, by - .02, -.02, .08, bh * .6, .4, t === 'cube' ? '#f2c23c' : B[3] === '#2a2033' ? B[1] : (t === 'chicken' || t === 'gull' ? B[1] : B[3])); }
      if (t !== 'flamingo') BB.block(0, hy - .06, hz + .1, .16, .1, .2, B[2]);
      if (t === 'chicken') { BB.block(0, by + bh * .55, .1, .1, .16, .26, B[3]); BB.block(0, hy - .2, hz + .03, .08, .14, .04, B[3]); }
      if (t === 'cardinal') { BB.block(0, hy + .02, hz + .01, bw * .8, .14, .03, '#2a2033'); BB.block(0, by + bh * .6, -.05, .14, .22, .22, B[0], { rx: -.5 }); }
      if (t === 'cube') { BB.block(0, by + bh * .6, 0, .12, .2, .3, '#f2c23c', { rx: -.4 }); BB.block(0, by - .1, hz - .02, bw * .7, bh * .45, .03, '#f7e9c8'); }
      if (t === 'blue') BB.block(0, by + bh * .55, -.05, .1, .14, .22, '#a3aef0', { rx: -.5 });
      BB.block(0, by + .05, -.38, bw * .5, .1, .24, B[t === 'gull' ? 3 : 0], { rx: .4 }); };
    const critter = (t) => { const C2 = { raccoon: ['#9b9bab', '#c9c9d4', '#3a3445'], bear: ['#a8774f', '#c49268', '#6e4a30'], cat: ['#f2b26b', '#f8cb92', '#d48a45'], fox: ['#ef8a3c', '#f6a35c', '#fbf3e6'] }[t];
      for (const sx of [-.15, .15]) for (const sz of [-.18, .18]) BB.block(sx, .1, sz, .12, .2, .12, C2[2]);
      BB.block(0, .38, -.05, .5, .38, .62, C2[0], { top: C2[1] }); BB.block(0, .62, .3, .46, .42, .4, C2[0], { top: C2[1] });
      for (const sx of [-1, 1]) { BB.block(sx * .15, .9, .3, .12, .14, .08, C2[t === 'fox' ? 0 : 2]); BB.block(sx * .1, .66, .505, .07, .08, .02, '#2a2033'); }
      BB.block(0, .56, .52, .16, .1, .06, t === 'fox' ? C2[2] : C2[1]); if (t === 'raccoon') BB.block(0, .66, .5, .4, .1, .02, C2[2]);
      BB.block(0, .5, -.45, .14, .14, .4, C2[t === 'raccoon' ? 2 : 1], { rx: -.6 }); };
    const BIRDS = ['chicken', 'flamingo', 'pigeon', 'blue', 'gull', 'cardinal', 'cube'], CRIT = ['raccoon', 'bear', 'cat', 'fox'];
    // a few right in the spawn view, the rest along the paths / around the sphere
    [[-1.8, -1.0, 'chicken'], [2.7, -2.4, 'cardinal'], [-2.6, -3.0, 'pigeon'], [3.6, -.9, 'gull'], [-3.6, -1.6, 'raccoon'], [2.0, .4, 'bear'], [-.6, 1.6, 'fox'], [3.4, .6, 'cube'], [-2.9, 1.9, 'flamingo'], [1.2, 1.7, 'cat'], [-1.3, 2.6, 'blue']].forEach(([x, a, t]) => { const d = P(x, a); if (!free(d, .6) || pathDist(d) < .8) { console.log('skipbird', t); return; } setBases(frameAt(d, SPAWN, .02).multiply(new T.Matrix4().makeScale(1.2, 1.2, 1.2))); claim(d, .5); bobStart(d); (CRIT.includes(t) ? critter : vbird)(t); bobEnd(); });
    scatter(N(16), .7, (k, d) => { bobStart(d); k % 3 === 2 ? critter(CRIT[k % 4]) : vbird(BIRDS[k % 7]); bobEnd(); }, null, 1.2, 1.1);
    // birds perched on the giant tree's branches + nest rim
    { const M = treeM(); [[4.6, 9.3, .5, 'pigeon'], [-4.4, 9.9, .7, 'gull'], [.6, 10.4, 4.4, 'blue'], [1.8, 14.7, -1.8, 'cardinal'], [3.2, 13.6, 2.8, 'cube'], [.6, 14.7, 1.0, 'blue']].forEach(([x, y, z, t]) => { setBases(M.clone().multiply(new T.Matrix4().makeTranslation(x, y, z)).multiply(new T.Matrix4().makeScale(1.3, 1.3, 1.3))); bobStart(NEST); vbird(t); bobEnd(); }); }
    // a few chunky twig bundles (crossed thick logs)
    scatter(N(14), 1.4, k => { for (let i = 0; i < 3; i++) PB.block(0, .25 + i * .3, 0, 2.6 - i * .4, .36, .36, TW[(k + i) % 5], { ry: i * 1.05 + k, top: TWT[(k + i) % 5] }); }, null, 1, 1.2);
    const propMesh = (() => { const a = PB.mesh(propMat).geometry, b = SB.mesh(propMat).geometry, g = new T.BufferGeometry();
      for (const k of ['position', 'normal', 'color']) { const x = a.attributes[k].array, y = b.attributes[k].array, z = new Float32Array(x.length + y.length); z.set(x); z.set(y, x.length); g.setAttribute(k, new T.BufferAttribute(z, 3)); }
      g.computeBoundingSphere(); const m = new T.Mesh(g, propMat); m.name = 'n-props'; return m; })(); root.add(propMesh);
    { const bm = BB.mesh(propMat.clone(), 'n-birds'), g = bm.geometry, ab = new Float32Array(g.attributes.position.count * 4);
      for (const [a, b, up, ph] of bobs) for (let i = a; i < b; i++) ab.set([up.x, up.y, up.z, ph], i * 4);
      g.setAttribute('aBob', new T.BufferAttribute(ab, 4));
      bm.material.onBeforeCompile = sh => { sh.uniforms.uTime = uTime; sh.vertexShader = 'attribute vec4 aBob;\nuniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += aBob.xyz * (.07 * max(0., sin(uTime * 2.6 + aBob.w)));'); };
      bm.frustumCulled = false; root.add(bm); }
    root.add(GB.mesh(new T.MeshStandardMaterial({ vertexColors: true, emissive: '#ffbe5c', emissiveIntensity: .9, roughness: .5 }), 'n-glow'));

    // Keep crystal and word celebrations to one draw instead of a mesh per fleck.
    const burstLimit = LOW_POWER ? 80 : 120;
    const burstMesh = new T.InstancedMesh(new T.BoxGeometry(.16, .16, .16), new T.MeshBasicMaterial(), burstLimit);
    burstMesh.name = 'n-celebration-particles'; burstMesh.frustumCulled = false; burstMesh.visible = false; burstMesh.count = 0; root.add(burstMesh);
    let burstParticles = [];
    const burstMatrix = new T.Matrix4(), burstRotation = new T.Quaternion(), burstScale = new V3(), burstUp = new V3();
    function burst(pos, color, count = 22, power = 1) {
      const up = pos.clone().normalize(), col = new T.Color(color);
      for (let i = 0; i < Math.min(count, burstLimit); i++) {
        const side = proj(new V3(prng() - .5, prng() - .5, prng() - .5), up);
        burstParticles.push({ pos: pos.clone(), vel: side.multiplyScalar((1 + prng() * 2) * power).addScaledVector(up, (2 + prng() * 3) * power), life: .9 + prng() * .5, col });
      }
      if (burstParticles.length > burstLimit) burstParticles = burstParticles.slice(-burstLimit);
    }
    function updateBursts(dt) {
      burstParticles = burstParticles.filter(p => (p.life -= dt) > 0);
      burstMesh.count = burstParticles.length; burstMesh.visible = burstMesh.count > 0;
      burstParticles.forEach((p, i) => {
        p.vel.addScaledVector(burstUp.copy(p.pos).normalize(), -9 * dt); p.pos.addScaledVector(p.vel, dt);
        burstMatrix.compose(p.pos, burstRotation, burstScale.setScalar(Math.max(.01, p.life)));
        burstMesh.setMatrixAt(i, burstMatrix); burstMesh.setColorAt(i, p.col);
      });
      if (burstMesh.count) { burstMesh.instanceMatrix.needsUpdate = true; burstMesh.instanceColor.needsUpdate = true; }
    }

    // ---- moon eggs: one instanced draw + one Points halo draw ---------------------------------------------------------------------
    const eggMat = new T.MeshStandardMaterial({ color: '#ffe6a8', emissive: '#ffbf55', emissiveIntensity: .75, roughness: .35, metalness: .05 });
    const eggMesh = new T.InstancedMesh(new T.SphereGeometry(1, LOW_POWER ? 10 : 14, LOW_POWER ? 7 : 10), eggMat, eggs.length); eggMesh.name = 'n-moon-eggs'; eggMesh.frustumCulled = false; root.add(eggMesh);
    const haloTex = radialTex(T, [[0, 'rgba(255,240,200,.75)'], [.25, 'rgba(255,214,140,.35)'], [.6, 'rgba(255,200,120,.1)'], [1, 'rgba(255,200,120,0)']]);
    const hp = new Float32Array(eggs.length * 3), hs = new Float32Array(eggs.length);
    eggs.forEach((e, i) => { hp.set([e.pos.x, e.pos.y, e.pos.z], i * 3); hs[i] = e.s > .5 ? 3.4 : e.nest ? 2.0 : 2.4; });
    const hg = new T.BufferGeometry(); hg.setAttribute('position', new T.BufferAttribute(hp, 3)); hg.setAttribute('size', new T.BufferAttribute(hs, 1));
    const haloMat = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { map: { value: haloTex }, uTime: uTime, uScale: { value: 400 } },
      vertexShader: `attribute float size;uniform float uTime;uniform float uScale;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float p=.85+.15*sin(uTime*1.8+position.x*1.3+position.z);vA=p;gl_PointSize=size*p*uScale/-mv.z;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform sampler2D map;varying float vA;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(t.rgb,t.a*vA);}` });
    const halos = new T.Points(hg, haloMat); halos.name = 'n-egg-halos'; halos.frustumCulled = false; root.add(halos);
    // starlight motes drifting just above the ground (same Points material, tiny + pale)
    {
      const n = LOW_POWER ? 70 : 110, mp = new Float32Array(n * 3), ms = new Float32Array(n);
      for (let i = 0; i < n; i++) { const d = new V3(prng() * 2 - 1, prng() * 2 - 1, prng() * 2 - 1).normalize(); const p = d.multiplyScalar(R + 1.2 + prng() * 3.5); mp.set([p.x, p.y, p.z], i * 3); ms[i] = .5 + prng() * .5; }
      const mg = new T.BufferGeometry(); mg.setAttribute('position', new T.BufferAttribute(mp, 3)); mg.setAttribute('size', new T.BufferAttribute(ms, 1));
      const motes = new T.Points(mg, haloMat); ms.forEach((v, i) => ms[i] = v * .55); motes.name = 'n-star-motes'; motes.frustumCulled = false; root.add(motes);
    }
    let riseK = 0;
    const em = new T.Matrix4(), eq = new T.Quaternion(), es = new V3(), eUp = new V3(0, 1, 0), eggPosition = new V3(), eggUp = new V3();
    function placeEggs(time) {
      eggs.forEach((e, i) => {
        eggUp.copy(e.up).normalize(); eq.setFromUnitVectors(eUp, eggUp);
        const bob = e.nest ? .04 * Math.sin(time * 1.4 + e.phase) : 0;
        const rk = e.top ? riseK : 0, kk = rk * rk * (3 - 2 * rk), size = e.s * (e.s > .5 ? 1.05 : 1.25);
        // The ten outer eggs become round moons; the central hero egg stays in the nest.
        es.set(size * (.78 + .22 * kk), size, size * (.78 + .22 * kk)).multiplyScalar(1 + kk * 1.8);
        eggPosition.copy(e.pos);
        if (rk) eggPosition.addScaledVector(e.tgt, kk); else eggPosition.addScaledVector(eggUp, bob);
        em.compose(eggPosition, eq, es); eggMesh.setMatrixAt(i, em);
      });
      eggMesh.instanceMatrix.needsUpdate = true;
    }
    placeEggs(0);

    // ---- soft dark blob shadows under 星朵 and the girl (grayscale legibility, like P) -----------------------------------------------
    const blobTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(28,18,48,.85)'); gr.addColorStop(.6, 'rgba(50,38,80,.36)'); gr.addColorStop(1, 'rgba(50,38,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(cv); })();
    const blobMesh = new T.InstancedMesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }), 2);
    blobMesh.name = 'n-character-shadows'; blobMesh.frustumCulled = false; blobMesh.renderOrder = 1; root.add(blobMesh);
    const blobs = [[() => window.__yaya?.unicorn?.root, 2.8], [() => window.__yaya?.player?.obj, 1.5]];
    const bwp = new V3(), blobUp = new V3(), blobPose = new T.Object3D(), vertical = new V3(0, 1, 0);
    function updateBlobs() {
      blobs.forEach(([get, size], i) => {
        const obj = get();
        if (obj) {
          obj.getWorldPosition(bwp); blobUp.copy(bwp).normalize();
          blobPose.position.copy(blobUp).multiplyScalar(surfaceRadius(blobUp) + .04);
          blobPose.quaternion.setFromUnitVectors(vertical, blobUp); blobPose.scale.setScalar(size);
        } else blobPose.scale.setScalar(0);
        blobPose.updateMatrix(); blobMesh.setMatrixAt(i, blobPose.matrix);
      });
      blobMesh.instanceMatrix.needsUpdate = true;
    }

    // ---- api -----------------------------------------------------------------------------------------------------------------------
    const landmarks = { spawn: { dir: SPAWN }, stage: { dir: STAGE.center || P(0, 0) }, nest: { dir: NEST }, bird: { dir: P(L.bird.x, L.bird.a) }, hut: { dir: HUT } };
    // Quiz crystals must have room for both their mesh and the walking approach.
    // The old fixed coordinates overlapped the foreground tree and egg nest.
    const answerDirs = [];
    for (const [x, a] of [[-3.4, -6.4], [3.4, -6.4], [-1.2, -8.6]]) {
      const candidates = [];
      for (let dx = -5; dx <= 5; dx += .5) for (let da = -5; da <= 5; da += .5) {
        const d = P(x + dx, a + da);
        if (!free(d, 1.1) || obstacles.some(o => arc(d, o.dir) < o.r + .8) || answerDirs.some(q => arc(d, q) < 3)) continue;
        candidates.push({ dir: d, cost: dx * dx + da * da });
      }
      candidates.sort((a, b) => a.cost - b.cost);
      if (!candidates.length) throw new Error('N quiz needs an unobstructed crystal position');
      answerDirs.push(candidates[0].dir);
    }
    const routePoints = [P(0, -4.6), P(2.0, -1.8), P(-3.2, -1.6), P(10.5, -2), P(-13, -4), RIGHT.clone(), BACK.clone(), LEFT.clone()]; const trailPts = routePoints.slice();
    const overview = (aspect = 1) => { const k = aspect < .8 ? 1.55 : 1; const focus = new V3(0, 1.5, 0); const position = new V3(-9 * k, 26 * k, 46 * k); return { focus, position, up: new V3(0, 1, 0), lift: 1, zoom: 1, ahead: 0 }; };
    function update(dt, time) {
      uTime.value = time; updateBlobs(); updateBursts(dt); eggMat.emissiveIntensity = .7 + riseK * .6 + .1 * Math.sin(time * 1.8); placeEggs(time);
      haloMat.uniforms.uScale.value = (window.innerHeight || 800) * .55;
      if (bird?.body) { bird.body.scale.y = 1 + .02 * Math.sin(time * 1.3); bird.head.rotation.y = .25 * Math.sin(time * .5); bird.head.rotation.z = .06 * Math.sin(time * .9); }
      oldBirds.forEach(g => g.visible = false);
    }
    const eggsRise = k => { k = Math.max(0, Math.min(1, k)); riseK = k; placeEggs(performance.now() / 1000); eggs.forEach((e, i) => { if (!e.top) return; hs[i] = (e.s > .6 ? 3.4 : 2.0) * (1 + 2.5 * k); const p2 = e.pos.clone().addScaledVector(e.tgt, k * k * (3 - 2 * k)); hp.set([p2.x, p2.y, p2.z], i * 3); }); hg.attributes.position.needsUpdate = true; hg.attributes.size.needsUpdate = true; eggMat.emissiveIntensity = .75 + k * .6; };
    const api = { eggsRise, onBoat: () => false, root, routePoints, trailPts, answerDirs, sparkleBurst() {}, wrongFeedback() {}, propMap: new Map(), fauna: [], landmarks, update,
      turtle: { overview }, overview, eggs: { mesh: eggMesh, list: eggs }, burst, trees: [],
      snapshot: () => ({ version: 'n-v8-review2', radius: R, eggs: eggs.length, risingEggs: eggs.filter(e => e.top).length, riseK, particles: burstParticles.length, particleLimit: burstLimit, propTriangles: PB.count() / 3 }),
      createCrystal: (label, col) => window.YayaRound3.createCrystal(T, label, col), setDry() { } };
    return api;
  }
  window.YayaPlanetNWorld = { create };
})();
