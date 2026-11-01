/* P · Bubble adventure. The approved world owns all scenery and the shared bubble budget. */
(() => {
  'use strict';
  function create(c) {
    const { THREE:T, scene, player, world, orchard, STAGE, camera, companion, surfaceRadius, orient, tangent, arc, tween, wait, sfx } = c;
    const V=T.Vector3, path=world.bubblePath, glass=world.bubbles.material, UP=new V(0,1,0), blankQ=new T.Quaternion();
    const shellGeo=new T.SphereGeometry(1,32,20);
    const hud=document.createElement('div');hud.id='p-bubble-hud';hud.hidden=true;hud.setAttribute('role','status');document.body.append(hud);
    let mode='idle',busy=false,pops=[],orbit=[],popShellsActive=false,transporting=false,row=0,choices=[],readingWord=null,carrier=null,standing=null,returnForward=null,resolvePlay=null,held=null,blowResolve=null,blown=0,blowBubble=null,rewardPhase=null,lastTime=0;
    const activityKey='yaya-p-activity', activity=Object.assign({blown:0,rescued:false},c.read?.(activityKey)||{});
    activity.blown=Math.max(0,Math.min(3,Number(activity.blown)||0));
    const persist=()=>c.write?.(activityKey,activity);
    const text=value=>{hud.textContent=value;};
    const line=key=>c.say(window.YAYA_VOICE_LINES?.[key]||key,{voice:key,speaker:key==='p01-tangtang'?'tangtang':'grandma'});
    const ease=t=>t*t*(3-2*t);
    const ray=new T.Raycaster(),ndc=new T.Vector2();
    const localP=(x,a)=>{const r=16.7,l=x/r,f=a/r;return new V(Math.sin(l),Math.cos(l)*Math.cos(f),-Math.cos(l)*Math.sin(f)).normalize();};
    const donePops=()=>[0,1,2].filter(i=>c.has('pop'+i)).length;
    const setMode=value=>{mode=value;};
    const sparkle=(at,count=16)=>world.burst(at,'#e5f8ff',count);
    function removeOwned(o){if(!o)return;o.removeFromParent();o.traverse(m=>{if(!m.isMesh||m.userData.wordModelShared)return;if(m.geometry!==shellGeo)m.geometry?.dispose();if(m.material!==glass)m.material?.dispose?.();});}

    // Three shards near the machine. The glass shares one draw call and borrows three ambient slots.
    function startPop(){
      if(donePops()===3){c.activate();return;}if(mode==='pop')return;
      setMode('pop');const crystal=c.crystal();crystal.active=false;crystal.group.visible=false;
      popShellsActive=true;
      const at=[[-3.1,3.7],[-6.3,5.6],[-8.8,-1.7]];
      for(let i=0;i<3;i++){
        const gem=new T.Mesh(new T.OctahedronGeometry(.21),new T.MeshStandardMaterial({color:['#bb87eb','#ffc952','#8adbe7'][i],emissive:['#a65ddc','#edb73b','#65b5cd'][i],emissiveIntensity:.65,roughness:.24}));
        // Saved shards are still visibly with the explorer and participate in the final merge.
        if(c.has('pop'+i)){gem.position.copy(player.obj.position).addScaledVector(player.dir,1.5);scene.add(gem);orbit.push(gem);continue;}
        const d=localP(at[i][0],at[i][1]),root=new T.Group();root.name='p-shard-'+i;root.position.copy(d).multiplyScalar(surfaceRadius(d)+1.5);root.quaternion.setFromUnitVectors(UP,d);root.add(gem);
        const beam=new T.Mesh(new T.CylinderGeometry(.12,.26,14,10,1,true),new T.MeshBasicMaterial({color:'#ffe9a2',transparent:true,opacity:.14,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));beam.position.y=6.8;root.add(beam);
        const proxy=new T.Mesh(new T.SphereGeometry(.88,8,6),new T.MeshBasicMaterial({visible:false}));root.add(proxy);
        const p={i,root,gem,beam,dir:d,base:root.position.clone(),scale:.82,got:false};root.userData.kind='p-pop';root.userData.pop=p;pops.push(p);scene.add(root);
      }
      updatePopShells();
    }
    function updatePopShells(){if(!popShellsActive)return;const matrices=[];for(const p of pops){if(p.got)continue;matrices.push(new T.Matrix4().compose(p.root.position,blankQ,new V(p.scale,p.scale,p.scale)));}world.bubbles.setExternal('p-shards',matrices);}
    async function collectPop(p){
      if(mode!=='pop'||busy||p.got)return;busy=true;c.stopRoute();
      sfx.pop?.();sparkle(p.root.position,22);p.scale=0;p.got=true;p.beam.visible=false;updatePopShells();
      scene.attach(p.gem);const start=p.gem.position.clone();
      await Promise.all([c.playWord('ls-p'),tween(.45,t=>p.gem.position.copy(start).addScaledVector(p.dir,-Math.sin(t*Math.PI)*.65))]);
      orbit.push(p.gem);c.mark('pop'+p.i);c.save();
      const count=donePops();
      if(count<3){await line('p01-pop-'+count);busy=false;return;}
      const crystal=c.crystal(),to=crystal.dir.clone().multiplyScalar(surfaceRadius(crystal.dir)+1.6),starts=orbit.map(o=>o.position.clone());
      c.cameraShot({focus:to,position:to.clone().addScaledVector(crystal.dir,4).addScaledVector(tangent(player.dir.clone().sub(crystal.dir),crystal.dir),8),up:crystal.dir.clone()});
      await tween(1.3,t=>orbit.forEach((o,j)=>o.position.lerpVectors(starts[j],to,ease(t)).addScaledVector(crystal.dir,Math.sin(t*Math.PI)*1.4)));
      for(const gem of orbit)removeOwned(gem);orbit=[];for(const p of pops)removeOwned(p.root);pops=[];popShellsActive=false;world.bubbles.clearExternal('p-shards');
      sparkle(to,24);c.activate();setMode('idle');await line('p01-pop-3');c.cameraShot(null);busy=false;
    }
    function tapPop(p){if(busy||p.got)return;if(arc(player.dir,p.dir)<2.3)collectPop(p);else c.routeTo(p.dir,1.6,()=>collectPop(p));}
    function target(){const p=pops.filter(p=>!p.got).sort((a,b)=>arc(player.dir,a.dir)-arc(player.dir,b.dir))[0];return p?{dir:p.dir,pos:p.root.position.clone(),letter:'p',stop:1.6}:null;}

    // The carrier is only a coordinate frame while jumping; the existing path bubbles remain the scenery.
    const direction=(from,to)=>tangent(to.clone().sub(from),from.clone().normalize());
    function seatedPose(){
      if(!carrier)return;player.obj.traverse(o=>{if(/^Leg[LR]$/.test(o.name))o.rotation.x=mode==='return'?-.95:-.28;if(/^Arm[LR]$/.test(o.name)){o.rotation.x=-.65;o.rotation.z=o.name==='ArmL'?-.22:.22;}});
      if(companion?.model){companion.model.legs.forEach(l=>{l.rotation.x=0;l.position.y=.43;});companion.model.body.position.y=0;companion.model.body.rotation.x=0;}
    }
    function mount(at){
      carrier=new T.Group();carrier.name='p-jump-carrier';scene.add(carrier);carrier.position.copy(at);orient(carrier,at.clone().normalize(),direction(at,path.rows[Math.min(row,4)][1].pos));
      player.mixer.stopAllAction();player.current=null;player.oneShot=false;carrier.add(player.obj);player.obj.position.set(.42,0,0);player.obj.quaternion.identity();
      if(companion){carrier.add(companion.root);companion.root.position.set(-.72,0,-.1);companion.root.quaternion.identity();}
      seatedPose();document.body.classList.add('p-activity');hud.hidden=false;
    }
    function dismount(){
      if(!carrier)return;scene.attach(player.obj);player.dir.copy(player.obj.position).normalize();player.radius=surfaceRadius(player.dir);player.obj.position.copy(player.dir).multiplyScalar(player.radius);orient(player.obj,player.dir,player.heading);
      player.obj.traverse(o=>{if(/^(Leg|Arm)[LR]$/.test(o.name))o.rotation.set(0,0,0);});player.current=null;player.oneShot=false;
      if(companion){scene.attach(companion.root);const d=companion.root.position.clone().normalize();companion.root.position.copy(d).multiplyScalar(surfaceRadius(d)+.035);}
      carrier.removeFromParent();carrier=null;camOrbit=0;standing=null;returnForward=null;hud.hidden=true;document.body.classList.remove('p-activity');c.cameraShot(null);
    }
    function stepTop(r,col){const p=path.rows[r][col];return path.position(r,col).addScaledVector(p.dir,p.radius*.91);}
    let camOrbit=0,camOrbitAt=-99;   // riding: the child can drag to swing the camera round; it eases back after 4 s idle
    function followShot(){
      const at=carrier.position,up=at.clone().normalize(),next=row<5?path.rows[row][1].pos:world.island.group.getWorldPosition(new V());
      if(mode==='return'){
        const f=tangent(returnForward||player.heading,up),focus=at.clone().addScaledVector(up,.8).addScaledVector(f,.6),pos=at.clone().addScaledVector(up,5.8).addScaledVector(f,-10.5);pos.sub(focus).applyAxisAngle(up,camOrbit).add(focus);
        const d=pos.clone().normalize();if(pos.length()<surfaceRadius(d)+4)pos.copy(d).multiplyScalar(surfaceRadius(d)+4);
        return {focus,position:pos,up,lift:1,zoom:1,ahead:0};
      }
      // Use the row's stable forward direction. Looking at the chosen bubble from the child's
      // changing feet position makes the camera whip sideways at the end of a jump.
      const r=Math.min(row,4),left=path.rows[r][0].pos,right=path.rows[r][2].pos;
      let f=new V().crossVectors(right.clone().sub(left),up).normalize();
      const travel=path.rows[Math.min(r+1,4)][1].pos.clone().sub(r?path.rows[r-1][1].pos:world.landmarks.spawn.dir.clone().multiplyScalar(16.7));
      if(f.dot(travel)<0)f.negate();
      const target=next.clone().addScaledVector(next.clone().normalize(),.2),focus=at.clone().lerp(target,.62).addScaledVector(up,.75);
      const portrait=camera.aspect<.8,dist=portrait?17.5:11.5,height=portrait?7.8:5.8;
      const pos=focus.clone().addScaledVector(f,-dist).addScaledVector(up,height);pos.sub(focus).applyAxisAngle(up,camOrbit).add(focus);
      // The radial lower bound also protects a camera transition near the shoreline.
      const d=pos.clone().normalize();if(pos.length()<surfaceRadius(d)+4)pos.copy(d).multiplyScalar(surfaceRadius(d)+4);
      return {focus,position:pos,up,lift:1,zoom:1,ahead:0};
    }
    async function boardCamera(){
      const start=camera.position.clone(),startUp=camera.up.clone(),look=start.clone().addScaledVector(camera.getWorldDirection(new V()),9),end=followShot();
      const turn=new T.Quaternion().setFromUnitVectors(start.clone().normalize(),end.position.clone().normalize());
      await tween(1.25,t=>{const q=ease(t),d=start.clone().normalize().applyQuaternion(new T.Quaternion().slerp(turn,q)),radius=Math.max(surfaceRadius(d)+4,T.MathUtils.lerp(start.length(),end.position.length(),q)+Math.sin(Math.PI*q)*3);c.cameraShot({position:d.multiplyScalar(radius),focus:look.clone().lerp(end.focus,q),up:startUp.clone().lerp(end.up,q).normalize(),direct:true});});
    }
    function clearChoices(){for(const b of choices)b.toy.removeFromParent();choices=[];readingWord=null;}
    const distract=['tent','sun','cat','sock','igloo','ant'];
    function createChoices(){
      clearChoices();const correct=row%3,words=[distract[row],distract[(row+2)%6]];words.splice(correct,0,YAYA_PLANET_P.BUBBLE_WORDS[row].word);
      choices=words.map((word,col)=>{
        const point=path.rows[row][col],toy=YayaWordModels.create(T,word,{lowPower:c.LOW_POWER});
        if(!toy)throw new Error('Missing P vocabulary model: '+word);
        const box=new T.Box3().setFromObject(toy),size=box.getSize(new V()),scale=Math.min(1.35/size.y,1.4/Math.max(size.x,size.z));toy.scale.setScalar(scale);toy.userData.pBaseScale=scale;
        toy.position.copy(point.pos).addScaledVector(point.dir,-size.y*scale*.48);orient(toy,point.dir,direction(point.pos,carrier.position));scene.add(toy);
        path.setStep(row,col,{visible:true,scale:.05,highlight:0,offset:new V()});return {col,word,correct:col===correct,toy,point,popped:false,scale};
      });
    }
    async function announce(){
      if(!carrier||row>=5)return;setMode('announce');createChoices();text(`第 ${row+1}/5 跳 · 听一听泡泡的名字`);
      await tween(.65,t=>choices.forEach(b=>{const k=.05+.95*ease(t);path.setStep(row,b.col,{scale:k});b.toy.scale.setScalar(b.scale*k);}));
      for(const b of choices){
        readingWord=b.word;path.setStep(row,b.col,{highlight:1});
        await Promise.all([c.playWord(b.word),tween(.6,t=>{const bob=Math.sin(Math.PI*t)*.18;path.setStep(row,b.col,{offset:b.point.dir.clone().multiplyScalar(bob)});b.toy.position.copy(b.point.pos).addScaledVector(b.point.dir,bob-.65);})]);
        path.setStep(row,b.col,{highlight:0,offset:new V()});b.toy.position.copy(b.point.pos).addScaledVector(b.point.dir,-.65);
      }
      readingWord=null;await c.playWord('ls-p');setMode('choose');text(`第 ${row+1}/5 跳 · 点一个 /p/ 开头的泡泡`);
    }
    async function select(col){
      if(mode!=='choose')return;const b=choices.find(x=>x.col===col);if(!b||b.popped)return;setMode('jump');
      if(!b.correct){
        b.popped=true;path.setStep(row,col,{visible:false});b.toy.visible=false;sfx.pop?.();sparkle(b.point.pos,22);await line('p01-jump-no');await c.playWord('ls-p');setMode('choose');text('站稳啦 · 还可以选另一个泡泡');return;
      }
      standing=null;const from=carrier.position.clone(),to=stepTop(row,col),up=from.clone().normalize();
      player.heading.copy(direction(from,to));sfx.bubble?.();
      await tween(1.1,t=>{carrier.position.lerpVectors(from,to,ease(t)).addScaledVector(up,Math.sin(Math.PI*t)*2.2);orient(carrier,carrier.position.clone().normalize(),player.heading);});
      b.toy.visible=false;
      await tween(.65,t=>{const press=Math.sin(Math.PI*t)*.33;path.setStep(row,col,{compression:press});carrier.position.copy(stepTop(row,col)).addScaledVector(b.point.dir,-press*.65);});path.setStep(row,col,{compression:0});carrier.position.copy(stepTop(row,col));standing={row,col};setMode('settled');
      await tween(.55,t=>choices.filter(x=>x!==b&&!x.popped).forEach(x=>{path.setStep(row,x.col,{offset:x.point.dir.clone().multiplyScalar(t*2),scale:1-t});x.toy.scale.setScalar(x.scale*(1-t));x.toy.position.addScaledVector(x.point.dir,.025);}));
      for(const x of choices)if(x!==b)path.setStep(row,x.col,{visible:false});
      await line(row===0?'p01-jump-first':'p01-jump-ok');
      if(row===1||row===3){setMode('trace');hud.hidden=true;await c.trace(row===1?0:1);hud.hidden=false;}
      c.mark('step'+row);c.stars(2);c.save();clearChoices();row++;
      if(row<5){setMode('advance');await wait(.25);announce();}else prepareRescue();
    }
    async function prepareRescue(){setMode('rescue-intro');text('糖糖就在大泡泡里');await line('p01-rescue');setMode('rescue');text('点糖糖外面的大泡泡，救她出来');}
    async function rescue(){
      if(mode!=='rescue')return;setMode('rescuing');world.rescue();sfx.pop?.();world.island.group.updateMatrixWorld(true);const at=world.island.tangtang.root.getWorldPosition(new V());sparkle(at,24);
      const pig=world.island.tangtang.root;scene.attach(pig);const to=carrier.localToWorld(new V(-.72,.9,-.1)),up=at.clone().normalize(),fromQ=pig.quaternion.clone();
      await tween(1.1,t=>{pig.position.lerpVectors(at,to,ease(t)).addScaledVector(up,Math.sin(Math.PI*t)*.7);pig.quaternion.copy(fromQ).slerp(carrier.quaternion,ease(t));});carrier.attach(pig);pig.position.set(-.72,.9,-.1);pig.quaternion.identity();
      await line('p01-tangtang');await line('p01-saved');standing=null;setMode('return');text('坐稳啦，泡泡带大家回家');
      transporting=true;updateTransport();
      const start=carrier.position.clone(),home=world.landmarks.pupu.dir.clone().lerp(world.landmarks.spawn.dir,.35).normalize(),end=home.clone().multiplyScalar(surfaceRadius(home)+.08),turn=new T.Quaternion().setFromUnitVectors(start.clone().normalize(),home);returnForward=direction(start,end);
      await tween(6,t=>{const q=ease(t),d=start.clone().normalize().applyQuaternion(new T.Quaternion().slerp(turn,q));const r=Math.max(surfaceRadius(d)+.08,T.MathUtils.lerp(start.length(),end.length(),q)+Math.sin(Math.PI*q)*1.1);carrier.position.copy(d).multiplyScalar(r);orient(carrier,d,player.heading);});
      transporting=false;world.bubbles.clearExternal('p-transport');sparkle(carrier.position,14);world.returnHome();activity.rescued=true;persist();world.bubblePath.resetSteps();dismount();setMode('idle');c.save();const resolve=resolvePlay;resolvePlay=null;resolve?.(true);
    }
    function updateTransport(){if(!transporting||!carrier)return;carrier.updateMatrixWorld(true);const matrix=new T.Matrix4().compose(new V(0,.65,0),blankQ,new V(2,2,2)).premultiply(carrier.matrixWorld);world.bubbles.setExternal('p-transport',[matrix]);}
    async function play(){
      if(mode!=='idle'||carrier)return false;if(activity.rescued){world.rescue();world.returnHome();return true;}
      c.stopRoute();setMode('approach');row=0;while(row<5&&c.has('step'+row))row++;
      const complete=new Promise(resolve=>resolvePlay=resolve),shore=localP(YAYA_P_ART.LAYOUT.lake.x,YAYA_P_ART.LAYOUT.lake.a-YAYA_P_ART.LAYOUT.lake.rz-1.5);
      await Promise.race([new Promise(resolve=>c.routeTo(shore,1.1,resolve)),wait(12)]);c.stopRoute();path.allSteps(false);
      const at=row>0?stepTop(row-1,(row-1)%3):player.obj.position.clone();if(row>0){path.setStep(row-1,(row-1)%3,{visible:true,scale:1});standing={row:row-1,col:(row-1)%3};}mount(at);text('准备好，一起跳泡泡');
      setMode('boarding');await boardCamera();setMode('intro');await line('p01-jump-go');await c.playWord('ls-p');if(row<5)announce();else prepareRescue();return complete;
    }
    function pick(clientX,clientY){ndc.set(clientX/innerWidth*2-1,1-clientY/innerHeight*2);ray.setFromCamera(ndc,camera);}
    function tap(clientX,clientY){
      if(!carrier)return false;pick(clientX,clientY);
      if(mode==='choose'){let best=null,dist=Infinity;for(const b of choices){if(b.popped)continue;const hit=ray.ray.intersectSphere(new T.Sphere(path.position(row,b.col),b.point.radius*1.12),new V());if(hit&&hit.distanceTo(camera.position)<dist){best=b;dist=hit.distanceTo(camera.position);}}if(best)select(best.col);}
      else if(mode==='rescue'){world.island.bubble.updateMatrixWorld(true);if(ray.intersectObject(world.island.bubble,false).length)rescue();}
      return true;
    }

    // One reusable bubble. Releasing or holding too long is always a success; cancel is deliberately neutral.
    async function ending(){
      c.stopRoute();setMode('fixing');document.body.classList.add('p-activity');world.setFixed({immediate:false});c.cameraShot(world.overview(camera.aspect));await line('p01-fixed');await wait(2.8);
      const up=world.landmarks.pupu.dir.clone(),at=orchard.granny.root.getWorldPosition(new V()),front=tangent(world.landmarks.spawn.dir.clone().sub(up),up);
      c.cameraShot({focus:at.clone().addScaledVector(up,2),position:at.clone().addScaledVector(up,5).addScaledVector(front,11),up});await line('p01-blow');
      blown=activity.blown;hud.hidden=false;setMode('blow');text(`按住屏幕吹泡泡，松手放飞 · ${blown}/3`);
      if(blown<3)await new Promise(resolve=>blowResolve=resolve);hud.hidden=true;setMode('family');await line('p01-blow-done');await wait(1);setMode('reward');
    }
    function pointerDown(x,y,id){
      if(mode!=='blow'||held||blowBubble||blown>=3)return false;
      world.reserveBubbles('p-blow',1);blowBubble=new T.Mesh(shellGeo,glass);blowBubble.name='p-blown-bubble';blowBubble.renderOrder=4;scene.add(blowBubble);held={id,time:0};positionBlow();return true;
    }
    function positionBlow(){if(!held||!blowBubble)return;const f=camera.getWorldDirection(new V());blowBubble.position.copy(camera.position).addScaledVector(f,4.2).addScaledVector(camera.up,-.1);blowBubble.scale.setScalar(.15+Math.min(held.time,3.6)*.32);}
    async function finishBlow(pop){
      if(!held||!blowBubble)return;held=null;setMode('blow-release');const b=blowBubble;
      if(pop){sparkle(b.position,24);sfx.pop?.();b.visible=false;await wait(.35);}else{const from=b.position.clone(),up=camera.up.clone(),forward=camera.getWorldDirection(new V());await tween(1.35,t=>b.position.copy(from).addScaledVector(up,ease(t)*6).addScaledVector(forward,t*2));}
      b.removeFromParent();blowBubble=null;world.releaseBubbles('p-blow');blown++;activity.blown=Math.min(3,blown);persist();setMode('blow');text(`泡泡飞起来啦 · ${blown}/3`);
      if(blown>=3){const resolve=blowResolve;blowResolve=null;resolve?.();}
    }
    function pointerUp(id,cancelled=false){
      if(!held||held.id!==id)return false;if(cancelled){held=null;blowBubble?.removeFromParent();blowBubble=null;world.releaseBubbles('p-blow');text(`按住屏幕吹泡泡，松手放飞 · ${blown}/3`);return true;}finishBlow(false);return true;
    }

    // A single merged rainbow wand, displayed in front of the camera so the explorer cannot cover it.
    function makeReward(){
      const gift=orchard.pie;if(gift.userData.pWand)return gift;
      const b=YAYA_I_ART.makeBatch(T,YayaRound3.roundedBox(T,.08)),colors=['#f98fb8','#ffbd78','#ffe078','#94dcb8','#86c9ed','#c2a3ec'];
      for(let i=0;i<6;i++)b.block(0,.15+i*.12,0,.15,.14,.15,colors[i]);
      for(let i=0;i<18;i++){const a=i*Math.PI*2/18;b.block(Math.sin(a)*.36,1.08+Math.cos(a)*.36,0,.15,.15,.16,colors[Math.floor(i/3)],{rz:-a});}
      b.block(0,.76,0,.23,.16,.2,'#fff2bd');const mesh=b.mesh(new T.MeshBasicMaterial({vertexColors:true}),'p-rainbow-wand');gift.add(mesh);
      gift.position.copy(STAGE.group.localToWorld(new V(0,STAGE.top+.08,0)));gift.quaternion.copy(STAGE.group.quaternion);gift.userData.pWand=true;return gift;
    }
    makeReward();
    async function showReward(){
      const gift=makeReward(),home=gift.position.clone(),rot=gift.quaternion.clone(),scale=gift.scale.clone(),visible=player.obj.visible,uniVisible=companion?.root.visible;
      const up=STAGE.center.clone(),focus=home.clone().addScaledVector(up,.7);c.cameraShot({focus,position:focus.clone().addScaledVector(up,3).addScaledVector(STAGE.front,6),up});
      document.body.classList.add('p-reward');gift.visible=true;gift.scale.setScalar(.01);player.obj.visible=false;if(companion)companion.root.visible=false;sfx.fanfare?.();rewardPhase='pop';
      const pop=home.clone().addScaledVector(up,1.5);let stars=null;
      try{
        await tween(.65,t=>{gift.position.lerpVectors(home,pop,t);gift.scale.copy(scale).multiplyScalar(Math.max(.01,t+Math.sin(t*Math.PI)*.2));});
        const camAt=camera.position.clone(),camUp=camera.up.clone(),look=camera.getWorldDirection(new V()),forward=tangent(look,camUp).addScaledVector(camUp,.25).normalize();
        rewardPhase='fly';await tween(.4,t=>c.cameraShot({position:camAt,focus:camAt.clone().add(look.clone().lerp(forward,t)),up:camUp,direct:true}));
        const centre=camAt.clone().addScaledVector(forward,4.6).addScaledVector(camUp,-1),face=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(new V(),forward.clone().negate(),camUp));
        await tween(.85,t=>{const q=ease(t);gift.position.lerpVectors(pop,centre,q);gift.scale.copy(scale).multiplyScalar(1+q*.4);gift.quaternion.copy(rot).slerp(face,q);});
        const shape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.045:.1;i?shape.lineTo(Math.cos(a)*r,Math.sin(a)*r):shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}shape.closePath();
        stars=new T.InstancedMesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({side:T.DoubleSide}),18);const dummy=new T.Object3D(),side=new V().crossVectors(forward,camUp).normalize(),colors=['#ff9aa8','#ffc78a','#fff09a','#a8e6a1','#9fd3ff','#c9a6ff'];for(let i=0;i<18;i++)stars.setColorAt(i,new T.Color(colors[i%6]));scene.add(stars);rewardPhase='show';
        await Promise.all([line('p01-reward'),tween(2.8,t=>{gift.quaternion.copy(face).multiply(new T.Quaternion().setFromAxisAngle(UP,t*Math.PI*2));for(let i=0;i<18;i++){const a=i*Math.PI/9+t*.4,r=.9+Math.sin(t*Math.PI)*.35;dummy.position.copy(centre).addScaledVector(camUp,1+Math.sin(a)*r).addScaledVector(side,Math.cos(a)*r);dummy.quaternion.copy(camera.quaternion);dummy.rotateZ(t*3+a);dummy.scale.setScalar(1);dummy.updateMatrix();stars.setMatrixAt(i,dummy.matrix);}stars.instanceMatrix.needsUpdate=true;
          const bubbleMatrices=[];for(let i=0;i<6;i++){const a=i*Math.PI/3-t*.6;dummy.position.copy(centre).addScaledVector(camUp,1+Math.sin(a)*1.4+t*.3).addScaledVector(side,Math.cos(a)*1.1);dummy.scale.setScalar(.09+(i%3)*.035);dummy.updateMatrix();bubbleMatrices.push(dummy.matrix.clone());}world.bubbles.setExternal('p-reward',bubbleMatrices);})]);
        rewardPhase='return';await tween(.8,t=>{gift.position.lerpVectors(centre,home,ease(t));gift.scale.copy(scale).multiplyScalar(1.4-.4*t);gift.quaternion.copy(face).slerp(rot,t);});
      }finally{removeOwned(stars);world.bubbles.clearExternal('p-reward');gift.position.copy(home);gift.quaternion.copy(rot);gift.scale.copy(scale);player.obj.visible=visible;if(companion)companion.root.visible=uniVisible;rewardPhase=null;document.body.classList.remove('p-reward');}
    }
    function endDone(){held=null;blowBubble?.removeFromParent();blowBubble=null;world.releaseBubbles('p-blow');setMode('idle');hud.hidden=true;document.body.classList.remove('p-activity','p-reward');c.cameraShot(null);}
    function update(dt,time){
      lastTime=time;
      if(mode==='pop'){
        for(const p of pops)if(!p.got){p.root.position.copy(p.base).addScaledVector(p.dir,Math.sin(time*1.2+p.i)*.1);p.gem.rotation.y=time*.7;}
        if(!(busy&&donePops()===3))orbit.forEach((o,i)=>{const up=player.dir,side=tangent(new V(1,0,0),up),front=new V().crossVectors(up,side);o.position.copy(player.obj.position).addScaledVector(up,1.5).addScaledVector(side,Math.cos(time*2+i*2.1)*.7).addScaledVector(front,Math.sin(time*2+i*2.1)*.7);o.rotation.y=time;});updatePopShells();
      }
      if(carrier){if(standing)carrier.position.copy(stepTop(standing.row,standing.col));player.dir.copy(carrier.position).normalize();seatedPose();updateTransport();if(lastTime-camOrbitAt>4)camOrbit*=Math.max(0,1-Math.min(dt,.1)*1.2);if(mode!=='boarding')c.cameraShot(followShot());}
      if(held){held.time+=Math.min(dt,.1);positionBlow();text(`泡泡正在变大 · ${blown}/3`);if(held.time>=3.8)finishBlow(true);}
    }
    return {orbitCamera(d){if(!carrier)return;camOrbit=Math.max(-2.8,Math.min(2.8,camOrbit+d));camOrbitAt=lastTime;},startPop,tapPop,target,targets:()=>pops.filter(p=>!p.got).map(p=>p.root),popDone:()=>donePops()===3,play,tap,select,update,ending,showReward,endDone,pointerDown,pointerUp,seatedPose,
      get popActive(){return mode==='pop';},get popBusy(){return busy;},get riding(){return !!carrier;},get locked(){return busy||!!carrier||!['idle','pop'].includes(mode);},get endingActive(){return ['blow','blow-release'].includes(mode);},
      snapshot:()=>({mode,busy,row,readingWord,rewardPhase,blown,held:held?held.time:null,rescued:activity.rescued,standing,orbitCount:orbit.length,carrier:carrier?.position.toArray()||null,pops:pops.filter(p=>!p.got).map(p=>({i:p.i,position:p.root.position.toArray()})),choices:choices.map(b=>({col:b.col,word:b.word,correct:b.correct,popped:b.popped,position:path.position(row,b.col).toArray()})),legs:['LegL','LegR'].map(n=>player.obj.getObjectByName(n)?.rotation.x),companionLegs:companion?.model.legs.map(l=>l.rotation.x),time:lastTime})};
  }
  window.YayaPGame={create};
})();
