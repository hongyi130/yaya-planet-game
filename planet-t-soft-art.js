/* T island-wide soft art: spherical turf, painted grass grain and shared tree/rock models.
   The occupied grid and the CPU-only original ground remain authoritative for gameplay. */
(() => {
 'use strict';
 const libraries=new WeakMap();
 const enabled=()=>new URLSearchParams(location.search).get('tart')!=='original';
 function createModels(T,lowPower=false){
  let tiers=libraries.get(T);if(!tiers){tiers={};libraries.set(T,tiers);}if(tiers[lowPower])return tiers[lowPower];
  const V=T.Vector3,up=new V(0,1,0);
  const crown=new T.SphereGeometry(1,14,10),cp=crown.attributes.position;
  for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i),a=Math.atan2(z,x),belt=1-y*y;
   const bulge=1+.11*Math.sin(a*3+.5)*belt+.055*Math.cos(a*5-y*2)*belt,cloud=1+.095*Math.sin(x*7+y*3)*Math.sin(y*6-z*3)+.055*Math.cos(z*7-x*3);
   cp.setXYZ(i,x*bulge*cloud*(1+.07*y),Math.max(-.74,y)*.94*cloud+.055*Math.sin(a*3)*belt,z*bulge*cloud*(.95+.06*x));
  }crown.computeVertexNormals();
  const bud=new T.SphereGeometry(1,9,6),trunk=new T.CylinderGeometry(.14,.27,1,7);
  const rockGeos=[0,1,2].map(seed=>{const g=new T.IcosahedronGeometry(1,1),p=g.attributes.position;for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.14*Math.sin(x*4+z*3+seed)+.08*Math.cos(y*5-x*2+seed);
   p.setXYZ(i,x*k,Math.max(-.63,Math.min(.8,y*k-.17*x+.07*z)),z*k*(1+.1*x));
  }g.computeVertexNormals();return g;});
  function builder(){const ps=[],ns=[],cs=[],v=new V(),n=new V(),nm=new T.Matrix3(),col=new T.Color();return {
   add(g,m,tint,kind='plain'){const src=g.index?g.toNonIndexed():g,p=src.attributes.position,nor=src.attributes.normal;nm.getNormalMatrix(m);col.set(tint);
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);n.fromBufferAttribute(nor,i);const sh=kind==='foliage'?(.70+.30*T.MathUtils.smoothstep(v.y,-.75,.8))*(.98+.025*Math.sin(v.x*7+v.z*6)):.82+.18*(n.y*.5+.5);
     v.applyMatrix4(m);n.applyMatrix3(nm).normalize();ps.push(v.x,v.y,v.z);ns.push(n.x,n.y,n.z);cs.push(col.r*sh,col.g*sh,col.b*sh);
    }if(src!==g)src.dispose();
   },
   piece(g,x,y,z,sx,sy,sz,col,angle=0,kind='plain'){this.add(g,new T.Matrix4().compose(new V(x,y,z),new T.Quaternion().setFromAxisAngle(up,angle),new V(sx,sy,sz)),col,kind);},
   limb(a,b,r,col){const from=new V(...a),to=new V(...b),diff=to.clone().sub(from);this.add(trunk,new T.Matrix4().compose(from.add(to).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(up,diff.clone().normalize()),new V(r,diff.length(),r)),col);},
   mesh(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('normal',new T.Float32BufferAttribute(ns,3));g.setAttribute('color',new T.Float32BufferAttribute(cs,3));g.computeBoundingSphere();const m=new T.Mesh(g,new T.MeshLambertMaterial({vertexColors:true}));m.castShadow=!lowPower;m.receiveShadow=true;return m;}
  };}
  const api={
   tree(h,seed=0){const b=builder(),turn=seed*.137;
    b.limb([0,-.08,0],[.12,h*.46,0],1,'#725039');b.limb([.07,h*.27,0],[-.43,h*.61,.08],.63,'#806045');b.limb([.1,h*.36,0],[.5,h*.64,-.09],.52,'#755438');
    b.piece(crown,-.04*h/4,h*.76,0,h*.40,h*.36,h*.35,'#6e9d4f',turn,'foliage');
    [[-.27,.67,.09,.23,.24],[.26,.71,.02,.24,.22],[.06,.66,.24,.22,.19]].forEach(([x,y,z,s,sy],i)=>b.piece(bud,x*h,y*h,z*h,s*h,sy*h,s*h,['#739e50','#80a65a','#6e984e'][i],turn+i,'foliage'));
    const root=new T.Group();root.add(b.mesh());root.userData.softArtKind='tree';return root;
   },
   rock(size=1,seed=0){const b=builder();[[0,0,.55,.67],[-.5,.18,.32,.37],[.4,.22,.3,.44]].forEach(([x,z,s,h],i)=>b.piece(rockGeos[(i+seed)%3],x*size,h*.63*size,z*size,s*size,h*size,s*.82*size,['#8c9389','#adb0a0','#788778'][i],i*.7+seed));const m=b.mesh();m.userData.softArtKind='rock';return m;},
   bush(s=1,seed=0,pink=false){const b=builder(),pal=pink?['#c6809b','#e4a0b5']:['#6e9d4f','#80a65a'];b.piece(crown,0,.57*s,0,.85*s,.66*s,.8*s,pal[0],seed,'foliage');b.piece(bud,.43*s,.45*s,.18*s,.58*s,.44*s,.54*s,pal[1],seed+1,'foliage');return b.mesh();},
   rockGeometry:i=>rockGeos[i%3],
   miniIsland(){const g=new T.Group(),box=window.YayaRound3.roundedBox(T,.09),soil=new T.Mesh(box,new T.MeshLambertMaterial({color:'#95734f'}));soil.scale.set(6,1.8,4);soil.position.y=-.5;g.add(soil);
    const turf=new T.Mesh(box,new T.MeshLambertMaterial({color:new T.Color().setRGB(.44,.65,.18)}));turf.name='t-soft-mini-turf';turf.scale.set(6.2,.5,4.2);turf.position.y=.55;g.add(turf);
    for(const [x,z,s] of [[-1.3,.1,.8],[.6,-.3,1],[1.7,.4,.62]]){const t=api.tree(2.8*s,Math.round(s*100));t.position.set(x,.8,z);t.traverse(o=>{o.castShadow=false;});g.add(t);}const rock=api.rock(.7,1);rock.position.set(-1.5,.8,-.8);rock.castShadow=false;g.add(rock);return g;
   }
  };tiers[lowPower]=api;return api;
 }
 window.YayaTSoftArt={enabled,createModels,install(c,w,helpers){
  if(!enabled())return;
  const {THREE:T,planet,cells,surfaceRadius,arc,obstacles,STAGE,START_DIR}=c;
  const {P,XA,landDist,RACE,lessonClear,pathIdx,sandWeights}=helpers,V=T.Vector3;
  const models=createModels(T,c.LOW_POWER),zone=d=>landDist(d)>0;
  const root=new T.Group();root.name='t-soft-island';w.root.add(root);
  const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  // The pond basin has already been lowered by three metres. Keep those translated
  // blocks in the existing mesh so exposed-face removal cannot cut holes in its banks.
  const sourceMatrix=new T.Matrix4();
  const landCells=cells.map((xyz,i)=>({xyz,i,d:new V(...xyz).normalize()})).filter(q=>{
   if(!zone(q.d))return false;planet.getMatrixAt(q.i,sourceMatrix);const e=sourceMatrix.elements;
   return Math.abs(e[12]-q.xyz[0])+Math.abs(e[13]-q.xyz[1])+Math.abs(e[14]-q.xyz[2])<.001;
  });
  const occupied=new Set(landCells.map(q=>q.xyz.join(','))),selected=[];
  const has=(xyz,n)=>occupied.has(xyz.map((v,k)=>v+n[k]).join(','));
  const upOf=xyz=>{let axis=0;for(let j=1;j<3;j++)if(Math.abs(xyz[j])>Math.abs(xyz[axis]))axis=j;const sign=Math.sign(xyz[axis])||1;return {axis,sign,face:axis*2+(sign<0?1:0)};};
  const pickGround=new T.InstancedMesh(planet.geometry,planet.material,planet.count);pickGround.instanceMatrix.copy(planet.instanceMatrix);
  planet.raycast=function(raycaster,hits){pickGround.matrixWorld.copy(this.matrixWorld);const start=hits.length;pickGround.raycast(raycaster,hits);for(let i=start;i<hits.length;i++)hits[i].object=this;};
  const empty=()=>({position:[],normal:[],color:[],sampleCell:[],sampleLocal:[],sampleUp:[],sampleSand:[],shellMask:[]});
  const terrains=Array.from({length:6},empty),shadowMarks=[];
  const rb=YayaRound3.roundedBox(T,.09),source=rb.index?rb.toNonIndexed():rb;
  const sp=source.attributes.position,sn=source.attributes.normal,m=new T.Matrix4(),col=new T.Color();let discarded=0;
  for(const {xyz,i,d} of landCells){
   if(dirs.every(n=>has(xyz,n)))continue;selected.push({xyz,i,d});
   const u=upOf(xyz),up=[0,0,0];up[u.axis]=u.sign;const terrain=terrains[u.face];
   planet.getMatrixAt(i,m);const origin=new V().setFromMatrixPosition(m);planet.getColorAt(i,col);
   const open=!has(xyz,up),lateral=dirs.filter(n=>!n[u.axis]);
   const joins=lateral.filter(n=>{const next=xyz.map((v,j)=>v+n[j]);return open&&has(xyz,n)&&upOf(next).face===u.face&&!has(next,up);});
   for(let k=0;k<sp.count;k+=3){
    const p=[0,1,2].map(j=>new V().fromBufferAttribute(sp,k+j)),face=new V().crossVectors(p[1].clone().sub(p[0]),p[2].clone().sub(p[0]));
    const outward=[];for(let ax=0;ax<3;ax++)if(Math.abs(face.getComponent(ax))>1e-6){const n=[0,0,0];n[ax]=Math.sign(face.getComponent(ax));outward.push(n);}
    const covered=[];for(let mask=1;mask<(1<<outward.length);mask++){const n=[0,0,0];outward.forEach((v,j)=>{if(mask&(1<<j))for(let ax=0;ax<3;ax++)n[ax]+=v[ax];});covered.push(n);}
    if(covered.length&&covered.every(n=>has(xyz,n))){discarded++;continue;}
    const ns=[0,1,2].map(j=>new V().fromBufferAttribute(sn,k+j));
    for(let j=0;j<3;j++){const v=p[j],height=v.getComponent(u.axis)*u.sign;
     if(height>.3){const join=joins.filter(n=>n.some((s,ax)=>s&&v.getComponent(ax)*s>.3));if(join.length){v.setComponent(u.axis,.5*u.sign);for(const n of join)for(let ax=0;ax<3;ax++)if(n[ax])v.setComponent(ax,.5*n[ax]);ns[j].set(...up);}}
     if(height<-.3&&has(xyz,up.map(v=>-v)))v.setComponent(u.axis,-.57*u.sign);
    }
    if(new V().crossVectors(p[1].clone().sub(p[0]),p[2].clone().sub(p[0])).lengthSq()<1e-12){discarded++;continue;}
    for(let j=0;j<3;j++){const v=p[j];terrain.position.push(v.x+origin.x,v.y+origin.y,v.z+origin.z);terrain.normal.push(...ns[j].toArray());terrain.color.push(col.r,col.g,col.b);terrain.sampleCell.push(...origin.toArray());terrain.sampleLocal.push(...v.toArray());terrain.sampleUp.push(...up);terrain.sampleSand.push(sandWeights?.[i]|| (pathIdx.has(i)?.5:0));terrain.shellMask.push(0);}
   }
  }
  if(source!==rb)source.dispose();rb.dispose();
  // All land instances, including buried cells, are represented by the exposed-face meshes.
  const landIds=new Set(landCells.map(s=>s.i)),shellAttribute=planet.geometry.getAttribute('shellMask');let keep=0;
  for(let i=0;i<planet.count;i++){if(landIds.has(i))continue;planet.getMatrixAt(i,m);planet.setMatrixAt(keep,m);planet.getColorAt(i,col);planet.setColorAt(keep,col);if(shellAttribute)shellAttribute.setX(keep,shellAttribute.getX(i));keep++;}
  planet.count=keep;planet.instanceMatrix.needsUpdate=true;planet.instanceColor.needsUpdate=true;if(shellAttribute)shellAttribute.needsUpdate=true;
  const shadeCanvas=document.createElement('canvas');shadeCanvas.width=c.LOW_POWER?512:1024;shadeCanvas.height=shadeCanvas.width/2;
  const contactTexture=new T.CanvasTexture(shadeCanvas);contactTexture.wrapS=T.RepeatWrapping;contactTexture.anisotropy=2;
  // A deterministic, seamless paint tile gives the turf short blades and fibrous grain.
  // It is made once; mipmaps soften the fine strokes as the camera moves away.
  const grassCanvas=document.createElement('canvas');grassCanvas.width=grassCanvas.height=512;
  const grassCtx=grassCanvas.getContext('2d');let grassSeed=31729;
  const grassRandom=()=>{grassSeed=(Math.imul(grassSeed,1664525)+1013904223)|0;return (grassSeed>>>0)/4294967296;};
  const wrapPaint=(x,y,paint)=>{for(const dx of [-512,0,512])for(const dy of [-512,0,512]){if(x+dx < -40||x+dx > 552||y+dy < -40||y+dy > 552)continue;grassCtx.save();grassCtx.translate(x+dx,y+dy);paint();grassCtx.restore();}};
  grassCtx.fillStyle='#808080';grassCtx.fillRect(0,0,512,512);
  for(let i=0;i<280;i++){
   const x=grassRandom()*512,y=grassRandom()*512,r=7+grassRandom()*29,v=grassRandom()<.5?60:205;
   wrapPaint(x,y,()=>{const g=grassCtx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(${v},${v},${v},.23)`);g.addColorStop(1,`rgba(${v},${v},${v},0)`);grassCtx.fillStyle=g;grassCtx.fillRect(-r,-r,r*2,r*2);});
  }
  grassCtx.lineCap='round';
  for(let i=0;i<1250;i++){
   const x=grassRandom()*512,y=grassRandom()*512,angle=grassRandom()*Math.PI*2,len=5+grassRandom()*9,width=1.3+grassRandom()*1.5,lean=(grassRandom()-.5)*4;
   wrapPaint(x,y,()=>{grassCtx.rotate(angle);for(let blade=-1;blade<=1;blade++){
    const h=len*(blade===0?1:.65),end=blade*3+lean;
    grassCtx.strokeStyle='rgba(47,47,47,.42)';grassCtx.lineWidth=width;grassCtx.beginPath();grassCtx.moveTo(blade*.9,1);grassCtx.quadraticCurveTo(end*.45,-h*.55,end,-h);grassCtx.stroke();
    grassCtx.strokeStyle='rgba(226,226,226,.48)';grassCtx.lineWidth=width*.57;grassCtx.beginPath();grassCtx.moveTo(blade*.9+1,0);grassCtx.quadraticCurveTo(end*.45+1,-h*.55,end+.7,-h);grassCtx.stroke();
   }});
  }
  const grain=grassCtx.getImageData(0,0,512,512);for(let i=0;i<grain.data.length;i+=4){const n=(grassRandom()-.5)*15;for(let j=0;j<3;j++)grain.data[i+j]+=n;}grassCtx.putImageData(grain,0,0);
  const grassTexture=new T.CanvasTexture(grassCanvas);grassTexture.wrapS=grassTexture.wrapT=T.RepeatWrapping;grassTexture.anisotropy=2;

  // Give distant decorative islands the same fine turf grain and rounded tree models.
  c.habitat?.root.traverse(o=>{if(o.name==='t-soft-mini-turf'){o.material.map=grassTexture;o.material.needsUpdate=true;}});
  const mat=planet.material.clone(),prior=planet.material.onBeforeCompile;mat.vertexColors=true;
  mat.onBeforeCompile=sh=>{
   prior(sh);sh.uniforms.uMeadowContact={value:contactTexture};sh.uniforms.uGrassGrain={value:grassTexture};
   sh.vertexShader='attribute vec3 sampleCell;attribute vec3 sampleLocal;attribute vec3 sampleUp;attribute float sampleSand;varying float vSampleSand;\n'+sh.vertexShader
    .replaceAll('instanceMatrix[3].xyz','sampleCell').replace('dot(position, outward)','dot(sampleLocal, sampleUp)').replace('vLocal = position','vLocal = sampleLocal').replace('step(0.45, dot(normal, outward))','step(.65, dot(normal,sampleUp))')
    .replace('#include <begin_vertex>','#include <begin_vertex>\nvSampleSand=sampleSand;');
   sh.fragmentShader='uniform sampler2D uMeadowContact;uniform sampler2D uGrassGrain;varying float vSampleSand;\n'+sh.fragmentShader;
   sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   {
    vec3 worldP=vCell+vLocal;
    float fleck=fract(sin(dot(floor(worldP*30.),vec3(12.989,78.23,39.45)))*43758.54);
    float broad=.5+.5*sin(worldP.x*.53+sin(worldP.z*.67)*1.4+worldP.y*.09)*cos(worldP.z*.41-worldP.x*.21+worldP.y*.13);
    float lawnPatch=.5+.5*sin(worldP.x*1.7+worldP.z*.65+worldP.y*.8)*sin(worldP.z*1.3-worldP.x*.4+worldP.y*.6);
    vec3 lawn=mix(vec3(.105,.235,.052),vec3(.24,.37,.092),broad)*(.94+lawnPatch*.08+fleck*.035);
    vec3 ac=abs(vCell);vec2 turfUV=ac.x>ac.y&&ac.x>ac.z?worldP.zy:(ac.y>ac.z?worldP.xz:worldP.xy);
    float grassGrain=texture2D(uGrassGrain,turfUV*.25).r;lawn*=.50+grassGrain;
    vec3 top=mix(lawn,vec3(.52,.43,.25)*(.96+fleck*.045),vSampleSand);
    vec2 stoneUV=ac.x>ac.y&&ac.x>ac.z?worldP.xy:(ac.y>ac.z?worldP.zy:worldP.xz);
    vec2 grid=vec2(stoneUV.x*1.6+floor(stoneUV.y*1.6)*.5,stoneUV.y*1.6);
    vec2 edges=abs(fract(grid)-.5);float seam=smoothstep(.45,.495,max(edges.x,edges.y));
    float pick=fract(sin(dot(floor(grid),vec2(12.99,78.23)))*43758.54);
    vec3 rock=mix(vec3(.22,.185,.12),vec3(.37,.30,.20),pick)*(1.-seam*.12);
    float turf=smoothstep(.32,.46,vLip+(fleck-.5)*.025),upFace=max(vGrass,turf);
    diffuseColor.rgb=mix(rock,top,upFace)*(.90+.10*smoothstep(-.45,.15,vLip));
    vec3 dir=normalize(worldP);vec2 contactUV=vec2(atan(dir.z,dir.x)/6.2831853+.5,asin(clamp(dir.y,-1.,1.))/3.14159265+.5);
    diffuseColor.rgb*=mix(1.,texture2D(uMeadowContact,contactUV).r,upFace);
   }
   `);
  };mat.customProgramCacheKey=()=> 't-soft-whole-island-v4';
  let groundTriangles=0;const faces=[];
  for(let face=0;face<terrains.length;face++){const terrain=terrains[face];if(!terrain.position.length)continue;
   const geo=new T.BufferGeometry();for(const [name,values] of Object.entries(terrain))geo.setAttribute(name,new T.Float32BufferAttribute(values,['sampleSand','shellMask'].includes(name)?1:3));geo.computeBoundingSphere();
   const ground=new T.InstancedMesh(geo,mat,1);ground.setMatrixAt(0,new T.Matrix4());ground.setColorAt(0,new T.Color('#ffffff'));ground.name='t-soft-ground-'+face;ground.userData.softArtFace=face;ground.receiveShadow=true;root.add(ground);groundTriangles+=terrain.position.length/9;faces.push({face,cells:selected.filter(q=>upOf(q.xyz).face===face).length,triangles:terrain.position.length/9});
  }
  const marked=new Set();for(const o of obstacles){if(!['tree','rock','bush'].includes(o.kind)||landDist(o.dir)<0)continue;const key=o.dir.toArray().map(v=>v.toFixed(4)).join(',');if(marked.has(key))continue;marked.add(key);shadowMarks.push({p:o.dir.clone().multiplyScalar(surfaceRadius(o.dir)),r:o.kind==='tree'?1.8:o.kind==='bush'?1.15:.8,strength:o.kind==='tree'?.18:.25,core:o.kind==='tree'?.3:.38});}
  const positions=[],normals=[],colors=[],point=new V(),normal=new V(),nm=new T.Matrix3(),color=new T.Color();
  function sculptedCrown(){const g=new T.SphereGeometry(1,14,10),p=g.attributes.position;for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),belt=1-y*y;
   const bulge=1+.11*Math.sin(a*3+.5)*belt+.055*Math.cos(a*5-y*2)*belt;
   const cloud=1+.095*Math.sin(x*7+y*3)*Math.sin(y*6-z*3)+.055*Math.cos(z*7-x*3);
   p.setXYZ(i,x*bulge*cloud*(1+.07*y),Math.max(-.74,y)*.94*cloud+.055*Math.sin(a*3)*belt,z*bulge*cloud*(.95+.06*x));
  }g.computeVertexNormals();return g;}
  function sculptedRock(seed){const g=new T.IcosahedronGeometry(1,1),p=g.attributes.position;for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.14*Math.sin(x*4+z*3+seed)+.08*Math.cos(y*5-x*2+seed);
   p.setXYZ(i,x*k,Math.max(-.63,Math.min(.8,y*k-.17*x+.07*z)),z*k*(1+.1*x));
  }g.computeVertexNormals();return g;}
  const crown=sculptedCrown(),bud=new T.SphereGeometry(1,9,6),rocks=[0,1,2].map(sculptedRock),trunk=new T.CylinderGeometry(.14,.27,1,7),blade=new T.ConeGeometry(1,1,3),petal=new T.SphereGeometry(1,6,3);
  function add(g,M,tint,kind='plain'){const ng=g.index?g.toNonIndexed():g,p=ng.attributes.position,n=ng.attributes.normal;nm.getNormalMatrix(M);color.set(tint);
   for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i);normal.fromBufferAttribute(n,i);
    const height=point.y,shade=kind==='foliage'?(.70+.30*T.MathUtils.smoothstep(height,-.75,.8))*(.98+.025*Math.sin(point.x*7+point.z*6)):kind==='rock'?.82+.18*(normal.y*.5+.5):.82+.18*(normal.y*.5+.5);
    point.applyMatrix4(M);normal.applyMatrix3(nm).normalize();positions.push(point.x,point.y,point.z);normals.push(normal.x,normal.y,normal.z);colors.push(color.r*shade,color.g*shade,color.b*shade);
   }if(ng!==g)ng.dispose();
  }
  const placed=[],details=[];
  function frame(d){const up=d.clone(),f=w.landmarks.bunny.dir.clone().sub(d).projectOnPlane(up).normalize(),right=new V().crossVectors(up,f).normalize();return new T.Matrix4().makeBasis(right,up,f).setPosition(d.clone().multiplyScalar(surfaceRadius(d)-.06));}
  function piece(g,F,x,y,z,sx,sy,sz,col,angle=0,kind='plain'){const M=new T.Matrix4().compose(new V(x,y,z),new T.Quaternion().setFromAxisAngle(new V(0,1,0),angle),new V(sx,sy,sz));add(g,F.clone().multiply(M),col,kind);}
  function limb(F,from,to,r,color){const a=new V(...from),b=new V(...to),diff=b.clone().sub(a),M=new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(new V(0,1,0),diff.clone().normalize()),new V(r,diff.length(),r));add(trunk,F.clone().multiply(M),color);}
  function safe(d,r){return zone(d)&&landDist(d)>2&&arc(d,STAGE.center)>3.5+r&&arc(d,START_DIR)>2.2+r&&lessonClear.every(q=>arc(d,q)>2+r)&&w.answerDirs.every(q=>arc(d,q)>1.7+r)&&!RACE.near(d)&&w.trailPts.every(q=>arc(d,q)>.85+r)&&obstacles.every(o=>arc(d,o.dir)>o.r+r+.25)&&placed.every(o=>arc(d,o.d)>o.r+r+.5);}
  function find(x,a,r){for(let j=0;j<65;j++){const ang=j*2.39996,rr=j?Math.sqrt(j/64)*2.2:0,d=P(x+Math.cos(ang)*rr,a+Math.sin(ang)*rr);if(safe(d,r))return d;}return null;}
  for(const [x,a,h] of [[-7,1,3.8],[7,1,4.1],[-8,-6,3.2],[8,-6,3.5]]){
   const d=find(x,a,.65);if(!d)continue;const F=frame(d);shadowMarks.push({p:d.clone().multiplyScalar(surfaceRadius(d)),r:1.6,strength:.18,core:.3});
   limb(F,[0,-.08,0],[.12,h*.46,0],1,'#725039');limb(F,[.07,h*.27,0],[-.43,h*.61,.08],.63,'#806045');limb(F,[.1,h*.36,0],[.5,h*.64,-.09],.52,'#755438');
   piece(crown,F,-.04,h*.76,0,h*.40,h*.36,h*.35,'#6e9d4f',x*.13,'foliage');
   [[-.27,.67,.09,.23,.24],[.26,.71,.02,.24,.22],[.06,.66,.24,.22,.19]].forEach(([xx,yy,zz,s,sy],i)=>piece(bud,F,xx*h,yy*h,zz*h,s*h,sy*h,s*h,['#739e50','#80a65a','#6e984e'][i],i,'foliage'));
   obstacles.push({dir:d.clone(),r:.55,kind:'tree'});placed.push({d,r:1.35});details.push({kind:'tree',at:XA(d),h});
  }
  for(const [x,a] of [[-5,-7],[5,-8],[-6,4],[6,4],[-8,-2],[8,-3]]){
   const d=find(x,a,.55);if(!d)continue;const F=frame(d);
   [[0,0,.55,.67],[-.5,.18,.32,.37],[.4,.22,.3,.44]].forEach(([xx,zz,s,h],i)=>{const rd=new V(xx,0,zz).applyMatrix4(F).normalize(),RF=frame(rd);piece(rocks[i],RF,0,h*.60,0,s,h,s*.82,['#8c9389','#adb0a0','#788778'][i],i*.7,'rock');});
   shadowMarks.push({p:d.clone().multiplyScalar(surfaceRadius(d)),r:1.0,strength:.25,core:.48});placed.push({d,r:.65});obstacles.push({dir:d.clone(),r:.55,kind:'rock'});details.push({kind:'rocks',at:XA(d)});
  }
  for(let i=0;i<85;i++){const x=Math.sin(i*17.3)*9.6,a=-10.7+(i*.618%1)*15,d=P(x,a);if(!safe(d,.12))continue;const F=frame(d);
   for(let k=0;k<3;k++)piece(blade,F,(k-1)*.1,.12+k*.02,0,.045,.24+k*.03,.075,['#5f8f48','#8caf63','#49743c'][k],k*1.4);
   if(i%4===0)for(let k=0;k<5;k++){const ang=k*Math.PI*.4;piece(petal,F,Math.cos(ang)*.075,.27,Math.sin(ang)*.075,.075,.025,.045,'#f5e9c9',ang);}
  }

  const ctx=shadeCanvas.getContext('2d'),sw=shadeCanvas.width,sh=shadeCanvas.height;ctx.fillStyle='white';ctx.fillRect(0,0,sw,sh);
  function shade(mark,r,alpha){const d=mark.p.clone().normalize(),x=(Math.atan2(d.z,d.x)/(2*Math.PI)+.5)*sw,y=(.5-Math.asin(d.y)/Math.PI)*sh;
   const ry=r/(Math.PI*16.7)*sh,rx=r/(2*Math.PI*16.7*Math.max(.15,Math.hypot(d.x,d.z)))*sw;
   for(const shift of [-sw,0,sw]){ctx.save();ctx.translate(x+shift,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(0,0,0,${alpha})`);g.addColorStop(.45,`rgba(0,0,0,${alpha*.65})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  }
  shadowMarks.forEach(s=>{shade(s,s.r,s.strength);shade(s,s.core,.30);});contactTexture.needsUpdate=true;
  const G=new T.BufferGeometry();G.setAttribute('position',new T.Float32BufferAttribute(positions,3));G.setAttribute('normal',new T.Float32BufferAttribute(normals,3));G.setAttribute('color',new T.Float32BufferAttribute(colors,3));G.computeBoundingSphere();
  const props=new T.Mesh(G,new T.MeshLambertMaterial({vertexColors:true}));props.name='t-soft-sculpted-props';props.castShadow=!c.LOW_POWER;props.receiveShadow=true;root.add(props);
  [crown,bud,...rocks,trunk,blade,petal].forEach(g=>g.dispose());
  w.artSample={version:4,scope:'whole-island',details,groundCells:selected.length,replacedLandCells:landCells.length,propTriangles:positions.length/9,groundTriangles,faces,discardedGroundTriangles:discarded,contactMarks:shadowMarks.length,pickingPreserved:true,grassTexture:{size:512,tileSpan:4,tufts:1250},trees:w.trees.length,contactTexture:{width:sw,height:sh}};
 }};
})();
