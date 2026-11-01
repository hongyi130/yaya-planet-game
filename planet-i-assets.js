/* Existing I-planet recordings, referenced as local URLs to keep startup memory small. */
(() => {
  'use strict';
  const lines = {
    'i01-intro': '欢迎来到雪花星球！看，整个星球都装在一个大玻璃球里！',
    'i01-shake-hint': '点一点天空，雪花就会飞起来哦。',
    'i01-g1': '你好呀，我是小企鹅冰冰。',
    'i01-g2': '大风把我家的冰屋吹散了，我没有家了，呜呜。',
    'i01-g3': '屋檐下的冰柱里，藏着一个新字母的声音。听：',
    'i01-task1': '任务一，敲下三根会唱歌的冰柱，认识新字母。',
    'i01-ice-1': '敲下一根冰柱！还有两根。',
    'i01-ice-2': '又敲下一根！还剩最后一根。',
    'i01-ice-3': '三块小水晶都找到啦！它们变成了一块大水晶！',
    'i01-big': '这是大写字母，像一根长长的冰柱。',
    'i01-small': '这是小写字母，像一个小雪人，头顶有一颗雪球。',
    'i01-task2': '任务二，坐上驯鹿跳跳的雪橇，去捡冰砖，帮冰冰垒冰屋！',
    'i01-slide-go': '坐稳啦！我们出发！听到这个声音开头的冰砖，就滑过去捡！',
    'i01-lane': '点左边或者右边，换一条冰道。',
    'i01-brick-ok': '又拿到一块冰砖！冰屋长高一层啦！',
    'i01-brick-no': '这块不是这个声音开头的，它碎成雪花啦。',
    'i01-house-done': '冰屋垒好啦！谢谢你，我又有家了！',
    'i01-task3': '任务三，拼一拼小单词，再看看冰雪单词卡。',
    'i01-gift': '冰冰送你一个新字母，听，它的声音是这样的：',
    'i01-words': '再来看看冰雪单词卡，描一描开头的字母，读一读！',
    'i01-shake': '我们的新家垒好啦！摇一摇玻璃球，让雪花跳舞吧！',
    'i01-aurora': '哇，北极光亮起来啦！我们一家一起跳舞吧！',
    'i01-reward': '冰冰送你一个小小的雪花玻璃球，谢谢你帮我找回了家！',
    'i01-done': '太棒啦！你学会了新字母，还拼出了两个小单词！带着星朵，继续你的探索吧！',
    'i01-go-npc': '快回去找你的企鹅朋友，领下一个任务吧！',
  };
  const assets = Object.fromEntries(Object.keys(lines).map(key => [
    'voice/' + key + '.m4a', 'planet-i-audio/voice/' + key + '.m4a',
  ]));
  for (const word of ['inchworm', 'iguana', 'insect', 'ink', 'tin']) {
    assets['audio/' + word + '.m4a'] = 'planet-i-audio/audio/' + word + '.m4a';
  }
  Object.assign(window.YAYA_ASSETS || (window.YAYA_ASSETS = {}), assets);
  Object.assign(window.YAYA_VOICE_LINES || (window.YAYA_VOICE_LINES = {}), lines);
})();
