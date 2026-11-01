/* Original voxel rigs, inspired by the supplied palette and silhouette references.
   Static details are baked per moving joint; no downloaded character models. */
(() => {
  function kit(T) {
    const flat=new T.BoxGeometry(1,1,1).toNonIndexed();
    const shape=new T.Shape(),r=.075;
    shape.moveTo(-.5+r,-.5);shape.lineTo(.5-r,-.5);shape.quadraticCurveTo(.5,-.5,.5,-.5+r);
    shape.lineTo(.5,.5-r);shape.quadraticCurveTo(.5,.5,.5-r,.5);shape.lineTo(-.5+r,.5);
    shape.quadraticCurveTo(-.5,.5,-.5,.5-r);shape.lineTo(-.5,-.5+r);shape.quadraticCurveTo(-.5,-.5,-.5+r,-.5);
    let soft=new T.ExtrudeGeometry(shape,{depth:.85,bevelEnabled:true,bevelThickness:.075,bevelSize:.025,bevelSegments:1,curveSegments:2});soft.center();
    if(soft.index)soft=soft.toNonIndexed();
    const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:0});
    function group(parent,name,pos) {const o=new T.Group();o.name=name;if(pos)o.position.set(...pos);parent.add(o);return o;}
    function batch(parent,parts,rounded=false) {
      const p=[],n=[],c=[],geo=rounded?soft:flat,v=new T.Vector3(),normal=new T.Vector3(),color=new T.Color();
      const m=new T.Matrix4(),nm=new T.Matrix3(),q=new T.Quaternion();
      for(const a of parts) {
        const [pos,scale,hex,rotation=[0,0,0]]=a;
        m.compose(new T.Vector3(...pos),q.setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale));nm.getNormalMatrix(m);color.set(hex);
        for(let i=0;i<geo.attributes.position.count;i++) {
          v.fromBufferAttribute(geo.attributes.position,i).applyMatrix4(m);normal.fromBufferAttribute(geo.attributes.normal,i).applyNormalMatrix(nm);
          p.push(v.x,v.y,v.z);n.push(normal.x,normal.y,normal.z);c.push(color.r,color.g,color.b);
        }
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.computeBoundingSphere();
      const mesh=new T.Mesh(g,mat);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    }
    return {group,batch};
  }
  function explorer(T, avatar = "boy") {
    const {group,batch}=kit(T),root=new T.Group();root.name='YayaExplorer';
    const rig=group(root,'Rig',[0,0,0]),body=group(rig,'Torso',[0,.77,0]);
    const girl=avatar==='girl',green=girl?'#f2c12e':'#527c65',dark='#355346',edge=girl?'#ffd95c':'#74947b',skin='#edc29a',boot='#604339',leather='#a47249',copper='#b56b3c';
    if(girl){
      // Round 5 girl: chibi proportions (big head, small A-line dress), cream hair with two long ringlet braids tied
      // with pale ribbons, lavender eyes, pink-purple dress, charcoal stockings - simple pixel shapes, a few tones per material.
      const hair='#f1eee8',hairShade='#dcd6cc',hairDeep='#a9a2a0',ribbon='#ebc6ec',ribbonDeep='#b47fc0',dress='#d2a4e4',dressShade='#b689cd',trim='#f6eef8',stock='#4a4854',shoe='#35333d';
      batch(body,[
        [[0,.13,0],[.34,.30,.23],dress],[[0,.25,.005],[.30,.06,.235],dressShade],        // bodice + neckline shade
        [[0,.27,.12],[.12,.05,.03],trim],[[0,.27,.135],[.04,.04,.02],ribbonDeep],          // little collar bow
        [[0,-.05,.0],[.42,.12,.29],dress],[[0,-.17,0],[.50,.13,.34],dress],               // flared skirt
        [[0,-.28,0],[.56,.11,.37],dress],[[0,-.34,0],[.565,.03,.375],trim],               // lower tier + hem line
        [[-.13,-.05,.15],[.05,.12,.01],dressShade],[[.13,-.05,.15],[.05,.12,.01],dressShade], // skirt pleats
      ]);
      const head=group(rig,'Head',[0,1.3,0]);
      batch(head,[
        [[0,-.01,0],[.46,.42,.40],skin],
        // hair cap, back and sides
        [[0,.2,-.01],[.52,.15,.47],hair],[[0,.27,-.03],[.42,.06,.38],hairShade],
        [[0,.0,-.215],[.52,.48,.12],hair],[[0,-.2,-.205],[.46,.1,.1],hairShade],
        [[0,.08,-.278],[.025,.28,.01],hairShade],[[-.13,-.08,-.276],[.2,.05,.01],hairShade],[[.13,-.11,-.276],[.2,.05,.01],hairShade],   // back-of-head strands
        [[-.255,.01,-.02],[.06,.4,.42],hair],[[.255,.01,-.02],[.06,.4,.42],hair],
        // straight-cut bangs with two gaps, like the pixel reference
        [[0,.155,.205],[.48,.08,.06],hair],
        [[-.165,.085,.215],[.13,.08,.05],hair],[[-.02,.08,.215],[.12,.07,.05],hairShade],[[.15,.09,.215],[.14,.08,.05],hair],
        [[-.215,-.02,.2],[.06,.18,.06],hair],[[.215,-.02,.2],[.06,.18,.06],hair],
        // big soft lavender eyes with a light catch, tiny mouth, pink cheeks
        [[-.1,-.04,.205],[.085,.12,.02],'#968dc4'],[[.1,-.04,.205],[.085,.12,.02],'#968dc4'],
        [[-.1,-.075,.212],[.085,.05,.01],'#6c639c'],[[.1,-.075,.212],[.085,.05,.01],'#6c639c'],
        [[-.115,-.005,.217],[.03,.03,.008],'#ffffff'],[[.085,-.005,.217],[.03,.03,.008],'#ffffff'],
        [[0,-.135,.204],[.05,.016,.012],'#c98a86'],
        [[-.165,-.1,.204],[.06,.03,.01],'#f2b8b4'],[[.165,-.1,.204],[.06,.03,.01],'#f2b8b4'],
      ]);
      // two long ringlet braids hanging from ribbon bows high on each side of the head
      for(const sx of [-1,1]){
        const parts=[
          [[sx*.29,.2,-.04],[.08,.08,.08],ribbonDeep],[[sx*.36,.27,-.04],[.12,.1,.05],ribbon],[[sx*.36,.14,-.04],[.11,.08,.05],ribbon],[[sx*.43,.3,-.04],[.05,.05,.04],ribbonDeep],[[sx*.43,.1,-.04],[.05,.06,.04],ribbonDeep],
        ];
        const seg=[[.12,.11],[.13,.1],[.12,.1],[.13,.1],[.12,.1],[.11,.09],[.1,.09],[.08,.07]];
        let y=.07;
        seg.forEach(([w,h],i)=>{const x=sx*(.34+(i%2?.03:0)),z=-.05+(i%2?.015:-.005);parts.push([[x,y-h/2,z],[w,h,w],i%2?hairShade:hair]);parts.push([[x+sx*(i%2?-.02:.02),y-h+.01,z],[w*.75,.02,w*1.02],hairDeep]);y-=h-.008;});
        parts.push([[sx*.33,y-.02,-.05],[.06,.06,.06],ribbon]);
        batch(head,parts);
      }
      head.scale.setScalar(1.2); // chibi: big head
      for(const side of [-1,1]) {
        const arm=group(rig,side<0?'ArmL':'ArmR',[side*.255,1.0,0]);
        batch(arm,[ [[0,-.05,0],[.14,.14,.17],dress],[[0,-.115,0],[.145,.03,.175],trim],[[0,-.23,.005],[.095,.2,.11],skin],[[0,-.35,.01],[.105,.075,.12],skin] ]);
        const leg=group(rig,side<0?'LegL':'LegR',[side*.1,.59,0]);
        batch(leg,[ [[0,-.24,0],[.12,.36,.14],stock],[[0,-.455,.025],[.145,.1,.2],shoe],[[0,-.415,.11],[.1,.03,.03],'#5a5866'] ]);
      }
    } else {
      batch(body,[
        [[0,.09,0],[.43,.48,.25],green],[[0,.12,.132],[.13,.35,.025],'#f3dfbb'],
        [[-.12,.25,.15],[.12,.14,.04],edge, [0,0,-.18]],[[.12,.25,.15],[.12,.14,.04],edge,[0,0,.18]],
        [[0,-.08,.005],[.45,.08,.27],boot],[[.03,-.08,.15],[.095,.075,.025],'#d5b45f'],
        [[-.14,-.19,.02],[.16,.20,.28],green],[[.14,-.19,.02],[.16,.20,.28],green],
        [[-.235,-.04,.025],[.11,.19,.16],leather],[[-.235,.065,.025],[.125,.04,.17],'#c39663'],
        [[0,.08,-.19],[.32,.34,.17],leather],[[0,.23,-.21],[.35,.09,.18],'#c69966'],
        [[-.11,.10,-.285],[.04,.3,.018],boot],[[.11,.10,-.285],[.04,.3,.018],boot],
        [[-.13,.31,.09],[.045,.12,.22],leather],[[.13,.31,.09],[.045,.12,.22],leather],
        [[.02,.26,.157],[.04,.045,.018],'#e6c768'],
      ]);
      const head=group(rig,'Head',[0,1.3,0]);
      const eyeCol=girl?'#4a2c20':'#426c59';
      batch(head,[
        [[0,0,0],[.43,.39,.37],skin],
        ...(girl?[]:[[[0,.19,-.015],[.47,.12,.41],copper],
        [[0,.06,-.19],[.46,.30,.09],'#99512f'],[[-.205,.04,0],[.075,.30,.39],copper],
        [[.205,.07,-.06],[.075,.25,.28],copper],
        [[-.13,.105,.195],[.17,.13,.055],'#cb8349'],[[.015,.145,.195],[.14,.07,.055],'#d79b60'],
        [[.16,.10,.195],[.10,.13,.055],'#af6136']]),
        [[-.10,-.01,.19],[.09,.105,.022],'#fff7df'],[[.10,-.01,.19],[.09,.105,.022],'#fff7df'],
        [[-.083,-.01,.205],[.04,.068,.013],eyeCol],[[.083,-.01,.205],[.04,.068,.013],eyeCol],
        [[-.083,-.017,.216],[.023,.04,.008],'#303936'],[[.083,-.017,.216],[.023,.04,.008],'#303936'],
        [[0,-.065,.205],[.055,.045,.045],'#dca981'],[[0,-.12,.194],[.08,.018,.018],'#ac7257'],
        [[-.145,-.08,.19],[.06,.033,.016],'#dfaa94'],[[.145,-.08,.19],[.06,.033,.016],'#dfaa94'],
        ...(girl?[]:[[[-.24,-.015,0],[.065,.12,.09],skin],[[.24,-.015,0],[.065,.12,.09],skin],
        [[.12,.252,.03],[.13,.018,.10],'#d29355'],[[-.11,.252,-.07],[.13,.018,.12],'#94502f']]),
      ]);
      for(const side of [-1,1]) {
        const arm=group(rig,side<0?'ArmL':'ArmR',[side*.295,.99,0]);
        batch(arm,[ [[0,-.12,0],[.15,.29,.21],green],[[0,-.015,0],[.17,.09,.23],edge],[[0,-.25,.005],[.16,.07,.22],leather],[[0,-.36,.01],[.13,.16,.18],skin],[[0,-.43,.02],[.14,.08,.19],skin] ]);
        const leg=group(rig,side<0?'LegL':'LegR',[side*.115,.59,0]);
        batch(leg,[ [[0,-.17,0],[.17,.34,.21],girl?'#ecd0b0':'#48554e'],[[0,-.38,.025],[.19,.22,.27],girl?'#6b4330':boot],[[0,-.48,.065],[.205,.075,.33],girl?'#4a2e22':'#49352f'],[[0,-.305,.03],[.20,.045,.275],girl?'#f6eee0':'#886347'] ]);
      }
    }
    root.userData.avatar=avatar;
    const N=(path,t,v)=>new T.NumberKeyframeTrack(path,t,v);
    const clips=[];
    function clip(name,duration,tracks){clips.push(new T.AnimationClip(name,duration,tracks));}
    clip('idle',3,[N('Torso.position[y]',[0,1.5,3],[.77,.782,.77]),N('Head.rotation[y]',[0,1.5,3],[-.035,.035,-.035])]);
    function gait(name,dur,amp){clip(name,dur,['LegL','ArmR','LegR','ArmL'].map((joint,i)=>N(joint+'.rotation[x]',[0,dur/4,dur/2,dur*.75,dur],[0,(i<2?1:-1)*amp,0,(i<2?-1:1)*amp,0])));}
    gait('walk',.68,.52);gait('run',.44,.72);
    clip('interact-right',.75,[N('ArmR.rotation[x]',[0,.2,.42,.75],[0,-1.2,-.8,0]),N('Torso.rotation[x]',[0,.35,.75],[0,.13,0])]);
    clip('pick-up',.9,[N('Torso.rotation[x]',[0,.35,.9],[0,.4,0]),N('ArmR.rotation[x]',[0,.35,.9],[0,-.7,0])]);
    clip('emote-yes',1.1,[N('Head.rotation[x]',[0,.2,.4,.6,.8,1.1],[0,.16,-.1,.16,-.1,0]),N('ArmR.rotation[z]',[0,.3,.7,1.1],[0,-.7,-.7,0])]);
    clip('emote-no',1,[N('Head.rotation[y]',[0,.2,.4,.6,.8,1],[0,-.24,.24,-.24,.24,0])]);
    clip('sit',2,[N('Rig.position[y]',[0,.4,1.6,2],[0,-.22,-.22,0]),...['LegL','LegR'].map(n=>N(n+'.rotation[x]',[0,.4,1.6,2],[0,-1.3,-1.3,0]))]);
    clip('dance',1.2,[N('Rig.position[y]',[0,.3,.6,.9,1.2],[0,.09,0,.09,0]),N('ArmL.rotation[z]',[0,.3,.9,1.2],[0,.8,.8,0]),N('ArmR.rotation[z]',[0,.3,.9,1.2],[0,-.8,-.8,0])]);
    root.userData.characterStyle=girl?'twin-braid-cream-girl':'copper-haired-meadow-explorer';return {scene:root,animations:clips};
  }
  function unicorn(T) {
    const {group,batch}=kit(T),root=new T.Group(),body=group(root,'UnicornBody',[0,0,0]);
    const ivory='#fff2dd',shade='#e8dcca',hoof='#a2b6c1',pink='#e890b9',blue='#70bed4',purple='#a98bca';
    batch(body,[[[0,.58,-.07],[.43,.43,.77],ivory],[[0,.67,.29],[.35,.53,.32],ivory],[[0,.34,-.02],[.34,.08,.63],shade]],true);
    const head=group(body,'UnicornHead',[0,.94,.34]);
    batch(head,[[[0,0,.07],[.43,.43,.39],ivory],[[0,-.12,.31],[.38,.22,.28],ivory],[[0,-.24,.27],[.31,.035,.26],shade],
      [[-.22,.025,.17],[.025,.105,.085],'#3d424b'],[[.22,.025,.17],[.025,.105,.085],'#3d424b'],
      [[-.235,.052,.192],[.013,.028,.022],'#ffffff'],[[.235,.052,.192],[.013,.028,.022],'#ffffff'],
      [[-.194,-.09,.30],[.015,.045,.065],'#eab4bb'],[[.194,-.09,.30],[.015,.045,.065],'#eab4bb'],
      [[-.12,-.115,.456],[.052,.045,.015],'#6a6262'],[[.12,-.115,.456],[.052,.045,.015],'#6a6262'],
      [[0,.27,.16],[.14,.12,.14],'#edb955'],[[0,.37,.16],[.105,.10,.105],'#f7cb63'],[[0,.46,.16],[.065,.09,.065],'#ffdf8d'],
      [[0,.21,-.12],[.18,.13,.20],pink],[[0,.10,-.19],[.20,.13,.16],pink],[[0,-.025,-.19],[.20,.13,.16],purple]],true);
    const ears=[];
    for(const s of [-1,1]) {const e=group(head,'UnicornEar'+s,[s*.145,.25,-.025]);batch(e,[[[0,0,0],[.10,.20,.12],ivory],[[0,.015,.066],[.045,.12,.018],'#edb6bb']],true);ears.push(e);}
    batch(body,[[[0,.83,.09],[.20,.14,.20],purple],[[0,.72,.08],[.20,.14,.21],blue]],true);
    const legs=[];
    for(const x of [-.15,.15])for(const z of [-.31,.21]) {
      const leg=group(body,'UnicornLeg'+legs.length,[x,.43,z]);
      batch(leg,[[[0,-.12,0],[.14,.30,.16],ivory],[[0,-.35,.025],[.16,.14,.20],hoof]],true);legs.push(leg);
    }
    const tail=group(body,'UnicornTail',[0,.69,-.46]);
    batch(tail,[[[0,0,-.07],[.19,.18,.21],blue],[[0,-.14,-.13],[.21,.16,.19],blue],[[0,-.27,-.13],[.20,.13,.19],purple],[[0,-.365,-.105],[.15,.08,.16],pink]],true);
    root.name='unicorn-guide';root.userData.kind='guide';return {root,body,head,legs,ears,tail};
  }
  function createGuide({THREE:T,scene,player,moveAlong,tangent,arc,orient,upAt,surfaceRadius,obstacles,getContext}) {
    const model=unicorn(T),root=model.root;scene.add(root);root.scale.setScalar(.91);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let dir=null,heading=player.heading.clone(),mode='explore',lastProgress=null,cheer=0,speed=0,gait=0,stride=0;
    function update(dt,time) {
      const context=getContext();mode=context.mode;
      const side=new T.Vector3().crossVectors(player.heading,player.dir).normalize();
      const forward=context.target&&!['listen','dig','swipe','lesson','letters'].includes(mode)?tangent(context.target.dir.clone().sub(player.dir),player.dir):player.heading;
      const lead=context.target&&mode==='explore'?1.3:-.35;
      let goal=moveAlong(moveAlong(player.dir,forward,lead),side,-1.55).normalize();
      for(const o of obstacles)if(arc(goal,o.dir)<o.r+.45) goal=moveAlong(goal,tangent(goal.clone().sub(o.dir),goal),.5).normalize();
      if(!dir)dir=goal.clone();
      const distance=arc(dir,goal);speed=distance>.12?Math.min(4.4,distance*3.5):0;
      if(speed) {const toward=tangent(goal.clone().sub(dir),dir);dir.copy(moveAlong(dir,toward,Math.min(distance,speed*dt))).normalize();heading.lerp(toward,1-Math.exp(-dt*8));}
      else {const face=context.target&&mode==='explore'?context.target.dir:player.dir;heading.lerp(tangent(face.clone().sub(dir),dir),1-Math.exp(-dt*3));}
      if(lastProgress!==null&&context.progress>lastProgress)cheer=1.5;
      lastProgress=context.progress;cheer=Math.max(0,cheer-dt);
      const animate=!reduced.matches,hop=animate&&cheer?Math.sin((1.5-cheer)*Math.PI*4)**2*.10:0;
      root.position.copy(dir).multiplyScalar(surfaceRadius(dir)+.035);root.position.addScaledVector(upAt(dir),hop);
      orient(root,upAt(dir),tangent(heading,dir));
      // 跑步：步频跟着速度走，前后腿交替，身体一起一伏，尾巴往后飘
      gait+=(Math.min(1,speed/2.2)-gait)*Math.min(1,dt*8);stride+=dt*(7+speed*2.4);
      const swing=animate?gait*.85:0;
      model.legs.forEach((leg,i)=>{const ph=stride+(i===0||i===3?0:Math.PI)+(i>1?.5:0);leg.rotation.x=Math.sin(ph)*swing;leg.position.y=.43+Math.max(0,Math.cos(ph))*.05*gait;});
      model.body.position.y=animate?Math.abs(Math.sin(stride))*.07*gait:0;
      model.body.rotation.x=animate?Math.sin(stride*2)*.05*gait:0;
      model.tail.rotation.z=animate?Math.sin(time*2.5+stride*.5)*(.16+.1*gait):0;
      model.tail.rotation.x=animate?-.55*gait+Math.sin(stride*2)*.12*gait:0;
      model.ears.forEach((ear,i)=>ear.rotation.z=animate?Math.sin(time*1.9+i)*.07:0);
      model.head.rotation.x=animate?(cheer?Math.sin(time*9)*.12:Math.sin(time*1.5)*.025-Math.sin(stride*2)*.06*gait):0;
      model.head.rotation.y=animate&&speed<.1?Math.sin(time*.8)*.065:0;
      root.userData.guideMode=mode;
    }
    return {root,model,update,cheer:()=>{cheer=1.5;},snapshot:()=>({mode,position:root.position.toArray(),dir:dir?.toArray(),speed,cheer,legs:model.legs.map(l=>l.rotation.x),tail:model.tail.rotation.z,reducedMotion:reduced.matches})};
  }
  window.YayaCharacters={explorer,unicorn,createGuide,kit};
})();
