/* T · 乌龟岛星球 art helpers (NEW FILE). Loaded after planet-t.js, round3-*.js and planet-t-world.js, before app.js.
   - replaces the smooth low-poly NPC turtle Toto (托托) by a rounded-block one (same return shape, same 'grandma' kind)
   - replaces T's decorate() (same return shape, so all game logic is unchanged); the old lighthouse / plank dock are not used
   - moves the lesson crystal onto the open sand in front of the stage (same place as one answer crystal)
   Gameplay, audio, quiz logic and texts of planet T are untouched. */
(() => {
  'use strict';
  const TP = window.YAYA_PLANET_T;
  if (!TP || !window.YayaRound3) return;
  function blockTurtle(T) {
    const rb = window.YayaRound3.roundedBox(T, .2), mk = () => {
      const P = [], N = [], C = [], col = new T.Color(), m = new T.Matrix4(), q = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3(), nm = new T.Matrix3(), v = new T.Vector3(), n = new T.Vector3();
      const g = rb.index ? rb.toNonIndexed() : rb, pp = g.attributes.position, nn = g.attributes.normal;
      return {
        block(x, y, z, sx, sy, sz, hex, ry = 0) {
          q.setFromAxisAngle(new T.Vector3(0, 1, 0), ry); m.compose(p.set(x, y, z), q, s.set(sx, sy, sz)); nm.getNormalMatrix(m); col.set(hex);
          for (let i = 0; i < pp.count; i++) { v.fromBufferAttribute(pp, i).applyMatrix4(m); n.fromBufferAttribute(nn, i).applyMatrix3(nm).normalize(); P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(col.r, col.g, col.b); }
        },
        mesh() { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(C, 3)); geo.computeBoundingSphere(); const me = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: .85 })); me.castShadow = me.receiveShadow = true; return me; },
      };
    };
    const root = new T.Group(), body = new T.Group(), head = new T.Group(); root.add(body); body.add(head);
    const b = mk(), g1 = '#5fa04e', g2 = '#72b35b', g3 = '#8cc86a', skin = '#b3d56e', skin2 = '#9cc45e';
    // shell: three stacked rounded layers with a lighter scute pattern on top
    b.block(0, .2, 0, .78, .26, .92, '#4f8c44'); b.block(0, .42, -.02, .7, .26, .84, g1); b.block(0, .62, -.03, .52, .22, .66, g2);
    for (const [x, z] of [[0, 0], [-.19, .14], [.19, .14], [-.19, -.16], [.19, -.16]]) b.block(x, .76, z - .03, .17, .1, .17, g3);
    b.block(0, .06, 0, .74, .1, .9, '#e6dca0');   // pale belly rim
    for (const x of [-.34, .34]) for (const z of [-.3, .3]) b.block(x, .09, z, .24, .2, .26, skin2);
    b.block(0, .2, -.58, .16, .14, .26, skin2);   // tail
    body.add(b.mesh());
    head.position.set(0, .34, .6);
    const h = mk();
    h.block(0, .06, 0, .46, .4, .46, skin); h.block(0, -.04, .16, .34, .22, .3, skin);
    for (const x of [-.12, .12]) { h.block(x, .1, .21, .1, .14, .07, '#2f4a3a'); h.block(x - .02, .13, .25, .04, .04, .03, '#ffffff'); h.block(x * 1.9, -.04, .2, .09, .06, .05, '#f4a1a0'); }
    h.block(0, -.06, .3, .12, .035, .04, '#7a4a3a');
    head.add(h.mesh());
    root.userData.kind = 'grandma';
    return { root, body, head, legs: [] };
  }
  // 结尾奖励：半开的彩虹贝壳，里面一颗发光的珍珠
  function rainbowShell(T) {
    const rb = window.YayaRound3.roundedBox(T, .2), P = [], N = [], C = [], col = new T.Color(), m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), p = new T.Vector3(), sc = new T.Vector3(), nm = new T.Matrix3(), v = new T.Vector3(), n = new T.Vector3();
    const g0 = rb.index ? rb.toNonIndexed() : rb, pp = g0.attributes.position, nn = g0.attributes.normal;
    const block = (x, y, z, sx, sy, sz, hex, rx = 0, ry = 0, rz = 0) => {
      q.setFromEuler(e.set(rx, ry, rz)); m.compose(p.set(x, y, z), q, sc.set(sx, sy, sz)); nm.getNormalMatrix(m); col.set(hex);
      for (let i = 0; i < pp.count; i++) { v.fromBufferAttribute(pp, i).applyMatrix4(m); n.fromBufferAttribute(nn, i).applyMatrix3(nm).normalize(); P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(col.r, col.g, col.b); }
    };
    const rainbow = ['#ff6f8e', '#ff9a5c', '#ffd24a', '#8fd36a', '#4fc0e8', '#6f9cf0', '#a98bf0', '#e98be0', '#ff7fae'];
    // 扇贝：9 条彩虹棱，下半片平放，上半片绕着后面的铰链打开
    const YH = .1, ZH = -.32, NR = rainbow.length;
    for (const [lid, th] of [[0, 0], [1, -.75]]) {
      for (let i = 0; i < NR; i++) {
        const a = (i - (NR - 1) / 2) * .19, rr = .44, x = Math.sin(a) * rr, z = ZH + Math.cos(a) * rr, dy = lid ? .09 : 0, dz = z - ZH;
        const y2 = YH + dy * Math.cos(th) - dz * Math.sin(th), z2 = ZH + dy * Math.sin(th) + dz * Math.cos(th);
        block(x, y2, z2, .12, .1 + (i % 2) * .03, .84 - Math.abs(i - (NR - 1) / 2) * .05, rainbow[i], th, -a, 0);
      }
    }
    block(0, .1, -.34, .34, .16, .16, '#f6e2d8');   // hinge
    const mesh = new T.Mesh(new T.BufferGeometry(), new T.MeshStandardMaterial({ vertexColors: true, roughness: .55, emissive: new T.Color('#ffd6ec'), emissiveIntensity: .04 }));
    mesh.geometry.setAttribute('position', new T.Float32BufferAttribute(P, 3)); mesh.geometry.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); mesh.geometry.setAttribute('color', new T.Float32BufferAttribute(C, 3)); mesh.geometry.computeBoundingSphere(); mesh.castShadow = true;
    const pearl = new T.Mesh(new T.IcosahedronGeometry(.15, 1), new T.MeshStandardMaterial({ color: '#fff6fb', emissive: new T.Color('#ffe6f3'), emissiveIntensity: .45, roughness: .25 }));
    pearl.position.set(0, .26, -.02);
    const glow = new T.PointLight('#ffe9f6', .35, 3); glow.position.set(0, .6, 0);
    const root = new T.Group(); root.add(mesh, pearl, glow); root.scale.setScalar(1.6); root.userData.pearl = pearl;
    return root;
  }
  function decorate(c) {
    const { THREE: T, scene, STAGE, place, obstacles } = c, root = new T.Group(); scene.add(root);
    const local = (x, z) => STAGE.group.localToWorld(new T.Vector3(x, STAGE.top, z)).normalize();
    const granny = blockTurtle(T); place(granny.root, local(2, -1.75), STAGE.front); granny.root.scale.setScalar(1.5); root.add(granny.root); obstacles.push({ dir: local(2, -1.75), r: .55 });
    const base = new T.Group(); place(base, local(3.8, .5), STAGE.front, .05); root.add(base); base.visible = false;
    const gem = rainbowShell(T);
    gem.visible = false; place(gem, local(.2, -1.7), STAGE.front, .45); root.add(gem);
    return { root, granny, basket: { group: base, slots: [], apples: [] }, pie: gem, local };
  }
  TP.turtleBlock = blockTurtle; TP.decorate = decorate;
  // the lesson crystal stands on open sand in front of the stage; this is also where the "S" answer crystal later appears
  if (TP.planet) {
    const SURF = 16.7, x = 3.9, a = -3.7, l = x / SURF, f = a / SURF;
    const d = [Math.sin(l), Math.cos(l) * Math.cos(f), -Math.cos(l) * Math.sin(f)], polar = Math.acos(d[1]) * 180 / Math.PI;
    let az = Math.atan2(d[0], -d[2]) * 180 / Math.PI; if (az < 0) az += 360;
    TP.planet.spots = { ...TP.planet.spots, t: [+polar.toFixed(2), +az.toFixed(2)] };
  }
})();
