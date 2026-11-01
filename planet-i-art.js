/* I · 雪花玻璃球星球 — shared art helpers (rounded-block batch builder, igloo / pine / penguin builders, layout constants).
   Shared by the I world and its playable adventure. Loaded after round3-world.js (needs YayaRound3.roundedBox at call time). */
(() => {
  'use strict';
  // Layout in surface metres: x = right of the stage, a = away from the spawn camera (same frame as planet T).
  const LAYOUT = {
    spawnA: -4.1,
    half: { x: -6.9, a: 0.8, r: 2.05 },          // the half-built igloo
    penguin: { x: -4.55, a: -1.15 },             // Bingbing, standing next to it, looking at the spawn
    igloos: [ { x: 7.4, a: 4.4, r: 2.1, face: -0.55 }, { x: 11.7, a: 0.9, r: 1.4, face: -1.0 }, { x: 3.6, a: 11.6, r: 1.75, face: -0.1 } ],
    lake: { x: -7.6, a: 8.8, rx: 3.9, rz: 2.7 },
    hills: [ { x: -11.6, a: -3.4, r: 2.6 }, { x: 9.8, a: -8.4, r: 2.6 } ],
    ring: { th0: 1.16, arch: Math.PI / 2 - .38 },        // the ice slide: a loop round the planet at polar angle th0 from the top; the start arch sits at azimuth `arch`
    bunting: [ [[4.8, 8.2], [10.2, 8.0]], [[-1.2, 8.8], [-1.8, 14.6]], [[6.0, -5.2], [11.6, -4.6]] ],   // 3 strings of coloured block flags between pole pairs
  };
  const roundedBox = (T, b) => window.YayaRound3.roundedBox(T, b);

  function makeBatch(T, geo) {
    const P = [], N = [], C = [];
    const m = new T.Matrix4(), nm = new T.Matrix3(), v = new T.Vector3(), n = new T.Vector3(), q = new T.Quaternion(), e = new T.Euler(), s = new T.Vector3(), p = new T.Vector3();
    const c0 = new T.Color(), c1 = new T.Color(), base = new T.Matrix4(), tmp = new T.Matrix4();
    const src = geo.index ? geo.toNonIndexed() : geo, sp0 = src.attributes.position, sn0 = src.attributes.normal;
    const plainG = new T.BoxGeometry(1, 1, 1).toNonIndexed(), sp1 = plainG.attributes.position, sn1 = plainG.attributes.normal;   // 12-triangle box for hidden / flat parts
    const api = {
      T, base: () => base,
      setBase(M) { base.copy(M); return api; },
      resetBase() { base.identity(); return api; },
      // axis-aligned-in-local block (centre x,y,z; size sx,sy,sz; optional yaw/pitch/roll; tint; top colour for up-facing vertices; shade = bottom darkening)
      block(x, y, z, sx, sy, sz, tint, o = {}) {
        e.set(o.rx || 0, o.ry || 0, o.rz || 0); q.setFromEuler(e);
        m.compose(p.set(x, y, z), q, s.set(sx, sy, sz)); tmp.multiplyMatrices(base, m); api.matrix(tmp, tint, o);
      },
      matrix(M, tint, o = {}) {
        const sp = o.plain ? sp1 : sp0, sn = o.plain ? sn1 : sn0; nm.getNormalMatrix(M); c0.set(tint); const hasTop = !!o.top; if (hasTop) c1.set(o.top);
        const lowK = o.low === undefined ? .86 : o.low;
        for (let i = 0; i < sp.count; i++) {
          v.fromBufferAttribute(sp, i).applyMatrix4(M); n.fromBufferAttribute(sn, i);
          const ny = n.y; n.applyMatrix3(nm).normalize();
          P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z);
          // baked soft tint in LOCAL block space: top lighter, bottom a little darker
          const k = ny < -.5 ? lowK : 1, cc = (hasTop && ny > .5) ? c1 : c0;
          C.push(cc.r * k, cc.g * k * (ny < -.5 ? 1 : 1), cc.b * (ny < -.5 ? Math.min(1.1, k * 1.08) : 1));
        }
      },
      count: () => P.length / 3,
      mesh(mat, name) {
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
        g.computeBoundingSphere(); const me = new T.Mesh(g, mat); me.name = name || 'i-batch'; return me;
      },
    };
    return api;
  }

  // ---- ice bricks / igloo (local frame: origin on the ground, entrance towards +z) --------------------------------------
  // Round 2: FINE bricks (about 0.44 x 0.30 x 0.34), many courses tapering up, bluish white with per-brick tint jitter; bricks on the
  // shaded side lean lilac-blue (#c9c6e6); the doorway is a warm glow (added to the optional `glow` batch, an unlit mesh).
  const ICE = ['#d9eafc', '#cde2fa', '#c3dbf7', '#d4e5fb', '#bdd7f5', '#dcebfd'], ICE_TOP = '#eef2fb', ICE_LOW = '#a2afd1', LILAC = '#8998c3';
  const SUN_DIR = [.2, .35, -1];   // same light direction the clouds use (towards the sunset)
  function hash(i, j, k) { const s = Math.sin(i * 12.9898 + j * 78.233 + k * 37.719) * 43758.5453; return s - Math.floor(s); }
  function mixHex(T, a, b, t) { return '#' + new T.Color(a).lerp(new T.Color(b), Math.max(0, Math.min(1, t))).getHexString(); }
  function brickTint(b, k, j, seed, nx, ny, nz) {   // palette pick + jitter + lilac on the shaded side (world normal vs the sun)
    const T = b.T, hv = hash(k, j, seed), c = ICE[Math.floor(hv * ICE.length)];
    const sun = Math.max(-1, Math.min(1, nx * SUN_DIR[0] + ny * SUN_DIR[1] + nz * SUN_DIR[2])) / 1.12;
    let t = mixHex(T, c, LILAC, Math.max(0, .24 - sun) * .94);
    const col = new T.Color(t); col.offsetHSL((hash(j, k, seed + 3) - .5) * .02, 0, (hash(k, seed, j) - .5) * .035); return '#' + col.getHexString();
  }
  function igloo(b, o) {
    const T = b.T, r = o.r, BW = .44, BH = .3, t = o.thick || .34, seed = o.seed || 1, door = o.door !== false;
    const K = o.rings || Math.round(r * Math.PI / 2 / BH), dphi = Math.PI / 2 / K;
    const fill = o.fill || null;   // per ring: fraction of the ring that has been built (half-built igloo); arc starts opposite the door
    const up = new T.Vector3(0, 1, 0), base3 = new T.Matrix3().setFromMatrix4(b.base());
    for (let k = 0; k < K; k++) {
      const phi = (k + .5) * dphi, circ = 2 * Math.PI * r * Math.cos(phi), n = Math.max(4, Math.round(circ / BW));
      const frac = fill ? fill[k] : 1; if (frac <= 0) continue; const keep = o.keep ? o.keep[k] : null; if (keep !== null && keep <= 0) continue;
      const rc = r - t / 2, h = r * dphi, off = (k % 2) * .5;
      for (let j = 0; j < n; j++) {
        const th = ((j + off) / n) * Math.PI * 2;   // 0 = towards the door (+z)
        if (keep !== null && keep !== undefined) { const dth = Math.min(th, Math.PI * 2 - th); if (dth > keep + (hash(k, j, seed) - .5) * .35) continue; }   // half-built: the side opposite the door is open
        else if (frac < 1) { const tt = o.mirror ? (Math.PI * 2 - th) : th, u = (((tt + Math.PI) % (Math.PI * 2)) / (Math.PI * 2)); if (u > frac + (hash(k, j, seed) - .5) * .06) continue; }
        const cx = Math.sin(th), cz = Math.cos(th), cp = Math.cos(phi), sp = Math.sin(phi);
        const hx = rc * cp * cx, hy = rc * sp, hz = rc * cp * cz;
        if (door && Math.abs(hx) < .6 && hy < 1.0 && hz > 0) continue;
        const er = new T.Vector3(cp * cx, sp, cp * cz), et = new T.Vector3(cz, 0, -cx), em = new T.Vector3(-sp * cx, cp, -sp * cz);
        const M = new T.Matrix4().makeBasis(et, em, er); M.setPosition(hx, hy, hz);
        const w = circ / n - .035, sc = new T.Matrix4().makeScale(w, h - .035, t);
        const full = new T.Matrix4().multiplyMatrices(b.base(), new T.Matrix4().multiplyMatrices(M, sc));
        const nw = er.clone().applyMatrix3(base3);
        const tint = k === 0 ? mixHex(T, brickTint(b, k, j, seed, nw.x, nw.y, nw.z), '#cfdcf4', .35) : brickTint(b, k, j, seed, nw.x, nw.y, nw.z);
        b.matrix(full, tint, { top: k >= K - 2 ? ICE_TOP : mixHex(T, tint, '#eef2fb', .32), low: .86, plain: !!o.plain });
      }
    }
    if ((!fill || fill[K - 1] > 0) && (!o.keep || o.keep[K-1] >= Math.PI)) b.block(0, r * .985 - .06, 0, .58, .34, .58, '#f6f9ff', { top: '#ffffff' });   // crown block
    if (door) {
      // entrance tunnel: a short barrel vault of fine bricks, three courses deep, round a warm-lit doorway
      const rows = 2, ra = .76, nb = 11;
      for (let row = 0; row < rows; row++) for (let j = 0; j < nb; j++) {
        const al = Math.PI * (j + .5) / nb, x = Math.cos(al) * ra, y = Math.sin(al) * ra;
        const z = r - .06 + .2 + row * .34, hv = hash(row, j, seed + 5);
        b.block(x, y, z, .38, .32, .32, mixHex(T, ICE[Math.floor(hv * ICE.length)], LILAC, x < 0 ? .0 : .1), { rz: al - Math.PI / 2 + Math.PI / 2, top: ICE_TOP, low: .88, plain: !!o.plain });
      }
      b.block(0, .02, r + .55, 1.35, .05, 1.5, '#e4edfb');                         // doorstep slab
      b.block(-.64, .4, r - .15, .2, .78, .3, '#e9f1fd'); b.block(.64, .4, r - .15, .2, .78, .3, '#dfe8f9');   // door jambs
      if (o.glow) {   // warm light in the doorway (unlit mesh) + a soft patch of light on the snow in front of it
        const gl = o.glow; gl.block(0, .5, r - .3, 1.0, 1.0, .12, '#ffb347', { plain: true, low: 1 });
        gl.block(0, 1.0, r - .3, .78, .22, .12, '#ffe6a8', { plain: true, low: 1 });
        o.glowHalo && o.glowHalo(r);
      }
    }
  }
  function looseBricks(b, list, seed) {   // [x,z,yaw,stack] - the SAME fine bricks as the igloo
    list.forEach(([x, z, yaw, st], i) => {
      for (let s = 0; s < st; s++) { const hv = hash(i, s, seed); b.block(x + (s ? (hv - .5) * .1 : 0), .15 + s * .31, z, .44, .30, .34, ICE[(i + s) % ICE.length], { ry: yaw + s * .25, top: '#ffffff', low: .86 }); }
    });
  }
  // ---- mint-green snow-capped cedar: 8 tapering tiers of small blocks (green sides, white snow on the tops), white tip, short brown trunk ----
  function pine(b, s, seed) {
    const G = ['#58b08c', '#64bb98', '#4fa682', '#5fb692'], wood = '#8b6b58', W = '#ffffff';
    b.block(0, .2 * s, 0, .3 * s, .44 * s, .3 * s, wood, { top: '#a58468' });
    const N = 8, step = .34 * s, hgt = .38 * s;
    let y = .36 * s;
    for (let i = 0; i < N; i++) {
      const hw = (1.12 - i * .13) * s, n = Math.max(6, Math.round(2 * Math.PI * hw / (.4 * s))), rot = hash(i, seed, 3) * 6.28, cs = G[i % G.length];
      const thick = Math.min(hw, .62 * s);
      for (let j = 0; j < n; j++) {
        const th = j / n * Math.PI * 2 + rot, ww = 2 * Math.PI * hw / n * 1.04, hv = hash(i, j, seed);
        b.block(Math.cos(th) * (hw - thick / 2), y + hgt / 2, Math.sin(th) * (hw - thick / 2), thick, hgt * (.92 + hv * .16), ww, mixHex(b.T, cs, '#9cd8bd', hv * .3), { ry: -th, top: W, low: .84, plain: true });
      }
      if (i === N - 1) b.block(0, y + hgt / 2, 0, .45 * s, hgt, .45 * s, G[0], { top: W, plain: true });   // fill the very top tier
      y += step;
    }
    b.block(0, y + .02 * s, 0, .34 * s, .3 * s, .34 * s, W, { top: W, ry: .4, plain: true });
    b.block(0, y + .30 * s, 0, .2 * s, .34 * s, .2 * s, W, { top: W, ry: .4, plain: true });   // white tip
    return y + .5 * s;
  }

  // ---- Bingbing the penguin (rounded blocks, origin between the feet, faces +z). Round 2: ~1.2x the girl, big cream face-to-belly block,
  //      big black eyes with highlights, pink cheeks, orange beak and two orange feet showing, bobble on the blue beanie, saturated red scarf ----
  function penguin(T, options = {}) {
    const geo = roundedBox(T, .13), tiny = roundedBox(T, .08);
    const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .9, metalness: 0 });
    const root = new T.Group(); root.name = 'i-bingbing';
    const body = new T.Group(), head = new T.Group(); root.add(body); body.add(head);
    const BLK = options.chick ? '#9296aa' : '#262a44', BLK2 = options.chick ? '#b2b4c2' : '#353a5c', CREAM = '#fff4de', ORG = '#ff8f1f', RED = '#e8262c', RED2 = '#c11d27', BLUE = '#3472dc', BLUE2 = '#2a58b4', BLUE3 = '#6aa4f6';
    const B = makeBatch(T, geo), H = makeBatch(T, geo), F = makeBatch(T, tiny);
    // feet first: two big orange feet stick out in front, under the body
    B.block(-.22, .08, .30, .36, .16, .56, ORG, { top: '#ffb04a', low: 1 }); B.block(.22, .08, .30, .36, .16, .56, ORG, { top: '#ffb04a', low: 1 });
    // body (chubby pear), black back and sides
    B.block(0, .62, 0, 1.0, .92, .80, BLK, { top: BLK2 });
    B.block(0, .40, -.02, 1.06, .50, .84, BLK, { top: BLK2 });
    B.block(0, .30, -.46, .30, .22, .22, BLK2);                                              // tail nub
    B.block(-.66, .70, .0, .18, .66, .42, BLK, { rz: .30 }); B.block(.66, .70, .0, .18, .66, .42, BLK, { rz: -.30 });   // flippers
    // the big cream belly: one tall block from the neck down to the feet, plus a rounder lower part
    B.block(0, .66, .38, .70, 1.0, .16, CREAM, { top: CREAM, low: 1 });
    B.block(0, .36, .36, .80, .42, .17, CREAM, { top: CREAM, low: 1 });
    // saturated red scarf: two knit bands + a long hanging end with fringe
    if (!options.wild) {
    B.block(0, 1.16, 0, 1.08, .20, .92, RED, { top: '#f45a52' }); B.block(0, 1.02, 0, 1.04, .14, .88, RED2);
    B.block(.34, .78, .48, .22, .64, .10, RED, { top: '#f45a52', low: 1 }); B.block(.34, .42, .49, .22, .16, .10, RED2, { low: 1 });
    for (const dx of [-.07, 0, .07]) B.block(.34 + dx, .30, .5, .05, .13, .05, RED, { low: 1 });
    }
    // head (origin at the neck, y = 1.20)
    H.block(0, .36, 0, 1.0, .72, .88, BLK, { top: BLK2 });
    H.block(0, .30, .44, .78, .56, .10, CREAM, { top: CREAM, low: 1 });                         // big cream face
    H.block(-.30, .40, .45, .28, .36, .10, CREAM, { low: 1 }); H.block(.30, .40, .45, .28, .36, .10, CREAM, { low: 1 });
    H.block(-.22, .42, .53, .20, .27, .07, '#14131f', { low: 1 }); H.block(.22, .42, .53, .20, .27, .07, '#14131f', { low: 1 });          // big black eyes
    H.block(-.255, .50, .575, .085, .10, .04, '#ffffff', { low: 1 }); H.block(.185, .50, .575, .085, .10, .04, '#ffffff', { low: 1 });   // highlights
    H.block(-.235, .33, .575, .05, .05, .04, '#ffffff', { low: 1 }); H.block(.205, .33, .575, .05, .05, .04, '#ffffff', { low: 1 });
    H.block(-.22, .62, .50, .20, .05, .06, '#262a44', { rz: -.38, low: 1 }); H.block(.22, .62, .50, .20, .05, .06, '#262a44', { rz: .38, low: 1 });   // worried brows
    H.block(-.40, .22, .50, .17, .12, .06, '#ff6f93', { low: 1 }); H.block(.40, .22, .50, .17, .12, .06, '#ff6f93', { low: 1 });         // pink cheeks
    H.block(0, .24, .56, .26, .15, .22, ORG, { top: '#ffb04a', low: 1 });                                                               // small orange beak
    // knitted beanie: cuff, two layers, rib bars, and a white bobble
    if (!options.wild) {
    H.block(0, .80, -.01, 1.06, .20, .94, BLUE3, { top: '#8ab8f8' });
    H.block(0, .99, -.01, .98, .22, .86, BLUE, { top: BLUE3 });
    H.block(0, 1.17, -.01, .78, .18, .68, BLUE, { top: BLUE3 });
    for (let i = -3; i <= 3; i++) H.block(i * .13, .99, .435, .05, .22, .03, BLUE2, { low: 1 });
    for (let i = -3; i <= 3; i++) H.block(i * .13, .80, .48, .055, .15, .03, BLUE2, { low: 1 });
    H.block(0, 1.42, 0, .40, .34, .40, '#ffffff', { top: '#ffffff', low: 1 });
    H.block(-.19, 1.34, 0, .24, .24, .24, '#f1f5ff'); H.block(.19, 1.34, 0, .24, .24, .24, '#f1f5ff'); H.block(0, 1.34, .19, .24, .24, .24, '#f1f5ff'); H.block(0, 1.34, -.19, .24, .24, .24, '#f1f5ff');
    }
    const bm = B.mesh(mat, 'i-bingbing-body'), hm = H.mesh(mat, 'i-bingbing-head'); bm.castShadow = true; hm.castShadow = true;
    body.add(bm); head.add(hm); head.position.set(0, 1.20 - .70, 0);   // keep the old pivot (.70) for the idle sway, shift the head blocks down by it
    hm.position.set(0, .70, 0);
    root.scale.setScalar(.65);
    return { root, body, head, flipperL: null, flipperR: null };
  }
  window.YAYA_I_ART = { LAYOUT, makeBatch, igloo, looseBricks, pine, penguin, hash };
})();
