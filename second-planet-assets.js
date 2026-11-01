// A-02 additions only. Existing letter sounds and word cards remain untouched.
(()=>{
const assets={"audio/cap.m4a":"runtime-audio/7317a2a698d64b8a.m4a","audio/map.m4a":"runtime-audio/354608cc19e7e9f7.m4a","voice/arrive-l02.m4a":"runtime-audio/3d18fa8c8b695d9d.m4a","voice/done-l01-next.m4a":"runtime-audio/d4845da2cd66f3ba.m4a","voice/done-l02.m4a":"runtime-audio/804cc39e7a7b4045.m4a","voice/l02-intro.m4a":"runtime-audio/bf823dfe12274183.m4a","voice/l02-review.m4a":"runtime-audio/f61dcf2cee019764.m4a","voice/reward-cap.m4a":"runtime-audio/485221b38944850f.m4a","voice/reward-dog.m4a":"runtime-audio/fc23b5850c3c5601.m4a","voice/reward-map.m4a":"runtime-audio/b879a96a7ac4188f.m4a"};
const voiceLines={
  "arrive-l02": "欢迎来到寻宝星球！",
  "l02-intro": "六个新字母藏在这里。跟着金色光点，找到它们，一起去寻宝吧！",
  "done-l01-next": "太棒啦！字母星球完成啦！寻宝星球亮起来了，点它就能飞过去。",
  "done-l02": "太棒啦！寻宝星球完成啦！猫星球亮起来了，点它就能飞过去。",
  "reward-dog": "一只小狗跑出来啦！它会陪你一起探险。",
  "reward-cap": "一顶棒球帽！戴上它，继续探险吧。",
  "reward-map": "一张藏宝地图！展开它，看看上面的路线吧。",
  "l02-review": "上一颗星球学过的两个字母，也会来帮你拼词哦！"
};
Object.assign(window.YAYA_ASSETS||(window.YAYA_ASSETS={}),assets);
Object.assign(window.YAYA_VOICE_LINES||(window.YAYA_VOICE_LINES={}),voiceLines);
})();
