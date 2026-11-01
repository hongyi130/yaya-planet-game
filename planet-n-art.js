/* N · 月亮鸟巢星球 — art builders: 夜莺妈妈 (nightingale mother), the woven nest, the pointed twig-hut landmark, layout constants.
   Reuses YAYA_I_ART.makeBatch (vertex-colour merged rounded blocks). Loaded after planet-i-art.js, before planet-n.js. NEW FILE (phase 1). */
(() => {
  'use strict';
  // Layout in surface metres: x = right of the stage, a = away from the spawn camera (same frame as planets T / I / P).
  const LAYOUT = {
    spawnA: -4.1,
    nest: { x: 3.4, a: 12.5, r: 3.1 },          // the big nest hollow with the moon-egg cluster, front-right of the spawn
    bird: { x: 3.0, a: 3.6 },                   // 夜莺妈妈 perches on the nest rim, facing the spawn
    hut: { x: -7.4, a: 4.4, scale: 1.0 },       // tall pointed twig hut (N-peak), front-left: the landmark
  };
  const C = {
    twig: '#c98f58', twigTop: '#dcab74', twigDark: '#9a6440', twigLav: '#c4a6c9', twigLavTop: '#d8c2dc',
    straw: '#e2c99a', strawTop: '#f0dcb0', moss: '#8fca93', mossTop: '#a8dca6',
    feather: '#cdbde6', featherTop: '#e6dcf5', cream: '#f4ead8', creamTop: '#fffaf0',
    bird: '#a8899b', birdTop: '#bfa0b0', birdDark: '#8a6f82', belly: '#f1e2d2', bellyTop: '#fbf1e4', beak: '#f1b24a', eye: '#2a2033', eyeHi: '#ffffff', cheek: '#f3a7b8',
    egg: '#fff1b8', eggGlow: '#ffd86e',
  };
  const roundedBox = (T, b) => window.YayaRound3.roundedBox(T, b);
  const batch = (T, geo) => window.YAYA_I_ART.makeBatch(T, geo);

  // ---- 夜莺妈妈: a slender nightingale — warm brown back, cream belly, small round head, thin beak, long tail angled up, folded wings,
  //      big kind eyes. Smooth rounded blocks (no ring stacks). Local frame: ground y=0, facing +z; body + head groups. -------------
  function nightingale(T, o = {}) {   // v7: blocky Crossy-Road-style voxel nightingale (2 merged draws)
    const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .75, metalness: 0 });
    const root = new T.Group(); root.name = o.name || 'n-nightingale';
    const body = new T.Group(), head = new T.Group(); root.add(body);
    const sb = roundedBox(T, .12), B = batch(T, sb), H = batch(T, sb);
    const back = '#9a7480', backTop = '#b59ab8', wing = '#83667f', tail = '#a87366', belly = '#f7ead8', leg = '#f0a64a';
    for (const s of [-1, 1]) { B.block(s * .18, .12, .05, .1, .24, .1, leg); B.block(s * .18, .02, .14, .16, .04, .22, leg); }
    B.block(0, .62, 0, .92, .78, .98, back, { top: backTop });
    B.block(0, .55, .46, .7, .5, .12, belly, { top: belly }); B.block(0, .55, .47, .56, .64, .12, belly);
    for (const s of [-1, 1]) { B.block(s * .5, .66, -.08, .1, .52, .7, wing, { top: backTop }); B.block(s * .5, .5, -.42, .08, .26, .2, '#c9b3e0'); }
    B.block(0, .86, -.72, .5, .12, .7, tail, { rx: -.45, top: '#c48a72' }); B.block(0, 1.08, -1.05, .38, .1, .5, tail, { rx: -.7, top: '#c48a72' });
    body.add(B.mesh(mat, 'n-bird-body'));
    head.position.set(0, 1.0, .12); body.add(head);
    H.block(0, .36, 0, .76, .66, .74, back, { top: backTop }); H.block(0, .36, 0, .66, .76, .64, back, { top: backTop });   // stepped round head
    H.block(0, .2, .32, .46, .26, .14, belly); H.block(0, .28, .33, .3, .38, .12, belly);   // soft stepped cream face patch
    H.block(-.04, .8, .02, .12, .2, .12, backTop, { rz: .3 }); H.block(.06, .84, -.04, .1, .24, .1, '#c9b3e0', { rz: -.25 });   // little head tuft
    for (const s of [-1, 1]) { H.block(s * .19, .44, .37, .13, .15, .04, C.eye); H.block(s * .19, .44, .37, .1, .18, .04, C.eye); H.block(s * .16, .5, .395, .045, .045, .02, '#ffffff');
      H.block(s * .28, .26, .36, .12, .08, .04, C.cheek); H.block(s * .28, .26, .36, .09, .11, .04, C.cheek); }
    H.block(0, .3, .44, .14, .1, .14, '#f29a3a'); H.block(0, .28, .52, .08, .06, .06, '#e2852c');
    head.add(H.mesh(mat, 'n-bird-head'));
    root.scale.setScalar(o.scale || 1);
    return { root, body, head };
  }

  // ---- the nest: woven ring wall of twig blocks round a straw floor (local frame, centre at origin, ground y=0) ------------
  function nest(B, r) {
    const rows = [[.25, .96, 0], [.58, 1.04, .5], [.91, 1.08, 0], [1.24, 1.08, .5], [1.57, 1.04, 0], [1.88, .98, .5]];
    rows.forEach(([y, k, off], ri) => { const n = Math.round(2 * Math.PI * r * k / .72); for (let i = 0; i < n; i++) { const a = (i + off) / n * Math.PI * 2, rr = r * k;
      const col = (i + ri) % 3 === 0 ? C.twigLav : (i + ri) % 3 === 1 ? C.twig : C.straw, top = col === C.twigLav ? C.twigLavTop : col === C.twig ? C.twigTop : C.strawTop;
      B.block(Math.cos(a) * rr, y, Math.sin(a) * rr, .9, .34, .42, col, { ry: -a + Math.PI / 2 + (ri % 2 ? .28 : -.28), top, low: .88 }); } });
    // straw floor
    for (let i = 0; i < 3; i++) B.block(0, .5, 0, r * 1.75, .9, r * 1.75, i ? C.straw : C.strawTop, { ry: i * .52, top: C.strawTop });
    // a few cream feathers tucked into the rim
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + .3; B.block(Math.cos(a) * r * 1.05, 2.1, Math.sin(a) * r * 1.05, .2, .5, .08, C.cream, { ry: -a, rz: .5, top: C.creamTop }); }
  }

  // ---- the pointed twig hut / arch (N-peak): stacked rings tapering to a point with a round-topped doorway --------------
  function hut(B, s = 1) {
    const rows = 13;
    for (let i = 0; i < rows; i++) { const y = .25 + i * .5 * s, w = (2.9 - i * .2) * s, h = .5 * s;
      if (w < .3) break;
      const col = i % 2 ? C.twigLav : C.twig, top = i % 2 ? C.twigLavTop : C.twigTop;
      if (i < 5) { B.block(0, y, -w * .38, w, h, w * .24, col, { top }); for (const sx of [-1, 1]) B.block(sx * w * .38, y, 0, w * .24, h, w, col, { top }); }
      else for (let k = 0; k < 2; k++) B.block(0, y, 0, w, h, w, col, { top, ry: k * .785 });
    }
    // doorway frame: round arch in straw + inner shadow
    for (let i = 0; i < 9; i++) { const a = Math.PI * i / 8, rr = .62 * s; B.block(Math.cos(a) * rr, 1.55 * s + Math.sin(a) * rr, 1.12 * s, .26 * s, .26 * s, .3 * s, C.straw, { rz: a, top: C.strawTop }); }
    for (const sx of [-1, 1]) B.block(sx * .62 * s, .78 * s, 1.12 * s, .26 * s, 1.5 * s, .3 * s, C.straw, { top: C.strawTop });
    B.block(0, 1.0 * s, .6 * s, .95 * s, 2.0 * s, .1 * s, '#5d4a6c', { plain: true });
    // feathers + moss on the shoulders
    for (let i = 0; i < 7; i++) { const a = i * .9; B.block(Math.cos(a) * 1.2 * s, (2.6 + (i % 3) * .5) * s, Math.sin(a) * 1.2 * s, .22 * s, .6 * s, .08 * s, C.feather, { ry: -a, rz: .4, top: C.featherTop }); }
    B.block(0, 6.6 * s, 0, .2 * s, .5 * s, .2 * s, C.egg, { top: '#fff8d8' });   // a little glowing tip
  }

  window.YAYA_N_ART = { LAYOUT, C, nightingale, nest, hut };
})();
