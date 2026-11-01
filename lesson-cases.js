/* Uppercase centre-line paths for the twelve letters taught in A-01/A-02.
   Lowercase paths remain in app.js / letter-paths.js. Coordinates: x right, y down. */
(() => {
  const oval = (cx,cy,rx,ry,start,end,n=30) => Array.from({length:n+1},(_,i)=>{
    const t=start+(end-start)*i/n;return [cx+rx*Math.cos(t),cy+ry*Math.sin(t)];
  });
  const P = {
    S: [[[.71,.27],[.62,.19],[.45,.18],[.32,.25],[.30,.35],[.35,.44],[.50,.50],[.65,.56],[.71,.65],[.68,.75],[.56,.82],[.40,.82],[.29,.74]]],
    A: [[[.50,.18],[.25,.82]],[[.50,.18],[.75,.82]],[[.35,.58],[.65,.58]]],
    T: [[[.25,.18],[.75,.18]],[[.50,.18],[.50,.82]]],
    I: [[[.33,.18],[.67,.18]],[[.50,.18],[.50,.82]],[[.33,.82],[.67,.82]]],
    P: [[[.32,.18],[.32,.82]],[[.32,.18],[.56,.18],[.69,.24],[.72,.34],[.69,.45],[.57,.51],[.32,.51]]],
    N: [[[.28,.18],[.28,.82]],[[.28,.18],[.72,.82]],[[.72,.18],[.72,.82]]],
    M: [[[.23,.18],[.23,.82]],[[.23,.18],[.50,.54],[.77,.18]],[[.77,.18],[.77,.82]]],
    D: [[[.30,.18],[.30,.82]],[[.30,.18],[.49,.18],[.63,.23],[.72,.36],[.75,.50],[.72,.65],[.63,.77],[.49,.82],[.30,.82]]],
    G: [oval(.50,.50,.24,.32,-.78,-5.5),[[.67,.72],[.73,.72],[.73,.52],[.54,.52]]],
    O: [oval(.50,.50,.24,.32,-Math.PI/2,-Math.PI/2-Math.PI*2)],
    C: [oval(.50,.50,.24,.32,-.78,-5.5)],
    K: [[[.30,.18],[.30,.82]],[[.73,.18],[.30,.52],[.75,.82]]],
  };
  function showPair(container,letter,color) {
    container.style.color=color;
    container.querySelector('[data-case="upper"]').textContent=letter.toUpperCase();
    container.querySelector('[data-case="lower"]').textContent=letter;
  }
  async function traceBoth(letter,{trace,setCase,onCaseDone}) {
    for(const [i,form] of ['upper','lower'].entries()) {
      const glyph=form==='upper'?letter.toUpperCase():letter;
      setCase(form,glyph,i);
      await trace(glyph);
      onCaseDone(form,i);
    }
  }
  window.YayaLetterCases={upperPaths:P,showPair,traceBoth};
})();
