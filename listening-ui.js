/* Original stepped-pixel speaker and generous screen-space listening targets. */
(() => {
  const path=(g,p)=>{g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();};
  function plaque(g,x,y,w,h,fill){const s=8;path(g,[[x+2*s,y],[x+w-2*s,y],[x+w-2*s,y+s],[x+w-s,y+s],[x+w-s,y+2*s],[x+w,y+2*s],[x+w,y+h-2*s],[x+w-s,y+h-2*s],[x+w-s,y+h-s],[x+w-2*s,y+h-s],[x+w-2*s,y+h],[x+2*s,y+h],[x+2*s,y+h-s],[x+s,y+h-s],[x+s,y+h-2*s],[x,y+h-2*s],[x,y+2*s],[x+s,y+2*s],[x+s,y+s],[x+2*s,y+s]]);g.fillStyle=fill;g.fill();}
  function speaker(g,x,y,size){g.save();g.translate(x,y);g.scale(size/96,size/96);
    const body=[[8,34],[28,34],[28,26],[36,26],[36,18],[52,18],[52,78],[36,78],[36,70],[28,70],[28,62],[8,62]];
    g.save();g.translate(0,5);path(g,body);g.fillStyle='#b68a49';g.fill();g.restore();
    path(g,body);g.fillStyle='#f5c65f';g.fill();g.fillStyle='#ffe9a7';g.fillRect(12,38,16,6);g.fillRect(40,22,8,42);g.fillStyle='#dcaa54';g.fillRect(12,54,16,8);
    g.fillStyle='#689b86';[[60,34,7,28],[67,40,6,16],[72,21,7,13],[79,28,7,13],[86,40,7,16],[79,55,7,13],[72,62,7,13]].forEach(r=>g.fillRect(...r));
    g.fillStyle='#b8dbc1';g.fillRect(60,34,7,5);g.fillRect(72,21,7,5);g.restore();
  }
  function texture(T,label,note,selected=false){const c=document.createElement('canvas');c.width=512;c.height=336;const g=c.getContext('2d');g.scale(2,2);
    plaque(g,6,13,244,150,'#b5a1b8');plaque(g,6,5,244,150,selected?'#b5d4b8':'#e2d6d9');plaque(g,10,5,236,142,selected?'#f1f8e9':'#fffaf0');
    if(label){speaker(g,24,20,87);g.fillStyle='#695473';let size=44;do{g.font=`900 ${size}px "PingFang SC",Arial,sans-serif`;size--;}while(g.measureText(label).width>112&&size>22);g.textAlign='center';g.textBaseline='middle';g.fillText(label,178,68);}else speaker(g,76,13,104);
    g.fillStyle=selected?'#4e7c60':'#75667e';g.font='700 25px "PingFang SC",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(selected?'再点选它':note,128,128);
    const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;return tex;
  }
  function hitTarget(x,y,items){
    // Prefer a visible card before its extra touch margin; nearest centre breaks ties.
    return items.map(item=>{const {cx,cy,width,height}=item;const dx=Math.abs(x-cx),dy=Math.abs(y-cy);const hx=Math.max(32,width/2+8),hy=Math.max(32,height/2+8);return {...item,inside:dx<=hx&&dy<=hy,core:dx<=width/2&&dy<=height/2,score:(dx/Math.max(width,1))**2+(dy/Math.max(height,1))**2};}).filter(i=>i.inside).sort((a,b)=>Number(b.core)-Number(a.core)||a.score-b.score)[0]?.block||null;
  }
  window.YayaListeningUI={texture,hitTarget};
})();
