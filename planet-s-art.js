/* S · 沙蛇星球 art helpers (NEW FILE). Loaded after planet-s.js, planet-t.js and round3-*.js, before app.js.
   - replaces the smooth low-poly baby snake NPC (嘶嘶) with a rounded-block one (green body, yellow stripes)
   - replaces S's decorate() (same return shape, so all game logic is unchanged) and moves the lesson crystal into open sand
   Gameplay, audio, quiz logic and texts of planet S are untouched. */
(() => {
  'use strict';
  const S = window.YAYA_PLANET_S;
  if (!S || !window.YayaRound3) return;
  function blockSnake(T) {
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
    const b = mk(), green = ['#6dbb4d', '#7ec958'], yellow = '#f3d54a';
    // coiled body: an S-shaped trail of rounded blocks with yellow stripes
    const n = 11;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), x = Math.sin(t * Math.PI * 1.7 + .4) * .42, z = -.55 + t * 1.0, w = .34 - t * .06 * 0 - (i === n - 1 ? .1 : 0);
      b.block(x, .17, z, w, .3, .3, i % 3 === 1 ? yellow : green[i % 2], 0);
    }
    for (let i = 0; i < 3; i++) b.block(0, .17 + .3 + i * .27, .52, .34, .28, .34, i === 1 ? yellow : green[i % 2], 0);   // neck rising to the head
    body.add(b.mesh());
    head.position.set(0, .98, .55);
    const h = mk();
    h.block(0, 0, 0, .66, .5, .6, '#79c453'); h.block(0, -.2, .08, .58, .12, .5, '#f6e7a4');
    for (const x of [-.17, .17]) { h.block(x, .08, .3, .15, .17, .09, '#33463a'); h.block(x - .025, .12, .35, .06, .06, .04, '#ffffff'); h.block(x * 1.5, -.08, .3, .14, .08, .06, '#f0a095'); }
    h.block(0, -.06, .32, .2, .05, .06, '#c64f4f');
    h.block(0, .27, -.02, .5, .12, .4, '#f3d54a');
    head.add(h.mesh());
    const tongue = new T.Mesh(new T.BoxGeometry(.05, .02, .22), new T.MeshBasicMaterial({ color: '#e5465a' })); tongue.position.set(0, -.12, .52); head.add(tongue);
    root.userData.kind = 'grandma';
    return { root, body, head };
  }
  function decorate(c) {
    const { THREE: T, scene, STAGE, place, obstacles } = c, root = new T.Group(); scene.add(root);
    const local = (x, z) => STAGE.group.localToWorld(new T.Vector3(x, STAGE.top, z)).normalize();
    const granny = blockSnake(T); place(granny.root, local(2, -1.75), STAGE.front); granny.root.scale.setScalar(1.15); root.add(granny.root); obstacles.push({ dir: local(2, -1.75), r: .5 });
    const base = new T.Mesh(new T.CylinderGeometry(1.3, 1.5, .12, 8), new T.MeshStandardMaterial({ color: '#f1d3a6', roughness: 1 })); place(base, local(.3, -1.6), STAGE.front, .025); root.add(base);
    const gem = window.YayaRound3Crystals ? window.YayaRound3Crystals.create(T, '', '#7ad9d6').group : S.crystal(T);
    gem.visible = false; gem.scale.multiplyScalar(.7); place(gem, local(.2, -1.7), STAGE.front, .6); root.add(gem);
    const basket = { group: base, slots: [], apples: [] };
    return { root, granny, basket, pie: gem, local };
  }
  S.snake = blockSnake; S.decorate = decorate;
  // the lesson crystal stands in open sand on the winding path in front of the stage (not behind the snake)
  if (S.planet && S.planet.spots) S.planet.spots = { ...S.planet.spots, s: [24, 224] };
})();
