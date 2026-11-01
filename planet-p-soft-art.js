/* P soft-art pass: fine meadow grain, organic mushrooms, faceted stones and foliage.
   P-only builders preserve the existing batch API, collision layout and bubble render pipeline. */
(() => {
 'use strict';
 const enabled=()=>new URLSearchParams(location.search).get('pstyle')!=='original';
 const textures=new WeakMap(),libraries=new WeakMap(),expanded=new WeakMap();
 function createGrassTexture(T){if(textures.has(T))return textures.get(T);
  // The same short-blade paint treatment used on the T island.
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


  textures.set(T,grassTexture);return grassTexture;
 }
 function nonIndexed(g){if(!g.index)return g;if(!expanded.has(g))expanded.set(g,g.toNonIndexed());return expanded.get(g);}
 function makeBatch(T,geo){
  const P=[],N=[],C=[],base=new T.Matrix4(),m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),v=new T.Vector3(),n=new T.Vector3(),p=new T.Vector3(),s=new T.Vector3(),nm=new T.Matrix3(),tmp=new T.Matrix4(),c0=new T.Color(),c1=new T.Color(),cc=new T.Color();
  const plain=nonIndexed(new T.BoxGeometry(1,1,1));let grassK=null,grassUV=null;
  const api={T,base:()=>base,setBase(M){base.copy(M);return api;},resetBase(){base.identity();return api;},
   geometry(g,M,tint,o={}){const src=nonIndexed(g),sp=src.attributes.position,sn=src.attributes.normal;c0.set(tint);if(o.top)c1.set(o.top);nm.getNormalMatrix(M);
    if(o.grass&&!grassK){grassK=Array(P.length/3).fill(0);grassUV=Array(P.length/3*2).fill(0);}
    for(let i=0;i<sp.count;i++){
     v.fromBufferAttribute(sp,i);n.fromBufferAttribute(sn,i);const ny=n.y,low=o.low===undefined?.86:o.low;
     if(grassK){grassK.push(o.grass&&ny>.5?1:0);grassUV.push(v.x*.25,v.z*.25);}
     if(o.soft&&o.top)cc.copy(c0).lerp(c1,T.MathUtils.smoothstep(ny,-.1,.85));else cc.copy(o.top&&ny>.5?c1:c0);
     const k=(ny<-.5?low:1)*(o.foliage?(.72+.28*T.MathUtils.smoothstep(v.y,-.8,.9)):1);
     v.applyMatrix4(M);n.applyMatrix3(nm).normalize();P.push(v.x,v.y,v.z);N.push(n.x,n.y,n.z);C.push(cc.r*k,cc.g*k,cc.b*(ny<-.5?Math.min(1.1,k*1.08):k));
    }
   },
   matrix(M,tint,o={}){api.geometry(o.plain?plain:geo,M,tint,o);},
   block(x,y,z,sx,sy,sz,tint,o={}){e.set(o.rx||0,o.ry||0,o.rz||0);q.setFromEuler(e);m.compose(p.set(x,y,z),q,s.set(sx,sy,sz));tmp.multiplyMatrices(base,m);api.matrix(tmp,tint,o);},
   shape(g,x,y,z,sx,sy,sz,tint,o={}){e.set(o.rx||0,o.ry||0,o.rz||0);q.setFromEuler(e);m.compose(p.set(x,y,z),q,s.set(sx,sy,sz));tmp.multiplyMatrices(base,m);api.geometry(g,tmp,tint,o);},
   count:()=>P.length/3,
   mesh(mat,name){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));if(grassK){g.setAttribute('pGrass',new T.Float32BufferAttribute(grassK,1));g.setAttribute('pGrassUV',new T.Float32BufferAttribute(grassUV,2));}g.computeBoundingSphere();const mesh=new T.Mesh(g,mat);mesh.name=name||'p-soft-batch';return mesh;}
  };return api;
 }
 function shapes(T){if(libraries.has(T))return libraries.get(T);
  const capProfile=[[0,.54],[.23,.54],[.35,.56],[.39,.62],[.385,.72],[.35,.82],[.28,.94],[.18,1.02],[.07,1.055],[0,1.06]];
  const cap=n=>new T.LatheGeometry(capProfile.map(([r,y])=>new T.Vector2(r,y)),n);
  const a={cap:cap(18),smallCap:cap(10),stem:new T.CylinderGeometry(.075,.105,1,7),smallStem:new T.CylinderGeometry(.075,.105,1,5),foot:new T.CylinderGeometry(.12,.14,1,7),gills:new T.CircleGeometry(.35,14).rotateX(Math.PI/2),spot:new T.CircleGeometry(1,7).rotateX(-Math.PI/2),blade:new T.ConeGeometry(1,1,3),head:new T.SphereGeometry(1,16,10),body:new T.SphereGeometry(1,14,9),nose:new T.CylinderGeometry(.16,.16,.12,12).rotateX(Math.PI/2),islandTop:new T.CylinderGeometry(1,1,1,20),rocks:[]};
  const makeLeaf=(segments,rings)=>{const g=new T.SphereGeometry(1,segments,rings),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.08*Math.sin(x*7+y*3)*Math.sin(z*5-y*2);p.setXYZ(i,x*k,Math.max(-.78,y)*k,z*k);}g.computeVertexNormals();return g;};
  a.leaf=makeLeaf(10,7);a.giantLeaf=makeLeaf(14,9);
  for(let seed=0;seed<3;seed++){const g=new T.IcosahedronGeometry(1,1),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.14*Math.sin(x*4+z*3+seed)+.08*Math.cos(y*5-x*2+seed);p.setXYZ(i,x*k,Math.max(-.63,Math.min(.8,y*k-.17*x+.07*z)),z*k*(1+.1*x));}g.computeVertexNormals();a.rocks.push(g);}
  libraries.set(T,a);return a;
 }
 function mushroom(b,x,z,h,ci,seed,palette,cheap=false){const T=b.T,a=shapes(T),[cap,top]=palette[ci%palette.length];
  b.shape(cheap?a.smallStem:a.stem,x,h*.30,z,h,h*.60,h,'#eee0bf',{top:'#fff5df',soft:true});b.shape(a.foot,x,h*.035,z,h,h*.07,h,'#e0cfaa',{top:'#f3e7ca',soft:true});
  b.shape(a.gills,x,h*.555,z,h,1,h,'#ead5bf',{low:.94});b.shape(cheap?a.smallCap:a.cap,x,0,z,h,h,h,cap,{top,soft:true,low:.79});
  if(h<.55)return;
  // Spots follow the cap profile instead of floating as white blocks above the dome.
  const rings=[[0,1.06],[.07,1.055],[.18,1.02],[.28,.94],[.35,.82],[.385,.72],[.39,.62]],heightAt=r=>{for(let j=1;j<rings.length;j++)if(r<=rings[j][0]){const a=rings[j-1],b=rings[j];return T.MathUtils.lerp(a[1],b[1],(r-a[0])/(b[0]-a[0]));}return .62;};
  const n=cheap?4:6;for(let k=0;k<n;k++){const ang=seed*1.9+k*2.39996,rr=.11+(k%3)*.075,cx=Math.sin(ang)*rr,cz=Math.cos(ang)*rr,rad=.035+(k%2)*.015;
   const g=new T.CircleGeometry(rad,7).rotateX(-Math.PI/2),p=g.attributes.position;
   for(let j=0;j<p.count;j++){const xx=p.getX(j)+cx,zz=p.getZ(j)+cz;p.setXYZ(j,xx,heightAt(Math.hypot(xx,zz))+.004,zz);}g.computeVertexNormals();
   b.shape(g,x,0,z,h,h,h,'#fff8ec',{low:1});g.dispose();
  }
 }
 function stone(b,x,z,sx,sy,sz,seed=0,tint='#aaa99a') {b.shape(shapes(b.T).rocks[seed%3],x,sy*.63,z,sx,sy,sz,tint,{top:'#d6d2bc',soft:true});}
 function tuft(b,scale=1){const a=shapes(b.T);for(let k=0;k<3;k++)b.shape(a.blade,(k-1)*.075*scale,(.12+k*.02)*scale,0,.038*scale,(.24+k*.035)*scale,.065*scale,['#679957','#86b371','#5d8950'][k],{ry:k*1.4,top:'#a4ca86',soft:true});}
 function shrub(b,x,z,s,seed=0){const a=shapes(b.T);b.shape(a.leaf,x,s*.43,z,s*.5,s*.48,s*.46,'#77a96e',{top:'#a6cd90',foliage:true,soft:true,ry:seed});b.shape(a.leaf,x+s*.32,s*.32,z+s*.12,s*.33,s*.35,s*.32,'#8fba7c',{top:'#bad99d',foliage:true,soft:true});}
 function tree(b,h=3.5,seed=0){const a=shapes(b.T),s=h/3.5;
  b.shape(a.stem,0,.82*s,0,2.6*s,1.68*s,2.6*s,'#9a7050',{top:'#ba9168',soft:true});
  b.shape(a.stem,-.25*s,1.38*s,.02*s,1.35*s,.95*s,1.35*s,'#a17a54',{rz:-.55,soft:true,top:'#c09a71'});
  b.shape(a.stem,.3*s,1.48*s,-.04*s,1.4*s,.9*s,1.4*s,'#a17a54',{rz:.6,soft:true,top:'#c09a71'});
  const greens=[['#6f9e66','#a9ca83'],['#78aa77','#b3d596'],['#83b48d','#bddb9f']],[c,t]=greens[seed%3];
  for(const [x,y,z,sx,sy,sz] of [[-.46,2.27,0,.9,.91,.91],[.48,2.38,.12,.86,.9,.86],[.04,2.96,-.04,.83,.68,.8]])b.shape(a.leaf,x*s,y*s,z*s,sx*s,sy*s,sz*s,c,{top:t,foliage:true,soft:true,ry:seed*.7});
 }
 // Tall old trees: multiple overlapping, rounded crowns with a cool woodland palette.
 function giantTree(b,h=8,seed=0){const a=shapes(b.T),s=h;
  b.shape(a.stem,0,s*.265,0,s*.98,s*.53,s*.98,'#70533f',{top:'#a47d5d',soft:true});
  for(const [x,z,tilt,turn] of [[-.09,0,-.57,0],[.1,.01,.58,0],[0,-.1,.46,1.57]])
   b.shape(a.stem,x*s,s*.48,z*s,s*.48,s*.32,s*.48,'#795943',{top:'#a18060',soft:true,rz:tilt,ry:turn});
  const palettes=[['#79ac91','#c1dfbc'],['#79a6a3','#bdded2'],['#86a99a','#c9dfc1']], [c,t]=palettes[seed%palettes.length];
  for(const [x,y,z,sx,sy,sz] of [[-.19,.62,0,.22,.19,.22],[.19,.63,.02,.22,.20,.22],[0,.62,-.18,.22,.19,.22],[0,.63,.18,.22,.19,.22],[-.15,.76,-.11,.20,.18,.20],[.16,.77,.1,.20,.18,.20],[.04,.83,-.04,.20,.17,.20]])
   b.shape(a.giantLeaf,x*s,y*s,z*s,sx*s,sy*s,sz*s,c,{top:t,low:.96,soft:true,ry:seed*.6});
 }
 function islandBase(b){const a=shapes(b.T);b.shape(a.islandTop,0,-.08,0,1.30,.26,1.30,'#c1c6bd',{top:'#e2d9cb',soft:true});b.shape(a.rocks[1],0,-.66,0,1.2,.65,1.12,'#a08b72',{top:'#bba584',soft:true});}
 function islandMaterial(T,prior){return prior.clone();}
 function terrain(T,material){const prior=material.onBeforeCompile;
  material.onBeforeCompile=(sh,r)=>{prior(sh,r);
   sh.vertexShader='attribute vec4 pEdge;varying vec4 vPEdge;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPEdge=pEdge;').replace('normalize(mix(objectNormal,normalize(cellOrigin),.8))','normalize(mix(objectNormal,normalize(cellOrigin),.18))');
   sh.fragmentShader='varying vec4 vPEdge;\n'+sh.fragmentShader;
   sh.fragmentShader=sh.fragmentShader.replace('vec3 top=vTop*(.92+grain*.13);top*=1.-.1*step(.86,grain2);top*=1.+.05*step(.93,grain);',`vec3 pWorld=vCell+vLocal;vec3 pAbs=abs(vCell);vec2 pUV=pAbs.x>pAbs.y&&pAbs.x>pAbs.z?pWorld.zy:(pAbs.y>pAbs.z?pWorld.xz:pWorld.xy);
     float edge=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));
     float joint=1.-smoothstep(.012,.042,edge);float bevel=smoothstep(.025,.10,edge);
     float cloud=.5+.5*sin(pUV.x*5.2+sin(pUV.y*3.1+vCell.x)*1.4)*sin(pUV.y*4.3+vCell.z);
     float fleck=step(.965,grain2)*(.4+.6*grain);
     vec3 top=vTop*(.955+.055*cloud+.025*(grain-.5)-.055*fleck);
     top*=mix(.91,1.,bevel);top=mix(top,top*.77,joint*.65);`)
    .replace('dotK*.6','dotK*.35*foam')
    .replace('max(step(.67,vUp),step(.3+(grain-.5)*.1,vLip))','step(.67,vUp)');
   const begin=sh.fragmentShader.indexOf('vec2 t=uv*2.;'),end=sh.fragmentShader.indexOf('if(vPath>.5)',begin);
   sh.fragmentShader=sh.fragmentShader.slice(0,begin)+`vec2 pq=pWorld.xy*1.5;float pj=fract(sin(dot(floor(pq),vec2(12.99,78.23)))*43758.55);vec2 pe=abs(fract(pq)-.5);float seam=smoothstep(.45,.5,max(pe.x,pe.y));vec3 side=diffuseColor.rgb*(.96+pj*.08)*(1.-seam*.06);`+sh.fragmentShader.slice(end);
   const start=sh.fragmentShader.indexOf('vec3 a=abs(vLocal)*2.;'),finish=sh.fragmentShader.indexOf('float gl=dot(diffuseColor.rgb',start);
   sh.fragmentShader=sh.fragmentShader.slice(0,start)+`vec2 q=uv-.5;vec2 rim=smoothstep(vec2(.32),vec2(.5),abs(q))*sign(q)*vec2(q.x>0.?vPEdge.x:vPEdge.y,q.y>0.?vPEdge.z:vPEdge.w);vec3 rn=vFaceN;if(fa.x>.5)rn+=vec3(0.,rim.x,rim.y)*.65;else if(fa.y>.5)rn+=vec3(rim.x,0.,rim.y)*.65;else rn+=vec3(rim.x,rim.y,0.)*.65;diffuseColor.rgb*=1.+(dot(normalize(rn),normalize(vec3(.35,.3,-1.)))-dot(vFaceN,normalize(vec3(.35,.3,-1.))))*.20;diffuseColor.rgb*=mix(.72,1.,vAO);`+sh.fragmentShader.slice(finish);
  };material.customProgramCacheKey=()=> 'p-pastel-soapstone-v1';
 }
 window.YayaPSoftArt={enabled,makeBatch,shapes,mushroom,stone,tuft,shrub,tree,giantTree,islandBase,islandMaterial,terrain,createGrassTexture};
})();
