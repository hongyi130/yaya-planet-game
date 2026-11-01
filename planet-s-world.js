/* S · 沙蛇星球 (large world) — rounded-block art + scene.
   NEW FILE for the S planet. Loaded after round3-world.js / round3-crystals.js and before app.js.
   Mirrors the interface of YayaRound3.create(...) (routePoints, trailPts, answerDirs, sparkleBurst, wrongFeedback,
   update, snapshot, ...) so app.js can use it as the "round3" world of planet s01.
   All geometry is procedural; blocks are merged into a few vertex-coloured meshes (spatially chunked). */
(() => {
  'use strict';
  const roundedBox = (T, b) => window.YayaRound3.roundedBox(T, b);
  function create(c) {
    const { THREE: T, scene, skyGroup, clouds, planet, cells, STAGE, obstacles, props, registerProp, place,
      tangent, arc, surfaceRadius, rng, LOW_POWER, habitat, START_DIR, orient } = c;
    const R = c.R || 16, SURF = R + .7, root = new T.Group(); root.name = 's-large-world'; scene.add(root);
    const box = roundedBox(T), cube = new T.BoxGeometry(1, 1, 1);
    const color = new T.Color(), normalMatrix = new T.Matrix3(), v = new T.Vector3(), norm = new T.Vector3();
    const material = new T.MeshStandardMaterial({ vertexColors: true, roughness: .88, metalness: 0 });
    const matrix = new T.Matrix4(), quaternion = new T.Quaternion(), pos = new T.Vector3(), scale = new T.Vector3();
    function batch() {
      const positions = [], normals = [], colors = [];
      return {
        add(geo, transform, tint) {
          const g = geo.index ? geo.toNonIndexed() : geo, pp = g.attributes.position, nn = g.attributes.normal, cc = g.attributes.color;
          color.set(tint); normalMatrix.getNormalMatrix(transform);
          for (let i = 0; i < pp.count; i++) {
            v.fromBufferAttribute(pp, i).applyMatrix4(transform); norm.fromBufferAttribute(nn, i).applyMatrix3(normalMatrix).normalize();
            positions.push(v.x, v.y, v.z); normals.push(norm.x, norm.y, norm.z); colors.push(color.r * (cc ? cc.getX(i) : 1), color.g * (cc ? cc.getY(i) : 1), color.b * (cc ? cc.getZ(i) : 1));
          }
          if (g !== geo) g.dispose();
        },
        block(x, y, z, sx, sy, sz, tint, rot = 0, geo = box) {
          quaternion.setFromAxisAngle(new T.Vector3(0, 1, 0), rot);
          matrix.compose(pos.set(x, y, z), quaternion, scale.set(sx, sy, sz)); this.add(geo, matrix, tint);
        },
        mesh(mat = material) {
          const g = new T.BufferGeometry();
          g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
          g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
          g.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); g.computeBoundingSphere();
          const m = new T.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
        },
        count: () => positions.length / 3,
      };
    }
    const scenery = [], landmarks = {}, treeInfo = [];
    // surface coordinates: x = metres to the right of the stage, a = metres "forward" (away from the spawn camera)
    const P = (x, a) => { const l = x / SURF, f = a / SURF; return new T.Vector3(Math.sin(l), Math.cos(l) * Math.cos(f), -Math.cos(l) * Math.sin(f)).normalize(); };
    const XA = d => [SURF * Math.asin(Math.max(-1, Math.min(1, d.x))), SURF * Math.atan2(-d.z, d.y)];
    const local = (x, z) => P(x, -z);   // same meaning as round3: z>0 is towards the spawn camera
    const lessonClear = (c.PLANET.clearSpots || []).map(([polar,azim]) => {const p=polar*Math.PI/180,a=azim*Math.PI/180;return new T.Vector3(Math.sin(p)*Math.sin(a),Math.cos(p),-Math.sin(p)*Math.cos(a));});
    Object.values(c.crystals||{}).forEach(cr=>lessonClear.push(cr.dir));
    const clearsLesson = (d,r=.7) => lessonClear.every(q=>arc(d,q)>r+2.1);
    // Remove superseded small scenery (cactus/rocks of the old small world) and their collision disks.
    for (const p of props) {
      p.obj.visible = false;
      for (let i = obstacles.length - 1; i >= 0; i--) if (!obstacles[i].crystal && arc(obstacles[i].dir, p.dir) < .001) obstacles.splice(i, 1);
    }
    props.splice(0, props.length);
    if (habitat?.pond) habitat.pond.visible = false;
    for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].kind === 'pond') obstacles.splice(i, 1);
    // the old desert habitat's wire tumbleweeds and heat-haze planes are replaced by the new scene
    habitat?.root.traverse(o => { if (o.isMesh && (o.material.wireframe || o.material.isShaderMaterial)) o.visible = false; });
    const oldMeadow = scene.getObjectByName('art-meadow-details'); if (oldMeadow) oldMeadow.visible = false;
    // ---------------------------------------------------------------------------------------------
    // Layout of the giant sleeping sand snake. The visible "S" is behind the stone stage as seen from the spawn camera;
    // after the S the body continues round the planet's left flank to the sleeping head near a big dune.
    // control points: [x, a, tubeRadius]
    // The S stands on a big stepped sand ramp ("bed") that leans back behind the stage, so from the spawn camera the whole
    // letter faces the player (the camera looks down only ~30 degrees, so a flat S on the ground would be foreshortened and hidden by the horizon).
    const RAMP = { a0: 7.0, len: 7.2, H: 12.6 };
    const rampH = (x, a) => {
      const k = Math.max(0, Math.min(1, (a - RAMP.a0) / RAMP.len)), top = a - (RAMP.a0 + RAMP.len);
      let h = RAMP.H * k; if (top > 0) h = RAMP.H * (1 - Math.max(0, Math.min(1, (top - 1.2) / 3.4)));
      const lat = Math.abs(x) - 5.6, side = 1 - Math.max(0, Math.min(1, lat / 3.2));
      return Math.max(0, h * side);
    };
    const uToA = u => RAMP.a0 + u * RAMP.len;
    // control points: [x, a, baseHeight, tubeRadius]; the S is given as (x,u) on the ramp, the left-flank run on the ground
    const S_ON_RAMP = [[5.2,.88,.5],[3.8,.96,1.0],[1.3,.99,1.5],[-1.5,.95,1.65],[-3.9,.83,1.7],[-4.6,.66,1.7],[-3.2,.52,1.7],[-.6,.44,1.7],[2.4,.36,1.7],[4.3,.25,1.7],[4.4,.11,1.7],[2.6,.0,1.7],[-.3,-.02,1.7],[-3.4,-.01,1.7]];
    const SPINE_CTL = S_ON_RAMP.map(([x, u, r]) => [x, uToA(u), rampH(x, uToA(u)), r]).concat([[-6.4,8.2,0,1.8],[-10.0,11.0,0,1.8],[-14.4,12.4,0,1.8],[-17.2,17.0,0,1.8],[-16.6,23.0,0,1.85],[-13.4,28.4,0,1.9],[-9.2,31.8,0,1.95],[-5.2,33.2,0,1.95]]);
    const BLOCK = LOW_POWER ? .45 : .32;   // Round 5: fine blocks like the concept (was .9 / .6)
    const spineCurve = new T.CatmullRomCurve3(SPINE_CTL.map(([x, a, h]) => new T.Vector3(x, a, h)), false, 'centripetal');
    const spine = [];
    {
      const NS = 1800, ctlN = SPINE_CTL.length;
      const toWorld = (p, r) => P(p.x, p.y).multiplyScalar(R + .5 + p.z + (.66 + (p.z > .5 ? .12 : 0)) * r);
      let prev = null, carry = 0;
      for (let i = 0; i <= NS; i++) {
        const t = i / NS, p = spineCurve.getPoint(t), f = t * (ctlN - 1), i0 = Math.min(ctlN - 2, Math.floor(f)), r = SPINE_CTL[i0][3] + (SPINE_CTL[i0 + 1][3] - SPINE_CTL[i0][3]) * (f - i0);
        const cur = toWorld(p, r);
        if (!prev) { spine.push({ p: cur.clone(), r, ground: p.z < .4, xa: [p.x, p.y, p.z] }); prev = cur; continue; }
        let seg = cur.distanceTo(prev), t0 = 0;
        while (carry + seg - t0 >= BLOCK) { const k = (BLOCK - carry + t0) / seg; spine.push({ p: prev.clone().lerp(cur, k), r, ground: p.z < .4, xa: [p.x, p.y, p.z] }); t0 += BLOCK - carry; carry = 0; }
        carry += seg - t0; prev = cur;
      }
    }
    const spineLen = spine.length * BLOCK;
    // ---- winding sand path + the three answer-crystal places (route used for tests / crystals / the drawn path)
    const PATH_CTL = [[1.2,-13],[.2,-9.2],[-2.2,-6.6],[-4.8,-4.4],[-6.4,-1.6],[-6.8,1.2],[-7.0,3.6]];
    const pathCurve = new T.CatmullRomCurve3(PATH_CTL.map(([x, a]) => new T.Vector3(x, a, 0)), false, 'centripetal');
    const routePoints = pathCurve.getPoints(72).map(p => P(p.x, p.y));
    const trailPts = [routePoints[0].clone()];
    for (let i = 1; i < routePoints.length; i++) { const a = routePoints[i - 1], b = routePoints[i], n = Math.max(1, Math.ceil(arc(a, b) / .5)); for (let k = 1; k <= n; k++) trailPts.push(a.clone().lerp(b, k / n).normalize()); }
    const answerDirs = [P(-6.8, 1.2), P(6.6, 1.6), P(6.4, -4.6)];
    const inStageZone = d => { if (d.y < .15) return false; const [x, a] = XA(d); return Math.abs(x) < 3.05 && a > -2.7 && a < 5.1; };
    // ---------------------------------------------------------------------------------------------
    // Ground colour: no checkerboard. Smooth dune bands (pale pink-peach, soft lavender troughs, warm gold near the snake),
    // an orange brick-sand path. Colours come from large-scale fields; the per-block term is only a faint tint.
    const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    const groundColor = new T.Color(), cGold = new T.Color('#eccbbb'), cPeach = new T.Color('#e8c3d2'), cPale = new T.Color('#eed3e0'),
      cLav = new T.Color('#c9a7d0'), cBrick = new T.Color('#f3d394'), cBrick2 = new T.Color('#eac582');
    const spineDirs = spine.filter((s, i) => i % 3 === 0).map(s => s.p.clone().normalize());
    const cosPath = Math.cos(1.0 / SURF);
    const pathIdx = new Map();   // cell index -> 1 for road cells (kept for the placement code)
    cells.forEach(([x, y, z], i) => {
      v.set(x, y, z).normalize();
      let dmin = 1e9; for (const s of spineDirs) { const d = Math.acos(Math.min(1, s.dot(v))) * SURF; if (d < dmin) dmin = d; }
      const n = .5 + .5 * Math.sin(x * 11.7 + y * 5.9 + z * 21.8);
      const ridge = Math.sin(x * .29 + y * .18 + z * .08) * Math.sin(z * .26 - y * .33 + x * .11 + 1.3);
      const wide = Math.sin(x * .13 - y * .17 + z * .15);
      const near = smooth(10, 3.6, dmin);
      groundColor.copy(cPale).lerp(cPeach, .45 + .35 * wide).lerp(cGold, near * .45);
      if (ridge < 0) groundColor.lerp(cLav, Math.min(1, -ridge) * (.34 - near * .16)); else groundColor.lerp(cPale, ridge * .22);
      groundColor.multiplyScalar(.84 + (n - .5) * .03);
      let onPath = false; for (let k = 0; k < trailPts.length; k += 2) if (trailPts[k].dot(v) > cosPath && !inStageZone(v)) { onPath = true; break; }
      if (onPath) { const h = Math.abs(Math.sin(x * 12.99 + y * 78.23 + z * 37.72) * 43758.5) % 1; groundColor.copy(cBrick).lerp(cBrick2, h * .6); pathIdx.set(i, 1); }
      groundColor.convertSRGBToLinear();
      planet.setColorAt(i, groundColor);
    }); planet.instanceColor.needsUpdate = true;
    {
      // soil on the cliff faces of the stepped sand: dusty pink-lavender instead of the brown forest soil; softer block edges
      const mat = planet.material, prevCompile = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
      mat.onBeforeCompile = shader => {
        prevCompile(shader);
        shader.fragmentShader = shader.fragmentShader.replace('vec3(0.64,0.265,0.092),vec3(0.88,0.43,0.17)', 'vec3(0.56,0.42,0.62),vec3(0.64,0.50,0.70)')
          .replace('(1.0 - 0.055 * edge)', '(1.0 - 0.02 * edge)')
          .replace('diffuseColor.rgb *= (0.96 + grain * 0.07)', `float roadish = step(diffuseColor.b / (diffuseColor.g + 0.001), 0.5);
          vec3 ac = abs(vCell); vec2 buv = ac.x > ac.y && ac.x > ac.z ? vLocal.yz : (ac.y > ac.z ? vLocal.xz : vLocal.xy);
          float brow = floor((buv.y + 0.5) * 3.0), bx = fract((buv.x + 0.5) * 2.0 + brow * 0.5), by = fract((buv.y + 0.5) * 3.0);
          float mortar = 1.0 - step(0.05, bx) * step(bx, 0.95) * step(0.08, by) * step(by, 0.92);
          float btone = fract(sin(dot(vec3(floor((buv.x + 0.5) * 2.0 + brow * 0.5), brow, 0.0) + vCell, vec3(12.99, 78.23, 37.72))) * 43758.5);
          diffuseColor.rgb *= mix(1.0, mix(0.92 + btone * 0.14, 0.76, mortar), roadish * grass);
          diffuseColor.rgb *= (0.96 + grain * 0.07)`);
      };
      mat.customProgramCacheKey = () => prevKey() + '-s-sand-r5'; mat.needsUpdate = true;
    }
    scene.fog = new T.Fog('#f6bfb2', 62, 215);
    // the sand is brighter than A's lawn: pull the sun and sky light down a little so tops do not burn out to white
    scene.traverse(o => { if (o.isDirectionalLight) o.intensity *= .82; else if (o.isHemisphereLight) o.intensity *= .88; });
    const sky = skyGroup.children.find(o => o.isMesh && o.material.isShaderMaterial);
    if (sky) {
      // same magical-hour dome as planet A; the old desert "sunset" uniform still drives the finale (dusk deepens, stars brighten)
      sky.material.fragmentShader = `uniform float sunset; varying vec3 vDir;
        void main(){vec3 d=normalize(vDir);float h=d.y;
        vec3 horizon=vec3(1.,.76,.55),mid=vec3(.97,.58,.66),zenith=vec3(.52,.34,.70),low=vec3(.90,.56,.64);
        vec3 c=mix(horizon,mid,smoothstep(-.02,.07,h));c=mix(c,zenith,smoothstep(.06,.30,h));
        c=mix(c,low,smoothstep(.0,-.55,h));
        vec3 sd=normalize(vec3(.20,.06,-1.));float s=max(0.,dot(d,sd));
        c+=vec3(1.,.62,.30)*pow(s,4.)*.22+vec3(1.,.85,.55)*pow(s,40.)*.22+vec3(1.,.96,.80)*pow(s,500.)*.3;
        float band=sin(d.x*9.+h*13.)*sin(h*21.-d.x*5.);c+=band*.012;
        float k=clamp(sunset,0.,1.);vec3 dz=mix(vec3(1.,.56,.40),vec3(.60,.36,.66),smoothstep(-.02,.13,h));dz=mix(dz,vec3(.16,.13,.36),smoothstep(.10,.55,h));dz=mix(dz,vec3(.42,.28,.50),smoothstep(.0,-.5,h));
        dz+=vec3(1.,.50,.26)*pow(s,3.)*.35;c=mix(c,dz,k*.9);
        gl_FragColor=vec4(c,1.);}`;
      sky.material.needsUpdate = true;
    }
    skyGroup.children.filter(o => o.isPoints).forEach(o => { o.material.fog=false; o.material.opacity = .85; o.material.size = 2.2; });
    // Extra twinkling stars in the upper sky (small, fog-free points; stars sit high so they read against the purple).
    const nightStars = [], bigStars = [];
    // finale: bigger square "pixel" stars that only come out at dusk, two groups twinkling out of phase
    for (let gI = 0; gI < 2; gI++) {
      const n = LOW_POWER ? 22 : 36, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const az = rng() * Math.PI * 2, el = (.12 + rng() * .8) * Math.PI / 2, r = 410; pos[i * 3] = Math.sin(az) * Math.cos(el) * r; pos[i * 3 + 1] = Math.sin(el) * r; pos[i * 3 + 2] = -Math.cos(az) * Math.cos(el) * r; }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
      const st = new T.Points(g, new T.PointsMaterial({ color: gI ? '#fff6c8' : '#ffe08a', size: gI ? 5 : 7, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      st.name = 's-dusk-stars'; st.visible = false; skyGroup.add(st); bigStars.push(st);
    }
    {
      const n=LOW_POWER?160:260,pos=new Float32Array(n*3);
      for(let i=0;i<n;i++){const az=rng()*Math.PI*2,el=(.02+rng()*.9)*Math.PI/2*(rng()<.85?1:.6),r=420;pos[i*3]=Math.sin(az)*Math.cos(el)*r;pos[i*3+1]=Math.sin(el)*r;pos[i*3+2]=-Math.cos(az)*Math.cos(el)*r;}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));
      const st=new T.Points(g,new T.PointsMaterial({color:'#fff3df',size:2.4,sizeAttenuation:false,transparent:true,opacity:.8,depthWrite:false,fog:false}));st.name='round4-stars';skyGroup.add(st);nightStars.push(st);
    }
    // Round 4 clouds: soft clusters of chunky rounded cubes, cream tops fading to pink-lilac undersides.
    clouds.clear(); clouds.rotation.set(0, 0, 0);
    const cloudBox = roundedBox(T, .16);
    const cloudMat = new T.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false });
    // Round 5 clouds: cumulus shapes (flat base + 3-5 round domes) filled with small rounded voxels. The clouds are
    // unlit, so light is baked into the vertex colours per face: sunlit cream tops, peach sides, lilac shaded bellies.
    const cTop = new T.Color('#fffbf4'), cMid = new T.Color('#f9d3d6'), cLow = new T.Color('#c690bd'), cSun = new T.Color('#ffe3b3'), cTmp = new T.Color();
    const cloudSun = new T.Vector3(.2, .35, -1).normalize(), cloudShapes = [];
    function cloudShape(rr) {
      const n = 2 + Math.floor(rr() * 3), w = 5 + n * 1.5, lobes = [[0, .3, 0, w * .5, 1.1, 2.0]];
      for (let j = 0; j < n; j++) {
        const t = n === 1 ? 0 : j / (n - 1) - .5, mid = 1 - Math.abs(t) * 1.3, r = 1.6 + mid * 1.5 + rr() * .5;
        lobes.push([t * w * .72 + (rr() - .5) * .6, .55 + r * .55, (rr() - .5) * .8, r * 1.08, r, r * .95]);
      }
      const step = 1.15, size = 1.32, cells = [], inside = (x, y, z) => y > -.55 && lobes.some(([cx, cy, cz, ax, ay, az]) => ((x - cx) / ax) ** 2 + ((y - cy) / ay) ** 2 + ((z - cz) / az) ** 2 < 1);
      let top = 0;
      for (let x = -w * .62; x <= w * .62; x += step) for (let y = -.55; y <= 6.2; y += step) for (let z = -2.4; z <= 2.4; z += step) {
        if (!inside(x, y, z) || (inside(x + step, y, z) && inside(x - step, y, z) && inside(x, y + step, z) && inside(x, y - step, z) && inside(x, y, z + step) && inside(x, y, z - step))) continue;
        cells.push([x, y, z]); top = Math.max(top, y);
      }
      const sp = cloudBox.attributes.position, sn = cloudBox.attributes.normal, P = [], N = [], C = [];
      for (const [x, y, z] of cells) {
        const h = (y + .55) / (top + .55), base = cTmp.copy(cLow).lerp(cMid, Math.min(1, h * 1.8));
        if (h > .45) base.lerp(cTop, Math.min(1, (h - .45) / .4));
        for (let i = 0; i < sp.count; i++) {
          // big soft blocks like the concept: bright cream tops, warm sides facing the sunset, cool lilac undersides
          const ny = sn.getY(i), sun = Math.max(0, sn.getX(i) * cloudSun.x + sn.getZ(i) * cloudSun.z);
          const col = base.clone().lerp(cSun, sun * .3);
          if (ny > .5) col.lerp(cTop, .75); else if (ny < -.5) col.lerp(cLow, .55).multiplyScalar(.92); else col.multiplyScalar(.95);
          P.push(sp.getX(i) * size + x, sp.getY(i) * size + y, sp.getZ(i) * size + z); N.push(sn.getX(i), ny, sn.getZ(i)); C.push(Math.min(1, col.r), Math.min(1, col.g), Math.min(1, col.b));
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
      g.computeBoundingSphere(); g.scale(.62, .62, .62); g.computeBoundingSphere(); return g;
    }
    function cloudMesh(rr) {
      // a handful of shapes shared by every cloud (cheap), each placed with its own scale / flip
      if (cloudShapes.length < 6) cloudShapes.push(cloudShape(rr));
      const m = new T.Mesh(cloudShapes[Math.floor(rr() * cloudShapes.length)], cloudMat); m.castShadow = false; m.receiveShadow = false;
      if (rr() < .5) m.scale.x = -1;
      return m;
    }
    const cloudRng = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);
    for (let i = 0; i < 13; i++) {
      const cloud = cloudMesh(cloudRng), a = i / 13 * Math.PI * 2;
      cloud.position.set(Math.cos(a) * 36, 25 + i % 4 * 2.5, Math.sin(a) * 36);
      cloud.scale.setScalar(1.1 + i % 3 * .25); cloud.rotation.y = -a - Math.PI / 2; clouds.add(cloud);
      if(i<4){cloud.position.set([-26,-13,18,35][i],[18,24,22,12][i],[-48,-65,-59,-42][i]);cloud.rotation.y=0;cloud.scale.setScalar([1.6,1.2,1.4,1.4][i]);}
    }
    // Distant clouds: far, big, low on the horizon so both portrait and landscape get soft shapes.
    for(const [x,y,z,k] of [[-58,-52,-250,5.2],[62,-38,-270,4.8],[-6,-70,-240,6],[140,-30,-200,5],[-150,-34,-190,5]]) {
      const m=cloudMesh(cloudRng);m.name='round3-distant-cloud';m.position.set(x,y,z);m.scale.setScalar(k);skyGroup.add(m);
    }
    // Round 4: the ring of tiny floating islands from round 2 was grey rock; re-tint it to warm earth, bright grass and green trees (same meshes, cloned materials).
    (habitat?.root.children||[]).filter(g=>g.isGroup&&Math.abs(g.position.length()-31)<1.6).forEach(g=>g.traverse(o=>{
      if(!o.isMesh)return;const hex=o.material.color.getHexString(),map={bdadad:'#c98a5a',a1bc99:'#78bd4c','84a490':'#4d9b3f'};
      if(map[hex]){o.material=o.material.clone();o.material.color.set(map[hex]);}
    }));
    // S: keep every other floating mini island on touch / low power (triangle budget stays below planet A)
    if (LOW_POWER) (habitat?.root.children||[]).filter(g=>g.isGroup&&Math.abs(g.position.length()-31)<1.6).forEach((g,i)=>{ if (i % 2) g.visible = false; });
    const oldBirds=(habitat?.root.children||[]).filter(g=>g.isGroup&&g.children.length===3&&Math.abs((g.children[0].scale.x||0)-.09)<.001);
    const skyPlanets = [];
    // Small distant planets with banded vertex colours (original geometry). [azimuth°, elevation°, radius, bands, ring]
    function bandedPlanet(r, bands, tilt = .4) {
      const g = new T.SphereGeometry(r, 18, 12), pos = g.attributes.position, col = [], c = new T.Color(), nrm = new T.Vector3();
      for (let i = 0; i < pos.count; i++) {
        nrm.fromBufferAttribute(pos, i).normalize();
        const t = (nrm.y * Math.cos(tilt) + nrm.x * Math.sin(tilt)) * .5 + .5, k = Math.floor(t * bands.length * 1.9) % bands.length;
        c.set(bands[Math.min(bands.length - 1, Math.floor(t * bands.length))] || bands[0]); if (k % 2) c.multiplyScalar(.93);
        const light = .78 + .22 * Math.max(0, nrm.x * -.5 + nrm.y * .55 + nrm.z * .65); c.multiplyScalar(light); col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      return new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false }));
    }
    [[-10,5.5,6.8,['#f0b774','#e2884f','#f2cf96','#d77a48'],1],[5,3.5,5.4,['#f2aa82','#e56c52','#f6c6a0','#d9583f'],0],[13.5,7,6.2,['#8fd3d0','#58aeb8','#a8e0d8','#4b98ae'],0],
     [-2.5,8.5,3,['#f7d8c6','#e9b5a8','#f4cfc0'],0],[24,10,3.4,['#bda0e8','#9a7fd0','#cdb8f0'],0],[-26,8,3.8,['#f5d07a','#e8b04e','#f8e0a0'],1],[38,6,3,['#f0a0b8','#d9789a','#f7bdd0'],0],[-41,5,2.8,['#9fe0b8','#6cc29c','#bdf0d0'],0],
     [75,7,4.5,['#f0b774','#e2884f','#f2cf96'],0],[115,6,5,['#8fd3d0','#58aeb8','#a8e0d8'],1],[160,8,4,['#f2aa82','#e56c52','#f6c6a0'],0],[200,6,5.2,['#bda0e8','#9a7fd0','#cdb8f0'],0],[-80,7,4.2,['#f5d07a','#e8b04e','#f8e0a0'],0],[-120,6,5,['#f0a0b8','#d9789a','#f7bdd0'],1],[-165,8,4,['#9fe0b8','#6cc29c','#bdf0d0'],0]
    ].forEach(([az, el, r, bands, ring], i) => {
      const m = bandedPlanet(r, bands, .3 + i * .17), dist = 240, A = az * Math.PI / 180, E = el * Math.PI / 180;
      m.position.set(Math.sin(A) * Math.cos(E) * dist, Math.sin(E) * dist, -Math.cos(A) * Math.cos(E) * dist);
      m.name = 'round3-sky-planet-' + i; skyGroup.add(m); skyPlanets.push(m);
      if (ring) { const rg = new T.Mesh(new T.TorusGeometry(r * 1.7, r * .1, 4, 36), new T.MeshBasicMaterial({ color: '#f6d9a0', fog: false })); rg.scale.z = .25; rg.rotation.set(1.2, .1, .5); m.add(rg); }
    });
    // Round 4b: small planets over the lower / side parts of the dome as well (the player's "up" turns as they walk round)
    {
      const pal=[['#f6c58a','#e99a62','#f9dcae'],['#a8e0d8','#6cc4c0','#c8f0e8'],['#f0a0b8','#d9789a','#f7bdd0'],['#f5d07a','#e8b04e','#f8e0a0'],['#bda0e8','#9a7fd0','#cdb8f0'],['#9fe0b8','#6cc29c','#bdf0d0'],['#8fd3d0','#58aeb8','#a8e0d8']];
      let k=0;const N=34;
      for(let i=0;i<N&&k<(LOW_POWER?12:18);i++){
        const yy=1-2*(i+.5)/N;if(yy>.45)continue;
        const rad=Math.sqrt(1-yy*yy),az=i*2.399963+2.1,dist=205,m=bandedPlanet(2.4+(i%4)*.7,pal[k%pal.length],.4+k*.3);
        m.position.set(Math.cos(az)*rad*dist,yy*dist,Math.sin(az)*rad*dist);m.name='round4-sky-planet-low-'+k;skyGroup.add(m);skyPlanets.push(m);
        if(k%4===1){const rg=new T.Mesh(new T.TorusGeometry(2.4*1.7,.24,4,36),new T.MeshBasicMaterial({color:'#f6d9a0',fog:false}));rg.scale.z=.25;rg.rotation.set(1.2,.1,.5);m.add(rg);}
        k++;
      }
    }
    // Round 4b: extra small planets spread over every azimuth (higher in the sky than the originals)
    [[32,17,3.0,['#f6c58a','#e99a62','#f9dcae'],0],[58,26,2.4,['#a8e0d8','#6cc4c0','#c8f0e8'],0],[96,19,3.4,['#f0a0b8','#d9789a','#f7bdd0'],1],[135,28,2.6,['#f5d07a','#e8b04e','#f8e0a0'],0],
     [178,18,3.8,['#bda0e8','#9a7fd0','#cdb8f0'],0],[212,30,2.4,['#f2aa82','#e56c52','#f6c6a0'],0],[246,17,3.2,['#9fe0b8','#6cc29c','#bdf0d0'],1],[282,27,2.8,['#f0b774','#e2884f','#f2cf96'],0],
     [318,18,3.4,['#8fd3d0','#58aeb8','#a8e0d8'],0],[-18,29,2.4,['#f7d8c6','#e9b5a8','#f4cfc0'],0],[104,38,2.0,['#fff0c8','#f8d58c','#fff8e0'],0],[262,40,2.2,['#c9b8f0','#a98fe0','#e0d4fa'],0]
    ].forEach(([az, el, r, bands, ring], i) => {
      if (LOW_POWER && i > 9) return;
      const m = bandedPlanet(r, bands, .5 + i * .23), dist = 200, A = az * Math.PI / 180, E = el * Math.PI / 180;
      m.position.set(Math.sin(A) * Math.cos(E) * dist, Math.sin(E) * dist, -Math.cos(A) * Math.cos(E) * dist);
      m.name = 'round4-sky-planet-' + i; skyGroup.add(m); skyPlanets.push(m);
      if (ring) { const rg = new T.Mesh(new T.TorusGeometry(r * 1.7, r * .1, 4, 36), new T.MeshBasicMaterial({ color: '#f6d9a0', fog: false })); rg.scale.z = .25; rg.rotation.set(1.2, .1, .5); m.add(rg); }
    });
    // Round 4b: the sky must not be empty from the sides or behind - more clouds and small planets all around the dome.
    {
      const nCloud=LOW_POWER?14:20;
      for(let i=0;i<nCloud;i++){
        const yy=1-2*(i+.5)/nCloud,rr_=Math.sqrt(1-yy*yy),az=i*2.399963+.9,rad=40+(i%3)*8,cloud=cloudMesh(cloudRng);
        cloud.position.set(Math.cos(az)*rr_*rad,yy*rad,Math.sin(az)*rr_*rad);cloud.scale.setScalar(1.15+(i%4)*.22);cloud.lookAt(0,0,0);clouds.add(cloud);
      }
      // The sky dome is fixed in world space but the player walks all the way round the planet, so "sky" can be any
      // world direction: spread the far clouds over the WHOLE sphere (Fibonacci lattice), not just the upper half.
      const nFar=LOW_POWER?22:30;
      for(let i=0;i<nFar;i++){
        const yy=1-2*(i+.5)/nFar,rad=Math.sqrt(1-yy*yy),az=i*2.399963+.6,dist=190+(i%3)*14,m=cloudMesh(cloudRng);
        m.name='round4-far-cloud';m.position.set(Math.cos(az)*rad*dist,yy*dist,Math.sin(az)*rad*dist);m.scale.setScalar(3.6+(i%3)*.8);m.lookAt(0,0,0);skyGroup.add(m);
      }
    }
    // Round 4c: a ring of clouds and small planets that stays around the player's horizon (it turns with the player's
    // "up" while walking round the planet), so side and back views always have sky decoration, not just gradient.
    const localSky = new T.Group(); localSky.name = 'round4-horizon-ring'; skyGroup.add(localSky);
    {
      const nC = LOW_POWER ? 30 : 40, nP = LOW_POWER ? 12 : 16, pal = [['#f6c58a','#e99a62','#f9dcae'],['#a8e0d8','#6cc4c0','#c8f0e8'],['#f0a0b8','#d9789a','#f7bdd0'],['#f5d07a','#e8b04e','#f8e0a0'],['#bda0e8','#9a7fd0','#cdb8f0'],['#9fe0b8','#6cc29c','#bdf0d0']];
      for (let i = 0; i < nC; i++) {
        const az = i / nC * Math.PI * 2 + (cloudRng() - .5) * .2, el = (-42 + (i % 3) * 14 + cloudRng() * 10) * Math.PI / 180, dist = 150 + cloudRng() * 40, m = cloudMesh(cloudRng);
        m.name = 'round4-ring-cloud'; m.position.set(Math.cos(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist);
        m.scale.setScalar(2.2 + cloudRng() * 1.4); m.lookAt(0, 0, 0); localSky.add(m);
      }
      for (let i = 0; i < nP; i++) {
        const az = (i + .5) / nP * Math.PI * 2 + 1.1, el = (-34 + (i * 37 % 36)) * Math.PI / 180, dist = 175, m = bandedPlanet(2.3 + (i % 4) * .8, pal[i % pal.length], .3 + i * .27);
        m.name = 'round4-ring-planet-' + i; m.position.set(Math.cos(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist); localSky.add(m); skyPlanets.push(m);
        if (i % 4 === 2) { const rg = new T.Mesh(new T.TorusGeometry((2.3 + (i % 4) * .8) * 1.7, .26, 4, 36), new T.MeshBasicMaterial({ color: '#f6d9a0', fog: false })); rg.scale.z = .25; rg.rotation.set(1.2, .1, .5); m.add(rg); }
      }
    }
    const skyUp = new T.Vector3(0, 1, 0), skyQ = new T.Quaternion();
    function register(g, dir, radius, kind) {
      place(g, dir, STAGE.front, -.06); registerProp(g, dir, radius);
      const o = obstacles[obstacles.length - 1]; if (radius > 0) { o.kind = kind; o.obj = g; }
      scenery.push(g); return g;
    }
    // Round 4: chunky rounded-cube geometry (bigger bevel) and a small deterministic RNG for decoration,
    // so the shared game rng is not consumed by purely visual jitter.
    const chunk = roundedBox(T, .2), soft = roundedBox(T, .13);
    const mk = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const decoRng = mk(20261027);
    // Voxel blob made of overlapping super-ellipsoid lobes: only the visible shell is emitted.
    // lobes: [cx,cy,cz,rx,ry,rz]; returns number of blocks.
    function voxelBlob(b, lobes, step, size, palette, rr, shade = 1) {
      const p = 2.7, inside = (x, y, z, k = 0) => lobes.some(([cx, cy, cz, rx, ry, rz]) =>
        Math.pow(Math.abs((x - cx) / rx), p) + Math.pow(Math.abs((y - cy) / ry), p) + Math.pow(Math.abs((z - cz) / rz), p) < 1 - k * .0);
      let minY = 1e9, maxY = -1e9; lobes.forEach(([, cy, , , ry]) => { minY = Math.min(minY, cy - ry); maxY = Math.max(maxY, cy + ry); });
      const xs = lobes.map(l => [l[0] - l[3], l[0] + l[3]]), zs = lobes.map(l => [l[2] - l[5], l[2] + l[5]]);
      const x0 = Math.min(...xs.map(a => a[0])), x1 = Math.max(...xs.map(a => a[1])), z0 = Math.min(...zs.map(a => a[0])), z1 = Math.max(...zs.map(a => a[1]));
      let count = 0;
      for (let y = minY; y <= maxY + 1e-6; y += step) for (let x = x0; x <= x1; x += step) for (let z = z0; z <= z1; z += step) {
        if (!inside(x, y, z)) continue;
        if (inside(x + step, y, z) && inside(x - step, y, z) && inside(x, y + step, z) && inside(x, y - step, z) && inside(x, y, z + step) && inside(x, y, z - step)) continue;
        const t = (y - minY) / Math.max(.01, maxY - minY), s = size * (.9 + rr() * .16);
        color.set(palette[Math.floor(rr() * palette.length)]);
        const k = (.80 + .40 * t) * shade * (.95 + rr() * .1);
        count++;
        b.block(x + (rr() - .5) * .1, y + (rr() - .5) * .1, z + (rr() - .5) * .1, s, s * (.92 + rr() * .1), s, '#' + color.clone().multiplyScalar(k).getHexString(), 0, chunk);
      }
      return count;
    }
    // ---------------------------------------------------------------------------------------------
    // Distant background dunes: stepped, block-built layers in a ring round the horizon (sky-ring style, follows the player's
    // "up" like the horizon cloud ring). Far = pale lavender-pink, near = peach; unlit vertex colours, no fog.
    {
      // Round 5: five layers of soft rolling dunes (not stepped blocks). Each crest is lit on one flank and lilac on the
      // other; far layers are paler and pinker (haze), near layers deeper. Unlit vertex colours, no fog.
      const layers = [   // top / amp are elevations in degrees below the horizon plane
        { dist: 252, top: -5.0, amp: 3.0, lit: '#f6dcea', shade: '#e2c3dd', f: [3, 5, 11], seed: 1.3 },
        { dist: 238, top: -8.2, amp: 3.4, lit: '#f4d2e4', shade: '#d9b5d6', f: [4, 7, 13], seed: 2.1 },
        { dist: 224, top: -11.6, amp: 3.6, lit: '#f3c9dc', shade: '#cfa8cf', f: [5, 9, 15], seed: 3.7 },
        { dist: 210, top: -15.2, amp: 3.6, lit: '#f4c6d3', shade: '#c69dc8', f: [6, 11, 17], seed: 5.2 },
        { dist: 196, top: -18.8, amp: 3.2, lit: '#f6c8cc', shade: '#bf96c2', f: [7, 12, 19], seed: 6.9 },
      ];
      const ringPos = [], ringNor = [], ringCol = [], cL = new T.Color(), cS = new T.Color(), cA = new T.Color(), cB = new T.Color();
      const N = LOW_POWER ? 220 : 320;
      for (const L of layers) {
        cL.set(L.lit); cS.set(L.shade);
        const Y = deg => L.dist * Math.tan(deg * Math.PI / 180), prof = t => .5 + .3 * Math.sin(t * L.f[0] + L.seed) + .15 * Math.sin(t * L.f[1] + L.seed * 2.1) + .08 * Math.sin(t * L.f[2] + L.seed * .7);
        const rows = [], cols = [];
        for (let i = 0; i <= N; i++) {
          const t = i / N * Math.PI * 2, h = prof(t), slope = (prof(t + .01) - prof(t - .01)) / .02;
          const lit = Math.max(0, Math.min(1, .5 + slope * .9)), crest = L.top + h * L.amp;
          cA.copy(cS).lerp(cL, lit);                                   // crest: lit or shaded flank
          cB.copy(cS).lerp(cL, lit * .45).multiplyScalar(.97);        // body below the crest
          rows.push([[t, Y(crest)], [t, Y(crest - L.amp * .45)], [t, Y(-55)]]); cols.push([cA.clone(), cB.clone(), cS.clone().multiplyScalar(.9)]);
        }
        for (let i = 0; i < N; i++) for (let r = 0; r < 2; r++) {
          const q = [[i, r], [i + 1, r], [i + 1, r + 1], [i, r], [i + 1, r + 1], [i, r + 1]];
          for (const [ii, rr] of q) { const [t, y] = rows[ii][rr], col = cols[ii][rr]; ringPos.push(Math.cos(t) * L.dist, y, Math.sin(t) * L.dist); ringNor.push(0, 1, 0); ringCol.push(col.r, col.g, col.b); }
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(ringPos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(ringNor, 3)); g.setAttribute('color', new T.Float32BufferAttribute(ringCol, 3));
      g.computeBoundingSphere();
      const ring = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false, side: T.DoubleSide }));
      ring.name = 's-distant-dunes'; ring.frustumCulled = false; localSky.add(ring);
    }
    // ---------------------------------------------------------------------------------------------
    // The sand ramp under the S: stepped terraces of rounded blocks, pale pink-peach with lavender sides.
    const hillInfo = (() => {
      const rr = mk(8123), step = LOW_POWER ? 1.0 : .85, hb = batch(), X = new T.Vector3(), Y = new T.Vector3(), Z = new T.Vector3(), bm = new T.Matrix4(), q = new T.Quaternion(), ps = new T.Vector3();
      const lvl = (x, a) => Math.round(rampH(x, a) / step);
      const pal = ['#cfaecb', '#c9a6c6', '#d4b4cf', '#c4a1c2'], palSide = ['#a684b0', '#9f7caa', '#ad8bb5'], zero = new T.Vector3(0, 0, -1);
      let n = 0; const disks = [];
      for (let xi = -11; xi <= 11; xi++) for (let ai = 0; ai <= 20; ai++) {
        const x = xi * step, a = RAMP.a0 - 1.6 + ai * step, L = lvl(x, a); if (L < 1) continue;
        const nb = Math.min(lvl(x - step, a), lvl(x + step, a), lvl(x, a - step), lvl(x, a + step)), kmin = Math.max(1, Math.min(L, nb + 1));
        const dir = P(x, a), up = dir.clone(), fw = tangent(zero, up), rt = new T.Vector3().crossVectors(up, fw).normalize();
        for (let k = kmin; k <= L; k++) {
          ps.copy(dir).multiplyScalar(R + .5 + (k - .5) * step);
          X.copy(rt); Y.copy(up); Z.copy(fw); bm.makeBasis(X, Y, Z); q.setFromRotationMatrix(bm);
          // blocks higher up the ramp sit on a bigger radius: widen them so neighbouring columns still touch
          const spread = (R + .5 + (k - .5) * step) / SURF;
          matrix.compose(ps, q, scale.set(step * 1.04 * spread, step * 1.03, step * 1.04 * spread));
          const top = k === L, h = k / Math.max(1, L);
          color.set(top ? pal[Math.floor(rr() * pal.length)] : palSide[Math.floor(rr() * palSide.length)]); color.multiplyScalar(.93 + h * .1 + (rr() - .5) * .05);
          hb.add(cube, matrix, color.getHex()); n++;   // plain cubes: the ramp reads as one solid stepped dune, not a row of pillars
        }
      }
      for (let xi = -4; xi <= 4; xi++) for (let ai = 0; ai <= 5; ai++) {
        const x = xi * 2.4, a = RAMP.a0 + .2 + ai * 2.2; if (rampH(x, a) > .5 || (ai > 0 && ai < 5 && rampH(x, a) > .2)) disks.push({ dir: P(x, a), r: 1.75, kind: 'snake' });
      }
      const mesh = hb.mesh(); mesh.name = 's-snake-ramp'; mesh.castShadow = !LOW_POWER; root.add(mesh);
      return { mesh, disks, blocks: n };
    })();
    // ---------------------------------------------------------------------------------------------
    // The giant snake: a tube of small rounded blocks that follows the spine. Only the upper ~230 degrees are built.
    const snakeSegs = [];
    const goldA = ['#f0bd45', '#e9b23a', '#f4c552', '#e4a934', '#eeb841'], goldBelly = ['#f6d277', '#f2ca66', '#f8d886'], stripe = ['#a9652f', '#9c5b2a', '#b37037', '#a1602c'];
    const patchCtr = []; { const pr = mk(77); for (let k = 0; k < 14; k++) patchCtr.push([5 + k * 7.1 + pr() * 2, .35 + pr() * 2.4, 1.3 + pr() * 1.2]); }
    function snakeColor(s, th, r, rr, ring) {
      for (const [ps, pth, prad] of patchCtr) { const ds = s - ps, dt = (th - pth) * r; if (ds * ds + dt * dt < prad * prad * (.7 + .5 * Math.sin(ds * 2.3 + dt * 1.7))) { color.set(stripe[Math.floor(rr() * stripe.length)]); return color.getHex(); } }
      const top = Math.sin(th); const belly = th < .3 || th > Math.PI - .3;
      color.set(belly ? goldBelly[Math.floor(rr() * 3)] : goldA[Math.floor(rr() * goldA.length)]);
      if (top > .55) color.offsetHSL(0, 0, .015 + (rr() - .5) * .02);
      return color.getHex();
    }
    {
      const rr = mk(4711), segLen = 9, X = new T.Vector3(), Y = new T.Vector3(), Z = new T.Vector3(), basisM = new T.Matrix4(), q = new T.Quaternion(), ps = new T.Vector3();
      let seg = null, segStart = 0;
      for (let i = 1; i < spine.length - 1; i++) {
        if (!seg || i - segStart >= segLen / BLOCK) { if (seg) snakeSegs.push(seg); seg = { b: batch(), pts: [], i0: i }; segStart = i; }
        const cur = spine[i], N0 = cur.p.clone().normalize();
        const Tn = spine[i + 1].p.clone().sub(spine[i - 1].p).normalize();
        const Bn = new T.Vector3().crossVectors(N0, Tn).normalize(), Nn = new T.Vector3().crossVectors(Tn, Bn).normalize();
        // fatter body; the far end tapers into a tail (the head now sits at the start of the spine)
        const tl = i / (spine.length - 1), taper = tl > .8 ? 1 - .65 * smooth(.8, 1, tl) : 1;
        const s = i * BLOCK, r = cur.r * 1.2 * taper * (i < 6 ? .9 : 1), rowShift = (i & 1) * .5;
        const sweep = Math.PI + (LOW_POWER ? .45 : .7), th0 = LOW_POWER ? -.22 : -.35, count = Math.max(3, Math.round(sweep * r / (BLOCK * 1.0))), dth = sweep / count;
        for (let k = 0; k <= count; k++) {
          const th = th0 + (k + rowShift) * dth; if (th > Math.PI - th0) continue;
          const cth = Math.cos(th), sth = Math.sin(th);
          const nrm = Bn.clone().multiplyScalar(cth).addScaledVector(Nn, sth);
          const thick = BLOCK * 1.7 * Math.min(1, r / 1.1);
          ps.copy(cur.p).addScaledVector(nrm, r - thick * .5 + (rr() - .5) * .04);
          X.copy(Tn); Y.copy(nrm); Z.crossVectors(X, Y).normalize(); basisM.makeBasis(X, Y, Z); q.setFromRotationMatrix(basisM);
          const jitter = 1 + (rr() - .5) * .06;
          matrix.compose(ps, q, scale.set(BLOCK * .97, thick, dth * r * .97 * jitter));
          // baked light: top of the body bright, flanks and belly darker (fake ambient occlusion where it meets the sand)
          const upk = nrm.dot(N0), shadeK = .7 + .3 * Math.max(0, upk) + .04 * (rr() - .5);
          color.set(snakeColor(s, th, r, rr)).multiplyScalar(shadeK);
          seg.b.add(cube, matrix, color.getHex());
        }
        seg.pts.push(cur.p);
      }
      if (seg) snakeSegs.push(seg);
    }
    // finale wave: each body vertex knows how far along the spine it is (0 = head, 1 = tail); a bump runs tail → head
    const snakeWake = { wave: { value: 2 }, amp: { value: LOW_POWER ? .75 : .9 } };
    const snakeMat = material.clone();
    snakeMat.onBeforeCompile = sh => {
      sh.uniforms.uWave = snakeWake.wave; sh.uniforms.uAmp = snakeWake.amp;
      sh.vertexShader = 'attribute float aS;\nuniform float uWave;\nuniform float uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n float bw = exp(-pow((aS - uWave) / .075, 2.));\n transformed += normalize(position) * bw * uAmp;');
    };
    snakeMat.customProgramCacheKey = () => 's-snake-wave';
    const snakeMeshes = snakeSegs.map(sg => {
      const m = sg.b.mesh(snakeMat); m.name = 's-snake-body';
      { const pa = m.geometry.attributes.position, aS = new Float32Array(pa.count), vv = new T.Vector3(), last = spine.length - 1;
        for (let j = 0; j < pa.count; j++) { vv.fromBufferAttribute(pa, j); let bk = 0, bd = 1e9; for (let k = 0; k < sg.pts.length; k++) { const d = vv.distanceToSquared(sg.pts[k]); if (d < bd) { bd = d; bk = k; } } aS[j] = (sg.i0 + bk) / last; }
        m.geometry.setAttribute('aS', new T.BufferAttribute(aS, 1)); m.geometry.boundingSphere.radius += 1.2; } m.castShadow = !LOW_POWER; root.add(m);
      const ctr = new T.Vector3(); sg.pts.forEach(p => ctr.add(p)); ctr.divideScalar(sg.pts.length).normalize();
      let rad = 0; sg.pts.forEach(p => { rad = Math.max(rad, Math.acos(Math.min(1, ctr.dot(p.clone().normalize())))); });
      return { mesh: m, center: ctr, rad };
    });
    // ---- sleeping head (block built), at the far end of the spine ----
    const head = (() => {
      // Round 5: the sleeping head is the top-right end of the S, so it is in the spawn view (like the concept art)
      const e = spine[0], e2 = spine[3];
      const N0 = e.p.clone().normalize(), Tn = e.p.clone().sub(e2.p).normalize();
      const toCam = tangent(START_DIR.clone().sub(N0), N0);
      const g = new T.Group(), b = batch(), rr = mk(909), pal = ['#f2c04a', '#edb63f', '#f6c957', '#e9ae38'];
      const lobes = [[0, .7, .75, 2.5, 1.85, 2.75], [0, .45, -1.6, 2.2, 1.6, 2.0]];
      voxelBlob(b, lobes, LOW_POWER ? .5 : .36, LOW_POWER ? .58 : .42, pal, rr, 1.02);
      // face features on the front surface of the front lobe (super-ellipsoid, p = 2.7)
      const [fcx, fcy, fcz, frx, fry, frz] = lobes[0], zs = (x, y) => { const k = 1 - Math.pow(Math.abs((x - fcx) / frx), 2.7) - Math.pow(Math.abs((y - fcy) / fry), 2.7); return fcz + frz * Math.pow(Math.max(0, k), 1 / 2.7); };
      const dark = '#4b2b22';
      for (const sx of [-1, 1]) {   // closed, smiling eyes: small arc of dark blocks
        for (let k = -2; k <= 2; k++) { const x = sx * 1.05 + k * .22, y = .98 - .075 * (2 - Math.abs(k)) * -1 - .06 * Math.abs(k) * 0 + (Math.abs(k) === 2 ? .07 : 0) + (Math.abs(k) === 0 ? -.03 : 0); b.block(x, y, zs(x, y) - .02, .3, .17, .22, dark, 0, soft); }
        const cx = sx * 1.62, cy = .38; b.block(cx, cy, zs(cx, cy) - .03, .52, .3, .2, '#ee8f86', 0, soft);   // blush
      }
      for (let k = -3; k <= 3; k++) { const x = k * .22, y = -.02 - (3 - Math.abs(k)) * -.045 + (Math.abs(k) === 3 ? .05 : 0) - .04; b.block(x, y, zs(x, y) - .02, .24, .12, .2, dark, 0, soft); }   // gentle smile
      for (const sx of [-1, 1]) { const x = sx * .4, y = .45; b.block(x, y, zs(x, y) - .02, .14, .12, .16, '#9a5a30', 0, soft); }   // nostrils
      // a few darker blocks on the forehead like the body pattern
      for (const [x, y, s2] of [[-.6, 2.0, .55], [.45, 2.1, .68], [.0, 1.55, .45]]) b.block(x, y, zs(x, Math.min(y, 2.1)) - .15, s2, .22, s2, '#a9652f', 0, chunk);
      g.add(b.mesh());
      // awake eyes: big round dark eyes with a white sparkle, hidden while it sleeps
      const eb = batch();
      for (const sx of [-1, 1]) { const x = sx * 1.05, y = 1.0; eb.block(x, y, zs(x, y) + .02, .62, .66, .2, '#3b2420', 0, soft); eb.block(x + .14, y + .16, zs(x, y) + .12, .2, .2, .08, '#ffffff', 0, soft); }
      const eyes = eb.mesh(); eyes.visible = false; g.add(eyes);
      // little "z z" bubbles floating by the sleeping head
      const zb = batch(); const zz = (x, y, z, s) => { zb.block(x, y + s * .5, z, s, s * .2, s * .2, '#fff6e6', 0, soft); zb.block(x, y, z, s, s * .2, s * .2, '#fff6e6', 0, soft); zb.block(x, y + s * .25, z, s * .2, s * .5, s * .2, '#fff6e6', .0, soft); };
      zz(2.4, 3.1, 2.2, .52); zz(3.1, 4.0, 2.4, .72);
      const zm = zb.mesh(new T.MeshBasicMaterial({ vertexColors: true, fog: false })); zm.castShadow = false; g.add(zm);
      g.position.copy(e.p); const fwd = tangent(Tn.clone().multiplyScalar(.45).add(toCam), N0);
      orient(g, N0, fwd);   // z = forward (mostly towards the spawn camera), y = up
      g.position.addScaledVector(N0, -(e.r * .55 - .05)); g.name = 's-snake-head'; root.add(g);
      return { group: g, pos: e.p.clone(), dir: N0, fwd, eyes, zz: zm, baseQ: g.quaternion.clone(), basePos: g.position.clone() };
    })();
    // collision disks along the body (few, large) + head
    const snakeDisks = [];
    for (let i = 4; i < spine.length - 4; i += Math.round(1.9 / BLOCK)) { const s = spine[i]; if (!s.ground) continue; const d = s.p.clone().normalize(), o = { dir: d, r: s.r * .97 + .22, kind: 'snake' }; obstacles.push(o); snakeDisks.push(o); }
    for (const o of hillInfo.disks) { obstacles.push(o); snakeDisks.push(o); }
    { const o = { dir: head.dir.clone().normalize(), r: 2.6, kind: 'snake' }; obstacles.push(o); snakeDisks.push(o); }
    landmarks.snakeHead = { dir: head.dir.clone(), radius: 2.6, object: head.group };
    // ---------------------------------------------------------------------------------------------
    const placeMatrix = new T.Object3D();
    // ---- palms and cacti: rounded-cube everything ----
    const palmGreens = ['#4aa96a', '#3d9a5c', '#5bb877', '#47a068'], cactusGreens = ['#7bab52', '#6d9e49', '#86b85c', '#789f4a'];
    function palm(height, seed) {
      const g = new T.Group(), tb = batch(), rr = mk(seed), k = height / 5.6;
      for (let i = 0; i < 7; i++) { const t = i / 6, w = .78 - t * .22; tb.block(Math.sin(t * 1.6) * .42, .38 + i * .66, 0, w, .7, w, i % 2 ? '#a8774c' : '#b98558', i * .12, soft); }
      const top = [Math.sin(1.6) * .42, 4.9];
      for (let f = 0; f < 8; f++) {
        const a = f / 8 * Math.PI * 2 + rr() * .2, len = 5;
        for (let j = 0; j < len; j++) {
          const t = j / (len - 1), out = .55 + j * .62, drop = Math.sin(t * 1.5) * 1.35 - .1 - t * .1;
          tb.block(top[0] + Math.cos(a) * out, top[1] + .35 + (j === 0 ? .1 : 0) - drop + (1 - t) * .3, Math.sin(a) * out, .62 - t * .2, .24, .62 - t * .2, palmGreens[(f + j) % 4], -a, chunk);
        }
      }
      for (const [x, z] of [[.28, .1], [-.2, .26], [.0, -.3]]) tb.block(top[0] + x, top[1] - .05, z, .42, .42, .42, '#7a5a3a', 0, chunk);
      g.add(tb.mesh()); g.scale.setScalar(k); return g;
    }
    function saguaro(height, seed) {
      const g = new T.Group(), b = batch(), rr = mk(seed), k = height / 4.0, pal = cactusGreens;
      const col = (x, z, h, w, y0 = 0) => { for (let i = 0; i < Math.round(h / .62); i++) b.block(x, y0 + .31 + i * .62, z, w, .66, w, pal[(i + Math.floor(rr() * 3)) % 4], 0, chunk); };
      col(0, 0, 3.7, 1.0);
      b.block(0, 3.78, 0, .86, .5, .86, '#8fc062', 0, chunk);
      for (const s of [-1, 1]) { const y = 1.3 + (s > 0 ? .5 : 0); for (let i = 0; i < 2; i++) b.block(s * (.78 + i * .52), y, 0, .62, .62, .62, pal[i], 0, chunk); col(s * 1.3, 0, 1.3 + (s > 0 ? .3 : 0), .62, y); b.block(s * 1.3, y + 1.45 + (s > 0 ? .3 : 0), 0, .5, .4, .5, '#8fc062', 0, chunk); }
      for (const [x, y, z] of [[.1, 3.98, .12], [-.15, 3.96, -.1]]) b.block(x, y, z, .3, .24, .3, '#f08aa6', .3, chunk);
      g.add(b.mesh()); g.scale.setScalar(k); return g;
    }
    function barrel(s, seed) {
      const g = new T.Group(), b = batch(), rr = mk(seed);
      voxelBlob(b, [[0, .85 * s, 0, 1.0 * s, .9 * s, 1.0 * s], [.75 * s, .5 * s, .35 * s, .55 * s, .45 * s, .55 * s]], (LOW_POWER ? .62 : .5) * s, (LOW_POWER ? .74 : .6) * s, cactusGreens, rr, 1.0);
      for (const [x, z] of [[0, 0], [.3, -.2], [-.28, .22]]) b.block(x * s, 1.78 * s, z * s, .34 * s, .26 * s, .34 * s, '#f08aa6', .3, chunk);
      g.add(b.mesh()); return g;
    }
    // ---- stepped dune mound (walkable obstacle, pale peach / lavender) ----
    function dune(sx, sz, h, seed) {
      const g = new T.Group(), b = batch(), rr = mk(seed);
      voxelBlob(b, [[0, h * .3, 0, sx * 1.25, h * .48, sz * 1.15], [sx * .55, h * .2, sz * .3, sx * .8, h * .34, sz * .7]], LOW_POWER ? .8 : .6, LOW_POWER ? .92 : .7, ['#e7c4d8', '#e1bad3', '#ecccdf', '#dab2ce'], rr, 1.0);
      g.add(b.mesh()); return g;
    }
    // ---- red-brick rock arch ----
    function archModel() {
      const g = new T.Group(), b = batch(), rr = mk(2468), bricks = ['#b8573a', '#c4663f', '#a84c34', '#cf7448', '#b25a3c'];
      const bs = .62;
      for (const s of [-1, 1]) for (let y = 0; y < 5; y++) for (let z = -1; z <= 1; z++) {
        const jx = (y % 2) * .16; for (let x = 0; x < 2; x++) b.block(s * (1.55 + x * .68 + jx), .31 + y * bs, z * .66, .66, bs * 1.02, .64, bricks[Math.floor(rr() * 5)], 0, (z === 0 && LOW_POWER) ? cube : chunk);
      }
      const R0 = 1.75, rows = 4;
      for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; for (let rw = 0; rw < rows; rw++) for (let z = -1; z <= 1; z++) { const rad = R0 + rw * .62 + .31, x = Math.cos(a) * rad, y = 3.1 + Math.sin(a) * rad; if (i === 0 || i === 12) continue; b.block(x, y, z * .66, .66, .66, .64, bricks[Math.floor(rr() * 5)], -a + Math.PI / 2 + 0, (z === 0 && LOW_POWER) ? cube : chunk); } }
      for (const s of [-1, 1]) for (const [x, y, z, w] of [[2.9, .3, 1.15, .5], [3.5, .25, .6, .4], [2.6, 3.4, 1.2, .45]]) b.block(s * x, y, z, w, w, w, bricks[Math.floor(rr() * 5)], .3, chunk);
      g.add(b.mesh()); return g;
    }
    function redRock(seed) {
      const g = new T.Group(), b = batch(), rr = mk(seed), bricks = ['#b8573a', '#c4663f', '#a84c34', '#cf7448'];
      const n = 3 + Math.floor(rr() * 2); for (let i = 0; i < n; i++) { const w = 1.3 - i * .26 + rr() * .2; b.block((rr() - .5) * .2, .34 + i * .62, (rr() - .5) * .2, w, .66, w * .9, bricks[Math.floor(rr() * 4)], rr() * 1.2, chunk); }
      g.add(b.mesh()); return g;
    }
    // Round 5: a layered red-rock mesa (three rounded tiers, sun-lit pale bands) - the landmark of the far side
    function mesa(seed, k = 1) {
      const g = new T.Group(), b = batch(), rr = mk(seed), st = LOW_POWER ? .62 : .5, sz = LOW_POWER ? .72 : .6;
      const tiers = [[0, .8, 0, 2.6, .85, 2.2, ['#b8573a', '#c4663f', '#ad4f35']], [.2, 2.25, .1, 2.0, .75, 1.7, ['#c96c43', '#d17a4c', '#bf6240']], [-.15, 3.45, 0, 1.35, .6, 1.15, ['#d8865a', '#e0946a', '#cf7a50']]];
      for (const [x, y, z, rx, ry, rz, pal] of tiers) voxelBlob(b, [[x * k, y * k, z * k, rx * k, ry * k, rz * k]], st * k, sz * k, pal, rr, 1.0);
      for (const [x, z, w] of [[2.6, .9, .55], [-2.4, -.6, .48], [1.4, -2.0, .42]]) b.block(x * k, .25, z * k, w, w * .8, w, '#c4663f', rr() * 2, chunk);
      g.add(b.mesh()); return g;
    }
    // ---------------------------------------------------------------------------------------------
    // Stone stage: warm it up so it belongs to the desert (same geometry, tinted)
    STAGE.group.traverse(o => { if (o.isMesh && o.material && o.material.map && o.material.color) o.material.color.set('#f3dcc8'); });
    // ---- oasis (teal pond with a sandstone rim, palms and flowers) ----
    const OASIS_AT = [-10.8, .4], oasisD = P(OASIS_AT[0], OASIS_AT[1]);
    const pond = new T.Group(); place(pond, oasisD, STAGE.front, .06); pond.scale.setScalar(2.1 / 2.35); root.add(pond);
    obstacles.push({ dir: oasisD, r: 2.1, kind: 'pond', obj: pond }); landmarks.oasis = { dir: oasisD, radius: 2.1, object: pond };
    const basinMatrix = new T.Matrix4(), basinPoint = new T.Vector3();
    cells.forEach(([x, y, z], i) => { basinPoint.set(x, y, z); if (arc(basinPoint.clone().normalize(), oasisD) < 1.85) { basinPoint.addScaledVector(oasisD, -3.0); basinMatrix.makeTranslation(basinPoint.x, basinPoint.y, basinPoint.z); planet.setMatrixAt(i, basinMatrix); } });
    planet.instanceMatrix.needsUpdate = true;
    const shore = new T.Mesh(new T.CylinderGeometry(2.4, 2.25, .24, 32), new T.MeshStandardMaterial({ color: '#e9b98c', roughness: 1 })); shore.position.y = .03; shore.receiveShadow = true; pond.add(shore);
    const waterMat = new T.MeshStandardMaterial({ color: '#2fb7c6', transparent: true, opacity: .9, roughness: .2, metalness: .05 });
    const water = new T.Mesh(new T.CircleGeometry(2.15, 40), waterMat); water.rotation.x = -Math.PI / 2; water.position.y = .18; pond.add(water);
    { const st = batch(), rr = mk(31); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; st.block(Math.cos(a) * 2.25, .15, Math.sin(a) * 2.25, .42 + rr() * .16, .27 + rr() * .17, .46, ['#d9a073', '#c98c62', '#e4b183'][i % 3], a, soft); } pond.add(st.mesh()); }
    const ripples = [];
    for (let i = 0; i < 5; i++) { const m = new T.Mesh(new T.RingGeometry(.21, .23, 24), new T.MeshBasicMaterial({ color: '#e3f8ef', transparent: true, opacity: .35, side: T.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set((rng() - .5) * 2.7, .195, (rng() - .5) * 2.7); pond.add(m); ripples.push(m); }
    for (let i = 0; i < 4; i++) { const m = new T.Mesh(new T.CircleGeometry(.25, 12, 0, Math.PI * 1.85), new T.MeshStandardMaterial({ color: '#72b87a', side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.rotation.z = i; m.position.set(-1.2 + i * .6, .20, .85 + Math.sin(i) * .3); pond.add(m); }
    const ducks = [];   // (kept for interface parity with the A world; none on the oasis)
    // distant sky for a hot, hazy "magical hour" lives in the dome; stars twinkle brighter at dusk (see update)
    const placed = [];
    const kindOf = o => o.kind === 'snake' ? 'snake' : o.kind === 'house' || o.kind === 'arch' ? 'building' : o.kind === 'tree' ? 'tree' : o.kind === 'pond' ? 'pond' : o.kind === 'dune' ? 'dune' : 'other';
    // palms + flowers around the oasis (hand placed, nothing overlaps the water)
    function addPalm(x, a, h, seed) { const d = P(x, a), g = palm(h, seed); g.name = 'round3-tree'; register(g, d, .55, 'tree'); treeInfo.push({ dir: d, height: h }); placed.push({ dir: d, r: .8, kind: 'tree' }); return d; }
    // arch: opens towards the spawn camera, behind the oasis
    const archD = P(-11.0, 6.2), archG = archModel(), archFwd = tangent(STAGE.center.clone().sub(archD), archD); archG.name = 's-arch'; archG.scale.setScalar(1.1);
    place(archG, archD, archFwd, -.06); root.add(archG); scenery.push(archG);   // opening faces the stage: you look through it
    { const rgt = new T.Vector3().crossVectors(archD, archFwd).normalize(); // pillar collision disks
      for (const s of [-1, 1]) { const pd = c.moveAlong(archD, rgt, s * 2.2).normalize(); obstacles.push({ dir: pd, r: .95, kind: 'rock' }); placed.push({ dir: pd, r: .95, kind: 'rock' }); } }
    landmarks.arch = { dir: archD, radius: 2.4, object: archG };
    obstacles.forEach(o => placed.push({ dir: o.dir, r: o.r, kind: kindOf(o) }));
    answerDirs.forEach(d => placed.push({ dir: d, r: 1.2, kind: 'crystal' }));
    const MIN = {
      tree: { tree: 5.6, building: 6.6, pond: 4.6, crystal: 4.4, bush: 3.0, flower: 1.7, dune: 5.0, snake: 1.2, rock: 2.6, other: 3.0 },
      bush: { tree: 3.0, building: 4.0, pond: 3.2, crystal: 3.0, bush: 2.8, flower: 1.4, dune: 3.2, snake: .8, rock: 2.0, other: 2.2 },
      flower: { tree: 1.7, building: 3.0, pond: 2.5, crystal: 2.4, bush: 1.4, flower: 1.9, dune: 2.4, snake: .5, rock: 1.2, other: 1.5 },
      rock: { tree: 2.4, building: 3.0, pond: 2.6, crystal: 2.4, bush: 1.8, flower: 1.2, dune: 3.0, snake: .5, rock: 4.0, other: 1.5 },
      dune: { tree: 5.0, building: 6.0, pond: 5.0, crystal: 4.5, bush: 3.2, flower: 2.4, dune: 8.5, snake: .5, rock: 3.0, other: 3.0 },
    };
    function fits(d, kind, r, corridor = 0, opt = {}) {
      if (opt.nearOk !== true) { if (arc(d, STAGE.center) < (opt.stage || (kind === 'tree' ? 6.0 : kind === 'dune' ? 6.0 : 4.4))) return false; if (arc(d, START_DIR) < (kind === 'tree' ? 3.6 : kind === 'dune' ? 16 : 2.4)) return false; }
      for (const p of placed) { const need = Math.max(r + p.r + .3, (MIN[kind] && MIN[kind][p.kind]) || 0); if (arc(d, p.dir) < need) return false; }
      if (corridor) for (const t of trailPts) if (arc(d, t) < corridor) return false;
      return true;
    }
    const randDir = rr => { for (;;) { const v2 = new T.Vector3(rr() * 2 - 1, rr() * 2 - 1, rr() * 2 - 1), l = v2.length(); if (l > .1 && l < 1) return v2.divideScalar(l); } };
    const placeRng = mk(90210);
    // 1) oasis palms
    addPalm(-14.8, -1.0, 5.6, 1); addPalm(-9.4, -4.3, 5.0, 2); addPalm(-14.6, 3.6, 4.6, 3);
    // 2) the sleeping head's dune: a big stepped dune right beside the head, so the face peeks out from behind it
    {
      const hd = head.dir, rgt = new T.Vector3().crossVectors(hd, head.fwd).normalize();
      // Round 5: no extra dune beside the head (it would hide the sleeping face from the spawn view); keep the spot clear
      void rgt; placed.push({ dir: hd.clone(), r: 3.2, kind: 'dune' });
    }
    // Round 5: the side and back views need a focal point each - a red mesa with a few cacti around it
    {
      const spots = [[12.5, 1.5], [9, -13], [-11, -14.5], [2, 34]], lr = mk(5150);   // right flank, back-right, back-left, far side
      spots.forEach(([x, a], si) => {
        const d = P(x, a); if (!fits(d, 'rock', 2.3, 2.0, { nearOk: true })) return;
        const g = mesa(8800 + si, .95 + lr() * .25); g.name = 's-mesa'; register(g, d, 2.3, 'rock'); placed.push({ dir: d, r: 2.6, kind: 'dune' }); landmarks['mesa' + si] = { dir: d, radius: 2.3, object: g };
        for (let k = 0; k < 3; k++) {
          const a2 = lr() * Math.PI * 2, t = tangent(new T.Vector3(Math.cos(a2), 0, Math.sin(a2)), d), dd = c.moveAlong(d, t, 4.2 + lr() * 1.6).normalize();
          if (!fits(dd, 'tree', .7, 2.2, { nearOk: true })) continue;
          const h = 3.4 + lr() * 1.2, cg = k === 2 ? barrel(1 + lr() * .3, 8900 + si * 3 + k) : saguaro(h, 8900 + si * 3 + k);
          cg.name = 'round3-tree'; register(cg, dd, k === 2 ? 1.0 : .75, 'tree'); treeInfo.push({ dir: dd, height: h }); placed.push({ dir: dd, r: .9, kind: 'tree' });
        }
      });
    }
    // 3) spread dunes, cacti, palms over the WHOLE sphere (seeded dart throwing with per-type minimum distances)
    let nDune = 0; const duneTarget = LOW_POWER ? 6 : 9;
    for (let tries = 0; nDune < duneTarget && tries < 9000; tries++) {
      const d = randDir(placeRng); if (!clearsLesson(d, 2.4) || !fits(d, 'dune', 2.6, 3.0)) continue;
      const g = dune(2.6 + placeRng() * 1.6, 2.3 + placeRng() * 1.2, 2.6 + placeRng() * 1.6, 6000 + nDune); g.name = 's-dune';
      register(g, d, 2.2, 'dune'); placed.push({ dir: d, r: 2.4, kind: 'dune' }); nDune++;
    }
    const treeTarget = LOW_POWER ? 19 : 28; let nTree = 0;
    for (let tries = 0; nTree < treeTarget && tries < 12000; tries++) {
      const d = randDir(placeRng); if (!clearsLesson(d, 1.2) || !fits(d, 'tree', .7, 2.7)) continue;
      const roll = placeRng(), h = 3.6 + placeRng() * 1.3; let g, rad;
      if (roll < .46) { g = saguaro(h, 7000 + nTree); rad = .75; } else if (roll < .8) { g = barrel(.95 + placeRng() * .35, 7100 + nTree); rad = 1.0; } else { g = redRock(7200 + nTree); rad = .9; }
      g.name = 'round3-tree'; register(g, d, rad, 'tree'); treeInfo.push({ dir: d, height: h }); placed.push({ dir: d, r: rad, kind: 'tree' }); nTree++;
    }
    // flowers by the oasis + a few desert flowers elsewhere
    const flowerPals = [['#ef6a3c', '#ff9a4a'], ['#ef7f9f', '#fbb4c8'], ['#a05ad8', '#c58be0'], ['#ffd35a', '#fff0dc'], ['#e8546d', '#ff8f9c']];
    const fRng = mk(31337), patches = [];
    function bigFlower(b, x, z, h, c0, c1, sz = 1) {
      b.block(x, h * .5, z, .07 * sz, h, .07 * sz, '#5b9446', 0, cube); b.block(x + .14 * sz, h * .38, z, .34 * sz, .1 * sz, .17 * sz, '#69a652', .5, cube);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; b.block(x + Math.cos(a) * .2 * sz, h, z + Math.sin(a) * .2 * sz, .3 * sz, .12 * sz, .24 * sz, k % 2 ? c0 : c1, -a, cube); }
      b.block(x, h + .05 * sz, z, .2 * sz, .16 * sz, .2 * sz, '#f4b82e', 0, cube);
    }
    const K=18,anchors=[];for(let i=0;i<K;i++){const y=1-2*(i+.5)/K,rad=Math.sqrt(1-y*y),a=i*2.399963;anchors.push(new T.Vector3(Math.cos(a)*rad,y,Math.sin(a)*rad));}
    const chunks=anchors.map(a=>({center:a,b:batch()}));
    const chunkOf=d=>{let best=0,bd=-2;for(let i=0;i<K;i++){const v=anchors[i].dot(d);if(v>bd){bd=v;best=i;}}return chunks[best];};
    const templates={};
    function emit(sb,d,forward,lift=.02,tint='#ffffff',key=null) {
      let geo=key&&templates[key];
      if(!geo){const m=sb();geo=m.geometry;if(key)templates[key]=geo;}
      place(placeMatrix,d,forward,lift);placeMatrix.updateMatrix();chunkOf(d).b.add(geo,placeMatrix.matrix,tint);
      if(!key)geo.dispose();
    }
    // oasis flower ring (hand placed around the rim, away from the palms)
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + .35, rgt0 = new T.Vector3().crossVectors(oasisD, STAGE.front).normalize();
      const fw = tangent(STAGE.front, oasisD), d = c.moveAlong(oasisD, fw.clone().multiplyScalar(Math.cos(a)).addScaledVector(rgt0, Math.sin(a)), 3.05 + (i % 2) * .35).normalize();
      if (placed.some(p => p.kind !== 'flower' && p.kind !== 'pond' && arc(d, p.dir) < p.r + .5) || trailPts.some(t => arc(d, t) < 1.0)) continue;
      const b = batch(), pal = flowerPals[i % 5], k = 2 + (i % 2);
      for (let j = 0; j < k; j++) bigFlower(b, (j - (k - 1) / 2) * .4 + (fRng() - .5) * .12, (fRng() - .5) * .45, .3 + fRng() * .32, pal[0], pal[1], .85 + fRng() * .5);
      emit(() => b.mesh(), d, tangent(randDir(fRng), d), .02); placed.push({ dir: d, r: .6, kind: 'flower' }); patches.push(d);
    }
    const nPatch = LOW_POWER ? 14 : 24;
    for (let tries = 0, n = 0; n < nPatch && tries < 9000; tries++) {
      const d = randDir(fRng); if (!fits(d, 'flower', .6, 1.55, { stage: 5.0 })) continue;
      const b = batch(), k = 2 + (n % 3), pal = flowerPals[n % 5];
      for (let j = 0; j < k; j++) bigFlower(b, (j - (k - 1) / 2) * .42 + (fRng() - .5) * .12, (fRng() - .5) * .5, .3 + fRng() * .3, pal[0], pal[1], .8 + fRng() * .4);
      emit(() => b.mesh(), d, tangent(randDir(fRng), d), .02); placed.push({ dir: d, r: .6, kind: 'flower' }); patches.push(d); n++;
    }
    // round olive bushes (rounded-cube clusters)
    let nBush = 0; const bushTarget = LOW_POWER ? 10 : 16;
    for (let tries = 0; nBush < bushTarget && tries < 6000; tries++) {
      const d = randDir(fRng); if (!fits(d, 'bush', .9, 2.1)) continue;
      const b = batch(), s = .7 + fRng() * .45, rrb = mk(300 + nBush);
      voxelBlob(b, [[0, .75 * s, 0, 1.1 * s, .8 * s, 1.1 * s], [.5 * s, .55 * s, .3 * s, .75 * s, .55 * s, .75 * s]], (LOW_POWER ? .95 : .62) * s, (LOW_POWER ? 1.08 : .7) * s, nBush % 5 === 4 ? ['#e48faf', '#ef9fbb', '#d97d9f'] : ['#8aa65a', '#9bb865', '#7a974e', '#a8c070'], rrb, 1.05);
      emit(() => b.mesh(), d, tangent(randDir(fRng), d), 0); placed.push({ dir: d, r: .9, kind: 'bush' }); obstacles.push({ dir: d, r: .8 * s, kind: 'bush' }); nBush++;
    }
    // pebbles / small sandstone blocks
    for (let tries = 0, n = 0; n < (LOW_POWER ? 12 : 20) && tries < 4000; tries++) {
      const d = randDir(fRng); if (!fits(d, 'rock', .6, 1.6)) continue;
      const b = batch(); b.block(0, .2, 0, .7 + fRng() * .5, .4 + fRng() * .3, .6 + fRng() * .5, ['#d6a98a', '#c99a80', '#e0b79a'][n % 3], fRng() * 3, soft);
      emit(() => b.mesh(), d, STAGE.front, .02); placed.push({ dir: d, r: .5, kind: 'rock' }); obstacles.push({ dir: d, r: .45, kind: 'rock' }); n++;
    }
    // near-field details for the spawn view (flowers / dry grass in front of and beside the player, never on the path)
    const gn = d => XA(d), nearZone = d => { if (d.y < .3) return false; const [x, a] = XA(d); return a < -2.2 && a > -14 && Math.abs(x) < 9.5; };
    let nNear = 0;
    for (let tries = 0; nNear < (LOW_POWER ? 6 : 8) && tries < 4000; tries++) {
      const d = P((fRng() - .5) * 18, -(4.3 + fRng() * 8)); if (!nearZone(d) || arc(d, START_DIR) < 1.5 || trailPts.some(t => arc(d, t) < 1.35) || placed.some(p => arc(d, p.dir) < Math.max(p.r + .8, p.kind === 'tree' ? 3.0 : p.kind === 'flower' ? 2.3 : 1.4))) continue;
      const b = batch(), k = 2 + (nNear % 3), pal = flowerPals[(nNear * 2 + 1) % 5];
      for (let j = 0; j < k; j++) bigFlower(b, (j - (k - 1) / 2) * .4 + (fRng() - .5) * .14, (fRng() - .5) * .5, .3 + fRng() * .3, pal[0], pal[1], .85 + fRng() * .45);
      emit(() => b.mesh(), d, STAGE.front, .02); placed.push({ dir: d, r: .6, kind: 'flower' }); patches.push(d); nNear++;
    }
    // dry grass tufts everywhere (cheap 3-blade cubes), denser near the camera
    const tuftBatch = batch(); for (let j = 0; j < 3; j++) tuftBatch.block((j - 1) * .09, .12, 0, .05, .24 + (j === 1 ? .07 : 0), .06, '#ffffff', j * .5, cube);
    const tuftGeo = tuftBatch.mesh().geometry, tuftCols = ['#d7a95a', '#c99a50', '#e6bd74', '#bf9156'];
    const nTuft = LOW_POWER ? 300 : 620; let nT = 0;
    for (let tries = 0; nT < nTuft && tries < nTuft * 3; tries++) {
      const d = randDir(fRng); if (arc(d, STAGE.center) < 3.5) continue;
      if (placed.some(p => p.kind !== 'flower' && p.kind !== 'rock' && arc(d, p.dir) < p.r * .8 + .3)) continue;
      if (trailPts.some(t => arc(d, t) < 1.0)) continue;
      place(placeMatrix, d, tangent(randDir(fRng), d), .02); placeMatrix.scale.setScalar(.7 + fRng() * .5); placeMatrix.updateMatrix();
      chunkOf(d).b.add(tuftGeo, placeMatrix.matrix, tuftCols[nT % 4]); placeMatrix.scale.setScalar(1); nT++;
    }
    let nTn = 0;
    for (let tries = 0; nTn < (LOW_POWER ? 50 : 80) && tries < 2500; tries++) {
      const d = P((fRng() - .5) * 20, -(3.8 + fRng() * 9)); if (!nearZone(d) || arc(d, START_DIR) < 1.0 || trailPts.some(t => arc(d, t) < 1.05) || placed.some(p => p.kind !== 'flower' && arc(d, p.dir) < p.r * .8 + .3)) continue;
      place(placeMatrix, d, tangent(randDir(fRng), d), .02); placeMatrix.scale.setScalar(.7 + fRng() * .5); placeMatrix.updateMatrix();
      chunkOf(d).b.add(tuftGeo, placeMatrix.matrix, tuftCols[nTn % 4]); placeMatrix.scale.setScalar(1); nTn++;
    }
    const floraNear={value:new T.Vector2(9,12.5)},fadedMats=new Map();
    // near-camera dissolve: a copy of the material that dithers away fragments much closer to the camera than the player
    // inPlace patches the given material itself (props keep references to their materials for the occluder fade)
    function nearFade(mat,inPlace=false){
      if(fadedMats.has(mat))return fadedMats.get(mat);
      const m=inPlace?mat:mat.clone(),prev=mat.onBeforeCompile,prevKey=mat.customProgramCacheKey?mat.customProgramCacheKey.bind(mat):()=>'';
      m.onBeforeCompile=(sh,r)=>{
        if(prev)prev.call(m,sh,r);
        sh.uniforms.uNear=floraNear;
        sh.vertexShader='varying float vViewZ;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n  vViewZ=-mvPosition.z;');
        sh.fragmentShader='uniform vec2 uNear;varying float vViewZ;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n  {float fk=smoothstep(uNear.x,uNear.y,vViewZ);if(fk<1.){float n=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);if(n>fk)discard;}}');
      };
      m.customProgramCacheKey=()=>prevKey()+'-round5-near-fade';
      m.needsUpdate=true;fadedMats.set(mat,m);return m;
    }
    const floraMat = nearFade(material);
    const floraMeshes = chunks.map(ch => { const m = ch.b.mesh(floraMat); m.castShadow = false; m.name = 's-flora'; root.add(m); return { mesh: m, center: ch.center }; });
    const fadeTargets = []; scene.traverse(o => { if (o.name === 'round3-tree' || o.name === 's-dune' || o.name === 's-mesa' || o.name === 's-arch') fadeTargets.push(o); });
    fadeTargets.forEach(g => g.traverse(o => { if (o.isMesh && (o.material.isMeshStandardMaterial || o.material.isMeshLambertMaterial)) nearFade(o.material, true); }));
    const CHUNK_RAD = Math.sqrt(4 * Math.PI / K) * .62;
    const propMap = () => placed.map(p => [+p.dir.x.toFixed(3), +p.dir.y.toFixed(3), +p.dir.z.toFixed(3), p.kind, +p.r.toFixed(2)]);
    // ---- wandering critters (blocky, spread over the sphere; frozen when far from the camera) ----
    const fauna = [];
    function makeAnimal(kind) {
      const b = batch(), P2 = { rabbit: ['#ecd2b0', '#fff4e2', '#e8a0a4'], fennec: ['#efc48e', '#fff2dc', '#3a2c2a'], meerkat: ['#d9b27c', '#f4dcc0', '#6b4429'], hedgehog: ['#a8805f', '#e9cfa8', '#4a3a30'], lizard: ['#8fbf69', '#eadf9d', '#3a3a2a'] }[kind];
      const [m1, m2, m3] = P2, s = { rabbit: 1, fennec: 1.1, meerkat: .95, hedgehog: .85, lizard: .9 }[kind];
      if (kind === 'lizard') {
        b.block(0, .13 * s, 0, .26 * s, .2 * s, .62 * s, m1, 0, soft); b.block(0, .15 * s, .42 * s, .22 * s, .18 * s, .26 * s, m1, 0, soft); b.block(0, .13 * s, -.5 * s, .14 * s, .12 * s, .5 * s, m1, 0, soft); b.block(0, .12 * s, -.86 * s, .09 * s, .09 * s, .3 * s, m1, 0, soft);
        for (const x of [-.17, .17]) for (const z of [-.18, .22]) b.block(x * s, .06 * s, z * s, .1 * s, .08 * s, .2 * s, m1, 0, soft);
        for (let i = 0; i < 4; i++) b.block(0, .25 * s, (-.2 + i * .17) * s, .1 * s, .06 * s, .1 * s, m2, 0, soft);
        for (const x of [-.07, .07]) b.block(x * s, .24 * s, .5 * s, .035 * s, .05 * s, .035 * s, m3, 0, cube);
      } else {
        b.block(0, .28 * s, 0, .34 * s, .30 * s, .5 * s, m1, 0, soft); b.block(0, .40 * s, .30 * s, .26 * s, .26 * s, .26 * s, m1, 0, soft); b.block(0, .34 * s, .45 * s, .14 * s, .1 * s, .1 * s, m2, 0, soft);
        b.block(-.05 * s, .42 * s, .52 * s, .035 * s, .035 * s, .02 * s, m3, 0, cube); b.block(.05 * s, .42 * s, .52 * s, .035 * s, .035 * s, .02 * s, m3, 0, cube);
        if (kind === 'rabbit') { for (const x of [-.07, .07]) b.block(x * s, .64 * s, .26 * s, .07 * s, .26 * s, .08 * s, m1, x * 2, soft); b.block(0, .3 * s, -.28 * s, .14 * s, .14 * s, .14 * s, m2, 0, soft); }
        if (kind === 'fennec') { for (const x of [-.1, .1]) b.block(x * s, .66 * s, .27 * s, .1 * s, .32 * s, .06 * s, m1, x * 1.5, soft); for (const x of [-.1, .1]) b.block(x * s, .64 * s, .29 * s, .05 * s, .22 * s, .03 * s, '#e8a0a4', 0, soft); b.block(0, .3 * s, -.5 * s, .14 * s, .14 * s, .5 * s, m1, 0, soft); b.block(0, .3 * s, -.74 * s, .14 * s, .14 * s, .12 * s, m2, 0, soft); }
        if (kind === 'meerkat') { b.block(0, .42 * s, -.34 * s, .18 * s, .46 * s, .18 * s, m1, 0, soft); for (const x of [-.07, .07]) b.block(x * s, .58 * s, .28 * s, .05 * s, .1 * s, .05 * s, m3, 0, soft); }
        if (kind === 'hedgehog') { b.block(0, .32 * s, -.04 * s, .42 * s, .3 * s, .5 * s, m3, 0, soft); b.block(0, .46 * s, -.06 * s, .34 * s, .12 * s, .4 * s, m1, 0, soft); }
      }
      const mesh = b.mesh(); mesh.castShadow = false; const g = new T.Group(); g.add(mesh); g.scale.setScalar(1.35); return g;
    }
    function spawnAnimal(kind, d) {
      const g = makeAnimal(kind); root.add(g); place(g, d, tangent(randDir(placeRng), d), 0);
      fauna.push({ g, kind, dir: d.clone(), home: d.clone(), heading: tangent(randDir(placeRng), d), target: null, pause: placeRng() * 3, shake: 0, speed: .55 + placeRng() * .25 });
    }
    const animalKinds = ['rabbit', 'lizard', 'fennec', 'meerkat', 'lizard', 'hedgehog', 'rabbit', 'fennec'];
    const faunaTarget = LOW_POWER ? 10 : 16;
    for (let tries = 0, n = 0; n < faunaTarget && tries < 5000; tries++) {
      const d = randDir(placeRng);
      if (arc(d, STAGE.center) < 3.5 || arc(d, START_DIR) < 2.5 || trailPts.some(t => arc(t, d) < 1.5)) continue;
      if (placed.some(p => arc(d, p.dir) < p.r + .7) || fauna.some(f => arc(f.dir, d) < 5)) continue;
      spawnAnimal(n < 3 ? ['rabbit', 'lizard', 'fennec'][n] : animalKinds[n % animalKinds.length], d); n++;
    }
    const butterflies = [];
    for (let i = 0; i < (LOW_POWER ? 6 : 10) && patches.length; i++) {
      const home = patches[Math.floor(placeRng() * patches.length)], bb = batch(), col = ['#f2c86d', '#edb1ce', '#9ec8f0', '#ffffff'][i % 4];
      bb.block(-.07, 0, 0, .14, .015, .1, col, .4, soft); bb.block(.07, 0, 0, .14, .015, .1, col, -.4, soft); bb.block(0, 0, 0, .025, .03, .12, '#4a3d36', 0, cube);
      const m = bb.mesh(); m.castShadow = false; const g = new T.Group(); g.add(m); g.scale.setScalar(1.6); root.add(g); butterflies.push({ g, m, home, phase: i * 1.7 });
    }
    const faunaBlocked = d => placed.some(p => p.kind !== 'flower' && p.kind !== 'rock' && arc(d, p.dir) < p.r + .2);
    const tmpV = new T.Vector3(), camDir = new T.Vector3(), mv = new T.Vector3();
    function updateFauna(dt, time, playerDir) {
      for (const f of fauna) {
        const near = arc(f.dir, playerDir) < 26; f.g.visible = near && f.dir.dot(camDir) > .1; if (!near) continue;
        if (f.shake > 0) { f.shake = Math.max(0, f.shake - dt); f.g.rotation.z = Math.sin(f.shake * 26) * .28 * Math.min(1, f.shake * 2); } else f.g.rotation.z = 0;
        f.pause -= dt;
        if (!f.target && f.pause <= 0 && f.shake <= 0) { for (let j = 0; j < 10; j++) { const t = c.moveAlong(f.dir, tangent(randDir(placeRng), f.dir), .8 + placeRng() * 1.3).normalize(); if (arc(t, f.home) < 4 && !faunaBlocked(t) && !trailPts.some(q => arc(t, q) < .55) && arc(t, STAGE.center) > 3.2) { f.target = t; break; } } f.pause = .4; }
        let lift = 0;
        if (f.target) {
          mv.copy(f.target).sub(f.dir); const h = tangent(mv, f.dir), next = c.moveAlong(f.dir, h, dt * f.speed).normalize();
          if (!faunaBlocked(next) && Math.abs(surfaceRadius(next) - surfaceRadius(f.dir)) < .45) { f.dir.copy(next); f.heading.copy(h); lift = Math.abs(Math.sin(time * 9 + f.home.x * 7)) * .05; if (arc(f.dir, f.target) < .12) { f.target = null; f.pause = 1.5 + placeRng() * 3; } }
          else { f.target = null; f.pause = .4; }
        }
        place(f.g, f.dir, f.heading, lift);
        if (f.shake > 0) f.g.rotation.z = Math.sin(f.shake * 26) * .28 * Math.min(1, f.shake * 2);
      }
      for (const bf of butterflies) {
        const near = arc(bf.home, playerDir) < 26; bf.g.visible = near; if (!near) continue;
        const a = time * .7 + bf.phase, off = c.moveAlong(bf.home, tangent(new T.Vector3(Math.cos(a), 0.3, Math.sin(a)), bf.home), .7 + .35 * Math.sin(time * .4 + bf.phase)).normalize();
        bf.g.position.copy(off).multiplyScalar(surfaceRadius(off) + .7 + Math.sin(time * 1.7 + bf.phase) * .18);
        orient(bf.g, off, tangent(new T.Vector3(-Math.sin(a), 0, Math.cos(a)), off)); bf.m.scale.set(1, .4 + Math.abs(Math.sin(time * 11 + bf.phase)), 1);
      }
    }
    // --- child feedback effects (cheap pooled cubes): dust puffs / petals when running, sparkle burst, wrong-answer wobble
    const FX_N=LOW_POWER?16:26,fx=[];
    const fxBox=roundedBox(T,.2);
    for(let i=0;i<FX_N;i++){
      const m=new T.Mesh(fxBox,new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0,depthWrite:false,fog:false}));
      m.visible=false;m.castShadow=false;root.add(m);fx.push({m,life:0,max:1,vel:new T.Vector3(),spin:0,grow:0,base:.12,grav:0});
    }
    let fxIdx=0,fxTimer=0,lastFxPos=null;
    function spawnFx(pos,up,vel,color,size,life,grow=1.4,grav=0,opacity=.7){
      const p=fx[fxIdx++%FX_N];p.m.visible=true;p.life=p.max=life;p.m.material.color.set(color);p.m.material.opacity=opacity;p.base=size;p.grow=grow;p.grav=grav;
      p.m.position.copy(pos);p.vel.copy(vel);p.spin=(placeRng()-.5)*6;p.m.scale.setScalar(size);p.up=up;p.o=opacity;
    }
    function updateFx(dt,time,player,moving,speedFactor) {
      fxTimer-=dt;
      if(moving&&fxTimer<=0&&player){
        fxTimer=speedFactor>1.2?.09:.16;
        const up=player.dir,right=tangent(new T.Vector3().crossVectors(player.heading,up),up),pos=player.obj.position.clone().addScaledVector(up,.06).addScaledVector(player.heading,-.28);
        const nearFlower=patches.some(p=>arc(p,player.dir)<1.7);
        const col=nearFlower&&placeRng()<.7?['#ef7f9f','#ffd35a','#fbb4c8'][Math.floor(placeRng()*3)]:'#f4e3c6';
        spawnFx(pos.addScaledVector(right,(placeRng()-.5)*.3),up,up.clone().multiplyScalar(.5+placeRng()*.4).addScaledVector(player.heading,-.25).addScaledVector(right,(placeRng()-.5)*.6),col,nearFlower?.10:.16,.8,nearFlower?.4:1.6,nearFlower?-.6:0,nearFlower?1:.7);
      }
      for(const p of fx){
        if(!p.m.visible)continue;p.life-=dt;if(p.life<=0){p.m.visible=false;continue;}
        const k=p.life/p.max;p.m.position.addScaledVector(p.vel,dt);p.vel.addScaledVector(p.up||Y_UP,p.grav*dt);p.m.rotation.y+=p.spin*dt;p.m.rotation.x+=p.spin*.5*dt;
        p.m.scale.setScalar(p.base*(1+(1-k)*p.grow));p.m.material.opacity=p.o*k;
      }
    }
    const Y_UP=new T.Vector3(0,1,0);
    // star / sparkle burst at a world position (correct answer)
    function sparkleBurst(worldPos) {
      const up=worldPos.clone().normalize();
      for(let i=0;i<FX_N;i++){
        const a=i/FX_N*Math.PI*2,sideV=tangent(new T.Vector3(Math.cos(a),.2,Math.sin(a)),up).multiplyScalar(1.6+placeRng()*1.1).addScaledVector(up,1.0+placeRng()*1.4);
        spawnFx(worldPos,up,sideV,['#fff3b0','#ffd35a','#ffffff','#ffc4e1'][i%4],.26+placeRng()*.16,1.1+placeRng()*.4,.6,-1.2,1);
      }
    }
    // wrong answer: nearest animal shakes its head; a few grey puffs
    function wrongFeedback(worldPos) {
      const d=worldPos.clone().normalize();let best=null,bd=99;
      for(const f of fauna){const a=arc(f.dir,d);if(a<bd){bd=a;best=f;}}
      if(best&&bd<14){best.shake=1.1;best.target=null;}
      for(let i=0;i<6;i++)spawnFx(worldPos,d,d.clone().multiplyScalar(.5+placeRng()*.4).add(randDir(placeRng).multiplyScalar(.3)),'#cfc8dc',.12,.7,1.5,0,.5);
    }
    // horizon / distance culling of tall props, snake segments and flora chunks
    function cull() {
      camDir.copy(skyGroup.position); if (camDir.lengthSq() < 1) return; const camLen = camDir.length(); camDir.divideScalar(camLen);
      const horizon = Math.acos(Math.min(.98, SURF / camLen));
      const flatLimit = Math.cos(horizon + CHUNK_RAD), tallLimit = Math.cos(Math.min(2.9, horizon + 1.0));
      for (const f of floraMeshes) f.mesh.visible = f.center.dot(camDir) > flatLimit;
      for (const g of scenery) g.visible = g.position.lengthSq() < 1 ? true : g.position.clone().normalize().dot(camDir) > tallLimit;
      for (const s of snakeMeshes) s.mesh.visible = Math.acos(Math.min(1, s.center.dot(camDir))) < Math.min(3.0, horizon + 1.15 + s.rad);
      head.group.visible = head.dir.dot(camDir) > tallLimit - .02;
    }
    const snapshot = () => ({ version: 's-world', radius: R, treeHeights: treeInfo.map(t => t.height), routeLength: routePoints.slice(1).reduce((sum, d, i) => sum + arc(routePoints[i], d), 0), answers: answerDirs.map(d => d.toArray()), snakeLength: spineLen, landmarks: Object.fromEntries(Object.entries(landmarks).map(([k, vv]) => [k, { position: vv.dir.toArray(), radius: vv.radius, height: vv.height, doorHeight: vv.doorHeight }])) });
    let cullTimer = 0;
    const duneRing = localSky.getObjectByName('s-distant-dunes');
    const dusk = { lights: [], fog: scene.fog ? scene.fog.color.clone() : null, fogNight: new T.Color('#8c6f9c'), sunNight: new T.Color('#ff9a6a') };
    scene.traverse(o => { if (o.isDirectionalLight || o.isHemisphereLight) dusk.lights.push({ o, i: o.intensity, c: o.color.clone() }); });
    const oldNight = habitat?.root?.children.find(o => o.children.length >= 30 && o.children[0].geometry?.type === 'OctahedronGeometry');
    // unlit backdrop (distant dunes, clouds, sky planets) is baked bright; tint it towards dusk lilac
    const duskTint = new T.Color('#6a5a9e'), backdrop = [];
    let backdropReady = false;
    function collectBackdrop() {
      const seen = new Set();
      for (const grp of [skyGroup, clouds]) grp.traverse(o => { if (o.isMesh && o.material && o.material.isMeshBasicMaterial && !seen.has(o.material)) { seen.add(o.material); backdrop.push({ m: o.material, c: o.material.color.clone() }); } });
      backdropReady = true;
    }
    let wakeAt = -1, nowT = 0;
    const smooth01 = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    function wake(instant) {
      if (instant) { wakeAt = -99; return Promise.resolve(); }
      wakeAt = nowT; return new Promise(r => setTimeout(r, 5200));
    }
    function updateWake(time) {
      const k = habitat?.weather ? habitat.weather.value : 0;
      if (oldNight) oldNight.visible = false;
      if (k > 0 && !backdropReady) collectBackdrop();
      for (const B of backdrop) B.m.color.copy(B.c).lerp(duskTint, k * .62);
      // dusk: deeper sky (shader), dimmer warmer light, lilac fog, stars come out
      for (const L of dusk.lights) { L.o.intensity = L.i * (1 - (L.o.isDirectionalLight ? .55 : .5) * k); if (L.o.isDirectionalLight) L.o.color.copy(L.c).lerp(dusk.sunNight, k * .7); }
      if (dusk.fog && scene.fog) scene.fog.color.copy(dusk.fog).lerp(dusk.fogNight, k * .85);
      nightStars.forEach(st => { st.material.opacity = .8 + .2 * k; st.material.size = 2.4 + 1.8 * k; });
      bigStars.forEach((st, i) => { st.visible = k > .05; st.material.opacity = k * (.7 + .3 * Math.sin(time * (2.2 + i) + i * 2)); });
      if (wakeAt === -1) return;
      const hd = head.group;
      if (wakeAt === -99) { snakeWake.wave.value = 2; hd.quaternion.copy(head.baseQ); hd.position.copy(head.basePos).addScaledVector(head.dir, .04 + Math.sin(time * 1.2) * .04); head.eyes.visible = true; head.zz.visible = false; return; }
      const t = time - wakeAt;
      // body: a lifting wave rolls from the tail to the head (2.8 s)
      snakeWake.wave.value = t < 3.2 ? 1.12 - t / 2.8 * 1.24 : 2;
      // head: rises, does a full roll ("turns over"), opens its eyes and settles a little higher
      head.zz.visible = t < .4;
      const u = smooth01(2.2, 4.6, t), lift = Math.sin(Math.min(1, Math.max(0, (t - 2.0) / 3)) * Math.PI) * .9 + .04 * smooth01(4.5, 5.5, t);
      const roll = u * Math.PI * 2, pivot = new T.Vector3(0, .62, -.2);
      const q = head.baseQ.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), roll));
      const wp = pivot.clone().applyQuaternion(head.baseQ).add(head.basePos);
      hd.quaternion.copy(q); hd.position.copy(wp).sub(pivot.clone().applyQuaternion(q)).addScaledVector(head.dir, lift);
      head.eyes.visible = t > 3.4;
      if (t > 6) wakeAt = -99;
    }
    function update(dt, time, state) {
      nowT = time; updateWake(time);
      oldBirds.forEach((g, i) => { const a = time * .045 + i * .22; g.position.set(Math.cos(a) * 23, R + 12 + i * .35, Math.sin(a) * 23); });
      waterMat.opacity = .84 + Math.sin(time * .9) * .025;
      ripples.forEach((m, i) => { const k = (time * .18 + i * .2) % 1; m.scale.setScalar(.5 + k * 3); m.material.opacity = (1 - k) * .28; });
      skyPlanets.forEach((m, i) => m.rotation.y += dt * (.015 + i * .003));
      window.YayaRound3Crystals?.tick(time, skyGroup.position);
      cullTimer -= dt; if (cullTimer <= 0) { cullTimer = .2; cull(); }
      if (state) { localSky.quaternion.slerp(skyQ.setFromUnitVectors(skyUp, state.dir), 1 - Math.exp(-Math.min(dt, .1) * 3)); }
      if (state && state.obj) { const pd = state.obj.position.distanceTo(skyGroup.position); floraNear.value.set(pd * .58, pd * .8); }
      if (state) { updateFauna(dt, time, state.dir); updateFx(dt, time, state.moving ? state : null, state.moving, state.speed || 1); }
    }
    const api = { root, routePoints, trailPts, answerDirs, sparkleBurst, wrongFeedback, propMap, fauna, landmarks, pond, pd: oasisD, ducks, trees: treeInfo, update, snapshot, snake: { head, spine, meshes: snakeMeshes, disks: snakeDisks, wake }, complete() { habitat?.complete(); }, createCrystal: (label, col) => window.YayaRound3.createCrystal(T, label, col) };
    return api;
  }
  window.YayaPlanetSWorld = { create };
})();
