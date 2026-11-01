/* T · 乌龟岛星球 (large world) — rounded-block art + scene.
   NEW FILE for the T planet (generated from tools/tp/*.js; mirrors planet-s-world.js). Loaded after round3-world.js / round3-crystals.js and before app.js.
   Mirrors the interface of YayaRound3.create(...) (routePoints, trailPts, answerDirs, sparkleBurst, wrongFeedback,
   update, snapshot, ...) so app.js can use it as the "round3" world of planet t01.
   All geometry is procedural; blocks are merged into a few vertex-coloured meshes (spatially chunked). */
(() => {
  'use strict';
  const roundedBox = (T, b) => window.YayaRound3.roundedBox(T, b);
  function create(c) {
    const { THREE: T, scene, skyGroup, clouds, planet, cells, STAGE, obstacles, props, registerProp, place,
      tangent, arc, surfaceRadius, rng, LOW_POWER, habitat, START_DIR, orient } = c;
    const R = c.R || 16, SURF = R + .7, root = new T.Group(); root.name = 't-large-world'; scene.add(root);
    const box = roundedBox(T), cube = new T.BoxGeometry(1, 1, 1);
    const color = new T.Color(), normalMatrix = new T.Matrix3(), v = new T.Vector3(), norm = new T.Vector3();
    const material = new T.MeshStandardMaterial({ vertexColors: true, roughness: .88, metalness: 0 });
    const softStyle = window.YayaTSoftArt?.enabled() ? YayaTSoftArt.createModels(T, LOW_POWER) : null;
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
    // the old habitat's wire tumbleweeds and heat-haze planes are replaced by the new scene
    habitat?.root.traverse(o => { if (o.isMesh && (o.material.wireframe || o.material.isShaderMaterial)) o.visible = false; });
    const oldMeadow = scene.getObjectByName('art-meadow-details'); if (oldMeadow) oldMeadow.visible = false;
    // T: the small-world island weather of round2-world (ocean ball, rain lines, small rainbow, floating bubbles) is replaced
    if (habitat) for (const ch of [...habitat.root.children]) {
      if (ch.isLineSegments || (ch.isMesh && ch.geometry.type === 'SphereGeometry' && Math.abs(ch.geometry.parameters.radius - 9.35) < .01) || (ch.isGroup && ch.children[0] && ch.children[0].geometry && ch.children[0].geometry.type === 'TorusGeometry')) habitat.root.remove(ch);
      else if (ch.isMesh && ch.geometry.type === 'IcosahedronGeometry' && Math.abs(ch.scale.x - .22) < .001) ch.visible = false;
    }
    if (c.orchard && c.orchard.basket && c.orchard.basket.group) c.orchard.basket.group.visible = false;   // old small plank dock
    // ---------------------------------------------------------------------------------------------
    // Layout. The whole sphere is the shell of a giant sleeping sea turtle. Seen from the spawn camera the stone stage is at
    // the top of the shell, the turtle's sleeping head rests on the far rim behind it (peeking over the horizon), the two front
    // flippers lie out to the left / right, the hind flippers and the small tail are on the back of the sphere.
    // Surface coordinates (x right, a away from the spawn camera); the camera horizon at spawn is at a ~ +4.
    const BLOCK = LOW_POWER ? .95 : .7;
    const HEAD_AT = [.4, 13.4], FLIP_AT = [[-10.4, 8.0], [11.6, 9.6]], HIND_AT = [[-11.2, -19.8], [11.2, -19.8]], TAIL_AT = [0, -24.0];
    // pond / pier / boat / the one house form a quiet cove on a small islet on the far side of the shell (~110 deg of arc from the spawn)
    const POND_AT = [-5.4, 36.4], POND_R = 2.8, HOUSE_AT = [1.0, 35.0], PIER_FROM = [-2.2, 34.0], PIER_TO = [-4.3, 35.4];
    // ---- land / sea layout: ~1/3 land (the turtle's shell island + 3 small islets), ~2/3 block sea on the sphere itself
    const DEG = Math.PI / 180;
    const ISLE_C = P(0, -5.5), ISLE_R0 = 18.0;
    const isleF = tangent(P(0, -4.5).sub(ISLE_C), ISLE_C), isleRt = new T.Vector3().crossVectors(isleF, ISLE_C).normalize();
    const coastR = th => ISLE_R0 * (1 + .05 * Math.sin(3 * th) + .04 * Math.sin(5 * th + .7));
    const bearingDir = th => isleF.clone().multiplyScalar(Math.cos(th)).addScaledVector(isleRt, Math.sin(th)).normalize();
    const atBearing = (th, m) => c.moveAlong(ISLE_C, bearingDir(th), m).normalize();
    const ISLETS = [
      { c: atBearing(-100 * DEG, 28.0), r: 4.2, name: 'west' },
      { c: atBearing(100 * DEG, 28.5), r: 4.0, name: 'east' },
      { c: P(-1.8, 35.8), r: 6.6, name: 'cove' },
    ];
    const mainLand = d => coastR(Math.atan2(d.dot(isleRt), d.dot(isleF))) - arc(d, ISLE_C);
    const landDist = d => { let m = mainLand(d); for (const s of ISLETS) m = Math.max(m, s.r - arc(d, s.c)); return m; };   // metres inside land (>0) / outside (<0)
    const DOCK_TH = -95 * DEG, boatRest = atBearing(DOCK_TH + 3.8 * DEG, coastR(DOCK_TH) + 1.9);
    // ---- sandy paths + the three answer-crystal places (route used for tests / crystals / the drawn path)
    const PATH_CTL = [[.6,-9.5],[-.4,-7.2],[-2.2,-5.6],[-3.9,-3.7]];
    const PATH_R = [[-.4,-7.2],[1.6,-5.8],[3.9,-3.7],[5.2,-2.0],[6.0,-.6]];
    const PATH_R2 = [[-3.9,-3.7],[-4.6,-2.9]];
    const mkCurve = pts => new T.CatmullRomCurve3(pts.map(([x, a]) => new T.Vector3(x, a, 0)), false, 'centripetal');
    const pathCurve = mkCurve(PATH_CTL);
    const routePoints = pathCurve.getPoints(60).map(p => P(p.x, p.y));
    const trailPts = [];
    for (const cv of [pathCurve, mkCurve(PATH_R), mkCurve(PATH_R2)]) {
      const pts = cv.getPoints(80).map(p => P(p.x, p.y));
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(arc(a, b) / .5)); for (let k = (trailPts.length ? 1 : 0); k <= n; k++) trailPts.push(a.clone().lerp(b, k / n).normalize()); }
    }
    const answerDirs = [P(-3.9, -3.7), P(3.9, -3.7), P(6.0, -.6)];
    // ---- T revision: the race track. A closed loop of sand bricks on the south half of the shell island (round the spawn camera,
    // in front of the stage). Everything is computed here once; the bricks / flags / finish arch are built further down and the
    // gameplay module (planet-t-race.js) reads api.raceTrack. Surface metres, true distances (azimuthal frame round LC).
    const RACE = (() => {
      const LC = P(0, -12.9), nf = tangent(P(0, -11.9).sub(LC), LC), east = new T.Vector3().crossVectors(nf, LC).normalize();
      const atUV = (u, vv) => { const m = Math.hypot(u, vv); return m < 1e-6 ? LC.clone() : c.moveAlong(LC, nf.clone().multiplyScalar(vv / m).addScaledVector(east, u / m), m).normalize(); };
      const TH0 = .52, N = 1440, dense = [], cum = [0];
      for (let i = 0; i <= N; i++) {
        const th = TH0 + Math.PI * 2 * i / N, rx = 11 + .8 * Math.sin(3 * th + 1), ry = 5.5 + .5 * Math.sin(2 * th + .3);
        dense.push(atUV(rx * Math.sin(th), .5 + ry * Math.cos(th))); if (i) cum.push(cum[i - 1] + arc(dense[i - 1], dense[i]));
      }
      const L = cum[N], M = Math.round(L / .4), ds = L / M, pts = []; let j = 0;
      for (let k = 0; k <= M; k++) { const s = k * ds; while (j < N - 1 && cum[j + 1] < s) j++; const t = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]); pts.push(dense[j].clone().lerp(dense[j + 1], Math.min(1, Math.max(0, t))).normalize()); }
      pts[M].copy(pts[0]);
      const fwd = k => tangent(pts[Math.min(M, k + 1)].clone().sub(pts[Math.max(0, k - 1)]), pts[k]);
      const left = k => new T.Vector3().crossVectors(pts[k], fwd(k)).normalize();
      const lat = (k, m) => c.moveAlong(pts[k], left(k), m).normalize();
      const forks = [.16, .29, .50, .68, .86].map((fr, i) => { const k = Math.round(fr * M); return { i, k, s: k * ds, center: pts[k].clone(), fwd: fwd(k), left: lat(k, 1.2), right: lat(k, -1.2) }; });
      const sleepK = Math.round(.38 * M);
      const cosNear = Math.cos(1.55 / SURF), cosFork = Math.cos(2.9 / SURF), cosBox = Math.cos(17 / SURF);
      const near = v2 => { if (v2.dot(LC) < cosBox) return false; for (let k = 0; k < M; k += 2) if (pts[k].dot(v2) > cosNear) return true; for (const f of forks) if (f.center.dot(v2) > cosFork) return true; return false; };
      return { LC, pts, M, ds, L, fwd, left, lat, forks, near, sleepK, treeDir: lat(sleepK, 3.6), rabbitDir: lat(sleepK, 2.0), start: pts[0].clone() };
    })();
    const inStageZone = d => { if (d.y < .15) return false; const [x, a] = XA(d); return Math.abs(x) < 3.05 && a > -2.7 && a < 5.1; };
    const tangentTo = (from, to) => tangent(to.clone().sub(from), from);
    // ---------------------------------------------------------------------------------------------
    // Ground colour: no checkerboard. The sphere is a turtle shell: large smooth scutes (olive / fresh greens) separated by
    // darker grooves, white-sand beaches around the stage clearing, the pond and the pier, a warm sand path. Colours come from
    // large-scale smooth fields; the per-block term is only a faint tint.
    const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    const groundColor = new T.Color(), cTmp2 = new T.Color();
    const scuteGreens = ['#8fbe69', '#6ca36a', '#a6ce75', '#77b477', '#96c77a', '#579369'].map(h => new T.Color(h));
    const cGroove = new T.Color('#73945c'), cSand = new T.Color('#f7ebc9'), cSand2 = new T.Color('#f1e0b5'), cPath = new T.Color('#efdcae'), cPath2 = new T.Color('#e9d4a2');
    const cUnder = new T.Color('#8bb862'), cRaceBed = new T.Color('#f6e9c8'), cRaceBed2 = new T.Color('#f0e0b6');
    // shell scutes: Voronoi cells on the sphere (Fibonacci seeds) -> border distance gives the grooves
    const SC_N = 36, scuteSeeds = [];
    for (let i = 0; i < SC_N; i++) { const yy = 1 - 2 * (i + .5) / SC_N, rad = Math.sqrt(1 - yy * yy), az = i * 2.399963 + .4; scuteSeeds.push(new T.Vector3(Math.cos(az) * rad, yy, Math.sin(az) * rad)); }
    const scuteInfo = new T.Vector3(); // x: nearest index, y: border distance (metres)
    function scuteAt(vv) {
      let b1 = -2, b2 = -2, i1 = 0;
      for (let i = 0; i < SC_N; i++) { const d = scuteSeeds[i].dot(vv); if (d > b1) { b2 = b1; b1 = d; i1 = i; } else if (d > b2) b2 = d; }
      const a1 = Math.acos(Math.min(1, b1)), a2 = Math.acos(Math.min(1, b2));
      return scuteInfo.set(i1, (a2 - a1) * SURF * .5, 0);
    }
    // sand zones: plaza around the stage front, the path network, the beach round the pond / pier
    const pondD = P(POND_AT[0], POND_AT[1]), pierMidD = P((PIER_FROM[0] + PIER_TO[0]) / 2, (PIER_FROM[1] + PIER_TO[1]) / 2);
    const plazaD = P(0, -5.2), cosPath = Math.cos(1.0 / SURF);
    // block sea: shallow aqua near the coast -> deeper blue-green offshore, a soft lavender-pink sunset tint, foam rim and faint wave streaks
    const seaDeep = new T.Color('#2f9dc2'), seaMid = new T.Color('#52bfd2'), seaShal = new T.Color('#9ae2da'), seaFoam = new T.Color('#f2fbf8'), seaTint = new T.Color('#d8b4e4');
    const SEA_DROP = 1.0, seaM = new T.Matrix4();
    function seaColor(out, x, y, z, ds) {
      out.copy(seaShal).lerp(seaMid, smooth(0, 3.2, ds)).lerp(seaDeep, smooth(3.2, 13, ds) * .85);
      const sw = Math.sin(x * .31 + y * .17) * Math.sin(z * .27 - y * .23) + Math.sin(x * .13 - z * .19);
      out.lerp(seaTint, .10 + .06 * sw);
      out.offsetHSL(0, 0, .03 * Math.sin(x * .8 + z * .6 + y * .5));
      if (Math.sin(x * 1.3 + z * .9) * Math.sin(y * 1.1 - x * .7 + z * .4) > .82) out.lerp(seaFoam, .35);
      const foam = (1 - smooth(.4, 1.8, ds)) * (.55 + .45 * Math.sin(x * 1.7 + y * 1.3 + z * 1.9));
      out.lerp(seaFoam, Math.max(0, foam) * .8);
    }
    const shellMask = new Float32Array(cells.length);
    const pathIdx = new Map();   // cell index -> 1 for road cells (kept for the placement code)
    const sandWeights = new Float32Array(cells.length);
    cells.forEach(([x, y, z], i) => {
      v.set(x, y, z).normalize();
      const ld = landDist(v);
      if (ld <= 0) {   // sea: the block sinks one step below the land and is tinted by depth
        seaColor(groundColor, x, y, z, -ld); groundColor.convertSRGBToLinear(); planet.setColorAt(i, groundColor);
        planet.setMatrixAt(i, seaM.makeTranslation(x - v.x * SEA_DROP, y - v.y * SEA_DROP, z - v.z * SEA_DROP)); return;
      }
      const sc = scuteAt(v), border = sc.y, id = sc.x;
      const wide = Math.sin(x * .13 - y * .17 + z * .15);
      groundColor.copy(scuteGreens[id % scuteGreens.length]).lerp(cTmp2.set('#a0c46a'), .18 + .14 * wide);
      groundColor.lerp(cGroove, 1 - smooth(.15, 1.0, border));
      // lower hemisphere (belly side) a little deeper
      groundColor.lerp(cUnder, smooth(-.1, -.7, v.y) * .45);
      // sand: plaza (ellipse in front of the stage), beach ring round the pond, strip along the pier
      const [px, pa] = XA(v);
      const plaza = v.y > .3 ? 1 - smooth(3.4, 5.6, Math.hypot(px / 1.05, (pa + 4.6) / .7)) : 0;
      const dp = arc(v, pondD), beach = 1 - smooth(POND_R + 1.2, POND_R + 3.0, dp);
      const dpier = arc(v, pierMidD), strip = 1 - smooth(2.6, 4.4, dpier);
      let sand = Math.max(plaza, beach, strip * .9, 1 - smooth(.3, 2.6, ld));
      if (inStageZone(v)) sand = Math.min(sand, .4);
      groundColor.lerp(cTmp2.copy(cSand).lerp(cSand2, .5 + .5 * Math.sin(x * .21 + z * .17)), sand * .92);
      let onPath = false; for (let k = 0; k < trailPts.length; k += 2) if (trailPts[k].dot(v) > cosPath && !inStageZone(v)) { onPath = true; break; }
      if (onPath) { const h = Math.abs(Math.sin(x * 12.99 + y * 78.23 + z * 37.72) * 43758.5) % 1; groundColor.copy(cPath).lerp(cPath2, h * .6).multiplyScalar(.985 + h * .03); pathIdx.set(i, 1); }
      if (RACE.near(v)) { const h2 = Math.abs(Math.sin(x * 12.99 + y * 78.23 + z * 37.72) * 43758.5) % 1; groundColor.copy(cRaceBed).lerp(cRaceBed2, h2 * .7); }   // T revision: race track cells (the only cells with r/g > 1.3)
      sandWeights[i] = Math.max(onPath ? .25 : 0, RACE.near(v) ? .38 : 0, beach * .95, strip * .8, 1 - smooth(.3, 2.6, ld));
      if(mainLand(v)>2&&!inStageZone(v)&&!onPath&&!RACE.near(v)){shellMask[i]=1;groundColor.lerp(cTmp2.set('#90b86f'),sand*.16);}
      groundColor.multiplyScalar(.97 + (Math.abs(Math.sin(x * 11.7 + y * 5.9 + z * 21.8)) - .5) * .03);
      groundColor.convertSRGBToLinear();
      planet.setColorAt(i, groundColor);
    }); planet.instanceColor.needsUpdate = true; planet.instanceMatrix.needsUpdate = true;
    planet.geometry.setAttribute('shellMask',new T.InstancedBufferAttribute(shellMask,1));
    {
      // soil on the cliff faces: the green-olive of the shell flank instead of the brown forest soil (keeps the voxel flank from banding)
      const mat = planet.material, prevCompile = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
      mat.onBeforeCompile = shader => {
        prevCompile(shader);
        shader.vertexShader='attribute float shellMask; varying float vShellMask;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvShellMask=shellMask;');
        shader.fragmentShader='varying float vShellMask;\n'+shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('vec3(0.66,0.48,0.25),vec3(0.88,0.74,0.48)', 'vec3(0.52,0.66,0.34),vec3(0.60,0.72,0.40)')
          .replace('vec3(0.64,0.265,0.092),vec3(0.88,0.43,0.17)', 'vec3(0.52,0.66,0.34),vec3(0.60,0.72,0.40)')
          .replace('(1.0 - 0.055 * edge)', '(1.0 - 0.02 * edge)')
          .replace('diffuseColor.rgb *= (0.96 + grain * 0.07)', `float roadish = step(1.28, diffuseColor.r / (diffuseColor.g + 0.001));
          vec3 ac = abs(vCell); vec2 buv = ac.x > ac.y && ac.x > ac.z ? vLocal.yz : (ac.y > ac.z ? vLocal.xz : vLocal.xy);
          float brow = floor((buv.y + 0.5) * 3.0), bx = fract((buv.x + 0.5) * 2.0 + brow * 0.5), by = fract((buv.y + 0.5) * 3.0);
          float mortar = 1.0 - step(0.05, bx) * step(bx, 0.95) * step(0.08, by) * step(by, 0.92);
          float btone = fract(sin(dot(vec3(floor((buv.x + 0.5) * 2.0 + brow * 0.5), brow, 0.0) + vCell, vec3(12.99, 78.23, 37.72))) * 43758.5);
          diffuseColor.rgb *= mix(1.0, mix(0.94 + btone * 0.1, 0.84, mortar), roadish * grass);
          vec3 shellDir=normalize(vCell);
          vec2 hp=vec2(dot(shellDir,vec3(${isleRt.x},${isleRt.y},${isleRt.z})),dot(shellDir,vec3(${isleF.x},${isleF.y},${isleF.z})))*${SURF.toFixed(4)}/7.2;
          vec2 hr=vec2(1.0,1.7320508),ha=mod(hp,hr)-hr*.5,hb=mod(hp-hr*.5,hr)-hr*.5;
          vec2 hv=abs(dot(ha,ha)<dot(hb,hb)?ha:hb);
          float hexEdge=max(hv.x,dot(hv,vec2(.5,.8660254)));
          float shellLine=smoothstep(.445,.475,hexEdge);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.23,.125,.065),shellLine*vShellMask*grass*.82);
          diffuseColor.rgb *= (0.96 + grain * 0.07)`);
      };
      mat.customProgramCacheKey = () => prevKey() + '-t-shell-voxel-v67'; mat.needsUpdate = true;
    }
    scene.fog = new T.Fog('#f2c3c6', 64, 215);
    // the sand is brighter than A's lawn (and the sea ring is unlit): pull the sun and sky light down a little so tops do not burn out to white
    const baseLights = [];   // T revision: remembered so the rain can dim them by ~30%
    scene.traverse(o => { if (o.isDirectionalLight) { o.intensity *= .82; baseLights.push([o, o.intensity]); } else if (o.isHemisphereLight) { o.intensity *= .88; baseLights.push([o, o.intensity]); } });
    const sky = skyGroup.children.find(o => o.isMesh && o.material.isShaderMaterial);
    if (sky) {
      // same magical-hour dome as planet A; the old desert "sunset" uniform still drives the finale (dusk deepens, stars brighten)
      sky.material.fragmentShader = `uniform float sunset; uniform float wet; varying vec3 vDir;
        void main(){vec3 d=normalize(vDir);float h=d.y;
        vec3 horizon=vec3(1.,.76,.55),mid=vec3(.97,.58,.66),zenith=vec3(.52,.34,.70),low=vec3(.90,.56,.64);
        vec3 c=mix(horizon,mid,smoothstep(-.02,.07,h));c=mix(c,zenith,smoothstep(.06,.30,h));
        c=mix(c,low,smoothstep(.0,-.55,h));
        vec3 sd=normalize(vec3(.20,.06,-1.));float s=max(0.,dot(d,sd));
        c+=vec3(1.,.62,.30)*pow(s,4.)*.22+vec3(1.,.85,.55)*pow(s,40.)*.22+vec3(1.,.96,.80)*pow(s,500.)*.3;
        float band=sin(d.x*9.+h*13.)*sin(h*21.-d.x*5.);c+=band*.012;
        c=mix(c,mix(vec3(.74,.72,.82),vec3(.50,.50,.69),smoothstep(-.02,.5,h)),clamp(wet,0.,1.)*.84);
        c=mix(c,c*vec3(.74,.58,.92)+vec3(.05,.0,.09),clamp(sunset,0.,1.)*.8);
        gl_FragColor=vec4(c,1.);}`;
      sky.material.needsUpdate = true;
    }
    skyGroup.children.filter(o => o.isPoints).forEach(o => { o.material.fog=false; o.material.opacity = .85; o.material.size = 2.2; });
    // Extra twinkling stars in the upper sky (small, fog-free points; stars sit high so they read against the purple).
    {
      const n=LOW_POWER?160:260,pos=new Float32Array(n*3);
      for(let i=0;i<n;i++){const az=rng()*Math.PI*2,el=(.02+rng()*.9)*Math.PI/2*(rng()<.85?1:.6),r=420;pos[i*3]=Math.sin(az)*Math.cos(el)*r;pos[i*3+1]=Math.sin(el)*r;pos[i*3+2]=-Math.cos(az)*Math.cos(el)*r;}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));
      const st=new T.Points(g,new T.PointsMaterial({color:'#fff3df',size:2.4,sizeAttenuation:false,transparent:true,opacity:.8,depthWrite:false,fog:false}));st.name='round4-stars';skyGroup.add(st);
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
    (habitat?.root.children||[]).filter(g=>g.isGroup&&Math.abs(g.position.length()-31)<1.6).forEach(g=>{if(softStyle){g.clear();g.add(softStyle.miniIsland());return;}g.traverse(o=>{
      if(!o.isMesh)return;const hex=o.material.color.getHexString(),map={bdadad:'#c98a5a',a1bc99:'#78bd4c','84a490':'#4d9b3f'};
      if(map[hex]){o.material=o.material.clone();o.material.color.set(map[hex]);}
    });});
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
    let seaRingMat = null;
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
    // Distant sea: stepped, block-built water layers in a ring round the horizon (sky-ring style, follows the player's
    // "up" like the horizon cloud ring). Far = pale periwinkle with a pink glow, near = teal; unlit vertex colours, no fog.
    {
      const layers = [   // top / amp / base are elevations in degrees below the horizon plane
        { dist: 236, top: -5.5, amp: 1.5, base: -52, top1: '#e9d6ec', side: '#c9bde4', n: 110, step: .45, seed: 11, f: [3, 7, 13] },
        { dist: 218, top: -10.5, amp: 1.4, base: -52, top1: '#b5dcee', side: '#8fc3e0', n: 96, step: .42, seed: 23, f: [4, 9, 17] },
        { dist: 200, top: -16, amp: 1.3, base: -52, top1: '#63c3d6', side: '#4aa9c4', n: 84, step: .4, seed: 37, f: [5, 11, 19] },
      ];
      const ringPos = [], ringNor = [], ringCol = [];
      const faceCols = { top: new T.Color(), side: new T.Color(), shade: new T.Color() };
      const tmpV = new T.Vector3();
      function pushBox(cx, cy, cz, sx, sy, sz, rotY, top, side) {
        faceCols.top.set(top); faceCols.side.set(side); faceCols.shade.copy(faceCols.side).multiplyScalar(.82);
        const cs = Math.cos(rotY), sn = Math.sin(rotY);
        const faces = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
        for (const [nx, ny, nz] of faces) {
          const u = nx ? [0,1,0] : [1,0,0], w = nx ? [0,0,1] : (ny ? [0,0,1] : [0,1,0]);
          const col = ny > 0 ? faceCols.top : (ny < 0 ? faceCols.shade : (nz ? faceCols.shade : (nx > 0 ? faceCols.side : faceCols.shade)));
          const corners = [[-1,-1],[1,-1],[1,1],[-1,1]];
          const P3 = corners.map(([p, q]) => [nx*.5 + u[0]*p*.5 + w[0]*q*.5, ny*.5 + u[1]*p*.5 + w[1]*q*.5, nz*.5 + u[2]*p*.5 + w[2]*q*.5]);
          for (const idx of [0,1,2,0,2,3]) {
            const [x, y, z] = P3[idx], X = x * sx, Y = y * sy, Z = z * sz;
            ringPos.push(cx + X * cs + Z * sn, cy + Y, cz - X * sn + Z * cs);
            const nX = nx * cs + nz * sn, nZ = -nx * sn + nz * cs; ringNor.push(nX, ny, nZ);
            { const sh = ny > 0 ? 1 : .8 + .2 * (y + .5); ringCol.push(col.r * sh, col.g * sh, col.b * sh); }
          }
        }
      }
      for (const L of layers) {
        const w = Math.PI * 2 * L.dist / L.n, hs = [], Y = deg => L.dist * Math.tan(deg * Math.PI / 180);
        for (let i = 0; i < L.n; i++) {
          const t = i / L.n * Math.PI * 2, h = .5 + .28 * Math.sin(t * L.f[0] + L.seed) + .17 * Math.sin(t * L.f[1] + L.seed * 2.1) + .1 * Math.sin(t * L.f[2] + L.seed * .7);
          hs.push(Y(L.top + Math.round(h * L.amp * 2 / L.step) * L.step * .5));
        }
        for (let i = 0; i < L.n;) {
          let j = i; while (j + 1 < L.n && Math.abs(hs[j + 1] - hs[i]) < .01) j++;
          const az = (i + j + 1) / 2 / L.n * Math.PI * 2, len = (j - i + 1) * w * 1.02, top = hs[i], bot = Y(L.base);
          pushBox(Math.cos(az) * L.dist, (top + bot) / 2, Math.sin(az) * L.dist, len, top - bot, w * 3.2, -az - Math.PI / 2, L.top1, L.side);
          i = j + 1;
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(ringPos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(ringNor, 3)); g.setAttribute('color', new T.Float32BufferAttribute(ringCol, 3));
      g.computeBoundingSphere();
      const ring = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false }));
      ring.name = 't-distant-sea'; ring.frustumCulled = false; localSky.add(ring); seaRingMat = ring.material;
    }
    // ---------------------------------------------------------------------------------------------
    // Approved voxel sea turtle: coherent stepped volumes, thin cream shell lip and flat paddles.
    // Only exposed cube faces are emitted; all static parts remain merged into the existing meshes.
    const putBig = (g, dir, fwd, lift = -.1) => { place(g, dir, fwd, lift); root.add(g); scenery.push(g); g.name = 'round3-tree'; return g; };
    const bigDisk = (dir, r, kind = 'turtle') => { const o = { dir: dir.clone().normalize(), r, kind }; obstacles.push(o); turtleDisks.push(o); return o; };
    const turtleDisks = [], turtleCube = new T.BoxGeometry(1,1,1).toNonIndexed();
    const skin = ['#568e83','#659b8b','#71a393','#4c827c'], ivory = '#dfd39a', lightIvory = '#eee0ac';
    function voxels(b, cells, pitch=1, yPitch=pitch) {
      const pa=[],na=[],ca=[],src=turtleCube.attributes.position,nrm=turtleCube.attributes.normal,col=new T.Color();
      const occupied=new Set(cells.map(q=>q.slice(0,3).join(',')));
      for(const [x,y,z,tint] of cells){
        col.set(tint);
        for(let f=0;f<6;f++){
          const o=f*6,nx=nrm.getX(o),ny=nrm.getY(o),nz=nrm.getZ(o);
          if(occupied.has([x+nx,y+ny,z+nz].join(',')))continue;
          const shade=ny>.5?1.07:ny<-.5?.82:nz<-.5?.91:1;
          for(let j=o;j<o+6;j++){pa.push((x+src.getX(j))*pitch,(y+src.getY(j))*yPitch,(z+src.getZ(j))*pitch);na.push(nx,ny,nz);ca.push(col.r*shade,col.g*shade,col.b*shade);}
        }
      }
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pa,3));geo.setAttribute('normal',new T.Float32BufferAttribute(na,3));geo.setAttribute('color',new T.Float32BufferAttribute(ca,3));
      b.add(geo,new T.Matrix4(),'#ffffff');geo.dispose();
    }
    const rimBatch=batch(),rimTransform=new T.Object3D(),rimN=LOW_POWER?72:92;
    for(let i=0;i<rimN;i++){
      const th=i/rimN*Math.PI*2,d=atBearing(th,coastR(th)+.40),out=tangent(bearingDir(th),d);
      rimTransform.position.copy(d).multiplyScalar(surfaceRadius(d)+.02);orient(rimTransform,d,out);rimTransform.scale.set(LOW_POWER?1.53:1.22,.72,1.64);rimTransform.updateMatrix();rimBatch.add(turtleCube,rimTransform.matrix,i%4===0?'#d9c78e':'#e8d8a0');
      rimTransform.position.addScaledVector(d,-.48);rimTransform.scale.set(LOW_POWER?1.56:1.25,.34,1.56);rimTransform.updateMatrix();rimBatch.add(turtleCube,rimTransform.matrix,'#a28d59');
    }
    const shellRim=rimBatch.mesh();shellRim.name='turtle-shell-rim';root.add(shellRim);
    const HEAD_LIFT = 1.4, HEAD_PITCH=.02, HEAD_PIVOT_Y=.5, head0 = {};
    const head = (() => {
      const hd=P(HEAD_AT[0],HEAD_AT[1]),headUp=ISLE_C.clone().lerp(hd,.24).normalize(),out=tangent(hd.clone().sub(ISLE_C),headUp);
      const g=new T.Group(),b=batch(),eb=batch(),ob=batch(),cells=[],unit=1.02;
      // Narrow horizontal neck, then one low broad head; the cap steps inward without breaking the face.
      for(let z=-5;z<=5;z++)for(let y=-1;y<=4;y++)for(let x=-3;x<=3;x++){
        let inside=false;
        if(z<0)inside=Math.abs(x)<=1&&y>=0&&y<=1;
        else if(y===-1)inside=Math.abs(x)<=2&&z>=1&&z<=4;
        else if(y<=2)inside=(z<5||Math.abs(x)<=2);
        else if(y===3)inside=Math.abs(x)<=2&&z<=4&&z>=0;
        else inside=Math.abs(x)<=1&&z>=1&&z<=3;
        if(!inside)continue;
        const belly=y<0||(y===0&&z>=0)||(z<0&&y===0);
        const patch=(Math.floor((x+3)/2)+Math.floor(z/3)+y)%4;
        cells.push([x,y,z,belly?(y<0?ivory:lightIvory):skin[(patch+4)%4]]);
      }
      voxels(b,cells,unit);
      // Shallow muzzle and one thin mouth line, not a row of tooth-like jaw cubes.
      b.block(0,.43,5.69,4.9,.18,.08,'#526b53',0,turtleCube);
      for(const k of [-1,1])b.block(k*.92,1.65,5.62,.32,.32,.12,'#324b43',0,turtleCube);
      // One eye at each front corner, shared by front and side views (never four eyes).
      for(const k of [-1,1]){
        ob.block(k*3.08,2.18,4.65,1.10,1.18,1.10,'#273a32',0,turtleCube);
        ob.block(k*3.03,2.47,5.25,.31,.31,.08,'#fff5d7',0,turtleCube);
        eb.block(k*3.08,2.05,4.65,1.10,.18,1.10,'#324b43',0,turtleCube);
      }
      const headRig=new T.Group(),headMesh=b.mesh(),eyesClosed=eb.mesh(),eyesOpen=ob.mesh();eyesOpen.visible=false;
      headMesh.name='turtle-voxel-head';headRig.position.set(0,HEAD_PIVOT_Y,-3.6);headRig.rotation.x=HEAD_PITCH;
      [headMesh,eyesClosed,eyesOpen].forEach(m=>{m.position.set(0,-HEAD_PIVOT_Y,3.6);headRig.add(m);});g.add(headRig);
      const zb=batch();const zz=(x,y,z,s)=>{zb.block(x,y+s,z,s,s*.22,s*.22,'#fff6e6',0,turtleCube);zb.block(x,y,z,s,s*.22,s*.22,'#fff6e6',0,turtleCube);for(let k=1;k<=3;k++)zb.block(x+s*(.3-k*.2),y+s*k*.25,z,s*.26,s*.22,s*.22,'#fff6e6',0,turtleCube);};
      zz(4.5,5.1,1.5,.8);zz(5.7,6.4,1.2,1.05);const zm=zb.mesh(new T.MeshBasicMaterial({vertexColors:true,fog:false}));zm.castShadow=false;g.add(zm);head0.zz=zm;
      g.children.forEach(ch=>ch.position.y+=HEAD_LIFT);g.scale.setScalar(1.18);putBig(g,hd,out,-.2);orient(g,headUp,out);
      // Keep the original gameplay safety disks; the outward muzzle does not intrude on a route.
      const inward=tangentTo(hd,START_DIR);for(const [dz,r]of [[-3.6,4.5],[.4,4.6],[4.2,3.6]])bigDisk(c.moveAlong(hd,inward,dz),r);
      landmarks.turtleHead={dir:hd.clone(),radius:4.4,object:g};
      return {group:g,dir:hd,fwd:out,up:headUp,rig:headRig,eyesClosed,eyesOpen,get zz(){return head0.zz;}};
    })();
    function flipper(len,wid,thick,seed){
      const g=new T.Group(),inner=new T.Group(),b=batch(),cells=[],step=LOW_POWER?1.05:.8,rows=Math.round(len/step);
      for(let z=0;z<=rows;z++){
        const t=z/rows,half=Math.max(0,Math.floor(wid*(.85+2.75*Math.pow(Math.sin(Math.PI*t),.85))/step));
        for(let x=-half;x<=half;x++)for(let y=0;y<=1;y++){
          const edge=Math.abs(x)===half||z===rows;
          const tint=y===0?ivory:edge?'#8fb4a0':skin[(Math.floor((x+5)/2)+Math.floor(z/3)+seed)%4];
          cells.push([x,y,z,tint]);
        }
      }
      voxels(b,cells,step,thick*.42);inner.add(b.mesh());inner.rotation.x=-.12;inner.position.y=.12;g.add(inner);return g;
    }
    const sideDir=(d,fa,back)=>{const lat=tangent(d.clone().sub(P(0,fa)),d),toS=tangentTo(d,START_DIR);return lat.multiplyScalar(1).addScaledVector(toS,back).normalize();};
    const flippers=[];
    FLIP_AT.forEach(([fx,fa],i)=>{
      const d=P(fx,fa),out=sideDir(d,fa,.5),g=flipper(9.6,1.0,.9,500+i);putBig(g,d,out,-.2);const finUp=ISLE_C.clone().lerp(d,.25).normalize();orient(g,finUp,tangent(out,finUp));flippers.push({group:g,dir:d});
      for(const [dz,r]of [[1.4,2.5],[4.0,2.0],[6.6,1.7]])bigDisk(c.moveAlong(d,out,dz),r);landmarks['frontFlipper'+i]={dir:d.clone(),radius:3,object:g};
    });
    HIND_AT.forEach(([fx,fa],i)=>{
      const d=P(fx,fa),out=sideDir(d,fa,-.35),g=flipper(6.2,.85,.8,700+i);putBig(g,d,out,-.2);const finUp=ISLE_C.clone().lerp(d,.25).normalize();orient(g,finUp,tangent(out,finUp));flippers.push({group:g,dir:d});
      for(const [dz,r]of [[1.2,2.0],[3.4,1.6]])bigDisk(c.moveAlong(d,out,dz),r);landmarks['hindFlipper'+i]={dir:d.clone(),radius:2.5,object:g};
    });
    {
      const d=P(TAIL_AT[0],TAIL_AT[1]),out=tangentTo(d,P(0,TAIL_AT[1]-8)),g=new T.Group(),b=batch(),cells=[];
      for(let z=0;z<5;z++)for(let x=-Math.max(0,1-Math.floor(z/3));x<=Math.max(0,1-Math.floor(z/3));x++)cells.push([x,0,z,z===4?ivory:'#659b8b']);
      voxels(b,cells,.85,.62);g.add(b.mesh());putBig(g,d,out,-.15);const finUp=ISLE_C.clone().lerp(d,.25).normalize();orient(g,finUp,tangent(out,finUp));flippers.push({group:g,dir:d});
      bigDisk(c.moveAlong(d,out,1.0),1.9);bigDisk(c.moveAlong(d,out,3.4),1.2);landmarks.tail={dir:d.clone(),radius:2,object:g};
    }
    turtleCube.dispose();
    // ---------------------------------------------------------------------------------------------
    // Models: coconut palms, round trees, the one blue-roofed house, wooden pier, sailboat, sleeping bunny, mushrooms, shells.
    const placeMatrix = new T.Object3D();
    const palmGreens = ['#3fae5a', '#35a152', '#4fc06b', '#3a9a56'];
    function palm(height, seed) {
      if (softStyle) return softStyle.tree(height, seed);
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
    function roundTree(h, seed) {
      if (softStyle) return softStyle.tree(h, seed);
      const g = new T.Group(), b = batch(), rr = mk(seed), k = h / 6.0;
      for (let i = 0; i < 5; i++) b.block((rr() - .5) * .08, .36 + i * .62, 0, .78 - i * .04, .66, .78 - i * .04, i % 2 ? '#8d6a46' : '#9b7650', i * .1, soft);
      voxelBlob(b, [[0, 4.1, 0, 2.2, 1.6, 2.2], [.8, 3.4, .6, 1.5, 1.2, 1.5], [-.7, 4.9, -.3, 1.3, 1.1, 1.3]], LOW_POWER ? .95 : .7, LOW_POWER ? 1.15 : .84, ['#4c9d4a', '#58aa52', '#43923f', '#62b45a'], rr, 1.02);
      g.add(b.mesh()); g.scale.setScalar(k); return g;
    }
    function house() {
      const g = new T.Group(), b = batch(), rr = mk(2468);
      const W = 5.0, D = 4.1, WH = 3.0, y0 = .5;
      const stone = ['#cdbb9c', '#bfae90', '#d6c6a8'], plaster = ['#f3e6ca', '#eddcbc', '#f6ebd2'], wood = '#8d5e3b', tiles = ['#4f6ec4', '#5b7ad2', '#445fae', '#5470c8'];
      b.block(0, .27, 0, W + .4, .55, D + .4, stone[0], 0, chunk);
      for (let r = 0; r < 3; r++) b.block(0, y0 + .5 + r * 1.0, 0, W, 1.0, D, plaster[r % 3], 0, chunk);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.block(sx * W / 2, y0 + WH / 2, sz * D / 2, .34, WH + .1, .34, wood, 0, chunk);
      for (const x of [-1.25, 1.25]) b.block(x, y0 + WH / 2, D / 2 + .02, .24, WH, .22, wood, 0, soft);
      b.block(0, y0 + 2.0, D / 2 + .02, W, .24, .22, wood, 0, soft);
      // door (left of centre) with arched top, step and handle
      b.block(-.9, y0 + .95, D / 2 + .08, 1.15, 1.7, .22, '#7b4d30', 0, chunk); b.block(-.9, y0 + 1.85, D / 2 + .08, .95, .35, .22, '#7b4d30', 0, soft);
      b.block(-.62, y0 + .95, D / 2 + .22, .14, .14, .12, '#f1c64a', 0, soft); b.block(-.9, .22, D / 2 + .55, 1.7, .22, .7, stone[1], 0, chunk);
      // windows with frames, glass, mullions and flower boxes
      for (const [x, y] of [[1.55, y0 + 1.3], [-2.3, y0 + 1.3], [2.5, y0 + 2.45]]) {
        if (y > y0 + 2) continue;
        b.block(x, y, D / 2 + .06, 1.0, 1.0, .2, '#f7f1e4', 0, soft); b.block(x, y, D / 2 + .12, .74, .74, .2, '#7fb0d4', 0, soft);
        b.block(x, y, D / 2 + .22, .08, .78, .08, '#f7f1e4', 0, cube); b.block(x, y, D / 2 + .22, .78, .08, .08, '#f7f1e4', 0, cube);
        b.block(x, y - .65, D / 2 + .22, 1.1, .26, .34, wood, 0, soft);
        for (let k = 0; k < 3; k++) b.block(x - .36 + k * .36, y - .44, D / 2 + .25, .26, .24, .26, ['#f08bb0', '#b07ad8', '#ffb05a'][k], 0, soft);
      }
      b.block(W / 2 + .06, y0 + 1.4, .3, .2, .95, .95, '#f7f1e4', 0, soft); b.block(W / 2 + .12, y0 + 1.4, .3, .2, .72, .72, '#7fb0d4', 0, soft);
      // stepped gable roof of blue tiles, plaster gable ends with a timber trim
      const rows = 5, rh = .64;
      for (let r = 0; r < rows; r++) {
        const half = W / 2 + .6 - r * .62, y = y0 + WH + .32 + r * rh;
        for (let s = 0; s < 5; s++) { const z = -D / 2 + .3 + s * ((D - .6) / 4); b.block(0, y, z, half * 2, rh * 1.02, (D - .6) / 4 + .12, tiles[(r + s) % 4], 0, chunk); }
        for (const sz of [-1, 1]) b.block(0, y, sz * (D / 2 - .02), half * 2 - .4, rh, .34, plaster[r % 3], 0, soft);
      }
      b.block(0, y0 + WH + .32 + rows * rh - .1, 0, .7, .3, D - .2, '#3f58a4', 0, chunk);
      for (const sz of [-1, 1]) for (const sx of [-1, 1]) b.block(sx * (W / 2 + .25), y0 + WH + .75, sz * (D / 2 - .1), .22, 1.3, .24, wood, sx * .0, soft);
      // chimney
      for (let i = 0; i < 4; i++) b.block(1.4, y0 + WH + 1.4 + i * .66, -.8, .78, .68, .78, i % 2 ? '#b5593f' : '#c6684a', 0, chunk);
      b.block(1.4, y0 + WH + 1.4 + 4 * .66, -.8, .98, .22, .98, '#8d4a35', 0, soft);
      g.add(b.mesh()); return g;
    }
    function pier(len = 5.4) {
      const g = new T.Group(), b = batch(), rr = mk(77), n = Math.round(len / .36);
      for (let i = 0; i < n; i++) b.block((rr() - .5) * .05, .3, i * .36, 1.35, .15, .33, i % 2 ? '#b98a5e' : '#a87a52', 0, soft);
      for (const sx of [-1, 1]) b.block(sx * .62, .22, len / 2, .14, .1, len, '#8d6240', 0, soft);
      for (const z of [.25, len * .34, len * .67, len - .2]) for (const sx of [-1, 1]) b.block(sx * .66, -.15, z, .28, 1.05, .28, '#7a5436', 0, soft);
      for (const z of [len - .2]) for (const sx of [-1, 1]) b.block(sx * .66, .62, z, .3, .3, .3, '#c7a175', 0, soft);
      g.add(b.mesh()); return g;
    }
    function boat() {
      const g = new T.Group(), b = batch();
      b.block(0, .2, 0, .85, .3, 1.9, '#8a5a3a', 0, soft); b.block(0, .46, -.05, 1.1, .3, 2.2, '#a96f45', 0, soft); b.block(0, .68, -.05, 1.2, .16, 2.3, '#c98f58', 0, soft);
      b.block(0, .4, 1.2, .6, .34, .6, '#a96f45', 0, soft); b.block(0, .58, 1.5, .34, .3, .4, '#c98f58', 0, soft); b.block(0, .56, -1.25, .9, .36, .4, '#8a5a3a', 0, soft);
      b.block(0, 1.95, .1, .13, 2.5, .13, '#6f4a30', 0, soft);
      for (let i = 0; i < 7; i++) { const w = 1.35 - i * .18; b.block(w / 2 + .1, 1.0 + i * .31, .05, w, .31, .12, i % 2 ? '#fbf1d8' : '#f6e8c8', 0, soft); }
      b.block(-.45, 1.3, .42, .62, .52, .1, '#f1dcb6', 0, soft);
      b.block(.2, 3.28, .1, .5, .24, .1, '#ea5f4c', 0, soft);
      g.add(b.mesh()); return g;
    }
    // sleeping bunny: a cream block bunny curled up, long ears flopped over its back, closed smiling eyes, little "z"
    function sleepBunny() {
      const g = new T.Group(), b = batch(), cream = '#f7eddc', cream2 = '#efe0c8', pink = '#f2a7a8';
      b.block(0, .46, 0, .98, .74, 1.3, cream, 0, soft); b.block(0, .24, .05, .86, .3, 1.1, cream2, 0, soft);
      b.block(0, .52, .86, .82, .68, .7, cream, 0, soft);
      for (const sx of [-1, 1]) { b.block(sx * .3, .98, .1, .26, .14, .95, cream, sx * .12, soft); b.block(sx * .3, 1.06, .15, .14, .1, .75, pink, sx * .12, soft); }
      b.block(0, .56, 1.21, .22, .16, .1, '#e98d98', 0, soft);
      for (const sx of [-1, 1]) { b.block(sx * .22, .66, 1.22, .22, .06, .06, '#4a3a38', 0, cube); b.block(sx * .36, .46, 1.18, .18, .14, .1, pink, 0, soft); }
      b.block(0, .36, -.78, .42, .42, .4, '#ffffff', 0, soft);
      for (const sx of [-1, 1]) b.block(sx * .3, .13, 1.0, .2, .2, .36, cream2, 0, soft);
      const zz = (x, y, z, s) => { b.block(x, y + s, z, s, s * .22, s * .22, '#fff6e6', 0, soft); b.block(x, y, z, s, s * .22, s * .22, '#fff6e6', 0, soft); for (let k = 1; k <= 3; k++) b.block(x + s * (.3 - k * .2), y + s * k * .25, z, s * .26, s * .22, s * .22, '#fff6e6', 0, soft); };
      zz(.9, 1.6, 1.1, .34); zz(1.3, 2.1, 1.1, .46);
      g.add(b.mesh()); g.scale.setScalar(1.05); return g;
    }
    // T revision: the racing bunny asleep under the tree — lying on its side, closed smiling eyes, big bobbing block "Z z" above its head (userData.zz)
    function raceSleepBunny() {
      const g = new T.Group(), b = batch(), cream = '#f7eddc', cream2 = '#efe0c8', pink = '#f2a7a8';
      b.block(0, .46, 0, .98, .74, 1.3, cream, 0, soft); b.block(0, .24, .05, .86, .3, 1.1, cream2, 0, soft);
      b.block(0, .52, .86, .82, .68, .7, cream, 0, soft);
      for (const sx of [-1, 1]) { b.block(sx * .3, .98, .1, .26, .14, .95, cream, sx * .12, soft); b.block(sx * .3, 1.06, .15, .14, .1, .75, pink, sx * .12, soft); }
      b.block(0, .56, 1.21, .22, .16, .1, '#e98d98', 0, soft);
      for (const sx of [-1, 1]) { b.block(sx * .22, .66, 1.22, .22, .06, .06, '#4a3a38', 0, cube); b.block(sx * .36, .46, 1.18, .18, .14, .1, pink, 0, soft); }
      b.block(0, .36, -.78, .42, .42, .4, '#ffffff', 0, soft);
      for (const sx of [-1, 1]) b.block(sx * .3, .13, 1.0, .2, .2, .36, cream2, 0, soft);
      const body = new T.Group(); body.add(b.mesh()); body.rotation.z = -1.3; body.position.set(-.5, .62, -.2); g.add(body);   // on its right flank
      const zb = batch(), zc = '#fffdf2', zo = '#8f86c8';
      const Z = (x, y, s) => {
        for (const [c, g2, z0] of [[zo, .09, -.1], [zc, 0, 0]]) {
          const t = s * .3 + g2;
          zb.block(x, y + s * .5, z0, s + g2, t, t, c, 0, soft); zb.block(x, y - s * .5, z0, s + g2, t, t, c, 0, soft);
          for (let k = -1; k <= 1; k++) zb.block(x + k * s * .27, y + k * s * .24, z0, s * .34 + g2, s * .3 + g2, t, c, 0, soft);
        }
      };
      Z(-.35, 0, .52); Z(.35, .85, .78);
      const zz = new T.Group(); zz.add(zb.mesh(new T.MeshBasicMaterial({ vertexColors: true, fog: false })));
      zz.position.set(0, 2.3, .9); zz.userData.baseY = 2.3; g.add(zz); g.userData.zz = zz;
      g.scale.setScalar(1.05); return g;
    }
    function mushroom(capCol, spotCol, s = 1) {
      const b = batch();
      b.block(0, .28 * s, 0, .22 * s, .56 * s, .22 * s, '#f4e8cf', 0, soft);
      b.block(0, .62 * s, 0, .86 * s, .26 * s, .86 * s, capCol, 0, soft); b.block(0, .84 * s, 0, .56 * s, .2 * s, .56 * s, capCol, 0, soft);
      for (const [x, z] of [[.2, .1], [-.18, .2], [.0, -.22]]) b.block(x * s, .98 * s, z * s, .15 * s, .06 * s, .15 * s, spotCol, 0, cube);
      return b;
    }
    function shellModel(col1, col2) {
      const b = batch();
      for (let k = 0; k < 5; k++) { const a = (k - 2) * .42; b.block(Math.sin(a) * .2, .1, Math.cos(a) * .2 + .05, .17, .13, .42, k % 2 ? col1 : col2, -a, soft); }
      b.block(0, .1, -.05, .22, .14, .2, col1, 0, soft); return b;
    }
    function starfish() {
      const b = batch();
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; b.block(Math.sin(a) * .26, .07, Math.cos(a) * .26, .17, .12, .4, '#f2a35d', -a, soft); }
      b.block(0, .09, 0, .3, .14, .3, '#f6b878', 0, soft); return b;
    }
    // ---------------------------------------------------------------------------------------------
    // Stone stage: lighten it a little so it sits on the sand (same geometry, tinted)
    STAGE.group.traverse(o => { if (o.isMesh && o.material && o.material.map && o.material.color) o.material.color.set('#f6ead6'); });
    // ---- the pond (block water tiles, sandy rim) with a basin cut into the ground blocks

    const pond = new T.Group(); place(pond, pondD, STAGE.front, .06); root.add(pond);
    obstacles.push({ dir: pondD, r: POND_R, kind: 'pond', obj: pond }); landmarks.pond = { dir: pondD, radius: POND_R, object: pond };
    const basinMatrix = new T.Matrix4(), basinPoint = new T.Vector3();
    cells.forEach(([x, y, z], i) => { basinPoint.set(x, y, z); if (arc(basinPoint.clone().normalize(), pondD) < POND_R - .2) { basinPoint.addScaledVector(pondD, -3.0); basinMatrix.makeTranslation(basinPoint.x, basinPoint.y, basinPoint.z); planet.setMatrixAt(i, basinMatrix); } });
    planet.instanceMatrix.needsUpdate = true;
    const waterMat = new T.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .25, metalness: .05 });
    {
      const wb = batch(), pondTint = new T.Color(), rr = mk(555), st = LOW_POWER ? .62 : .5, pal = ['#45b3d0', '#52bdd8', '#3da7c8', '#63c9df', '#4ab8d4'];
      for (let x = -POND_R; x <= POND_R; x += st) for (let z = -POND_R; z <= POND_R; z += st) {
        const rad = Math.hypot(x, z); if (rad > POND_R - .12) continue;
        const k = 1 - rad / POND_R, pick = pal[Math.floor(rr() * pal.length)]; color.set(pick); color.lerp(pondTint.set('#9fe3ee'), Math.max(0, .35 - rad / POND_R * .35) * .6 + (rr() < .07 ? .35 : 0));
        wb.block(x, .16, z, st * 1.02, .1, st * 1.02, '#' + color.getHexString(), 0, soft);
      }
      const wm = wb.mesh(waterMat); wm.castShadow = false; wm.receiveShadow = true; pond.add(wm);
      const rim = batch(), rrr = mk(31), n = Math.round(2 * Math.PI * (POND_R + .15) / .62);
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; rim.block(Math.cos(a) * (POND_R + .1), .12, Math.sin(a) * (POND_R + .1), .56 + rrr() * .14, .26 + rrr() * .1, .6, ['#ecd9ab', '#e5cf9c', '#f1e2bc', '#d9c48f'][i % 4], a, soft); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + .4, sx=.55 + rrr() * .25, sy=.42 + rrr() * .2, sz=.5 + rrr() * .2;
        if(softStyle){const m=new T.Matrix4().compose(new T.Vector3(Math.cos(a)*(POND_R+.35),.31,Math.sin(a)*(POND_R+.35)),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a),new T.Vector3(sx,sy,sz));rim.add(softStyle.rockGeometry(i),m,['#8c9389','#adb0a0','#788778'][i%3]);}
        else rim.block(Math.cos(a) * (POND_R + .35), .26, Math.sin(a) * (POND_R + .35), sx,sy,sz, ['#c9c2b4', '#b9b3a6', '#d6cfc0'][i % 3], a, soft); }
      pond.add(rim.mesh());
    }
    const ripples = [];
    for (let i = 0; i < 5; i++) { const m = new T.Mesh(new T.RingGeometry(.21, .23, 24), new T.MeshBasicMaterial({ color: '#e8fbff', transparent: true, opacity: .35, side: T.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set((rng() - .5) * POND_R * 1.4, .235, (rng() - .5) * POND_R * 1.4); pond.add(m); ripples.push(m); }
    for (let i = 0; i < 5; i++) { const m = new T.Mesh(new T.CircleGeometry(.3, 12, 0, Math.PI * 1.85), new T.MeshStandardMaterial({ color: '#6dbb74', side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.rotation.z = i; m.position.set(1.0 + i * .22 - .3, .225, -1.3 + Math.sin(i * 2) * .7); pond.add(m); }
    const ducks = [];   // (kept for interface parity with the A world)
    const placed = [];
    const kindOf = o => o.kind === 'turtle' ? 'turtle' : o.kind === 'house' || o.kind === 'building' ? 'building' : o.kind === 'tree' ? 'tree' : o.kind === 'pond' ? 'pond' : o.kind === 'rock' ? 'rock' : o.kind === 'bush' ? 'bush' : 'other';
    function addPalm(x, a, h, seed) { const d = P(x, a), g = palm(h, seed); g.name = 'round3-tree'; register(g, d, .6, 'tree'); treeInfo.push({ dir: d, height: h }); placed.push({ dir: d, r: .9, kind: 'tree' }); return d; }
    // the one house: door towards the spawn camera, behind / beside the pond
    const houseD = P(HOUSE_AT[0], HOUSE_AT[1]), houseG = house(); houseG.name = 'round3-tree'; houseG.scale.setScalar(1.0);
    { const fwd = tangentTo(houseD, P(POND_AT[0], POND_AT[1] - 1.5)); place(houseG, houseD, fwd, -.1); root.add(houseG); scenery.push(houseG);
      obstacles.push({ dir: houseD, r: 3.2, kind: 'house' }); landmarks.house = { dir: houseD, radius: 3.2, height: 7.4, object: houseG }; }
    // pier running from the sand into the pond, and a tiny sailboat moored beside its end
    const pierFrom = P(PIER_FROM[0], PIER_FROM[1]), pierTo = P(PIER_TO[0], PIER_TO[1]), pierLen = arc(pierFrom, pierTo);
    const pierG = pier(pierLen + .2); pierG.name = 'round3-tree';
    place(pierG, pierFrom, tangentTo(pierFrom, pierTo), .05); root.add(pierG); scenery.push(pierG); landmarks.pier = { dir: pierFrom.clone(), radius: 2, object: pierG };
    const boatD = c.moveAlong(pondD, tangent(new T.Vector3(1, 0, -.4), pondD), .4).normalize(), boatG = boat(); boatG.name = 'round3-tree'; boatG.scale.setScalar(1.15);
    { const bd = P(POND_AT[0] - .5, POND_AT[1] + 1.2); place(boatG, bd, tangentTo(bd, P(POND_AT[0] - 3, POND_AT[1] + 4)), .26); root.add(boatG); scenery.push(boatG); landmarks.boat = { dir: bd.clone(), radius: 1.2, object: boatG }; }
    // sleeping bunny on the sand beside the stage steps (kept clear of the path and the crystals)
    const bunnyD = P(-3.7, -.9), bunnyG = sleepBunny(); bunnyG.name = 'round3-tree';
    place(bunnyG, bunnyD, tangentTo(bunnyD, P(-2, -30)), 0); root.add(bunnyG); scenery.push(bunnyG); obstacles.push({ dir: bunnyD, r: .8, kind: 'rock' }); landmarks.bunny = { dir: bunnyD.clone(), radius: .8, object: bunnyG };
    // T revision: the tree where the rabbit falls asleep during the race (on the outer side of the track, between fork 2 and fork 3)
    { const g = roundTree(5.2, 9100); g.name = 'round3-tree'; register(g, RACE.treeDir, .9, 'tree'); treeInfo.push({ dir: RACE.treeDir, height: 5.2 }); landmarks.raceTree = { dir: RACE.treeDir.clone(), radius: 1.2, object: g }; }
    obstacles.forEach(o => placed.push({ dir: o.dir, r: o.r, kind: kindOf(o) }));
    answerDirs.forEach(d => placed.push({ dir: d, r: 1.2, kind: 'crystal' }));
    // T revision: keep every scattered prop off the race track and its fork pads
    for (let k = 0; k < RACE.M; k += 3) placed.push({ dir: RACE.pts[k], r: 1.9, kind: 'track' });
    for (const f of RACE.forks) for (const off of [-2.6, 0, 2.6]) placed.push({ dir: c.moveAlong(f.center, f.fwd, off).normalize(), r: 3.2, kind: 'track' });
    placed.push({ dir: RACE.rabbitDir, r: 1.4, kind: 'track' });
    const MIN = {
      tree: { tree: 6.4, building: 6.6, pond: 4.0, crystal: 4.4, bush: 3.2, flower: 1.9, turtle: 1.2, rock: 2.6, other: 3.0 },
      bush: { tree: 3.2, building: 4.0, pond: 2.6, crystal: 3.0, bush: 3.4, flower: 1.5, turtle: .8, rock: 2.0, other: 2.2 },
      flower: { tree: 1.9, building: 3.0, pond: 1.8, crystal: 2.4, bush: 1.5, flower: 2.3, turtle: .5, rock: 1.2, other: 1.5 },
      rock: { tree: 2.4, building: 3.0, pond: 1.6, crystal: 2.4, bush: 1.8, flower: 1.2, turtle: .5, rock: 3.0, other: 1.5 },
    };
    const CAM0 = P(0, -12.9);   // where the spawn camera sits: no tall props there
    function fits(d, kind, r, corridor = 0, opt = {}) {
      if (landDist(d) < (kind === 'tree' ? 2.4 : kind === 'bush' ? 1.2 : .8)) return false;   // props only on land (palms a little way from the water)
      if (kind === 'tree') { if (arc(d, CAM0) < 10.5) return false; const [fx, fa] = XA(d); if (d.y > -.2 && fa < 15 && Math.abs(fx) < 17) return false; }
      if ((kind === 'bush' || kind === 'flower') && d.y > 0) { const [fx, fa] = XA(d); if (fa > -14 && fa < 10 && Math.abs(fx) > 6.5 && Math.abs(fx) < 17) return false; }   // big leaning props off the screen edges beside the spawn
      if (opt.nearOk !== true) { if (arc(d, STAGE.center) < (opt.stage || (kind === 'tree' ? 6.0 : 4.4))) return false; if (arc(d, START_DIR) < (kind === 'tree' ? 3.6 : 2.4)) return false; }
      for (const p of placed) { const need = Math.max(r + p.r + .3, (MIN[kind] && MIN[kind][p.kind]) || 0); if (arc(d, p.dir) < need) return false; }
      if (corridor) for (const t of trailPts) if (arc(d, t) < corridor) return false;
      return true;
    }
    const randDir = rr => { for (;;) { const v2 = new T.Vector3(rr() * 2 - 1, rr() * 2 - 1, rr() * 2 - 1), l = v2.length(); if (l > .1 && l < 1) return v2.divideScalar(l); } };
    const placeRng = mk(90210);
    // best-candidate sampling: of K random candidates that satisfy the rules take the one farthest from everything placed,
    // which spreads props evenly over the whole sphere (no clumps); `bias` can prefer directions near a point
    function bestPlace(rr, kind, r, corridor, opt = {}, K = 28) {
      let best = null, bs = -1e9;
      for (let k = 0; k < K * 6 && k < 400; k++) {
        const d = randDir(rr); if (opt.ok && !opt.ok(d)) continue; if (!fits(d, kind, r, corridor, opt)) continue;
        let m = 1e9; for (const p of placed) m = Math.min(m, arc(d, p.dir) - p.r * .6); if (opt.bias) m -= opt.bias(d);
        if (m > bs) { bs = m; best = d; } if (--K <= 0 && best) break;
      }
      return best;
    }
    // the ground has no stage / start restrictions on the shell's far side, but the camera must never end up inside a prop: tall props stay off the start area (see fits)
    // 1) hand placed coconut palms framing the spawn view (large, in front of the horizon, well apart)
    // (no hand-placed palms near the spawn any more: tall props stay out of the spawn view, see fits)
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
    // ---------------------------------------------------------------------------------------------
    // Scatter: everything below is placed by best-candidate sampling with per-type minimum distances, so props are sparse, well
    // spaced and evenly distributed over the whole sphere; nothing overlaps the path, stage, crystals, pond, house or turtle.
    const flowerPals = [['#b07ad8', '#cfa6ec'], ['#ef7f9f', '#fbb4c8'], ['#ff9a4a', '#ffc27a'], ['#ffd35a', '#fff0dc'], ['#8a8ae6', '#b9b9f4']];
    const fRng = mk(31337), patches = [];
    function bigFlower(b, x, z, h, c0, c1, sz = 1) {
      b.block(x, h * .5, z, .07 * sz, h, .07 * sz, '#4f9a45', 0, cube); b.block(x + .14 * sz, h * .38, z, .34 * sz, .1 * sz, .17 * sz, '#5faa52', .5, cube);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; b.block(x + Math.cos(a) * .2 * sz, h, z + Math.sin(a) * .2 * sz, .3 * sz, .12 * sz, .24 * sz, k % 2 ? c0 : c1, -a, cube); }
      b.block(x, h + .05 * sz, z, .2 * sz, .16 * sz, .2 * sz, '#f4b82e', 0, cube);
    }
    const addPatch = (d, n, pal, spread = .42) => {
      const b = batch(), k = n;
      for (let j = 0; j < k; j++) bigFlower(b, (j - (k - 1) / 2) * spread + (fRng() - .5) * .12, (fRng() - .5) * .5, .3 + fRng() * .3, pal[0], pal[1], .85 + fRng() * .45);
      emit(() => b.mesh(), d, tangent(randDir(fRng), d), .02); placed.push({ dir: d, r: .6, kind: 'flower' }); patches.push(d);
    };
    // 2) round trees, more coconut palms (even spread over the sphere)
    { let n = 0; const nTree = LOW_POWER ? 4 : 6;
      for (let i = 0; n < nTree && i < nTree * 4; i++) { const d = bestPlace(placeRng, 'tree', 1.0, 2.7, { ok: d => clearsLesson(d, 1.2) }); if (!d) break;
        const h = 4.8 + placeRng() * 1.2, g = roundTree(h, 8000 + n); g.name = 'round3-tree'; register(g, d, .9, 'tree'); treeInfo.push({ dir: d, height: h }); placed.push({ dir: d, r: 1.1, kind: 'tree' }); n++; } }
    { let n = 0; const nPalm = LOW_POWER ? 6 : 9;
      for (let i = 0; n < nPalm && i < nPalm * 4; i++) { const d = bestPlace(placeRng, 'tree', .8, 2.7, { ok: d => clearsLesson(d, 1.2) }); if (!d) break; const h = 6.0 + placeRng() * 1.8; addPalm(...XA(d), h, 100 + n); n++; } }
    // 3) flower patches: a ring round the pond rim first, then the whole sphere
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2 + .5, rgt0 = new T.Vector3().crossVectors(pondD, STAGE.front).normalize();
      const fw = tangent(STAGE.front, pondD), d = c.moveAlong(pondD, fw.clone().multiplyScalar(Math.cos(a)).addScaledVector(rgt0, Math.sin(a)), POND_R + 1.5 + (i % 2) * .4).normalize();
      if (placed.some(p => p.kind !== 'flower' && p.kind !== 'pond' && arc(d, p.dir) < p.r + .6) || trailPts.some(t => arc(d, t) < 1.2) || arc(d, pierFrom) < 1.8) continue;
      addPatch(d, 2 + (i % 2), flowerPals[(i * 2) % 5]);
    }
    const nPatch = LOW_POWER ? 14 : 24;
    for (let n = 0; n < nPatch; n++) { const d = bestPlace(fRng, 'flower', .6, 1.55, { stage: 5.0 }); if (!d) break; addPatch(d, 2 + (n % 3), flowerPals[n % 5]); }
    // 4) round bushes (rounded-cube clusters; every 4th is flowering)
    { let nBush = 0; const bushTarget = LOW_POWER ? 9 : 14;
      for (let i = 0; nBush < bushTarget && i < bushTarget * 3; i++) {
        const d = bestPlace(fRng, 'bush', .9, 2.1); if (!d) break;
        const b = batch(), s = .75 + fRng() * .45, rrb = mk(300 + nBush);
        if(!softStyle)voxelBlob(b, [[0, .75 * s, 0, 1.1 * s, .8 * s, 1.1 * s], [.5 * s, .55 * s, .3 * s, .75 * s, .55 * s, .75 * s]], (LOW_POWER ? .95 : .62) * s, (LOW_POWER ? 1.08 : .7) * s, nBush % 4 === 3 ? ['#e48faf', '#ef9fbb', '#d97d9f'] : ['#5aa650', '#69b55a', '#4e9a48', '#76bf64'], rrb, 1.05);
        emit(() => softStyle ? softStyle.bush(s,nBush,nBush%4===3) : b.mesh(), d, tangent(randDir(fRng), d), 0); placed.push({ dir: d, r: .9, kind: 'bush' }); obstacles.push({ dir: d, r: .8 * s, kind: 'bush' }); nBush++;
      } }
    // 5) mushrooms (purple / orange), pebbles, shells and starfish; shells + starfish prefer the beach around the pond and the plaza
    const mushCols = [['#b077d8', '#f4e8ff'], ['#ee8a4a', '#fff0d8'], ['#e86a8c', '#fff0f0']];
    for (let n = 0; n < (LOW_POWER ? 4 : 6); n++) { const d = bestPlace(fRng, 'flower', .5, 1.5, { stage: 5.0 }); if (!d) break; const mc = mushCols[n % 3], mb = mushroom(mc[0], mc[1], 1.5 + fRng() * .5); emit(() => mb.mesh(), d, tangent(randDir(fRng), d), 0); placed.push({ dir: d, r: .7, kind: 'flower' }); }
    const beachBias = d => { const dp = arc(d, pondD) - POND_R, dz = arc(d, plazaD); return Math.min(dp, dz * .7, 8) * .9; };
    for (let n = 0; n < (LOW_POWER ? 8 : 14); n++) {
      const d = bestPlace(fRng, 'flower', .4, 1.3, { stage: 4.6, bias: beachBias }, 20); if (!d) break;
      const kind = n % 3, b = kind === 2 ? starfish() : shellModel(kind ? '#f6d2cc' : '#fbe9d6', kind ? '#f1b9b6' : '#f3d9bd'), sc = 1.5 + fRng() * .6;
      b.count(); placeMatrix.scale.setScalar(sc);
      place(placeMatrix, d, tangent(randDir(fRng), d), .02); placeMatrix.scale.setScalar(sc); placeMatrix.updateMatrix(); chunkOf(d).b.add(b.mesh().geometry, placeMatrix.matrix, '#ffffff'); placeMatrix.scale.setScalar(1);
      placed.push({ dir: d, r: .45, kind: 'flower' });
    }
    for (let n = 0; n < (LOW_POWER ? 8 : 14); n++) {
      const d = bestPlace(fRng, 'rock', .6, 1.6); if (!d) break;
      const b = batch(); b.block(0, .17, 0, .45 + fRng() * .4, .3 + fRng() * .25, .4 + fRng() * .4, ['#cfc8bb', '#bdb6a8', '#dad3c4'][n % 3], fRng() * 3, soft);
      emit(() => softStyle ? softStyle.rock(.7,n) : b.mesh(), d, STAGE.front, .02); placed.push({ dir: d, r: .5, kind: 'rock' }); obstacles.push({ dir: d, r: .45, kind: 'rock' });
    }
    // near-field details for the spawn view: flowers, shells and pebbles in front of and beside the player, never on the path
    const nearZone = d => { if (d.y < .3) return false; const [x, a] = XA(d); return a < -1.6 && a > -12 && Math.abs(x) < 10; };
    let nNear = 0;
    for (let tries = 0; nNear < (LOW_POWER ? 6 : 9) && tries < 4000; tries++) {
      const d = P((fRng() - .5) * 13, -(2.5 + fRng() * 9)); if (!nearZone(d) || arc(d, START_DIR) < 1.9 || trailPts.some(t => arc(d, t) < 1.45) || placed.some(p => arc(d, p.dir) < Math.max(p.r + .8, p.kind === 'tree' ? 3.0 : p.kind === 'flower' ? 2.4 : 1.5))) continue;
      addPatch(d, 2 + (nNear % 3), flowerPals[(nNear * 2 + 1) % 5]); nNear++;
    }
    // grass tufts everywhere (cheap 3-blade cubes), denser near the camera
    const tuftBatch = batch(), grassBlade = softStyle ? new T.ConeGeometry(1, 1, 3) : cube;
    for (let j = 0; j < 3; j++) tuftBatch.block((j - 1) * .09, .12, 0, .05, .24 + (j === 1 ? .07 : 0), .06, '#ffffff', j * .5, grassBlade);
    if(softStyle)grassBlade.dispose();
    const tuftGeo = tuftBatch.mesh().geometry, tuftCols = ['#5fae4a', '#4e9c42', '#75bd55', '#58a647'];
    const nTuft = LOW_POWER ? 300 : 620; let nT = 0;
    for (let tries = 0; nT < nTuft && tries < nTuft * 3; tries++) {
      const d = randDir(fRng); if (arc(d, STAGE.center) < 3.5 || landDist(d) < 1.6) continue;
      if (placed.some(p => p.kind !== 'flower' && p.kind !== 'rock' && arc(d, p.dir) < p.r * .8 + .3)) continue;
      if (trailPts.some(t => arc(d, t) < 1.0)) continue;
      { const [px, pa] = XA(d); if (d.y > .3 && (1 - smooth(3.4, 5.4, Math.hypot(px / 1.05, (pa + 4.6) / .7))) > .6) continue; }   // no grass in the middle of the sand plaza
      place(placeMatrix, d, tangent(randDir(fRng), d), .02); placeMatrix.scale.setScalar(.7 + fRng() * .5); placeMatrix.updateMatrix();
      chunkOf(d).b.add(tuftGeo, placeMatrix.matrix, tuftCols[nT % 4]); placeMatrix.scale.setScalar(1); nT++;
    }
    let nTn = 0;
    for (let tries = 0; nTn < (LOW_POWER ? 50 : 80) && tries < 2500; tries++) {
      const d = P((fRng() - .5) * 20, -(3.8 + fRng() * 9)); if (!nearZone(d) || arc(d, START_DIR) < 1.0 || trailPts.some(t => arc(d, t) < 1.05) || placed.some(p => p.kind !== 'flower' && arc(d, p.dir) < p.r * .8 + .3)) continue;
      { const [px, pa] = XA(d); if ((1 - smooth(3.4, 5.4, Math.hypot(px / 1.05, (pa + 4.6) / .7))) > .6) continue; }
      place(placeMatrix, d, tangent(randDir(fRng), d), .02); placeMatrix.scale.setScalar(.7 + fRng() * .5); placeMatrix.updateMatrix();
      chunkOf(d).b.add(tuftGeo, placeMatrix.matrix, tuftCols[nTn % 4]); placeMatrix.scale.setScalar(1); nTn++;
    }
    // ---- islets: a palm, flower patches and a shell on each of the two small boat islets; two palms on the cove islet
    const ringDir = (centre, a) => { const e1 = tangent(Math.abs(centre.y) > .9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 1, 0), centre), e2 = e1.clone().cross(centre); return e1.multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a)).normalize(); };
    const ringPoint = (centre, a, m) => c.moveAlong(centre, ringDir(centre, a), m).normalize();
    ISLETS.forEach((s, si) => {
      if (s.name === 'cove') { addPalm(-1.5, 40.2, 6.6, 301); addPalm(-7.6, 32.4, 6.2, 302); return; }
      const pc = ringPoint(s.c, si * 2.1 + .4, .7); addPalm(...XA(pc), 6.4 + si * .4, 310 + si);
      for (let k = 0; k < 3; k++) addPatch(ringPoint(s.c, k * 2.1 + 1.0 + si, s.r - 1.7), 3 + (k % 2), flowerPals[(k + si * 2) % 5]);
      const sh = shellModel(si ? '#f6d2cc' : '#fbe9d6', si ? '#f1b9b6' : '#f3d9bd'); sh.count(); placeMatrix.scale.setScalar(1.8);
      emit(() => sh.mesh(), ringPoint(s.c, si * 2.1 + 3.6, s.r - 1.5), tangent(randDir(fRng), s.c), 0); placeMatrix.scale.setScalar(1);
    });
    // ---- things drifting on the sea: lily pads, driftwood logs, a buoy (sparse, >= 6.5 m apart, away from the dock and the islets)
    {
      const lilyB = batch(); lilyB.block(0, .035, 0, .8, .07, .8, '#5cb86c', .3, soft); lilyB.block(.12, .03, .1, .3, .08, .3, '#4ea85e', .9, soft); lilyB.block(-.12, .1, -.08, .22, .14, .22, '#f6a9c6', .2, soft); lilyB.block(-.12, .2, -.08, .12, .08, .12, '#ffe27a', 0, soft);
      const logB = batch(); logB.block(0, .1, 0, .34, .26, 1.5, '#9b6b44', 0, soft); logB.block(.02, .2, .4, .2, .14, .5, '#b98558', .2, soft); logB.block(0, .12, .78, .3, .24, .12, '#d9b78a', 0, soft);
      const buoyB = batch(); buoyB.block(0, .22, 0, .55, .34, .55, '#f4f0e6', 0, soft); buoyB.block(0, .36, 0, .56, .12, .56, '#e8574c', 0, soft); buoyB.block(0, .62, 0, .1, .4, .1, '#6f4a30', 0, soft); buoyB.block(0, .86, 0, .24, .1, .24, '#e8574c', 0, soft);
      const bits = [], models = [['lily', lilyB], ['lily', lilyB], ['log', logB], ['lily', lilyB], ['buoy', buoyB]];
      for (let tries = 0, n = 0; n < (LOW_POWER ? 14 : 24) && tries < 6000; tries++) {
        const d = randDir(fRng), ld = landDist(d); if (ld > -3.2 || ld < -24) continue;
        if (arc(d, boatRest) < 7 || bits.some(q => arc(q, d) < 6.5)) continue;
        const [key, mb] = models[n % models.length]; emit(() => mb.mesh(), d, tangent(randDir(fRng), d), -SEA_DROP + .02, '#ffffff', key); bits.push(d); n++;
      }
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
    // ---------------------------------------------------------------------------------------------
    // T revision: the race track. The sand bricks themselves are painted on the ground cells (colour + ground shader, like S's road); here:
    // a flag on a pole every ~5 m on both sides, a red / white checker line and the finish arch in front of the stage.
    {
      const sandCols = ['#f6e0a6'], flagCols = ['#8fd9b6', '#e1a6e8', '#f6a9a0', '#ffd480'];
      const nearFork = s => RACE.forks.some(f => Math.abs(s - f.s) < 3.4), wrapS = s => Math.min(s, RACE.L - s);
      // checker line across the track at the start / finish
      for (let row = 0; row < 2; row++) for (let col = -3; col <= 3; col++) {
        const d = c.moveAlong(RACE.lat(0, col * .46), RACE.fwd(0), (row - .5) * .46); place(placeMatrix, d, RACE.fwd(0), .03 + .065); placeMatrix.scale.set(.42, .13, .42); placeMatrix.updateMatrix();
        chunkOf(d).b.add(soft, placeMatrix.matrix, (row + col + 6) % 2 ? '#ffffff' : '#e8574c'); placeMatrix.scale.setScalar(1);
      }
      // flags
      const nFlag = Math.floor(RACE.L / 5.2);
      for (let jf = 0; jf < nFlag; jf++) {
        const s = (jf + .5) * RACE.L / nFlag, k = Math.round(s / RACE.ds);
        if (nearFork(s) || wrapS(s) < 4.2 || Math.abs(s - RACE.sleepK * RACE.ds) < 3.2) continue;
        for (const side of [-1, 1]) {
          const fb = batch(), col = flagCols[(jf * 2 + (side > 0 ? 1 : 0)) % 4];
          fb.block(0, .72, 0, .09, 1.4, .09, '#f4efe6', 0, soft); fb.block(0, 1.2, .3, .07, .32, .52, col, 0, soft); fb.block(0, 1.46, 0, .16, .12, .16, '#ffd480', 0, soft);
          const d = RACE.lat(k, side * 2.05); place(placeMatrix, d, RACE.fwd(k), .03); placeMatrix.updateMatrix(); chunkOf(d).b.add(fb.mesh().geometry, placeMatrix.matrix, '#ffffff');
        }
      }
      // finish arch (static; the game adds the big flag sign above it while the race runs)
      {
        const ab = batch(), W = 2.4;   // T revision: smaller arch (was 2.75 wide / 3.8 high) so it does not fill the landscape view
        for (const sx of [-1, 1]) { for (let i = 0; i < 4; i++) ab.block(sx * W, .25 + i * .42, 0, .4, .42, .4, i % 2 ? '#ffffff' : '#e8574c', 0, chunk); ab.block(sx * W, 1.9, 0, .54, .18, .54, '#ffd480', 0, chunk); }
        for (let i = -5; i <= 5; i++) ab.block(i * .44, 2.08, 0, .44, .34, .36, (i + 5) % 2 ? '#ffffff' : '#e8574c', 0, chunk);
        ab.block(0, 2.34, 0, 5.1, .12, .44, '#8fd9b6', 0, soft);
        const d = RACE.pts[0]; place(placeMatrix, d, RACE.fwd(0), 0); placeMatrix.updateMatrix(); const arch = ab.mesh(); arch.castShadow = true;
        const ag = new T.Group(); ag.add(arch); ag.name = 'round3-tree'; place(ag, d, RACE.fwd(0), 0); root.add(ag); scenery.push(ag); landmarks.finish = { dir: d.clone(), radius: 3.0, height: 2.6, object: ag };
      }
    }
    // ---------------------------------------------------------------------------------------------
    // T revision: the rainbow is hidden while it rains and is drawn from one side to the other after the race (rbProg); a pastel rainbow
    // arching over the sea behind the turtle's head, a few slow translucent drops floating in the sky once the rain has stopped. Both live in the horizon ring (follow the player's "up"), unlit, no fog.
    const skyTicks = [], rbProg = { value: 0 }, rainRef = { mesh: null, mat: null }; let rainbowMesh = null;   // T revision: rainbow draw progress / rain handles
    {
      const D = 190, apexEl = -3.2 * Math.PI / 180, footEl = -33 * Math.PI / 180;
      const yApex = D * Math.tan(apexEl), yFoot = D * Math.tan(footEl), Rb = yApex - yFoot, y0 = yFoot;
      const cols = ['#f4727a', '#f7a15f', '#f9dd72', '#8fd48c', '#6fc6e8', '#8f90e6', '#bd8fe4'].map(h => new T.Color(h)), bw = 4.6;
      const pos = [], col = [], aT = [], seg = LOW_POWER ? 48 : 72;
      for (let bnd = 0; bnd < cols.length; bnd++) {
        const rOut = Rb - bnd * bw, rIn = rOut - bw * 1.02;
        for (let s = 0; s < seg; s++) {
          const a0 = s / seg * Math.PI, a1 = (s + 1) / seg * Math.PI;
          const p = (r, a) => [Math.cos(a) * r, y0 + Math.sin(a) * r, -D];
          const A = p(rOut, a0), B = p(rOut, a1), C = p(rIn, a1), Dd = p(rIn, a0);
          const tt = [a0, a1, a1, a0, a1, a0]; [A, B, C, A, C, Dd].forEach((q, qi) => { pos.push(...q); col.push(cols[bnd].r, cols[bnd].g, cols[bnd].b); aT.push(tt[qi] / Math.PI); });
        }
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setAttribute('aT', new T.Float32BufferAttribute(aT, 1)); g.computeBoundingSphere();
      const rbMat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .8, depthWrite: false, fog: false, toneMapped: false, side: T.DoubleSide }), rbU = { value: 0 };
      rbMat.onBeforeCompile = sh => {   // uProg 0..1: the arch is drawn from one end to the other
        sh.uniforms.uProg = rbU;
        sh.vertexShader = 'attribute float aT; varying float vT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vT = aT;');
        sh.fragmentShader = 'uniform float uProg; varying float vT;\n' + sh.fragmentShader.replace('#include <alphamap_fragment>', '#include <alphamap_fragment>\n  diffuseColor.a *= 1.0 - smoothstep(uProg * 1.08 - .08, uProg * 1.08, vT); if (diffuseColor.a < .01) discard;');
      };
      rbMat.customProgramCacheKey = () => 't-rainbow-progress';
      skyTicks.push(() => { rbU.value = rbProg.value; });
      const rb = new T.Mesh(g, rbMat);
      rb.name = 't-rainbow'; rb.frustumCulled = false; rb.renderOrder = 2; rb.visible = false; rainbowMesh = rb; localSky.add(rb);
      // rain drops: small translucent diamonds drifting down slowly and fading in / out
      const dropGeo = new T.OctahedronGeometry(1, 0); dropGeo.scale(.75, 1.45, .75);
      const drops = [], nD = LOW_POWER ? 8 : 12, dr = mk(4242);
      for (let i = 0; i < nD; i++) {
        const m = new T.Mesh(dropGeo, new T.MeshBasicMaterial({ color: '#cfeeff', transparent: true, opacity: .0, depthWrite: false, fog: false, toneMapped: false }));
        const az = i / nD * Math.PI * 2 + dr() * .5, el = (-26 + dr() * 34) * Math.PI / 180, dist = 140 + dr() * 40;
        const base = new T.Vector3(Math.cos(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist);
        m.scale.setScalar(2.2 + dr() * 1.6); m.position.copy(base); m.frustumCulled = false; m.renderOrder = 3; localSky.add(m); drops.push({ m, base, ph: dr() * 6.28, sp: .12 + dr() * .1, fall: 16 + dr() * 10 });
      }
      skyTicks.push((dt, time) => { for (const d of drops) { const k = (time * d.sp + d.ph) % 1; d.m.position.set(d.base.x, d.base.y - k * d.fall, d.base.z); d.m.material.opacity = Math.sin(k * Math.PI) * .6 * (1 - (habitat ? habitat.wet.value : 0)); } });
      // T revision: rain. One dynamic quad mesh (one draw call) of thin streaks round the camera, falling along the player's "up".
      const rainN = LOW_POWER ? 260 : 520, rainPos = new Float32Array(rainN * 12), rainIdx = new Uint16Array(rainN * 6), rainD = [], rr2 = mk(777);
      for (let i = 0; i < rainN; i++) {
        const ang = rr2() * Math.PI * 2, rad = 3.5 + Math.sqrt(rr2()) * 28, len = .55 + .05 * rad, wid = (.02 + .0042 * rad) * .5;
        rainD.push({ x: Math.cos(ang) * rad, z: Math.sin(ang) * rad, y: -10 + rr2() * 26, sp: 15 + rr2() * 8, len, px: -Math.sin(ang) * wid, pz: Math.cos(ang) * wid });
        rainIdx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
      }
      const rainGeo = new T.BufferGeometry(); rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3).setUsage(T.DynamicDrawUsage)); rainGeo.setIndex(new T.BufferAttribute(rainIdx, 1));
      rainGeo.boundingSphere = new T.Sphere(new T.Vector3(), 400);
      const rainMat = new T.MeshBasicMaterial({ color: '#eef4ff', transparent: true, opacity: .5, depthWrite: false, fog: false, toneMapped: false, side: T.DoubleSide });
      const rainMesh = new T.Mesh(rainGeo, rainMat); rainMesh.name = 't-rain'; rainMesh.frustumCulled = false; rainMesh.renderOrder = 4; rainMesh.visible = false; localSky.add(rainMesh);
      rainRef.mesh = rainMesh; rainRef.mat = rainMat;
      skyTicks.push(dt => {
        if (!rainMesh.visible) return;
        const sdt = Math.min(dt, .05);
        for (let i = 0; i < rainN; i++) {
          const r = rainD[i]; r.y -= r.sp * sdt; if (r.y < -10) r.y += 26;
          const o = i * 12, x = r.x, y = r.y, z = r.z, tx = x + r.len * .16;
          rainPos[o] = x - r.px; rainPos[o + 1] = y; rainPos[o + 2] = z - r.pz;
          rainPos[o + 3] = x + r.px; rainPos[o + 4] = y; rainPos[o + 5] = z + r.pz;
          rainPos[o + 6] = tx + r.px; rainPos[o + 7] = y + r.len; rainPos[o + 8] = z + r.pz;
          rainPos[o + 9] = tx - r.px; rainPos[o + 10] = y + r.len; rainPos[o + 11] = z - r.pz;
        }
        rainGeo.attributes.position.needsUpdate = true;
      });
    }
    const floraMat = nearFade(material);
    const floraMeshes = chunks.map(ch => { const m = ch.b.mesh(floraMat); m.castShadow = false; m.name = 't-flora'; root.add(m); return { mesh: m, center: ch.center }; });
    const fadeTargets = []; scene.traverse(o => { if (o.name === 'round3-tree') fadeTargets.push(o); });
    fadeTargets.forEach(g => g.traverse(o => { if (o.isMesh && (o.material.isMeshStandardMaterial || o.material.isMeshLambertMaterial)) nearFade(o.material, true); }));
    const CHUNK_RAD = Math.sqrt(4 * Math.PI / K) * .62;
    const propMap = () => placed.map(p => [+p.dir.x.toFixed(3), +p.dir.y.toFixed(3), +p.dir.z.toFixed(3), p.kind, +p.r.toFixed(2)]);
    // ---- wandering critters (blocky, spread over the sphere; frozen when far from the camera) ----
    const fauna = [];
    function makeAnimal(kind) {
      const b = batch(), s = { rabbit: 1, crab: 1, turtle: 1 }[kind];
      if (kind === 'rabbit') {
        const m1 = '#f1e3cb', m2 = '#fff6e8', m3 = '#3a2c2a';
        b.block(0, .28, 0, .34, .30, .5, m1, 0, soft); b.block(0, .40, .30, .26, .26, .26, m1, 0, soft); b.block(0, .34, .45, .14, .1, .1, '#e8a0a4', 0, soft);
        b.block(-.05, .42, .52, .035, .035, .02, m3, 0, cube); b.block(.05, .42, .52, .035, .035, .02, m3, 0, cube);
        for (const x of [-.07, .07]) b.block(x, .64, .26, .07, .26, .08, m1, x * 2, soft); b.block(0, .3, -.28, .14, .14, .14, m2, 0, soft);
      } else if (kind === 'crab') {
        const m1 = '#ee6a4e', m2 = '#f6a08a';
        b.block(0, .12, 0, .46, .2, .34, m1, 0, soft); b.block(0, .2, 0, .34, .1, .26, m2, 0, soft);
        for (const x of [-1, 1]) { b.block(x * .34, .18, .24, .18, .14, .2, m1, x * .3, soft); b.block(x * .38, .19, .38, .2, .14, .12, m2, 0, soft); b.block(x * .12, .27, .12, .04, .1, .04, '#222', 0, cube); for (let k = 0; k < 3; k++) b.block(x * .3, .06, -.12 + k * .12, .2, .05, .05, m1, 0, cube); }
      } else {
        const m1 = '#5fa04e', m2 = '#a9cf6a', m3 = '#2f4a3a';
        b.block(0, .2, 0, .5, .24, .62, m1, 0, soft); b.block(0, .34, 0, .38, .14, .5, '#76b45e', 0, soft); b.block(0, .2, .44, .24, .2, .26, m2, 0, soft);
        for (const x of [-.06, .06]) b.block(x, .25, .55, .035, .045, .02, m3, 0, cube);
        for (const x of [-.27, .27]) for (const z of [-.2, .22]) b.block(x, .07, z, .14, .12, .2, m2, 0, soft);
      }
      const mesh = b.mesh(); mesh.castShadow = false; const g = new T.Group(); g.add(mesh); g.scale.setScalar(kind === 'rabbit' ? 1.45 : 1.6); return g;
    }
    function spawnAnimal(kind, d) {
      const g = makeAnimal(kind); root.add(g); place(g, d, tangent(randDir(placeRng), d), 0);
      fauna.push({ g, kind, dir: d.clone(), home: d.clone(), heading: tangent(randDir(placeRng), d), target: null, pause: placeRng() * 3, shake: 0, speed: .55 + placeRng() * .25 });
    }
    const animalKinds = ['rabbit', 'crab', 'turtle', 'crab', 'turtle', 'rabbit'];
    const faunaTarget = LOW_POWER ? 10 : 16;
    for (let tries = 0, n = 0; n < faunaTarget && tries < 5000; tries++) {
      const d = randDir(placeRng);
      if (landDist(d) < 2.2 || arc(d, STAGE.center) < 3.5 || arc(d, START_DIR) < 2.5 || trailPts.some(t => arc(t, d) < 1.5)) continue;
      if (placed.some(p => arc(d, p.dir) < p.r + .7) || fauna.some(f => arc(f.dir, d) < 5)) continue;
      spawnAnimal(n < 3 ? ['rabbit', 'crab', 'turtle'][n] : animalKinds[n % animalKinds.length], d); n++;
    }
    const butterflies = [];
    for (let i = 0; i < (LOW_POWER ? 6 : 10) && patches.length; i++) {
      const home = patches[Math.floor(placeRng() * patches.length)], bb = batch(), col = ['#f2c86d', '#edb1ce', '#9ec8f0', '#ffffff'][i % 4];
      bb.block(-.07, 0, 0, .14, .015, .1, col, .4, soft); bb.block(.07, 0, 0, .14, .015, .1, col, -.4, soft); bb.block(0, 0, 0, .025, .03, .12, '#4a3d36', 0, cube);
      const m = bb.mesh(); m.castShadow = false; const g = new T.Group(); g.add(m); g.scale.setScalar(1.6); root.add(g); butterflies.push({ g, m, home, phase: i * 1.7 });
    }
    const faunaBlocked = d => landDist(d) < 1.2 || placed.some(p => p.kind !== 'flower' && p.kind !== 'rock' && arc(d, p.dir) < p.r + .2);
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
    // ---------------------------------------------------------------------------------------------
    // Sea boundary + the optional little boat.
    // LAND mode (default): a chain of obstacle disks just outside the coast of the main island (and ringing each islet) keeps the
    //   player on dry sand. BOAT mode: that chain is swapped for disks that cover the land, so the existing click-to-walk
    //   navigation then only plans routes over water. Gameplay / quiz logic is untouched: every crystal is on the main island.
    const seaDisks = [], landDisks = [];
    {
      const NCH = 40, rd = 3.6;
      for (let k = 0; k < NCH; k++) { const th = k / NCH * Math.PI * 2; seaDisks.push({ dir: atBearing(th, coastR(th) - .8 + rd), r: rd, kind: 'sea' }); landDisks.push({ dir: atBearing(th, coastR(th) - 2.0), r: 3.4, kind: 'sea-land' }); }
      landDisks.push({ dir: ISLE_C.clone(), r: ISLE_R0 * .91 - 5.0, kind: 'sea-land' });
      for (const s of ISLETS) {
        landDisks.push({ dir: s.c.clone(), r: s.r + 1.2, kind: 'sea-land' });
        const n = s.r > 5 ? 14 : 10, rr = 2.6;
        for (let k = 0; k < n; k++) seaDisks.push({ dir: ringPoint(s.c, k / n * Math.PI * 2, s.r - .8 + rr), r: rr, kind: 'sea' });
      }
    }
    let navMode = 'land';
    const setNavMode = m => {
      if (m === navMode) return; navMode = m;
      const rm = arr => arr.forEach(o => { const i = obstacles.indexOf(o); if (i >= 0) obstacles.splice(i, 1); });
      if (m === 'boat') { rm(seaDisks); landDisks.forEach(o => obstacles.push(o)); } else { rm(landDisks); seaDisks.forEach(o => obstacles.push(o)); }
    };
    seaDisks.forEach(o => obstacles.push(o));

    // --- the little rounded-block rowboat (bow towards +z, like the characters) with a pennant, plus a tiny jetty at its mooring
    function rowBoat() {
      const g = new T.Group(), b = batch();
      b.block(0, .16, 0, 1.0, .28, 2.5, '#8a5a3a', 0, soft);
      b.block(-.52, .5, -.05, .2, .5, 2.7, '#c98f58', 0, soft); b.block(.52, .5, -.05, .2, .5, 2.7, '#c98f58', 0, soft);
      b.block(-.54, .78, -.05, .16, .12, 2.75, '#4aa3c9', 0, soft); b.block(.54, .78, -.05, .16, .12, 2.75, '#4aa3c9', 0, soft);
      b.block(0, .46, 1.38, .9, .5, .34, '#c98f58', 0, soft); b.block(0, .6, 1.68, .56, .5, .34, '#c98f58', 0, soft); b.block(0, .86, 1.9, .3, .3, .3, '#ea5f4c', 0, soft);
      b.block(0, .5, -1.3, 1.1, .56, .26, '#a96f45', 0, soft);
      b.block(0, .46, -.78, .9, .12, .34, '#e0b27a', 0, soft);
      b.block(0, 1.25, 1.35, .09, 1.5, .09, '#6f4a30', 0, soft);
      for (let i = 0; i < 4; i++) b.block(.2 + i * .06, 1.75 - i * .1, 1.35, .46 - i * .1, .12, .06, i % 2 ? '#ffffff' : '#ea5f4c', 0, soft);
      for (const s of [-1, 1]) { b.block(s * .78, .62, .2, .06, .06, 1.35, '#e6c795', s * .35, soft); b.block(s * 1.32, .5, .62, .22, .05, .36, '#e6c795', 0, soft); }
      g.add(b.mesh()); return g;
    }
    function jetty(len) {
      const g = new T.Group(), b = batch();
      for (let i = 0; i < Math.round(len / .42); i++) b.block(0, .1, i * .42, 1.0, .1, .38, ['#b98558', '#c99560', '#aa7a4e'][i % 3], 0, soft);
      for (const s of [-1, 1]) for (const z of [0.1, len - .3]) b.block(s * .55, .26, z, .16, .6, .16, '#6f4a30', 0, soft);
      g.add(b.mesh()); return g;
    }
    const SEA_LIFT = -SEA_DROP + .2;
    const rowG = new T.Group(); rowG.name = 't-boat'; rowG.add(rowBoat()); root.add(rowG);
    const boatHit = new T.Mesh(new T.SphereGeometry(2.1, 8, 6), new T.MeshBasicMaterial({ visible: false })); boatHit.position.y = .9; rowG.add(boatHit);
    {
      const base = atBearing(DOCK_TH, coastR(DOCK_TH) - 1.2), outward = tangent(atBearing(DOCK_TH, coastR(DOCK_TH) + 3).sub(base), base);
      const jg = jetty(4.2); jg.name = 't-jetty'; place(jg, base, outward, -.03); root.add(jg);
      landmarks.boat = { dir: boatRest.clone(), radius: 1.4, object: rowG }; landmarks.dock = { dir: base.clone(), radius: 2, object: jg };
    }
    const bs = { st: 'land', dir: boatRest.clone(), heading: tangent(atBearing(DOCK_TH + 3.8 * DEG, coastR(DOCK_TH) + 5).sub(boatRest), boatRest), hop: null, lift: 0, pending: null, wakeT: 0, stillT: 0 };
    // wake / foam puffs behind the sailing boat
    const wakeGeo = new T.BoxGeometry(1, .1, 1), wakeMat = new T.MeshBasicMaterial({ color: '#f4fcfb', transparent: true, opacity: .85, depthWrite: false });
    const wake = []; for (let i = 0; i < 12; i++) { const m = new T.Mesh(wakeGeo, wakeMat); m.visible = false; root.add(m); wake.push({ m, age: 9, dir: new T.Vector3(), head: new T.Vector3() }); }
    // hint pill (same look as the NPC name pill), shown above the boat
    const pill = document.createElement('div'); pill.id = 't-boat-pill';
    pill.style.cssText = 'position:fixed;z-index:6;left:0;top:0;pointer-events:none;display:none;padding:6px 13px;border-radius:18px;background:#fff;color:#3b4a6b;font:700 13px/1.2 system-ui,sans-serif;box-shadow:0 6px 16px rgba(90,70,120,.28);white-space:nowrap;transform:translate(-50%,-100%)';
    document.body.appendChild(pill);
    const Y = () => window.__yaya, tmpP = new T.Vector3();
    const hopTo = (from, to, kind) => { bs.hop = { t: 0, from: from.clone(), to: to.clone(), kind }; bs.st = kind === 'on' ? 'hopOn' : 'hopOff'; Y().routeTo(Y().player.dir.clone(), 0); };
    function board() { const y = Y(); if (bs.st !== 'land') return; hopTo(y.player.dir, bs.dir, 'on'); }
    function boatTap(dir) {
      const y = Y(); if (bs.st !== 'boat') return;
      if (landDist(dir) > -.5 && arc(dir, y.player.dir) > .3) bs.pending = dir.clone(); else bs.pending = null;
      y.routeTo(dir.clone(), 0);
    }
    const ray = new T.Raycaster(), ndc = new T.Vector2(), sph = new T.Sphere(new T.Vector3(), SURF - .5), hitP = new T.Vector3();
    let down = null;
    window.addEventListener('pointerdown', e => { if (e.isPrimary) down = { x: e.clientX, y: e.clientY }; }, true);
    window.addEventListener('pointerup', e => {
      const y = Y(), d0 = down; down = null;
      if (!d0 || !e.isPrimary || !y || !y.renderer || !y.state || !y.state.started) return;
      if (y.tRace?.active || y.snakeRide?.active || y.practice?.busy) return;   // 赛跑 / 任务进行中不能上船，免得把比赛卡住
      const cv = y.renderer.domElement; if (e.target !== cv || Math.hypot(e.clientX - d0.x, e.clientY - d0.y) > 8) return;
      const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, y.camera);
      const onBoat = ray.intersectObject(boatHit, false).length > 0;
      const swallow = () => { e.stopImmediatePropagation(); cv.dispatchEvent(new PointerEvent('pointercancel', { pointerId: e.pointerId, isPrimary: true, bubbles: true })); };
      if (bs.st === 'land') {
        if (!onBoat) return; swallow();
        if (arc(y.player.dir, bs.dir) < 5.5) board(); else y.routeTo(bs.dir.clone(), 3.0, () => { if (arc(y.player.dir, bs.dir) < 6.5) board(); });
      } else if (bs.st === 'boat') {
        swallow(); if (onBoat) return;
        if (ray.ray.intersectSphere(sph, hitP)) boatTap(hitP.clone().normalize());
      } else swallow();
    }, true);
    function boatTick(dt, time, state) {
      const y = Y(); if (!y || !y.player || !state || !state.obj) return;
      const pl = y.player, near = arc(state.dir, bs.dir);
      // hops (board / leave)
      if (bs.hop) {
        const h = bs.hop; h.t = Math.min(1, h.t + dt / .55);
        state.dir.copy(h.from).lerp(h.to, h.t * h.t * (3 - 2 * h.t)).normalize();
        state.heading.copy(tangent(h.to.clone().sub(h.from), state.dir)).normalize();
        if (h.t >= 1) {
          bs.hop = null;
          if (h.kind === 'on') { setNavMode('boat'); bs.st = 'boat'; bs.stillT = 0; } else { setNavMode('land'); bs.st = 'land'; }
        }
      }
      const mounted = bs.st === 'boat' || bs.st === 'hopOn' || (bs.st === 'hopOff' && bs.hop && bs.hop.t < .5);
      bs.lift += ((mounted ? SEA_LIFT : 0) - bs.lift) * Math.min(1, dt * 7);
      const bob = Math.sin(time * 1.9 + 1) * (bs.st === 'boat' && state.moving ? .07 : .045);
      // leaving: land on the nearest dry spot toward the tapped point
      if (bs.st === 'boat' && bs.pending && !y.getRoute()) {
        const to = bs.pending; bs.pending = null;
        if (arc(to, state.dir) > .3) {
          const hd = tangent(to.clone().sub(state.dir), state.dir); let land = null;
          for (let m = .3; m <= 4.6; m += .25) { const q = c.moveAlong(state.dir, hd, m).normalize(); if (landDist(q) > 1.4) { land = q; break; } }
          if (land) { bs.dir.copy(state.dir); bs.heading.copy(state.heading); hopTo(state.dir, land, 'off'); }
        }
      }
      // the boat follows the player while he is aboard, otherwise it stays moored where it was left
      if (bs.st === 'boat' || bs.st === 'hopOn') { if (bs.st === 'boat') { bs.dir.copy(state.dir); bs.heading.copy(state.heading); } }
      const br = (mounted && bs.st !== 'hopOn' ? pl.radius : surfaceRadius(bs.dir)) + SEA_LIFT + bob;
      rowG.position.copy(bs.dir).multiplyScalar(br); orient(rowG, bs.dir, bs.heading);
      rowG.rotateZ(Math.sin(time * 1.4) * .035); rowG.rotateX(Math.sin(time * 1.1 + 2) * .02);
      if (Math.abs(bs.lift) > .004 || bs.st !== 'land') {
        const arcH = bs.hop ? Math.sin(Math.PI * bs.hop.t) * .45 : 0;
        state.obj.position.copy(state.dir).multiplyScalar(pl.radius + bs.lift + (mounted ? .12 + bob : 0) + arcH); orient(state.obj, state.dir, state.heading);
      }
      // wake
      bs.wakeT -= dt;
      if (bs.st === 'boat' && state.moving && bs.wakeT <= 0) {
        bs.wakeT = .13; const w = wake.find(q => q.age > 1.2);
        if (w) { w.age = 0; w.dir.copy(c.moveAlong(bs.dir, bs.heading, -1.5)).normalize(); w.head.copy(bs.heading); w.m.visible = true; }
      }
      for (const w of wake) if (w.m.visible) {
        w.age += dt; const k = w.age / 1.2; if (k >= 1) { w.m.visible = false; continue; }
        place(w.m, w.dir, w.head, SEA_LIFT - .12); w.m.scale.set((.5 + k * 1.1) * (1 - k * .6), 1, (.5 + k * 1.1) * (1 - k * .6));
      }
      // hint pill
      let txt = '';
      if (bs.st === 'land' && near < 9) txt = '⛵ 小船 · 点我出海';
      else if (bs.st === 'boat') { if (state.moving || y.getRoute()) bs.stillT = 0; else bs.stillT += dt; if (bs.stillT > .8 && landDist(state.dir) > -9) txt = '🏝 点沙滩上岸'; }
      if (txt && y.camera) {
        tmpP.copy(rowG.position).addScaledVector(bs.dir, 2.7).project(y.camera);
        if (tmpP.z < 1 && Math.abs(tmpP.x) < 1.2 && Math.abs(tmpP.y) < 1.2) {
          const rr = y.renderer.domElement.getBoundingClientRect(); pill.textContent = txt;
          pill.style.left = (rr.left + (tmpP.x * .5 + .5) * rr.width) + 'px'; pill.style.top = (rr.top + (-tmpP.y * .5 + .5) * rr.height) + 'px'; pill.style.display = 'block';
        } else pill.style.display = 'none';
      } else pill.style.display = 'none';
    }
    const boatApi = { state: bs, setNavMode, get navMode() { return navMode; }, board, boatTap, group: rowG, landDist, seaDisks, landDisks, islets: ISLETS, rest: boatRest };
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
    // horizon / distance culling of tall props, turtle parts and flora chunks
    function cull() {
      camDir.copy(skyGroup.position); if (camDir.lengthSq() < 1) return; const camLen = camDir.length(); camDir.divideScalar(camLen);
      const horizon = Math.acos(Math.min(.98, SURF / camLen));
      const flatLimit = Math.cos(horizon + CHUNK_RAD), tallLimit = Math.cos(Math.min(2.9, horizon + 1.0));
      for (const f of floraMeshes) f.mesh.visible = f.center.dot(camDir) > flatLimit;
      for (const g of scenery) g.visible = g.position.lengthSq() < 1 ? true : g.position.clone().normalize().dot(camDir) > tallLimit;
      head.group.visible = head.dir.dot(camDir) > tallLimit - .02;
    }
    // ---------------------------------------------------------------------------------------------
    // T revision: weather + finale. Everything reads habitat.wet (1 = raining ... 0 = dry; round2-world lowers it after complete()).
    // Rain, the grey-lilac sky (shader uniform `wet`), ~30% dimmer light, grey-blue fog and grey-lilac clouds follow it; the rainbow
    // is drawn from one side to the other (uProg) and the giant turtle wakes up (eyes open, head lifts, flippers paddle).
    const wetRef = habitat ? habitat.wet : { value: 0 };
    const fogDry = new T.Color('#f2c3c6'), fogWet = new T.Color('#aeb6c9'), cloudDry = new T.Color('#ffffff'), cloudWet = new T.Color('#a9a2c0'), seaWet = new T.Color('#b9c0d3');
    const fogN0 = scene.fog.near, fogF0 = scene.fog.far;
    const clamp01 = x => Math.max(0, Math.min(1, x)), ease = k => k * k * (3 - 2 * k);
    let isDry = false, finale = null, lastWet = -1;
    const turtleAnim = { t: -1, done: false, promise: null, resolve: null };
    const paddles = flippers.slice(0, 4).map(f => f.group.children[0]);
    function setTurtle(t) {
      const open = clamp01((t - .3) / .6);
      head.eyesClosed.visible = t < .3; head.eyesOpen.visible = t >= .3; head.eyesOpen.scale.y = Math.max(.08, ease(open)); head.zz.visible = t < .5;
      const lift = ease(clamp01((t - .9) / 1.1)) * (1 - ease(clamp01((t - 3.2) / 1.0)) * .65);
      head.rig.rotation.x = HEAD_PITCH-.10 * lift; head.rig.position.y = HEAD_LIFT + HEAD_PIVOT_Y + .6 * lift; head.rig.scale.y = 1;
      const env = ease(clamp01((t - 1.1) / .5)) * (1 - ease(clamp01((t - 3.6) / .6)));
      paddles.forEach((p, i) => { p.rotation.x = -.12 + env * .35 * Math.sin((t - 1.1) * 7 + i * 1.6); p.rotation.y = env * .2 * Math.sin((t - 1.1) * 7 + i * 1.6 + 1.2); });
    }
    function wakeTurtle(instant) {
      if (instant) { turtleAnim.t = -1; turtleAnim.done = true; setTurtle(9); return Promise.resolve(); }
      if (turtleAnim.done || turtleAnim.t >= 0) return turtleAnim.promise || Promise.resolve();
      turtleAnim.t = 0; turtleAnim.promise = new Promise(r => { turtleAnim.resolve = r; }); return turtleAnim.promise;
    }
    // save-game load: jump straight to the dry look with the rainbow drawn and the turtle awake (no replay)
    function setDry() { isDry = true; finale = null; wetRef.value = 0; rbProg.value = 1; wakeTurtle(true); lastWet = -1; }
    if (habitat) { const completeOld = habitat.complete; habitat.complete = () => { completeOld(); if (!isDry) { isDry = true; finale = { t: 0 }; } }; }
    function applyWeather(w) {
      baseLights.forEach(([l, i]) => { l.intensity = i * (1 - .3 * w); });
      scene.fog.color.copy(fogDry).lerp(fogWet, w); scene.fog.near = fogN0 - 22 * w; scene.fog.far = fogF0 - 60 * w;
      cloudMat.color.copy(cloudDry).lerp(cloudWet, w); if (seaRingMat) seaRingMat.color.copy(cloudDry).lerp(seaWet, w * .7);
      rainRef.mesh.visible = w > .02; rainRef.mat.opacity = .4 * Math.min(1, w * 1.5);
    }
    // T polish: after the rain the giant turtle swims — the far sea ring slides past, all four flippers keep paddling and
    // throw white foam, the head bobs. Little voxel fish leap out of the sea around the shell all the time.
    const seaRing = localSky.getObjectByName('t-distant-sea');
    let swimT = 0, foamT = 0;
    function swimTick(dt, time) {
      if (!turtleAnim.done) return;
      swimT += dt; const ramp = Math.min(1, swimT / 3);
      if (seaRing) seaRing.rotation.y += dt * .03 * ramp;
      paddles.forEach((p, i) => { const ph = time * 2.6 + i * 1.6; p.rotation.x = -.12 + .30 * ramp * Math.sin(ph); p.rotation.y = .2 * ramp * Math.sin(ph + 1.2); });
      head.rig.position.y = HEAD_LIFT + HEAD_PIVOT_Y + .21 + Math.sin(time * 1.3) * .08 * ramp;
      foamT -= dt;
      if (foamT <= 0 && ramp > .3) {
        foamT = LOW_POWER ? .4 : .22;
        for (const f of flippers.slice(0, 4)) {
          const wp = f.group.getWorldPosition(new T.Vector3()), up = wp.clone().normalize();
          spawnFx(wp.addScaledVector(up, .2), up, randDir(placeRng).multiplyScalar(.4).addScaledVector(up, .9), '#ffffff', .35 + placeRng() * .25, .9, 1.8, -1.0, .75);
        }
      }
    }
    const fishes = [];
    {
      const cols = [['#ff9a4a', '#ffd27a'], ['#6cc6e8', '#d7f3ff'], ['#f27fa8', '#ffd3e2'], ['#ffd24a', '#fff2b0']];
      const pool = seaDisks.filter((o, i) => i % 3 === 0);
      for (let i = 0; i < (LOW_POWER ? 3 : 5) && pool.length; i++) {
        const b = batch(), [c1, c2] = cols[i % cols.length];
        b.block(0, 0, 0, .22, .3, .52, c1, 0, soft); b.block(0, -.04, .05, .16, .14, .36, c2, 0, soft); b.block(0, 0, -.36, .06, .32, .2, c1, 0, soft);
        for (const x of [-.11, .11]) b.block(x, .06, .18, .03, .06, .06, '#2a2230', 0, cube);
        const g = new T.Group(); const m = b.mesh(); m.castShadow = false; g.add(m); g.scale.setScalar(1.4); g.visible = false; root.add(g);
        const home = pool[Math.floor(placeRng() * pool.length)].dir.clone();
        fishes.push({ g, home, fwd: tangent(randDir(placeRng), home), t: placeRng() * 6, period: 4.5 + placeRng() * 3 });
      }
    }
    function fishTick(dt) {
      for (const f of fishes) {
        f.t += dt; const k = f.t % f.period, LEAP = 1.0;
        if (k > LEAP) { if (f.g.visible) { f.g.visible = false; const p = f.g.position.clone(); spawnFx(p, p.clone().normalize(), p.clone().normalize().multiplyScalar(.8), '#e9f7ff', .4, .6, 2, -1.5, .8); f.fwd.applyAxisAngle(f.home, (placeRng() - .5) * 1.4); } continue; }
        const u = k / LEAP, d = c.moveAlong(f.home, f.fwd, (u - .5) * 2.4).normalize(), up = d.clone();
        if (!f.g.visible) { f.g.visible = true; spawnFx(d.clone().multiplyScalar(surfaceRadius(d)), up, up.clone().multiplyScalar(.8), '#e9f7ff', .4, .6, 2, -1.5, .8); }
        f.g.position.copy(d).multiplyScalar(surfaceRadius(d) - .1 + Math.sin(u * Math.PI) * 1.7);
        orient(f.g, up, f.fwd); f.g.rotateX(-(u - .5) * 2.2);
      }
    }
    function weatherTick(dt, time) {
      swimTick(dt, time); fishTick(dt);
      const w = wetRef.value; if (Math.abs(w - lastWet) > .002 || lastWet < 0) { lastWet = w; applyWeather(w); }
      if (finale) { finale.t += dt; rbProg.value = ease(clamp01((finale.t - .5) / 3.2)); if (finale.t > 1.5) wakeTurtle(false); if (finale.t > 4) { rbProg.value = 1; finale = null; } }
      rainbowMesh.visible = rbProg.value > .001;
      if (turtleAnim.t >= 0) { turtleAnim.t += dt; setTurtle(turtleAnim.t); if (turtleAnim.t > 4.4) { turtleAnim.t = -1; turtleAnim.done = true; setTurtle(9); turtleAnim.resolve && turtleAnim.resolve(); } }
      else if (!turtleAnim.done) head.rig.scale.y = 1 + .009 * Math.sin(time * 1.5);
    }
    const snapshot = () => ({ version: 't-world', radius: R, treeHeights: treeInfo.map(t => t.height), routeLength: routePoints.slice(1).reduce((sum, d, i) => sum + arc(routePoints[i], d), 0), answers: answerDirs.map(d => d.toArray()), landmarks: Object.fromEntries(Object.entries(landmarks).map(([k, vv]) => [k, { position: vv.dir.toArray(), radius: vv.radius, height: vv.height, doorHeight: vv.doorHeight }])) });
    let cullTimer = 0;
    function update(dt, time, state) {
      oldBirds.forEach((g, i) => { const a = time * .045 + i * .22; g.position.set(Math.cos(a) * 23, R + 12 + i * .35, Math.sin(a) * 23); });
      skyTicks.forEach(f => f(dt, time)); weatherTick(dt, time);
      ripples.forEach((m, i) => { const k = (time * .18 + i * .2) % 1; m.scale.setScalar(.5 + k * 3); m.material.opacity = (1 - k) * .28; });
      skyPlanets.forEach((m, i) => m.rotation.y += dt * (.015 + i * .003));
      window.YayaRound3Crystals?.tick(time, skyGroup.position);
      cullTimer -= dt; if (cullTimer <= 0) { cullTimer = .2; cull(); }
      if (state) { localSky.quaternion.slerp(skyQ.setFromUnitVectors(skyUp, state.dir), 1 - Math.exp(-Math.min(dt, .1) * 3)); }
      if (state && state.obj) { const pd = state.obj.position.distanceTo(skyGroup.position); floraNear.value.set(pd * .5, pd * .7); }
      boatTick(dt, time, state);
      if (state) { updateFauna(dt, time, state.dir); updateFx(dt, time, state.moving ? state : null, state.moving, state.speed || 1); }
    }
    const api = { onBoat: () => bs.st === 'boat' || bs.st === 'hopOn', root, routePoints, trailPts, answerDirs, sparkleBurst, wrongFeedback, propMap, fauna, landmarks, pond, pd: pondD, ducks, trees: treeInfo, update, snapshot, turtle: { head, flippers, shellRim, overview(aspect=1){const focus=ISLE_C.clone().multiplyScalar(SURF*.64),facing=tangent(head.dir.clone().sub(ISLE_C),ISLE_C),distance=aspect<.8?75:57;return {focus,position:focus.clone().addScaledVector(ISLE_C,distance*.18).addScaledVector(facing,distance).addScaledVector(isleRt,distance*.36),up:ISLE_C.clone(),lift:1,zoom:1,ahead:0};}, disks: turtleDisks, wake: wakeTurtle, get awake() { return turtleAnim.done; } }, setDry, whenDry: () => turtleAnim.promise || Promise.resolve(), sleepBunny, makeSleepBunny: raceSleepBunny, raceTrack: { points: RACE.pts, step: RACE.ds, length: RACE.L, start: RACE.start, gates: RACE.forks.map(f => ({ at: f.k, s: f.s, center: f.center, fwd: f.fwd, left: f.left, right: f.right })), sleep: { at: RACE.sleepK, tree: RACE.treeDir, rabbit: RACE.rabbitDir }, lat: RACE.lat, fwdAt: RACE.fwd }, complete() { habitat?.complete(); }, boat: boatApi, createCrystal: (label, col) => window.YayaRound3.createCrystal(T, label, col) };
    window.YayaTSoftArt?.install(c, api, { P, XA, landDist, RACE, lessonClear, pathIdx, sandWeights });
    return api;
  }
  window.YayaPlanetTWorld = { create };
})();
