// A-02 continues the first six letters; load before app.js.
// KEYWORDS is supplied by app.js so the family's original 26 word cards stay authoritative.
(() => {
  const reviewLetters = ["a", "p"];
  const voiceKeys = {
    arrival: "arrive-l02",
    intro: "l02-intro",
    review: "l02-review",
    previousDone: "done-l01-next",
    done: "done-l02",
  };
  window.YAYA_SECOND_PLANET = {
    voiceKeys,
    reviewLetters,
    previousDone: {
      emoji: "🐜🍳🪑",
      title: "s a t i p n！",
      text: "6 个字母都学会了，还拼出了 <b>sit、ant、pan</b>。<br />天上的<b>寻宝星球</b>亮起来了！",
      voice: voiceKeys.previousDone,
    },
    planet: {
      id: "l02",
      kind: "letters",
      code: "A-02",
      name: "寻宝星球",
      vowel: "m d g o c k",
      seed: 67,
      grass: [0.30, 0.055],
      first: [],
      later: [],
      next: "b01",
      order: ["m", "d", "g", "o", "c", "k"],
      reviewLetters,
      // The two review colours match their stones on A-01. They are not new lessons.
      letters: {
        m: { color: "#df9973", freq: 523.25 },
        d: { color: "#65ad96", freq: 587.33 },
        g: { color: "#93b967", freq: 659.25 },
        o: { color: "#e7b458", freq: 698.46 },
        c: { color: "#68b0c4", freq: 783.99 },
        k: { color: "#b695cf", freq: 880 },
        a: { color: "#f0b84d", freq: 587.33 },
        p: { color: "#9b7fe0", freq: 783.99 },
      },
      blend: ["dog", "cap", "map"],
      words: { dog: "小狗伙伴", cap: "探险棒球帽", map: "藏宝地图" },
      // C and K share /k/: never use one as a wrong answer to the other's sound.
      soundGroups: { c: "k", k: "k" },
      spots: { m: [34, 15], d: [58, 100], g: [84, 200], o: [62, -85], c: [108, 40], k: [118, -145] },
      tent: [30, -70],
      props: { tree: 13, treeHigh: 7, rocks: 6, stones: 7, plant: 21 },
      challenges: {},
      altarLabel: ["🔤 ?", "拼一拼"],
      intro: "6 个新字母藏在这里。<br />跟着金色光点，认识它们、描一描，<br /><b>拼出小狗、棒球帽和藏宝地图</b>。",
      introVoice: voiceKeys.intro,
      reviewVoice: voiceKeys.review,
      reviewText: "带着上一颗星球学过的 <b>a、p</b>，一起拼词吧！",
      done: {
        emoji: "🐶🧢🗺️",
        title: "m d g o c k！",
        text: "又学会了 6 个字母，还拼出了 <b>dog、cap、map</b>。<br />带上小狗，去亮起来的<b>猫星球</b>看看吧！",
        voice: voiceKeys.done,
      },
    },
  };
})();
