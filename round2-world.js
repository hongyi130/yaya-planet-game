/* Shared, procedural weather and habitat. No external meshes or textures. */
(() => {
 function create(c){
  const {THREE:T,scene,skyGroup,clouds,planet,cells,PLANET,STAGE,obstacles,place,moveAlong,tangent,arc,surfaceRadius,orient,rng,LOW_POWER}=c;
  const theme=PLANET.theme||'forest',root=new T.Group();root.name='round2-habitat';scene.add(root);
  const materials=new Map(),mat=(color)=>{if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,flatShading:true,roughness:.88}));return materials.get(color)};
  const ico=new T.IcosahedronGeometry(1,0),box=new T.BoxGeometry(1,1,1),sphere=new T.IcosahedronGeometry(1,1);
  function piece(parent,color,xyz,size,geo=ico){const m=new T.Mesh(geo,mat(color));m.position.set(...xyz);m.scale.set(...size);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
  const sky=skyGroup.children.find(o=>o.isMesh&&o.material.isShaderMaterial);
  const weather={value:0},wet={value:theme==='island'?1:0};let completed=false;const tumblers=[],heatTime={value:0};let rain=null,rainPos=null,ocean=null,rainbow=null;
  if(sky){sky.material.uniforms.sunset=weather;sky.material.uniforms.wet=wet;sky.material.uniforms.biome={value:theme==='desert'?1:theme==='island'?2:0};sky.material.fragmentShader=`uniform vec3 sunDir;uniform float biome;uniform float sunset;uniform float wet;varying vec3 vDir;
   void main(){vec3 d=normalize(vDir);float h=smoothstep(-.1,.8,d.y);vec3 c=mix(vec3(1.,.79,.67),vec3(.77,.68,.82),h);if(biome>0.5&&biome<1.5)c=mix(vec3(1.,.80,.56),vec3(.67,.77,.84),h);if(biome>1.5)c=mix(vec3(.79,.90,.91),vec3(.55,.76,.85),h);float glow=pow(max(0.,dot(d,normalize(vec3(-.5,.3,-1.)))),10.);c=mix(c,vec3(1.,.92,.72),glow*.64);c=mix(c,vec3(.24,.27,.48)+vec3(.42,.18,.12)*(1.-h),sunset*.85);c=mix(c,vec3(.55,.66,.73),wet*.5);gl_FragColor=vec4(c,1.);}`;sky.material.needsUpdate=true}
  scene.fog=new T.Fog(theme==='island'?'#d7dbe5':'#edc9cf',38,180);
  const grass=new T.Color();cells.forEach(([x,y,z],i)=>{const n=(Math.sin(x*31+y*17+z*11)+1)*.5;grass.setHSL(theme==='desert'?.095:theme==='island'?.43:.23,theme==='desert'?.57:.5,theme==='desert'?.58+n*.1:.32+n*.10);if(theme==='island'){const d=new T.Vector3(x,y,z).normalize();if(arc(d,STAGE.center)>3.2)grass.set('#e4cb9c')}planet.setColorAt(i,grass)});planet.instanceColor.needsUpdate=true;
  // Warm cream cumulus; shared geometry has differently coloured top/bottom facets.
  const cg=new T.IcosahedronGeometry(1,1).toNonIndexed(),cs=[],pos=cg.attributes.position;
  for(let i=0;i<pos.count;i++){const col=new T.Color('#d8b69f').lerp(new T.Color('#fff5df'),(pos.getY(i)+1)*.5);cs.push(col.r,col.g,col.b)}cg.setAttribute('color',new T.Float32BufferAttribute(cs,3));
  const cm=new T.MeshBasicMaterial({vertexColors:true});clouds.clear();clouds.rotation.set(0,0,0);
  for(let i=0;i<14;i++){const g=new T.Group(),a=i/14*Math.PI*2;g.position.set(Math.cos(a)*(18+i%3),13+(i%4)*1.8,Math.sin(a)*(18+i%3));for(let j=0;j<4;j++){const m=new T.Mesh(cg,cm);m.scale.set(1.8+j%2*.4,.65+(j%3)*.15,1.3);m.position.set((j-1.5)*1.45,Math.sin(j*2)*.22,0);g.add(m)}g.scale.setScalar(.65+(i%3)*.17);clouds.add(g)}
  // Distant miniature islands give depth beyond the horizon, fixed in world space.
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2,g=new T.Group(),rr=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(4000+i);g.position.set(Math.cos(a)*31,2+(i%3)*2,Math.sin(a)*31);
   if(!(window.YayaPlanetA&&YayaPlanetA.blob&&window.YayaRound3&&YayaRound3.roundedBox)){piece(g,theme==='desert'?'#c88060':'#bdadad',[0,0,0],[3,1.2,2]);piece(g,theme==='desert'?'#dfae77':'#a1bc99',[0,.7,0],[3.1,.55,2.1]);root.add(g);continue}
   const desert=theme==='desert',lp=LOW_POWER,bs=lp?1.0:.7;
   // Round 4: rounded-cube islands (merged blobs) instead of sharp icosahedra
   g.add(YayaPlanetA.blob(T,[[0,-.35,0,3,1.05,2],[.3,-1.15,.1,1.7,.8,1.1]],bs,bs*1.12,desert?['#c88060','#b87050','#d19070']:['#c98a5a','#b97a4c','#d89a68'],rr));
   g.add(YayaPlanetA.blob(T,[[0,.5,0,3.15,.55,2.15]],bs,bs*1.12,desert?['#dfae77','#e8bd86']:['#78bd4c','#68ad44','#86c955'],rr));
   for(const [x,z,s] of [[-1.3,.1,.8],[.6,-.3,1.0],[1.7,.4,.62]]){const t=YayaPlanetA.roundTree(T,rr);t.scale.setScalar(s*1.05);t.position.set(x,.95,z);t.traverse(o=>{o.castShadow=false});g.add(t)}
   YayaPlanetA.flatten(T,g);g.children[g.children.length-1].castShadow=false;root.add(g)}
  const bubbles=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2,m=piece(root,['#f3c09f','#efcf7b','#dbb7d7','#a5d7ca'][i%4],[Math.cos(a)*13,14+i%3,Math.sin(a)*13],[.22,.27,.22]);bubbles.push({m,y:m.position.y,phase:i})}
  const local=(x,z)=>STAGE.group.localToWorld(new T.Vector3(x,STAGE.top,z)).normalize();
  // Pond is a solid collision disk, even though its visual surface is translucent.
  if(theme==='forest'){for(const [x,z] of [[-3.5,1.9],[3.8,1.2]]){const d=local(x,z),tree=YayaPlanetA.roundTree(T,rng);tree.scale.setScalar(1.35);place(tree,d,STAGE.front);c.registerProp(tree,d,.5)}for(let i=0;i<(LOW_POWER?9:13);i++){const x=-5+i*.82,z=-4.8-Math.sin(i)*.5,d=local(x,z);if(obstacles.some(o=>arc(d,o.dir)<o.r+.3))continue;const tree=i%3?YayaPlanetA.roundTree(T,rng):YayaPlanetA.pineTree(T,rng);tree.scale.setScalar(1.25+rng()*.35);place(tree,d,STAGE.front);c.registerProp(tree,d,.45);}}
  const pond=new T.Group(),pd=local(-3.3,1.0);place(pond,pd,STAGE.front,.02);root.add(pond);for(const p of c.props)if(arc(p.dir,pd)<1.9)p.obj.visible=false;obstacles.push({dir:pd,r:1.58,kind:'pond'});
  const sand=new T.Mesh(new T.CylinderGeometry(1.58,1.4,.18,14),mat('#e7c78f'));sand.position.y=.02;pond.add(sand);
  const waterMat=new T.MeshStandardMaterial({color:'#64c9de',transparent:true,opacity:.80,roughness:.25,metalness:.1,flatShading:true});
  const water=new T.Mesh(new T.CircleGeometry(1.38,28),waterMat);water.rotation.x=-Math.PI/2;water.position.y=.12;pond.add(water);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;piece(pond,i%2?'#c9ba9c':'#f3dcaa',[Math.cos(a)*1.45,.13,Math.sin(a)*1.45],[.18,.16,.23])}
  const ripples=[];for(let i=0;i<4;i++){const ring=new T.Mesh(new T.RingGeometry(.15,.17,20),new T.MeshBasicMaterial({color:'#efffff',transparent:true,opacity:.35,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set((i%2-.5)*1.3,.135,(Math.floor(i/2)-.5)*1.2);pond.add(ring);ripples.push(ring)}
  for(let i=0;i<3;i++){const leaf=new T.Mesh(new T.CircleGeometry(.20,10,0,Math.PI*1.85),mat('#72ad79'));leaf.rotation.x=-Math.PI/2;leaf.position.set(.75-i*.5,.14,-.5+i*.17);pond.add(leaf);piece(pond,'#f4a8bc',[leaf.position.x,.18,leaf.position.z],[.07,.06,.07])}
  function duck(){const g=new T.Group();piece(g,'#fff1d1',[0,.13,0],[.16,.13,.25]);piece(g,'#fff7e5',[0,.29,.14],[.11,.13,.11]);piece(g,'#e6a740',[0,.27,.26],[.08,.035,.10],box);for(const x of [-.095,.095])piece(g,'#493f40',[x,.31,.17],[.015,.02,.018],box);return g}
  const ducks=[duck(),duck()];ducks.forEach(d=>pond.add(d));
  const fish=piece(pond,'#efac71',[0,.03,0],[.10,.06,.22]);

  if(theme==='desert'){
   const airMat=new T.ShaderMaterial({uniforms:{time:heatTime},transparent:true,depthWrite:false,side:T.DoubleSide,vertexShader:'uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.x+=sin(time*1.4+p.y*9.)*.025;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',fragmentShader:'uniform float time;varying vec2 vUv;void main(){float edge=sin(vUv.x*3.14159)*sin(vUv.y*3.14159);float a=(.5+.5*sin(vUv.y*35.-time*2.))*.08*edge;gl_FragColor=vec4(1.,.86,.62,a);}'});
   for(let i=0;i<3;i++){const air=new T.Mesh(new T.PlaneGeometry(1.8,.9,8,8),airMat);place(air,local(-3+i*3,-3.5),STAGE.front,.65);root.add(air)}
   for(let i=0;i<3;i++){const palm=YAYA_PLANET_S.palm(T,rng),d=local(-4.5+i*.9,-.7);place(palm,d,STAGE.front);c.registerProp(palm,d,.3)}
   for(let i=0;i<3;i++){const g=new T.Group(),wire=new T.Mesh(new T.IcosahedronGeometry(.34,1),new T.MeshBasicMaterial({color:'#b88e61',wireframe:true}));g.add(wire);const home=local(-4+i*3.7,3);place(g,home,STAGE.front);root.add(g);tumblers.push({g,home,wire})}
  }

  if(theme==='island'){
   ocean=new T.Mesh(new T.SphereGeometry(9.35,48,32),new T.MeshStandardMaterial({color:'#69b9c4',roughness:.3,metalness:.05,transparent:true,opacity:.88}));root.add(ocean);
   const n=LOW_POWER?110:180;rainPos=new Float32Array(n*6);for(let i=0;i<n;i++){const k=i*6,x=(rng()-.5)*22,y=8+rng()*12,z=(rng()-.5)*22;rainPos.set([x,y,z,x-.035,y+.28,z],k)}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(rainPos,3));rain=new T.LineSegments(geo,new T.LineBasicMaterial({color:'#d4e8f0',transparent:true,opacity:.4}));root.add(rain);
   rainbow=new T.Group();const colors=['#eaa5a4','#efbc8c','#f4dd9b','#abd0a5','#9ccbd4','#b2b5d9'];colors.forEach((color,i)=>{const ring=new T.Mesh(new T.TorusGeometry(5-i*.17,.11,4,48,Math.PI),new T.MeshBasicMaterial({color,transparent:true,opacity:.78}));rainbow.add(ring)});rainbow.position.set(0,12,-6);rainbow.visible=false;root.add(rainbow);
   clouds.children.forEach(g=>g.scale.multiplyScalar(1.25));
  }

  const night=new T.Group();root.add(night);night.visible=false;for(let i=0;i<40;i++){const d=new T.Vector3(rng()-.5,.2+rng()*.8,rng()-.5).normalize().multiplyScalar(50);const star=new T.Mesh(new T.OctahedronGeometry(.06+rng()*.05),new T.MeshBasicMaterial({color:'#ffedc7'}));star.position.copy(d);night.add(star)}

  const walkers=[];
  function critter(kind){const g=new T.Group(),color=kind==='fox'?'#d8793c':'#b78357';piece(g,color,[0,.25,0],[.18,.20,.34]);const head=piece(g,color,[0,.4,.3],[.19,.18,.18]);piece(head,'#fff0d4',[0,-.3,.75],[.65,.5,.7]);for(const x of [-.12,.12]){piece(g,color,[x,.60,.3],[.07,.15,.06]);piece(g,'#382d32',[x,.43,.45],[.022,.028,.02],box)}const tail=piece(g,color,[0,.35,-.42],[.12,.16,.35]);tail.rotation.x=kind==='fox'?.3:-1;piece(tail,'#fff0d4',[0,0,-.65],[.9,.85,.35]);for(const x of [-.12,.12])for(const z of [-.18,.18])piece(g,'#674b3a',[x,.06,z],[.06,.13,.07],box);return g}
  if(theme==='forest')for(let i=0;i<2;i++){const kind=i?'squirrel':'fox',m=critter(kind);let home=local(i?3.4:-2.9,i?1.8:1);for(let k=0;k<300;k++){const d=local((i?1:-1)*(2+rng()*4),-3+rng()*7);if(safe(d,.8)){home=d;break}}place(m,home,STAGE.front);root.add(m);walkers.push({m,kind,dir:home.clone(),home,heading:STAGE.front.clone(),target:null,pause:i+.5})}
  const birds=[];for(let i=0;i<3;i++){const g=new T.Group();piece(g,'#697a84',[0,0,0],[.09,.08,.25]);const wings=[];for(const s of [-1,1])wings.push(piece(g,'#e7d9c3',[s*.18,0,0],[.25,.025,.14],box));root.add(g);birds.push({g,wings,phase:i*.22})}
  const butterflies=[];for(let i=0;i<(LOW_POWER?3:6);i++){const g=new T.Group(),wing=[];for(const s of [-1,1])wing.push(piece(g,i%2?'#f2c86d':'#edb1ce',[s*.055,0,0],[.07,.015,.09]));root.add(g);butterflies.push({g,wing,base:local(-2+i*.8,2.8),phase:i})}
  if(theme==='island')for(let i=0;i<5;i++){const m=new T.Mesh(new T.RingGeometry(.16,.18,16),new T.MeshBasicMaterial({color:'#a9d9df',transparent:true,opacity:.3}));m.rotation.x=-Math.PI/2;m.position.set((i%3-1)*.7,STAGE.top+.018,-.5+(i%2)*.7);STAGE.group.add(m);ripples.push(m)}
  const temp=new T.Vector3(),move=new T.Vector3();
  function safe(d,r=.25){if(arc(d,STAGE.center)<2.5)return false;return !obstacles.some(o=>arc(d,o.dir)<o.r+r)}
  function wander(w,dt,time){w.pause-=dt;if(!w.target&&w.pause<=0){for(let j=0;j<16;j++){temp.set(rng()-.5,rng()-.5,rng()-.5);const target=moveAlong(w.dir,tangent(temp,w.dir),.7+rng()*.9).normalize();if(safe(target)&&arc(target,w.home)<3){w.target=target;break}}w.pause=.5}
   if(w.target){move.copy(w.target).sub(w.dir);const h=tangent(move,w.dir),next=moveAlong(w.dir,h,dt*.6).normalize();if(safe(next)&&Math.abs(surfaceRadius(next)-surfaceRadius(w.dir))<.45){w.dir.copy(next);w.heading.copy(h);if(arc(w.dir,w.target)<.1){w.target=null;w.pause=1+rng()*2}}else{w.target=null;w.pause=.3}}
   place(w.m,w.dir,w.heading,w.target?Math.abs(Math.sin(time*8))*.035:0)}
  function update(dt,time){heatTime.value=time;if(rain){rain.visible=wet.value>.02;if(rain.visible){for(let i=0;i<rainPos.length;i+=6){rainPos[i+1]-=dt*4.8;if(rainPos[i+1]<6)rainPos[i+1]=20;rainPos[i+4]=rainPos[i+1]+.28}rain.geometry.attributes.position.needsUpdate=true;}if(completed){wet.value=Math.max(0,wet.value-dt*.25);rainbow.visible=true;ocean.material.color.lerp(new T.Color('#52c6cd'),dt*.4);}}if(completed&&theme==='desert'){weather.value=Math.min(1,weather.value+dt*.12);night.visible=weather.value>.3;}tumblers.forEach((v,i)=>{const d=moveAlong(v.home,tangent(STAGE.front,v.home),Math.sin(time*.2+i)*.8).normalize();place(v.g,d,STAGE.front,.07);v.wire.rotation.x=time*(.3+i*.08);v.wire.rotation.z=Math.sin(time*.3+i)*.12});for(const b of bubbles)b.m.position.y=b.y+Math.sin(time*.5+b.phase)*.35;waterMat.opacity=.77+Math.sin(time*1.4)*.04;ripples.forEach((r,i)=>{const k=(time*.35+i*.27)%1;r.scale.setScalar(.4+k*3);r.material.opacity=(1-k)*.33});ducks.forEach((d,i)=>{const a=time*.24+i*Math.PI;d.position.set(Math.cos(a)*.72,.13,Math.sin(a)*.55);d.rotation.y=-a+Math.PI/2});const jump=Math.max(0,Math.sin(time*.7));fish.position.set(.2, .04+(jump>.94?Math.sin((jump-.94)/.06*Math.PI)*.4:0),.15);fish.visible=jump>.94;
   walkers.forEach(w=>wander(w,dt,time));birds.forEach(({g,wings,phase},i)=>{const a=time*.045+phase;g.position.set(Math.cos(a)*16,14+i*.3,Math.sin(a)*16);g.rotation.y=-a;wings.forEach((w,j)=>w.rotation.z=Math.sin(time*6)*.6*(j?1:-1))});butterflies.forEach(({g,wing,base,phase})=>{temp.copy(base).multiplyScalar(surfaceRadius(base)+.5+Math.sin(time*1.3+phase)*.12);g.position.copy(temp);g.position.x+=Math.sin(time*.8+phase)*.25;wing.forEach((w,j)=>w.rotation.z=Math.sin(time*13)*.8*(j?1:-1))});
  }
  return {root,theme,pond,pd,walkers,ducks,weather,wet,update,complete:()=>{completed=true},snapshot:()=>({theme,pond:pd.toArray(),walkers:walkers.map(w=>({kind:w.kind,position:w.m.position.toArray()})),ducks:ducks.map(d=>d.position.toArray())})};
 }
 window.YayaWorld={create};
})();
