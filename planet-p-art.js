/* P · 泡泡星球 — art builders: 噗噗 / 糖糖 (rounded-block pigs), the broken bubble machine, mushrooms, layout constants.
   Reuses YAYA_I_ART.makeBatch (vertex-colour merged rounded blocks). Loaded after planet-i-art.js, before planet-p.js. NEW FILE (phase 1). */
(() => {
  'use strict';
  // Layout in surface metres: x = right of the stage, a = away from the spawn camera (same frame as planets T / I).
  const LAYOUT = {
    spawnA: -4.1,
    machine: { x: -8.4, a: 2.8, scale: 2.2 },    // the bubble machine: the planet's landmark (~7.5 tall); its tap stays at child-hand height
    pupu: { x: -5.3, a: 3.3 },                   // 噗噗 stands beside the tap (not in front of it), facing the spawn
    big: { duck: { x: -4.9, a: -.7 }, snail: { x: -8.2, a: -8.4 } },   // duck: knee-high, in the bath corner
    giant: { tub: { x: -17, a: -18 } },        // a separate duck garden beyond the western meadow; octopus spring is on the far eastern side
    frameShrooms: [[-7.2, -12.4, 3.9], [-4.6, -13.8, 2.8], [8.6, -13.2, 4.1], [15.6, -7.5, 3.6], [16.6, 1.6, 4.4], [-2.2, 14.6, 4.6], [2.6, 15.2, 3.3], [-16.2, 4.2, 3.4]],   // big caps framing the main area, like A's trees
    bath: { rack: { x: -4.6, a: -2.2 }, barrels: [[-6.2, -.6], [-5.6, -1.4]] },
    lake: { x: 5.2, a: 4.3, rx: 3.6, rz: 3.0 },   // front-right of the spawn: the pedestal never hides it
    island: { x: 5.6, a: 8.0, h: 10.2, r: 2.9 },  // bubble island floats above the far shore of the lake
    fountain: { x: 9.6, a: -3.6 },
    pools: [ { x: 11.5, a: 27, r: 2.4, c: 'pink' }, { x: 6.9, a: -9.9, r: 1.35, c: 'blue' }, { x: 13.4, a: 8.8, r: 1.4, c: 'blue' } ],   // octopus spring, frog pond, whale pool
  };
  const C = {
    pig: '#ef9e98', pigTop: '#f6b6ae', pigDark: '#d97f7e', snout: '#e98a8e', hoof: '#5b3427', cheek: '#f0708e', eye: '#1c1622',
    piglet: '#f7bdb4', pigletTop: '#fbd0c8', bow: '#ec4f8c', bowDark: '#c73a74',
    towel: '#ffffff', towel2: '#e9e6f2', rope: '#c49a5c', ring: '#f2679a', wand: '#4f9be6', wand2: '#7cc0f5',
    tank: '#f08fb0', tankTop: '#f7b3c9', copper: '#c97c42', copperTop: '#e3a067', copperDark: '#8d4f28', wood: '#a7703f', woodTop: '#c48d58', woodDark: '#7b4e2a',
  };
  const roundedBox = (T, b) => window.YayaRound3.roundedBox(T, b);
  const batch = (T, geo) => window.YayaPSoftArt?.enabled() ? YayaPSoftArt.makeBatch(T, geo) : window.YAYA_I_ART.makeBatch(T, geo);

  // ---- pigs: local frame, ground at y=0, facing +z. Body + head are separate meshes (head pivot at the neck) ----------------
  function pig(T, o = {}) {
    const geo = roundedBox(T, .3), tiny = roundedBox(T, .12);
    const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .88, metalness: 0 });
    const root = new T.Group(), body = new T.Group(), head = new T.Group(); root.name = o.name || 'p-pig'; root.add(body); body.add(head);
    const pk = o.light ? C.piglet : C.pig, pkT = o.light ? C.pigletTop : C.pigTop, pkD = o.light ? '#eca9a2' : C.pigDark;
    const B = batch(T, geo), H = batch(T, geo), F = batch(T, tiny);
    // legs with dark brown hooves
    for (const [x, z] of [[-.2, .14], [.2, .14], [-.2, -.16], [.2, -.16]]) { B.block(x, .14, z, .2, .2, .2, pk, { top: pkT }); B.block(x, .03, z + .01, .21, .07, .21, C.hoof, { low: 1 }); }
    if(B.shape)B.shape(YayaPSoftArt.shapes(T).body,0,.44,0,.48,.32,.39,pk,{top:pkT,soft:true});
    else for (let k = 0; k < 2; k++) { B.block(0, .44, 0, .74, .54, .66, pk, { top: pkT, ry: k * .785 }); B.block(0, .44, 0, .84, .36, .56, pk, { top: pkT, ry: k * .785 }); }   // round body (octagonal)
    for (const s of [-1, 1]) { B.block(s * .42, .48, .06, .14, .26, .16, pk, { rz: s * .35 }); B.block(s * .47, .36, .08, .12, .07, .14, C.hoof, { rz: s * .35, low: 1 }); }   // little arms
    // curly tail
    F.block(0, .5, -.35, .07, .07, .08, pkD); F.block(.05, .55, -.38, .07, .07, .07, pkD); F.block(.02, .6, -.41, .07, .07, .07, pkD); F.block(-.03, .56, -.42, .06, .06, .06, pkD);
    if (o.rope) {   // rope necklace with a pink bubble ring
      for (const [x, z, w, d] of [[0, .335, .62, .045], [0, -.33, .62, .045], [-.335, 0, .045, .62], [.335, 0, .045, .62]]) F.block(x, .69, z, w, .045, d, C.rope, { plain: true });
      const rx = 0, ry = .52, rz = .37;
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; F.block(rx + Math.sin(a) * .085, ry + Math.cos(a) * .085, rz, .055, .05, .05, C.ring, { rz: -a }); }
      F.block(0, .64, .36, .03, .1, .03, C.rope, { plain: true });
    }
    // head (origin at the neck)
    if(H.shape)H.shape(YayaPSoftArt.shapes(T).head,0,.32,.02,.49,.39,.40,pk,{top:pkT,soft:true});
    else {H.block(0, .32, .02, .88, .66, .76, pk, { top: pkT }); H.block(0, .3, .02, .98, .5, .66, pk, { top: pkT }); H.block(0, .32, .02, .7, .74, .6, pk, { top: pkT, ry: .785 });}
    for (const s of [-1, 1]) { H.block(s * .3, .68, -.02, .22, .2, .14, pkD, { rz: s * -.45 }); H.block(s * .36, .62, .03, .12, .12, .06, '#f3a3a3', { rz: s * -.45, plain: true }); }   // ears
    if(H.shape)H.shape(YayaPSoftArt.shapes(T).nose,0,.24,.4,1,.7,1,C.snout,{top:'#f4a6a8',soft:true});
    else H.block(0, .24, .4, .32, .22, .12, C.snout, { top: '#f4a6a8' });                                               // big nose
    for (const s of [-1, 1]) H.block(s * .065, .24, .465, .05, .08, .03, '#7b3a45', { plain: true });   // nostrils
    for (const s of [-1, 1]) { H.block(s * .2, .42, .39, .1, .13, .05, C.eye, { low: 1 }); H.block(s * .2 - .025, .46, .415, .04, .045, .02, '#ffffff', { plain: true });
      H.block(s * .32, .25, .385, .14, .09, .04, C.cheek, { plain: true }); }
    if (o.towel) { H.block(0, .7, .02, .56, .1, .44, C.towel, { top: '#ffffff', low: .92 }); H.block(.02, .78, .02, .5, .08, .4, C.towel2, { top: '#ffffff', low: .92 }); H.block(-.27, .66, .02, .05, .12, .4, '#dfe9f7', { plain: true }); }
    if (o.bow) { H.block(0, .72, .1, .12, .12, .1, C.bowDark); for (const s of [-1, 1]) { H.block(s * .17, .74, .1, .22, .2, .09, C.bow, { rz: s * .25, top: '#f586b2' }); H.block(s * .13, .64, .1, .07, .12, .05, C.bowDark, { rz: s * -.4 }); } }
    const bm = B.mesh(mat, root.name + '-body'), fm = F.mesh(mat, root.name + '-trim'), hm = H.mesh(mat, root.name + '-head');
    [bm, fm, hm].forEach(m => { m.castShadow = true; }); body.add(bm); body.add(fm); head.add(hm); head.position.set(0, .78, 0);
    let wand = null;
    if (o.wand) {   // blue-pink bubble wand in the right hoof
      const W = batch(T, tiny); W.block(0, 0, 0, .05, .5, .05, C.wand, { top: C.wand2 }); W.block(0, -.22, 0, .08, .1, .08, C.wand2);
      for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; W.block(Math.sin(a) * .11, .36 + Math.cos(a) * .11, 0, .06, .05, .045, k % 2 ? C.ring : '#f7a1c3', { rz: -a }); }
      wand = new T.Group(); const wm = W.mesh(mat, root.name + '-wand'); wm.castShadow = true; wand.add(wm); wand.position.set(.5, .48, .12); wand.rotation.set(.15, 0, -.25); body.add(wand);
    }
    root.scale.setScalar(o.scale || 1);
    return { root, body, head, wand };
  }

  // ---- bubble machine (01 concept): a round pink tank with copper hoops on a wooden base, a copper pipe up and over to a big
  // copper horn aimed up and out (a little crooked: it is broken), a copper tap on the front at child-hand height, grey smoke.
  // Life size at scale 1: about 3.3 tall (the girl is 1.6). Local frame: ground y=0, the tap faces +z.
  function machine(T) {
    const geo = roundedBox(T, .3), tiny = roundedBox(T, .12);
    const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .62, metalness: .08 });
    const root = new T.Group(); root.name = 'p-bubble-machine';
    const M = batch(T, geo), S = batch(T, tiny);
    const ring = (b, y, w, h, col, top, n = 3, o = {}) => { for (let k = 0; k < n; k++) b.block(0, y, 0, w, h, w, col, { top, ry: k * Math.PI / (n * 2), ...o }); };
    // a low round stone pad sunk into the ground (hides the voxel steps under the feet), then the wooden base: planks + four feet
    ring(M, -.16, 2.0, .46, '#dccbbd', '#ecdfd2', 2, { low: .8 });
    ring(M, .15, 1.62, .22, C.wood, C.woodTop, 2);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 8; S.block(Math.sin(a) * .79, .15, Math.cos(a) * .79, .05, .2, .05, C.woodDark, { plain: true }); }   // plank seams on the rim
    // the tank: one smooth round pot (lathe), widest a little below the middle, closing into a dome
    const lathe = (pts, seg) => new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(r, y)), seg);
    const tankG = lathe([[0, .27], [.5, .27], [.6, .34], [.66, .48], [.69, .72], [.685, .98], [.65, 1.24], [.57, 1.47], [.45, 1.65], [.29, 1.78], [.12, 1.85], [0, 1.87]], 24);
    const TK = batch(T, tankG); TK.matrix(new T.Matrix4(), C.tank, { top: C.tankTop, low: .88 });
    ring(M, 1.88, .3, .1, C.copper, C.copperTop, 2);   // lid collar
    for (const [y, r] of [[.5, .668], [.98, .695], [1.42, .6]]) {   // copper hoops (12 rounded segments) + rivets
      for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; M.block(Math.sin(a) * r, y, Math.cos(a) * r, r * .56, .09, .07, C.copper, { ry: a, top: C.copperTop }); }
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + .26; S.block(Math.sin(a) * (r + .035), y, Math.cos(a) * (r + .035), .06, .06, .04, C.copperTop, { ry: a, plain: true }); } }
    // round porthole on the front-left: copper ring round a pale pink glass with soap foam inside
    const PX = -.26, PY = 1.2, PZ = .655;
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; S.block(PX + Math.cos(a) * .17, PY + Math.sin(a) * .17, PZ, .1, .07, .08, C.copper, { rz: a + Math.PI / 2, top: C.copperTop }); }
    S.block(PX, PY, PZ - .01, .3, .3, .06, '#fde4ef', { plain: true }); S.block(PX - .05, PY + .06, PZ + .025, .08, .05, .02, '#ffffff', { plain: true });
    S.block(PX + .04, PY - .07, PZ + .02, .1, .07, .02, '#f7bcd2', { plain: true });
    // copper pipe: up out of the lid, an elbow, across, a second elbow, then the horn
    M.block(.0, 2.18, 0, .17, .4, .17, C.copper, { top: C.copperTop }); M.block(0, 2.4, 0, .24, .1, .24, C.copperDark);
    M.block(.24, 2.44, 0, .5, .17, .17, C.copper, { top: C.copperTop }); M.block(.5, 2.44, 0, .1, .24, .24, C.copperDark);
    // horn: a smooth gramophone bell (lathe, open both sides), crooked on purpose: leans out to the side, tips forward, a dented lip
    const hornBase = new T.Matrix4().compose(new T.Vector3(.56, 2.46, 0), new T.Quaternion().setFromEuler(new T.Euler(.32, .1, -.92)), new T.Vector3(1.2, 1.2, 1.2));
    const hornG = lathe([[.085, -.04], [.09, .12], [.1, .28], [.125, .42], [.17, .54], [.25, .64], [.36, .72], [.48, .77], [.53, .775], [.5, .8]], 18);
    { const hp = hornG.attributes.position;   // the dent: pinch one side of the lip in
      for (let i = 0; i < hp.count; i++) { const x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i); if (y > .6 && x > .2 && z > -.1) { const k = .86; hp.setXYZ(i, x * k, y - .03, z * k); } } hornG.computeVertexNormals(); }
    const HN = batch(T, hornG); HN.matrix(hornBase, C.copper, { low: 1 });
    M.setBase(hornBase); ring(M, -.02, .24, .1, C.copperDark, C.copper, 2); M.block(0, .42, 0, .2, .025, .2, '#4a2a1c', { plain: true }); M.resetBase();   // collar + dark throat
    // a thin pipe down the back-left into the base, with a little valve knob
    S.block(-.62, 1.22, -.32, .1, .1, .1, C.copperDark); S.block(-.7, .8, -.36, .09, .84, .09, C.copper, { top: C.copperTop }); S.block(-.7, .36, -.36, .16, .08, .16, C.copperDark);
    const mm = M.mesh(mat, 'p-machine'), sm = S.mesh(mat, 'p-machine-trim'); mm.castShadow = true; sm.castShadow = true; root.add(mm); root.add(sm);
    const tkm = TK.mesh(mat, 'p-machine-tank'); tkm.castShadow = true; root.add(tkm);
    const hornMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .4, metalness: .35, side: T.DoubleSide });
    const hnm = HN.mesh(hornMat, 'p-machine-horn'); hnm.castShadow = true; root.add(hnm);
    const hornMouth = new T.Vector3(0, .78, 0).applyMatrix4(hornBase);
    // the tap: its own group (phase 2 spins / pulses it): a golden valve wheel on a copper spout, at child-hand height on the front
    const tap = new T.Group(); tap.name = 'p-machine-tap'; const tapInner = new T.Group(); tap.add(tapInner); const TB = batch(T, tiny);   // inner: counter-scaled when the machine is a giant
    const wheel = new T.Group(); wheel.name = 'p-tap-wheel'; const WB = batch(T, tiny);
    for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; WB.block(Math.cos(a) * .17, Math.sin(a) * .17, 0, .11, .075, .075, '#f5c242', { rz: a + Math.PI / 2, top: '#ffe08a' }); }
    WB.block(0, 0, 0, .34, .05, .05, '#e7a93a'); WB.block(0, 0, 0, .05, .34, .05, '#e7a93a'); WB.block(0, 0, .02, .1, .1, .07, '#ff7fa6', { top: '#ffb3c9' });
    const glowMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .45, metalness: .25, emissive: new T.Color('#ffb84a'), emissiveIntensity: .35 });
    wheel.add(WB.mesh(glowMat, 'p-tap-wheel-mesh')); wheel.position.set(0, .06, .16); tapInner.add(wheel);
    TB.block(0, .06, -.02, .09, .09, .26, C.copper, { top: C.copperTop });                                  // stem out of the tank
    TB.block(0, -.06, .06, .12, .14, .12, C.copper, { top: C.copperTop }); TB.block(0, -.17, .09, .1, .1, .14, C.copperDark);   // spout
    TB.block(0, -.24, .12, .05, .03, .05, '#bfe6f7', { plain: true });                                        // a drip of soap
    const tm = TB.mesh(mat, 'p-machine-tap-mesh'); tm.castShadow = true; tapInner.add(tm); tap.userData.wheel = wheel; tap.userData.glow = glowMat; tap.userData.inner = tapInner;
    tap.position.set(.3, .78, .66); root.add(tap);
    return { root, tap, hornMouth };
  }

  // ---- mushroom into a batch (local frame of the batch base). h = total height --------------------------------------------------
  // A tall cream stem you can see, a pale gill disc, then a domed cap of three rounded square tiers (voxel, like the 03 plan) with
  // white spots set flush on the brim sides and on the shoulders. cheap = 12-triangle blocks (small decor).
  const CAPS = [['#f594b6', '#fbb9cf'], ['#86d6b8', '#afe9d2'], ['#b9a2ee', '#d4c6f8'], ['#f4d867', '#fbe99c']];
  function mushroom(b0, x, z, h, ci, seed = 0, cheap = false) {
    if(b0.shape)return YayaPSoftArt.mushroom(b0,x,z,h,ci,seed,CAPS,cheap);
    const b = cheap ? { block: (x, y, z, sx, sy, sz, t, o = {}) => b0.block(x, y, z, sx, sy, sz, t, { ...o, plain: true }) } : b0;
    const [cap, capT] = CAPS[ci % 4], sw = Math.max(.1, h * .2), cw = h * .74, yb = h * .55;
    b.block(x, yb * .5, z, sw, yb, sw, '#fbf1de', { top: '#fff8ea', low: .88 });                       // stem
    b.block(x, h * .05, z, sw * 1.3, h * .1, sw * 1.3, '#f1e0c4', { top: '#f8ecd6', low: .9 });         // foot
    b.block(x, yb + h * .015, z, cw * .84, h * .04, cw * .84, '#f2dccb', { plain: true });             // gills
    b.block(x, yb + h * .11, z, cw, h * .2, cw, cap, { top: capT, low: .8 });                           // brim
    b.block(x, yb + h * .27, z, cw * .8, h * .17, cw * .8, cap, { top: capT, low: .9 });               // shoulder
    b.block(x, yb + h * .4, z, cw * .54, h * .12, cw * .54, cap, { top: capT, low: .95 });             // crown
    b.block(x, yb + h * .48, z, cw * .28, h * .06, cw * .28, capT, { low: 1 });                        // dome top
    if (h < .55) return;
    const sp = h * .09, side = cw / 2 + .006;
    for (let k = 0; k < 4; k++) { const off = ((seed * 7 + k * 3) % 5 - 2) * cw * .14, a = k * Math.PI / 2;   // one spot per brim side
      b.block(x + Math.sin(a) * side + Math.cos(a) * off, yb + h * .11 + ((k + seed) % 2 ? .025 : -.025) * h, z + Math.cos(a) * side - Math.sin(a) * off, Math.abs(Math.cos(a)) * sp + .012, sp * .85, Math.abs(Math.sin(a)) * sp + .012, '#ffffff', { plain: true }); }
    for (let k = 0; k < 4; k++) { const a = seed * 1.9 + k * Math.PI / 2 + .5;   // spots on the brim and shoulder tops
      b.block(x + Math.sin(a) * cw * .45, yb + h * .21 + .004, z + Math.cos(a) * cw * .45, sp, .012 + h * .01, sp, '#ffffff', { plain: true });
      if (h > 1 && k % 2) b.block(x + Math.sin(a + .8) * cw * .335, yb + h * .355 + .004, z + Math.cos(a + .8) * cw * .335, sp * .9, .012 + h * .01, sp * .9, '#ffffff', { plain: true }); }
  }
  // ---- wonder props: bubble-bath creatures (local frame: ground y=0, facing +z towards the spawn). Each returns { root, anim(t) };
  // the static part and the moving body are separate merged meshes, so a creature costs one or two draws. -----------------------
  const rotY = (T, a) => new T.Matrix4().makeRotationY(a);
  function eye(B, x, y, z, s, lx = 0, ly = 0) {   // a big cartoon eye on a +z face: white, dark pupil looking (lx, ly), a glint
    B.block(x, y, z, s * .8, s, .05, '#ffffff', { plain: true });
    B.block(x + lx * s * .17, y + ly * s * .2 - s * .04, z + .02, s * .4, s * .56, .04, '#2a2033', { plain: true });
    B.block(x + lx * s * .17 - s * .08, y + ly * s * .2 + s * .1, z + .035, s * .15, s * .15, .02, '#ffffff', { plain: true });
  }
  const ringOf = (B, cx, cy, cz, r, n, col, axis = 'z') => { for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2;
    if (axis === 'z') B.block(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz, r * .55, r * .3, r * .3, col, { rz: a + Math.PI / 2 });
    else B.block(cx, cy + Math.sin(a) * r, cz + Math.cos(a) * r, r * .3, r * .3, r * .55, col, { rx: -a }); } };

  // 泡泡章鱼: a pink octopus in a shower cap, soaking in a wooden tub; tentacles hang over the rim, one waves a bubble wand
  function octopusBath(T, mat) {
    const root = new T.Group(); root.name = 'p-octopus-bath';
    const geo = roundedBox(T, .14), W = batch(T, geo), O = batch(T, geo);
    const S = 2.3, H = .85, th = .22, n = 9, w = S / n;
    for (let side = 0; side < 4; side++) { W.setBase(rotY(T, side * Math.PI / 2));
      for (let i = 0; i < n; i++) { const light = (i + side) % 2 === 0;
        W.block(-S / 2 + w / 2 + i * w, H / 2 + (light ? .02 : 0), S / 2 - th / 2, w * .97, H + (light ? .04 : 0), th, light ? '#e3b47e' : '#b98352', { top: light ? '#f2cc98' : '#cf9a66', low: .82 }); }
      W.block(0, H * .3, S / 2 + .005, S - .1, .07, .03, '#8a5a34', { plain: true }); W.block(0, H * .75, S / 2 + .005, S - .1, .07, .03, '#8a5a34', { plain: true }); }   // two hoops
    W.resetBase(); W.block(0, .06, 0, S - .1, .12, S - .1, '#9c6a40', { plain: true });
    W.block(0, H - .14, 0, S - th * 2 + .02, .08, S - th * 2 + .02, '#8fe0d4', { top: '#b9f1e7', plain: true });            // mint bath water
    [[-.62, .58, .34], [-.4, .7, .22], [.72, .5, .3], [.56, .7, .2], [-.6, -.62, .3], [.62, -.6, .26], [.05, -.72, .22]].forEach(([x, z, s]) => W.block(x, H - .06 + s * .25, z, s, s * .7, s, '#ffffff', { top: '#ffffff', low: .9 }));   // foam
    [[-1.55, .85, .62, .42], [1.5, 1.05, .48, .36], [1.05, 1.62, .24, .2], [-1.3, -1.45, .5, .3], [1.7, -.5, .3, .26]].forEach(([x, z, a, b]) => W.block(x, .015, z, a, .03, b, '#8fdcea', { top: '#b3ecf4', plain: true }));   // splashes
    const PK = '#f497bf', PKT = '#fbbdd8', TIP = '#f9b3d1', SUCK = '#fde4cc';
    O.block(0, 1.25, 0, 1.2, 1.2, 1.1, PK, { top: PKT, low: .85 });                                                          // head
    O.block(0, 1.86, 0, 1.28, .1, 1.18, '#f4f1fb', { top: '#ffffff' }); O.block(0, 1.98, 0, 1.06, .24, .98, '#ffffff', { top: '#ffffff' });   // shower cap
    [[-.3, .2, '#9fd3f5'], [.25, -.25, '#f7a8c8'], [.05, .1, '#c9b4f2'], [-.2, -.3, '#9fdcc4'], [.35, .25, '#fbe48e']].forEach(([x, z, c]) => O.block(x, 2.105, z, .12, .02, .12, c, { plain: true }));
    for (const s of [-1, 1]) { eye(O, s * .27, 1.4, .56, .36, .35, .55); O.block(s * .44, 1.08, .556, .17, .08, .03, '#ff86b4', { plain: true }); }
    O.block(0, 1.02, .558, .26, .24, .03, '#ffadd0', { plain: true }); O.block(0, 1.02, .57, .14, .13, .03, '#b8336e', { plain: true });   // little "o" mouth
    const over = a => { O.setBase(rotY(T, a));   // a tentacle over the rim, hanging down outside, its tip curling on the grass
      O.block(0, H - .02, .82, .27, .24, .52, PK, { top: PKT }); O.block(0, H + .08, 1.17, .29, .26, .34, PK, { top: PKT });
      O.block(0, H * .55, 1.33, .27, H * .72, .25, PK, { top: PKT }); O.block(0, .14, 1.52, .26, .24, .44, TIP, { top: '#fcd0e3' });
      for (const y of [.3, .5, .7]) O.block(0, y, 1.462, .11, .11, .03, SUCK, { plain: true }); O.block(0, .265, 1.6, .1, .03, .1, SUCK, { plain: true }); };
    const raised = (a, wand) => { O.setBase(rotY(T, a));   // a tentacle waving up out of the water
      O.block(0, 1.15, .72, .27, 1.0, .27, PK, { top: PKT }); O.block(0, 1.72, .92, .26, .26, .5, PK, { top: PKT }); O.block(0, 2.0, 1.1, .24, .4, .24, TIP, { top: '#fcd0e3' });
      for (const y of [.85, 1.1, 1.35]) O.block(0, y, .58, .1, .1, .03, SUCK, { plain: true });
      if (wand) { O.block(0, 2.36, 1.1, .05, .34, .05, '#7cc0f5'); ringOf(O, 0, 2.78, 1.1, .28, 12, '#ff8fc0', 'x'); } };
    [-.5, .5, -1.75, 1.75, -2.65, 2.65].forEach(over); raised(-1.15, false); raised(1.15, true);
    O.resetBase();
    const tub = W.mesh(mat, 'p-octopus-tub'), body = O.mesh(mat, 'p-octopus'); tub.castShadow = body.castShadow = true; tub.receiveShadow = true;
    const octo = new T.Group(); octo.add(body); root.add(tub); root.add(octo);
    return { root, anim(t) { octo.position.y = .035 * Math.sin(t * 1.6); octo.rotation.z = .035 * Math.sin(t * 1.1); octo.rotation.y = .07 * Math.sin(t * .6); } };
  }

  // 喷水小鲸鱼: a baby whale soaking in a little pool, a water spout bobbing on its head
  function whale(T, mat) {
    const root = new T.Group(); root.name = 'p-whale';
    const geo = roundedBox(T, .16), B = batch(T, geo), Sp = batch(T, roundedBox(T, .1));
    const BL = '#86c3ee', BLT = '#aad9f7', BEL = '#f4eee1';
    B.block(0, .5, -.05, 1.2, 1.0, 1.9, BL, { top: BLT, low: .82 }); B.block(0, .62, .45, 1.1, .78, .9, BL, { top: BLT });    // body + forehead
    B.block(0, .16, .3, 1.08, .2, 1.36, BEL, { top: BEL, low: .9 });                                                          // cream belly underneath
    for (const s of [-1, 1]) { eye(B, s * .36, .7, .94, .22, 0, .3); B.block(s * .47, .52, .94, .13, .07, .03, '#ff9fc0', { plain: true });
      B.block(s * .68, .3, .3, .32, .12, .44, BL, { top: BLT, rz: s * .5 }); }                                          // eyes, cheeks, flippers
    B.block(0, .48, .945, .32, .045, .03, '#3a5a85', { plain: true }); for (const s of [-1, 1]) B.block(s * .18, .51, .945, .06, .06, .03, '#3a5a85', { plain: true });   // smile
    B.block(0, .64, -1.08, .44, .44, .52, BL, { top: BLT, rx: -.5 }); B.block(0, .98, -1.32, .34, .34, .34, BL, { rx: -.7, top: BLT });
    for (const s of [-1, 1]) B.block(s * .3, 1.2, -1.44, .56, .12, .38, BL, { top: BLT, rz: s * .35 });                     // tail flukes
    B.block(0, 1.005, .25, .18, .03, .18, '#4c7fb0', { plain: true });                                                        // blowhole
    Sp.block(0, .25, 0, .17, .5, .17, '#b7ebfb', { top: '#e3f9ff' }); Sp.block(0, .64, 0, .12, .38, .12, '#cdf2fd', { top: '#effcff' });
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; Sp.block(Math.sin(a) * .2, .9 + (k % 2) * .06, Math.cos(a) * .2, .12, .12, .12, '#c4effd', { ry: a, top: '#ffffff' }); }
    Sp.block(0, .98, 0, .18, .14, .18, '#ffffff');
    const body = B.mesh(mat, 'p-whale-body'), spoutM = Sp.mesh(mat, 'p-whale-spout'); body.castShadow = spoutM.castShadow = true;
    const g = new T.Group(), spout = new T.Group(); spout.add(spoutM); spout.position.set(0, 1.0, .25); g.add(body); g.add(spout); root.add(g);
    return { root, anim(t) { const k = Math.abs(Math.sin(t * 1.8)); spout.scale.set(.85 + .15 * k, .55 + .55 * k, .85 + .15 * k); g.position.y = .03 * Math.sin(t * 1.8 + 1); g.rotation.x = .03 * Math.sin(t * .9); } };
  }

  // 吹泡泡的青蛙: a mint frog on a lily pad (with a pink lotus) holding up a bubble ring
  function frogPad(T, mat) {
    const root = new T.Group(); root.name = 'p-frog-pad';
    const geo = roundedBox(T, .14), Pd = batch(T, geo), F = batch(T, geo);
    for (let k = 0; k < 2; k++) Pd.block(0, .03, 0, 1.2, .06, 1.2, '#97d495', { top: '#b6e7aa', ry: k * .785, low: .85 });
    Pd.block(.0, .05, .5, .2, .06, .34, '#9fd6ef', { plain: true });                                                              // the notch
    for (const a of [.6, 1.6, 2.6, 3.6, 4.6]) Pd.block(Math.sin(a) * .3, .065, Math.cos(a) * .3, .03, .01, .45, '#cdeec2', { ry: a, plain: true });   // veins
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; Pd.block(-.42 + Math.sin(a) * .1, .14, -.36 + Math.cos(a) * .1, .14, .08, .2, '#f7a8c8', { ry: a, rx: -.5, top: '#fcd2e2' }); }
    Pd.block(-.42, .17, -.36, .08, .06, .08, '#fbe48e', { plain: true });                                                          // lotus
    const FG = '#8fd9a8', FGT = '#b6ebc4';
    F.block(0, .34, 0, .78, .52, .66, FG, { top: FGT, low: .85 }); F.block(0, .66, .04, .86, .34, .6, FG, { top: FGT });
    F.block(0, .3, .335, .5, .34, .04, '#f6f3dc', { plain: true });
    for (const s of [-1, 1]) { F.block(s * .24, .88, .1, .27, .25, .27, FG, { top: FGT }); eye(F, s * .24, .9, .24, .2, 0, .5);
      F.block(s * .36, .58, .345, .12, .06, .03, '#ff9fc0', { plain: true });
      F.block(s * .42, .16, -.05, .26, .22, .5, FG, { top: FGT }); F.block(s * .46, .06, .22, .24, .08, .28, FGT); }
    F.block(0, .55, .345, .44, .035, .03, '#4c7a52', { plain: true });                                                            // smile
    F.block(.34, .42, .3, .12, .32, .12, FG, { rx: -.5, top: FGT }); F.block(.36, .66, .44, .04, .22, .04, '#7cc0f5'); ringOf(F, .36, .92, .46, .17, 10, '#ff8fc0', 'z');
    const pad = Pd.mesh(mat, 'p-lily-pad'), frog = F.mesh(mat, 'p-frog'); frog.castShadow = true;
    const g = new T.Group(); g.add(frog); root.add(pad); root.add(g);
    return { root, anim(t) { g.scale.set(1 + .025 * Math.sin(t * 2.4), 1 - .03 * Math.sin(t * 2.4), 1 + .025 * Math.sin(t * 2.4)); root.rotation.y = .08 * Math.sin(t * .5); pad.position.y = .015 * Math.sin(t * 1.3); } };
  }

  // 冰淇淋壳蜗牛: a snail carrying a pastel swirl shell (pink / lilac / mint / lemon, a foam top), a sparkly trail behind
  function swirlSnail(T, mat) {
    const root = new T.Group(); root.name = 'p-swirl-snail';
    const geo = roundedBox(T, .14), B = batch(T, geo), Tr = batch(T, geo);
    const SK = '#f6dfa0', SKT = '#fbeec4';
    B.block(0, .16, 0, .52, .3, 1.35, SK, { top: SKT, low: .85 }); B.block(0, .44, .58, .48, .52, .42, SK, { top: SKT });
    for (const s of [-1, 1]) { B.block(s * .13, .86, .6, .06, .42, .06, '#efd38c', { rz: -s * .15 }); B.block(s * .16, 1.08, .62, .17, .17, .17, '#ffffff');
      B.block(s * .16, 1.07, .705, .07, .09, .02, '#2a2033', { plain: true }); B.block(s * .17, .42, .795, .1, .05, .02, '#ff9fc0', { plain: true }); }
    B.block(0, .36, .795, .18, .035, .02, '#9a6b3a', { plain: true });                                                            // smile
    [[.62, .98, '#f7a8c8', '#fcd0e0', 0, -.12], [.98, .74, '#c9b4f2', '#e2d6fb', .45, -.16], [1.27, .52, '#9fdcc4', '#c6eedd', .9, -.2], [1.48, .32, '#fbe48e', '#fdf0b8', 1.35, -.22]]
      .forEach(([y, s, c, t, r, z]) => { B.block(0, y, z, s, s * .62, s, c, { top: t, ry: r, low: .85 }); B.block(s * .4, y - s * .18, z + s * .2, s * .12, s * .16, .05, '#ffffff', { plain: true, ry: r }); });   // swirl tiers + glints
    B.block(0, 1.63, -.22, .18, .16, .18, '#ffffff', { top: '#ffffff' });                                                       // foam on top
    for (const [z, s] of [[-.95, .2], [-1.3, .15], [-1.62, .17], [-1.95, .11]]) Tr.block((z * 7 % 2) * .05, .012, z, s, .02, s, '#eaf7ff', { plain: true, ry: z });   // sparkly trail
    const body = B.mesh(mat, 'p-snail'), trail = Tr.mesh(new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), 'p-snail-trail'); body.castShadow = true;
    const g = new T.Group(); g.add(body); root.add(g); root.add(trail);
    return { root, anim(t) { g.rotation.y = .06 * Math.sin(t * .8); g.position.z = .03 * Math.sin(t * .8); g.scale.y = 1 + .02 * Math.sin(t * 1.6); } };
  }

  // ---- giants (landmarks with a bit of wonder). Local frame: ground y=0, facing +z towards the spawn ---------------------------
  const segAt = (T, x, y, z, yaw, pitch) => new T.Matrix4().makeRotationY(yaw).multiply(new T.Matrix4().makeRotationX(pitch)).setPosition(x, y, z);

  // 巨型猫脚浴缸: an 8 m pink clawfoot tub on golden feet, foam heaped up and spilling down one end, a golden tap pouring in;
  // a 3 m rubber duck and three ducklings float in it (they bob). foam: local point the old fountain bubbles use.
  function giantTub(T, mat) {
    const root = new T.Group(); root.name = 'p-giant-tub';
    const geo = roundedBox(T, .14), B = batch(T, geo), D = batch(T, geo);
    const PK = '#f6b3cb', PKT = '#fbd0df', WH = '#fbf8ff', G = '#f0c04f', GT = '#ffe08a', GD = '#c9952e';
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * 2.55, z = sz * 1.0, a0 = Math.atan2(sz, sx);   // claw feet
      B.block(x, .45, z, .62, .62, .62, G, { top: GT }); B.block(x, .88, z, .42, .4, .42, G, { top: GT });
      for (const k of [-.65, 0, .65]) { const a = a0 + k; B.block(x + Math.cos(a) * .4, .1, z + Math.sin(a) * .4, .36, .2, .17, GD, { ry: -a, top: G }); } }
    B.block(0, 1.2, 0, 5.8, 1.1, 2.6, PK, { top: PKT, low: .85 }); B.block(0, 1.88, 0, 6.5, 1.0, 3.1, PK, { top: PKT });       // tub body
    for (const s of [-1, 1]) { B.block(s * 3.2, 1.75, 0, 1.0, 1.3, 2.6, PK, { top: PKT }); B.block(s * 3.62, 1.85, 0, .6, 1.0, 1.8, PK, { top: PKT }); }
    B.block(0, 2.45, 0, 6.8, .26, 3.4, WH, { top: '#ffffff' });                                                               // roll-top rim
    for (const s of [-1, 1]) { B.block(s * 3.45, 2.45, 0, 1.0, .26, 2.9, WH, { top: '#ffffff' }); B.block(s * 3.9, 2.45, 0, .5, .26, 2.0, WH, { top: '#ffffff' }); }
    for (const s of [-1, 1]) { B.block(0, 1.45, s * 1.56, 6.2, .1, .04, G, { plain: true });                                   // gold band, white dots
      for (let i = 0; i < 6; i++) B.block(-2.6 + i * 1.04 + (s > 0 ? 0 : .5), 1.85 + (i % 2) * .24, s * 1.565, .22, .22, .03, '#ffffff', { plain: true }); }
    B.block(0, 2.42, 0, 6.3, .06, 2.85, '#9fe2ea', { top: '#c4f2f5', plain: true });                                         // bath water
    [[-2.7, .85, .9], [-2.0, -.95, 1.0], [-1.0, 1.05, .7], [.7, -1.0, .9], [1.3, .95, .8], [2.3, -.6, 1.1], [2.9, .75, .8], [-2.9, -.2, .7], [.1, 1.15, .6], [1.9, .2, .7]]
      .forEach(([x, z, s], i) => { B.block(x, 2.48 + s * .3, z, s, s * .75, s, '#ffffff', { top: '#ffffff', low: .92 }); if (i % 2) B.block(x + .2, 2.48 + s * .78, z - .1, s * .6, s * .5, s * .6, '#fdfbff', { top: '#ffffff' }); });
    [[4.15, 2.2, .9, .8], [4.35, 1.6, .8, .7], [4.5, 1.0, .85, .75], [4.65, .45, 1.1, .6], [5.0, .12, 1.6, .3]]                // foam spilling down the +x end
      .forEach(([x, y, s, h], i) => B.block(x, y, (i % 2 - .5) * .3, s, h, s * 1.1, '#ffffff', { top: '#ffffff', low: .95 }));
    B.block(5.5, .02, .6, 1.9, .04, 1.5, '#a5e3ef', { top: '#c6f0f6', plain: true });
    const FX = -4.2;                                                                                                          // golden tap pouring in
    B.block(FX, 1.95, 0, .32, 3.9, .32, G, { top: GT }); B.block(FX, 3.92, 0, .5, .2, .5, GD); B.block(FX + .5, 4.06, 0, 1.15, .3, .3, G, { top: GT });
    B.block(FX + 1.05, 3.8, 0, .36, .6, .36, G, { top: GT }); B.block(FX + 1.05, 3.47, 0, .44, .14, .44, GD);
    for (const s of [-1, 1]) { B.block(FX, 3.25, s * .42, .14, .14, .6, GD); B.block(FX, 3.25, s * .74, .5, .14, .14, G, { top: GT }); }
    for (let i = 0; i < 4; i++) B.block(FX + 1.05, 3.24 - i * .24, 0, .2 - i * .015, .27, .2 - i * .015, '#bfeffc', { top: '#e6fbff', plain: true });
    B.block(FX + 1.05, 2.48, 0, .6, .05, .6, '#ffffff', { plain: true });
    const Y = '#ffd84a', YT = '#ffe885', OR = '#ff9a3c', ORT = '#ffb96e';
    const duck = (x, z, s, ry) => { D.setBase(new T.Matrix4().compose(new T.Vector3(x, 2.35, z), new T.Quaternion().setFromEuler(new T.Euler(0, ry, 0)), new T.Vector3(s, s, s)));
      D.block(0, .35, 0, 2.4, 1.1, 1.8, Y, { top: YT, low: .9 }); D.block(-.1, .82, 0, 2.0, .6, 1.5, Y, { top: YT }); D.block(-1.2, 1.05, 0, .7, .7, .9, Y, { top: YT, rz: .6 });
      D.block(.65, 1.68, 0, 1.25, 1.2, 1.2, Y, { top: YT }); D.block(1.45, 1.48, 0, .62, .28, .72, OR, { top: ORT }); D.block(1.4, 1.36, 0, .5, .12, .62, '#f08a2c');
      for (const sz of [-1, 1]) { D.block(.95, 1.9, sz * .61, .3, .34, .05, '#ffffff', { plain: true }); D.block(1.0, 1.86, sz * .635, .15, .22, .04, '#2a2033', { plain: true });
        D.block(.95, 1.95, sz * .655, .06, .06, .02, '#ffffff', { plain: true }); D.block(1.08, 1.52, sz * .61, .2, .1, .03, '#ff9fc0', { plain: true });
        D.block(-.25, .78, sz * .95, 1.2, .55, .14, '#ffcc2e', { rz: -.25, top: YT }); } };
    duck(-.7, .05, 1.2, -.45); duck(1.75, .55, .36, -.25); duck(2.55, -.35, .32, -.1); duck(3.0, .55, .28, -.35);
    const tub = B.mesh(mat, 'p-giant-tub'), ducks = D.mesh(mat, 'p-giant-ducks'); tub.castShadow = ducks.castShadow = true; tub.receiveShadow = true;
    const dg = new T.Group(); dg.add(ducks); root.add(tub); root.add(dg);
    return { root, foam: new T.Vector3(2.0, 3.0, -.3), anim(t) { dg.position.y = .07 * Math.sin(t * 1.2); dg.rotation.y = .025 * Math.sin(t * .7); } };
  }

  // 大章鱼: a big lilac octopus rising out of a pink hot spring; eight tentacles arch out like bridges (children walk under them) and
  // land on the grass with curled tips; one holds up a giant bubble ring, one a sponge. groundY(x, z): local height of the ground.
  function giantOctopus(T, mat, groundY = () => 0) {
    const root = new T.Group(); root.name = 'p-giant-octopus';
    const geo = roundedBox(T, .16), Hd = batch(T, geo), Tn = batch(T, geo);
    const OC = '#b48be6', OCT = '#d3b8f7', OCD = '#9a70d4', SU = '#fbe3f0';
    Hd.block(0, .7, 0, 3.1, 1.6, 2.9, OC, { top: OCT, low: .85 }); Hd.block(0, 2.0, -.1, 3.3, 1.5, 3.1, OC, { top: OCT });
    Hd.block(0, 3.15, -.2, 2.9, 1.1, 2.7, OC, { top: OCT }); Hd.block(0, 3.85, -.3, 2.1, .6, 2.0, OC, { top: OCT }); Hd.block(0, 4.2, -.35, 1.2, .3, 1.1, OCT);
    [[-.9, 3.71, -.7, .34], [.75, 3.71, .25, .3], [.25, 4.36, -.5, .26], [-.5, 3.71, .45, .22], [1.0, 3.71, -.9, .24]].forEach(([x, y, z, s]) => Hd.block(x, y, z, s, .03, s * .9, OCD, { plain: true }));
    for (const s of [-1, 1]) { Hd.block(s * 1.66, 2.3, -.5, .03, .34, .4, OCD, { plain: true }); Hd.block(s * 1.56, 1.0, .3, .03, .26, .3, OCD, { plain: true });
      eye(Hd, s * .74, 2.3, 1.47, .92, -s * .15, -.35); Hd.block(s * 1.22, 1.78, 1.47, .38, .16, .03, '#ff9cc4', { plain: true }); }
    Hd.block(0, 1.5, 1.47, .5, .08, .03, '#6b3f8f', { plain: true }); for (const s of [-1, 1]) Hd.block(s * .28, 1.56, 1.47, .1, .1, .03, '#6b3f8f', { plain: true });
    const chain = (pts, s0, s1) => {   // tentacle along a polyline: overlapping rounded segments, tapering, suckers underneath
      for (let i = 1; i < pts.length; i++) { const [x0, y0, z0] = pts[i - 1], [x1, y1, z1] = pts[i], dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dx, dy, dz), hz = Math.hypot(dx, dz);
        const t = i / (pts.length - 1), s = s0 + (s1 - s0) * t, yaw = Math.atan2(dx, dz), pitch = -Math.atan2(dy, hz);
        Tn.setBase(segAt(T, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, yaw, pitch)); Tn.block(0, 0, 0, s, s * .92, len * 1.35, i % 2 ? OC : '#bc95ea', { top: OCT, low: .82 });
        if (i % 2 === 0) Tn.block(0, -s * .47, 0, s * .45, .04, s * .45, SU, { plain: true }); }
      Tn.resetBase(); };
    const arch = (th, R2, h) => { const dx = Math.sin(th), dz = Math.cos(th), gy = groundY(dx * R2, dz * R2), pts = [];
      for (let i = 0; i <= 14; i++) { const t = i / 14, r = 1.25 + t * (R2 - 1.25); pts.push([dx * r, -.3 + t * (gy + .3 + .3) + 4 * h * t * (1 - t), dz * r]); }
      const [ex, ey, ez] = pts[pts.length - 1]; pts.push([ex + dx * .35, ey + .3, ez + dz * .35], [ex + dx * .3, ey + .6, ez + dz * .3], [ex + dx * .05, ey + .7, ez + dz * .05]);   // curled tip
      chain(pts, .95, .3); };
    const reach = (th, R2, h) => { const dx = Math.sin(th), dz = Math.cos(th), pts = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12, r = 1.25 + (R2 - 1.25) * Math.sin(t * Math.PI / 2); pts.push([dx * r, -.3 + (h + .3) * (1 - Math.cos(t * Math.PI / 2)), dz * r]); }
      chain(pts, .9, .34); return pts[pts.length - 1]; };
    [[.8, 5.4, 2.9], [-.8, 5.2, 2.6], [1.95, 6.3, 4.2], [-2.0, 6.1, 3.8], [2.8, 5.2, 3.2], [-2.85, 5.6, 3.4]].forEach(([th, R2, h]) => arch(th, R2, h));
    { const [x, y, z] = reach(-1.3, 2.8, 5.6), th = -1.3; Tn.setBase(segAt(T, x, y, z, th, 0));   // giant bubble ring held high
      Tn.block(0, .45, 0, .12, .9, .12, '#7cc0f5', { top: '#a8d8fa' }); ringOf(Tn, 0, 1.75, 0, .85, 18, '#ff8fc0', 'z'); Tn.resetBase(); }
    { const [x, y, z] = reach(1.35, 2.6, 4.4); Tn.setBase(segAt(T, x, y + .35, z, 1.35, .3)); Tn.block(0, 0, 0, 1.0, .6, .7, '#f6dc6a', { top: '#fbea9c' });   // a sponge
      for (const [a, b] of [[-.25, .1], [.2, -.15], [.05, .2]]) Tn.block(a, .31, b, .14, .02, .14, '#e3c24f', { plain: true }); Tn.resetBase(); }
    const head = Hd.mesh(mat, 'p-octopus-head'), arms = Tn.mesh(mat, 'p-octopus-arms'); head.castShadow = arms.castShadow = true; arms.receiveShadow = true;
    const hg = new T.Group(); hg.add(head); root.add(hg); root.add(arms);
    return { root, anim(t) { hg.position.y = .1 * Math.sin(t * 1.1); hg.rotation.z = .025 * Math.sin(t * .8); hg.rotation.y = .04 * Math.sin(t * .5); } };
  }

  window.YAYA_P_ART = { LAYOUT, C, pig, machine, mushroom, CAPS, octopusBath, whale, frogPad, swirlSnail, giantTub, giantOctopus };
})();
