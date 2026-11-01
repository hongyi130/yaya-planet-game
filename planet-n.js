/* N · 月亮鸟巢星球 — preview course: letter lesson, egg rolling and word cards, 夜莺妈妈 as the planet's NPC. Preview: ?preview=n01. NEW FILE. */
(() => {
  // 单词卡（WORLD-STORY）：nest 鸟巢、net 网、nap 小睡、nut 坚果、ten 十 — trace the learned n; introduce other letters through whole-word listening
  const NEST_WORDS = [['nest', '🪺', '鸟巢'], ['net', '🥅', '网'], ['nap', '😴', '小睡'], ['nut', '🥜', '坚果'], ['ten', '🔟', '十']].map(([word, emoji, zh]) => ({ word, emoji, zh, sayLetters: word === "nap" }));
  const WORD_CARDS = [{ id: 'w-nap', word: 'nap', emoji: '😴', zh: '小睡' }, { id: 'w-pin', word: 'pin', emoji: '📌', zh: '别针' }];   // 拼词：只用学过的字母 n a p t s i
  const TRACE_WORDS = NEST_WORDS.map(w => ({ ...w, id: 'nw-' + w.word }));
  // 任务一 认识 N n（找发光的字母水晶）；任务二 顺着 N / n 形状的树枝把月亮蛋滚回鸟巢；任务三 拼词 + 鸟巢单词卡；终章 十颗月亮蛋飞上天变成月亮
  const TASKS = [
    { type: 'lesson', icon: '💎', title: '找字母水晶<br><b>认识 N n</b>', voice: 'n01-task1', lines: [['我是<b>夜莺妈妈</b>。晚上好呀！', 'n01-g1'], ['我的<b>月亮蛋</b>滚出鸟巢啦，天空都变暗了。', 'n01-g2']] },
    { type: 'roll', icon: '🌙', title: '顺着树枝<br><b>滚月亮蛋</b>', voice: 'n01-task2', lines: [] },
    { type: 'blend', icon: '✨', title: '拼词和鸟巢单词卡<br><b>nap · pin</b>', voice: 'n01-task3', lines: [] }
  ];
  const planet = { ...YAYA_PLANET_A.planet, id: 'n01', code: 'N', name: '月亮鸟巢星球', theme: 'nest', vowel: '/n/', camera: { lift: 1.15, ahead: 2.4, dist: 9.5, portrait: { lift: 1.35, ahead: 10 } }, seed: 171, next: null, order: ['n'],
    letters: { n: { color: '#ac9bd4', freq: 622.25 }, a: { color: '#e8655a', freq: 587.33 }, s: { color: '#77bcb3', freq: 698.46 }, t: { color: '#70afc6', freq: 523.25 }, i: { color: '#9fc4ee', freq: 783.99 }, p: { color: '#f08fb0', freq: 659.25 } },
    reviewLetters: ['t', 'a', 's', 'i', 'p'], giftLetters: [], giftText: null, giftVoice: null, reviewText: null,
    spots: { n: [26, 60] }, clearSpots: [], tent: [52, -78], quizOthers: ['p', 't'], props: { tree: 0, treeHigh: 0, rocks: 0, stones: 0, plant: 0 },
    words: Object.fromEntries([...WORD_CARDS.map(w => [w.id, w.word]), ...TRACE_WORDS.map(w => [w.id, w.word]), ['roll-N', 'n'], ['roll-n', 'n'], ['roll-N2', 'n'], ['n-finale', 'moons']]),
    intro: '整颗星球是一个大鸟巢！<br>认识 <b>N n</b>，把滚出去的月亮蛋<br>一颗颗送回巢里。', introVoice: 'n01-intro', introSay: '欢迎来到<b>月亮鸟巢星球</b>！月亮蛋在发光呢！',
    done: { emoji: '🪺🌙✨', title: 'N n！nap · pin！', text: '月亮蛋都回家啦！你学会了 <b>N n</b>，<br>拼出了 <b>nap</b> 和 <b>pin</b>，<br>还读了 nest、net、nap、nut、ten 五个单词！', voice: 'n01-done' } };

  function decorate(c) {
    const { THREE: T, scene, place, obstacles, tangent, STAGE } = c, A = YAYA_N_ART, L = A.LAYOUT, SURF = (c.R || 16) + .7;
    const P = (x, a) => { const l = x / SURF, f = a / SURF; return new T.Vector3(Math.sin(l), Math.cos(l) * Math.cos(f), -Math.cos(l) * Math.sin(f)).normalize(); };
    const root = new T.Group(); root.name = 'n-decorate'; scene.add(root);
    const spawn = P(0, L.spawnA + .6);
    // 夜莺妈妈 perches on the nest rim, facing the spawn (the world lifts her onto the rim height)
    const bird = A.nightingale(T, { name: 'n-nightingale', scale: 1.5 });
    const at = P(L.bird.x, L.bird.a); place(bird.root, at, tangent(spawn.clone().sub(at), at)); root.add(bird.root); obstacles.push({ dir: at, r: .7 });
    const pie = new T.Group(); root.add(pie); pie.visible = false;
    const local = (x, z) => STAGE.group.localToWorld(new T.Vector3(x, STAGE.top, z)).normalize();
    const dummy = new T.Group(); dummy.visible = false; root.add(dummy);
    return { root, granny: bird, basket: { group: dummy, slots: [], apples: [] }, pie, local };
  }

  window.YAYA_PLANET_N = { planet, TASKS, WORD_CARDS, TRACE_WORDS, NEST_WORDS, WORD_GUIDES: ['full', 'full', 'dots', 'dots', 'start'], STATIONS: [],
    npcName: '夜莺妈妈', gameTitle: '滚月亮蛋', gameIcon: '🥚', wordTitle: '鸟巢单词卡', wordIcon: '🪺', wordsIntro: '把单词里缺少的字母描出来，再一起读一读。', wordsIntroVoice: 'n01-words',
    metaphors: ['像两根小柱子，中间搭着一条滑梯', '像一扇小拱门'], rewardText: '夜莺妈妈送你一颗<b>小月亮</b>！', rewardVoice: 'n01-reward', finishText: '太棒啦！十颗月亮蛋都飞上天变成了月亮！带着星朵，继续你的探索吧！',
    propModels: YAYA_PLANET_T.propModels, decorate };
})();
