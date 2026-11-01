/* Standalone visual prototype: no game progress, audio or mission data. */
(() => {
  'use strict';
  const T=window.THREE, R=8, fallback=document.getElementById('fallback');
  if(!T){fallback.hidden=false;return;}
  let renderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){fallback.hidden=false;return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.42;document.body.prepend(renderer.domElement);
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(39,innerWidth/innerHeight,.1,120),root=new T.Group();scene.add(root);
  scene.add(new T.HemisphereLight(0xdedcff,0x775a59,.8));const sun=new T.DirectionalLight(0xffe3bd,1.05);sun.position.set(-12,23,15);scene.add(sun);
  const fill=new T.DirectionalLight(0xc4d9ff,.3);fill.position.set(15,5,-10);scene.add(fill);
  const mats=new Map();const mat=(c,emissive=null)=>{const k=c+emissive;if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color:c,roughness:.88,emissive:emissive||'#000000',emissiveIntensity:emissive?.32:0}));return mats.get(k)};
  const cube=new T.BoxGeometry(1,1,1),soft=YayaRound3.roundedBox(T,.1),buckets=new Map(),tmp=new T.Matrix4();
  const qy=new T.Quaternion(),upY=new T.Vector3(0,1,0);function block(p,s,col,q=qy,geometry=soft){const k=(geometry===cube?'c':'s')+col;if(!buckets.has(k))buckets.set(k,{geometry,col,matrices:[]});buckets.get(k).matrices.push(new T.Matrix4().compose(p,q,new T.Vector3(...s)));}
  const rand=(x,y,z)=>{let n=Math.sin(x*71.3+y*127.7+z*53.1)*43758.5453;return n-Math.floor(n)};
  const cols=['#936447','#a97855','#b38762','#9b6d50','#a77c60','#9e8173'];
  // A shared fine wood grain gives every exposed block a material, not a flat fill.
  const woodCanvas=document.createElement('canvas');woodCanvas.width=woodCanvas.height=128;const woodCtx=woodCanvas.getContext('2d');woodCtx.fillStyle='#f4f1ec';woodCtx.fillRect(0,0,128,128);
  for(let i=0;i<24;i++){const y=i*5.6;woodCtx.strokeStyle=i%3?'rgba(89,68,58,.12)':'rgba(255,255,255,.32)';woodCtx.lineWidth=i%4===0?1.1:.65;woodCtx.beginPath();woodCtx.moveTo(0,y);woodCtx.bezierCurveTo(38,y-3,74,y+3,128,y+.8);woodCtx.stroke();}
  const woodTexture=new T.CanvasTexture(woodCanvas);woodTexture.encoding=T.sRGBEncoding;
  for(const col of ['#784932','#976044','#83543b','#9b6948','#8b583b','#a66d48','#754a34','#a5714d']){const material=mat(col);material.map=woodTexture;material.needsUpdate=true;}
  for(let x=-8;x<=8;x++)for(let y=-8;y<=8;y++)for(let z=-8;z<=8;z++){let d=Math.hypot(x,y,z);if(d>R||d<R-1.28)continue;let c=cols[Math.floor(rand(x,y,z)*cols.length)];block(new T.Vector3(x,y,z),[1,1,1],c,qy,cube);}
  function mesh(geo,material,parent=root){const m=new T.Mesh(geo,material);parent.add(m);return m;}
  function ring(rad,tube,y,color,ry=0,ell=1){const t=mesh(new T.TorusGeometry(rad,tube,7,48),mat(color));t.rotation.set(Math.PI/2,0,ry);t.position.y=y;t.scale.y=ell;return t;}
  // Interwoven branches follow the globe. Merge each colour into one mesh so
  // the denser silhouette does not turn into dozens of mobile draw calls.
  const branchBatches=new Map();function branch(geometry,col){if(!branchBatches.has(col))branchBatches.set(col,[]);branchBatches.get(col).push(geometry);}
  for(let i=0;i<14;i++){const points=[],baseY=-5.8+i*(11.6/13);for(let j=0;j<64;j++){const a=j*Math.PI*2/64,y=baseY+.26*Math.sin(a*3+i*.85),r=Math.sqrt(R*R-y*y)+.28;points.push(new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r));}branch(new T.TubeGeometry(new T.CatmullRomCurve3(points,true),64,.16+(i%3)*.035,6,true),i%2?'#784932':'#976044');}
  for(let k=0;k<14;k++){const pts=[],a=k*Math.PI/7;for(let j=0;j<=20;j++){const v=.32+j*(Math.PI-.64)/20,theta=a+.17*Math.sin(v*4+k),r=8.27+.07*Math.sin(v*7+k);pts.push(new T.Vector3(Math.sin(v)*Math.cos(theta)*r,Math.cos(v)*r,Math.sin(v)*Math.sin(theta)*r));}branch(new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.15+(k%3)*.025,6,false),k%2?'#83543b':'#9b6948');}
  for(const [col,geometries] of branchBatches){const positions=[],normals=[],uvs=[];for(const original of geometries){const g=original.index?original.toNonIndexed():original;positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);uvs.push(...g.attributes.uv.array);if(g!==original)g.dispose();original.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.computeBoundingSphere();mesh(g,mat(col));}
  const base=mesh(new T.CylinderGeometry(4.05,4.25,1.35,24),mat('#744b35'));base.position.y=7.55;
  const bowl=mesh(new T.CylinderGeometry(3.85,3.85,.24,24),mat('#eddbbb'));bowl.position.y=8.31;
  for(let i=0;i<6;i++)ring(4+(i%2)*.12,.27,7.72+i*.22,['#8b583b','#a66d48','#754a34'][i%3],i*.12,.94+i*.012);
  const twigGeometry=new T.CylinderGeometry(.16,.16,2.1,7),twigInst=new T.InstancedMesh(twigGeometry,mat('#a5714d'),32);
  for(let i=0;i<32;i++){const a=i*Math.PI*2/16+(i>15?.18:0),radius=4.22,dir=new T.Vector3(-Math.sin(a),.08*Math.sin(i),Math.cos(a)).normalize(),q=new T.Quaternion().setFromUnitVectors(upY,dir);twigInst.setMatrixAt(i,new T.Matrix4().compose(new T.Vector3(Math.cos(a)*radius,8.25+(i%4)*.17,Math.sin(a)*radius),q,new T.Vector3(1,1,1)));}twigInst.instanceMatrix.needsUpdate=true;root.add(twigInst);
  // Soft feather bed, built from one instanced batch rather than many draw calls.
  for(let i=0;i<28;i++){const a=i*2.39996,rad=.5+2.7*Math.sqrt((i+.4)/28);block(new T.Vector3(Math.cos(a)*rad,8.49,Math.sin(a)*rad),[.24,.11,.62],i%2?'#f7ead8':'#eadfce',new T.Quaternion().setFromEuler(new T.Euler(0,-a,0)));}
  function ground(x,z){return Math.sqrt(Math.max(.5,R*R-x*x-z*z))+.48;}
  function tangentFrame(x,z){const y=ground(x,z),p=new T.Vector3(x,y,z),u=p.clone().normalize();return {p,u,q:new T.Quaternion().setFromUnitVectors(upY,u)};}
  // Three paths terminate at well-separated egg positions.
  const eggXZ=[[-5,3.0],[5,2.5],[1,-6.0]];
  for(let k=0;k<eggXZ.length;k++){const [ex,ez]=eggXZ[k];for(let i=0;i<8;i++){const f=.42+i*.085,x=ex*f,z=ez*f,{p,q}=tangentFrame(x,z);block(p,[1.02,.20,1.02],(i+k)%2?'#e4ccaa':'#d6b991',q);}}
  const eggs=[],eggSpots=[],eggGeo=new T.LatheGeometry([[0,-1],[.4,-.96],[.68,-.65],[.75,-.2],[.68,.3],[.45,.72],[.2,.95],[0,1.02]].map(([x,y])=>new T.Vector2(x,y)),20),eggMat=mat('#ffdf9b','#d68b32');eggMat.emissiveIntensity=.52;
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const glowCtx=glowCanvas.getContext('2d'),glowGradient=glowCtx.createRadialGradient(32,32,2,32,32,32);glowGradient.addColorStop(0,'rgba(255,223,154,.65)');glowGradient.addColorStop(.35,'rgba(255,214,142,.18)');glowGradient.addColorStop(1,'rgba(255,214,142,0)');glowCtx.fillStyle=glowGradient;glowCtx.fillRect(0,0,64,64);const glowMat=new T.SpriteMaterial({map:new T.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,opacity:.55});
  for(const [x,z] of eggXZ){const {p,u,q}=tangentFrame(x,z),holder=new T.Group();holder.position.copy(p);holder.quaternion.copy(q);root.add(holder);
    const little=mesh(new T.TorusGeometry(1.05,.13,7,28),mat('#c08e66'),holder);little.rotation.x=Math.PI/2;little.position.y=.16;
    const egg=mesh(eggGeo,eggMat,holder);egg.scale.set(.96,.97,.96);egg.position.y=.94;eggs.push(egg);
    const glow=new T.Sprite(glowMat);glow.position.y=1;glow.scale.set(3.7,3.7,1);holder.add(glow);
    holder.updateMatrix();for(let i=0;i<4;i++){const a=i*Math.PI/2,spot=new T.Matrix4().makeTranslation(Math.sin(a)*.5,1.15+(.12*(i%2)),Math.cos(a)*.5);eggSpots.push(new T.Matrix4().multiplyMatrices(holder.matrix,spot));}
  }
  const spotsMesh=new T.InstancedMesh(new T.SphereGeometry(.055,7,5),mat('#fff8df','#ffe5a4'),eggSpots.length);eggSpots.forEach((m,i)=>spotsMesh.setMatrixAt(i,m));spotsMesh.instanceMatrix.needsUpdate=true;root.add(spotsMesh);
  // A gentle toy nightingale, with large eyes and a small moon scarf.
  const bird=new T.Group();bird.position.set(0,8.46,-.2);root.add(bird);
  const sphere=(r,color,parent)=>mesh(new T.SphereGeometry(r,14,10),mat(color),parent);
  const birdBody=sphere(1,'#956b4e',bird);birdBody.scale.set(.83,.7,.69);birdBody.position.y=.68;
  const head=sphere(.53,'#a47756',bird);head.position.set(0,1.38,.24);
  const chest=sphere(.7,'#e5d0ad',bird);chest.scale.set(.76,.75,.3);chest.position.set(0,.67,.48);
  for(const side of [-1,1]){const wing=sphere(.52,'#80583d',bird);wing.scale.set(.34,.67,.79);wing.position.set(side*.73,.72,0);wing.rotation.z=side*.35;
    const eye=sphere(.105,'#332e32',bird);eye.position.set(side*.22,1.48,.69);const glint=sphere(.034,'#ffffff',bird);glint.position.set(side*.24,1.52,.78);}
  const beak=mesh(new T.ConeGeometry(.16,.34,5),mat('#e7af62'),bird);beak.rotation.x=Math.PI/2;beak.position.set(0,1.25,.83);
  for(let i=-1;i<=1;i++){const feather=sphere(.38,'#80583d',bird);feather.scale.set(.32,.33,1.05);feather.position.set(i*.2,.75,-.62);feather.rotation.y=i*.27;feather.rotation.x=-.26;}
  const scarf=mesh(new T.TorusGeometry(.41,.07,6,16),mat('#a99bc4'),bird);scarf.rotation.x=Math.PI/2;scarf.position.set(0,1.05,.22);
  // Rounded shrubs, short trees and scattered feathers around the routes.
  const patches=[[-6,-2],[-5,-4],[-6,1],[-4,5],[0,6],[3,5],[6,0],[5,-3],[4,-5],[-2,-6],[-6,-5],[6,4]];
  patches.forEach(([x,z],i)=>{if(x*x+z*z>59)return;const f=tangentFrame(x,z),height=.7+(i%3)*.22;
    block(f.p.clone().addScaledVector(f.u,height*.5),[.22,height,.22],'#81553c',f.q);
    const crown=f.p.clone().addScaledVector(f.u,height+.35),leaf=i%2?'#69867e':'#7a8f7b',side=new T.Vector3(1,0,0).applyQuaternion(f.q);block(crown,[.76,.72,.76],leaf,f.q);block(crown.clone().addScaledVector(side,.35),[.55,.55,.55],leaf,f.q);block(crown.clone().addScaledVector(side,-.35),[.55,.55,.55],leaf,f.q);
    if(i%3===0)block(crown.clone().addScaledVector(f.u,.35),[.56,.52,.56],'#92aa98',f.q);
  });
  // Low clusters are distributed around the sphere, not only by the nest.
  for(let i=0;i<36;i++){const y=1-2*(i+.5)/36,a=i*2.399963,r=Math.sqrt(1-y*y),u=new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);if(y>.62)continue;const q=new T.Quaternion().setFromUnitVectors(upY,u),p=u.clone().multiplyScalar(R+.25);block(p.clone().addScaledVector(u,.14),[.45,.3,.45],i%3?'#768f80':'#8e91a5',q);if(i%3===0)block(p.clone().addScaledVector(u,.32),[.25,.2,.25],'#9baa9b',q);}
  // The small n-shaped bridge is a landmark rather than an instructional overlay.
  {const f=tangentFrame(2.7,5.25),arch=new T.Group();arch.position.copy(f.p);arch.quaternion.copy(f.q);root.add(arch);const top=mesh(new T.TorusGeometry(.72,.14,7,20,Math.PI),mat('#966449'),arch);top.position.y=1.02;for(const x of [-.72,.72]){const stem=mesh(new T.CylinderGeometry(.14,.14,1.04,7),mat('#966449'),arch);stem.position.set(x,.52,0);}}
  for(let i=0;i<28;i++){const a=i*2.39996,r=4.5+(i%3)*.8,x=Math.sin(a)*r,z=Math.cos(a)*r;if(x*x+z*z>60)continue;const f=tangentFrame(x,z);block(f.p.clone().addScaledVector(f.u,.10),[.13,.12,.28],i%3?'#f5e9d6':'#dfd7ce',f.q);}
  for(const {geometry,col,matrices} of buckets.values()){const material=mat(col);if(geometry===cube){material.map=woodTexture;material.needsUpdate=true;}const inst=new T.InstancedMesh(geometry,material,matrices.length);matrices.forEach((m,i)=>inst.setMatrixAt(i,m));inst.instanceMatrix.needsUpdate=true;inst.frustumCulled=false;root.add(inst);}
  // Existing project characters, placed on the foreground branch.
  function character(obj,x,z,scale){const f=tangentFrame(x,z);obj.position.copy(f.p).addScaledVector(f.u,.12);obj.quaternion.copy(f.q);obj.rotateY(Math.PI);obj.scale.setScalar(scale);root.add(obj);}
  character(YayaCharacters.explorer(T,'girl').scene,-1.5,5.2,1.08);character(YayaCharacters.unicorn(T).root,-2.9,4.5,1.1);
  const stars=[],starGeometry=new T.BufferGeometry();for(let i=0;i<120;i++){const a=i*2.39996,y=(i%17)/17*28-2,r=30;stars.push(Math.cos(a)*r,y,Math.sin(a)*r);}starGeometry.setAttribute('position',new T.Float32BufferAttribute(stars,3));scene.add(new T.Points(starGeometry,new T.PointsMaterial({color:'#fff0c4',size:.18,transparent:true,opacity:.8})));
  let view='near';function resize(){const aspect=innerWidth/innerHeight;camera.aspect=aspect;if(view==='near'){camera.fov=aspect<.8?50:44;camera.position.set(13,18,20);camera.lookAt(0,5,0);}else{camera.fov=aspect<.8?48:42;const dist=aspect<.8?45:37;camera.position.set(0.48*dist,.67*dist,.65*dist);camera.lookAt(0,1,0);}camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
  for(const mode of ['near','wide'])document.getElementById(mode).addEventListener('click',()=>{view=mode;for(const id of ['near','wide'])document.getElementById(id).setAttribute('aria-pressed',String(id===mode));resize();});
  addEventListener('resize',resize);resize();
  let active=false,lastX=0,lastY=0;renderer.domElement.addEventListener('pointerdown',e=>{active=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(!active)return;root.rotation.y+=(e.clientX-lastX)*.008;root.rotation.x=T.MathUtils.clamp(root.rotation.x+(e.clientY-lastY)*.005,-.55,.55);lastX=e.clientX;lastY=e.clientY;});for(const type of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(type,()=>active=false);
  let frame=0;const clock=new T.Clock();function draw(){const t=clock.getElapsedTime();bird.rotation.z=Math.sin(t*1.3)*.025;eggs.forEach((egg,i)=>{egg.position.y=.94+Math.sin(t*1.4+i)*.035;});renderer.render(scene,camera);window.__nArtPreview={ready:true,frames:++frame,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,eggs:eggs.length,view,rotation:[root.rotation.x,root.rotation.y]};requestAnimationFrame(draw);}draw();
})();
