/* I · 雪花玻璃球星球：冰柱、水晶、滑冰垒家、拼词和极光夜晚。 */
(() => {
  const ICE_WORDS=[['igloo','🧊','冰屋'],['ink','🖋️','墨水'],['insect','🐞','小虫子'],['iguana','🦎','小蜥蜴'],['inchworm','🐛','小尺蠖']].map(([word,emoji,zh])=>({word,emoji,zh}));
  const WORD_CARDS=[{id:'w-tin',word:'tin',emoji:'🥫',zh:'小铁罐'},{id:'w-ant',word:'ant',emoji:'🐜',zh:'蚂蚁'}];
  const TRACE_WORDS=ICE_WORDS.map(w=>({...w,id:'iw-'+w.word,sayLetters:w.word==='ink'}));
  const TASKS=[
    {type:'lesson',icon:'❄️',title:'敲下三根冰柱<br><b>认识 I i</b>',voice:'i01-task1',lines:[['你好呀，我是小企鹅<b>冰冰</b>。','i01-g1'],['大风把我家的冰屋吹散了，我没有家了，呜呜。','i01-g2'],['屋檐下的冰柱里，藏着一个新字母的声音。听：','i01-g3','ls-i']]},
    {type:'slide',icon:'🦌',title:'坐驯鹿雪橇<br><b>捡冰砖，垒冰屋</b>',voice:'i01-task2',lines:[]},
    {type:'blend',icon:'✨',title:'拼词和冰雪单词卡<br><b>tin · ant</b>',voice:'i01-task3',lines:[]}
  ];
  const planet={...YAYA_PLANET_A.planet,id:'i01',code:'I',name:'雪花球星球',theme:'snow',vowel:'/ɪ/',seed:127,next:'p01',order:['i'],
    letters:{i:{color:'#9fc4ee',freq:698.46},a:{color:'#e8655a',freq:587.33},s:{color:'#77bcb3',freq:659.25},t:{color:'#70afc6',freq:523.25},n:{color:'#ac9bd4',freq:622.25}},
    reviewLetters:['t','a','s'],giftLetters:['n'],giftText:'冰冰送你一个新字母，听，它的声音是这样的：',giftVoice:'i01-gift',reviewText:null,
    spots:{i:[30,28]},clearSpots:[],tent:[52,-78],quizOthers:['a','s'],props:{tree:0,treeHigh:0,rocks:0,stones:0,plant:0},
    words:Object.fromEntries([...Array.from({length:3},(_,i)=>['ice'+i,'i']),...ICE_WORDS.map((w,i)=>['brick'+i,w.word]),...WORD_CARDS.map(w=>[w.id,w.word]),...TRACE_WORDS.map(w=>[w.id,w.word]),['i-finale','snowglobe']]),
    intro:'整个星球装在一个大玻璃球里！<br>认识 <b>I i</b>，坐驯鹿雪橇，<br>捡冰砖，帮冰冰找回温暖的家。',introVoice:'i01-intro',introSay:'欢迎来到<b>雪花星球</b>！看，整个星球都装在一个大玻璃球里！',
    done:{emoji:'🐧❄️🌌',title:'I i！tin · ant！',text:'冰冰的家垒好啦！你学会了 <b>I i</b>，<br>拼出了 <b>tin</b> 和 <b>ant</b>，<br>还读了 igloo、ink、insect、iguana、inchworm 五个单词！',voice:'i01-done'}};
  function decorate(c) {
    const { THREE: T, scene, place, obstacles, tangent, STAGE } = c, A = YAYA_I_ART, L = A.LAYOUT, SURF = (c.R || 16) + .7;
    const P = (x, a) => { const l = x / SURF, f = a / SURF; return new T.Vector3(Math.sin(l), Math.cos(l) * Math.cos(f), -Math.cos(l) * Math.sin(f)).normalize(); };
    const root = new T.Group(); scene.add(root);
    const peng = A.penguin(T); const at = P(L.penguin.x, L.penguin.a), toSpawn = tangent(P(0, L.spawnA + .6).sub(at), at);
    place(peng.root, at, toSpawn); root.add(peng.root); obstacles.push({ dir: at, r: .55 });
    const pie = new T.Group(); root.add(pie); pie.visible = false;
    const local = (x, z) => STAGE.group.localToWorld(new T.Vector3(x, STAGE.top, z)).normalize();
    const dummy = new T.Group(); dummy.visible = false; root.add(dummy);
    return { root, granny: peng, basket: { group: dummy, slots: [], apples: [] }, pie, local };
  }

  window.YAYA_PLANET_I={planet,TASKS,WORD_CARDS,TRACE_WORDS,ICE_WORDS,WORD_GUIDES:['full','full','dots','dots','start'],STATIONS:[],
    npcName:'企鹅冰冰',gameTitle:'雪橇垒冰屋',gameIcon:'🛷',wordTitle:'冰雪单词卡',wordIcon:'❄️',wordsIntro:'再来看看冰雪单词卡，描一描开头的字母，读一读！',wordsIntroVoice:'i01-words',
    metaphors:['像一根长长的冰柱','像一个小雪人，头顶有一颗雪球'],rewardText:'冰冰送你一个<b>小小的雪花玻璃球</b>，谢谢你帮我找回了家！',rewardVoice:'i01-reward',finishText:'太棒啦！你学会了新字母，还拼出了两个小单词！带着星朵，继续你的探索吧！',
    propModels:YAYA_PLANET_T.propModels,decorate};
})();
