/* S · 任务一开场：沙地里藏着三块会唱 /s/ 的小水晶。孩子跟着光柱（和金色光点）一块块找到，
   三块集齐以后飞到一起，变成那块发光的大水晶，再开始认识 S s。
   app.js：create(ctx) 一次；每帧 update(dt,time)；guideTarget 先问 target()；点击时把 targets() 加进射线目标。 */
(() => {
  'use strict';
  const TOTAL = 3;
  function create(ctx) {
    const { THREE: T, scene, player, arc, moveAlong, tangent, surfaceRadius, orient, navigation, obstacles, STAGE, sfx, burst, tween, wait, read, write } = ctx;
    const V3 = T.Vector3;
    let found = Math.min(TOTAL, Number(read('yaya-s01-shards')) || 0);
    let shards = [], running = false, busy = false, orbit = [];

    // 固定的三个位置：绕着石台分散开，离得够远，要走一会儿才能找到
    function spots() {
      const out = [], up = STAGE.center, f0 = tangent(new V3(0, 0, -1), up);
      const plan = [[35, 16], [160, 19], [270, 14]];
      for (const [deg, dist] of plan) {
        let best = null;
        for (let t = 0; t < 24 && !best; t++) {
          const a = T.MathUtils.degToRad(deg + (t % 2 ? 1 : -1) * Math.ceil(t / 2) * 9), d = dist + (t > 12 ? -4 : 0);
          const cand = moveAlong(up, f0.clone().applyAxisAngle(up, a), d).normalize();
          if (obstacles.some(o => arc(cand, o.dir) < (o.r || .4) + 1.1)) continue;
          if (navigation) { navigation.plan(up, cand, 0); if (!navigation.snapshot().found) continue; }
          best = cand;
        }
        out.push(best || moveAlong(up, f0.clone().applyAxisAngle(up, T.MathUtils.degToRad(deg)), dist * .7).normalize());
      }
      return out;
    }
    function makeShard(dir, i) {
      const group = new T.Group(), float = new T.Group(); group.add(float);
      const gem = window.YayaRound3Crystals ? window.YayaRound3Crystals.create(T, '', ['#8fd8ff', '#c9a2ff', '#7ee0cf'][i % 3]).group : new T.Mesh(new T.OctahedronGeometry(.6), new T.MeshStandardMaterial({ color: '#8fd8ff' }));
      gem.scale.multiplyScalar(.55); float.add(gem); float.position.y = 1.2;
      const beam = new T.Mesh(new T.CylinderGeometry(.35, .6, 18, 12, 1, true), new T.MeshBasicMaterial({ color: '#9fd8ff', transparent: true, opacity: .5, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
      beam.position.y = 10; group.add(beam);
      const ring = new T.Mesh(new T.RingGeometry(.7, .95, 28), new T.MeshBasicMaterial({ color: '#dff3ff', transparent: true, opacity: .6, depthWrite: false, side: T.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = .06; group.add(ring);
      group.position.copy(dir).multiplyScalar(surfaceRadius(dir));
      orient(group, dir, tangent(new V3(0, 0, -1), dir));
      group.userData.kind = 's-shard'; scene.add(group);
      const sh = { dir, group, float, beam, ring, gem, got: false, sang: 0 };
      group.userData.shard = sh;
      return sh;
    }
    function hideCrystal() { const c = ctx.crystal(); if (c) { c.active = false; c.group.visible = false; } }

    function start() {
      if (running || found >= TOTAL) return false;
      running = true; hideCrystal();
      shards = spots().slice(found).map((d, i) => makeShard(d, i + found));
      return true;
    }
    async function collect(sh) {
      busy = true; sh.got = true; ctx.stopRoute();
      const from = sh.float.getWorldPosition(new V3());
      sh.float.parent.remove(sh.float); scene.add(sh.float); sh.float.position.copy(from);
      sfx.glass && sfx.glass(); burst(from, '#cfe9ff', 18, .9);
      tween(.5, k => { sh.beam.material.opacity = .5 * (1 - k); sh.ring.material.opacity = .6 * (1 - k); }).then(() => scene.remove(sh.group));
      orbit.push(sh);
      found++; write('yaya-s01-shards', found);
      ctx.onCount(found, TOTAL);
      await ctx.playWord('ls-s');
      if (found < TOTAL) { await ctx.say(found === 1 ? '找到一块小水晶！还有两块。' : '又找到一块！还剩最后一块。', { voice: 's01-shard-' + found, speaker: 'grandma' }); busy = false; return; }
      // 三块集齐：一起飞到大水晶的位置，合成发光的大水晶
      const c = ctx.crystal(), target = c.dir.clone().multiplyScalar(surfaceRadius(c.dir) + 1.6);
      ctx.faceTo(c.dir);
      const starts = orbit.map(o => o.float.position.clone());
      sfx.whoosh && sfx.whoosh();
      await tween(1.6, k => { const e = k * k * (3 - 2 * k); orbit.forEach((o, i) => { const lift = Math.sin(k * Math.PI) * 4; o.float.position.lerpVectors(starts[i], target, e).addScaledVector(c.dir, lift); o.float.rotation.y += .2; }); });
      orbit.forEach(o => scene.remove(o.float)); orbit = [];
      burst(target, '#ffe9a8', 34, 1.3);
      running = false; busy = false;
      ctx.activate();
      await ctx.say('三块小水晶都找到啦！看，它们变成了一块大水晶！', { voice: 's01-shard-3', speaker: 'grandma' });
    }

    function update(dt, time) {
      if (!running) {
        if (ctx.shouldRun() && found < TOTAL) start();
        return;
      }
      // 找到的小水晶绕着孩子转，告诉他已经收了几块
      orbit.forEach((o, i) => {
        const a = time * 1.6 + i * Math.PI * 2 / TOTAL, up = player.dir, side = tangent(new V3(0, 1, 0).cross(up).lengthSq() > .01 ? new V3(0, 1, 0).cross(up) : new V3(1, 0, 0), up), fw = new V3().crossVectors(up, side);
        const p = player.obj.position.clone().addScaledVector(up, 1.9 + Math.sin(time * 2 + i) * .1).addScaledVector(side, Math.cos(a) * .8).addScaledVector(fw, Math.sin(a) * .8);
        if (!busy || found < TOTAL) o.float.position.lerp(p, Math.min(1, dt * 6));
        o.float.rotation.y += dt * 2;
      });
      for (const sh of shards) {
        if (sh.got) continue;
        sh.float.position.y = 1.2 + Math.sin(time * 2 + sh.dir.x * 5) * .15;
        sh.float.rotation.y += dt * 1.2;
        sh.beam.material.opacity = .42 + .12 * Math.sin(time * 2.2 + sh.dir.z * 7);
        const d = arc(player.dir, sh.dir);
        // 走近的时候，小水晶自己唱一声 /s/
        sh.sang -= dt;
        if (d < 6 && sh.sang <= 0 && !busy) { sh.sang = 3.2; ctx.sing(); }
        if (!busy && d < 1.3) { collect(sh); break; }
      }
    }
    return {
      update,
      start,
      get active() { return running; },
      get found() { return found; },
      done: () => found >= TOTAL,
      target() {
        if (!running) return null;
        let best = null;
        for (const sh of shards) if (!sh.got && (!best || arc(player.dir, sh.dir) < arc(player.dir, best.dir))) best = sh;
        return best ? { dir: best.dir, pos: best.float.getWorldPosition(new V3()), letter: 's', stop: .6 } : null;
      },
      targets() { return running ? shards.filter(s => !s.got).map(s => s.group) : []; },
      tap(sh) { if (!busy && sh && !sh.got) ctx.routeTo(sh.dir, .3); },
      reset() { found = 0; write('yaya-s01-shards', 0); },
    };
  }
  window.YayaSShards = { create };
})();
