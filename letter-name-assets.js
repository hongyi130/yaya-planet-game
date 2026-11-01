/* Letter names complement, rather than replace, the phonics recordings. */
(() => {
  for (const letter of 'astip') window.YAYA_ASSETS[`audio/name-${letter}.m4a`] = `audio/letter-names/name-${letter}.m4a`;
  window.YAYA_ASSETS['voice/l-continue.m4a'] = 'audio/letter-names/continue.m4a';
  window.YAYA_VOICE_LINES['l-continue'] = '我们继续吧。';
})();
