/* P · 泡泡星球 — 戳泡泡、跳泡泡救糖糖、拼词和泡泡棒。 */
(() => {
  // 单词卡（方案第四节）：只有 pig 逐个字母读，其他整词读
  const BUBBLE_WORDS = [['pig', '🐷', '小猪', true], ['pen', '🖊️', '笔', false], ['pup', '🐶', '小狗', false], ['panda', '🐼', '熊猫', false], ['pizza', '🍕', '披萨', false]].map(([word, emoji, zh, sayLetters]) => ({ word, emoji, zh, sayLetters }));
  const WORD_CARDS = [{ id: 'w-tap', word: 'tap', emoji: '🚰', zh: '水龙头' }, { id: 'w-pan', word: 'pan', emoji: '🍳', zh: '平底锅' }];   // 拼词（不送礼物字母）
  const TRACE_WORDS = BUBBLE_WORDS.map(w => ({ ...w, id: 'pw-' + w.word }));
  const TASKS = [
    { type: 'lesson', icon: '🫧', title: '戳泡泡找水晶<br><b>认识 P p</b>', voice: 'p01-task1', lines: [['我是小猪<b>噗噗</b>，最爱洗泡泡澡啦！', 'p01-g1'], ['可是泡泡机“噗”地坏了，把我妹妹<b>糖糖</b>吹到天上去了！', 'p01-g2']] },
    { type: 'jump', icon: '🫧', title: '跳泡泡<br><b>救糖糖</b>', voice: 'p01-task2', lines: [] },
    { type: 'blend', icon: '✨', title: '拼词和泡泡单词卡<br><b>tap · pan</b>', voice: 'p01-task3', lines: [] }
  ];
  const planet = { ...YAYA_PLANET_A.planet, id: 'p01', code: 'P', name: '泡泡星球', theme: 'bubble', vowel: '/p/', camera: { lift: 1.15, ahead: 2.4, dist: 11 }, seed: 163, next: null, order: ['p'],
    letters: { p: { color: '#f08fb0', freq: 659.25 }, a: { color: '#e8655a', freq: 587.33 }, s: { color: '#77bcb3', freq: 698.46 }, t: { color: '#70afc6', freq: 523.25 }, i: { color: '#9fc4ee', freq: 783.99 }, n: { color: '#ac9bd4', freq: 622.25 }, c: { color: '#f4ca79', freq: 554.37 } },
    reviewLetters: ['t', 'a', 's', 'i', 'c', 'n'], giftLetters: [], giftText: null, giftVoice: null, reviewText: null,
    spots: { p: [26, 60] }, clearSpots: [], tent: [52, -78], quizOthers: ['i', 't'], props: { tree: 0, treeHigh: 0, rocks: 0, stones: 0, plant: 0 },
    words: Object.fromEntries([...Array.from({ length: 3 }, (_, i) => ['pop' + i, 'p']), ...BUBBLE_WORDS.map((w, i) => ['step' + i, w.word]), ...WORD_CARDS.map(w => [w.id, w.word]), ...TRACE_WORDS.map(w => [w.id, w.word]), ['p-finale', 'bubbles']]),
    intro: '天上飘满了大大小小的泡泡！<br>认识 <b>P p</b>，踩着泡泡跳上天，<br>帮噗噗救回妹妹糖糖。', introVoice: 'p01-intro', introSay: '欢迎来到<b>泡泡星球</b>！到处都飘着泡泡呢！',
    done: { emoji: '🐷🫧🌈', title: 'P p！tap · pan！', text: '泡泡机修好啦！你学会了 <b>P p</b>，<br>拼出了 <b>tap</b> 和 <b>pan</b>，<br>还读了 pig、pen、pup、panda、pizza 五个单词！', voice: 'p01-done' } };

  function decorate(c) {
    const { THREE: T, scene, place, obstacles, tangent, STAGE } = c, A = YAYA_P_ART, L = A.LAYOUT, SURF = (c.R || 16) + .7;
    const P = (x, a) => { const l = x / SURF, f = a / SURF; return new T.Vector3(Math.sin(l), Math.cos(l) * Math.cos(f), -Math.cos(l) * Math.sin(f)).normalize(); };
    const root = new T.Group(); root.name = 'p-decorate'; scene.add(root);
    const spawn = P(0, L.spawnA + .6);
    // 噗噗: towel on the head, rope with a bubble ring, blue-pink wand; faces the spawn
    const pupu = A.pig(T, { name: 'p-pupu', towel: true, rope: true, wand: true, scale: .95 });
    const at = P(L.pupu.x, L.pupu.a); place(pupu.root, at, tangent(spawn.clone().sub(at), at)); root.add(pupu.root); obstacles.push({ dir: at, r: .6 });
    // the broken bubble machine, turned so the horn leans away from the spawn and the tap faces the child
    const mac = A.machine(T); mac.root.scale.setScalar(L.machine.scale || 1); const md = P(L.machine.x, L.machine.a); place(mac.root, md, tangent(spawn.clone().sub(md), md)); root.add(mac.root); obstacles.push({ dir: md, r: 1.1 * (L.machine.scale || 1) });
    // lean the giant halfway back toward the spawn's "up" so it reads upright from the spawn camera (base plinth is deep enough to stay grounded)
    { const up = spawn.clone().normalize(), q = new T.Quaternion().setFromUnitVectors(md.clone().normalize(), up); q.slerp(new T.Quaternion(), .5); mac.root.quaternion.premultiply(q); }
    pupu.machine = mac;
    const pie = new T.Group(); root.add(pie); pie.visible = false;
    const local = (x, z) => STAGE.group.localToWorld(new T.Vector3(x, STAGE.top, z)).normalize();
    const dummy = new T.Group(); dummy.visible = false; root.add(dummy);   // basket / pie: phase-2 placeholders
    return { root, granny: pupu, basket: { group: dummy, slots: [], apples: [] }, pie, local };
  }

  window.YAYA_PLANET_P = { planet, TASKS, WORD_CARDS, TRACE_WORDS, BUBBLE_WORDS, WORD_GUIDES: ['full', 'full', 'dots', 'dots', 'start'], STATIONS: [],
    npcName: '小猪噗噗', gameTitle: '跳泡泡救糖糖', gameIcon: '🫧', wordTitle: '泡泡单词卡', wordIcon: '🫧', wordsIntro: '来看看泡泡单词卡，描一描开头的字母，读一读！', wordsIntroVoice: 'p01-words',
    metaphors: ['像一面小旗子', '像倒过来的棒棒糖'], rewardText: '噗噗和糖糖送你一根<b>彩虹泡泡棒</b>！', rewardVoice: 'p01-reward', finishText: '太棒啦！你学会了新字母，还拼出了两个小单词！带着星朵，继续你的探索吧！',
    propModels: YAYA_PLANET_T.propModels, decorate };
})();
