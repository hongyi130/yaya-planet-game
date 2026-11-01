/* P phase 2: Qwen3-TTS / q-letter / seed 11053. Local AAC URLs keep startup memory small.
   Generated voice and verification records: validation/p-phase2/audio/. */
(() => {
  'use strict';
  const lines = {
  "p01-intro": "欢迎来到泡泡星球！到处都飘着泡泡呢！",
  "p01-g1": "我是小猪噗噗，最爱洗泡泡澡啦！",
  "p01-g2": "可是泡泡机噗地坏了，把我妹妹糖糖吹到天上去了！",
  "p01-task1": "先把泡泡里的水晶找回来吧。",
  "p01-pop-1": "噗！找到一块水晶！",
  "p01-pop-2": "噗！找到第二块水晶！",
  "p01-pop-3": "三块都找到啦！",
  "p01-big": "这是大写的字母，像一面小旗子。",
  "p01-small": "这是小写的字母，像倒过来的棒棒糖。",
  "p01-task2": "踩着泡泡跳上去，去救糖糖吧！",
  "p01-jump-go": "听一听，跳到声音开头和我名字一样的泡泡上。",
  "p01-jump-first": "跳上去啦！软软的！",
  "p01-jump-ok": "跳得真好！继续往上！",
  "p01-jump-no": "这个不是那个声音开头的，再试试！",
  "p01-rescue": "戳破大泡泡，把糖糖救出来！",
  "p01-saved": "糖糖得救啦！我们坐着泡泡飘回去吧。",
  "p01-task3": "你学过的字母，已经够拼出新单词啦！",
  "p01-tap": "水龙头修好啦，泡泡水流出来了！",
  "p01-words": "来看看泡泡单词卡，描一描开头的字母，读一读！",
  "p01-fixed": "泡泡机修好啦！一起来吹泡泡吧！",
  "p01-blow": "按住屏幕，吹一个大泡泡，松手让它飞走！",
  "p01-blow-done": "哇，满天都是泡泡！",
  "p01-reward": "送你一根彩虹泡泡棒，谢谢你救了糖糖！",
  "p01-done": "你学会了新字母，还拼出了两个新单词！",
  "p01-tangtang": "谢谢姐姐！",
  "p01-sky-pop": "噗！",
  "p01-go-npc": "快回去找小猪噗噗，领下一个任务吧！",
  "p01-welcome-last": "欢迎回来！噗噗和糖糖都在这里。下一颗星球还在路上，先在泡泡星球玩一玩吧！"
};
  const assets = Object.fromEntries(Object.keys(lines).map(key => ['voice/' + key + '.m4a', 'planet-p-audio/voice/' + key + '.m4a']));
  Object.assign(window.YAYA_ASSETS || (window.YAYA_ASSETS = {}), assets);
  Object.assign(window.YAYA_VOICE_LINES || (window.YAYA_VOICE_LINES = {}), lines);
})();
