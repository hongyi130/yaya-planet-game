// A · 苹果星球的新语音（Qwen3-TTS 0.6B Base 克隆 q-letter 参考音，和其余中文提示同一个声音）。
(()=>{
const assets={"voice/arrive-a01.m4a": "runtime-audio/41c4e7138a6840fb.m4a", "voice/a01-grandma.m4a": "runtime-audio/59a9b1249ca099fe.m4a", "voice/a01-upper.m4a": "runtime-audio/ab81dde7ea70c207.m4a", "voice/a01-lower.m4a": "runtime-audio/627caf744aa95f40.m4a", "voice/a01-both.m4a": "runtime-audio/df0446b0ca60765d.m4a", "voice/a01-dots.m4a": "runtime-audio/d99b59970f2d5133.m4a", "voice/a01-start.m4a": "runtime-audio/c30e1dc8214abb96.m4a", "voice/a01-apple.m4a": "runtime-audio/70f07af6c2ad6464.m4a", "voice/a01-done.m4a": "runtime-audio/0fb27e0f3bd96d42.m4a", "voice/a01-intro2.m4a": "runtime-audio/0f9845ef3b926b0b.m4a", "voice/a01-welcome2.m4a": "runtime-audio/6394fed726b28edf.m4a", "voice/a01-g1.m4a": "runtime-audio/2a953d379f816d73.m4a", "voice/a01-g2.m4a": "runtime-audio/1fddaf1cd0785c6d.m4a", "voice/a01-g3.m4a": "runtime-audio/c610c5d46b1e976c.m4a", "voice/a01-task1.m4a": "runtime-audio/cd46ca8278c9b6e1.m4a", "voice/a01-g4.m4a": "runtime-audio/a3244ef7cb1fdc38.m4a", "voice/a01-g5.m4a": "runtime-audio/c9d8474ec18cfaa7.m4a", "voice/a01-g6.m4a": "runtime-audio/03e93f6ec7a1a760.m4a", "voice/a01-task2.m4a": "runtime-audio/bf22d4460cc34877.m4a", "voice/a01-g7.m4a": "runtime-audio/c995ef933b5c4892.m4a", "voice/a01-g8.m4a": "runtime-audio/8dc9d3e80712c75f.m4a", "voice/a01-g9.m4a": "runtime-audio/d0c58659a9196db9.m4a", "voice/a01-task3.m4a": "runtime-audio/2648040037c3a4c8.m4a", "voice/a01-go-grandma.m4a": "runtime-audio/7c9243eedf48737d.m4a", "voice/a01-two.m4a": "runtime-audio/9d97e8d6408b072b.m4a", "voice/a01-big.m4a": "runtime-audio/3b1fed0d2d47c066.m4a", "voice/a01-small.m4a": "runtime-audio/bb4d295764a37c9e.m4a", "voice/a01-same.m4a": "runtime-audio/8b9ad8f315576f99.m4a", "voice/a01-fall.m4a": "runtime-audio/938fe69ad7be9327.m4a", "voice/a01-more2.m4a": "runtime-audio/a0da5a79686f9fe0.m4a", "voice/a01-word-miss.m4a": "runtime-audio/8bd36fb0d364d95c.m4a", "voice/a01-word-read.m4a": "runtime-audio/af66c9892ccb3c50.m4a", "voice/a01-word-next.m4a": "runtime-audio/a11c0ec3e9229576.m4a", "voice/a01-end.m4a": "runtime-audio/570ccc4c8a56fca4.m4a"};
const voiceLines={
 "arrive-a01": "欢迎来到苹果星球！",
 "a01-grandma": "谢谢你来帮忙，小探险家！",
 "a01-upper": "这是大写的。",
 "a01-lower": "这是小写的。",
 "a01-both": "这次大写小写，都要描哦。",
 "a01-dots": "这次只有小圆点，把它们连起来。",
 "a01-start": "这次只有起点，你自己来写！",
 "a01-apple": "一个红苹果，送给奶奶！",
 "a01-done": "太棒啦！你学会了这个字母，大写小写都会写啦！下一颗星球，正在建造中哦。",
 "a01-intro2": "这里是苹果星球！苹果园的奶奶，正在等你呢。跟着金色光点，去找她吧！",
 "a01-welcome2": "欢迎回来！跟着金色光点，继续帮奶奶的忙吧。",
 "a01-g1": "你好呀，小探险家！我是苹果园的奶奶。",
 "a01-g2": "我的果园里，住着一个新字母。听，它的声音是这样的：",
 "a01-g3": "你能帮我找到它，和它交个朋友吗？",
 "a01-task1": "任务一：跟着金色光点，找到发光的晶石，认识新字母！",
 "a01-g4": "你认识它啦！真棒！",
 "a01-g5": "昨晚刮大风，五个字母苹果都挂在树上，下不来了。",
 "a01-g6": "每个苹果上，都写着这个字母。用手指描一描，苹果就会掉下来！",
 "a01-task2": "任务二：去果园里，摘下五个字母苹果！",
 "a01-g7": "苹果都摘回来啦！谢谢你！",
 "a01-g8": "野餐垫上还有五张单词卡，每个单词里，都藏着这个字母。",
 "a01-g9": "把它描出来，我们一起读一读！",
 "a01-task3": "任务三：单词野餐，描一描，读一读！",
 "a01-go-grandma": "回到奶奶那里，看看她还要你帮什么忙。",
 "a01-two": "我有两种样子。",
 "a01-big": "这是大写的，像一座尖尖的小帐篷。",
 "a01-small": "这是小写的，像一个圆圆的苹果，旁边靠着一根小棍。",
 "a01-same": "大写和小写，是同一个字母，声音也一样：",
 "a01-fall": "描好了！苹果掉下来啦！",
 "a01-more2": "跟着金色光点，去摘下一个字母苹果。",
 "a01-word-miss": "这张单词卡上，少了一个字母。把它描出来！",
 "a01-word-read": "我们一起读：",
 "a01-word-next": "下一张单词卡！",
 "a01-end": "太棒啦！大写和小写你都会写了，还读了五个单词！奶奶做了苹果派，奖励你！"
};
Object.assign(window.YAYA_ASSETS||(window.YAYA_ASSETS={}),assets);
Object.assign(window.YAYA_VOICE_LINES||(window.YAYA_VOICE_LINES={}),voiceLines);
})();
