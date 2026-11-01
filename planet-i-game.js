/* I adventure controllers. All progress uses the planet's existing made/save ledger. */
(() => {
  'use strict';
  function create(c){
    const {THREE:T,scene,player,world,orchard,STAGE,surfaceRadius,orient,tangent,arc,tween,wait,sfx,burst}=c;
    const V=T.Vector3,A=YAYA_I_ART,TR=world.slideTrack,M=TR.points.length-1;
    let mode='idle',busy=false,icicles=[],orbit=[],ride=null,k=0,lane=1,laneX=0,zone=0,bricks=[],options=null,resolveRide=null,chooseTimer=null;
    const hud=document.createElement('div');hud.id='i-slide-hud';hud.hidden=true;hud.innerHTML='<span></span><div><button type="button" data-lane="0">← 左道</button><button type="button" data-lane="1">中道</button><button type="button" data-lane="2">右道 →</button></div>';document.body.append(hud);
    hud.querySelectorAll('button').forEach(b=>b.onclick=()=>chooseLane(Number(b.dataset.lane)));
    const text=t=>hud.querySelector('span').textContent=t;
    const setMode=next=>{mode=next;hud.querySelector('div').hidden=next!=='choose';hud.classList.toggle('is-gliding',next==='glide');};
    setMode('idle');
    let readingWord=null,rewardPhase=null,cheer=0;
    const sleigh=YayaIAtmosphere.sleigh(T);scene.add(sleigh.root);
    const deerTag=document.createElement('button');deerTag.className='npc-guide';deerTag.id='i-deer-guide';deerTag.type='button';deerTag.innerHTML='<span aria-hidden="true" style="font-size:27px">🦌</span><b>驯鹿跳跳</b>';deerTag.hidden=true;document.body.append(deerTag);
    let parkDir=null,bingSave=null,greeting=false;const wingCheer={value:0};
    const setPark=()=>{parkDir=world.parking.dir.clone();sleigh.root.position.setFromMatrixPosition(world.parking.frame);sleigh.root.quaternion.setFromRotationMatrix(world.parking.frame);world.parking.obstacle.enabled=true;};
    async function greet(){if(greeting||ride||!c.free())return;c.routeTo(parkDir,2.1,async()=>{greeting=true;try{await c.say(YAYA_VOICE_LINES['i01-deer-hi'],{voice:'i01-deer-hi'});}finally{greeting=false;}});}
    deerTag.onclick=greet;
    const line=key=>c.say(YAYA_VOICE_LINES[key],{voice:key,speaker:'grandma'});
    const doneIce=()=>[0,1,2].filter(i=>c.has('ice'+i)).length;
    const modelMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.8});
    const clearObj=obj=>{scene.remove(obj);obj.traverse(m=>{if(m.isMesh&&!m.userData.wordModelShared){m.geometry?.dispose();if(m.material!==modelMat)m.material?.dispose?.();}});};
    // A snow eave over the half igloo's door: the icicles hang from its front lip. It stays after they fall.
    const EAVE_Y=1.0;let eaveMesh=null;
    function eave(){if(eaveMesh)return;const b=A.makeBatch(T,YayaRound3.roundedBox(T,.06)),r=A.LAYOUT.half.r;b.setBase(world.home.frame);
      b.block(0,EAVE_Y+.07,r+.72,2.15,.16,.86,'#c9d8ef',{top:'#f4f7fd'});
      for(let j=0;j<5;j++)b.block((j-2)*.44,EAVE_Y+.19,r+.72+(j%2?.08:-.05),.34,.09,.5,'#eef3fb');
      eaveMesh=b.mesh(new T.MeshStandardMaterial({vertexColors:true,roughness:.8}),'i-door-eave');scene.add(eaveMesh);}
    eave();
    function startIce(){
      if(doneIce()===3){c.activate();return;}if(mode==='ice')return;
      mode='ice';c.crystal().active=false;c.crystal().group.visible=false;
      for(let i=0;i<3;i++){
        if(c.has('ice'+i))continue;
        const root=new T.Group(),ice=new T.Group(),b=A.makeBatch(T,YayaRound3.roundedBox(T,.08));
        const len=i===1?.80:.64;
        b.block(0,-len*.28,0,.32,len*.56,.27,'#5fb4e8');
        b.block(0,-len*.67,0,.21,len*.25,.19,'#5fb4e8');
        b.block(0,-len*.90,0,.09,len*.20,.09,'#5fb4e8');
        const body=b.mesh(new T.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.72,roughness:.26,depthWrite:false}),'i-icicle-'+i);
        const edge=new T.LineSegments(new T.EdgesGeometry(body.geometry,35),new T.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.95}));
        ice.add(body,edge);root.add(ice);
        const gem=new T.Mesh(new T.OctahedronGeometry(.105),new T.MeshStandardMaterial({color:['#a66be7','#ffc858','#b88aff'][i],emissive:['#9955dd','#ffc858','#9955dd'][i],emissiveIntensity:1.1,roughness:.25}));gem.position.set(0,-len*.30,.045);root.add(gem);
        const beam=new T.Mesh(new T.CylinderGeometry(.14,.22,18,12,1,true),new T.MeshBasicMaterial({color:'#87cfff',transparent:true,opacity:.16,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,fog:false}));beam.position.y=9.03;root.add(beam);
        // Hang from the front lip of the snow eave above the door (see eave()). All three tips hang down.
        const x=(i-1)*.62;
        root.position.set(x,EAVE_Y-.06,A.LAYOUT.half.r+1.08).applyMatrix4(world.home.frame);root.quaternion.setFromRotationMatrix(world.home.frame);scene.add(root);
        const sh={i,root,ice,gem,beam,dir:root.position.clone().normalize(),got:false};root.userData.kind='i-icicle';root.userData.ice=sh;icicles.push(sh);
      }
    }
    async function collectIce(sh){
      if(busy||sh.got||mode!=='ice')return;busy=true;sh.got=true;c.stopRoute();sfx.glass?.();
      await tween(.35,t=>{sh.ice.position.y=-t*.8;sh.ice.rotation.z=t*.4;sh.beam.material.opacity=.16*(1-t);});
      burst(sh.root.position,'#dbf1ff',12,.65);sh.ice.visible=sh.beam.visible=false;
      const p=sh.gem.getWorldPosition(new V());scene.attach(sh.gem);sh.gem.position.copy(p);orbit.push(sh.gem);c.mark('ice'+sh.i);c.save();
      await c.playWord('ls-i');const n=doneIce();
      if(n<3){await line('i01-ice-'+n);busy=false;return;}
      const cr=c.crystal(),target=cr.dir.clone().multiplyScalar(surfaceRadius(cr.dir)+1.6),starts=orbit.map(o=>o.position.clone());
      c.cameraShot({focus:target,position:target.clone().addScaledVector(cr.dir,4).addScaledVector(tangent(player.dir.clone().sub(cr.dir),cr.dir),8),up:cr.dir.clone()});
      await tween(1.4,t=>orbit.forEach((o,j)=>o.position.lerpVectors(starts[j],target,t*t*(3-2*t)).addScaledVector(cr.dir,Math.sin(t*Math.PI)*2)));
      orbit.forEach(o=>scene.remove(o));orbit=[];icicles.forEach(sh=>scene.remove(sh.root));icicles=[];burst(target,'#c9efff',22,1);
      c.activate();mode='idle';await line('i01-ice-3');c.cameraShot(null);busy=false;
    }
    function tapIce(sh){if(busy||sh.got)return;if(arc(player.dir,sh.dir)<2.1)collectIce(sh);else c.routeTo(sh.dir,1.2,()=>collectIce(sh));}
    function target(){const sh=icicles.filter(x=>!x.got).sort((a,b)=>arc(player.dir,a.dir)-arc(player.dir,b.dir))[0];return sh?{dir:sh.dir,pos:sh.root.position.clone(),letter:'i',stop:1.2}:null;}
    const pointAt=n=>{const j=((n%M)+M)%M,a=Math.floor(j);return TR.points[a].clone().lerp(TR.points[a+1],j-a).normalize();};
    const forward=n=>tangent(pointAt(n+1).sub(pointAt(n-1)),pointAt(n));
    function locate(obj,n,off=0,h=0){const d=pointAt(n),f=forward(n),right=new V().crossVectors(f,d).normalize();obj.position.copy(d).multiplyScalar(surfaceRadius(d)+h).addScaledVector(right,off);orient(obj,d,f);return d;}
    function makeBrick(card,ln,correct){
      const root=new T.Group(),mat=new T.MeshStandardMaterial({color:'#79c9f4',transparent:true,opacity:.38,roughness:.18,depthWrite:false,emissive:'#86d2ef',emissiveIntensity:.08});
      const size=1.6,shell=new T.Mesh(YayaRound3.roundedBox(T,.08),mat);shell.scale.setScalar(size);shell.position.y=size/2;root.add(shell);
      const edges=A.makeBatch(T,new T.BoxGeometry(1,1,1)),e=.025,h=size/2;
      for(const x of [-h,h])for(const z of [-h,h])edges.block(x,h,z,e,size,e,'#ffffff');
      for(const y of [0,size])for(const z of [-h,h])edges.block(0,y,z,size,e,e,'#ffffff');
      for(const y of [0,size])for(const x of [-h,h])edges.block(x,y,0,e,e,size,'#ffffff');
      const rim=edges.mesh(new T.MeshBasicMaterial({vertexColors:true}),'i-brick-white-edges');root.add(rim);
      const toy=YayaWordModels.create(T,card.word,{lowPower:c.LOW_POWER}),box=new T.Box3().setFromObject(toy),extent=box.getSize(new V());
      const scale=Math.min(1.42/extent.y,1.40/Math.max(extent.x,extent.z));toy.scale.setScalar(scale);toy.position.y=.10-box.min.y*scale;toy.rotation.y=Math.PI;root.add(toy);
      root.name='i-ice-brick-'+ln;const b={root,shell,rim,toy,card,lane:ln,correct,modelHeight:extent.y*scale};
      // Spread the larger display cubes above the banks; the riding lanes stay unchanged.
      locate(root,TR.stops[zone],TR.laneOffsets[ln]*2.45,.65);b.rest=root.position.clone();scene.add(root);return b;
    }
    function clearBricks(){bricks.forEach(b=>clearObj(b.root));bricks=[];}
    const distract=['apple','sun','tent','cat','sock'];
    function buildZone(){
      clearBricks();const wanted=zone%3,cards=[{word:distract[zone]},{word:distract[(zone+2)%5]}];cards.splice(wanted,0,YAYA_PLANET_I.ICE_WORDS[zone]);bricks=cards.map((card,ln)=>makeBrick(card,ln,ln===wanted));text(`冰砖 ${zone+1}/5 · 听名字，找到 /ɪ/ 开头的冰砖`);
    }
    function seatedPose(){if(!ride)return;player.obj.traverse(o=>{if(/^Leg[LR]$/.test(o.name))o.rotation.x=-Math.PI/2;if(/^Arm[LR]$/.test(o.name)){o.rotation.x=-1.15;o.rotation.z=o.name==='ArmL'?-.12:.12;}});}
    function mount(){
      world.parking.obstacle.enabled=false;ride=sleigh.root;ride.visible=true;locate(ride,k,laneX,.07);
      const peng=orchard.granny;bingSave={parent:peng.root.parent,position:peng.root.position.clone(),quaternion:peng.root.quaternion.clone()};
      const bodyMesh=peng.body.getObjectByName('i-bingbing-body');bingSave.bodyMesh=bodyMesh;bingSave.material=bodyMesh.material;bodyMesh.material=bodyMesh.material.clone();
      bodyMesh.material.onBeforeCompile=sh=>{sh.uniforms.wingCheer=wingCheer;sh.vertexShader='uniform float wingCheer;\n'+sh.vertexShader;sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nif(abs(position.x)>.55&&position.y>.3&&position.y<1.15){float side=sign(position.x),a=wingCheer*side;vec2 pivot=vec2(side*.52,.88);vec2 p=position.xy-pivot;transformed.xy=pivot+mat2(cos(a),sin(a),-sin(a),cos(a))*p;}');};bodyMesh.material.customProgramCacheKey=()=> 'i-bingbing-sleigh-cheer';
      ride.add(peng.root);peng.root.position.set(0,.58,.30);peng.root.quaternion.identity();peng.root.userData.riding=true;peng.root.visible=true;peng.body.rotation.set(0,0,0);peng.head.rotation.set(0,0,0);
      player.mixer.stopAllAction();player.current=null;player.oneShot=false;ride.add(player.obj);player.obj.position.set(0,.78,-.62);player.obj.quaternion.identity();seatedPose();
      document.body.classList.add('i-activity');hud.hidden=false;
    }
    function dismount(){if(!ride)return;scene.attach(player.obj);player.obj.quaternion.identity();player.obj.traverse(o=>{if(/^(Leg|Arm)[LR]$/.test(o.name))o.rotation.set(0,0,0);});ride=null;
      const peng=orchard.granny;bingSave.parent.add(peng.root);peng.root.position.copy(bingSave.position);peng.root.quaternion.copy(bingSave.quaternion);peng.root.userData.riding=false;peng.body.rotation.set(0,0,0);bingSave.bodyMesh.material.dispose();bingSave.bodyMesh.material=bingSave.material;bingSave=null;
      setPark();player.current=null;player.oneShot=false;player.dir.copy(pointAt(k));player.radius=surfaceRadius(player.dir);c.cameraShot(null);hud.hidden=true;document.body.classList.remove('i-activity');clearBricks();}
    function followShot(){const up=pointAt(k),f=forward(k),side=new V().crossVectors(f,up).normalize(),at=ride.position,fit=c.camera.aspect<.8?1.18:1;return {focus:at.clone().addScaledVector(up,.95).addScaledVector(f,1.2),position:at.clone().addScaledVector(up,6.8*fit).addScaledVector(f,-8.3*fit).addScaledVector(side,4.1*fit),up};}
    async function boardCamera(){
      const camera=c.camera,start=camera.position.clone(),startUp=camera.up.clone(),startFocus=start.clone().addScaledVector(camera.getWorldDirection(new V()),8),end=followShot();
      const fromDir=start.clone().normalize(),turn=new T.Quaternion().setFromUnitVectors(fromDir,end.position.clone().normalize());
      const fromFocus=startFocus.clone().normalize(),focusTurn=new T.Quaternion().setFromUnitVectors(fromFocus,end.focus.clone().normalize());
      // Interpolate around the planet, never across its interior. The lift clears the snow banks.
      await tween(1.5,t=>{const q=t*t*(3-2*t),dir=fromDir.clone().applyQuaternion(new T.Quaternion().slerp(turn,q)),focusDir=fromFocus.clone().applyQuaternion(new T.Quaternion().slerp(focusTurn,q));
        const radius=Math.max(surfaceRadius(dir)+3.5,T.MathUtils.lerp(start.length(),end.position.length(),q)+Math.sin(Math.PI*q)*3);
        const focus=focusDir.multiplyScalar(T.MathUtils.lerp(startFocus.length(),end.focus.length(),q));
        c.cameraShot({position:dir.multiplyScalar(radius),focus,up:startUp.clone().lerp(end.up,q).normalize(),direct:true});});
    }
    async function play(){
      if(ride||mode==='approach')return false;c.stopRoute();k=0;lane=1;laneX=0;zone=0;setMode('approach');sleigh.root.visible=true;
      await new Promise(resolve=>c.routeTo(parkDir,2.1,resolve));
      await c.say(YAYA_VOICE_LINES['i01-deer-hi'],{voice:'i01-deer-hi'});
      setMode('boarding');mount();text('坐稳啦');
      const complete=new Promise(r=>resolveRide=r);await boardCamera();setMode('intro');await line('i01-slide-go');await c.playWord('ls-i');await line('i01-lane');setMode('glide');text('继续滑一会儿');return complete;
    }
    async function announce(){
      setMode('announce');for(const b of bricks){readingWord=b.card.word;b.shell.material.emissiveIntensity=.65;b.rim.material.color.set('#fff2a5');
        await Promise.all([c.playWord(b.card.word),tween(.55,t=>b.root.position.copy(b.rest).addScaledVector(pointAt(TR.stops[zone]),Math.sin(Math.PI*t)*.20))]);
        b.root.position.copy(b.rest);b.shell.material.emissiveIntensity=.08;b.rim.material.color.set('#ffffff');}
      readingWord=null;await c.playWord('ls-i');if(!ride)return;setMode('choose');text('停下来等你 · 点左／中／右，选择冰砖');
    }
    function chooseLane(n){
      if(!ride||!['glide','choose'].includes(mode))return;lane=Math.max(0,Math.min(2,n));
      hud.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('is-selected',i===lane));
      if(mode==='choose'){clearTimeout(chooseTimer);chooseTimer=setTimeout(()=>selectBrick(lane),300);}
    }
    async function selectBrick(n){
      if(mode!=='choose')return;setMode('collect');const b=bricks[n];
      if(!b.correct){b.root.visible=false;burst(b.root.position.clone().addScaledVector(pointAt(k),.7),'#dfedff',22,.9);sfx.glass?.();await line('i01-brick-no');b.root.visible=true;setMode('choose');text('再听听 /ɪ/ · 可以再选一次');return;}
      const from=k;await tween(.65,t=>k=from+(TR.stops[zone]-from)*t);
      const start=b.root.position.clone(),to=new V(0,2.3,0).applyMatrix4(world.home.frame);await tween(.9,t=>{b.root.position.lerpVectors(start,to,t).addScaledVector(pointAt(k),Math.sin(t*Math.PI)*3);b.root.scale.setScalar(1-t*.65);});
      cheer=1.4;
      const layers=Array.from({length:5},(_,i)=>c.has('brick'+i)).filter(Boolean).length+1;world.setHouse(layers);sfx.magic();clearBricks();
      await line(layers===1?'i01-brick-first':'i01-brick-ok');hud.hidden=true;await c.trace(zone);hud.hidden=false;c.mark('brick'+zone);c.stars(2);c.save();zone++;setMode('glide');text('继续滑一会儿');
    }
    async function finishRide(){setMode('finish');await line('i01-house-done');world.setHouse(5);c.save();dismount();mode='idle';const r=resolveRide;resolveRide=null;r?.(true);}
    function update(dt,time){
      updateGiftSnow(time);cheer=Math.max(0,cheer-dt);wingCheer.value=cheer>0?Math.sin(time*12)*.65:0;sleigh.update(time,mode==='glide',cheer);
      if(!ride){sleigh.root.visible=mode==='approach'||c.arc(player.dir,parkDir)<16;const at=sleigh.root.localToWorld(new V(0,2.5,2)),to=at.clone().sub(c.camera.position),p=at.clone().project(c.camera);deerTag.hidden=!c.ready()||!c.free()||!sleigh.root.visible||p.z>1||to.dot(c.camera.getWorldDirection(new V()))<0||Math.abs(p.x)>.9||Math.abs(p.y)>.75;if(!deerTag.hidden){deerTag.style.left=((p.x+1)*innerWidth/2)+'px';deerTag.style.top=((1-p.y)*innerHeight/2)+'px';}}
      else{deerTag.hidden=true;const p=orchard.granny;p.body.rotation.z=cheer?Math.sin(time*13)*.18:Math.sin(time*3)*.025;p.body.position.y=cheer?Math.abs(Math.sin(time*9))*.10:0;p.head.rotation.y=cheer?Math.sin(time*8)*.12:0;}

      if(mode==='ice'){
        orbit.forEach((o,i)=>{if(busy&&doneIce()===3)return;const up=player.dir,side=tangent(new V(1,0,0),up),f=new V().crossVectors(up,side);o.position.copy(player.obj.position).addScaledVector(up,1.5).addScaledVector(side,Math.cos(time*2+i*2.1)*.6).addScaledVector(f,Math.sin(time*2+i*2.1)*.6);o.rotation.y=time;});
        if(!busy&&time-lastSing>5&&icicles.some(s=>!s.got&&arc(player.dir,s.dir)<4)){lastSing=time;c.sing();}
      }
      if(!ride)return;
      if(mode==='glide'){
        while(zone<5&&c.has('brick'+zone))zone++;
        const stop=zone<5?TR.stops[zone]-7:M;
        k=Math.min(stop,k+dt*5.1/(TR.length/M));
        if(zone<5&&!bricks.length&&k>TR.stops[zone]-28)buildZone();
        if(k>=stop){if(zone===5)finishRide();else announce();}
      }
      laneX+=(TR.laneOffsets[lane]-laneX)*Math.min(1,dt*9);const d=locate(ride,k,laneX,.07);player.dir.copy(d);player.heading.copy(forward(k));seatedPose();
      if(mode==='boarding')return;
      const up=d.clone(),f=forward(k),at=ride.position.clone();
      if(['announce','choose'].includes(mode)){
        const z=pointAt(TR.stops[zone]),zf=forward(TR.stops[zone]),focus=z.clone().multiplyScalar(surfaceRadius(z)+1.25),fit=c.camera.aspect<.8?1.45:1;
        c.cameraShot({focus,position:focus.clone().addScaledVector(z,6.5*fit).addScaledVector(zf,-10.0*fit),up:z,lift:1,zoom:1,ahead:0});
      }else c.cameraShot({...followShot(),lift:1,zoom:1,ahead:0});
    }
    let lastSing=-9,shakeCount=0,shakeResolve=null;
    async function ending(){
      setMode('ending');document.body.classList.add('i-activity');c.stopRoute();c.cameraShot(world.turtle.overview(c.camera.aspect));
      await line('i01-shake');hud.hidden=false;hud.classList.add('is-ending');text('点天空 3 次，或左右快速划动，让雪花跳舞');
      shakeCount=0;await new Promise(r=>{shakeResolve=r;world.setShakeInput(shake);});world.setShakeInput(null);hud.hidden=true;hud.classList.remove('is-ending');world.celebrate();await wait(2.2);world.setNight();await line('i01-aurora');await wait(2);
      const focus=new V(0,1.05,A.LAYOUT.half.r+.8).applyMatrix4(world.home.frame),up=world.home.dir.clone(),f=tangent(new V().setFromMatrixColumn(world.home.frame,2),up),distance=c.camera.aspect<.8?11:8;
      c.cameraShot({focus,position:focus.clone().addScaledVector(up,2.4).addScaledVector(f,distance),up});
      mode='family';await wait(3.5);mode='reward';
    }
    let giftSnow=null;
    // Inside the mini globe: big six-armed snowflakes plus small round dots, as in the design.
    function addGiftSnow(){
      if(giftSnow)return;giftSnow=[];
      const flake=document.createElement('canvas');flake.width=flake.height=64;const f=flake.getContext('2d');f.translate(32,32);f.strokeStyle='#fff';f.lineCap='round';
      for(let k=0;k<6;k++){f.rotate(Math.PI/3);f.lineWidth=5;f.beginPath();f.moveTo(0,0);f.lineTo(0,-27);f.stroke();f.lineWidth=4;f.beginPath();f.moveTo(-9,-21);f.lineTo(0,-14);f.lineTo(9,-21);f.stroke();}
      const dot=document.createElement('canvas');dot.width=dot.height=32;const g2=dot.getContext('2d'),rg=g2.createRadialGradient(16,16,0,16,16,16);rg.addColorStop(0,'#fff');rg.addColorStop(.55,'rgba(255,255,255,.9)');rg.addColorStop(1,'rgba(255,255,255,0)');g2.fillStyle=rg;g2.fillRect(0,0,32,32);
      for(const [n,canvas,size] of [[14,flake,.085],[26,dot,.03]]){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(n*3),3));
        const p=new T.Points(geo,new T.PointsMaterial({color:'#ffffff',map:new T.CanvasTexture(canvas),size,sizeAttenuation:true,transparent:true,opacity:.95,depthWrite:false}));
        p.name='i-gift-snow';orchard.pie.add(p);giftSnow.push(p);}
    }
    function updateGiftSnow(time){if(!giftSnow&&orchard.pie.visible)addGiftSnow();if(!giftSnow||!orchard.pie.visible)return;
      giftSnow.forEach((p,j)=>{const a=p.geometry.attributes.position;
        for(let i=0;i<a.count;i++){const q=i+j*17,angle=q*2.399+time*.2,r=.12+(q%4)*.045,y=.55+((q*.137-time*.07)% .55+.55)%.55;a.setXYZ(i,Math.cos(angle)*r,y,Math.sin(angle)*r);}a.needsUpdate=true;});}
    async function showReward(){
      const gift=orchard.pie,home=gift.position.clone(),rotation=gift.quaternion.clone(),scale=gift.scale.clone(),girlVisible=player.obj.visible;
      const focus=gift.getWorldPosition(new V()),up=STAGE.center.clone();
      c.cameraShot({focus:focus.clone().addScaledVector(up,.4),position:focus.clone().addScaledVector(up,3).addScaledVector(STAGE.front,6),up});
      document.body.classList.add('i-reward');gift.visible=true;gift.scale.setScalar(.01);addGiftSnow();player.obj.visible=false;sfx.fanfare();rewardPhase='pop';
      const pop=home.clone().addScaledVector(up,1.3);
      await tween(.65,t=>{gift.position.lerpVectors(home,pop,t);gift.scale.copy(scale).multiplyScalar(Math.max(.01,t+Math.sin(t*Math.PI)*.2));});
      // Lift toward the night sky, giving the transparent globe a clear dark backdrop.
      const camera=c.camera,camUp=camera.up.clone().normalize(),lookStart=camera.getWorldDirection(new V()),camAt=camera.position.clone(),forward=tangent(lookStart,camUp).addScaledVector(camUp,.26).normalize();
      rewardPhase='fly';await tween(.45,t=>c.cameraShot({position:camAt,focus:camAt.clone().add(lookStart.clone().lerp(forward,t).normalize()),up:camUp,direct:true}));
      const centre=camAt.clone().addScaledVector(forward,3.8).addScaledVector(camUp,-.80);
      c.cameraShot({position:camera.position.clone(),focus:camera.position.clone().add(forward),up:camUp,direct:true});
      const lit=[];gift.traverse(o=>{if(o.isMesh&&o.material.emissive){const original=o.material;if(o.geometry.type==='SphereGeometry'){o.material=original.clone();o.material.emissive.set('#c4e9ff');o.material.emissiveIntensity=.22;o.material.opacity=.35;}else o.material=new T.MeshBasicMaterial({vertexColors:true});lit.push([o,original]);}});
      const facing=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(new V(),forward.clone().negate(),camUp));
      rewardPhase='fly';await tween(.8,t=>{const q=t*t*(3-2*t);gift.position.lerpVectors(pop,centre,q);gift.scale.copy(scale).multiplyScalar(1+q*.65);gift.quaternion.copy(rotation).slerp(facing,q);});
      const shape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.045:.10;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();
      const stars=new T.InstancedMesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({side:T.DoubleSide}),18),dummy=new T.Object3D(),right=new V().crossVectors(forward,camUp).normalize();
      const colours=['#ff9aa8','#ffc78a','#fff09a','#a8e6a1','#9fd3ff','#c9a6ff'];for(let i=0;i<18;i++)stars.setColorAt(i,new T.Color(colours[i%6]));scene.add(stars);rewardPhase='show';
      const animate=t=>{gift.quaternion.copy(facing).multiply(new T.Quaternion().setFromAxisAngle(new V(0,1,0),t*Math.PI*2));
        for(let i=0;i<18;i++){const a=i*Math.PI*2/18+t*.3,r=.9+Math.sin(Math.PI*t)*.45+(i%3)*.09;dummy.position.copy(centre).addScaledVector(camUp,.8+Math.sin(a)*r).addScaledVector(right,Math.cos(a)*r);dummy.quaternion.copy(camera.quaternion);dummy.rotateZ(a+t*2);dummy.scale.setScalar(.7+Math.sin(Math.PI*t)*.6);dummy.updateMatrix();stars.setMatrixAt(i,dummy.matrix);}stars.instanceMatrix.needsUpdate=true;};
      try{await Promise.all([tween(2.4,animate),line('i01-reward')]);rewardPhase='return';scene.remove(stars);stars.geometry.dispose();stars.material.dispose();
        await tween(.85,t=>{gift.position.lerpVectors(centre,home,t);gift.scale.copy(scale).multiplyScalar(1.65-t*.65);gift.quaternion.copy(facing).slerp(rotation,t);});
      }finally{scene.remove(stars);gift.position.copy(home);gift.quaternion.copy(rotation);gift.scale.copy(scale);player.obj.visible=girlVisible;rewardPhase=null;document.body.classList.remove('i-reward');lit.forEach(([o,material])=>{o.material.dispose();o.material=material;});}
    }
    function shake(){if(mode!=='ending'||!shakeResolve)return;shakeCount++;world.celebrate();text(`雪花跳起来了 · ${Math.min(3,shakeCount)}/3`);if(shakeCount>=3){const r=shakeResolve;shakeResolve=null;r();}}
    function endDone(){setMode('idle');hud.hidden=true;document.body.classList.remove('i-activity');c.cameraShot(null);}
    setPark();
    return {startIce,tapIce,target,targets:()=>icicles.filter(s=>!s.got).map(s=>s.root),get iceActive(){return mode==='ice';},get iceBusy(){return busy;},iceDone:()=>doneIce()===3,play,update,chooseLane,tapSide:left=>chooseLane(lane+(left?-1:1)),ending,showReward,shake,endDone,seatedPose,get riding(){return !!ride;},get locked(){return !!ride||['approach','ending','family','reward'].includes(mode)||busy;},get endingActive(){return mode==='ending';},snapshot:()=>({mode,parkDir:parkDir.toArray(),sleighVisible:sleigh.root.visible,bingbingRiding:!!orchard.granny.root.userData.riding,k,lane,zone,readingWord,rewardPhase,houseLayers:world.snapshot().houseLayers,shakeCount,bricks:bricks.map(b=>({word:b.card.word,lane:b.lane,correct:b.correct,lit:b.shell.material.emissiveIntensity>.1,bounce:b.root.position.distanceTo(b.rest),modelHeight:b.modelHeight})),icicles:icicles.filter(s=>!s.got).map(s=>({i:s.i,position:s.root.position.toArray()})),legs:['LegL','LegR'].map(n=>player.obj.getObjectByName(n)?.rotation.x)})};
  }
  window.YayaIGame={create};
})();
