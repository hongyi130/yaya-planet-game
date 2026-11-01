/* P · 泡泡星球 (large world) — approved art plus phase-2 interaction/finale state (mirrors planet-i-world.js's api so app.js uses it as
   the "round3" world of p01). Procedural: the sphere is the shared stepped voxel shell recoloured (mint / cream / pale yellow tops,
   light green-grey / lavender-grey risers); props are a few merged rounded-block meshes; every bubble in the sky is one InstancedMesh
   with one shared fresnel glass material (depthWrite off). Loaded after round3-world.js / planet-i-art.js / planet-p-art.js, before app.js. */
(() => {
  'use strict';
  const roundedBox = (T, b) => window.YayaRound3.roundedBox(T, b);
  // Shared bubble glass (same look as I's mini-globe glass `i-mini-globe-glass`, plus instancing): rainbow fresnel rim, two highlights.
  function glassMaterial(T) {
    const m = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uAlpha: { value: 1 }, uTime: { value: 0 } },
      vertexShader: `uniform float uTime;varying vec3 vN;varying vec3 vV;varying float vSeed;varying float vHighlight;varying float vSize;
        void main(){vec3 pos=position;float seed=0.;vHighlight=0.;float sz=length(position)*length(modelMatrix[0].xyz);
        #ifdef USE_INSTANCING_COLOR
        vHighlight=instanceColor.r;
        #endif
        #ifdef USE_INSTANCING
        seed=instanceMatrix[3][0]*.37+instanceMatrix[3][1]*.53+instanceMatrix[3][2]*.71;sz*=length(instanceMatrix[0].xyz);
        #endif
        vSize=sz;pos*=1.+.035*sin(uTime*2.3+seed+position.y*3.)+.025*sin(uTime*3.1+seed*1.7+position.x*4.);
        vec4 p=vec4(pos,1.);vec3 n=normal;
        #ifdef USE_INSTANCING
        p=instanceMatrix*p;n=mat3(instanceMatrix)*n;
        #endif
        vec4 mv=modelViewMatrix*p;vN=normalize(normalMatrix*n);vV=normalize(-mv.xyz);vSeed=seed;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform float uAlpha;uniform float uTime;varying vec3 vN;varying vec3 vV;varying float vSeed;varying float vHighlight;varying float vSize;
        void main(){vec3 n=normalize(vN),v=normalize(vV);float c=abs(dot(n,v));float f=pow(1.-c,2.4);
        float film=c*2.2+n.y*.6+n.x*.3+vSeed*.1+uTime*.05;
        vec3 irid=.5+.5*cos(6.2832*(film+vec3(.0,.33,.67)));irid=mix(irid,vec3(1.,.74,.88),.06);
        // big bubbles (steps, the ride home, the island) sit close to the camera: a softer, paler rainbow; small ones are unchanged
        float big=smoothstep(.9,2.6,vSize);irid=mix(irid,vec3(1.,.96,.98),.3*big);
        float spec=smoothstep(.92,.985,dot(n,normalize(vec3(-.42,.5,.76))));float spec2=smoothstep(.975,.995,dot(n,normalize(vec3(.38,-.32,.87))));
        float rim=smoothstep(.55,1.,1.-c);
        vec3 col=mix(vec3(1.,.97,.99),irid,mix(.95,.6,big)*smoothstep(.1,.8,1.-c));col=mix(col,vec3(1.),spec+spec2*.8);
        // Selection glow is carried by the one world instance buffer; zero preserves the approved glass exactly.
        col=mix(col,vec3(1.),vHighlight*(.18+.5*f));
        float a=.035+f*mix(.85,.66,big)+rim*mix(.2,.1,big)+spec*.9+spec2*.55+vHighlight*(.09+.18*f);gl_FragColor=vec4(col,clamp(a,0.,1.)*uAlpha);}` });
    return m;
  }
  function create(c) {
    const { THREE: T, scene, skyGroup, clouds, planet, cells, STAGE, obstacles, props, arc, surfaceRadius, rng, LOW_POWER, habitat, START_DIR } = c;
    const A = window.YAYA_P_ART, IA = window.YAYA_I_ART, L = A.LAYOUT, R = c.R || 16, SURF = R + .7, V3 = T.Vector3;
    const softArt = window.YayaPSoftArt?.enabled() ? YayaPSoftArt : null;
    const makeBatch = softArt ? softArt.makeBatch : IA.makeBatch;
    const root = new T.Group(); root.name = 'p-large-world'; scene.add(root);
    const P = (x, a) => { const l = x / SURF, f = a / SURF; return new V3(Math.sin(l), Math.cos(l) * Math.cos(f), -Math.cos(l) * Math.sin(f)).normalize(); };
    const XA = d => [SURF * Math.asin(Math.max(-1, Math.min(1, d.x))), SURF * Math.atan2(-d.z, d.y)];
    const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    const prng = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(20261029);
    const proj = (v, up) => v.clone().addScaledVector(up, -v.dot(up)).normalize();

    // ---- remove the superseded small-world props of the shared scene (same cleanup as planets S / T / I) ------------------------
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

    // ---- features --------------------------------------------------------------------------------------------------------------
    const LK = L.lake, lakeD = P(LK.x, LK.a), SPAWN = P(0, L.spawnA);
    const wob = ang => 1 + .025 * Math.sin(3 * ang + 1.2);   // nearly a clean ellipse: the stone rim follows it
    const lakeMask = d => { if (d.y < .2) return -9; const [x, a] = XA(d); const u = (x - LK.x) / LK.rx, v = (a - LK.a) / LK.rz; return 1 - Math.hypot(u, v) / wob(Math.atan2(v, u)); };
    const taken = [];   // {dir, r} footprints: props never overlap
    const free = (d, r) => taken.every(t => arc(d, t.dir) > r + t.r) && lakeMask(d) < -.18;
    const claim = (d, r, solid = true) => { taken.push({ dir: d, r }); if (solid) obstacles.push({ dir: d.clone(), r: Math.max(.3, r * .85) }); };

    // ---- ground: recolour the stepped voxel shell, bake only exposed faces, cut a one-step hollow for the hot-spring lake ----------
    planet.geometry = new T.BoxGeometry(1, 1, 1); planet.castShadow = false;
    // 01 concept: mint is the main colour, cream and pale-yellow patches by region; risers one shade darker (green-grey / lavender-grey)
    const cMint = new T.Color('#7ec692'), cMint2 = new T.Color('#6cb983'), cMint3 = new T.Color('#95d3a3'), cBrick = new T.Color('#dc9f86'), cCream = new T.Color('#f2e4bd'), cYel = new T.Color('#ecd981');
    const wallG = new T.Color(softArt?'#b7a58c':'#97b3a2'), wallL = new T.Color(softArt?'#b2a2b7':'#aaa0c4'), tmp = new T.Color();
    const cellHash = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
    // ---- paths (computed before the ground: their cells are painted as a brick road, like planet A's) -------------------------
    const pathSegs = [];
    const slerpDirs = (a, b, n) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, ang = a.angleTo(b); out.push(ang < 1e-5 ? a.clone() : a.clone().multiplyScalar(Math.sin((1 - t) * ang)).add(b.clone().multiplyScalar(Math.sin(t * ang))).divideScalar(Math.sin(ang)).normalize()); } return out; };
    const FOREST = new V3(.25, -.72, -.65).normalize();
    const duckDir=P(L.giant.tub.x,L.giant.tub.a),octopusDir=P(L.pools[0].x,L.pools[0].a);
    const approach=(d,distance)=>d.clone().multiplyScalar(Math.cos(distance/SURF)).addScaledVector(proj(SPAWN,d),Math.sin(distance/SURF)).normalize();
    const duckApproach=approach(duckDir,6),octopusApproach=approach(octopusDir,7.5);
    const pathLines = [
      [P(0, -4.6), P(-1.7, -2.6), P(-3.0, -1.4)],
      [P(.5, -4.6), P(2.9, -2.9), P(3.6, -1.4)],
      [P(2.9, -2.9), P(6.6, -5.6)],
      [P(8.4, -8.6), new V3(.8, -.3, .52).normalize(), new V3(.62, -.62, -.1).normalize(), FOREST],
      [P(-3.0, -1.4), P(-5.6, .2), P(-7.6, 1.2)],          // to the machine's tap
      [P(-5.6, .2), P(-6.6, 4.6), P(-8.2, 8.2)],           // quiet meadow beside the wash corner
      [P(3.6, -1.4), P(4.6, .9)],                          // to the lake shore
      [P(6.6, -5.6), P(6.9, -8.2)],                        // to the frog pond
      [P(-1.5,-4.6),P(-4.8,-10.3),P(-10.5,-12),duckApproach], // western duck garden, clear of the bath furniture
      [P(6.6,-5.6),P(10.7,-4.1),P(16,.5),P(20,9),P(18,17),octopusApproach], // eastern spring, around the lake
      [duckApproach,P(-19,-3),P(-24,-18),P(-21,-31),P(-10,-36),FOREST], // loop around the tub, then the back
      [octopusApproach,P(20,17),P(23,28),P(19,38),P(12,37),FOREST], // clear of the octopus basin and arms
    ];
    for (const line of pathLines) {
      let dense = [];
      for (let i = 0; i < line.length - 1; i++) { const n = Math.max(2, Math.ceil(arc(line[i], line[i + 1]) / .25)); const s = slerpDirs(line[i], line[i + 1], n); dense.push(...(i ? s.slice(1) : s)); }
      pathSegs.push(...dense);
    }
    const pathDist = d => { let m = 99; for (const p of pathSegs) { const a = arc(d, p); if (a < m) m = a; } return m; };
    const lakeCut = new Set();
    cells.forEach(([x, y, z]) => { const d = Math.hypot(x, y, z), v = new V3(x, y, z).normalize(); const lm = lakeMask(v); if ((d > R - .6 && lm > 0) || (d > R - 1.1 && lm > .3)) lakeCut.add(x + ',' + y + ',' + z); });
    const occupied = new Set(cells.map(v => v.join(',')).filter(k => !lakeCut.has(k)));
    const topColor = (x, y, z, vv) => {
      const X = vv.x, Y = vv.y, Z = vv.z;
      const big = Math.sin(X * 2.6 + Z * 1.1 + .9) * Math.cos(Z * 2.3 - Y * 1.2 + .3) + .3 * Math.sin(Y * 3.1 + X * 1.7 - Z * 1.4);
      const hsh = cellHash(x, y, z);
      // per-cell voxel jitter: three mints, so the grass reads as blocks without turning into confetti
      const col = softArt ? new T.Color().copy(cMint2).lerp(cMint3,.45+.25*Math.sin(x*.17+z*.22-y*.19)).lerp(cMint,hsh*.10) : new T.Color().copy(cMint).lerp(hsh < .33 ? cMint2 : hsh > .72 ? cMint3 : cMint, .7);
      // patches: cream / pale yellow only where the low-frequency field is strong (mint stays the majority)
      const spawnK = smooth(3.2, 6.5, arc(vv, START_DIR));   // 0 at the spawn plaza .. 1 further out
      let cream = smooth(.62, .98, big) * .9 * spawnK, yel = smooth(.55, .95, -big) * .8 * (1 - cream) * (.2 + .8 * spawnK);
      if (!softArt && hsh > .88 && cream + yel < .2) yel = Math.max(yel, .5 * (.4 + .6 * spawnK));  // a few loose yellow cells sprinkled in the mint
      if(softArt){cream*=.55;yel*=.42;}
      col.lerp(cCream, cream).lerp(cYel, yel);
      const lm = lakeMask(vv); if (lm > -.22 && lm <= 0) col.lerp(cMint, .5);   // a calm grass ring round the lake
      col.multiplyScalar(1 - .06 * smooth(.0, -.85, vv.y));                      // lower half a touch softer (never dark)

      // P's ground is a pastel soapstone mosaic, with quiet block-to-block variation.
      if (softArt) {
        const stone = ['#c8d9c8','#ddd5c8','#d9cbd2','#c4d4d2','#e3d9cc','#cbd1dc'];
        const palette = stone[Math.min(stone.length-1,Math.floor(hsh*stone.length))];
        col.set(palette).multiplyScalar(.94 + .10 * cellHash(z,x,y));
      }

      return { col, cream: cream + yel };
    };
    {
      const cube = new T.BoxGeometry(1, 1, 1).toNonIndexed(), pp = cube.attributes.position, nn = cube.attributes.normal;
      const pos = [], norm = [], colors = [], origins = [], tops = [], paths = [], aos = [], edgeMasks = [], fc = new T.Color(), Rin = R - 1.6;
      // baked corner occlusion (classic voxel AO): each face corner looks at the 2 edge + 1 corner cells in front of the face
      const AO = [.4, .58, .79, 1], occ = (x, y, z) => occupied.has(x + ',' + y + ',' + z) ? 1 : 0;
      cells.forEach(cell => {
        const key = cell.join(','); if (lakeCut.has(key)) return;
        const vv = new V3(...cell).normalize(), { col, cream } = topColor(cell[0], cell[1], cell[2], vv);
        const onPath = pathDist(vv) < .62 && lakeMask(vv) < -.12 ? 1 : 0; if (onPath) col.copy(cBrick);
        for (let f = 0; f < 6; f++) {
          const k = f * 6, nx = nn.getX(k), ny = nn.getY(k), nz = nn.getZ(k);
          // a face is drawn when the cell beside it is air; only faces into the hollow core are skipped (skipping every inward-facing
          // face left see-through holes on the slope steps)
          const ax = cell[0] + nx, ay = cell[1] + ny, az = cell[2] + nz;
          if (occupied.has(ax + ',' + ay + ',' + az) || Math.hypot(ax, ay, az) <= Rin) continue;
          const top = nx * vv.x + ny * vv.y + nz * vv.z;
          if (top > .67) fc.copy(col); else fc.copy(col).lerp(tmp.copy(wallG).lerp(wallL, Math.min(1, cream * 1.2 + (cellHash(cell[2], cell[0], cell[1]) > .6 ? .45 : 0))), .62).multiplyScalar(.72);
          const na = nx ? 0 : ny ? 1 : 2, ua = (na + 1) % 3, va = (na + 2) % 3, base = [ax, ay, az];
          const eu=na===0?1:0,ev=na===2?1:2,edgeMask=[];
          for(const [axis,sign] of [[eu,1],[eu,-1],[ev,1],[ev,-1]]){const q=cell.slice();q[axis]+=sign;edgeMask.push(occupied.has(q.join(','))?0:1);}
          for (let j = k; j < k + 6; j++) { pos.push(pp.getX(j) + cell[0], pp.getY(j) + cell[1], pp.getZ(j) + cell[2]); norm.push(nx, ny, nz); origins.push(...cell); colors.push(fc.r, fc.g, fc.b); tops.push(col.r, col.g, col.b); paths.push(onPath);
            edgeMasks.push(...edgeMask);
            const cj = [pp.getX(j), pp.getY(j), pp.getZ(j)], o1 = base.slice(), o2 = base.slice(), o3 = base.slice(); o1[ua] += Math.sign(cj[ua]); o2[va] += Math.sign(cj[va]); o3[ua] += Math.sign(cj[ua]); o3[va] += Math.sign(cj[va]);
            const s1 = occ(...o1), s2 = occ(...o2), s3 = occ(...o3); aos.push(AO[s1 && s2 ? 0 : 3 - s1 - s2 - s3]); }
        }
      });
      const g = new T.BufferGeometry();
      for (const [name, values] of Object.entries({ position: pos, normal: norm, color: colors, cellOrigin: origins, topColor: tops })) g.setAttribute(name, new T.Float32BufferAttribute(values, 3));
      g.setAttribute('pathK', new T.Float32BufferAttribute(paths, 1)); g.setAttribute('aoK', new T.Float32BufferAttribute(aos, 1)); g.computeBoundingSphere(); planet.geometry.dispose(); planet.geometry = g; planet.count = 1; planet.setMatrixAt(0, new T.Matrix4()); planet.setColorAt(0, new T.Color('#ffffff'));
      if(softArt)g.setAttribute('pEdge',new T.Float32BufferAttribute(edgeMasks,4));
      planet.instanceMatrix.needsUpdate = true; planet.instanceColor.needsUpdate = true; planet.frustumCulled = false; cube.dispose();
    }
    planet.material = new T.MeshLambertMaterial({ vertexColors: true, emissive: '#ffe2d0', emissiveIntensity: .02 });
    // surface skin (like planet A's grass / soil, in this planet's theme): pixel-grain mint grass on top that drapes a ragged lip down
    // the risers, foam speckles and tiny bubble dots on the cream patches, and pastel bath tiles with light grout on the risers
    const skinDecl = 'varying vec3 vLocal;varying vec3 vCell;varying vec3 vFaceN;varying vec3 vTop;varying float vUp;varying float vLip;varying float vPath;varying float vAO;';
    planet.material.onBeforeCompile = sh => {
      sh.vertexShader = 'attribute vec3 cellOrigin;attribute vec3 topColor;attribute float pathK;attribute float aoK;\n' + skinDecl + '\n' + sh.vertexShader;
      sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal=normalize(mix(objectNormal,normalize(cellOrigin),.8));')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 outw=normalize(cellOrigin);vLocal=position-cellOrigin;vCell=cellOrigin;vFaceN=normal;vTop=topColor;vUp=dot(normal,outw);vLip=dot(vLocal,outw);vPath=pathK;vAO=aoK;`);
      sh.fragmentShader = skinDecl + '\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        vec3 px=floor((vLocal+.5)*8.)+vCell*13.;
        float grain=fract(sin(dot(px,vec3(12.9898,78.233,37.719)))*43758.5453);
        float grain2=fract(sin(dot(px,vec3(41.31,17.17,93.71)))*24634.634);
        vec3 fa=abs(vFaceN);vec2 uv=(fa.x>.5?vLocal.yz:fa.y>.5?vLocal.xz:vLocal.xy)+.5;
        float grass=vPath>.5?step(.67,vUp):max(step(.67,vUp),step(.3+(grain-.5)*.1,vLip));
        // top: grass grain, a few darker blade pixels; cream / yellow patches read as soap foam with bubble dots
        vec3 top=vTop*(.92+grain*.13);top*=1.-.1*step(.86,grain2);top*=1.+.05*step(.93,grain);
        float lum=dot(vTop,vec3(.3,.59,.11));float foam=smoothstep(.8,.88,lum);
        float dotK=step(1.-mix(.012,.05,foam),grain2*grain);top=mix(top,vec3(1.,.99,.97),dotK*.6);
        // risers: 2x2 pastel bath tiles per block face, light grout, a few tinted tiles
        vec2 t=uv*2.;vec2 tf=fract(t);vec2 ti=floor(t);
        float th=fract(sin(dot(ti+vCell.xy*3.1+vCell.z*7.7,vec2(12.99,78.23)))*43758.55);
        float g=min(min(tf.x,1.-tf.x),min(tf.y,1.-tf.y));float grout=1.-smoothstep(.035,.075,g);
        vec3 side=diffuseColor.rgb*(.88+.18*th);
        side=mix(side,side*vec3(1.06,.95,1.02),step(.86,th));side=mix(side,side*vec3(.96,1.0,1.08),step(.93,th));
        side=mix(side,vec3(.98,.96,.93)*min(1.,dot(diffuseColor.rgb,vec3(.33))*1.32),grout*.85);
        side*=1.-.1*smoothstep(.16,.0,g)*(1.-grout);side*=1.+.06*smoothstep(.3,.45,min(tf.x,tf.y))*smoothstep(.75,.6,max(tf.x,tf.y));
        if(vPath>.5){vec2 bq=uv*vec2(2.,3.);float row=floor(bq.y);bq.x+=mod(row,2.)*.5;vec2 bi=floor(bq),bf=fract(bq);
          float bh=fract(sin(dot(bi+vCell.xz*5.3+vCell.y*2.1,vec2(27.13,61.71)))*43758.55);
          vec3 brick=bh<.4?vec3(.88,.52,.5):bh<.7?vec3(.93,.72,.56):bh<.9?vec3(.9,.6,.42):vec3(.8,.58,.74);
          brick*=.94+grain*.1;float bg=min(min(bf.x,1.-bf.x)*.5,min(bf.y,1.-bf.y)*.333);
          top=mix(brick,vec3(.98,.9,.82),1.-smoothstep(.012,.03,bg));}
        diffuseColor.rgb=mix(side,top,grass);
        vec3 a=abs(vLocal)*2.;float mid=a.x+a.y+a.z-max(a.x,max(a.y,a.z))-min(a.x,min(a.y,a.z));
        diffuseColor.rgb*=1.-.06*smoothstep(.94,.997,mid);
        diffuseColor.rgb*=vAO;
        float gl=dot(diffuseColor.rgb,vec3(.299,.587,.114));diffuseColor.rgb=max(mix(vec3(gl),diffuseColor.rgb,1.12),0.);   // grade: a touch more colour`);
    };
    planet.material.customProgramCacheKey = () => 'p-square-ground-skin';
    softArt?.terrain(T,planet.material);

    // ---- light, fog, peach sky -------------------------------------------------------------------------------------------------
    // peach sky with a soft sun glow at the upper left of the view, a light haze over the far side of the planet; the sun light
    // itself is re-aimed every frame (scene.onBeforeRender) so it always falls from the upper left of the camera
    scene.fog = new T.Fog('#ecdcef', 34, 150);
    scene.traverse(o => { if (o.isDirectionalLight) { o.color.set('#fff0dc'); } else if (o.isHemisphereLight) { o.color.set('#fff2ea'); o.groundColor.set('#d9cbe2'); o.intensity *= .62; } });
    const sunLight = (() => { let l = null; scene.traverse(o => { if (o.isDirectionalLight && o.castShadow && !l) l = o; }); return l; })();
    const sky = skyGroup.children.find(o => o.isMesh && o.material.isShaderMaterial);
    const uSunGlow = { value: new V3(-.5, .6, -.6).normalize() }, uFixed = { value: 0 };
    if (sky) {
      sky.material.uniforms.uSunGlow = uSunGlow; sky.material.uniforms.uTime = { value: 0 }; sky.material.uniforms.uFixed = uFixed;
      // all-round pastel aurora: a soft base that drifts peach -> lavender -> mint -> baby blue by direction, four slow ribbons of
      // light curtains (pink / mint / lavender / lemon / blue along each ribbon) wrapping the whole sphere (the planet floats, so the
      // view below the horizon gets them too), and a ring of distant soap bubbles painted into the sky (no geometry, no extra draw)
      sky.material.fragmentShader = `uniform float sunset; uniform vec3 uSunGlow; uniform float uTime; uniform float uFixed; varying vec3 vDir;
        vec3 pal(float x){x=fract(x);
          vec3 a=vec3(1.,.48,.74),b=vec3(.36,.9,.72),c=vec3(.62,.5,1.),d=vec3(1.,.86,.36),e=vec3(.42,.72,1.);
          float k=x*5.;return k<1.?mix(a,b,k):k<2.?mix(b,c,k-1.):k<3.?mix(c,d,k-2.):k<4.?mix(d,e,k-3.):mix(e,a,k-4.);}
        float ribbon(vec3 d,vec3 n,vec3 a,float w,float t,float seed){
          float s=dot(d,n)+.16*sin(dot(d,a)*5.+t*.11+seed)+.07*sin(dot(d,a)*11.-t*.07+seed*2.);
          float band=exp(-s*s/(w*w));
          float curtain=.55+.45*sin(dot(d,a)*46.+sin(dot(d,a)*9.+seed)*3.+t*.25);
          float edge=exp(-pow(max(s,0.)/(w*.55),2.));   // a brighter lower hem, softer upper fringe
          return band*mix(.35,1.,curtain)*(.6+.4*edge);}
        void main(){vec3 d=normalize(vDir);float t=uTime;
          float h=d.y;
          vec3 peach=vec3(.99,.80,.72),lav=vec3(.82,.75,.96),mint=vec3(.72,.92,.86),blue=vec3(.72,.83,.99);
          vec3 c=peach;
          c=mix(c,lav,smoothstep(-.2,.9,sin(d.x*2.1+d.z*1.3+.8)*.5+.5)*.75);
          c=mix(c,mint,smoothstep(.35,1.,sin(d.z*2.4-d.y*1.7+2.1)*.5+.5)*.6);
          c=mix(c,blue,smoothstep(.45,1.,sin(d.y*2.2+d.x*1.6-1.)*.5+.5)*.5);
          vec3 R1=normalize(vec3(.15,1.,.25)),A1=normalize(vec3(1.,-.1,.3));
          vec3 R2=normalize(vec3(.8,.2,-.55)),A2=normalize(vec3(.2,.9,.3));
          vec3 R3=normalize(vec3(-.4,.45,.8)),A3=normalize(vec3(.85,.1,.4));
          vec3 R4=normalize(vec3(.3,-.85,.4)),A4=normalize(vec3(.6,.3,-.7));
          float r1=ribbon(d,R1,A1,.17,t,0.),r2=ribbon(d,R2,A2,.15,t,1.7),r3=ribbon(d,R3,A3,.14,t,3.1),r4=ribbon(d,R4,A4,.16,t,4.6);
          c=mix(c,pal(dot(d,A1)*.45+t*.006),r1*.85);
          c=mix(c,pal(dot(d,A2)*.45+.25+t*.005),r2*.8);
          c=mix(c,pal(dot(d,A3)*.45+.5-t*.004),r3*.75);
          c=mix(c,pal(dot(d,A4)*.45+.75+t*.005),r4*.75);
          c+=vec3(1.,.97,.95)*(r1+r2+r3+r4)*.06;
          float g=max(dot(d,normalize(uSunGlow)),0.);c=mix(c,vec3(1.,.96,.88),pow(g,6.)*.45);c+=vec3(1.,.93,.8)*pow(g,90.)*.45;
          // distant bubbles: thin rainbow rims, a faint film, a highlight at the upper left
          for(int i=0;i<88;i++){float fi=float(i);if(fi>=56.+32.*uFixed)continue;
            vec3 bc=normalize(vec3(sin(fi*12.9898),sin(fi*78.233+1.)*.6,sin(fi*37.719+2.)));
            float ca=cos(t*.012+fi),sa=sin(t*.012+fi);bc=normalize(vec3(bc.x*ca-bc.z*sa*.3,bc.y+.04*sin(t*.2+fi),bc.z*ca+bc.x*sa*.3));
            float rr=fract(sin(fi*4.17)*43758.5);float rad=.03+.05*rr+.09*rr*rr*rr;
            float dist=length(d-bc);if(dist>rad*1.15)continue;
            float x=dist/rad;
            vec3 tg=normalize(cross(bc,vec3(0.,1.,0.)+1e-4));vec3 bt=cross(tg,bc);vec2 q=vec2(dot(d-bc,tg),dot(d-bc,bt))/rad;
            float rim=smoothstep(.82,.97,x)*(1.-smoothstep(.97,1.02,x));
            vec3 ir=.5+.5*cos(6.2832*(x*1.4+atan(q.y,q.x)*.16+fi*.13+vec3(0.,.33,.67)));
            c=mix(c,mix(vec3(1.),ir,.55),rim*(.7+.23*uFixed));
            c=mix(c,vec3(1.,.99,1.),smoothstep(.3,1.,x)*.12);
            float hl=smoothstep(.2,.04,length(q-vec2(-.42,.44)));c=mix(c,vec3(1.),hl*.75);}
          gl_FragColor=vec4(c,1.);}`;
      sky.material.needsUpdate = true;
    }
    {
      const camR = new V3(), camF = new V3(), sup = new V3(), ld = new V3();
      const prevBR = scene.onBeforeRender;
      scene.onBeforeRender = function (r, sc, cam, ...rest) {
        if (prevBR) prevBR.call(this, r, sc, cam, ...rest);
        if (!sunLight || !cam) return;
        camR.setFromMatrixColumn(cam.matrixWorld, 0).normalize(); camF.setFromMatrixColumn(cam.matrixWorld, 2).negate().normalize();
        sup.copy(sunLight.target.position).normalize(); if (sup.lengthSq() < .5) sup.set(0, 1, 0);
        ld.copy(sup).addScaledVector(camR, -.7).addScaledVector(camF, -.2).normalize();
        sunLight.position.copy(sunLight.target.position).addScaledVector(ld, 25); sunLight.updateMatrixWorld(); sunLight.target.updateMatrixWorld();
        uSunGlow.value.setFromMatrixColumn(cam.matrixWorld, 1).multiplyScalar(.6).addScaledVector(camR, -.85).addScaledVector(camF, .9).normalize();
      };
    }
    skyGroup.children.filter(o => o.isPoints).forEach(o => { o.visible = false; });
    // clouds: a handful of cream rounded-block cumulus, one unlit merged draw
    clouds.clear(); clouds.rotation.set(0, 0, 0);
    {
      const cb = makeBatch(T, roundedBox(T, .2));
      const n = LOW_POWER ? 7 : 10;
      for (let i = 0; i < n; i++) {
        const az = i / n * Math.PI * 2 + prng() * .4, el = (.06 + prng() * .32), rad = 120 + prng() * 30;
        const ctr = new V3(Math.sin(az) * Math.cos(el) * rad, Math.sin(el) * rad, -Math.cos(az) * Math.cos(el) * rad);
        const M = new T.Matrix4().lookAt(ctr, new V3(), new V3(0, 1, 0)).setPosition(ctr); cb.setBase(M);
        const s = 5 + prng() * 4;
        cb.block(0, 0, 0, s * 3.2, s * .7, s * 1.4, '#f6dde2', { top: '#fffaf3', low: .92 });
        for (let k = 0; k < 4; k++) { const w = s * (1.1 + prng() * .6); cb.block((k - 1.5) * s * .8, s * .55 + prng() * s * .3, 0, w, w * .8, w * .9, '#fbe9e6', { top: '#fffcf7', low: .9 }); }
      }
      const cm = cb.mesh(new T.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false }), 'p-clouds'); clouds.add(cm);
    }

    // ---- shared materials / batches --------------------------------------------------------------------------------------------
    const box = roundedBox(T, .14), propMat = new T.MeshLambertMaterial({ vertexColors: true });
    propMat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat gl=dot(diffuseColor.rgb,vec3(.299,.587,.114));diffuseColor.rgb=max(mix(vec3(gl),diffuseColor.rgb,1.1),0.);'); };
    propMat.customProgramCacheKey = () => 'p-props-graded';
    const PB = makeBatch(T, box);   // every static prop of the planet: one draw
    const frameAt = (dir, face, sink = .04, lift = 0) => {
      const up = dir.clone().normalize(); let f = face ? proj(face.clone().sub(up), up) : proj(new V3(.3, .1, -1), up);
      const r = new V3().crossVectors(up, f).normalize(); f = new V3().crossVectors(r, up);
      return new T.Matrix4().makeBasis(r, up, f).setPosition(up.clone().multiplyScalar(surfaceRadius(up) - sink + lift));
    };
    const toSpawn = d => SPAWN;
    // flat decor sits on the axis-aligned voxel face under it (a sphere-normal frame would stick it into the step at an angle)
    const AX = [new V3(1, 0, 0), new V3(0, 1, 0), new V3(0, 0, 1)];
    const flatAt = (dir, face, lift = .01, yaw = 0) => {
      const r = surfaceRadius(dir), p = dir.clone().multiplyScalar(r); let best = 0, bd = 9;
      for (let i = 0; i < 3; i++) { const v = Math.abs(p.getComponent(i)), e = Math.abs(v - Math.floor(v) - .5); const w = e - Math.abs(dir.getComponent(i)) * .02; if (w < bd) { bd = w; best = i; } }
      const up = AX[best].clone().multiplyScalar(Math.sign(p.getComponent(best)) || 1);
      let f = face ? proj(face.clone().sub(dir), up) : proj(new V3(.3, .1, -1), up); if (f.lengthSq() < 1e-6) f = proj(new V3(1, 0, 0), up);
      const rt = new V3().crossVectors(up, f).normalize(); f = new V3().crossVectors(rt, up);
      const M = new T.Matrix4().makeBasis(rt, up, f); if (yaw) M.multiply(new T.Matrix4().makeRotationY(yaw));
      return M.setPosition(p.addScaledVector(up, lift));
    };

    // ---- the hot-spring stone pedestal (the stage), re-skinned like I's snow pedestal: the original boxes stay hidden for the
    // surface raycasts; on show: courses of rounded warm stones, a shallow ring of spring water round the letter groove, stone-stack
    // pillars each holding a little steaming basin (in place of the gold stars). Groove planes / reward spot are untouched. ----------
    {
      const sg = STAGE.group, TOP = STAGE.top;
      sg.children.filter(m => m.isMesh && m.geometry?.type === 'BoxGeometry').forEach(m => { m.visible = false; });
      (STAGE.stars || []).forEach(st => { st.visible = false; });
      const sb = makeBatch(T, roundedBox(T, .1)), sp = makeBatch(T, roundedBox(T, .05));
      const ST = [['#e6c7b0', '#f3dfcd'], ['#ddbdb7', '#efd8d2'], ['#cfc0d6', '#e4dbec'], ['#e9d3b6', '#f6e8d4']];
      const stone = (x, y, z, w, h, d, k, o = {}) => { const [c, t] = ST[((k % 4) + 4) % 4]; sb.block(x, y, z, w, h, d, c, { top: t, low: .78, ...o }); };
      // bottom course: a ring of big rounded boulders round the footprint, half sunk
      for (let i = 0; i < 9; i++) for (const [z, k] of [[-1.02, 0], [1.02, 2]]) stone(-2.16 + i * .54, .1, z, .56, .42, .5, i + k, { ry: (i % 3 - 1) * .08 });
      for (const x of [-2.3, 2.3]) for (let j = 0; j < 3; j++) stone(x, .1, -.54 + j * .54, .5, .42, .56, j + (x > 0 ? 1 : 3), { ry: (j - 1) * .1 });
      // body: two slightly inset rounded courses up to the table top
      stone(0, .3, 0, 4.36, .3, 1.96, 0, { low: .72 }); stone(0, TOP - .14, 0, 4.2, .26, 1.8, 3, { low: .8 });
      // table top: rim of individual stones; inside, a shallow water ring round a pale tile that carries the groove
      sb.block(0, TOP - .025, 0, 3.12, .04, 1.0, '#f4e6da', { top: '#fbf2ea', plain: true });   // pale tile under the groove(s)
      const rim = [];
      for (let i = 0; i < 8; i++) for (const z of [-.86, .86]) rim.push([-1.89 + i * .54, z, .5, .28]);
      for (const x of [-2.0, 2.0]) for (const z of [-.42, .42]) rim.push([x, z, .28, .5]);
      rim.forEach(([x, z, w, d], i) => stone(x, TOP + .06, z, w, .16, d, i * 3 + 1, { ry: (i % 3 - 1) * .05 }));
      for (const z of [-1, 1]) sp.block(0, TOP + .01, z * .615, 3.74, .03, .24, '#9ed7ec', { top: '#b8e6f4', plain: true });   // shallow spring-water ring
      for (const x of [-1, 1]) sp.block(x * 1.7, TOP + .01, 0, .34, .03, 1.0, '#9ed7ec', { top: '#b8e6f4', plain: true });
      for (const [x, z, w] of [[-1.2, .62, .16], [-.3, -.6, .1], [.9, .6, .14], [1.7, -.25, .1], [-1.72, .2, .08]]) sp.block(x, TOP + .035, z, w, .02, w * .6, '#ffffff', { plain: true });   // glints
      // front step: two rounded stones and a flat tread
      stone(0, TOP / 4, 1.2, 3.0, TOP / 2, .7, 1, { low: .78 }); for (const x of [-1.62, 1.62]) stone(x, .14, 1.25, .4, .3, .56, x > 0 ? 2 : 0);
      // pillars: three stacked rounded stones, smaller up the stack, a steaming basin on top
      for (const side of [-1, 1]) { const x = side * 2.45, z = -.5;
        stone(x, .26, z, .7, .52, .66, side > 0 ? 0 : 2, { ry: .2 }); stone(x, .74, z, .58, .46, .56, 1, { ry: -.15 }); stone(x, 1.16, z, .5, .4, .5, 3, { ry: .3 });
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; stone(x + Math.sin(a) * .27, 1.44, z + Math.cos(a) * .27, .2, .18, .14, k, { ry: a }); }
        sp.block(x, 1.45, z, .42, .05, .42, '#9ed7ec', { top: '#c6ecf7', plain: true }); sp.block(x - .06, 1.48, z + .05, .08, .02, .06, '#ffffff', { plain: true }); }
      const stoneMat = new T.MeshLambertMaterial({ vertexColors: true });
      const sm = sb.mesh(stoneMat, 'p-stage-stones'); sm.castShadow = true; sm.receiveShadow = true; sm.userData.kind = 'ground'; sg.add(sm);
      const wm = sp.mesh(new T.MeshLambertMaterial({ vertexColors: true, emissive: '#cfefff', emissiveIntensity: .12 }), 'p-stage-water'); wm.receiveShadow = true; wm.userData.kind = 'ground'; sg.add(wm);
      claim(STAGE.center || P(0, 0), 2.6, false);
    }

    // ---- paths: pale-yellow dashed stepping tiles ------------------------------------------------------------------------------

    // ---- hot-spring lake: pink water cap sunk one step, grass ring, a few rim stones ------------------------------------------
    const WB = { P: [], C: [], I: [] };   // all water (lake, pools, fountain) in one mesh
    const capAt = (dirFn, rings, segs, rad, colIn, colOut, ease = t => smooth(.55, 1, t), tint = null) => {
      const base = WB.P.length / 3, ci = new T.Color(colIn), co = new T.Color(colOut), cc = new T.Color();
      const c0 = dirFn(0, 0).multiplyScalar(rad(0, 0)); WB.P.push(c0.x, c0.y, c0.z); WB.C.push(ci.r, ci.g, ci.b);
      for (let r = 1; r <= rings; r++) for (let s = 0; s < segs; s++) { const t = r / rings, ang = s / segs * Math.PI * 2, d = dirFn(t, ang).multiplyScalar(rad(t, ang)); WB.P.push(d.x, d.y, d.z); cc.copy(ci).lerp(co, ease(t)); if (tint) tint(cc, t, ang); WB.C.push(cc.r, cc.g, cc.b); }
      for (let s = 0; s < segs; s++) WB.I.push(base, base + 1 + s, base + 1 + (s + 1) % segs);
      for (let r = 1; r < rings; r++) for (let s = 0; s < segs; s++) { const a = base + 1 + (r - 1) * segs + s, b = base + 1 + (r - 1) * segs + (s + 1) % segs, a2 = a + segs, b2 = b + segs; WB.I.push(a, b2, b, a, a2, b2); }
    };
    // the hot-spring lake: water a step down, deeper rose in the middle, soft lighter bands; a tidy ring of rounded stones covers
    // the voxel edge (each stone reaches from the water up to the ground beside it, tops smoothed with the neighbours), a second
    // course of smaller cap stones on top, like the bubble fountain
    const lakeAt = k => (t, ang) => { const kk = t * wob(ang) * k; return P(LK.x + Math.cos(ang) * LK.rx * kk, LK.a + Math.sin(ang) * LK.rz * kk); };
    const WL = R - .2;
    capAt(lakeAt(1.04), 7, 56, () => WL, '#df7aa4', '#f6bdd1', t => smooth(.05, 1, t), (cc, t, ang) => { const band = .5 + .5 * Math.sin(t * 13 + Math.sin(ang * 3) * 1.4); cc.lerp(tmp.set('#fbd3e2'), band * .22 * smooth(.15, .9, t)); });
    {
      const NS = 30, tops = [];
      for (let i = 0; i < NS; i++) { const ang = i / NS * Math.PI * 2; tops.push(Math.max(WL + .15, surfaceRadius(lakeAt(1.2)(1, ang)) + .1)); }
      const LS = [['#e8cdb6', '#f5e4d3'], ['#e0c4c0', '#f1dcd8'], ['#d6c8dc', '#ebe2f0'], ['#ecd9bf', '#f8ecdb']];
      for (let i = 0; i < NS; i++) {
        const ang = (i + .5) / NS * Math.PI * 2, d = lakeAt(1.0)(1, ang), nxt = lakeAt(1.0)(1, ang + .2);
        const top = (tops[i] + tops[(i + 1) % NS] + Math.max(tops[i], tops[(i + 1) % NS])) / 3, bot = WL - .25, h = top - bot;
        const up = d.clone(), tng = proj(nxt.clone().sub(d), up), out = new V3().crossVectors(tng, up).normalize();
        const M = new T.Matrix4().makeBasis(tng, up, out).setPosition(up.clone().multiplyScalar(bot + h / 2));
        PB.setBase(M); const [c, t] = LS[i % 4], w = 2 * Math.PI * ((LK.rx + LK.rz) / 2) / NS * 1.12;
        PB.block(0, 0, .08, w, h, 1.05, c, { top: t, low: .8 });
        const [c2, t2] = LS[(i + 2) % 4];
        if(softArt)PB.shape(softArt.shapes(T).rocks[i%3],0,h/2+.10,.12,w*.52,.14,.40,c2,{top:t2,soft:true,ry:(i%3-1)*.08});
        else PB.block(0, h / 2 + .07, .12, w * .82, .2, .62, c2, { top: t2, low: .85, ry: (i % 3 - 1) * .08 });
      }
      // a few flat glints on the water
      for (const [k, ang, w] of [[.35, .6, .5], [.55, 2.4, .36], [.25, 3.9, .3], [.6, 5.1, .42], [.15, 1.7, .22]]) { const d = lakeAt(1)(k, ang); PB.setBase(frameAt(d, lakeD, 0).setPosition(d.clone().multiplyScalar(WL + .015))); PB.block(0, 0, 0, w, .02, w * .3, '#fff1f6', { plain: true, ry: ang }); }
    }
    claim(lakeD, 0, false);
    for (const [dx, da, r] of [[0, 0, 3.6], [-2.6, -.4, 2.6], [2.8, .2, 2.6], [.3, -2.4, 2.2], [.2, 2.6, 2.4]]) obstacles.push({ dir: P(LK.x + dx, LK.a + da), r, kind: 'p-lake' });

    // ---- small round pools and the bubble fountain (stone ring + water cap) ----------------------------------------------------
    const ringPool = (d, r, colIn, colOut, h = .26) => {
      const up = d.clone(), e1 = proj(new V3(1, 0, 0).add(new V3(0, 0, .01)), up), e2 = new V3().crossVectors(up, e1);
      const at = (t, ang) => up.clone().addScaledVector(e1, Math.cos(ang) * r * t / SURF).addScaledVector(e2, Math.sin(ang) * r * t / SURF).normalize();
      // the basin sits on the highest voxel under it, so the stepped ground never cuts through the water
      let hi = 0, lo = 99; for (let t = 0; t <= 1.2; t += .3) for (let k = 0; k < 12; k++) { const sr = surfaceRadius(at(t, k / 12 * 6.283)); hi = Math.max(hi, sr); lo = Math.min(lo, sr); }
      const base = hi;
      capAt(at, 3, 24, () => base + h - .06, colIn, colOut);
      const n = Math.round(r * 10);
      const M = frameAt(d, null, 0); M.setPosition(up.clone().multiplyScalar(base)); PB.setBase(M);
      for (let i = 0; i < n; i++) { const a=i/n*Math.PI*2,x=Math.sin(a)*(r+.2),z=Math.cos(a)*(r+.2);
        // The relocated spring needs a foundation down to its own voxel steps, rather than a floating rim.
        let floor=-.14;for(const dx of [-.24,0,.24]){const q=new V3(x+Math.cos(a)*dx,0,z-Math.sin(a)*dx).applyMatrix4(M).normalize();floor=Math.min(floor,surfaceRadius(q)*q.dot(up)-base-.04);}
        if(floor<-.16)PB.block(x,(floor-.12)*.5,z,.62,-.12-floor,.42,'#b7a58c',{ry:a,top:'#cdbb9e',low:.9});
        PB.block(x,(h-.12)*.5+.04,z,.62,h+.2,.42,['#ded2c6','#d2c5bd','#e8ddd1'][i%3],{ry:a,top:'#f3ebe1',low:.85}); }
      return base;
    };
    const pools = L.pools.map(p => { const d = P(p.x, p.a); p.base = ringPool(d, p.r, p.c === 'pink' ? '#f0a0bc' : '#9fd6ef', p.c === 'pink' ? '#f8c8d8' : '#cbeaf8'); claim(d, p.r + .5); return { dir: d, r: p.r, color: p.c, base: p.base }; });
    // ---- wonder props: bubble-bath creatures (each its own small mesh so it can move; ~6 draws in all) ----------------------
    const creatures = [];
    const placeCreature = (cr, d, r, at = null) => { const M = frameAt(d, SPAWN, .04);
      if (at) M.setPosition(at); else if (r) {   // on stepped ground stand on the LOWEST voxel under the footprint (the rest sinks into the step), never float
        const up = d.clone(), e1 = proj(new V3(1, .2, .1), up), e2 = new V3().crossVectors(up, e1); let lo = surfaceRadius(d);
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, q = up.clone().addScaledVector(e1, Math.cos(a) * r * .55 / SURF).addScaledVector(e2, Math.sin(a) * r * .55 / SURF).normalize(); lo = Math.min(lo, surfaceRadius(q)); }
        M.setPosition(up.multiplyScalar(lo - .03)); } const sc = new V3(); M.decompose(cr.root.position, cr.root.quaternion, sc);
      root.add(cr.root); cr.root.traverse(o => { if (o.isMesh) o.receiveShadow = true; }); creatures.push(cr); if (r) claim(d, r); return cr; };
    // ---- giants: the clawfoot tub with the rubber duck family (its foam replaces the old stone fountain as a bubble source) and
    // the octopus rising out of the pink spring (pools[0]); its arms arch over the grass, the tips landing where the ground is
    const giantTub = placeCreature(A.giantTub(T, propMat), P(L.giant.tub.x, L.giant.tub.a), 4.2);
    const fountainD = giantTub.root.localToWorld(giantTub.foam.clone()).normalize(), fBase = giantTub.root.position.length() + 2.6;
    { const sp = pools[0], M = frameAt(sp.dir, SPAWN, 0).setPosition(sp.dir.clone().multiplyScalar(sp.base + .2)), inv = M.clone().invert();
      const groundY = (x, z) => { const d = new V3(x, 0, z).applyMatrix4(M).normalize(); return d.multiplyScalar(surfaceRadius(d)).applyMatrix4(inv).y; };
      const oc = A.giantOctopus(T, propMat, groundY); M.decompose(oc.root.position, oc.root.quaternion, new V3()); root.add(oc.root); creatures.push(oc); claim(sp.dir,6.8,false); }

    // ---- bath corner next to the machine: towel rack + two barrels -------------------------------------------------------------
    {
      const rd = P(L.bath.rack.x, L.bath.rack.a); PB.setBase(frameAt(rd, SPAWN, .04));
      for (const x of [-.85, .85]) { PB.block(x, .7, 0, .14, 1.4, .14, A.C.wood, { top: A.C.woodTop }); PB.block(x, .06, 0, .4, .12, .4, A.C.woodDark); }
      PB.block(0, 1.36, 0, 1.95, .1, .1, A.C.woodTop, { top: '#d9a46c' });
      [['#f6b0c8', -.5], ['#c5b3ee', .02], ['#a3dec7', .52]].forEach(([col, x]) => { PB.block(x, 1.08, .02, .42, .5, .05, col, { top: '#ffffff', low: .9 }); PB.block(x, 1.38, 0, .44, .1, .14, col); for (const k of [-1, 1]) PB.block(x + k * .12, 1.08, .055, .06, .5, .01, '#ffffff', { plain: true }); });
      claim(rd, 1.0);
      L.bath.barrels.forEach(([x, a], i) => { const d = P(x, a); PB.setBase(frameAt(d, SPAWN, .04).multiply(new T.Matrix4().makeRotationY(i * .5)));
        for (let k = 0; k < 2; k++) PB.block(0, .45, 0, .72, .86, .72, '#b5804c', { ry: k * Math.PI / 4, top: '#c99662', low: .85 });
        for (const y of [.2, .7]) for (let k = 0; k < 2; k++) PB.block(0, y, 0, .76, .07, .76, '#6f4628', { ry: k * Math.PI / 4, plain: true });
        PB.block(0, .89, 0, .56, .02, .56, '#a6dcf2', { plain: true }); claim(d, .55); });
    }
    claim(P(L.machine.x, L.machine.a), 1.25 * (L.machine.scale || 1), false); claim(P(L.pupu.x, L.pupu.a), .6, false);
    { const m0 = c.orchard?.granny?.machine; if (m0) {   // decorate() leaned the old giant toward the spawn; the life-size one stands upright
      const md = P(L.machine.x, L.machine.a), Mm = frameAt(md, SPAWN, .06), q = new T.Quaternion(), pp = new V3(), sc = new V3(); Mm.decompose(pp, q, sc);
      m0.root.position.copy(pp); m0.root.quaternion.copy(q);
      // a giant machine keeps a child-sized tap at hand height (~.85 above the ground) on the front of the tank's lower bulge
      const ms = L.machine.scale || 1, tu = m0.tap.userData; if (ms !== 1 && tu.inner) { tu.inner.scale.setScalar(1 / ms); const ly = .85 / ms, lr = ly < .34 ? .6 : ly < .48 ? .6 + (ly - .34) / .14 * .06 : .66; m0.tap.position.set(.28, ly, Math.sqrt(lr * lr - .28 * .28) + .02); }
      m0.root.updateMatrixWorld(true);
      // on a stepped slope the ground in front of the tap can be a step lower: sink the machine (its back settles into the upper step)
      const tw = m0.tap.getWorldPosition(new V3()), drop = tw.length() - surfaceRadius(tw.clone().normalize()) - .85;
      if (drop > .05) { m0.root.position.addScaledVector(md.clone().normalize(), -Math.min(drop, 1.2)); m0.root.updateMatrixWorld(true); } } }

    // ---- three big landmark props (T-like density of large shapes) --------------------------------------------------------------
    const bigAt = (x, a, r) => { const d = P(x, a); PB.setBase(frameAt(d, SPAWN, .02)); claim(d, r, false); return d; };
    { // giant rubber duck
      bigAt(L.big.duck.x, L.big.duck.a, .45); PB.setBase(PB.base().clone().multiply(new T.Matrix4().makeRotationY(-.6)).multiply(new T.Matrix4().makeScale(.2, .2, .2))); const Y = '#ffd84a', YT = '#ffe788';
      for (let k = 0; k < 2; k++) { PB.block(0, .75, 0, 2.3, 1.2, 1.7, Y, { top: YT, ry: k * .2 }); }
      PB.block(-1.05, 1.25, 0, .6, .5, .8, Y, { top: YT, rz: .5 });                                           // tail
      for (const z of [-.8, .8]) PB.block(-.15, .95, z, 1.0, .45, .2, '#f7c63a', { top: YT, rz: -.2 });       // wings
      PB.block(.6, 1.85, 0, 1.15, 1.05, 1.05, Y, { top: YT }); PB.block(1.3, 1.72, 0, .55, .22, .55, '#ff9a4a', { top: '#ffb878' });  // head + beak
      for (const z of [-.33, .33]) { PB.block(1.12, 2.05, z, .1, .2, .16, '#3b2f3a', { plain: true }); PB.block(1.14, 2.1, z + (z > 0 ? -.03 : .03), .06, .07, .06, '#ffffff', { plain: true }); }
      PB.block(1.0, 1.85, -.52, .14, .1, .1, '#f7a3be', { plain: true }); PB.block(1.0, 1.85, .52, .14, .1, .1, '#f7a3be', { plain: true });   // blush
    }
    // ---- the small creatures (snail, frog, whale) ----------------------------------------------------------------------------
    placeCreature(A.swirlSnail(T, propMat), P(L.big.snail.x, L.big.snail.a), .9);
    { const blue = pools.filter(p => p.color === 'blue');   // the frog floats on a lily pad in one blue pool; the whale soaks in the other
      if (blue[0]) placeCreature(A.frogPad(T, propMat), blue[0].dir, 0, blue[0].dir.clone().multiplyScalar(blue[0].base + .22));
      if (blue[1]) placeCreature(A.whale(T, propMat), blue[1].dir, 0, blue[1].dir.clone().multiplyScalar(blue[1].base - .12)); }

    // ---- candy mushroom forest round the lower / back side -----------------------------------------------------------------
    const mushrooms = [];
    {
      const want = LOW_POWER ? 26 : 34; let tries = 0;
      while (mushrooms.length < want && tries++ < 4000) {
        const d = new V3(prng() * 2 - 1, -prng() * .95 - .05, prng() * 2 - 1).normalize();
        if (d.y > -.22) continue; const near = d.dot(FOREST); if (prng() > .45 + .55 * smooth(.2, .9, near)) continue;
        const h = 1.7 + prng() * 1.9, r = h * .5;
        if (!free(d, r) || pathDist(d) < r * .6 + .3) continue;
        PB.setBase(frameAt(d, null, .05).multiply(new T.Matrix4().makeRotationY(prng() * 6.28))); A.mushroom(PB, 0, 0, h, mushrooms.length, mushrooms.length);
        claim(d, r * .55 + .25); taken[taken.length - 1].r = r; mushrooms.push({ dir: d, h });
      }
    }
    // big caps framing the main area (like the trees round planet A's stage): a giant and one or two smaller ones per spot
    L.frameShrooms.forEach(([x, a, h], i) => { const d = P(x, a); if (!free(d, h * .45) || pathDist(d)<h*.45+.65) return;
      PB.setBase(frameAt(d, null, .1).multiply(new T.Matrix4().makeRotationY(i * 1.3))); A.mushroom(PB, 0, 0, h, i + 1, i);
      A.mushroom(PB, h * .42, h * .2, h * .42, i + 2, i + 3); if (i % 2) A.mushroom(PB, -h * .3, h * .3, h * .3, i + 3, i + 5);
      claim(d, h * .45); taken[taken.length - 1].r = h * .5; mushrooms.push({ dir: d, h }); });
    // ---- midground bath vignettes (2026-10-31): static pieces stay in PB; one duck mesh and one lamp-head mesh ---------------
    const midgroundParts = [], midgroundShadows = [], midgroundGroups = [];
    const midgroundStart = PB.count(), lampBatch = makeBatch(T, box);
    const mgWood = '#b98250', mgTop = '#d5a66d', mgDark = '#875b3b';
    const mgBlock = (batch, x, y, z, sx, sy, sz, color, options = {}) => batch.block(x, y, z, sx, sy, sz, color, { ...options, plain: options.plain || Math.min(sx, sy, sz) < .15 });
    const mgFrame = (d, radius) => {
      const M = frameAt(d, SPAWN, .04), right = new V3().setFromMatrixColumn(M, 0), front = new V3().setFromMatrixColumn(M, 2);
      let lo = surfaceRadius(d), hi = lo;
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6, q = d.clone().addScaledVector(right, Math.cos(a) * radius * .55 / SURF).addScaledVector(front, Math.sin(a) * radius * .55 / SURF).normalize();
        const h = surfaceRadius(q) * q.dot(d); lo = Math.min(lo, h); hi = Math.max(hi, h);
      }
      M.setPosition(d.clone().multiplyScalar(lo - .04)); return { M, lo, hi };
    };
    const mgItem = (id, x, a, radius, height, build) => {
      const d = P(x, a), { M, lo, hi } = mgFrame(d, radius), start = PB.count();
      if (['A-washbasin','A-towels','A-soap'].includes(id)) M.copy(flatAt(d,SPAWN,.02));
      PB.setBase(M);
      const b = (...args) => mgBlock(PB, ...args); build(b, M);
      const entry = { id, x, a, radius, height, groundSpread: hi - lo, baseRadius: lo - .04, dir: d, start, count: PB.count() - start };
      midgroundParts.push(entry);
      if (height > 1 || id==='G-chair') { const anchor = new T.Object3D(); M.decompose(anchor.position, anchor.quaternion, anchor.scale); midgroundShadows.push([anchor, radius * 2.15, radius * 2.15]); }
      return entry;
    };
    const mgClaim = (id, x, a, radius) => { const d = P(x, a); claim(d, radius); midgroundGroups.push({ id, x, a, radius }); };
    const mgBasin = (b, radius = .43, height = .43) => {
      for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5; b(Math.sin(a) * radius, height * .5, Math.cos(a) * radius, .26, height, .12, j % 2 ? mgWood : mgTop, { ry: a, top: '#e5bc88' }); }
      b(0, .08, 0, radius * 1.7, .16, radius * 1.7, mgDark);
      b(0, height - .1, 0, radius * 1.65, .06, radius * 1.65, '#a9e7dd');
      for (const [x,z,s] of [[-.17,.08,.25],[.13,.16,.21],[.12,-.13,.18]]) b(x, height - .02, z, s, s * .65, s, '#fffaf1', { top: '#ffffff' });
    };
    // A: a usable washing corner, with a full walking gap beside the existing towel rack.
    mgClaim('A-bath', -6.8, -4.2, 1.15);
    mgItem('A-stool', -6.55, -3.75, .35, .45, b => {
      for (const x of [-.22,.22]) for (const z of [-.18,.18]) b(x,.2,z,.11,.4,.11,mgWood);
      b(0,.4,0,.67,.1,.54,mgTop,{top:'#e9c38e'}); b(0,.2,0,.5,.07,.08,mgDark);
    });
    mgItem('A-washbasin', -7.2, -3.8, .48, .52, b => mgBasin(b));
    mgItem('A-towels', -6.75, -4.65, .36, .5, b => {
      ['#f3b6ce','#b8dfed','#d4c2ee'].forEach((col,i)=>{ b(0,.1+i*.16,0,.64-i*.035,.16,.43,col,{top:'#fff4ee'});b(.02,.12+i*.16,.219,.38,.035,.012,'#fff8ee'); });
    });
    mgItem('A-soap', -6.05, -4.55, .25, .19, b => { b(0,.06,0,.43,.1,.31,'#ddd3e9');b(0,.14,0,.31,.12,.21,'#b8e3cf',{top:'#e5f4d7'});b(0,.205,0,.12,.012,.07,'#f9fff0'); });
    mgItem('A-brush-bucket', -7.45, -4.6, .32, .88, b => {
      mgBasin(b,.25,.47); b(.13,.62,0,.065,.64,.065,mgTop,{rz:-.3});b(.24,.9,0,.24,.12,.15,'#e6c582',{rz:-.3});
      for (const x of [.17,.23,.29]) b(x,.96,0,.04,.09,.13,'#fff0c9',{rz:-.3});
    });
    // B: five pump-bottle lamps, all outside the tall-object sight corridor. The heads share one unlit batch.
    [[-3,-3.4],[-5.1,-5.4],[-4.1,1],[-6.1,7.8],[-1,4.3]].forEach(([x,a],i)=>{
      mgClaim('B-lamp-'+i,x,a,.43);
      mgItem('B-lamp-'+i,x,a,.42,2.08,(b,M)=>{
        const col=['#f6e7b5','#f4bdcf','#b9dfd4','#d9c8eb','#f4d59a'][i];
        b(0,.08,0,.76,.16,.62,'#d5c6b3');b(0,.75,0,.64,1.25,.53,col,{top:'#fff3d5'});
        b(0,1.4,0,.47,.19,.41,col);b(0,1.58,0,.16,.24,.16,'#c99548');
        b(.1,1.72,0,.48,.12,.24,'#e6b968',{top:'#ffdf99'});b(.29,1.66,0,.12,.12,.14,'#c99548');
        b(0,.85,.274,.37,.42,.025,'#fff7e8');b(0,.88,.293,.16,.19,.02,'#a6dacc');b(.08,1.04,.294,.065,.065,.02,'#d6eee4');
        lampBatch.setBase(M);mgBlock(lampBatch,0,1.92,0,.31,.31,.31,'#fff9e3',{top:'#ffffff'});
      });
    });
    // C: open bubble rings. No extra glass bubbles or transparent membrane draw call.
    [[14.7,5.3],[-4.9,7.5]].forEach(([x,a],i)=>{
      mgClaim('C-ring-'+i,x,a,.86);
      mgItem('C-ring-'+i,x,a,.79,2.1,(b,M)=>{
        for (const x of [-.32,.32]) { b(x,.61,0,.12,1.22,.15,mgWood); b(x,.07,0,.32,.14,.45,mgDark); }
        b(0,1.14,0,.86,.13,.17,mgTop);
        for(let j=0;j<14;j++){const t=j*Math.PI/7;b(Math.sin(t)*.5,1.57+Math.cos(t)*.5,0,.2,.25,.16,j%2?'#f4a6ce':'#e98fba',{rz:-t,top:'#ffd3e6'});}
        const bucketDir=new V3(.65,0,.17).applyMatrix4(M).normalize();PB.setBase(mgFrame(bucketDir,.22).M);b(0,.26,0,.38,.5,.38,'#bc8b59',{top:'#dfb47d'});b(0,.51,0,.3,.035,.3,'#b0e4dd');b(0,.66,0,.38,.045,.045,'#ddb578');
      });
    });
    // D: three readable groups of porous sponge stones and tilted bath-salt crystals.
    [[-11.3,-8.8],[10.2,4.5],[-3.5,10.5]].forEach(([x,a],i)=>{
      mgClaim('D-sponge-'+i,x,a,1.2);
      mgItem('D-sponge-'+i,x,a,1.1,1.32,(b,M)=>{
        for(const [ox,oz,w,h,d] of [[-.38,.05,.85,1.12,.8],[.48,-.1,.68,.82,.64],[-.16,-.55,.48,1.3,.5]]){
          PB.setBase(mgFrame(new V3(ox,0,oz).applyMatrix4(M).normalize(),Math.min(w,d)*.5).M);b(0,h*.5,0,w,h,d,'#f1d981',{top:'#fff0ad',ry:ox*.18});
          for(const [u,v] of [[-.2,.72],[.14,.41],[-.1,.2]])b(u*w,v*h,d*.505,.13,.13,.018,'#d8bd65');
          b(.1,h+.009,-.08,.15,.014,.15,'#dfc572');
        }
        for(let j=0;j<4;j++){const h=.56+j*.14;PB.setBase(mgFrame(new V3(-.42+j*.24,0,.64).applyMatrix4(M).normalize(),.14).M);b(0,h*.5,0,.2,h,.23,['#deb8e7','#f1c1d7','#cab9e9','#e9c9ef'][j],{rz:(j-1.5)*.16,top:'#fff0ff'});}
      });
    });
    // E: separated low borders; openings remain at the stage, spawn, answer spots and all paths.
    const mgFence = (id, from, to, flowerSide) => {
      const cx=(from[0]+to[0])/2,ca=(from[1]+to[1])/2,len=Math.hypot(to[0]-from[0],to[1]-from[1]);
      mgClaim(id,cx,ca,len*.5+.2);
      const n=Math.ceil(len/.52),points=[];
      for(let j=0;j<=n;j++){
        const t=j/n,x=from[0]+(to[0]-from[0])*t,a=from[1]+(to[1]-from[1])*t,d=P(x,a),F=mgFrame(d,.13);points.push({d,M:F.M});
        mgItem(id+'-post-'+j,x,a,.13,.57,b=>{b(0,.25,0,.14,.5,.14,['#e6b3c9','#c6dccc','#d4c3e3'][j%3]);b(0,.53,0,.2,.12,.2,'#fff0d7');});
      }
      for(let j=1;j<points.length;j++){
        const a=points[j-1],b=points[j],u=a.d.clone().add(b.d).normalize(),p=new V3().setFromMatrixPosition(a.M),q=new V3().setFromMatrixPosition(b.M),along=q.clone().sub(p),z=along.clone().normalize(),right=new V3().crossVectors(u,z).normalize(),up=new V3().crossVectors(z,right).normalize();
        const M=new T.Matrix4().makeBasis(right,up,z).setPosition(p.clone().add(q).multiplyScalar(.5));PB.setBase(M);
        for(const h of [.19,.39])mgBlock(PB,0,h,0,.08,.09,along.length()+.05,'#d8bdcf');
      }
      // Small planted boxes are on the outer side of each border, with gaps between them.
      const dx=(to[0]-from[0])/len,da=(to[1]-from[1])/len;
      for(const t of [.26,.74]){
        const x=from[0]+(to[0]-from[0])*t-da*.3*flowerSide,a=from[1]+(to[1]-from[1])*t+dx*.3*flowerSide;
        mgItem(id+'-flowers-'+t,x,a,.28,.58,b=>{
          b(0,.14,0,.48,.28,.37,'#e6cba7',{top:'#f5dcc0'});b(0,.285,0,.4,.025,.29,'#94734e');
          for(let k=0;k<3;k++){const ox=(k-1)*.13,h=.42+(k%2)*.09;b(ox,(h+.28)/2,0,.035,h-.28,.035,'#82b58c');b(ox,h,0,.16,.065,.16,['#f4afc9','#fff0a7','#fff8ef'][k]);b(ox,h+.025,0,.055,.04,.055,'#e9bd65');}
        });
      }
    };
    mgFence('E-left',[-4.2,-4.8],[-4.2,-1.8],1);
    mgFence('E-lake',[5.5,-3.1],[5.5,-.1],-1);
    mgFence('E-front',[-1.8,-6.85],[1.8,-6.85],1);
    // F: the existing bath duck's proportions, five in one animated mesh (the last one is pale blue).
    {
      const d=P(-8.9,-5.4),groupFrame=frameAt(d,SPAWN,0),inverse=groupFrame.clone().invert(),ducks=makeBatch(T,box);
      for(let i=0;i<5;i++){
        const x=-9.4+i*.25,a=-4.6-i*.4,p=P(x,a),F=mgFrame(p,.25),heading=proj(P(x+.25,a-.4).sub(p),p).normalize();
        const M=new T.Matrix4().makeBasis(heading,p,new V3().crossVectors(heading,p)).setPosition(new V3().setFromMatrixPosition(F.M));
        ducks.setBase(inverse.clone().multiply(M).multiply(new T.Matrix4().makeScale(.19,.19,.19)));
        const b=(x,y,z,sx,sy,sz,col,o={})=>mgBlock(ducks,x,y,z,sx,sy,sz,col,{...o,plain:o.plain||Math.min(sx,sy,sz)*.19<.15}),yellow=i===0?'#a4d9ef':'#ffdb70',top=i===0?'#d4edfa':'#ffec9f';
        for(let k=0;k<2;k++)b(0,.75,0,2.3,1.2,1.7,yellow,{top,ry:k*.2});
        b(-1.05,1.25,0,.6,.5,.8,yellow,{top,rz:.5});for(const z of [-.8,.8])b(-.15,.95,z,1,.45,.2,i===0?'#8dc5e3':'#f0c357',{top,rz:-.2});
        b(.6,1.85,0,1.15,1.05,1.05,yellow,{top});b(1.3,1.72,0,.55,.22,.55,'#f5a666',{top:'#ffc38b'});
        for(const z of [-.33,.33]){b(1.12,2.05,z,.1,.2,.16,'#49394a',{plain:true});b(1.14,2.1,z,.06,.07,.06,'#fffdf2',{plain:true});}
        b(1,1.85,-.52,.14,.1,.1,'#efabc2',{plain:true});b(1,1.85,.52,.14,.1,.1,'#efabc2',{plain:true});
        const shadowAnchor=new T.Object3D();M.decompose(shadowAnchor.position,shadowAnchor.quaternion,shadowAnchor.scale);midgroundShadows.push([shadowAnchor,.52,.64]);
        claim(p,.25);midgroundParts.push({id:'F-duck-'+i,x,a,radius:.25,height:.46,dir:p,groundSpread:F.hi-F.lo});
      }
      const mesh=ducks.mesh(propMat,'p-midground-duck-line');groupFrame.decompose(mesh.position,mesh.quaternion,mesh.scale);mesh.castShadow=!LOW_POWER;mesh.receiveShadow=true;root.add(mesh);
      const home=mesh.position.clone(),q=mesh.quaternion.clone(),turn=new T.Quaternion(),e=new T.Euler();
      creatures.push({root:mesh,anim(time){e.set(.018*Math.sin(time*1.3),.022*Math.sin(time*.85),.014*Math.sin(time*1.3));mesh.quaternion.copy(q).multiply(turn.setFromEuler(e));mesh.position.copy(home).addScaledVector(d,.008*Math.sin(time*1.3));}});
      midgroundGroups.push({id:'F-duck-line',x:-8.9,a:-5.4,radius:1.15,triangles:ducks.count()/3});
    }
    // G: striped lounger, bubble-pattern parasol and a small drink table beside the whale pool.
    mgClaim('G-lounge',10.4,12.2,1.45);
    mgItem('G-chair',10.4,11.9,.9,1.65,(b,M)=>{
      // A long seat spans several voxel steps. Keep the lowest-foot frame, clear the seat,
      // and extend each wooden leg down to its own step so neither seat nor feet float.
      const inv=M.clone().invert(),ground=(x,z)=>{const d=new V3(x,0,z).applyMatrix4(M).normalize();return d.multiplyScalar(surfaceRadius(d)).applyMatrix4(inv).y;};
      let top=0;for(let x=-.43;x<=.44;x+=.086)for(let z=-.79;z<=.8;z+=.079)top=Math.max(top,ground(x,z));
      const lift=Math.max(0,top+.09-.35);
      for(const x of [-.36,.36]){
        for(const z of [-.57,.55]){const foot=ground(x,z)-.04,h=lift+.46-foot;b(x,(foot+lift+.46)/2,z,.11,h,.11,mgWood);}
        b(x,lift+.41,0,.11,.12,1.55,mgTop);
      }
      b(0,lift+.45,.25,.77,.12,.95,mgWood);b(0,lift+.68,-.49,.77,.12,.77,mgWood,{rx:-.65});
      for(let k=0;k<5;k++){const x=(k-2)*.14,col=k%2?'#fff1d7':'#b4dcd5';b(x,lift+.525,.25,.14,.04,.93,col);b(x,lift+.745,-.49,.14,.04,.74,col,{rx:-.65});}
    });
    mgItem('G-parasol',9.7,12.65,.83,2.17,b=>{
      b(0,.06,0,.48,.12,.48,'#d8c4a4');b(0,1,0,.075,1.96,.075,mgWood);
      for(let j=0;j<8;j++){const a=j*Math.PI/4;b(Math.sin(a)*.34,1.91,Math.cos(a)*.34,.5,.13,.96,j%2?'#c9e4df':'#e1c4df',{ry:a,rx:.13,top:j%2?'#e1f2e7':'#f2dfed'});}
      b(0,2.04,0,.64,.16,.64,'#f5ddb6',{top:'#fff2d8'});b(0,2.11,0,.12,.12,.12,'#ddb67d');
      for(const [x,z] of [[-.42,.25],[.43,.18],[.04,-.5]]){b(x,2.005,z,.19,.018,.19,'#fff8ee');b(x+.045,2.02,z-.045,.055,.012,.055,'#f7e8bb');}
    });
    mgItem('G-table',11.2,12.45,.38,1.16,b=>{
      b(0,.3,0,.13,.6,.13,mgWood);b(0,.07,0,.52,.14,.48,mgDark);b(0,.62,0,.65,.1,.55,mgTop,{top:'#edd0a1'});
      b(0,.79,0,.2,.25,.2,'#b2e2e8',{top:'#fff2c6'});b(.045,1.01,0,.035,.29,.035,'#fff6e5',{rz:-.15});b(.09,1.14,0,.15,.035,.035,'#f0b2cd');
    });
    const lampMesh=lampBatch.mesh(new T.MeshBasicMaterial({vertexColors:true,toneMapped:false}),'p-midground-lamp-heads');root.add(lampMesh);
    const midgroundStaticTriangles=(PB.count()-midgroundStart)/3;
    // Whole-globe groves: crowns stay out of the lesson, lake and all walking trails.
    // Trunks alone collide; foliage, shrubs and contact shadows stay in the existing batches.
    const treeSpots=[],giantTreeSpots=[],shrubSpots=[],vegetationStart=PB.count();
    const lessonClear=[[-3.1,3.7],[-6.3,5.6],[-8.8,-1.7],[-3.4,-6.4],[3.4,-6.4],[-1.2,-8.6], [L.pupu.x,L.pupu.a],[L.machine.x,L.machine.a]].map(([x,a])=>P(x,a));
    const vegetationSafe=(d,r,tall)=>{
      const [x,a]=XA(d);
      if(!free(d,r)||pathDist(d)<r+.65||arc(d,SPAWN)<r+4||arc(d,STAGE.center||P(0,0))<r+4)return false;
      if(arc(d,lakeD)<r+6||lessonClear.some(p=>arc(d,p)<r+2.2))return false;
      return !tall||!(x>-2-r&&x<13+r&&a>-20-r&&a<1+r);
    };
    if(softArt){
      const candidate=(i,n)=>{const y=1-2*(i+.5)/n,rr=Math.sqrt(1-y*y),a=i*2.399963229728653;return new V3(Math.cos(a)*rr,y,Math.sin(a)*rr);};
      // Reserve the largest canopies first so they are spread over both sides
      // of the planet; smaller trees and low decor then fill the gaps.
      const wantGiants=LOW_POWER?12:16,hemispheres=[0,0];
      for(let k=0;k<3600&&giantTreeSpots.length<wantGiants;k++){
        const i=(k*971)%3600,d=candidate(i,3600),side=d.y>=0?0:1,h=7+(i%9)*.16,r=h*.40;
        if(hemispheres[side]>=wantGiants/2||!vegetationSafe(d,r,true)||giantTreeSpots.some(t=>arc(d,t.dir)<8.5))continue;
        const M=frameAt(d,null,.08),right=new V3().setFromMatrixColumn(M,0),front=new V3().setFromMatrixColumn(M,2);let lo=surfaceRadius(d);
        for(let j=0;j<8;j++){const a=j*Math.PI/4,q=d.clone().addScaledVector(right,Math.cos(a)*.7/SURF).addScaledVector(front,Math.sin(a)*.7/SURF).normalize();lo=Math.min(lo,surfaceRadius(q)*q.dot(d));}
        M.setPosition(d.clone().multiplyScalar(lo-.04));M.multiply(new T.Matrix4().makeRotationY(i*.63)).multiply(new T.Matrix4().makeScale(h,h,h));
        taken.push({dir:d,r});obstacles.push({dir:d.clone(),r:.72,kind:'p-giant-tree'});const spot={dir:d,h,r,giant:true,matrix:M,center:new V3(0,.68,0).applyMatrix4(M),fade:1};treeSpots.push(spot);giantTreeSpots.push(spot);hemispheres[side]++;
      }
      const want=LOW_POWER?36:48;
      // Interleaving the latitude samples gives each hemisphere trees before adding density.
      let smallTrees=0;for(let k=0;k<1440&&smallTrees<want;k++){
        const i=(k*377)%1440,d=candidate(i,1440),h=3.05+(i%11)*.085,r=1.42*h/3.5;
        if(!vegetationSafe(d,r,true)||treeSpots.some(t=>arc(d,t.dir)<3.8))continue;
        PB.setBase(frameAt(d,null,.08).multiply(new T.Matrix4().makeRotationY(i*.63)));softArt.tree(PB,h,i);
        taken.push({dir:d,r});obstacles.push({dir:d.clone(),r:.43,kind:'p-tree'});treeSpots.push({dir:d,h,r});smallTrees++;
      }
      const wantShrubs=LOW_POWER?64:84,shrubOctants=Array(8).fill(0);
      for(let k=0;k<2160&&shrubSpots.length<wantShrubs;k++){
        const i=(k*523)%2160,d=candidate(i,2160),s=.8+(i%7)*.09,r=s*.72;
        const region=(d.x>0?4:0)+(d.y>0?2:0)+(d.z>0?1:0),quota=Math.floor(wantShrubs/8)+(region<wantShrubs%8?1:0);
        if(shrubOctants[region]>=quota||!vegetationSafe(d,r,false))continue;
        PB.setBase(frameAt(d,null,.035).multiply(new T.Matrix4().makeRotationY(i*.47)));softArt.shrub(PB,0,0,s,i);claim(d,r,false);shrubSpots.push({dir:d,s});shrubOctants[region]++;
      }
    }
    const vegetationTriangles=(PB.count()-vegetationStart)/3;
    // Instancing keeps the large crowns cheap while allowing an individual tree
    // to fade when it comes between the camera and the explorer.
    let giantTreesMesh=null,treeFade=null;
    if(giantTreeSpots.length){
      const source=softArt.makeBatch(T,box);softArt.giantTree(source,1,0);
      const treeMat=propMat.clone(),priorCompile=propMat.onBeforeCompile;treeMat.transparent=true;treeMat.depthWrite=true;
      treeMat.onBeforeCompile=(sh,r)=>{priorCompile(sh,r);sh.vertexShader='attribute float pTreeFade;varying float vTreeFade;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTreeFade=pTreeFade;');sh.fragmentShader='varying float vTreeFade;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\nif(vTreeFade<.02)discard;gl_FragColor.a*=vTreeFade;');};
      treeMat.customProgramCacheKey=()=> 'p-giant-tree-fade-v1';const geometry=source.mesh(treeMat).geometry;treeFade=new T.InstancedBufferAttribute(new Float32Array(giantTreeSpots.length).fill(1),1);geometry.setAttribute('pTreeFade',treeFade);
      giantTreesMesh=new T.InstancedMesh(geometry,treeMat,giantTreeSpots.length);giantTreesMesh.name='p-giant-trees';giantTreesMesh.frustumCulled=false;giantTreesMesh.castShadow=false;giantTreesMesh.receiveShadow=true;
      giantTreeSpots.forEach((tree,i)=>{giantTreesMesh.setMatrixAt(i,tree.matrix);giantTreesMesh.setColorAt(i,new T.Color(['#ffffff','#ecf7f5','#f0f4e9'][i%3]));});root.add(giantTreesMesh);
    }
    const treeCamSegment=new V3(),treeCamClosest=new V3(),treeCamForward=new V3(),treePlayerPos=new V3();
    function updateTreeOcclusion(dt){const cam=c.camera||window.__yaya?.camera,player=window.__yaya?.player;if(!treeFade||!cam||!player?.obj)return;
      player.obj.getWorldPosition(treePlayerPos);treePlayerPos.addScaledVector(player.dir,.85);treeCamSegment.copy(treePlayerPos).sub(cam.position);treeCamForward.set(0,0,-1).applyQuaternion(cam.quaternion);const len2=treeCamSegment.lengthSq();let changed=false;
      giantTreeSpots.forEach((tree,i)=>{const t=Math.max(0,Math.min(1,treeCamClosest.copy(tree.center).sub(cam.position).dot(treeCamSegment)/Math.max(.001,len2)));treeCamClosest.copy(cam.position).addScaledVector(treeCamSegment,t);
        const nearView=tree.center.distanceTo(cam.position)<tree.h*.43+7.5&&treeCamClosest.copy(tree.center).sub(cam.position).dot(treeCamForward)>0;
        treeCamClosest.copy(cam.position).addScaledVector(treeCamSegment,t);const obscures=nearView||(t<.995&&treeCamClosest.distanceTo(tree.center)<tree.h*.43+.35),target=obscures?.015:1,next=T.MathUtils.lerp(tree.fade,target,Math.min(1,dt*6));if(Math.abs(next-tree.fade)>.001){tree.fade=next;treeFade.setX(i,next);changed=true;}});
      if(changed)treeFade.needsUpdate=true;
    }
    // A few small fireflies near the great trees: one shared, camera-facing draw.
    const forestLights=[];
    giantTreeSpots.forEach((tree,i)=>{const axis=proj(new V3(.38,.13,1),tree.dir),cross=new V3().crossVectors(tree.dir,axis);
      for(let j=0;j<(LOW_POWER?5:6);j++){const a=i*1.7+j*2.4,r=j===0?1:tree.r*(.8+(j%2)*.24),up=tree.dir;
        forestLights.push({pos:up.clone().multiplyScalar(surfaceRadius(up)+1.4+j*.78).addScaledVector(axis,Math.cos(a)*r).addScaledVector(cross,Math.sin(a)*r),up,phase:i*1.9+j*2.1});}});
    let forestGlow=null;
    if(forestLights.length){const cv=document.createElement('canvas');cv.width=cv.height=64;const g=cv.getContext('2d'),gradient=g.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(255,255,245,.95)');gradient.addColorStop(.18,'rgba(255,255,240,.8)');gradient.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gradient;g.fillRect(0,0,64,64);
      forestGlow=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,opacity:.8}),forestLights.length);forestGlow.name='p-forest-fireflies';forestGlow.frustumCulled=false;forestLights.forEach((v,i)=>forestGlow.setColorAt(i,new T.Color(i%3?'#c9ffdd':'#ffe4a7')));root.add(forestGlow);}
    const forestGlowMatrix=new T.Matrix4(),forestGlowScale=new V3(),forestGlowPos=new V3(),forestGlowQ=new T.Quaternion();
    const groundSpots = [];
    // ---- light scatter: small mushrooms, grass tufts, flowers (T-style random, away from paths / lake / features) -------------
    {
      // flat = small decor laid on the voxel face; tall things keep the sphere-normal frame
      const scatter = (n, r, fn, cond, sc = 1, flat = false) => { let k = 0, tries = 0; while (k < n && tries++ < n * 80) { const d = new V3(prng() * 2 - 1, prng() * 2 - 1, prng() * 2 - 1).normalize(); if (d.y < -.1 && prng() < .6) continue; if ((cond && !cond(d)) || !free(d, r) || pathDist(d) < .6 || arc(d, START_DIR) < 1.7) continue; PB.setBase((flat ? flatAt(d, null, -.01, prng() * 6.28) : frameAt(d, null, .04).multiply(new T.Matrix4().makeRotationY(prng() * 6.28))).multiply(new T.Matrix4().makeScale(sc, sc, sc))); fn(k); claim(d, r, false); k++; } };
      // clusters: a few pieces gathered round a centre, clean ground between clusters (the centre claims the whole patch)
      const cluster = (nc, per, spread, r, fn, cond, sc = 1) => { let made = 0, tries = 0, k = 0;
        while (made < nc && tries++ < nc * 80) { const c0 = new V3(prng() * 2 - 1, prng() * 2 - 1, prng() * 2 - 1).normalize(); if (c0.y < -.1 && prng() < .6) continue;
          if ((cond && !cond(c0)) || !free(c0, spread + .3) || pathDist(c0) < spread + .5 || arc(c0, START_DIR) < 1.7 + spread) continue;
          const e1 = proj(new V3(1, .3, .2), c0), e2 = new V3().crossVectors(c0, e1);
          for (let j = 0; j < per; j++) { const a = j / per * 6.28 + prng() * 1.2, rr = (j ? .35 + prng() * .65 : prng() * .2) * spread;
            const d = c0.clone().addScaledVector(e1, Math.cos(a) * rr / SURF).addScaledVector(e2, Math.sin(a) * rr / SURF).normalize();
            const s2 = sc * (j ? .75 + prng() * .3 : 1.05);
            PB.setBase(flatAt(d, null, -.01, prng() * 6.28).multiply(new T.Matrix4().makeScale(s2, s2, s2))); fn(k++); }
          claim(c0, spread + .2, false); made++; } };
      const LP = LOW_POWER ? .8 : 1, N = n => Math.round(n * LP);
      const PBc = { block: (x, y, z, sx, sy, sz, t, o = {}) => PB.block(x, y, z, sx, sy, sz, t, { ...o, plain: true }) };   // cheap 12-tri blocks for small decor
      // (the stepped rounded-block 'hills' were removed: they read as unexplained blobs)
      // candy mushroom clusters (one big + two small)
      scatter(N(12), .9, k => { const h = .8 + prng() * .5; A.mushroom(PB, 0, 0, h, k, k); A.mushroom(PB, .5, .25, h * .55, k + 1, k + 2, true); A.mushroom(PB, -.35, .4, h * .42, k + 2, k + 4, true); });
      scatter(N(10), .4, k => A.mushroom(PB, 0, 0, .4 + prng() * .4, k + 1, k, true));
      const grass = ['#8fcf98', '#9fd8a2', '#a8d98c', '#b2dfa4'];
      cluster(N(16), 4, .7, .3, k => { if(softArt){softArt.tuft(PB);return;}const g = grass[k % 4]; PB.block(0, .14, 0, .09, .28, .09, g, { plain: true, rz: .12 }); PB.block(.09, .1, .03, .08, .2, .08, g, { plain: true, rz: -.35 }); PB.block(-.08, .11, -.02, .08, .22, .08, g, { plain: true, rz: .4 }); PB.block(.02, .08, .09, .07, .16, .07, g, { plain: true, rx: .4 }); }, null, 1.6);
      const petals = ['#fff3a8', '#f7b6cc', '#d2c2f3', '#ffffff', '#ffc9a8', '#bfe3ff'];
      cluster(N(12), 3, .55, .28, k => { const nf = 1 + k % 3; for (let f = 0; f < nf; f++) { const ox = (f - 1) * .14, oz = (f % 2) * .1, hh = .2 + f * .05; PB.block(ox, hh / 2, oz, .04, hh, .04, '#7fbf86', { plain: true }); const p = petals[(k + f) % 6]; PB.block(ox, hh, oz, .15, .05, .15, p, { plain: true }); PB.block(ox, hh + .01, oz, .06, .05, .06, '#f2c14a', { plain: true }); } }, null, 1.5);
      const stones = ['#e6dcd2', '#d9cfd9', '#efe6dc', '#dcd3c6'];
      scatter(N(10), .35, k => { const w = .3 + prng() * .25, yaw=prng()*3;
        if(softArt){softArt.stone(PB,0,0,w*.52,w*.43,w*.45,k,stones[k%4]);if(k%2)softArt.stone(PB,w*.6,.1,w*.30,w*.25,w*.28,k+1,stones[(k+1)%4]);if(k%3===0)softArt.shrub(PB,-w*.22,-w*.25,w*.6,k);}
        else {PBc.block(0, w * .3, 0, w, w * .6, w * .8, stones[k % 4], { top: '#f6efe8', ry: yaw }); if (k % 2) PBc.block(w * .6, w * .18, .1, w * .5, w * .36, w * .45, stones[(k + 1) % 4], { top: '#f6efe8' });} }, null, 1, true);
      // bath toys: rubber ducks, soap bars, little buckets, sponge rocks
      scatter(2, .4, k => { PBc.block(0, .12, 0, .3, .2, .4, '#ffd84a', { top: '#ffe57a' }); PBc.block(0, .3, .1, .2, .2, .2, '#ffd84a', { top: '#ffe57a' }); PBc.block(0, .28, .24, .1, .05, .1, '#ff9a3c'); for (const sx of [-1, 1]) PBc.block(sx * .07, .34, .2, .03, .04, .03, '#2a2030', { plain: true }); });
      scatter(3, .35, k => { const c = ['#f9c4d8', '#c9e8ff', '#e3d6ff', '#fff1b8'][k % 4]; PBc.block(0, .06, 0, .34, .12, .22, c, { top: '#ffffff' }); if (k % 2) PBc.block(.05, .17, .02, .3, .1, .2, ['#c9e8ff', '#f9c4d8'][k % 2], { top: '#ffffff', ry: .4 }); });
      scatter(3, .4, k => { const c = ['#8cc6f2', '#f5a3c0', '#a8e0cb'][k % 3]; for (let q = 0; q < 2; q++) PBc.block(0, .17, 0, .34, .34, .34, c, { ry: q * .785, top: '#d8f1ff' }); PBc.block(0, .35, 0, .3, .02, .3, '#a6dcf2', { plain: true }); PBc.block(0, .48, 0, .34, .03, .03, '#9a8f98', { plain: true }); });
      scatter(3, .4, k => { const w = .35 + prng() * .2; PBc.block(0, w * .35, 0, w, w * .7, w * .8, '#f6e08a', { top: '#fbeeb0' }); for (let q = 0; q < 4; q++) PBc.block((q - 1.5) * w * .22, w * .7, (q % 2 - .5) * w * .3, .05, .02, .05, '#e2c35e', { plain: true }); });
      // towels on short lines between two posts
      scatter(2, 1.1, k => { for (const x of [-.8, .8]) PBc.block(x, .45, 0, .08, .9, .08, A.C.wood, { top: A.C.woodTop }); PBc.block(0, .86, 0, 1.6, .03, .03, '#e9e3da', { plain: true });
        ['#f6b0c8', '#bfe3ff', '#fff1b8', '#c5b3ee'].forEach((c, q) => { if ((q + k) % 4 === 3) return; PBc.block(-.5 + q * .34, .68, 0, .26, .34, .04, c, { top: '#ffffff', low: .92 }); }); });
      // the ground in front of the spawn: dense grass / flowers / little mushrooms (T-like density right where the camera looks)
      const nearSpawn = d => { const a = arc(d, START_DIR); return a > 1.6 && a < 8.5 && lakeMask(d) < -.25; };
      cluster(N(6), 4, .6, .26, k => { if(softArt){softArt.tuft(PB);return;}const g = grass[k % 4]; PBc.block(0, .14, 0, .09, .28, .09, g, { rz: .12 }); PBc.block(.09, .1, .03, .08, .2, .08, g, { rz: -.35 }); PBc.block(-.08, .11, -.02, .08, .22, .08, g, { rz: .4 }); }, nearSpawn, 1.6);
      cluster(N(5), 3, .5, .24, k => { const nf = 1 + k % 3; for (let f = 0; f < nf; f++) { const ox = (f - 1) * .14, oz = (f % 2) * .1, hh = .2 + f * .05; PBc.block(ox, hh / 2, oz, .04, hh, .04, '#7fbf86'); const p = petals[(k + f) % 6]; PBc.block(ox, hh, oz, .14, .05, .14, p); PBc.block(ox, hh + .02, oz, .06, .05, .06, '#f2c14a'); } }, nearSpawn, 1.5);
      scatter(N(4), .35, k => A.mushroom(PB, 0, 0, .35 + prng() * .35, k + 2, k, true), nearSpawn);
      // spots for ground bubble clusters (no geometry; the bubbles live in the shared instanced mesh)
      let tries = 0; while (groundSpots.length < (LOW_POWER ? 12 : 18) && tries++ < 2400) { const d = new V3(prng() * 2 - 1, prng() * 2 - 1, prng() * 2 - 1).normalize(); if (!free(d, .7) || pathDist(d) < .8 || arc(d, START_DIR) < 3 || groundSpots.some(g=>arc(g,d)<5)) continue; claim(d, .7, false); groundSpots.push(d); }
      if(!groundSpots.length)groundSpots.push(duckApproach.clone());
    }

    // ---- the bubble island: a round grass islet with soil and stones underneath, a mushroom, a stool, 糖糖 waving ---------------
    const IS = L.island, islandDir = P(IS.x, IS.a), islandFrame = frameAt(islandDir, SPAWN, 0, 0);
    const island = new T.Group(); island.name = 'p-bubble-island'; root.add(island);
    const islandBaseR = surfaceRadius(lakeD) + IS.h;
    island.matrixAutoUpdate = false;
    const setIslandMatrix = (bob = 0) => { const up = islandDir; const m = islandFrame.clone().setPosition(up.clone().multiplyScalar(islandBaseR + bob)); island.matrix.copy(m); island.matrixWorldNeedsUpdate = true; };
    setIslandMatrix();
    {
      const ib = makeBatch(T, roundedBox(T, .12));
      if(softArt)softArt.islandBase(ib);
      else {for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) { const r = Math.hypot(x, z) * .5; if (r > 1.08) continue;
        ib.block(x * .5, -.1, z * .5, .52, .3, .52, '#a5d9a9', { top: (x + z) % 3 ? '#c3e8c1' : '#cdeaa8', low: .9 });
        if (r < .9) ib.block(x * .48, -.42, z * .48, .5, .36, .5, '#b07b52', { low: .85 });
        if (r < .6) ib.block(x * .45, -.76, z * .45, .46, .34, .46, (x + z) % 2 ? '#bdb3ab' : '#a99f9a', { low: .85 });
        if (r < .3) ib.block(x * .4, -1.05, z * .4, .4, .3, .4, '#9b918d'); }
      for (const a of [0, 2.1, 4.2]) ib.block(Math.sin(a) * 1.1, -.25, Math.cos(a) * 1.1, .5, .2, .5, '#c3e8c1');}
      A.mushroom(ib, -.65, -.6, .95, 0, 3); ib.block(0, 0, 0, 0, 0, 0, '#000');
      const stoolX = .6, stoolZ = -.35; for (const [dx, dz] of [[-.12, -.12], [.12, -.12], [-.12, .12], [.12, .12]]) ib.block(stoolX + dx, .17, stoolZ + dz, .07, .3, .07, A.C.woodDark); ib.block(stoolX, .34, stoolZ, .42, .08, .42, A.C.woodTop, { top: '#d9a46c' });
      for (const [x, z, col] of [[.75, .55, '#fff3a8'], [-.85, .45, '#f7b6cc'], [.1, -.85, '#d2c2f3']]) { ib.block(x, .14, z, .05, .2, .05, '#7fbf86', { plain: true }); ib.block(x, .25, z, .14, .06, .14, col, { plain: true }); }
      const im = ib.mesh(softArt?softArt.islandMaterial(T,propMat):propMat, 'p-island'); im.position.y = .15; im.castShadow = true; island.add(im);
    }
    const tangtang = A.pig(T, { name: 'p-tangtang', bow: true, light: true, scale: .95 * .7 });
    tangtang.root.position.set(0, .15, .35); island.add(tangtang.root);
    const glass = glassMaterial(T);
    const islandBubble = new T.Mesh(new T.SphereGeometry(IS.r, 36, 24), glass); islandBubble.position.y = .55; islandBubble.renderOrder = 3; islandBubble.name = 'p-island-bubble'; island.add(islandBubble);

    // ---- bubblePath (phase-2 data): 5 rows x left / middle / right from the lake shore up to the island ----------------------------
    const GIRL_H = 1.5, STEP_D = GIRL_H * 1.5;
    const bubblePath = { rows: [], positions: [], bubbleDiameter: STEP_D, island: { dir: islandDir.clone() } };
    {
      const lakeSurf = R - .2;
      for (let k = 0; k < 5; k++) {
        const cx = LK.x + 1.5 * Math.sin(k * 1.25 + .4), ca = LK.a - LK.rz + .6 + k * 1.45, h = 1.5 + k * 1.75;
        const nx = LK.x + 1.5 * Math.sin((k + 1) * 1.25 + .4), na = ca + 1.45;
        const fwd = new V3(nx - cx, 0, na - ca).normalize(), side = new V3(fwd.z, 0, -fwd.x);   // (x, -, a) plane
        const row = [-1, 0, 1].map(s => { const x = cx + side.x * s * 2.55, a = ca + side.z * s * 2.55, dir = P(x, a); const pos = dir.clone().multiplyScalar(lakeSurf + h + STEP_D / 2);
          return { row: k, col: s + 1, dir, height: h, radius: STEP_D / 2, pos }; });
        bubblePath.rows.push(row); bubblePath.positions.push(...row);
      }
      const dots = new T.InstancedMesh(new T.SphereGeometry(.36, 12, 8), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .85, depthWrite: false, toneMapped: false }), 15);
      const cols = ['#ff4f98', '#ffb300', '#2e9bff'], m4 = new T.Matrix4();
      bubblePath.positions.forEach((p, i) => { dots.setMatrixAt(i, m4.makeTranslation(p.pos.x, p.pos.y, p.pos.z)); dots.setColorAt(i, new T.Color(cols[p.col])); });
      dots.name = 'p-bubble-path-dots'; dots.renderOrder = 2; root.add(dots); bubblePath.markers = dots;
      bubblePath.showDots = (scale = 1, visible = true) => { dots.material.opacity = scale > 1 ? .85 : .45; return showDots0(scale, visible); }; const showDots0 = (scale, visible) => { dots.visible = visible; bubblePath.positions.forEach((p, i) => dots.setMatrixAt(i, m4.compose(p.pos, new T.Quaternion(), new V3(scale, scale, scale)))); dots.instanceMatrix.needsUpdate = true; };
      bubblePath.showDots(.7, false);   // v3: the 15 steps are real bubbles now
    }

    // ---- puffs: machine smoke (grey) + lake / pool steam (white), one instanced draw -------------------------------------------
    const mac = c.orchard?.granny?.machine;
    // ---- contact shadows: one instanced soft disc under each big standing thing (machine, 噗噗, giant tub, snail, big mushrooms) -------
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = softArt?128:64; const mid=cv.width/2,g2 = cv.getContext('2d'), gr = g2.createRadialGradient(mid,mid,0,mid,mid,mid);
      gr.addColorStop(0, softArt?'rgba(44,49,38,.48)':'rgba(58,46,92,.5)');gr.addColorStop(.18,softArt?'rgba(44,49,38,.38)':'rgba(58,46,92,.43)'); gr.addColorStop(.55, softArt?'rgba(44,49,38,.18)':'rgba(58,46,92,.28)'); gr.addColorStop(1, 'rgba(44,49,38,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, cv.width,cv.height);
      const spots = [], addAt = (o, sx, sz) => { if (o) spots.push([o, sx, sz]); };
      addAt(mac?.root, 5.2, 5.2); addAt(c.orchard?.granny?.root, 1.5, 1.5);
      creatures.forEach(cr => { if (cr.root.name === 'p-giant-tub') addAt(cr.root, 9.6, 4.6); else if (cr.root.name === 'p-swirl-snail') addAt(cr.root, 1.3, 2.6); });
      midgroundShadows.forEach(([anchor,sx,sz])=>addAt(anchor,sx,sz));
      const dm = new T.InstancedMesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }), spots.length + mushrooms.length + treeSpots.length);
      const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new V3(), pz = new V3(); let n = 0;
      for (const [o, sx, sz] of spots) { o.updateMatrixWorld(true); o.matrixWorld.decompose(pz, q, sc); const up = pz.clone().normalize(); pz.copy(up).multiplyScalar(surfaceRadius(up) + .03); dm.setMatrixAt(n++, m4.compose(pz, q, sc.set(sx, 1, sz))); }
      for (const m of mushrooms) dm.setMatrixAt(n++, frameAt(m.dir, null, -.03).multiply(new T.Matrix4().makeScale(m.h * .95, 1, m.h * .95)));
      for (const m of treeSpots) dm.setMatrixAt(n++, frameAt(m.dir,null,-.025).multiply(new T.Matrix4().makeScale(m.r*2.5,1,m.r*2.5)));
      dm.count = n; dm.name = 'p-contact-shadows'; dm.renderOrder = 1; dm.frustumCulled = false; root.add(dm);
    }
    const puffs = [];
    if (mac) { mac.root.updateMatrixWorld(true); const src = mac.hornMouth.clone().applyMatrix4(mac.root.matrixWorld); for (let i = 0; i < (LOW_POWER ? 5 : 7); i++) puffs.push({ kind: 'smoke', src, up: src.clone().normalize(), ph: i / (LOW_POWER ? 5 : 7), H: 2.6 * (L.machine.scale || 1), s: .55 * (L.machine.scale || 1), col: new T.Color('#9a98a6') }); }
    for (let i = 0; i < (LOW_POWER ? 7 : 11); i++) { const ang = prng() * 6.28, k = .15 + prng() * .65, d = P(LK.x + Math.cos(ang) * LK.rx * k, LK.a + Math.sin(ang) * LK.rz * k); puffs.push({ kind: 'steam', src: d.clone().multiplyScalar(R - .2), up: d, ph: prng(), H: 2.6, s: .62, col: new T.Color('#fffaf6') }); }
    pools.forEach(p => puffs.push({ kind: 'steam', src: p.dir.clone().multiplyScalar(p.base + .3), up: p.dir, ph: prng(), H: 1.4, s: .45, col: new T.Color('#fffaf7') }));
    const puffMesh = new T.InstancedMesh(roundedBox(T, .3), new T.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: .55, depthWrite: false }), puffs.length);
    puffMesh.name = 'p-puffs'; puffMesh.frustumCulled = false; puffs.forEach((p, i) => puffMesh.setColorAt(i, p.col)); root.add(puffMesh);
    let broken = true, fixed = false, fixedProgress = 0, fixedAge = 0, tangtangHome = false, tapFlowTime = 0, flowTick = 0;
    const machineScale = mac?.root.scale.clone(), reservations = new Map(), externalPools = new Map(), bubbleLimit = LOW_POWER ? 42 : 72;
    const reserveBubbles = (key, count = 1) => {
      key = String(key); count = Math.max(0, Math.floor(count));
      const others = Array.from(reservations.entries()).reduce((n, entry) => n + (entry[0] === key ? 0 : entry[1]), 0);
      if (!Number.isFinite(count) || count + others + (islandBubble.visible ? 1 : 0) > bubbleLimit) throw new RangeError('P bubble reservation exceeds budget');
      reservations.set(key, count); syncBubblePool(); return () => releaseBubbles(key);
    };
    const releaseBubbles = key => { key = String(key); const had = reservations.delete(key); externalPools.delete(key); syncBubblePool(); return had; };
    const externalCount = () => Array.from(reservations.values()).reduce((n, count) => n + count, 0);
    const pooledCount = () => Array.from(externalPools.values()).reduce((n, matrices) => n + matrices.length, 0);
    const instanceBudget = () => Math.max(0, bubbleLimit - (islandBubble.visible ? 1 : 0) - externalCount());
    // The approved props remain merged; a single instanced veil lights their caps in sequence.
    const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 64;
    const glowCtx = glowCanvas.getContext('2d'), glowGradient = glowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    glowGradient.addColorStop(0, 'rgba(255,255,235,.95)'); glowGradient.addColorStop(.25, 'rgba(255,248,210,.55)'); glowGradient.addColorStop(1, 'rgba(255,255,255,0)');
    glowCtx.fillStyle = glowGradient; glowCtx.fillRect(0, 0, 64, 64);
    const mushroomGlow = new T.InstancedMesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(glowCanvas), transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, opacity: .68 }), mushrooms.length);
    mushroomGlow.name = 'p-mushroom-lights'; mushroomGlow.frustumCulled = false; mushroomGlow.visible = false; root.add(mushroomGlow);
    const glowMatrix = new T.Matrix4(), glowScale = new V3(), glowQuaternion = new T.Quaternion();
    mushrooms.forEach((m, i) => { m.lightPos = m.dir.clone().multiplyScalar(surfaceRadius(m.dir) + m.h * .88); mushroomGlow.setColorAt(i, new T.Color(['#ffe59b', '#ffb6d8', '#b9f8dc', '#cfbaff'][i % 4])); });
    let mushroomLights = 0;

    // ---- bubbles: ONE InstancedMesh, one shared glass material; tap to pop, splash, respawn elsewhere -----------------------------
    const zoneCount = LOW_POWER ? { step:15,sky:14,stage:2,fountain:6,lake:4,ground:12,ambient:36 } : { step:15,sky:24,stage:2,fountain:8,lake:6,ground:18,ambient:54 };
    const MAXB = Object.values(zoneCount).reduce((a, b) => a + b, 0);
    const bubbleGeo = LOW_POWER ? new T.SphereGeometry(1, 28, 18) : new T.SphereGeometry(1, 32, 20);   // 12x8 showed a polygon outline on the big step / ride bubbles
    const bubbleMesh = new T.InstancedMesh(bubbleGeo, glass, MAXB); bubbleMesh.name = 'p-bubbles'; bubbleMesh.count = 0; bubbleMesh.frustumCulled = false; bubbleMesh.renderOrder = 2; root.add(bubbleMesh);
    for (let i = 0; i < MAXB; i++) bubbleMesh.setColorAt(i, new T.Color(0, 0, 0));
    let backgroundCount = 0;
    const stageUp = (STAGE.center || P(0, 0)).clone();
    const bubbleRegions=[duckApproach,octopusApproach,FOREST,...treeSpots.filter((_,i)=>i%3===0).map(t=>t.dir)];
    const bubbleRegion=(i)=>{const d=bubbleRegions[i%bubbleRegions.length],v=proj(new V3(Math.sin(i*2.4),.3,Math.cos(i*2.4)),d);return d.clone().addScaledVector(v,(1.5+(i%3)*1.4)/SURF).normalize();};
    const spawnIn = (b, first) => {
      if (b.zone !== 'step' && b.zone !== 'ground') b.r0 = b.zone === 'sky' ? .35 + prng() * .75 : b.zone === 'stage' ? .16 + prng() * .14 : b.zone === 'fountain' ? .12 + prng() * .16 : .12 + prng() * .2;
      if (b.zone === 'machine') { b.r0 = .24 + prng() * .35; b.base = mac.hornMouth.clone().applyMatrix4(mac.root.matrixWorld); }
      else if (b.zone === 'sky') { const d=bubbleRegion(b.uid+4); b.base=d.multiplyScalar(SURF+3.3+prng()*4.5); }
      else if (b.zone === 'stage') { const a = prng() * 6.28, rr = 2.4 + prng() * .9; b.base = STAGE.group.localToWorld(new V3(Math.cos(a) * rr * 1.2, 1.2 + prng() * 1.4, Math.sin(a) * rr * .7)); }
      else if (b.zone === 'lake') { const ang = prng() * 6.28, k = prng() * .75; b.base = P(LK.x + Math.cos(ang) * LK.rx * k, LK.a + Math.sin(ang) * LK.rz * k).multiplyScalar(R - .2); }
      else if (b.zone === 'step') { const p = bubblePath.positions[b.idx]; b.base = p.pos.clone(); b.r0 = p.radius; }
      else if (b.zone === 'ground') { const g = groundSpots[b.idx % groundSpots.length]; b.r0 = .2 + ((b.idx * 7) % 5) * .07; b.base = g.clone().multiplyScalar(surfaceRadius(g) + b.r0 * .9).add(proj(new V3(Math.sin(b.idx * 2.1), .3, Math.cos(b.idx * 1.7)), g).multiplyScalar(.35 * (b.idx % 3))); }
      else if (b.zone === 'ambient') { const d=bubbleRegion(b.uid); b.r0=.18+prng()*.32; b.base=d.multiplyScalar(surfaceRadius(d)+1+prng()*2.6); }
      else b.base = fountainD.clone().multiplyScalar(fBase + 1.2);
      b.up = b.base.clone().normalize(); b.ph = prng() * 10; b.age = first ? prng() * 3 : 0; b.dead = 0; b.grow = first ? 1 : 0;
      b.drift = proj(new V3(prng() - .5, prng() - .5, prng() - .5), b.up);
    };
    const bubbles = [];
    for (const [zone, n] of Object.entries(zoneCount)) for (let i = 0; i < n && bubbles.length < MAXB; i++) { const b = { zone, idx: i, uid:bubbles.length }; spawnIn(b, true); bubbles.push(b); }
    // the small bubbles on the stage pillar tops replace the old gold stars
    const bm4 = new T.Matrix4(), bq = new T.Quaternion(), bs = new V3(), bp = new V3(), bubbleGlow = new T.Color();
    // Tasks submit world-space matrices to this same draw call. root remains at the scene origin.
    function syncBubblePool() {
      backgroundCount = Math.min(backgroundCount, instanceBudget());
      let n = backgroundCount; bubbleGlow.setRGB(0, 0, 0);
      for (const matrices of externalPools.values()) for (const matrix of matrices) {
        bubbleMesh.setMatrixAt(n, matrix); bubbleMesh.setColorAt(n++, bubbleGlow);
      }
      bubbleMesh.count = n; bubbleMesh.instanceMatrix.needsUpdate = true; bubbleMesh.instanceColor.needsUpdate = true;
    }
    function setExternal(key, matrices) {
      key = String(key); const copy = matrices.map(matrix => matrix.clone()), previous = externalPools.get(key);
      externalPools.set(key, copy);
      try { reserveBubbles(key, copy.length); }
      catch (error) { if (previous) externalPools.set(key, previous); else externalPools.delete(key); throw error; }
      return copy.length;
    }
    const clearExternal = key => releaseBubbles(key);
    const bubblePos = (b, time, out) => {
      if (b.zone === 'machine') { const t = (b.age * .22 + b.ph * .1) % 1; mac.root.updateMatrixWorld(true); return out.copy(mac.hornMouth).applyMatrix4(mac.root.matrixWorld).addScaledVector(b.up, t * 7.5).addScaledVector(b.drift, t * 3.6); }
      if (b.zone === 'fountain') { const t = (b.age * .45 + b.ph * .1) % 1; return out.copy(b.base).addScaledVector(b.up, t * 3.2).addScaledVector(b.drift, t * .9); }
      if (b.zone === 'lake') { const t = (b.age * (fixed ? .65 : .25) + b.ph * .1) % 1; return out.copy(b.base).addScaledVector(b.up, t * 1.8); }
      if (b.zone === 'step') return out.copy(b.base).addScaledVector(b.up, Math.sin(time * .9 + b.idx) * .12 - (b.compression || 0) * .32).add(b.offset || zeroOffset);
      if (b.zone === 'ground') return out.copy(b.base).addScaledVector(b.up, Math.sin(time * 1.3 + b.idx) * .03);
      return out.copy(b.base).addScaledVector(b.up, Math.sin(time * .7 + b.ph) * .3).addScaledVector(b.drift, Math.sin(time * .4 + b.ph * 2) * .25);
    };
    const zeroOffset = new V3();
    const bubbleScale = b => {
      if (b.hidden) return 0;
      let s = b.r0 * Math.min(1, b.grow) * (b.scale ?? 1) * (1 + (b.highlight || 0) * .06);
      if (b.zone === 'machine') { const t = (b.age * .22 + b.ph * .1) % 1; s *= smooth(0, .08, t) * (1 - smooth(.82, 1, t)); }
      if (b.zone === 'fountain') { const t = (b.age * .45 + b.ph * .1) % 1; s *= smooth(0, .1, t) * (1 - smooth(.85, 1, t)); }
      if (b.zone === 'lake') { const t = (b.age * (fixed ? .65 : .25) + b.ph * .1) % 1; s *= smooth(0, .15, t) * (1 - smooth(.8, 1, t)); }
      return s;
    };
    const stepBubbles = bubbles.filter(b => b.zone === 'step');
    bubblePath.setStep = (row, col, options = {}) => {
      const b = stepBubbles[row * 3 + col]; if (!b || fixed) return;
      if (options.visible !== undefined) b.hidden = !options.visible;
      if (options.scale !== undefined) b.scale = Math.max(0, options.scale);
      if (options.compression !== undefined) b.compression = Math.max(0, Math.min(1, options.compression));
      if (options.highlight !== undefined) b.highlight = options.highlight ? 1 : 0;
      if (options.offset !== undefined) b.offset = options.offset?.clone ? options.offset.clone() : new V3();
    };
    bubblePath.resetSteps = () => stepBubbles.forEach(b => { if (fixed) return; b.hidden = false; b.scale = 1; b.offset = new V3(); b.compression = b.highlight = 0; });
    bubblePath.allSteps = visible => stepBubbles.forEach(b => { if (!fixed) b.hidden = !visible; });
    bubblePath.position = (row, col, out = new V3()) => { const b = stepBubbles[row * 3 + col]; return b ? bubblePos(b, lastTime, out) : out; };
    // splash drops
    const drops = [], DMAX = 48;
    const dropMesh = new T.InstancedMesh(new T.BoxGeometry(.11, .11, .11), new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), DMAX); dropMesh.name = 'p-splash'; dropMesh.count = 0; dropMesh.frustumCulled = false; root.add(dropMesh);
    const dropCols = ['#ffffff', '#cdeefe', '#ffd3e6', '#e7dcff'].map(h => new T.Color(h));
    function splash(pos, size = .6, count = 14) { const up = pos.clone().normalize(); for (let i = 0; i < count; i++) { if (drops.length >= DMAX) drops.shift(); const v = new V3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize().multiplyScalar(2 + size * 2.5).addScaledVector(up, 1.2); drops.push({ p: pos.clone().addScaledVector(v, size * .25), v, life: .7, c: dropCols[i % 4] }); } }
    let popCount = 0, onBubblePop = null;
    function pop(b, time) { const p = bubblePos(b, time || 0, new V3()); splash(p, b.r0); b.dead = 2.2 + Math.random() * 2.5; b.grow = 0; popCount++; try { window.__yaya?.sfx?.pop?.(); onBubblePop?.(popCount); } catch (e) {} }
    // tapping: pointerdown in the capture phase so a popped bubble never also becomes a walk target
    const ray = new T.Raycaster(), ndc = new T.Vector2(); let swallowUntil = 0, lastTime = 0, tapsBlocked = () => false;
    function tryPop(clientX, clientY) {
      const cam = c.camera || window.__yaya?.camera, cv = document.querySelector('canvas'); if (!cam || !cv) return false;
      const r = cv.getBoundingClientRect(); ndc.set((clientX - r.left) / r.width * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
      let best = null, bd = 1e9; const tp = new V3(), sph = new T.Sphere();
      for (const b of bubbles) { if (b.zone === 'step' || !b.visibleFrame || b.dead > 0 || b.grow < .5) continue; const s = bubbleScale(b); if (s < .05) continue; sph.set(bubblePos(b, lastTime, tp), Math.max(s * 1.25, .45)); const hit = ray.ray.intersectSphere(sph, new V3()); if (hit) { const dd = hit.distanceTo(cam.position); if (dd < bd) { bd = dd; best = b; } } }
      if (!best) return false;
      // a nearer piece of planet in front of the bubble wins
      const planetHit = ray.ray.intersectSphere(new T.Sphere(new V3(), R + .2), new V3()); if (planetHit && planetHit.distanceTo(cam.position) < bd - .5) return false;
      pop(best, lastTime); return true;
    }
    const onDown = e => { if (tapsBlocked() || !e.target || e.target.tagName !== 'CANVAS') return; if (tryPop(e.clientX, e.clientY)) { swallowUntil = performance.now() + 700; e.stopImmediatePropagation(); e.preventDefault(); } };
    const onAfter = e => { if (performance.now() < swallowUntil && e.target && e.target.tagName === 'CANVAS') { e.stopImmediatePropagation(); e.preventDefault(); if (e.type !== 'pointermove') swallowUntil = e.type === 'click' ? 0 : swallowUntil; } };
    window.addEventListener('pointerdown', onDown, true); ['pointerup', 'click', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(t => window.addEventListener(t, onAfter, true));

    // ---- static props: one draw -------------------------------------------------------------------------------------------
    const propsMesh = PB.mesh(propMat, 'p-props'); propsMesh.castShadow = !LOW_POWER; propsMesh.receiveShadow = true; root.add(propsMesh);
    const water = new T.BufferGeometry(); water.setAttribute('position', new T.Float32BufferAttribute(WB.P, 3)); water.setAttribute('color', new T.Float32BufferAttribute(WB.C, 3)); water.setIndex(WB.I); water.computeVertexNormals();
    const waterMat = new T.MeshLambertMaterial({ vertexColors: true, emissive: '#ffd0e0', emissiveIntensity: .08, side: T.DoubleSide });
    const waterMesh = new T.Mesh(water, waterMat); waterMesh.name = 'p-water'; waterMesh.receiveShadow = true; root.add(waterMesh);

    // ---- landmarks / routes / api ----------------------------------------------------------------------------------------------
    const landmarks = { spawn: { dir: SPAWN }, stage: { dir: STAGE.center || P(0, 0) }, machine: { dir: P(L.machine.x, L.machine.a) }, pupu: { dir: P(L.pupu.x, L.pupu.a) }, bath: { dir: P(L.bath.rack.x, L.bath.rack.a) },
      lake: { dir: lakeD }, island: { dir: islandDir, object: island }, fountain: { dir: fountainD }, pools: pools.map(p => ({ dir: p.dir })), forest: { dir: FOREST }, duckGarden:{dir:duckDir,approach:duckApproach,object:giantTub.root},octopusGarden:{dir:octopusDir,approach:octopusApproach,object:creatures.find(cr=>cr.root.name==='p-giant-octopus')?.root} };
    const answerDirs = [P(-3.4, -6.4), P(3.4, -6.4), P(-1.2, -8.6)];
    const routePoints = [P(0, -4.6), P(-2.0, -1.0), P(3.4, -1.6), P(6.8, -5.8), P(12.8, 2.4), FOREST.clone(), P(-10.8, 7.0)]; const trailPts = routePoints.slice();
    const overview = (aspect = 1) => { const k = aspect < .8 ? 1.5 : 1; const isl = islandDir.clone().multiplyScalar(islandBaseR); const macP = P(L.machine.x, L.machine.a).multiplyScalar(R + 3); const focus = isl.clone().lerp(macP, .45); const position = focus.clone().add(new V3(-3 * k, 9 + 5 * k, 20 * k)); return { focus, position, up: new V3(0, 1, 0), lift: 1, zoom: 1, ahead: 0 }; };
    function sparkleBurst(worldPos) { splash(worldPos.clone(), .8, 16); }
    function wrongFeedback(worldPos) { }
    const pupu = c.orchard?.granny; let expDone = false;
    const blobTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(70,60,110,.55)'); gr.addColorStop(.6, 'rgba(70,60,110,.32)'); gr.addColorStop(1, 'rgba(70,60,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(cv); })();
    const blob = new T.Mesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    blob.name = 'p-unicorn-shade'; blob.renderOrder = 1; root.add(blob); const bwp = new V3();
    function updateBlob() { const u = window.__yaya?.unicorn?.root; if (!u) { blob.visible = false; return; } u.getWorldPosition(bwp); const up = bwp.clone().normalize(); blob.position.copy(up).multiplyScalar(surfaceRadius(up) + .04); blob.quaternion.setFromUnitVectors(new V3(0, 1, 0), up); blob.scale.setScalar(2.1); blob.visible = true; }
    function familyPose(time) {
      if (!fixed) return;
      if (pupu?.body) { pupu.body.position.y = Math.abs(Math.sin(time * 4.6)) * .22; pupu.body.rotation.z = Math.sin(time * 4.6) * .08; pupu.head.rotation.z = Math.sin(time * 4.6 + .4) * .06; }
      if (tangtangHome) { tangtang.body.position.y = Math.abs(Math.sin(time * 4.6 + .6)) * .26; tangtang.body.rotation.z = Math.sin(time * 4.6 + .6) * .12; }
    }
    function updateFixed(dt, time) {
      if (!fixed) return;
      fixedAge += dt; fixedProgress = Math.min(1, fixedAge / 4); uFixed.value = fixedProgress;
      if (mac && machineScale) mac.root.scale.copy(machineScale).multiplyScalar(1 + Math.sin(time * 13) * .015 * (1 - Math.min(1, fixedAge / 4)));
      mushroomGlow.visible = true; const camera = c.camera || window.__yaya?.camera; if (camera) glowQuaternion.copy(camera.quaternion);
      mushroomLights = 0;
      mushrooms.forEach((m, i) => { const t = Math.max(0, Math.min(1, (fixedAge - i * .10) * 2)); if (t > 0) mushroomLights++;
        glowScale.setScalar(m.h * 1.5 * t * (.96 + .04 * Math.sin(time * 2 + i))); glowMatrix.compose(m.lightPos, glowQuaternion, glowScale); mushroomGlow.setMatrixAt(i, glowMatrix); });
      mushroomGlow.instanceMatrix.needsUpdate = true;
      if (fixedAge < 3.2 && Math.floor((fixedAge - dt) * 5) !== Math.floor(fixedAge * 5) && mac) splash(mac.hornMouth.clone().applyMatrix4(mac.root.matrixWorld), .9, 8);
      familyPose(time);
    }
    // ---- soft bloom (high-power devices only): the frame goes to an MSAA half-float target, the brightest parts (bubble highlights,
    // crystals, glowing caps, foam) are blurred at quarter resolution and added back, with a faint vignette; low-power phones skip it
    let bloom = null;
    function installBloom(r) {
      if (bloom || !r.capabilities.isWebGL2) return;
      const vs = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
      const mk = (uniforms, fs) => new T.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: fs, depthTest: false, depthWrite: false, toneMapped: false });
      const rtScene = new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType, samples: 4 }), rtA = new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType }), rtB = rtA.clone();
      const bright = mk({ tDiffuse: { value: null }, uTh: { value: .86 } }, 'uniform sampler2D tDiffuse;uniform float uTh;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=min(c.r,min(c.g,c.b));gl_FragColor=vec4(c*smoothstep(uTh,uTh+.07,l),1.);}');
      const blur = mk({ tDiffuse: { value: null }, uDir: { value: new T.Vector2() } }, 'uniform sampler2D tDiffuse;uniform vec2 uDir;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb*.227;c+=(texture2D(tDiffuse,vUv+uDir*1.385).rgb+texture2D(tDiffuse,vUv-uDir*1.385).rgb)*.316;c+=(texture2D(tDiffuse,vUv+uDir*3.231).rgb+texture2D(tDiffuse,vUv-uDir*3.231).rgb)*.07;gl_FragColor=vec4(c,1.);}');
      const comp = mk({ tScene: { value: rtScene.texture }, tBloom: { value: rtA.texture }, uStrength: { value: .42 } }, 'uniform sampler2D tScene;uniform sampler2D tBloom;uniform float uStrength;varying vec2 vUv;void main(){vec3 c=texture2D(tScene,vUv).rgb+texture2D(tBloom,vUv).rgb*uStrength;vec2 d=vUv-.5;c*=1.-.16*smoothstep(.25,.75,dot(d,d)*2.);gl_FragColor=vec4(c,1.);\n#include <encodings_fragment>\n}');
      const quad = new T.Mesh(new T.PlaneGeometry(2, 2), comp), qs = new T.Scene(), qc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1); quad.frustumCulled = false; qs.add(quad);
      // custom ShaderMaterials (sky, bubble glass, halos) write display colours straight out; routed through an off-screen target they
      // would be encoded twice. Convert them once: sRGB -> linear, then the standard output encoding (identical on screen either way).
      const fixed = new WeakSet(); let sweep = 0;
      const fixShaders = () => scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        for (const m of ms) { if (!m || !m.isShaderMaterial || m.isRawShaderMaterial || fixed.has(m)) continue; fixed.add(m);
          const f = m.fragmentShader; if (f.includes('encodings_fragment') || f.includes('linearToOutputTexel')) continue; const at = f.lastIndexOf('}');
          m.fragmentShader = f.slice(0, at) + 'gl_FragColor.rgb=mix(pow(max(gl_FragColor.rgb,0.)*.9478672986+vec3(.0521327014),vec3(2.4)),gl_FragColor.rgb*.0773993808,vec3(lessThanEqual(gl_FragColor.rgb,vec3(.04045))));\n#include <encodings_fragment>\n' + f.slice(at); m.needsUpdate = true; } });
      fixShaders();
      const orig = r.render.bind(r), size = new T.Vector2(); let busy = false;
      const pass = (mat, target) => { quad.material = mat; r.setRenderTarget(target); orig(qs, qc); };
      r.render = (sc, cam) => {
        if (busy || sc !== scene || r.getRenderTarget() !== null || !bloom.on) return orig(sc, cam);
        if (++sweep % 90 === 0) fixShaders();
        busy = true; const auto = r.info.autoReset;   // the scene pass resets the stats as usual (shadow-map draws excluded, as in the project's budget); the 6 bloom passes then add on
        try {
          r.getDrawingBufferSize(size); if (rtScene.width !== size.x || rtScene.height !== size.y) { rtScene.setSize(size.x, size.y); rtA.setSize(Math.max(1, size.x >> 2), Math.max(1, size.y >> 2)); rtB.setSize(Math.max(1, size.x >> 2), Math.max(1, size.y >> 2)); }
          r.setRenderTarget(rtScene); orig(sc, cam); r.info.autoReset = false;
          bright.uniforms.tDiffuse.value = rtScene.texture; pass(bright, rtA);
          for (let k = 0; k < 2; k++) { blur.uniforms.tDiffuse.value = rtA.texture; blur.uniforms.uDir.value.set(1 / rtA.width * (k + 1), 0); pass(blur, rtB);
            blur.uniforms.tDiffuse.value = rtB.texture; blur.uniforms.uDir.value.set(0, 1 / rtA.height * (k + 1)); pass(blur, rtA); }
          pass(comp, null);
        } finally { r.setRenderTarget(null); r.info.autoReset = auto; busy = false; }
      };
      bloom = { on: true, comp, bright };
    }
    const bubbleFrustum=new T.Frustum(),bubbleView=new T.Matrix4(),bubbleSphere=new T.Sphere(),bubbleSegment=new V3(),bubbleClosest=new V3(),bubbleCandidates=[];
    function update(dt, time, state) {
      updateBlob(); updateFixed(dt, time); updateTreeOcclusion(dt); creatures.forEach(cr => cr.anim(time));
      if(forestGlow){const cam=c.camera||window.__yaya?.camera;if(cam)forestGlowQ.copy(cam.quaternion);forestLights.forEach((v,i)=>{forestGlowPos.copy(v.pos).addScaledVector(v.up,Math.sin(time*1.1+v.phase)*.16);forestGlowScale.setScalar(.36+.1*(.5+.5*Math.sin(time*2+v.phase)));forestGlowMatrix.compose(forestGlowPos,forestGlowQ,forestGlowScale);forestGlow.setMatrixAt(i,forestGlowMatrix);});forestGlow.instanceMatrix.needsUpdate=true;}
      if (tapFlowTime > 0 && mac) { tapFlowTime = Math.max(0, tapFlowTime - dt); flowTick += dt;
        if (flowTick > .07) { flowTick = 0; const mouth = mac.tap.userData.inner || mac.tap; const pos = mouth.localToWorld(new V3(0, -.25, .12)), up = pos.clone().normalize();
          for (let j = 0; j < 2; j++) { if (drops.length >= DMAX) drops.shift(); drops.push({ p: pos.clone(), v: up.clone().multiplyScalar(-1.7).addScaledVector(proj(new V3(1, 0, 0), up), (j - .5) * .15), life: .45, c: dropCols[1] }); } }
      }
      lastTime = time; dt = Math.min(dt, .1); glass.uniforms.uTime.value = time; if (sky?.material.uniforms.uTime) sky.material.uniforms.uTime.value = time;
      if (!expDone && window.__yaya?.renderer) { window.__yaya.renderer.toneMappingExposure = .82; expDone = true; if (!LOW_POWER) installBloom(window.__yaya.renderer); }
      // bubbles
      let n = 0; const budget = instanceBudget(),camera=c.camera||window.__yaya?.camera;
      if(camera){camera.updateMatrixWorld();bubbleView.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);bubbleFrustum.setFromProjectionMatrix(bubbleView);}
      bubbleCandidates.length=0;
      for (const b of bubbles) {
        b.visibleFrame = false; b.age += dt;
        if (b.dead > 0) { b.dead -= dt; if (b.dead <= 0) { spawnIn(b, false); } else continue; }
        b.grow = Math.min(1, b.grow + dt * 1.6);
        const s = bubbleScale(b); if (s < .01) continue;
        if(!b.framePosition)b.framePosition=new V3();bubblePos(b,time,b.framePosition);b.frameScale=s;
        if(camera){
          bubbleSphere.set(b.framePosition,s*1.08);if(!bubbleFrustum.intersectsSphere(bubbleSphere))continue;
          bubbleSegment.copy(b.framePosition).sub(camera.position);const length2=bubbleSegment.lengthSq(),t=Math.max(0,Math.min(1,-camera.position.dot(bubbleSegment)/Math.max(.0001,length2)));
          bubbleClosest.copy(camera.position).addScaledVector(bubbleSegment,t);if(t>0&&t<1&&bubbleClosest.length()<R-1.5)continue;
          b.framePriority=(b.zone==='step'?-10000:0)+camera.position.distanceToSquared(b.framePosition);
        }else b.framePriority=b.zone==='step'?-10000:0;
        bubbleCandidates.push(b);
      }
      bubbleCandidates.sort((a,b)=>a.framePriority-b.framePriority);
      for(const b of bubbleCandidates){
        if(n>=budget)break;b.visibleFrame=true;const s=b.frameScale;bp.copy(b.framePosition);bs.setScalar(s);bq.identity();
        if (b.zone === 'step') { const squash = b.compression || 0; bs.set(s * (1 + squash * .18), s * (1 - squash * .28), s * (1 + squash * .18)); bq.setFromUnitVectors(new V3(0, 1, 0), b.up); }
        bm4.compose(bp, bq, bs); bubbleMesh.setColorAt(n, bubbleGlow.setRGB(b.highlight || 0, 0, 0)); bubbleMesh.setMatrixAt(n++, bm4);
      }
      backgroundCount = n; syncBubblePool();
      // splash
      for (let i = drops.length - 1; i >= 0; i--) { const p = drops[i]; p.life -= dt; if (p.life <= 0) { drops.splice(i, 1); continue; } p.v.addScaledVector(p.p.clone().normalize(), -dt * 7); p.p.addScaledVector(p.v, dt); }
      drops.forEach((p, i) => { bs.setScalar(Math.max(.05, p.life * 1.4)); bm4.compose(p.p, bq, bs); dropMesh.setMatrixAt(i, bm4); dropMesh.setColorAt(i, p.c); });
      dropMesh.count = drops.length; dropMesh.visible = drops.length > 0; dropMesh.instanceMatrix.needsUpdate = true; if (dropMesh.instanceColor) dropMesh.instanceColor.needsUpdate = true;
      // puffs (smoke can be switched off)
      puffs.forEach((p, i) => { const t = (time * (p.kind === 'smoke' ? .32 : fixed ? .34 : .18) + p.ph) % 1; let s = p.s * (.35 + t * 1.1) * smooth(0, .12, t) * (1 - smooth(.7, 1, t)); if (p.kind === 'smoke' && !broken) s = 0;
        bp.copy(p.src).addScaledVector(p.up, t * p.H).addScaledVector(proj(new V3(1, .2, .3), p.up), Math.sin(t * 3 + p.ph * 6) * .25 + (p.kind === 'smoke' ? t * .6 : 0));
        bs.setScalar(s); bq.identity(); bm4.compose(bp, bq, bs); puffMesh.setMatrixAt(i, bm4); });
      puffMesh.instanceMatrix.needsUpdate = true;
      // island bob, 糖糖 waves, 噗噗 breathes
      setIslandMatrix(Math.sin(time * .6) * .25);
      tangtang.body.rotation.z = Math.sin(time * 3.2) * .16; tangtang.head.rotation.z = Math.sin(time * 3.2 + .6) * .08; tangtang.body.position.y = Math.abs(Math.sin(time * 3.2)) * .06;
      if (pupu && pupu.body) { pupu.body.scale.y = 1 + .015 * Math.sin(time * 1.4); pupu.head.rotation.z = .05 * Math.sin(time * .8); if (pupu.wand) pupu.wand.rotation.z = -.25 + .12 * Math.sin(time * 1.7); }
      familyPose(time);
      if (mac) { const tu = mac.tap.userData; tapSpin = Math.max(0, tapSpin - (time - (tapLast || time))); tapLast = time;
        if (tu.wheel) tu.wheel.rotation.z += tapSpin * .25; if (tu.glow) tu.glow.emissiveIntensity = .3 + .35 * (.5 + .5 * Math.sin(time * 3.2)) + tapSpin * .6;
        mac.tap.scale.setScalar(1 + .06 * Math.max(0, Math.sin(time * 3.2)) + tapSpin * .15); }
      oldBirds.forEach(g => g.visible = false);
    }
    // tap picking: a generous invisible proxy around the valve; tapping spins the wheel, coughs bubbles from spout + horn
    let tapCount = 0;
    const tapProxy = mac ? new T.Mesh(new T.SphereGeometry(.42, 8, 6), new T.MeshBasicMaterial({ visible: false })) : null;
    if (tapProxy) { mac.tap.userData.kind = 'p-tap'; tapProxy.userData.kind = 'p-tap'; tapProxy.name = 'p-tap-pick'; mac.tap.add(tapProxy); }
    function tapMachine() { tapCount++; tapSpin = 2.2; const w = new V3(); mac.tap.getWorldPosition(w); splash(w.clone(), .5, 14);
      const hm = mac.hornMouth.clone().applyMatrix4(mac.root.matrixWorld); splash(hm, .9, 18); window.__pTap = { count: tapCount, at: Date.now(), broken };
      return tapCount; }
    let tapSpin = 0, tapLast = 0;
    const machineApi = mac ? { root: mac.root, tap: mac.tap, hornMouth: mac.hornMouth, tapFlow(seconds = 2.4) { tapFlowTime = Math.max(tapFlowTime, seconds); tapSpin = 2.2; }, targets: () => [tapProxy], tapTap: tapMachine, get tapCount() { return tapCount; }, setBroken(v) { broken = !!v; }, get broken() { return broken; } } : { root: null, tap: null, setBroken() {} };
    function rescue() { if (islandBubble.visible) { splash(islandBubble.getWorldPosition(new V3()), 2.2, 24); islandBubble.visible = false; } }
    function returnHome() {
      const home = P(L.pupu.x + 1.25, L.pupu.a - .2), matrix = frameAt(home, SPAWN, 0);
      root.add(tangtang.root); matrix.decompose(tangtang.root.position, tangtang.root.quaternion, new V3());
      tangtangHome = true; islandBubble.visible = false; return tangtang.root;
    }
    function setFixed(options = {}) {
      const immediate = options === true || options.immediate === true;
      if (!fixed) {
        fixed = true; broken = false; returnHome();
        // Reuse the existing glass pool: machine emission and celebratory sky replace the completed steps/ground bubbles.
        let emitted = 0;
        bubbles.forEach(b => { if (b.zone !== 'lake') b.zone = mac && ['stage', 'fountain'].includes(b.zone) && emitted++ < (LOW_POWER ? 4 : 7) ? 'machine' : 'sky';
          b.hidden = false; b.scale = 1; b.compression = b.highlight = 0; b.offset = new V3(); spawnIn(b, true); });
      }
      if (immediate) { fixedAge = 8; fixedProgress = 1; uFixed.value = 1; if (mac && machineScale) mac.root.scale.copy(machineScale); updateFixed(0, lastTime); }
      return { fixed, immediate, duration: immediate ? 0 : 4 };
    }
    const bubbleBudget = () => ({ limit: bubbleLimit, instanced: bubbleMesh.count, background: backgroundCount, pooled: pooledCount(), island: islandBubble.visible ? 1 : 0, reserved: externalCount(), standalone: externalCount() - pooledCount(), total: bubbleMesh.count + (islandBubble.visible ? 1 : 0) + externalCount() - pooledCount(), reservations: Object.fromEntries(reservations) });
    const api = { onBoat: () => false, root, routePoints, trailPts, answerDirs, sparkleBurst, wrongFeedback, propMap: new Map(), fauna: [], landmarks, update,
      turtle: { overview }, overview, bubblePath, machine: machineApi, island: { group: island, bubble: islandBubble, tangtang }, bubbles: { mesh: bubbleMesh, material: glass, list: bubbles, reserve: reserveBubbles, release: releaseBubbles, setExternal, clearExternal, budget: bubbleBudget, pop: b => pop(b, lastTime), tryPop, get pops() { return popCount; }, onPop(fn) { onBubblePop = typeof fn === 'function' ? fn : null; }, block(fn) { tapsBlocked = fn; } },
      setFixed, rescue, returnHome, familyPose, reserveBubbles, releaseBubbles, burst: (pos, color, count = 14) => splash(pos.clone(), .6, Math.min(count, 24)),
      midground: { snapshot: () => ({groups:midgroundGroups,parts:midgroundParts.map(({dir,start,count,...p})=>p),staticVertexStart:midgroundStart,staticVertexCount:midgroundStaticTriangles*3,staticTriangles:midgroundStaticTriangles,lampTriangles:lampBatch.count()/3,contactShadows:midgroundShadows.length}), pathDistance: d => pathDist(d), lakeMask: d => lakeMask(d) },
      exploration:{snapshot:()=>({trees:treeSpots.map(t=>({dir:t.dir.toArray(),height:t.h,radius:t.r,giant:!!t.giant,fade:t.giant?t.fade:1})),giantTrees:giantTreeSpots.length,fireflies:forestLights.length,shrubs:shrubSpots.map(t=>({dir:t.dir.toArray(),scale:t.s})),vegetationVertexStart:vegetationStart,vegetationVertexCount:vegetationTriangles*3,vegetationTriangles,groundBubbleSpots:groundSpots.map(d=>d.toArray()),paths:pathLines.map(line=>line.map(d=>d.toArray())),duckDistance:arc(SPAWN,duckDir),octopusDistance:arc(SPAWN,octopusDir),landmarkSeparation:arc(duckDir,octopusDir)})},
      bloom: () => bloom, trees: treeSpots, snapshot: () => ({ version: 'p-world-exploration-1', radius: R, mushrooms: mushrooms.length, trees:treeSpots.length,shrubs:shrubSpots.length,mushroomLights, fixed, fixedProgress, tangtangHome, tapFlow: tapFlowTime, bubbles: bubbles.length, budget: bubbleBudget(), puffs: puffs.length, props: PB.count() / 3 }), complete() { habitat?.complete(); },
      visualStyle: softArt?{version:2,name:'pastel-soapstone',ground:'individual-stone-blocks',organicMushrooms:true,facetedStones:true,softPigSilhouettes:true}:null,
      createCrystal: (label, col) => window.YayaRound3.createCrystal(T, label, col), setDry() { } };
    return api;
  }
  window.YayaPlanetPWorld = { create };
})();
