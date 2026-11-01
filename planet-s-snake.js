/* S · 开着嘶嘶去吃东西：孩子在星球上直接当小蛇。
   点沙地 = 嘶嘶爬过去（复用玩家的走路和寻路）；点食物 = 听它的名字并爬过去。
   吃对 /s/ 开头的食物身子长一截，吃错会吐出来。五样吃完，身子盘成一个大 S。
   app.js 只需要 create(ctx) 一次，每帧调用 update(dt,time)，点击时把 targets() 加进射线目标。 */
(() => {
  'use strict';
  const DISTRACT = [{ word: 'apple', emoji: '🍎' }, { word: 'ant', emoji: '🐜' }, { word: 'cat', emoji: '🐱' }, { word: 'hat', emoji: '🎩' }];
  const SPACING = .4, BASE_SEGS = 5, GROW = 3;

  // emoji → 16×16 像素 → 两层小方块，和星球的像素立体风格一致
  const voxelCache = {};
  function pixels(emoji) {
    if (voxelCache[emoji]) return voxelCache[emoji];
    const S = 120, N = 24, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (/^\d$/.test(emoji)) {
      g.font = '900 112px "Arial Rounded MT Bold",Arial,sans-serif'; g.lineJoin = 'round';
      g.lineWidth = 16; g.strokeStyle = '#fff6e4'; g.strokeText(emoji, S / 2, S / 2 + 6);
      g.fillStyle = '#ef8a4c'; g.fillText(emoji, S / 2, S / 2 + 6);
    } else {
      g.font = '104px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.fillText(emoji, S / 2, S / 2 + 8);
    }
    const d = g.getImageData(0, 0, S, S).data, c = S / N, out = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let r = 0, gg = 0, b = 0, a = 0;
      for (let j = 0; j < c; j++) for (let i = 0; i < c; i++) {
        const k = ((y * c + j) * S + x * c + i) * 4, al = d[k + 3] / 255;
        r += d[k] * al; gg += d[k + 1] * al; b += d[k + 2] * al; a += al;
      }
      if (a / (c * c) < .42) continue;
      out.push({ x: x - (N - 1) / 2, y: (N - 1) / 2 - y, r: r / a / 255, g: gg / a / 255, b: b / a / 255 });
    }
    return (voxelCache[emoji] = out);
  }

  function create(ctx) {
    const { THREE: T, scene, player, SURF, arc, moveAlong, tangent, orient, surfaceRadius, navigation, obstacles, camera, sfx, burst, tween, wait, LOW_POWER } = ctx;
    const V3 = T.Vector3;
    const rb = window.YayaRound3 && window.YayaRound3.roundedBox ? window.YayaRound3.roundedBox(T, .16) : new T.BoxGeometry(1, 1, 1);
    const segMats = ['#6dbb4d', '#7ec958', '#f3d54a'].map(c => new T.MeshStandardMaterial({ color: c, roughness: .8 }));
    const voxGeo = new T.BoxGeometry(1, 1, 1), voxMat = new T.MeshStandardMaterial({ roughness: .75 });
    const glowMat = new T.MeshBasicMaterial({ color: '#fff1b8', transparent: true, opacity: .55, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const padMat = new T.MeshStandardMaterial({ color: '#f6dcae', roughness: 1 });

    let rig = null, segs = [], trail = [], foods = [], game = null;

    function buildRig() {
      const root = new T.Group(), headPivot = new T.Group(), parts = window.YAYA_PLANET_S.snake(T);
      const head = parts.head; head.parent && head.parent.remove(head);
      head.position.set(0, 0, 0); head.scale.setScalar(1.5);
      headPivot.position.set(0, .62, .05); headPivot.add(head); root.add(headPivot);
      head.traverse(o => { if (o.isMesh) o.castShadow = true; });
      // 脖子：两块方块把头和地面上的身子接起来
      for (let i = 0; i < 2; i++) { const m = new T.Mesh(rb, segMats[i ? 2 : 0]); m.scale.set(.52, .36, .5); m.position.set(0, .2 + i * .24, -.08 * i); m.castShadow = true; root.add(m); }
      const tongue = head.children.find(o => o.geometry && o.geometry.type === 'BoxGeometry');
      root.userData.kind = 'snake-s'; scene.add(root);
      return { root, headPivot, head, tongue };
    }
    function segCount() { return BASE_SEGS + game.eaten * GROW; }
    function addSeg(pop) {
      const i = segs.length, m = new T.Mesh(rb, segMats[i % 3 === 2 ? 2 : i % 2]);
      m.castShadow = true; m.userData.s = 1; m.userData.kind = 'snake-s'; scene.add(m); segs.push(m);
      if (pop) { m.userData.s = .01; tween(.35, k => { m.userData.s = .01 + .99 * (1 - Math.pow(1 - k, 3)) * (1 + .25 * Math.sin(k * Math.PI)); }); }
    }
    function syncSegs(pop) { while (segs.length < segCount()) addSeg(pop); }

    // 身子跟着头走过的路：记录一串地面点，每节按固定间距取点
    function pushTrail(force) {
      const p = player.dir.clone();
      if (!force && trail.length && arc(trail[0], p) < .08) return;
      trail.unshift(p);
      const need = Math.ceil((segCount() + 3) * SPACING / .08) + 10;
      if (trail.length > need) trail.length = need;
    }
    function seedTrail() {
      trail = [];
      const back = player.heading.clone().negate();
      for (let d = (segCount() + 3) * SPACING; d >= 0; d -= .08) trail.push(moveAlong(player.dir, back, d).normalize());
      trail.reverse();
    }
    function trailAt(dist) {
      let acc = 0;
      for (let i = 1; i < trail.length; i++) {
        const l = arc(trail[i - 1], trail[i]);
        if (acc + l >= dist) { const t = (dist - acc) / Math.max(l, 1e-6); return { dir: trail[i - 1].clone().lerp(trail[i], t).normalize(), back: trail[i] }; }
        acc += l;
      }
      const last = trail[trail.length - 1];
      return { dir: last.clone(), back: trail[trail.length - 2] || last };
    }
    function placeSeg(m, dir, fwd, i, n, time, moving) {
      const taper = i > n - 4 ? .55 + .15 * (n - i) : 1;
      const side = new V3().crossVectors(fwd, dir).normalize();
      const wiggle = moving ? Math.sin(time * 9 - i * .9) * .08 : Math.sin(time * 2 - i * .6) * .02;
      const d = moveAlong(dir, side, wiggle).normalize();
      m.position.copy(d).multiplyScalar(surfaceRadius(d) + .2 * taper);
      orient(m, d, fwd);
      const s = m.userData.s;
      m.scale.set(.56 * taper * s, .4 * taper * s, .5 * s);
    }

    // ---------- 食物 ----------
    function makeFood(card, correct) {
      const group = new T.Group(), float = new T.Group(); group.add(float);
      const model = window.YayaWordModels?.create(T, card.word, {lowPower:LOW_POWER});
      const cell=.12; let inst;
      if(model){ inst=model; float.add(model); }
      else {
        const px=pixels(card.emoji);inst=new T.InstancedMesh(voxGeo,voxMat,px.length*2);const m=new T.Matrix4(),col=new T.Color();
        px.forEach((p,i)=>{for(let l=0;l<2;l++){m.makeScale(cell*.96,cell*.96,cell*1.6);m.setPosition(p.x*cell,p.y*cell,(l-.5)*cell*1.6);inst.setMatrixAt(i*2+l,m);col.setRGB(p.r,p.g,p.b).convertSRGBToLinear().multiplyScalar(l?.78:1);inst.setColorAt(i*2+l,col);}});
        inst.castShadow=true;float.add(inst);
      }
      inst.userData.kind='snake-food'; float.position.y=model?1.12:2.0;
      const pad = new T.Mesh(new T.CylinderGeometry(.8, .9, .1, 10), padMat); pad.position.y = .04; pad.receiveShadow = true; group.add(pad);
      const ring = new T.Mesh(new T.RingGeometry(.92, 1.22, 28), glowMat.clone()); ring.rotation.x = -Math.PI / 2; ring.position.y = .1; group.add(ring);
      // 亮亮的圆底衬在后面，把图案从沙地里“托”出来；头顶一根光柱，远处也能看见
      const halo = new T.Mesh(new T.CircleGeometry(model?1.05:1.6, 28), new T.MeshBasicMaterial({ color: '#fff7df', transparent: true, opacity: .92, depthWrite: false, fog: false }));
      halo.position.set(0,model?.75:0,model?-.78:-cell*1.4); float.add(halo);
      const rim = new T.Mesh(new T.RingGeometry(model?1.05:1.6, model?1.15:1.78, 28), new T.MeshBasicMaterial({ color: correct ? '#ffd25a' : '#ffd25a', transparent: true, opacity: .95, depthWrite: false, fog: false }));
      rim.position.set(0,model?.75:0,model?-.77:-cell*1.3); float.add(rim);
      const beam = new T.Mesh(new T.CylinderGeometry(.32, .55, 16, 12, 1, true), new T.MeshBasicMaterial({ color: '#ffe07a', transparent: true, opacity: .45, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
      beam.position.y = 9.5; group.add(beam);
      group.userData.kind = 'snake-food';
      scene.add(group);
      const food = { card, correct, group, float, ring, inst, model, beam, halo, dir: null, heard: false, pulse: 0, gone: false };
      group.userData.food = food; inst.userData.food = food;
      return food;
    }
    function freeDir(dir) {
      for (const o of obstacles) if (arc(dir, o.dir) < (o.r || .4) + .9) return false;
      for (const o of ctx.avoid || []) if (arc(dir, o.dir) < o.r) return false;
      if (navigation) { navigation.plan(player.dir, dir, 0); if (!navigation.snapshot().found) return false; }
      // 看得见：镜头到食物、食物正上方都不能被沙丘、拱门、大沙蛇挡住
      const occ = ctx.occluders ? ctx.occluders() : [];
      if (occ.length) {
        const top = dir.clone().multiplyScalar(surfaceRadius(dir) + 1.6), ray = new T.Raycaster();
        const toCam = camera.position.clone().sub(top), far = toCam.length();
        ray.set(top, toCam.normalize()); ray.far = far;
        ray.set(top.clone().addScaledVector(dir, 7), dir.clone().negate()); ray.far = 7.2;
        if (ray.intersectObjects(occ, true).length) return false;
      }
      return true;
    }
    function spawnRound() {
      clearFoods();
      const card = game.cards.find(c => !game.done(c));
      if (!card) return;
      const k = game.eaten, picks = [card, DISTRACT[k % 4], DISTRACT[(k + 1) % 4], DISTRACT[(k + 2) % 4]];
      const order = [0, 1, 2, 3].sort(() => Math.random() - .5);
      const fwd = tangent(game.camFwd(), player.dir), spin = Math.random() * 90, angles = [0, 90, 180, 270].map(a => a + spin - 45);
      const used = [];
      order.forEach((pi, slot) => {
        const f = makeFood(picks[pi], pi === 0);
        let dir = null;
        for (let t = 0; t < 30 && !dir; t++) {
          const a = T.MathUtils.degToRad(angles[slot] + (Math.random() - .5) * 24 + (t > 12 ? (Math.random() - .5) * 120 : 0));
          const dist = 9 + Math.random() * 6 - (t > 20 ? 3 : 0);
          const cand = moveAlong(player.dir, fwd.clone().applyAxisAngle(player.dir, a), dist).normalize();
          if (used.some(u => arc(u, cand) < 6)) continue;
          if (freeDir(cand)) dir = cand;
        }
        dir = dir || moveAlong(player.dir, fwd.clone().applyAxisAngle(player.dir, T.MathUtils.degToRad(angles[slot])), 8).normalize();
        used.push(dir); f.dir = dir;
        f.group.position.copy(dir).multiplyScalar(surfaceRadius(dir));
        orient(f.group, dir, fwd);
        f.group.scale.setScalar(.01);
        tween(.5 + slot * .12, kk => f.group.scale.setScalar(.01 + .99 * (1 - Math.pow(1 - kk, 3))));
        foods.push(f);
      });
      game.onRound && game.onRound(card, k);
    }
    function disposeFoodPart(obj){obj.traverse(o=>{if(!o.isMesh||o.userData.wordModelShared)return;if(o.geometry!==voxGeo)o.geometry?.dispose();if(![voxMat,padMat,glowMat].includes(o.material))o.material?.dispose();if(o.isInstancedMesh)o.dispose();});}
    function removeFood(f, poof) {
      if (f.gone) return; f.gone = true;
      if (poof) burst(f.group.position.clone().addScaledVector(f.dir, 1.1), '#fff1b8', 10, .6);
      tween(.3, k => f.group.scale.setScalar(Math.max(.01, 1 - k))).then(() => { scene.remove(f.group); disposeFoodPart(f.group); });
    }
    function clearFoods() { foods.forEach(f => removeFood(f, false)); foods = []; }

    // ---------- 吃 ----------
    async function eat(f) {
      game.busy = true; ctx.stopRoute();
      const mouth = () => rig.head.getWorldPosition(new V3());
      if (f.correct) {
        const from = f.float.getWorldPosition(new V3());
        f.float.parent.remove(f.float); scene.add(f.float); f.float.position.copy(from); f.float.quaternion.copy(f.group.quaternion);
        f.ring.visible = false;
        await tween(.45, k => { f.float.position.lerpVectors(from, mouth(), k * k); f.float.scale.setScalar(1 - k * .9); rig.headPivot.rotation.x = -Math.sin(k * Math.PI) * .35; });
        scene.remove(f.float); disposeFoodPart(f.float); f.gone = true;
        // 吃掉以后，它的光柱和小沙台也一起收走
        tween(.35, k => f.group.scale.setScalar(Math.max(.01, 1 - k))).then(() => { scene.remove(f.group); disposeFoodPart(f.group); });
        sfx.pop(); burst(mouth(), '#ffe58a', 18, .9);
        foods.filter(o => o !== f).forEach(o => removeFood(o, true));
        foods = [];
        await game.onEat(f.card, game.eaten);
        if (!game) return;
        game.eaten = game.cards.filter(c => game.done(c)).length;
        syncSegs(true); sfx.sparkle && sfx.sparkle();
        if (game.eaten >= game.cards.length) { await coil(); finish(true); return; }
        await wait(.4);
        spawnRound();
      } else {
        // 吐出来：头往后一仰，食物跳回去一点
        sfx.boing && sfx.boing();
        const back = tangent(f.dir.clone().sub(player.dir), player.dir);
        const hop = moveAlong(f.dir, back, 1.4).normalize(), start = f.dir.clone();
        tween(.55, k => { const d = start.clone().lerp(hop, k).normalize(); f.dir.copy(d); f.group.position.copy(d).multiplyScalar(surfaceRadius(d) + Math.sin(k * Math.PI) * 1.2); });
        await tween(.5, k => { rig.headPivot.rotation.z = Math.sin(k * Math.PI * 4) * .3 * (1 - k); });
        f.heard = false;
        await game.wrong(f.card);
      }
      if (game) game.busy = false;
    }

    // ---------- 盘成大 S ----------
    async function coil() {
      game.coiling = true; ctx.stopRoute();
      const n = segs.length, up = player.dir.clone(), GAP = .62, BIG = 1.45;
      const fwd = tangent(game.camFwd(), up), right = new V3().crossVectors(fwd, up).normalize();
      const total = (n + 1) * GAP, r = total / (2 * (4 / 3) * Math.PI), half = total / 2;
      // 从右上角开始：上半圈逆时针，下半圈顺时针，按弧长均匀取点（镜头看过去是正的 S）
      const pathPt = s => {
        if (s <= half) { const a = T.MathUtils.degToRad(30) + s / r; return [r * Math.cos(a), r + r * Math.sin(a)]; }
        const a = T.MathUtils.degToRad(90) - (s - half) / r; return [r * Math.cos(a), -r + r * Math.sin(a)];
      };
      const atC = (c, s) => { const [x, y] = pathPt(s), f = tangent(fwd, c), rr = new V3().crossVectors(f, c).normalize(); return moveAlong(moveAlong(c, f, y).normalize(), rr, x).normalize(); };
      // 找一块空地：S 上每个点都不碰障碍、不压在台子上
      const occ = ctx.occluders ? ctx.occluders() : [], ray = new T.Raycaster();
      const clear = c => {
        const h0 = surfaceRadius(c);
        for (let s = -1; s <= total + 1; s += total / 18) {
          for (const side of [-.9, 0, .9]) {
            const d = moveAlong(atC(c, Math.max(0, Math.min(total, s))), right, side).normalize();
            for (const o of obstacles) if (arc(d, o.dir) < (o.r || .4) + .3) return false;
            for (const o of ctx.avoid || []) if (arc(d, o.dir) < o.r * .8) return false;
            if (Math.abs(surfaceRadius(d) - h0) > 1.3) return false;
            ray.set(d.clone().multiplyScalar(h0 + 9), d.clone().negate()); ray.far = 9.5;
            if (occ.length && ray.intersectObjects(occ, true).length) return false;
          }
        }
        return true;
      };
      let centre = null;
      const tries = [];
      for (const base of [up, ...(ctx.openSpots ? ctx.openSpots() : [])])
        for (const [f, x] of [[2 * r + 1, 0], [2 * r + 1, 2.5], [2 * r + 1, -2.5], [0, 0], [r, 4], [r, -4], [3 * r + 2, 0], [-2 * r - 1, 0]])
          { const bf = tangent(fwd, base), br = new V3().crossVectors(bf, base).normalize(); tries.push(moveAlong(moveAlong(base, bf, f).normalize(), br, x).normalize()); }
      for (const c of tries) if (clear(c)) { centre = c; break; }
      centre = centre || moveAlong(up, fwd, 2 * r + 1).normalize();
      const at = s => atC(centre, s);
      const from = segs.map(m => m.position.clone().normalize()), headFrom = player.dir.clone();
      const targets = segs.map((m, i) => at((i + 1) * GAP)), headTo = at(0);
      ctx.cameraShot({ lift: 1.6, zoom: .9, ahead: 0, focus: centre.clone().multiplyScalar(SURF) });
      sfx.whoosh && sfx.whoosh();
      await tween(2.4, k => {
        const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        segs.forEach((m, i) => {
          const kk = Math.min(1, Math.max(0, e * 1.3 - (i / n) * .3));
          const d = from[i].clone().lerp(targets[i], kk).normalize();
          const nxt = i ? segs[i - 1].position.clone().normalize() : player.dir;
          const sc = 1 + (BIG - 1) * kk;
          m.userData.s = sc;
          m.position.copy(d).multiplyScalar(surfaceRadius(d) + .2 * sc);
          orient(m, d, tangent(nxt.clone().sub(d), d));
          m.scale.set(.56 * sc, .4 * sc, .5 * sc * 1.25);
        });
        rig.root.scale.setScalar(1 + (BIG - 1) * e);
        player.dir.copy(headFrom.clone().lerp(headTo, e).normalize());
        player.heading.copy(tangent(at(0).clone().sub(at(.6)), player.dir));
      });
      game.coiled = true; game.big = BIG;
      // 地上亮起一条金色的 S，形状一眼就能认出来
      const steps = Math.ceil(total / .22), glow = new T.InstancedMesh(voxGeo, new T.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: .85, depthWrite: false }), steps * 3), mm = new T.Matrix4(), qq = new T.Quaternion(), basis = new T.Matrix4();
      let gi = 0;
      for (let i = 0; i < steps; i++) {
        const sAt = i / (steps - 1) * total, d = at(sAt), f = tangent(at(Math.min(total, sAt + .1)).clone().sub(at(Math.max(0, sAt - .1))), d), x = new V3().crossVectors(d, f);
        basis.makeBasis(x, d, f); qq.setFromRotationMatrix(basis);
        for (const off of [-.55, 0, .55]) {
          const p = moveAlong(d, x, off).normalize().multiplyScalar(surfaceRadius(d) + .03);
          mm.compose(p, qq, new V3(.24, .05, .24)); glow.setMatrixAt(gi++, mm);
        }
      }
      glow.count = 0; scene.add(glow); game.glow = glow;
      tween(1.2, k => { glow.count = Math.round(gi * k); });
      sfx.fanfare(); burst(centre.clone().multiplyScalar(SURF + 1), '#ffdc7a', 40, 1.4);
      segs.forEach((m, i) => setTimeout(() => { if (!game) return; tween(.3, k => { m.userData.s = BIG * (1 + .25 * Math.sin(k * Math.PI)); }); }, i * 60));
      // 互动：请孩子点一点盘成的大 S，听它的声音（12 秒没点就自己继续）
      if (game.onTapS) {
        game.waitTap = true;
        await game.onTapS(new Promise(res => { game.tapS = res; setTimeout(res, 12000); }));
        game.waitTap = false;
      }
      await game.onCoil();
      ctx.cameraShot(null);
    }

    function layoutBody(time, moving) {
      const n = segs.length;
      segs.forEach((m, i) => {
        const t = trailAt((i + 1) * SPACING);
        placeSeg(m, t.dir, tangent(trailAt(i * SPACING).dir.clone().sub(t.dir), t.dir), i, n, time, moving);
      });
    }
    // ---------- 每帧 ----------
    function update(dt, time) {
      if (!game) return;
      if (!game.coiling) {
        pushTrail();
        layoutBody(time, ctx.moving());
      } else if (game.coiled) {
        segs.forEach(m => { const s = m.userData.s, d = m.position.clone().normalize(); m.scale.set(.56 * s, .4 * s, .62 * s); m.position.copy(d).multiplyScalar(surfaceRadius(d) + .2 * s + Math.sin(time * 3 + m.id) * .02); });
      }
      rig.root.position.copy(player.obj.position);
      rig.root.quaternion.copy(player.obj.quaternion);
      rig.headPivot.position.y = .62 + (ctx.moving() ? Math.abs(Math.sin(time * 9)) * .05 : Math.sin(time * 2) * .02);
      if (rig.tongue) rig.tongue.scale.z = Math.sin(time * 5) > .6 ? 1.4 : .2;
      for (const f of foods) {
        if (f.gone) continue;
        f.float.position.y = (f.model?1.12:2.0) + Math.sin(time * 2 + f.dir.x * 7) * .1;
        if(f.model)f.model.rotation.y=time*.6;
        // 面朝镜头
        const toCam = tangent(camera.position.clone().sub(f.group.position), f.dir);
        orient(f.group, f.dir, toCam);
        const d = arc(player.dir, f.dir);
        f.pulse = Math.max(0, f.pulse - dt);
        f.ring.material.opacity = .35 + .25 * Math.sin(time * 3) + f.pulse * .6;
        f.beam.material.opacity = .38 + .12 * Math.sin(time * 2.4 + f.dir.y * 9);
        f.float.scale.setScalar(1 + f.pulse * .25);
        if (game.busy || game.coiling) continue;
        if (!f.heard && d < 3.4) { f.heard = true; f.pulse = 1; game.sound(f.card.word); }
        if (d < 1.1) { eat(f); break; }
      }
    }

    return {
      // done(card) 读存档判断吃没吃过；onEat 播音、描字母、存档；wrong 播“不是这个声音”；onCoil 盘成 S 以后说的话
      play(opts) {
        return new Promise(resolve => {
          game = { ...opts, eaten: 0, busy: false, coiling: false, coiled: false, resolve };
          game.eaten = game.cards.filter(c => game.done(c)).length;
          rig = buildRig(); ctx.setAvatarVisible(false);
          syncSegs(false); seedTrail(); layoutBody(0, false);
          spawnRound();
          if (game.eaten >= game.cards.length) coil().then(() => finish(true), e => { console.error(e); finish(true); });
          else game.finish = finish;
        });
      },
      tapFood(food) {
        if (!game || game.busy || game.coiling || food.gone) return;
        food.pulse = 1; food.heard = true; game.sound(food.card.word);
        ctx.routeTo(food.dir, .4);
      },
      targets() { return game && !game.coiling ? foods.filter(f => !f.gone).map(f => f.group) : game && game.waitTap ? segs.concat(rig ? [rig.root] : []) : []; },
      tapS() { if (!game || !game.waitTap || !game.tapS) return; const r = game.tapS; game.tapS = null; segs.forEach((m, i) => setTimeout(() => { if (game) { burst(m.position.clone(), i % 2 ? '#ffe58a' : '#c9ff9a', 4, .5); tween(.25, k => { m.userData.s = (game?.big || 1) * (1 + .3 * Math.sin(k * Math.PI)); }); } }, i * 45)); r(true); },
      update,
      get active() { return !!game; },
      debug() { return game && { eaten: game.eaten, busy: game.busy, coiling: game.coiling, coiled: game.coiled, segs: segs.length, foods: foods.length }; },
      end(ok) { finish(ok); },
    };
    function finish(ok) {
      if (!game) return;
      const g = game; game = null;
      clearFoods();
      segs.forEach(m => scene.remove(m)); segs = []; trail = [];
      if (g.glow) { scene.remove(g.glow); g.glow.material.dispose(); g.glow.dispose(); }
      if (rig) scene.remove(rig.root); rig = null;
      ctx.setAvatarVisible(true); ctx.cameraShot(null);
      g.resolve(ok);
    }
  }
  window.YayaSnakeRide = { create };
})();
