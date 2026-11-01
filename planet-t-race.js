/* T · 龟兔赛跑（搬到星球上）：孩子陪着小乌龟托托沿着环岛沙砖跑道跑一圈。
   托托自己往前跑（routeTo 沿路点走，速度 = 走路 × 0.75），跑道上有 5 个岔口，每个岔口左右各一道积木拱门，
   门顶是可旋转的立体单词积木（不写文字）。托托跑近时把两个词各读一遍，孩子点 /t/ 开头的那道门（点门，或点屏幕左 / 右半边）。
   选对：托托穿过那道门、星星炸开、加速两秒；选错：那道门变灰、托托摇头，还在原地，再选一次。
   小兔子先跑在前面，第 2 个岔口以后在树下睡着。过终点后由 app.js 的 onFinish 让雨停、彩虹出现、大海龟醒来。
   接口仿照 planet-s-snake.js：create(ctx) 一次，play(opts) → Promise<boolean>，每帧 update(dt,time)，点击时把 targets() 加进射线目标，
   点到门调用 tapGate(gate)，点到别处（地面 / 天空）调用 tapSide(left)。 */
(() => {
  'use strict';
  const DISTRACT = [{ word: 'sun', emoji: '☀️', zh: '太阳' }, { word: 'cat', emoji: '🐱', zh: '小猫' }, { word: 'sock', emoji: '🧦', zh: '袜子' }, { word: 'apple', emoji: '🍎', zh: '苹果' }, { word: 'soup', emoji: '🍲', zh: '汤' }];
  const SPEED = .75, BOOST = 1.5, STOP_BEFORE = 7, ANNOUNCE_AT = 15, BUILD_AT = 34;   // 索引单位：跑道点间距约 0.4 米

  // 陀螺：木柄 + 青色圆盘 + 红色锥身（黄白条纹）+ 深色尖，画在 120×120 画布上再像素化
  function drawTop(g) {
    const poly = (pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
    poly([[53, 6], [67, 6], [67, 26], [53, 26]], '#a8693f');
    g.fillStyle = '#c98a55'; g.fillRect(53, 6, 5, 20);
    g.fillStyle = '#2fb7a4'; g.beginPath(); g.ellipse(60, 34, 46, 12, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7fe0cf'; g.beginPath(); g.ellipse(60, 31, 34, 6, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); [[16, 38], [104, 38], [67, 100], [53, 100]].forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
    g.fillStyle = '#ee5a4d'; g.fillRect(0, 36, 120, 70);
    g.fillStyle = '#ffd95a'; g.fillRect(0, 52, 120, 10); g.fillStyle = '#fff6e0'; g.fillRect(0, 74, 120, 8);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(26, 38, 10, 70);
    g.restore();
    poly([[54, 98], [66, 98], [60, 114]], '#4a3a46');
  }

  // emoji → 24×24 像素 → 小方块（同 planet-s-snake.js 的 pixels）
  const voxelCache = {};
  function pixels(emoji) {
    if (voxelCache[emoji]) return voxelCache[emoji];
    const S = 120, N = 24, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d', { willReadFrequently: true });
    if (emoji === '🪀') drawTop(g);   // 🪀 is a yo-yo: the word "top" gets a hand-drawn spinning top instead
    else {
    g.textAlign = 'center'; g.textBaseline = 'middle';
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
    const { THREE: T, scene, player, SURF, arc, moveAlong, tangent, orient, surfaceRadius, camera, sfx, burst, tween, wait, LOW_POWER, world } = ctx;
    const V3 = T.Vector3, TR = world.raceTrack, PTS = TR.points, M = PTS.length - 1;
    const rb = window.YayaRound3.roundedBox(T, .16), cube = new T.BoxGeometry(1, 1, 1);

    // ---- 小积木批处理：把一堆圆角方块合成一个带顶点色的网格 ----
    function mkBatch() {
      const P = [], N = [], C = [], col = new T.Color(), m = new T.Matrix4(), qq = new T.Quaternion(), p = new T.Vector3(), s = new T.Vector3(), nm = new T.Matrix3(), v = new T.Vector3(), n = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      const g = rb.index ? rb.toNonIndexed() : rb, pp = g.attributes.position, nn = g.attributes.normal;
      return {
        block(x, y, z, sx, sy, sz, hex, ry = 0) {
          qq.setFromAxisAngle(up, ry); m.compose(p.set(x, y, z), qq, s.set(sx, sy, sz)); nm.getNormalMatrix(m); col.set(hex);
          for (let i = 0; i < pp.count; i++) { v.fromBufferAttribute(pp, i).applyMatrix4(m); n.fromBufferAttribute(nn, i).applyMatrix3(nm).normalize(); P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(col.r, col.g, col.b); }
        },
        mesh(mat) {
          const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(C, 3)); geo.computeBoundingSphere();
          return new T.Mesh(geo, mat || new T.MeshStandardMaterial({ vertexColors: true, roughness: .8 }));
        },
      };
    }
    const dispose = obj => obj.traverse(o => { if ((o.isMesh || o.isInstancedMesh) && !o.userData.wordModelShared) { o.geometry && o.geometry.dispose(); const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(mm => mm && mm.dispose && mm.dispose()); } });
    const pointAt = k => { const i = Math.max(0, Math.min(M - 1, Math.floor(k))), f = Math.max(0, Math.min(1, k - i)); return PTS[i].clone().lerp(PTS[i + 1], f).normalize(); };
    const place = (obj, dir, fwd, lift = 0) => { obj.position.copy(dir).multiplyScalar(surfaceRadius(dir) + lift); orient(obj, dir, fwd); };

    // ---- 图卡：emoji 像素积木 + 白色圆角底 + 金边（面朝 -z，也就是朝着从后面跟着托托的镜头） ----
    const voxMat = new T.MeshBasicMaterial({ fog: false });
    function makeCard(emoji, cell, size, noPlate, word) {
      const model=word&&window.YayaWordModels?.create(T,word,{lowPower:LOW_POWER});
      if(model){const g=new T.Group();model.rotation.y=Math.PI;g.add(model);g.userData.model=model;return g;}
      const grp = new T.Group(), px = pixels(emoji), inst = new T.InstancedMesh(cube, voxMat.clone(), Math.max(1, px.length));
      const mm = new T.Matrix4(), col = new T.Color();
      px.forEach((p, i) => { mm.makeScale(cell * .97, cell * .97, cell * 1.5); mm.setPosition(-p.x * cell, p.y * cell, -cell * .9); inst.setMatrixAt(i, mm); col.setRGB(p.r, p.g, p.b).convertSRGBToLinear(); inst.setColorAt(i, col); });
      inst.count = px.length; inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      if (noPlate) { grp.add(inst); grp.userData.parts = [null, inst]; return grp; }   // gates carry the plate in their structure mesh (one draw call fewer)
      const b = mkBatch(); b.block(0, 0, .02, size + .26, size + .26, .1, '#ffd25a'); b.block(0, 0, -.03, size, size, .12, '#fffaf0');
      const plate = b.mesh(new T.MeshBasicMaterial({ vertexColors: true, fog: false }));
      grp.add(plate, inst); grp.userData.parts = [plate, inst];
      return grp;
    }

    // ---- 一道拱门（积木圆角，薄荷绿 / 粉紫），门顶是图卡 ----
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 4, 32, 32, 30); gr.addColorStop(0, 'rgba(255,240,170,.95)'); gr.addColorStop(1, 'rgba(255,240,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
    function makeGate(card, correct, side, dir, fwd, pillar) {
      const root = new T.Group(), b = mkBatch();
      for (const sx of [-1, 1]) { b.block(sx * .78, .8, 0, .3, 2.3, .32, pillar); b.block(sx * .78, 1.98, 0, .4, .16, .42, '#fff4d0'); b.block(sx * .78, -.18, 0, .52, .16, .52, '#f4e6c0'); }
      b.block(0, 2.08, 0, 1.86, .28, .36, pillar); b.block(0, 2.28, 0, .5, .14, .3, '#fff4d0');
      const hasModel=window.YayaWordModels?.has(card.word);
      if(hasModel){b.block(0,2.40,0,1.22,.17,.92,'#ffd25a');b.block(0,2.50,0,1.05,.08,.78,'#fffaf0');}
      else {b.block(0,3.45,.02,2.1,2.1,.1,'#ffd25a');b.block(0,3.45,-.03,1.84,1.84,.12,'#fffaf0');}
      const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .75, emissive: new T.Color('#ffe9a0'), emissiveIntensity: 0 });
      const struct = b.mesh(mat); struct.castShadow = false; root.add(struct);
      const float = makeCard(card.emoji, .075, 1.84, true,card.word); float.position.set(0, hasModel?2.54:3.45, 0); root.add(float);
      const ring = new T.Mesh(new T.PlaneGeometry(3.2, 3.2), new T.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = .14; root.add(ring);
      const hit = new T.Mesh(new T.BoxGeometry(2.3, 4.2, .6), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 2.0; root.add(hit);
      place(root, dir, fwd, 0);
      const gate = { card, correct, side, root, mat, float, ring, struct, hit, dir, glow: 0, grey: false, gone: false, born: 0 };
      root.userData.kind = 't-gate'; root.userData.gate = gate;
      root.scale.setScalar(.01); scene.add(root);
      tween(.5, k => { if (!gate.gone) root.scale.setScalar(.01 + .99 * (1 - Math.pow(1 - k, 3))); });
      return gate;
    }

    // ---- 小兔子（跑着的）和托托（玩家替身） ----
    function buildRabbit() {
      const g = new T.Group(), b = mkBatch(), cream = '#fff3e2', cream2 = '#f1e2cb', pink = '#f2a7a8';
      b.block(0, .42, 0, .5, .46, .72, cream); b.block(0, .56, .34, .44, .42, .4, cream);   // 身体 + 头
      for (const sx of [-1, 1]) { b.block(sx * .11, 1.0, .3, .13, .5, .12, cream, sx * .08); b.block(sx * .11, 1.02, .33, .06, .34, .05, pink, sx * .08); b.block(sx * .12, .6, .56, .08, .1, .05, '#4a3a38'); b.block(sx * .2, .1, .2, .18, .16, .34, cream2); b.block(sx * .2, .1, -.22, .2, .16, .34, cream2); }
      b.block(0, .5, .6, .12, .1, .07, '#e98d98'); b.block(0, .46, -.4, .22, .22, .22, '#ffffff');
      const m = b.mesh(); m.castShadow = true; g.add(m);
      return g;
    }
    function buildCrab() {
      const g = new T.Group(), b = mkBatch(), m1 = '#ee6a4e', m2 = '#f6a08a';
      b.block(0, .2, 0, .78, .32, .56, m1); b.block(0, .34, 0, .56, .14, .42, m2);
      for (const x of [-1, 1]) { b.block(x * .56, .3, .36, .3, .22, .3, m1, x * .3); b.block(x * .62, .32, .56, .32, .22, .2, m2); b.block(x * .2, .48, .2, .08, .18, .08, '#fff'); b.block(x * .2, .58, .22, .1, .1, .1, '#2a2230'); for (let k = 0; k < 3; k++) b.block(x * .5, .08, -.18 + k * .18, .3, .07, .08, m1, x * .5); }
      const m = b.mesh(); m.castShadow = true; g.add(m); g.scale.setScalar(1.25); return g;
    }
    function buildToto() {
      const t = window.YAYA_PLANET_T.turtleBlock(T); t.root.scale.setScalar(1.12); t.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      return t;
    }

    const zq = new T.Quaternion();
    let game = null, rig = null, rabbit = null, sleeper = null, finishSign = null, gates = [], hiddenBunny = null;
    const st = { lane: 0, laneX: 0, dodge: null, slow: 0, hold: false, holdT: 0, phase: 'idle', fork: 0, k: 0, boost: 0, shake: 0, cheer: 0, rk: 0, rabbitMode: 'lead', rabbitT: 0, announceDone: Promise.resolve(), pending: Promise.resolve(), idle: 0, said: {}, pass: null, finishing: false, count: 0 };

    const chipEl = () => ctx.chip && ctx.chip();
    const forkStopK = i => TR.gates[i].at - STOP_BEFORE;
    function nearestK(from, dir) {   // 跟着托托走：在窗口里找最近的跑道点
      let best = from, bd = -2; const hi = Math.min(M, from + 40);
      for (let i = Math.max(0, from - 4); i <= hi; i++) { const d = PTS[i].dot(dir); if (d > bd) { bd = d; best = i; } }
      return best;
    }

    // ---- 岔口：造两道门 ----
    function buildFork(i) {
      const f = game.forks[i]; if (f.gates) return;
      const tg = TR.gates[i], card = game.gates[i], other = DISTRACT[(i * 2 + game.salt) % DISTRACT.length], leftCorrect = f.leftCorrect;
      f.gates = [
        makeGate(leftCorrect ? card : other, leftCorrect, 'left', tg.left, tg.fwd, '#8fd9b6'),
        makeGate(leftCorrect ? other : card, !leftCorrect, 'right', tg.right, tg.fwd, '#d6a4e8'),
      ];
      gates.push(...f.gates);
    }
    function removeFork(i) {
      const f = game.forks[i]; if (!f || !f.gates) return;
      for (const g of f.gates) { g.gone = true; const r = g.root; tween(.45, k => r.scale.setScalar(Math.max(.01, 1 - k))).then(() => { scene.remove(r); dispose(r); }); }
      gates = gates.filter(g => !f.gates.includes(g)); f.gates = null;
    }
    async function announce(i) {
      const f = game.forks[i]; if (f.announced || !f.gates) return; f.announced = true;
      await st.pending;   // 上一个岔口的“就是……”还没说完就先等一下
      for (const g of (f.gates || [])) {   // 孩子选得快时，这个岔口的门可能已经收走了
        if (!game || g.gone) return;
        g.glow = 1.4; await game.sound(g.card.word); g.glow = Math.min(g.glow, .5); await wait(.2); if (!game) return;
      }
      if (!f.gates) return;
      for (const g of f.gates) if (!g.grey) g.glow = .35;
      if (i === 0 && !st.said.pick) { st.said.pick = 1; game.say && game.say('选哪道门呢？点一点它。', { voice: 't01-race-pick', speaker: 'grandma' }); }
    }

    // ---- 选门 ----
    function sideGate(left) { const f = game.forks[st.fork]; return f && f.gates && f.gates[left ? 0 : 1]; }
    function tapGate(gate) {
      if (!game || !gate || gate.gone) return;
      const f = game.forks[st.fork];
      gate.glow = 1.2;
      if (st.phase !== 'wait' || game.busy || gate.grey || !f || !f.gates || !f.gates.includes(gate)) { game.sound(gate.card.word); return; }   // 还没停好 / 变灰了：只重听
      choose(gate);
    }
    function tapSide(left) {
      if (!game || !game.started) return;
      if (st.dodge) {
        const dg = st.dodge, want = left ? -1 : 1;
        if (want === dg.side) {   // 点到螃蟹那一边：托托撞一下，还在原地等
          st.shake = 1.1; sfx.boing && sfx.boing(); burst(rig.root.position.clone().addScaledVector(player.dir, .6), '#fff2e0', 8, .6);
          game.say && game.say('这边有螃蟹哦，点另一边！', { voice: 't01-dodge-other', speaker: 'grandma', interrupt: true });
          return;
        }
        st.lane = want; st.hold = false; sfx.tick && sfx.tick(); return;
      }
      const g = sideGate(left); if (g) tapGate(g);
    }
    async function choose(gate) {
      const i = st.fork, f = game.forks[i]; game.busy = true; st.idle = 0;
      if (!gate.correct) {
        gate.grey = true; gate.glow = 0; st.shake = 1.1; gate.mat.color.set('#9a94a6'); gate.mat.emissiveIntensity = 0; if(gate.float.userData.model)gate.float.userData.model.userData.setMuted(true);else gate.float.userData.parts[1].material.color.set('#9a94a6');
        burst(gate.root.position.clone().addScaledVector(gate.dir, 1.4), '#d6d0e0', 12, .7); sfx.boing && sfx.boing(); f.wrong = true;
        if (game.onWrong) game.onWrong(gate.card); await wait(1.1);
        if (game) game.busy = false; return;
      }
      // 选对：星星炸开，托托穿门，加速两秒
      sfx.magic && sfx.magic(); gate.glow = 1.6;
      const pos = gate.root.position.clone().addScaledVector(gate.dir, 1.6);
      ctx.sparkle && ctx.sparkle(pos); burst(pos, '#ffe58a', 22, 1.1); burst(pos, '#ffffff', 10, .8);
      st.boost = 2; st.cheer = .8;
      st.pass = { gate, f, i, stage: 0 }; st.phase = 'pass';
    }

    // ---- 兔子 ----
    function rabbitSleep() {
      if (!game || st.rabbitMode !== 'lead') return; st.rabbitMode = 'toTree'; st.rabbitT = 0;
    }
    function rabbitNow(time, dt) {
      if (!rabbit) return;
      if (st.rabbitMode === 'asleep') return;
      const capK = st.fork >= 2 ? TR.sleep.at - 1 : (st.fork < 5 ? TR.gates[st.fork].at - 6 : M - 4);
      let target = Math.min(st.k + 15, capK); if (st.rabbitMode === 'toTree') target = TR.sleep.at;
      const sp = (st.rabbitMode === 'toTree' ? 14 : 9) * dt;   // 索引 / 秒
      const hopping = Math.abs(target - st.rk) > .3;
      if (hopping) st.rk += Math.sign(target - st.rk) * Math.min(Math.abs(target - st.rk), sp);
      if (st.rabbitMode === 'toTree' && Math.abs(target - st.rk) < .3) {
        // 拐进树下：横着挪到树旁，然后侧躺着睡着，头上冒 zz
        const from = pointAt(st.rk), to = TR.sleep.rabbit; st.rabbitT += dt;
        const k = Math.min(1, st.rabbitT / .8), d = from.clone().lerp(to, k).normalize();
        place(rabbit, d, tangent(to.clone().sub(from), d), Math.abs(Math.sin(k * Math.PI * 3)) * .2);
        if (k >= 1) {
          st.rabbitMode = 'asleep'; scene.remove(rabbit);
          sleeper = world.makeSleepBunny(); const fw = tangent(TR.sleep.rabbit.clone().sub(pointAt(TR.sleep.at)).negate(), TR.sleep.rabbit); place(sleeper, TR.sleep.rabbit, fw, 0); scene.add(sleeper);
          sfx.bubble && sfx.bubble(); burst(TR.sleep.rabbit.clone().multiplyScalar(surfaceRadius(TR.sleep.rabbit) + .8), '#fff6e6', 8, .4);
          game.say && game.say('咦，小兔子跑累了，在树下睡着啦！', { voice: 't01-rabbit-sleep', speaker: 'grandma' });
        }
        return;
      }
      const d = pointAt(st.rk), nxt = pointAt(st.rk + 1.5);
      place(rabbit, d, tangent(nxt.sub(d), d), hopping ? Math.abs(Math.sin(time * 11)) * .22 : 0);
    }

    // ---- 每帧 ----
    function update(dt, time) {
      if (!game) return;
      const el = chipEl(); if (el) { const txt = `托托赛跑 ${Math.min(5, st.fork)}/5`; if (el.textContent !== txt) el.textContent = txt; }
      // 托托跟着玩家的位置走，并摇摆
      rig.root.position.copy(player.obj.position); rig.root.quaternion.copy(player.obj.quaternion);
      // 躲螃蟹：托托往左 / 右挪一点（镜头还跟着跑道中间）
      st.laneX += (st.lane * .9 - st.laneX) * Math.min(1, dt * 8);
      if (Math.abs(st.laneX) > .002) rig.root.position.addScaledVector(new V3().crossVectors(player.heading, player.dir).normalize(), st.laneX);
      st.slow = Math.max(0, st.slow - dt);
      const moving = ctx.moving();
      rig.body.position.y = moving ? Math.abs(Math.sin(time * 8)) * .05 : Math.sin(time * 2) * .012;
      rig.body.rotation.z = moving ? Math.sin(time * 8) * .06 : 0;
      st.shake = Math.max(0, st.shake - dt); st.cheer = Math.max(0, st.cheer - dt);
      rig.head.rotation.y = st.shake > 0 ? Math.sin(st.shake * 22) * .6 * Math.min(1, st.shake * 2) : (rabbitNear() ? .5 : 0);
      rig.head.rotation.x = st.cheer > 0 ? -.35 * Math.sin(st.cheer * Math.PI / .8) : Math.sin(time * 1.3) * .03;
      rig.root.position.addScaledVector(player.dir, st.cheer > 0 ? Math.abs(Math.sin(st.cheer * Math.PI / .8)) * .35 : 0);
      st.boost = Math.max(0, st.boost - dt);
      ctx.setSpeed(SPEED * (st.boost > 0 ? BOOST : (rabbitNear() ? .6 : 1)) * (st.slow > 0 ? .5 : st.dodge ? .7 : 1));
      if (st.boost > 0 && moving && Math.floor(time * 7) !== st.splash) { st.splash = Math.floor(time * 7); burst(player.obj.position.clone().addScaledVector(player.dir, .05), '#cfefff', 4, .5); }
      // 门：漂浮、发光、面朝镜头的一面不用转（本来就朝向后面）
      for (const g of gates) {
        g.glow = Math.max(g.glow > .4 ? g.glow - dt * .6 : g.glow, g.grey ? 0 : .0);
        const pulse = g.grey ? 0 : Math.max(0, g.glow) * (.55 + .25 * Math.sin(time * 6));
        g.mat.emissiveIntensity = pulse; g.ring.material.opacity = g.grey ? 0 : Math.min(.85, g.glow * .6 + .12 * (st.phase === 'wait' ? 1 : 0) * (.5 + .5 * Math.sin(time * 3))); g.ring.visible = g.ring.material.opacity > .015;
        g.float.scale.setScalar(1 + (g.grey ? 0 : g.glow * .06));
        if(g.float.userData.model){g.float.userData.model.rotation.y=Math.PI+time*.6;g.float.position.y=2.54+Math.sin(time*1.8+(g.side==='left'?0:Math.PI))*.06;}
      }
      if (finishSign) {
        // 终点旗只在快到终点时出现（第 4 个岔口以后），开跑时不挡在镜头前
        finishSign.visible = st.fork >= 4;
        finishSign.position.copy(finishSign.userData.base).addScaledVector(TR.start, Math.sin(time * 1.8) * .1);
      }
      rabbitNow(time, dt);
      if (sleeper && sleeper.userData.zz) {   // 睡着的小兔：Z z 上下漂、慢慢呼吸，字面朝镜头
        const zz = sleeper.userData.zz; zz.position.y = zz.userData.baseY + Math.sin(time * 2.2) * .16; zz.scale.setScalar(1 + .06 * Math.sin(time * 2.2 + 1));
        sleeper.getWorldQuaternion(zq).invert(); zz.quaternion.copy(zq).multiply(camera.quaternion);
      }
      drive(dt, time);
    }
    function rabbitNear() { return st.rabbitMode === 'asleep' && arc(player.dir, TR.sleep.rabbit) < 4.2; }

    // ---- 躲螃蟹 ----
    function dodgeTick() {
      const dg = game.dodges && game.dodges.find(d => !d.done && d.after === st.fork - 1);
      if (!dg) return;
      const at = pointAt(dg.k), fw = tangent(pointAt(dg.k + 1).sub(at), at), right = new V3().crossVectors(fw, at).normalize();
      if (!dg.obj && st.k >= dg.k - 24) {
        dg.obj = buildCrab(); const d = c3(at, right, dg.side * .9); place(dg.obj, d, fw.clone().negate(), 0); scene.add(dg.obj);
        const s0 = dg.obj.scale.x; dg.obj.scale.setScalar(.01); tween(.4, k => { if (dg.obj) dg.obj.scale.setScalar(.01 + (s0 - .01) * k); });
      }
      if (dg.obj) { const d = c3(at, right, dg.side * .9 + Math.sin(performance.now() / 260) * .12); dg.obj.position.copy(d).multiplyScalar(surfaceRadius(d) + (dg.warned && !dg.done ? Math.abs(Math.sin(performance.now() / 150)) * .12 : 0)); }
      if (!dg.warned && st.k >= dg.k - 13) {
        dg.warned = true; st.dodge = dg;
        game.say && game.say('小心，前面有螃蟹！点另一边，躲开它！', { voice: 't01-dodge', speaker: 'grandma', interrupt: true });
      }
      // 托托停在螃蟹前面等孩子点；等太久再提醒一次
      if (dg.warned && !dg.done && st.lane !== -dg.side && st.k >= dg.k - 6) {
        if (!st.hold) { st.hold = true; st.holdT = 0; ctx.stopRoute(); }
        if (st.holdT > 9 && !dg.rehint) { dg.rehint = true; game.say && game.say('小心，前面有螃蟹！点另一边，躲开它！', { voice: 't01-dodge', speaker: 'grandma', interrupt: true }); }
      }
      if (st.k >= dg.k) {
        dg.done = true; st.dodge = null;
        const hit = false;   // 现在托托会停下来等孩子点对方向，所以过螃蟹时一定是躲开的
        if (hit) { st.shake = 1.1; st.slow = 1.6; sfx.boing && sfx.boing(); burst(rig.root.position.clone().addScaledVector(player.dir, .6), '#fff2e0', 10, .7); game.say && game.say('哎呀，撞到螃蟹啦！下次点另一边躲开。', { voice: 't01-dodge-hit', speaker: 'grandma' }); }
        else { st.cheer = .8; sfx.pop && sfx.pop(); burst(rig.root.position.clone().addScaledVector(player.dir, 1.0), '#ffe58a', 16, .9); game.say && game.say('躲开啦，真棒！', { voice: 't01-dodge-ok', speaker: 'grandma' }); }
        const crab = dg.obj, side = dg.side;
        tween(1.0, k => { if (!crab.parent) return; const d = c3(at, right, side * (.9 + k * 3)); crab.position.copy(d).multiplyScalar(surfaceRadius(d)); }).then(() => { scene.remove(crab); dispose(crab); if (dg.obj === crab) dg.obj = null; });
        setTimeout(() => { st.lane = 0; }, 900);
      }
    }
    const c3 = (at, right, off) => ctx.moveAlong ? ctx.moveAlong(at, right, off).normalize() : at.clone().addScaledVector(right, off / 17).normalize();

    // ---- 托托的行进状态机 ----
    function drive(dt, time) {
      if (game.busy && st.phase !== 'pass') return;
      if (st.phase === 'toStart') {
        if (!ctx.routing()) { if (arc(player.dir, PTS[0]) > .5) ctx.routeTo(PTS[0], 0); else { st.phase = 'run'; st.k = 0; } }
        return;
      }
      if (st.phase === 'run') {
        const i = st.fork, finishing = i >= 5, goalK = finishing ? M : forkStopK(i);
        st.k = nearestK(st.k, player.dir);
        dodgeTick();
        if (st.hold) { st.holdT += 1 / 30; return; }
        // 提前把门造出来、跑近岔口时自动读两个词
        if (!finishing) { if (st.k >= TR.gates[i].at - BUILD_AT) buildFork(i); if (st.k >= TR.gates[i].at - ANNOUNCE_AT && game.forks[i].gates) { st.announceDone = announce(i); } }
        if (st.k >= goalK - 1 && arc(player.dir, PTS[Math.min(M, goalK)]) < .7) {
          ctx.stopRoute();
          if (finishing) { st.phase = 'finish'; finishRace(); } else { st.phase = 'wait'; st.idle = 0; buildFork(i); st.announceDone = announce(i); ctx.faceTo(TR.gates[i].center); }
          return;
        }
        if (!ctx.routing()) ctx.routeTo(PTS[Math.min(goalK, st.k + 6)], 0);
        return;
      }
      if (st.phase === 'wait') {
        st.idle += dt;
        if (st.idle > 9 && !game.busy && !game.forks[st.fork].hinted) { game.forks[st.fork].hinted = true; game.say && game.say('选哪道门呢？点一点它。', { voice: 't01-race-pick', speaker: 'grandma' }); }
        return;
      }
      if (st.phase === 'pass') {
        const p = st.pass, tg = TR.gates[p.i];
        if (p.stage === 0) {
          if (!ctx.routing()) { if (arc(player.dir, p.gate.dir) > .35) ctx.routeTo(p.gate.dir, 0); else { p.stage = 1; p.gate.glow = 1; } }
          return;
        }
        if (p.stage === 1) {
          // 穿过门了：回调（播 ls-t、单词、中文意思、存档）不阻塞继续跑
          p.stage = 2; game.busy = false;
          const firstTry = !p.f.wrong; st.pending = Promise.resolve(game.onGate(game.gates[p.i], p.i, firstTry)).catch(e => console.error(e));
          st.fork = p.i + 1; st.phase = 'run'; st.k = nearestK(st.k, player.dir); st.count = st.fork;
          const doneI = p.i; setTimeout(() => game && removeFork(doneI), 1500);
          if (st.fork === 2) rabbitSleep();
          ctx.routeTo(PTS[Math.min(M, tg.at + 8)], 0);
        }
      }
    }

    async function finishRace() {
      game.busy = true;
      try {
        await st.pending;
        sfx.fanfare && sfx.fanfare(); ctx.sparkle && ctx.sparkle(player.obj.position.clone().addScaledVector(player.dir, 1.2)); burst(player.obj.position.clone().addScaledVector(player.dir, 1.2), '#ffe58a', 30, 1.3);
        st.cheer = .8; await wait(.8);
        // 镜头转向大海龟，让孩子看见雨停、彩虹和海龟醒来
        const head = world.landmarks.turtleHead, hp = head.object.getWorldPosition(new V3());
        const arch = world.landmarks.finish && world.landmarks.finish.object; const sgn = finishSign; if (arch) tween(.5, k => { arch.scale.setScalar(Math.max(.01, 1 - k)); if (sgn) sgn.scale.setScalar(Math.max(.01, 1 - k)); });   // 终点拱门先收起来，不挡镜头
        ctx.faceTo(hp.clone().normalize()); ctx.cameraShot(world.turtle.overview ? world.turtle.overview(camera.aspect) : { lift: 1.0, zoom: .8, ahead: 6, focus: player.obj.position.clone().lerp(hp, .45) });   // 机位看向大海龟的脸：睁眼、抬头、划鳍都在画面里
        await wait(.8);
        if (game.onFinish) await game.onFinish();
        await Promise.race([world.turtle.wake ? world.turtle.wake() : world.whenDry(), wait(10)]); await wait(.8);
        ctx.cameraShot(null); if (arch) tween(.6, k => arch.scale.setScalar(.01 + .99 * k));
      } catch (e) { console.error(e); }
      end(true);
    }

    function end(ok) {
      if (!game) return;
      { const a = world.landmarks.finish && world.landmarks.finish.object; if (a) a.scale.setScalar(1); }
      const g = game; game = null;
      for (const f of g.forks) if (f.gates) { f.gates.forEach(x => { scene.remove(x.root); dispose(x.root); }); f.gates = null; }
      gates = [];
      if (rig) { scene.remove(rig.root); dispose(rig.root); rig = null; }
      if (rabbit) { scene.remove(rabbit); dispose(rabbit); rabbit = null; }
      if (sleeper) { scene.remove(sleeper); dispose(sleeper); sleeper = null; }
      if (finishSign) { scene.remove(finishSign); dispose(finishSign); finishSign = null; }
      for (const d of g.dodges || []) if (d.obj) { scene.remove(d.obj); dispose(d.obj); d.obj = null; }
      st.dodge = null; st.lane = 0;
      if (hiddenBunny) { hiddenBunny.obj.scale.copy(hiddenBunny.scale); hiddenBunny = null; }
      ctx.setSpeed(1); ctx.setAvatarVisible(true); ctx.cameraShot(null); ctx.stopRoute(); ctx.refreshChip && ctx.refreshChip();
      st.phase = 'idle';
      g.resolve(ok);
    }

    return {
      // gates：5 张 /t/ 词卡；done(i)：读存档；onGate(card,i,firstTry)：播音、记进度；onWrong(card)：说“再听听”；onFinish：过终点后的演出；sound：重听单词；say：字幕
      play(opts) {
        return new Promise(resolve => {
          game = { ...opts, forks: opts.gates.map(() => ({ leftCorrect: Math.random() < .5 })), busy: false, started: true, salt: Math.floor(Math.random() * 7), resolve };
          // 岔口之间的螃蟹：第 1、2、4 个岔口后面各一只，挡在跑道的一边
          game.dodges = [0, 1, 3].filter(i => TR.gates[i + 1]).map(i => ({ after: i, k: Math.round((TR.gates[i].at + TR.gates[i + 1].at - STOP_BEFORE) / 2), side: Math.random() < .5 ? -1 : 1, obj: null, warned: false, done: false }));
          Object.assign(st, { lane: 0, laneX: 0, dodge: null, slow: 0, hold: false, holdT: 0 });
          const doneCount = opts.gates.filter((c, i) => opts.done(i)).length;
          Object.assign(st, { fork: doneCount, k: 0, boost: 0, shake: 0, cheer: 0, rabbitMode: 'lead', rabbitT: 0, pending: Promise.resolve(), announceDone: Promise.resolve(), idle: 0, said: {}, pass: null, count: doneCount });
          rig = buildToto(); scene.add(rig.root); ctx.setAvatarVisible(false);
          rabbit = buildRabbit(); scene.add(rabbit);
          const b = world.landmarks.bunny; if (b && b.object) { hiddenBunny = { obj: b.object, scale: b.object.scale.clone() }; b.object.scale.setScalar(.0001); }
          // 终点拱门上的大旗子
          finishSign = makeCard('🏁', .075, 1.8); place(finishSign, TR.start, TR.fwdAt(0), 0); finishSign.position.copy(TR.start).multiplyScalar(surfaceRadius(TR.start)); finishSign.position.addScaledVector(TR.start, 3.7); finishSign.userData.base = finishSign.position.clone(); scene.add(finishSign); finishSign.scale.setScalar(1);
          if (doneCount > 0) {
            // 中途退出再进来：从上一个岔口后面接着跑
            const k0 = Math.min(M - 2, TR.gates[doneCount - 1].at + 8); player.dir.copy(PTS[k0]); player.heading.copy(TR.fwdAt(k0)); st.k = k0; st.rk = Math.min(M, k0 + 12);
            if (doneCount >= 2) { st.rabbitMode = 'asleep'; scene.remove(rabbit); sleeper = world.makeSleepBunny(); const fw = tangent(TR.sleep.rabbit.clone().sub(pointAt(TR.sleep.at)).negate(), TR.sleep.rabbit); place(sleeper, TR.sleep.rabbit, fw, 0); scene.add(sleeper); }
            st.phase = 'run';
          } else { st.rk = 4; st.phase = 'toStart'; }
          ctx.faceTo(PTS[Math.min(M, st.k + 12)]);
        });
      },
      tapGate, tapSide,
      targets() { return game ? gates.filter(g => !g.gone).map(g => g.root) : []; },
      update,
      get active() { return !!game; },
      debug() { return game && { dodge: st.dodge ? st.dodge.side : 0, hold: st.hold, lane: st.lane, phase: st.phase, fork: st.fork, k: st.k, busy: game.busy, rabbit: st.rabbitMode, gates: gates.map(g => ({ side: g.side, word: g.card.word, correct: g.correct, grey: g.grey })), M }; },
      end,
    };
  }
  window.YayaTRace = { create };
})();
