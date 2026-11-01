/* P vocabulary recordings. Existing pig / pen / pan retained; new words use Kokoro af_heart.
   Isolated letter sounds remain the existing LAN-only test assets. */
(() => {
  'use strict';
  const assets = Object.fromEntries(['pig', 'pen', 'pup', 'panda', 'pizza', 'tap', 'pan'].map(word => ['audio/' + word + '.m4a', 'planet-p-audio/audio/' + word + '.m4a']));
  Object.assign(window.YAYA_ASSETS || (window.YAYA_ASSETS = {}), assets);
})();
