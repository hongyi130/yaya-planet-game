/* N · moon-egg rolling. Preserve the v8 branch art; progress follows arc length. */
(() => {
  'use strict';
  const SHAPES = {
    N: [[.22, .86], [.22, .16], [.78, .86], [.78, .16]],
    n: [[.3, .86], [.3, .42], 'arc', [.7, .42], [.7, .86]]
  };
  function sample(shape) {
    const raw = SHAPES[shape], pts = [];
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] === 'arc') { const a = raw[i - 1], b = raw[i + 1], cx = (a[0] + b[0]) / 2, r = (b[0] - a[0]) / 2; for (let k = 1; k < 40; k++) { const t = Math.PI - k / 40 * Math.PI; pts.push([cx + Math.cos(t) * r, a[1] - Math.sin(t) * r * 1.0]); } continue; }
      const p = raw[i], q = pts[pts.length - 1];
      if (q) { const n = Math.ceil(Math.hypot(p[0] - q[0], p[1] - q[1]) / .01); for (let k = 1; k <= n; k++) pts.push([q[0] + (p[0] - q[0]) * k / n, q[1] + (p[1] - q[1]) * k / n]); } else pts.push(p);
    }
    const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, len, total: len[len.length - 1] };
  }

  const ROUNDS = [
    { shape: 'N', id: 'roll-N', intro: ['大写 <b>N</b>：像两根小柱子，中间搭着一条滑梯。', 'n01-roll-upper'], ok: ['滚回来啦！你认出了大写 <b>N</b>。', 'n01-roll-ok1'] },
    { shape: 'n', id: 'roll-n', intro: ['小写 <b>n</b>：像一扇小拱门。', 'n01-roll-lower'], ok: ['第二颗蛋也回家了！你认出了小写 <b>n</b>。', 'n01-roll-ok2'] },
    { shape: 'N', id: 'roll-N2', intro: ['还剩一颗月亮蛋！再滚一次大写 <b>N</b>。', 'n01-roll-last'], ok: ['三颗月亮蛋都回家啦！', 'n01-roll-done'] }
  ];
  function create(o) {
    const { wait, sfx, say, stars, has, mark, save, playWord, cameraShot, world, THREE: T, tween } = o;
    const game = { locked: false, riding: false, round: null, paused: !!o.read?.('yaya-n-roll') };
    let el, cv, ctx, tip, hint, replay, cur, currentRound, resolveRound;
    let prog = 0, dragging = false, activePointer = null, roll = 0, sparks = [], doneAnim = 0;
    let box = { x: 0, y: 0, s: 1 }, dpr = 1, frame = 0, lastFrame = 0, run = null, previousFocus;
    function layout() {
      if (!cv) return;
      const w = innerWidth, h = innerHeight, top = h < 500 ? 94 : 150, bottom = 65;
      const s = Math.max(100, Math.min(w * .86, (h - top - bottom) * .96));
      box = { x: (w - s) / 2, y: top + (h - top - bottom - s) / 2, s };
      dpr = Math.min(devicePixelRatio || 1, o.LOW_POWER ? 1.5 : 2);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
    }
    const scr = p => [box.x + p[0] * box.s, box.y + p[1] * box.s];
    function indexAt(fraction) {
      const distance = Math.max(0, Math.min(1, fraction)) * cur.total;
      let i = 0;
      while (i < cur.len.length - 1 && cur.len[i] < distance) i++;
      return i;
    }
    function at(fraction) {
      const i = Math.max(1, indexAt(fraction)), d = fraction * cur.total;
      const a = cur.pts[i - 1], b = cur.pts[i], t = (d - cur.len[i - 1]) / Math.max(1e-6, cur.len[i] - cur.len[i - 1]);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    function draw(time, dt) {
      if (!ctx || !cur) return; const W = innerWidth, H = innerHeight; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const P = cur.pts.map(scr), lw = Math.max(26, box.s * .075);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // branch: dark bark, warm top, little knots + leaves
      const stroke = (w, c, from = 0, to = P.length) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); for (let i = from; i < to; i++) i === from ? ctx.moveTo(...P[i]) : ctx.lineTo(...P[i]); ctx.stroke(); };
      stroke(lw + 8, 'rgba(60,35,30,.35)'); stroke(lw, '#9a6440'); stroke(lw * .45, '#c48a5c');
      for (let i = 12; i < P.length - 6; i += 22) { ctx.fillStyle = i % 44 ? '#a9d39a' : '#c9b3e0'; ctx.beginPath(); ctx.ellipse(P[i][0] + lw * .55, P[i][1] - lw * .3, lw * .32, lw * .18, -.6, 0, 7); ctx.fill(); }
      // glowing guide ahead of the egg (dashed moonlight)
      const k = indexAt(prog); ctx.setLineDash([2, lw * .7]); ctx.lineDashOffset = -time * 40; stroke(lw * .28, 'rgba(255,236,170,.95)', k, P.length); ctx.setLineDash([]);
      // start star + nest at the end
      const e = P[P.length - 1]; ctx.fillStyle = '#7d5034'; ctx.beginPath(); ctx.ellipse(e[0], e[1] + lw * .2, lw * 1.25, lw * .62, 0, 0, 7); ctx.fill();
      for (let i = 0; i < 9; i++) { ctx.strokeStyle = i % 2 ? '#d9a06c' : '#b97c4d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(e[0], e[1] + lw * .1 + i * .8, lw * 1.2 - i, lw * .5, (i - 4) * .06, Math.PI * .05, Math.PI * .95); ctx.stroke(); }
      // the egg (rolls: a highlight spins round)
      const p = scr(at(Math.min(1, prog))), r = lw * .62, rise = doneAnim ? -doneAnim * lw * .2 : 0;
      const g = ctx.createRadialGradient(p[0], p[1] + rise, r * .3, p[0], p[1] + rise, r * 2.6); g.addColorStop(0, 'rgba(255,226,140,.65)'); g.addColorStop(1, 'rgba(255,226,140,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1] + rise, r * 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff1c4'; ctx.beginPath(); ctx.ellipse(p[0], p[1] + rise, r * .85, r, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(p[0] + Math.cos(roll) * r * .45, p[1] + rise + Math.sin(roll) * r * .5, r * .2, 0, 7); ctx.fill();
      if (!prog && !doneAnim) { const s = .6 + .4 * Math.sin(time * 5); ctx.strokeStyle = `rgba(255,255,255,${s})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p[0], p[1], r * 1.6 + s * 6, 0, 7); ctx.stroke(); }   // "touch me" pulse
      sparks = sparks.filter(s => (s.t -= dt) > 0); for (const s of sparks) { ctx.fillStyle = `rgba(255,240,190,${s.t})`; ctx.beginPath(); ctx.arc(s.x, s.y -= 24 * dt, 3 + 3 * s.t, 0, 7); ctx.fill(); }
    }

    function persist() {
      if (currentRound && !has(currentRound.id)) o.write?.('yaya-n-roll', { id: currentRound.id, progress: prog });
    }
    function stopDrag() { dragging = false; activePointer = null; persist(); }
    function completeRound() {
      if (!resolveRound) return;
      prog = 1; dragging = false;
      // Commit the earned egg before narration, so leaving during praise cannot lose or duplicate stars.
      if (!has(currentRound.id)) { mark(currentRound.id); stars(2); save(); }
      o.write?.('yaya-n-roll', null);
      const finish = resolveRound; resolveRound = null; finish(true);
    }
    function onMove(x, y) {
      if (!dragging || doneAnim || !resolveRound) return;
      const tolerance = Math.max(56, box.s * .11), start = indexAt(prog), end = indexAt(Math.min(1, prog + .18));
      let best = start, distance = Infinity;
      for (let i = start; i <= end; i++) {
        const p = scr(cur.pts[i]), d = Math.hypot(p[0] - x, p[1] - y);
        if (d < distance) { best = i; distance = d; }
      }
      if (distance < tolerance) {
        const next = cur.len[best] / cur.total;
        if (next > prog) { roll += (next - prog) * 40; prog = next; sparks.push({ x, y, t: 1 }); if (Math.random() < .25) sfx.pop?.(); }
      }
      if (prog > .975) completeRound();
    }
    async function speak(html, key, then) {
      if (hint) hint.innerHTML = html;
      await say(html, { voice: key, then, speaker: 'grandma' });
    }
    function pause() {
      if (!run || run.cancelled) return;
      persist(); game.paused = true; run.cancelled = true; o.stopSpeech?.();
      const finish = resolveRound; resolveRound = null; finish?.(false);
      run.cancel();
    }
    function onKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); pause(); }
      if (event.key === 'Tab') {
        const buttons = [...el.querySelectorAll('button')];
        const next = (buttons.indexOf(document.activeElement) + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
        buttons[next].focus(); event.preventDefault();
      }
    }
    function open() {
      previousFocus = document.activeElement;
      el = document.createElement('section'); el.id = 'n-roll';
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'n-roll-tip');
      el.innerHTML = '<canvas aria-label="按住发光的月亮蛋，沿着字母树枝拖到鸟巢"></canvas><div class="n-roll-header"><div class="n-roll-actions"><button type="button" id="n-roll-pause">稍后继续</button><span id="n-roll-count"></span><button type="button" id="n-roll-replay">再听一次</button></div><h2 id="n-roll-tip"></h2><p id="n-roll-hint" aria-live="polite"></p></div><p class="n-roll-footer">按住发光的蛋，沿着金色光点慢慢滚</p>';
      cv = el.querySelector('canvas'); tip = el.querySelector('#n-roll-tip'); hint = el.querySelector('#n-roll-hint'); replay = el.querySelector('#n-roll-replay');
      document.body.appendChild(el); ctx = cv.getContext('2d'); layout();
      addEventListener('resize', layout); addEventListener('pagehide', persist); el.addEventListener('keydown', onKey);
      el.querySelector('#n-roll-pause').addEventListener('click', pause);
      replay.addEventListener('click', async () => {
        if (replay.disabled || !currentRound || !resolveRound) return;
        const button = replay; button.disabled = true;
        try { await speak(currentRound.intro[0], currentRound.intro[1], ['name-n', 'ls-n']); }
        finally { button.disabled = false; }
      });
      cv.addEventListener('pointerdown', e => {
        if (!resolveRound || activePointer !== null || e.button !== 0) return;
        const p = scr(at(prog));
        if (Math.hypot(p[0] - e.clientX, p[1] - e.clientY) < Math.max(60, box.s * .16)) {
          e.preventDefault(); activePointer = e.pointerId; dragging = true; cv.setPointerCapture?.(e.pointerId); onMove(e.clientX, e.clientY);
        }
      });
      cv.addEventListener('pointermove', e => { if (e.pointerId === activePointer) { e.preventDefault(); onMove(e.clientX, e.clientY); } });
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) cv.addEventListener(event, e => { if (e.pointerId === activePointer) stopDrag(); });
      lastFrame = 0;
      const loop = t => { if (!el) return; const dt = lastFrame ? Math.min(.05, (t - lastFrame) / 1000) : 0; lastFrame = t; draw(t / 1000, dt); frame = requestAnimationFrame(loop); };
      frame = requestAnimationFrame(loop); el.querySelector('#n-roll-pause').focus();
    }
    function close() {
      persist(); removeEventListener('resize', layout); removeEventListener('pagehide', persist); cancelAnimationFrame(frame);
      el?.remove(); el = cv = ctx = hint = tip = replay = null; dragging = false; activePointer = null;
      previousFocus?.focus?.({ preventScroll: true });
    }
    function prepareRound(round) {
      currentRound = round; game.round = round.shape; cur = sample(round.shape);
      const stored = o.read?.('yaya-n-roll');
      prog = stored?.id === round.id && Number.isFinite(stored.progress) ? Math.max(0, Math.min(.97, stored.progress)) : 0;
      doneAnim = 0; dragging = false; activePointer = null; sparks = [];
      tip.innerHTML = `顺着树枝滚：<b>${round.shape}</b> <small>${ROUNDS.indexOf(round) + 1}/3</small>`;
      el.querySelector('#n-roll-count').textContent = `${ROUNDS.filter(r => has(r.id)).length} / 3 颗回家`;
    }
    async function play() {
      if (game.locked) return false;
      if (ROUNDS.every(r => has(r.id))) return true;
      game.locked = true; game.paused = false; o.stopRoute?.();
      const session = { cancelled: false }; session.promise = new Promise(r => { session.cancel = r; }); run = session;
      const until = task => Promise.race([task, session.promise]);
      open(); prepareRound(ROUNDS.find(r => !has(r.id)));
      try {
        await until(speak('按住发光的月亮蛋，顺着树枝<b>滚</b>回鸟巢！', 'n01-roll-go'));
        for (const round of ROUNDS) {
          if (session.cancelled) return false;
          if (has(round.id)) continue;
          prepareRound(round);
          const rolling = new Promise(r => { resolveRound = r; });
          await until(speak(round.intro[0], round.intro[1], ['name-n']));
          if (session.cancelled || !await until(rolling)) return false;
          sfx.magic?.();
          for (let i = 0; i < 12 && !session.cancelled; i++) { doneAnim = (i + 1) / 12; await until(wait(.025)); }
          if (session.cancelled) return false;
          await until(playWord('ls-n'));
          if (session.cancelled) return false;
          await until(speak(round.ok[0], round.ok[1]));
        }
        return !session.cancelled && ROUNDS.every(r => has(r.id));
      } finally {
        close(); game.locked = false; game.round = null; resolveRound = null; currentRound = null; run = null;
        if (session.cancelled) say('已经记住你的进度啦，回来可以接着滚月亮蛋。', { voice: 'n01-roll-pause', speaker: 'grandma' });
      }
    }
    game.debugPath = () => cur ? cur.pts.map(scr) : null;
    game.debugState = () => ({ prog, dragging, doneAnim, has: !!resolveRound, round: game.round, id: currentRound?.id, dpr, egg: cur ? scr(at(prog)) : null });
    let finaleAspect = 0, finalizing = false;
    function frameFinale() {
      const nest = world.landmarks?.nest?.dir;
      if (!nest || !cameraShot) return;
      finaleAspect = innerWidth / innerHeight;
      const up = nest.clone().normalize(), side = new T.Vector3(1, 0, 0).cross(up).normalize();
      const distance = Math.max(38, 28 / Math.max(.4, finaleAspect));
      cameraShot({ position: up.clone().multiplyScalar(34).addScaledVector(side, distance), focus: up.clone().multiplyScalar(40), up, lift: 1, zoom: 1, ahead: 0 });
    }
    async function ending() {
      game.locked = true; o.stopRoute?.(); finalizing = true;
      document.body.classList.add('n-ending'); frameFinale();
      await say('月亮蛋都找回来了！看，鸟巢里的蛋要飞上天啦！', { voice: 'n01-rise', speaker: 'grandma' });
      sfx.fanfare?.(); await tween(6, k => world.eggsRise?.(k));
      await say('一颗、两颗……十个小月亮！天空又亮起来啦！', { voice: 'n01-moons', then: ['ten'], speaker: 'grandma' });
    }
    async function showReward() { await say('夜莺妈妈送你一颗<b>小月亮</b>！谢谢你！', { voice: 'n01-reward', speaker: 'grandma' }); }
    function endDone() { cameraShot?.(null); finalizing = false; document.body.classList.remove('n-ending'); game.locked = false; }
    function update() { if (finalizing && Math.abs(finaleAspect - innerWidth / innerHeight) > .01) frameFinale(); }
    return Object.assign(game, { play, ending, showReward, endDone, update });
  }
  window.YayaNGame = { create, SHAPES };
})();
