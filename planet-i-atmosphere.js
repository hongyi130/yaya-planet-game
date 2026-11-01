/* I atmosphere: surface sites, a shared animated animal batch and the reindeer sleigh.
   Original Bingbing/family geometry is untouched; wild penguins use the same builder. */
(() => {
  'use strict';
  const SNOW_GLSL = `
    float segmentDistance(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));}
    float snowflake(vec2 p,float angle,float style){
      float r=length(p),a=mod(atan(p.y,p.x)+angle+0.5235988,1.0471976)-0.5235988;
      vec2 q=vec2(cos(a),abs(sin(a)))*r;
      float arm=segmentDistance(q,vec2(.035,0.),vec2(.46,0.));
      float b1=segmentDistance(q,vec2(.18,0.),vec2(.29,.12+style*.015));
      float b2=segmentDistance(q,vec2(.30,0.),vec2(.40,.10-style*.012));
      float hex=max(abs(p.y),abs(p.x)*.8660254+abs(p.y)*.5)-.064;
      float d=min(min(arm-.014,b1-.011),min(b2-.010,hex));
      return (1.-smoothstep(-.003,.014,d))*(1.-smoothstep(.44,.50,r));
    }`;
  function builder(T) {
    const b=YAYA_I_ART.makeBatch(T,YayaRound3.roundedBox(T,.13)),part=[],pivot=[];
    return {block(x,y,z,sx,sy,sz,col,o={}){const n=b.count();b.block(x,y,z,sx,sy,sz,col,o);for(let i=n;i<b.count();i++){part.push(o.part||0);pivot.push(...(o.pivot||[0,0,0]));}},
      geometry(){const g=b.mesh(null).geometry;g.setAttribute('aPart',new T.Float32BufferAttribute(part,1));g.setAttribute('aPivot',new T.Float32BufferAttribute(pivot,3));return g;}};
  }
  function wildPenguin(T,chick){
    const p=YAYA_I_ART.penguin(T,{wild:true,chick}),ps=[],ns=[],cs=[],parts=[],pivots=[];p.root.scale.setScalar(1);p.root.updateMatrixWorld(true);
    const v=new T.Vector3(),n=new T.Vector3();p.root.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,nm=new T.Matrix3().getNormalMatrix(m.matrixWorld);
      for(let i=0;i<g.attributes.position.count;i++){v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(m.matrixWorld);n.fromBufferAttribute(g.attributes.normal,i).applyMatrix3(nm);ps.push(v.x,v.y,v.z);ns.push(n.x,n.y,n.z);cs.push(g.attributes.color.getX(i),g.attributes.color.getY(i),g.attributes.color.getZ(i));const head=m.name.includes('head'),wing=!head&&Math.abs(v.x)>.55&&v.y>.3&&v.y<1.15;parts.push(head?1:wing?(v.x<0?2:3):0);pivots.push(head?0:wing?(v.x<0?-.52:.52):0,head?1.2:wing?.88:0,0);}
      m.geometry.dispose();});
    const g=new T.BufferGeometry();[['position',ps,3],['normal',ns,3],['color',cs,3],['aPart',parts,1],['aPivot',pivots,3]].forEach(([k,v,n])=>g.setAttribute(k,new T.Float32BufferAttribute(v,n)));return g;
  }
  function animalGeometry(T,kind,variant=0){
    if(kind==='penguin')return wildPenguin(T,variant===1);
    const b=builder(T),B=(...args)=>b.block(...args),cream='#f4ead8',ink='#242a40';
    const face=(y,z,spread=.24)=>{for(const x of [-spread,spread]){B(x,y,z,.12,.15,.09,ink,{plain:true,part:1,pivot:[0,y-.2,z-.3]});B(x-.025,y+.04,z+.05,.04,.04,.025,'#fff',{plain:true,part:1,pivot:[0,y-.2,z-.3]});}};
    if(kind==='bear'){
      B(0,.61,-.12,1.02,.9,1.5,cream);B(0,.68,.78,.84,.73,.74,cream,{part:1,pivot:[0,.65,.4]});
      for(const x of [-.31,.31]){B(x,1.08,.65,.25,.26,.25,cream,{part:1,pivot:[0,.65,.4]});B(x,1.1,.8,.13,.13,.05,'#bd9d9a',{plain:true,part:1,pivot:[0,.65,.4]});}
      B(0,.50,1.13,.47,.3,.33,'#fff2dc',{part:1,pivot:[0,.65,.4]});B(0,.59,1.32,.22,.17,.10,ink,{part:1,pivot:[0,.65,.4]});face(.78,1.15);
      for(const x of [-.4,.4])for(const z of [-.58,.48])B(x,.17,z,.36,.34,.47,cream,{part:z>0?2:3,pivot:[x,.42,z]});B(0,.58,-.95,.25,.24,.28,cream);
      if(variant>0)B(0,.2,1.65,.38,.38,.38,'#d7e2f2',{part:7});
    }else if(kind==='seal'){
      B(0,.36,-.16,1.1,.66,1.45,'#858ca4');B(0,.56,.65,.84,.7,.70,'#9ca6b9',{part:1,pivot:[0,.4,.4]});face(.65,1.01,.23);
      B(0,.48,1.04,.42,.23,.18,'#c9c5cc',{part:1,pivot:[0,.4,.4]});B(0,.56,1.16,.17,.12,.08,ink,{plain:true,part:1,pivot:[0,.4,.4]});
      for(const s of [-1,1]){B(s*.64,.17,.3,.34,.16,.7,'#6b758e',{rz:s*.2,part:s<0?2:3,pivot:[s*.45,.27,.3]});B(s*.28,.25,-1.05,.58,.16,.5,'#737e98',{ry:s*.6,part:4,pivot:[0,.2,-.65]});for(let j=0;j<3;j++)B(s*(.26+j*.08),.43,1.14,.025,.025,.16,'#424c6b',{plain:true,ry:s*(.7+j*.3),part:1,pivot:[0,.4,.4]});}
      for(let i=0;i<7;i++)B(Math.sin(i*2.4)*.42,.68+(i%2)*.01,-.6+i*.14,.17,.035,.19,'#59627e',{plain:true});
    }else if(kind==='fox'){
      B(0,.48,0,.62,.52,1.05,'#e1dcde');B(0,.77,.64,.68,.62,.6,'#f5eee3',{part:1,pivot:[0,.55,.45]});
      for(const x of [-.23,.23]){B(x,1.17,.62,.24,.46,.26,'#eee2d9',{rz:x,part:1,pivot:[0,.55,.45]});B(x,1.2,.77,.10,.22,.04,'#c98799',{plain:true,part:1,pivot:[0,.55,.45]});}
      B(0,.63,1.0,.3,.24,.44,'#f7f0e1',{part:1,pivot:[0,.55,.45]});B(0,.69,1.24,.13,.13,.09,ink,{plain:true,part:1,pivot:[0,.55,.45]});face(.82,.98,.20);
      for(const x of [-.22,.22])for(const z of [-.35,.35])B(x,.18,z,.19,.36,.23,'#b9aec2',{part:x*z<0?2:3,pivot:[x,.36,z]});
      B(.12,.5,-.94,.56,.51,1.2,'#d2c7da',{rx:-.4,part:4,pivot:[0,.5,-.45]});B(.12,.76,-1.36,.48,.43,.48,'#f7eedc',{part:4,pivot:[0,.5,-.45]});
    }else if(kind==='snowman'){
      const hat=['#df577e','#58a58f','#e9a344'][variant%3];B(0,.46,0,1.03,.9,.92,'#d8dfea');B(0,1.08,0,.74,.66,.70,'#eee9e1',{part:1,pivot:[0,.92,0]});face(1.18,.37,.18);B(0,1.05,.46,.14,.13,.35,'#e97838',{part:1,pivot:[0,.92,0]});
      B(0,.84,0,.84,.15,.79,hat);for(const y of [.3,.55])B(0,y,.48,.09,.09,.06,ink,{plain:true});
      for(const s of [-1,1])B(s*.68,.71,0,.55,.075,.075,'#8a5e55',{rz:s*.3,plain:true,part:s<0?2:3,pivot:[s*.4,.7,0]});
      B(0,1.42,0,.85,.15,.78,hat,{part:6,pivot:[0,1.4,0]});B(0,1.61,0,.67,.3,.63,hat,{part:6,pivot:[0,1.4,0]});B(0,1.85,0,.23,.23,.23,'#fff2db',{part:6,pivot:[0,1.4,0]});
    }
    return b.geometry();
  }
  // Every animal keeps its own root matrix and tiny joint animation, in one draw.
  // Uniform count scales with LOW_POWER's reduced population, avoiding mobile bone textures.
  function animatedBatch(T,items,name){
    const arrays={position:[],normal:[],color:[],aPart:[],aPivot:[],aCreature:[]};
    items.forEach((item,id)=>{const g=item.geometry;for(let j=0;j<g.attributes.position.count;j++){for(const k of ['position','normal','color','aPivot']){const a=g.attributes[k];arrays[k].push(a.getX(j),a.getY(j),a.getZ(j));}arrays.aPart.push(g.attributes.aPart.getX(j));arrays.aCreature.push(id);}});
    const g=new T.BufferGeometry();for(const [k,a]of Object.entries(arrays))g.setAttribute(k,new T.Float32BufferAttribute(a,k==='aPart'||k==='aCreature'?1:3));
    const poses={value:items.map(()=>new T.Matrix4())},states={value:items.map(()=>new T.Vector4())},clock={value:0};
    const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.9,emissive:'#a4b2d4',emissiveIntensity:.14});
    mat.onBeforeCompile=sh=>{sh.uniforms.animalPose=poses;sh.uniforms.animalState=states;sh.uniforms.animalTime=clock;
      const lib=`attribute float aPart;attribute vec3 aPivot;attribute float aCreature;uniform mat4 animalPose[${items.length}];uniform vec4 animalState[${items.length}];uniform float animalTime;
        mat3 jointRotation(){vec4 s=animalState[int(aCreature)];float t=animalTime+s.x,react=s.y,kind=s.z;float a=0.,x=0.;
          if(aPart==1.){a=(kind==4.?0.:sin(t*1.6)*.10)+sin(t*8.)*react*.24;x=kind==1.?(-s.w*.38-.08*sin(t)):0.;}
          if(aPart==2.||aPart==3.){a=sin(t*(kind==5.?9.:3.8))*(kind==5.?.65:kind==4.?react*.4:.20+react*.5+s.w*.23)*(aPart==2.?1.:-1.);}
          if((kind==5.||kind==3.)&&(aPart==2.||aPart==3.)){x=a;a=0.;}
          if(aPart==4.)a=sin(t*3.)*.25+react*.3;
          return mat3(cos(a),sin(a),0.,-sin(a),cos(a),0.,0.,0.,1.)*mat3(1.,0.,0.,0.,cos(x),sin(x),0.,-sin(x),cos(x));}
      `;
      sh.vertexShader=lib+sh.vertexShader;
      sh.vertexShader=sh.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=mat3(animalPose[int(aCreature)])*jointRotation()*objectNormal;');
      sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vec3 jp=jointRotation()*(position-aPivot)+aPivot;
        if(aPart==7.){jp.z+=sin(animalTime*.9)*.4;jp.y+=abs(sin(animalTime*2.))*.06;}
        if(aPart==6.)jp.y+=animalState[int(aCreature)].y*abs(sin(animalTime*9.))*.25;
        transformed=(animalPose[int(aCreature)]*vec4(jp,1.)).xyz;`);
    };mat.customProgramCacheKey=()=>name+'-'+items.length;
    const mesh=new T.Mesh(g,mat);mesh.name=name;mesh.frustumCulled=false;
    return {mesh,poses:poses.value,states:states.value,clock,setTime(t){clock.value=t;}};
  }
  function siteDefinitions(T,lake){
    const polar=(th,az)=>new T.Vector3(Math.sin(th)*Math.cos(az),Math.cos(th),-Math.sin(th)*Math.sin(az));
    return [
      {id:'bay',name:'企鹅湾',dir:lake.clone(),kind:'penguin'},
      {id:'bear',name:'北极熊冰窟',dir:polar(1.84,1.25),kind:'bear'},
      {id:'seal',name:'海豹浮冰',dir:polar(1.76,.03),kind:'seal'},
      {id:'fox',name:'雪松林小狐狸',dir:polar(1.7,-1.07),kind:'fox'},
      {id:'cave',name:'冰晶洞',dir:polar(1.83,3.02),kind:'penguin'},
      {id:'snowman',name:'雪人山坡',dir:polar(1.80,-2.24),kind:'snowman'}
    ];
  }
  function snowPad(c,site,rx=3.6,rz=3.3){
    const {T,cells,surfaceRadius,sceneryB,bucket,frame}=c,V=T.Vector3,up=site.dir,hd=site.heading,rt=new V().crossVectors(up,hd).normalize();
    let top=surfaceRadius(up);const corner=.5*(Math.abs(up.x)+Math.abs(up.y)+Math.abs(up.z));
    for(const cell of cells){const p=new V(...cell),h=p.dot(up);if(h>14&&Math.abs(p.dot(rt))<rx+.65&&Math.abs(p.dot(hd))<rz+.65)top=Math.max(top,h+corner+.04);}
    site.top=top+.035;site.frame=frame(up,hd,site.top);site.rx=rx;site.rz=rz;
    const B=sceneryB('pad-'+bucket(up));B.setBase(site.frame);
    for(let x=-rx+.4;x<rx;x+=.8)for(let z=-rz+.4;z<rz;z+=.8){const d=up.clone().multiplyScalar(site.top).addScaledVector(rt,x).addScaledVector(hd,z).normalize(),h=surfaceRadius(d)*d.dot(up),depth=Math.max(.18,site.top-h+.18);B.block(x,-depth/2,z,.82,depth,.82,'#b4b2dc',{plain:true,top:'#eaf0fa',low:.9});}
    // Two lower terrace rings step the pad down into the terrain, so it reads as a snow ledge rather than a table.
    // Walking follows them through site.steps (see the surface override in planet-i-world.js).
    site.steps=[];
    if(c.slideDist)for(const [ring,drop] of [[1,.38],[2,.76]]){
      const sx=rx+ring*.8,sz=rz+ring*.8;site.steps.push({rx:sx,rz:sz,top:site.top-drop});
      for(let x=-sx+.4;x<sx;x+=.8)for(let z=-sz+.4;z<sz;z+=.8){
        if(Math.abs(x)<sx-.8&&Math.abs(z)<sz-.8)continue;
        const d=up.clone().multiplyScalar(site.top).addScaledVector(rt,x).addScaledVector(hd,z).normalize();if(c.slideDist(d)<2.4)continue;
        const h=surfaceRadius(d)*d.dot(up),depth=site.top-drop-h+.18;if(depth<.3)continue;
        B.block(x,-drop-depth/2,z,.82,depth,.82,'#aaa8d6',{plain:true,top:'#e6ecf8',low:.9});
      }
    }
    B.resetBase();
    return site;
  }
  function create(c){
    const {T,root,sites,sceneryB,bucket,frame,offsetDir,surfaceRadius,tangent,obstacles,LOW_POWER,slideDist,glowB}=c,A=YAYA_I_ART,V=T.Vector3;
    const creatures=[],lamps=[],corner=new V(),matrix=new T.Matrix4(),tmp=new T.Object3D(),UP=new V(0,1,0),kindId={penguin:0,bear:1,seal:2,fox:3,snowman:4};
    for(const site of sites){
      site.heading=tangent(new V(0,1,0).sub(site.dir),site.dir);site.frame=frame(site.dir,site.heading,surfaceRadius(site.dir)+.04);
      if(site.id!=='bay')snowPad(c,site);
      site.approach=offsetDir(site.dir,site.heading,0,4.5);
      const B=sceneryB('explore-'+bucket(site.dir));B.setBase(site.frame);
      const block=(...args)=>B.block(...args);
      if(site.id==='bear'||site.id==='seal'){
        for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){if(Math.hypot(x,z)>2.7)continue;block(x*.85,-.05,z*.85,.88,.17,.88,(x+z)%2?'#77abd0':'#8bc3e4',{plain:true,top:'#a2d9ee'});}
        block(.65,.07,1.1,1.25,.12,1.05,'#345878',{top:'#436f91'});
        for(let i=0;i<6;i++){const a=i*Math.PI/3;block(.65+Math.cos(a)*.72,.14,1.1+Math.sin(a)*.6,.44,.18,.36,'#d7e6f5',{ry:a});}
        for(let i=0;i<4;i++)block(-2.2+i*1.4,.2,-2.25+(i%2)*.3,.8,.5,.75,i%2?'#83bbdc':'#a7d2ef',{ry:i*.4});
      }
      if(site.id==='cave'){
        for(const side of [-1,1])for(let j=0;j<3;j++){block(side*(1.6+j*.4),.6+j*.4,-1-j*.35,.6,1.2+j*.8,.68,j%2?'#a7a6d8':'#85bde6',{rz:-side*.12});}
        block(0,2.6,-1.9,3.5,.65,1.15,'#a5bde4',{top:'#e8ebf8'});block(0,1,-2.25,2.4,2,.16,'#4c536f',{plain:true});
        glowB.setBase(site.frame);glowB.block(0,.95,-2.12,1.5,1.5,.07,'#ffd287',{plain:true,low:1});glowB.resetBase();
        obstacles.push({dir:offsetDir(site.dir,site.heading,0,-1.6),r:1.4,kind:'i-cave'});
      }
      if(site.id==='fox'){
        for(const [x,z,s]of [[-2.4,-1.2,.65],[2.5,-1.7,.8],[.8,-3,.72]]){const d=offsetDir(site.dir,site.heading,x,z);B.setBase(frame(d,site.heading,surfaceRadius(d)));A.pine(B,s,31+x*4);obstacles.push({dir:d,r:.55,kind:'i-pine'});}
        B.setBase(site.frame);
      }
      if(site.id==='snowman'){
        for(let j=0;j<5;j++)block(-2.2+(j%2)*.3,.14+Math.floor(j/2)*.2,1.1+j*.25,.36,.34,.36,'#d1dcef');
        for(const x of [1.8,2.15])block(x,.85,-.9,.22,1.8,.12,x<2?'#e65979':'#e3b357',{rz:-.2});
      }
      // A wooden lantern and coloured pennants give every site a warm, visible landmark; alternate sites mirror them.
      if(site.id!=='bay'){const mx=['seal','cave'].includes(site.id)?-1:1,block=(x,...r)=>B.block(x*mx,...r);
        block(-2.7,.8,.3,.16,1.6,.16,'#9b6852',{plain:true});block(-2.7,1.75,.3,.58,.14,.55,'#78526a');block(-2.7,1.3,.3,.58,.14,.55,'#78526a');
        glowB.setBase(site.frame);glowB.block(-2.7*mx,1.52,.3,.35,.35,.35,'#ffd397',{plain:true,low:1});glowB.resetBase();
        lamps.push({position:new V(-2.7*mx,1.52,.3).applyMatrix4(site.frame)});
        block(2.85,1.6,.8,.1,3.2,.1,'#987286',{plain:true});block(2.4,2.95,.8,.8,.45,.07,site.id==='fox'?'#ed8d58':'#ed729a',{plain:true});block(2.35,2.5,.8,.9,.36,.07,'#efc666',{plain:true});
        for(let i=0;i<3;i++)block(-1.8+i*.5,.35,-2.7,.3,.7+i*.2,.32,i%2?'#c7b5e7':'#84bedc',{rz:(i-1)*.18});
      }else{
        for(let i=0;i<12;i++)block(-1+(i%2)*.28,.04,2+i*.16,.09,.025,.15,'#8397b6',{plain:true,ry:.2});
      }
      B.resetBase();
      let count=site.kind==='penguin'?6:site.kind==='bear'?3:site.kind==='seal'?3:site.kind==='fox'?2:3;
      if(LOW_POWER)count=Math.ceil(count/2);
      for(let i=0;i<count;i++){
        const chick=site.kind==='penguin'&&i%3===2;
        let x=(i-(count-1)/2)*1.1,z=.2+(i%2)*.4;
        if(site.id==='bay'){x=-2.4+i*.95;z=2.2+(i%2)*.6;}
        if(site.id==='bear'){x=i===0?-.35:1+(i-1)*.9;z=i===0?0:-1.2;}
        const scale=site.kind==='penguin'?(chick?.36:.48+(i%2)*.04):site.kind==='bear'?(i===0?1.18:.60):site.kind==='snowman'?(1-i*.2):site.kind==='seal'?.8:1;
        const dir=offsetDir(site.dir,site.heading,x,z),motion=site.kind==='fox'?.7:site.kind==='penguin'?.25:.12;
        // Site radius is kept outside the slide; reserve the full motion envelope for navigation.
        const record={id:creatures.length,site,kind:site.kind,variant:chick?1:i,geometry:animalGeometry(T,site.kind,site.kind==='penguin'?(chick?1:0):i),x,z,scale,dir,position:new V(),phase:i*1.79+creatures.length*.7,reaction:0,cooldown:0,near:false,motion,sliding:site.id==='bay'&&i<2};
        if(record.geometry.attributes.position.count/3>1500)throw new Error('Animal geometry exceeds budget: '+record.kind);
        record.geometry.computeBoundingBox();creatures.push(record);obstacles.push({dir:dir.clone(),r:record.sliding?1.3:scale*(site.kind==='bear'?.85:.65)+motion,kind:'i-animal',species:site.kind});
      }
    }
    // Four coloured wind flags on the near slopes invite exploration in every direction.
    // Poles join the static scenery; moving pennants share the animal draw.
    const pennants=[];
    for(const [i,centre] of c.signposts.entries()){
      const heading=tangent(new V(0,1,0),centre);let dir=centre.clone();
      for(let j=0;j<30;j++){const d=offsetDir(centre,heading,Math.cos(j*2.4)*j*.10,Math.sin(j*2.4)*j*.10);if(slideDist(d)>2.8&&obstacles.every(o=>c.arc(d,o.dir)>o.r+.6)){dir=d;break;}}
      const f=frame(dir,heading,surfaceRadius(dir)+.05),B=sceneryB('flag-'+bucket(dir));B.setBase(f);B.block(0,1.45,0,.12,2.9,.12,'#b38a79',{plain:true});B.block(0,2.97,0,.22,.22,.22,'#efcf84');B.resetBase();obstacles.push({dir,r:.28,kind:'i-colour-flag'});
      const b=builder(T),col=['#e86c93','#68bcbb','#d4a7e5','#eeb058'][i];b.block(.42,2.7,0,.80,.45,.08,col,{plain:true,part:4,pivot:[0,2.7,0]});b.block(.77,2.60,0,.22,.25,.08,col,{plain:true,part:4,pivot:[0,2.7,0]});
      pennants.push({geometry:b.geometry(),frame:f});
    }
    const batch=animatedBatch(T,[...creatures,...pennants],'i-exploration-animals');root.add(batch.mesh);
    pennants.forEach((p,j)=>{batch.poses[creatures.length+j].copy(p.frame);batch.states[creatures.length+j].set(j*2,0,6,0);});
    const shadowGeo=new T.CircleGeometry(1,16);shadowGeo.rotateX(-Math.PI/2);
    const shadowMat=new T.MeshBasicMaterial({color:'#756b9d',transparent:true,opacity:.32,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:T.DoubleSide});
    const shadows=new T.InstancedMesh(shadowGeo,shadowMat,creatures.length+2);shadows.name='i-animal-contact-shadows';shadows.frustumCulled=false;root.add(shadows);
    const pickGeo=new T.SphereGeometry(.65,6,4),pickMat=new T.MeshBasicMaterial({visible:false});
    creatures.forEach(a=>{a.proxy=new T.Mesh(pickGeo,pickMat);a.proxy.userData.kind='i-animal';a.proxy.userData.animal=a;a.proxy.name='i-tap-'+a.kind+'-'+a.id;});
    let hooks=null,lastTime=0;
    function interact(a){if(!hooks||hooks.blocked()||a.cooldown>0)return false;a.reaction=1;a.cooldown=3;hooks.sound(a.kind);hooks.burst(a.position.clone().addScaledVector(a.dir,1),'#edf5ff',9,.5);hooks.reward(a.kind);return true;}
    function tap(a){if(!hooks||hooks.blocked())return false;if(hooks.arc(hooks.player.dir,a.dir)<3)interact(a);else hooks.routeTo(a.dir,1.8,()=>interact(a));return true;}
    function update(dt,time,night){
      lastTime=time;batch.setTime(time);
      creatures.forEach((a,i)=>{
        a.reaction=Math.max(0,a.reaction-dt*.7);a.cooldown=Math.max(0,a.cooldown-dt);
        const t=time+a.phase,walk=a.kind==='fox'?Math.max(0,Math.sin(t*.65)):1;
        const dx=a.kind==='fox'?Math.sin(t*1.2)*a.motion*walk:a.kind==='penguin'?Math.sin(t*.6)*a.motion:a.kind==='bear'&&a.variant>0?Math.sin(t*.9)*.10:0;
        const dz=a.sliding?Math.cos(t*.65)*.45:0,d=offsetDir(a.site.dir,a.site.heading,a.x+dx,a.z+dz);a.dir.copy(d);
        const y=a.site.id==='bay'?Math.max(surfaceRadius(d),c.lakeHeight()):surfaceRadius(d);
        const base=a.site.id==='bay'?frame(d,a.site.heading,y+.05):a.site.frame.clone().multiply(new T.Matrix4().makeTranslation(a.x+dx,.05,a.z+dz));tmp.position.set(0,0,0);tmp.quaternion.identity();tmp.scale.setScalar(a.scale);
        if(a.kind==='penguin'){tmp.rotation.z=Math.sin(t*(night?4:2))*(night?.16:.07);tmp.position.y=(night?.15:.03)*Math.abs(Math.sin(t*3))+Math.sin(a.reaction*Math.PI)*.25;if(a.sliding&&!night){tmp.rotation.order='YXZ';tmp.rotation.y=Math.sin(t*.65)<0?0:Math.PI;tmp.rotation.x=.6;tmp.position.y=.05;}}
        if(a.kind==='bear'&&a.variant>0&&!night){const roll=Math.max(0,Math.sin(t*.32)-.8)/.2;tmp.rotation.z=Math.sin(t*.8)*.15+roll*Math.PI*2+Math.sin(a.reaction*Math.PI)*1.5;tmp.position.y=.08*Math.abs(Math.sin(t));}
        if(a.kind==='fox'){tmp.rotation.y=dx<0?-Math.PI/2:Math.PI/2;tmp.position.y=.08*Math.abs(Math.sin(t*9))*walk;}
        if(a.kind==='seal')tmp.rotation.z=Math.sin(t)*.035;
        if(a.kind==='snowman')tmp.position.y=Math.sin(a.reaction*Math.PI)*.12;
        tmp.updateMatrix();
        let lowest=0;const bb=a.geometry.boundingBox;for(const x of [bb.min.x,bb.max.x])for(const y of [bb.min.y,bb.max.y])for(const z of [bb.min.z,bb.max.z])lowest=Math.min(lowest,corner.set(x,y,z).applyMatrix4(tmp.matrix).y);if(lowest<0){tmp.position.y-=lowest;tmp.updateMatrix();}
        batch.poses[i].multiplyMatrices(base,tmp.matrix);batch.states[i].set(a.phase,a.reaction,kindId[a.kind],night);
        a.position.setFromMatrixPosition(base);tmp.position.set(0,.015,0);tmp.rotation.set(0,0,0);tmp.scale.set(a.scale*(a.kind==='bear'?1.0:.74),1,a.scale*(a.kind==='bear'?1.5:.95));tmp.updateMatrix();matrix.multiplyMatrices(base,tmp.matrix);shadows.setMatrixAt(i,matrix);
        a.proxy.position.copy(a.position).addScaledVector(d,a.scale*.65);a.proxy.scale.setScalar(a.scale*1.2);a.proxy.updateMatrixWorld(true);
        if(hooks){const near=hooks.arc(hooks.player.dir,a.dir)<2.3;if(near&&!a.near&&!hooks.blocked())interact(a);a.near=near;}
      });
      const rig=root.parent.getObjectByName('i-deer-sleigh');if(rig)rig.updateMatrixWorld(true);
      for(let j=0;j<2;j++){tmp.position.set(0,.025,j?-.2:2.15);tmp.rotation.set(0,0,0);tmp.scale.set(j?.9:.65,1,j?1.35:.95);if(!rig?.visible)tmp.scale.setScalar(0);tmp.updateMatrix();matrix.copy(rig?.matrixWorld||new T.Matrix4()).multiply(tmp.matrix);shadows.setMatrixAt(creatures.length+j,matrix);}
      shadows.instanceMatrix.needsUpdate=true;
    }
    return {sites,creatures,mesh:batch.mesh,shadows,lamps,update,tap,interact,targets:()=>creatures.map(a=>a.proxy),bind:h=>{hooks=h;},snapshot:()=>({time:lastTime,animals:creatures.map(a=>({id:a.id,kind:a.kind,site:a.site.id,position:a.position.toArray(),dir:a.dir.toArray(),reaction:a.reaction,triangles:a.geometry.attributes.position.count/3})),sites:sites.map(s=>({id:s.id,name:s.name,dir:s.dir.toArray(),frame:s.frame.elements.slice(),approach:s.approach.toArray()}))})};
  }
  function sleigh(T){
    const root=new T.Group();root.name='i-deer-sleigh';const b=builder(T),B=(...a)=>b.block(...a),brown='#a86943',pale='#dbb786',cream='#f7e6c6';
    B(0,.86,2.1,.74,.80,1.12,brown);B(0,.76,2.53,.55,.54,.45,cream);
    const head={part:1,pivot:[0,1.12,2.55]};B(0,1.34,2.67,.62,.65,.60,brown,head);B(0,1.21,3.05,.48,.32,.4,'#c59264',head);B(0,1.28,3.28,.28,.22,.16,'#4c3435',head);
    for(const s of [-1,1]){
      B(s*.35,1.58,2.64,.40,.19,.22,brown,{...head,rz:s*.4});B(s*.35,1.62,2.68,.23,.08,.12,'#e8b3ae',{...head,plain:true});
      B(s*.28,1.45,2.97,.13,.19,.08,'#282333',{...head,plain:true});B(s*.29,1.50,3.02,.05,.06,.025,'#fff',{...head,plain:true});B(s*.32,1.26,2.98,.13,.11,.035,'#eb8d96',{...head,plain:true});
      B(s*.27,1.92,2.53,.10,.70,.12,pale,{...head,rz:-s*.18,plain:true});B(s*.43,2.12,2.53,.40,.10,.10,pale,{...head,rz:s*.5,plain:true});B(s*.63,2.31,2.53,.10,.36,.1,pale,{...head,plain:true});B(s*.26,2.33,2.53,.1,.36,.10,pale,{...head,rz:s*.2,plain:true});
    }
    B(0,1.08,2.56,.71,.13,.57,'#dc3c4f');B(0,.94,2.9,.19,.20,.17,'#f0c557');B(0,1.02,1.42,.26,.30,.31,cream,{rx:.4});
    for(const x of [-.25,.25])for(const z of [1.75,2.46]){const o={part:x*(z-2.1)<0?2:3,pivot:[x,.66,z]};B(x,.40,z,.18,.62,.20,brown,o);B(x,.10,z+.04,.21,.18,.27,'#4c3435',o);}
    const deer=animatedBatch(T,[{geometry:b.geometry()}],'i-tiaotiao');deer.poses[0].identity();root.add(deer.mesh);
    const S=YAYA_I_ART.makeBatch(T,YayaRound3.roundedBox(T,.12));
    S.block(0,.36,-.2,1.35,.18,2.12,'#b33449');S.block(0,.53,-.2,1.10,.17,1.85,'#fff0d9');
    for(const x of [-.67,.67]){S.block(x,.64,-.2,.15,.46,2.12,'#df4b58');S.block(x,.14,-.12,.12,.14,2.8,'#e8bd56');S.block(x,.32,1.22,.12,.46,.16,'#e8bd56',{rx:-.5});S.block(x,.52,.94,.15,.50,.2,'#e96569',{rx:-.4});}
    S.block(0,.67,-1.18,1.34,.6,.16,'#c94354');S.block(0,.67,-.66,1.06,.2,.82,'#fff0d9');   // raised back seat for the child
    for(const x of [-.38,.38]){const from=new T.Vector3(x,.66,.77),to=new T.Vector3(x,.99,2.62),d=to.clone().sub(from),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize()),m=new T.Matrix4().compose(from.add(to).multiplyScalar(.5),q,new T.Vector3(.035,d.length(),.035));S.matrix(m,'#886355',{plain:true});}
    const sled=S.mesh(new T.MeshStandardMaterial({vertexColors:true,roughness:.85}),'i-red-sleigh');root.add(sled);
    return {root,deer,sled,update(time,running,cheer=0){deer.setTime(time*(running?1:.35));deer.states[0].set(0,cheer,5,0);deer.poses[0].makeScale(.82,.82,.82).setPosition(0,running?Math.abs(Math.sin(time*9))*.055:0,.45);}};
  }
  window.YayaIAtmosphere={siteDefinitions,snowPad,create,sleigh,SNOW_GLSL};
})();
