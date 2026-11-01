/* Direct ink, bounded forward projection and gentle endpoint completion. */
(() => {
  function project(points, progress, x, y, result) {
    const end=Math.min(points.length-1,progress+Math.max(2,Math.ceil(points.length*.4)));
    let best=Infinity, at=progress;
    for(let k=Math.max(0,Math.floor(progress)-1);k<end;k++){
      const a=points[k],b=points[k+1],dx=b[0]-a[0],dy=b[1]-a[1];
      const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));
      const d=(x-a[0]-t*dx)**2+(y-a[1]-t*dy)**2;
      if(d<best){best=d;at=k+t;}
    }
    result.progress=Math.max(progress,at);result.distance=Math.sqrt(best);return result;
  }
  function run({canvas,strokes,color,guide='full',pop,next,hint}) {
    return new Promise(resolve=>{
      delete canvas.dataset.traceResult;canvas.dataset.traceStroke="0";
      const ctx=canvas.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=canvas.height=Math.round(canvas.clientWidth*dpr);
      const W=canvas.width,R=guide==='full'?.12:.145,result={progress:0,distance:0};
      const ink=strokes.map(()=>({points:new Float32Array(8192),count:0}));
      const stray=new Float32Array(2048);let strayCount=0,strayTime=0;
      let index=0,progress=0,drawing=false,pointer=-1,raf=0,dirty=true,ended=false;
      let completing=0,completionFrom=0,flashUntil=0,idleTimer=0,lastX=0,lastY=0,hasLast=false;
      const stats={letter:canvas.getAttribute('aria-label'),events:0,coalesced:0,strokes:0,autoCompleted:0,reversed:0,started:performance.now(),duration:0};
      const schedule=()=>{dirty=true;if(!raf&&!ended)raf=requestAnimationFrame(render)};
      const idle=()=>{clearTimeout(idleTimer);idleTimer=setTimeout(()=>{flashUntil=performance.now()+1000;hint?.();schedule()},9000)};
      function line(pts,until=pts.length-1,from=0){ctx.beginPath();let k=Math.floor(from);ctx.moveTo(pts[k][0]*W,pts[k][1]*W);for(k++;k<=Math.floor(until);k++)ctx.lineTo(pts[k][0]*W,pts[k][1]*W);if(until%1&&k<pts.length){const a=pts[k-1],b=pts[k],t=until%1;ctx.lineTo((a[0]+(b[0]-a[0])*t)*W,(a[1]+(b[1]-a[1])*t)*W)}}
      function inkPath(buf,count){if(!count)return;ctx.beginPath();ctx.moveTo(buf[0]*W,buf[1]*W);for(let j=2;j<count-2;j+=2)ctx.quadraticCurveTo(buf[j]*W,buf[j+1]*W,(buf[j]+buf[j+2])*.5*W,(buf[j+1]+buf[j+3])*.5*W);if(count>2)ctx.lineTo(buf[count-2]*W,buf[count-1]*W);else ctx.lineTo(buf[0]*W+.1,buf[1]*W);ctx.stroke()}
      function render(now){raf=0;if(ended||!dirty)return;dirty=false;ctx.clearRect(0,0,W,W);ctx.lineCap=ctx.lineJoin='round';
        for(let i=0;i<strokes.length;i++){const pts=strokes[i];if(pts.length===1){ctx.fillStyle=i<index?color:'#ddd4df';ctx.beginPath();ctx.arc(pts[0][0]*W,pts[0][1]*W,W*.05,0,Math.PI*2);ctx.fill();continue}
          if(guide!=='dots'){ctx.strokeStyle=guide==='start'?'rgba(120,110,150,.075)':'rgba(120,110,150,.22)';ctx.lineWidth=W*.11;line(pts);ctx.stroke()}
          if(guide==='full'&&i>=index){ctx.setLineDash([W*.015,W*.025]);ctx.lineWidth=W*.012;ctx.strokeStyle='#fff';line(pts);ctx.stroke();ctx.setLineDash([])}
          if(guide==='dots'&&i>=index){ctx.fillStyle='#b7aebe';for(let j=0;j<pts.length;j+=3){ctx.beginPath();ctx.arc(pts[j][0]*W,pts[j][1]*W,W*.016,0,Math.PI*2);ctx.fill()}}
          ctx.strokeStyle=color;ctx.lineWidth=W*.10;inkPath(ink[i].points,ink[i].count);
          if(i<index){line(pts);ctx.stroke()}else if(i===index&&completing){const q=Math.min(1,(now-completing)/180);line(pts,completionFrom+(pts.length-1-completionFrom)*q,Math.floor(completionFrom));ctx.stroke();if(q===1){finishStroke();return}dirty=true}
        }
        if(strayCount){const a=Math.max(0,1-(now-strayTime)/500);ctx.strokeStyle=`rgba(160,155,166,${a*.5})`;ctx.lineWidth=W*.10;inkPath(stray,strayCount);if(a>0)dirty=true;else strayCount=0}
        if(index<strokes.length&&!completing){const p=strokes[index][Math.floor(progress)],pulse=now<flashUntil?1+Math.sin(now/70)*.18:1;ctx.fillStyle='#49bd7b';ctx.strokeStyle='#fff';ctx.lineWidth=W*.012;ctx.beginPath();ctx.arc(p[0]*W,p[1]*W,W*.044*pulse,0,Math.PI*2);ctx.fill();ctx.stroke();if(now<flashUntil){const q=strokes[index][Math.min(3,strokes[index].length-1)];ctx.strokeStyle='#368d5c';ctx.lineWidth=W*.012;ctx.beginPath();ctx.moveTo(p[0]*W,p[1]*W);ctx.lineTo(q[0]*W,q[1]*W);ctx.stroke();ctx.fillStyle='#368d5c';ctx.font=`bold ${W*.06}px Arial`;ctx.fillText('›',q[0]*W,q[1]*W);dirty=true}}
        if(dirty)raf=requestAnimationFrame(render);
      }
      function finishStroke(){pop?.();index++;canvas.dataset.traceStroke=String(index);stats.strokes++;progress=0;completing=0;drawing=false;hasLast=false;idle();if(index===strokes.length){ctx.strokeStyle=color;ctx.lineWidth=W*.1;const p=strokes[index-1];if(p.length>1){line(p);ctx.stroke()}ended=true;cleanup();stats.duration=performance.now()-stats.started;canvas.dataset.traceResult=JSON.stringify(stats);setTimeout(resolve,220)}else{next?.(strokes[index].length===1);schedule()}}
      function accept(x,y){if(completing||index>=strokes.length)return;const pts=strokes[index];stats.events++;if(pts.length===1){if(Math.hypot(x-pts[0][0],y-pts[0][1])<R*1.4)finishStroke();return}
        project(pts,progress,x,y,result);
        if(result.distance>R*2){if(strayCount+2<stray.length){stray[strayCount++]=x;stray[strayCount++]=y;}strayTime=performance.now();schedule();return}
        const b=ink[index];if(b.count+2<b.points.length){b.points[b.count++]=x;b.points[b.count++]=y;}if(result.distance<=R){progress=result.progress;if(progress/(pts.length-1)>=.83){completing=performance.now();completionFrom=progress;stats.autoCompleted++}}
        schedule();
      }
      function sample(e){const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(hasLast){const n=Math.ceil(Math.hypot(x-lastX,y-lastY)/.025);for(let j=1;j<n;j++)accept(lastX+(x-lastX)*j/n,lastY+(y-lastY)*j/n)}accept(x,y);lastX=x;lastY=y;hasLast=true;idle()}
      function down(e){if(completing||ended)return;e.preventDefault();const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height,p=strokes[index][Math.floor(progress)];if(Math.hypot(x-p[0],y-p[1])>R*1.6){flashUntil=performance.now()+900;stats.reversed++;schedule();return}pointer=e.pointerId;drawing=true;hasLast=false;canvas.setPointerCapture?.(pointer);sample(e)}
      function move(e){if(!drawing||e.pointerId!==pointer)return;e.preventDefault();const es=e.getCoalescedEvents?.();if(es?.length){stats.coalesced+=es.length;for(let i=0;i<es.length;i++)sample(es[i])}else sample(e)}
      function up(e){if(e.pointerId!==pointer)return;drawing=false;hasLast=false}
      function cleanup(){clearTimeout(idleTimer);cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up)}
      canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);idle();schedule();
    });
  }
  window.YayaTrace={run,project};
})();
