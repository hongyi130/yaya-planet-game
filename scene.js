/* 独立材质与构图预览。原创程序化场景，不修改 v55 游戏或存档。 */
(() => {
  'use strict';
  const T = window.THREE;
  T.ColorManagement.legacyMode = false;
  const canvas = document.querySelector('#world');
  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 600;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .96;
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene();
  const world = new T.Group();
  scene.add(world);
  const V3 = T.Vector3;
  const camera = new T.PerspectiveCamera(45, innerWidth / innerHeight, .1, 160);
  const geometries = new Map(), materials = new Map();
  const mat = (color, roughness = .8, metalness = 0) => {
    const key = `${color}/${roughness}/${metalness}`;
    if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: .22 }));
    return materials.get(key);
  };
  function rounded(w, h, d, radius = .08) {
    const key = [w, h, d, radius].join('/');
    if (geometries.has(key)) return geometries.get(key);
    const g = new T.BoxGeometry(w, h, d, 3, 3, 3);
    const p = g.attributes.position, n = g.attributes.normal;
    const r = Math.min(radius, w / 2 - .001, h / 2 - .001, d / 2 - .001);
    for (let i = 0; i < p.count; i++) {
      const v = new V3().fromBufferAttribute(p, i);
      const core = new V3(T.MathUtils.clamp(v.x, -w / 2 + r, w / 2 - r), T.MathUtils.clamp(v.y, -h / 2 + r, h / 2 - r), T.MathUtils.clamp(v.z, -d / 2 + r, d / 2 - r));
      const normal = v.clone().sub(core).normalize();
      v.copy(core).addScaledVector(normal, r);
      p.setXYZ(i, v.x, v.y, v.z);
      n.setXYZ(i, normal.x, normal.y, normal.z);
    }
    g.computeBoundingSphere();
    geometries.set(key, g);
    return g;
  }
  function box(w, h, d, radius, material) {
    const mesh = new T.Mesh(rounded(w, h, d, radius), material);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }
  function put(mesh, x, y, z, parent = world) {
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  const props = YayaProps.create({ box, mat });
  let seed = 156026;
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }
  const mix = (a, b, k) => new T.Color(a).lerp(new T.Color(b), k);

  // A soft studio environment gives rounded edges a broad, readable highlight.
  const envScene = new T.Scene(); envScene.background = new T.Color('#b5c8d6');
  const ceiling = new T.Mesh(new T.PlaneGeometry(25, 25), new T.MeshBasicMaterial({ color: '#fff5dc', side: T.DoubleSide }));
  ceiling.rotation.x = Math.PI / 2; ceiling.position.y = 10; envScene.add(ceiling);
  const panel = new T.Mesh(new T.PlaneGeometry(18, 18), new T.MeshBasicMaterial({ color: '#e0e7ff', side: T.DoubleSide }));
  panel.position.set(-12, 3, 0); panel.rotation.y = Math.PI / 2; envScene.add(panel);
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, .08).texture;
  pmrem.dispose(); ceiling.geometry.dispose(); panel.geometry.dispose(); ceiling.material.dispose(); panel.material.dispose();
  const hemi = new T.HemisphereLight('#fff2df', '#80916b', .95);
  scene.add(hemi);
  const sun = new T.DirectionalLight('#fff0c9', 3.15);
  sun.position.set(-10, 16, 9); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 46 });
  sun.shadow.normalBias = .025; sun.shadow.bias = -.00015; sun.shadow.radius = 3;
  sun.target.position.set(0, -1, 0); scene.add(sun, sun.target);
  const rim = new T.DirectionalLight('#a2e1ee', 1.6); rim.position.set(8, 6, -9); scene.add(rim);


  // A complete spherical world. Each terrain patch follows the same radial surface.
  const R = 6.0, UP = new V3(0, 1, 0), RAD = Math.PI / 180;
  const direction = (lon, lat) => new V3(Math.sin(lon * RAD) * Math.cos(lat * RAD), Math.sin(lat * RAD), Math.cos(lon * RAD) * Math.cos(lat * RAD));
  const coordinates = n => ({ lon: Math.atan2(n.x, n.z) / RAD, lat: Math.asin(T.MathUtils.clamp(n.y,-1,1)) / RAD });
  const streamLon = lat => 57 + 9 * Math.sin(lat * .065) + 3 * Math.sin(lat * .15);
  const lakeNormal = direction(38,-18);
  const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
  const smooth=(a,b,x)=>{const k=T.MathUtils.clamp((x-a)/(b-a),0,1);return k*k*(3-2*k);};
  function shoreDistance(n) {
    const {lon,lat}=coordinates(n);
    const riverWidth=.043+.022*(1-Math.sin(lat*RAD));
    const river=Math.abs(wrapAngle((lon-streamLon(lat))*RAD))*Math.cos(lat*RAD)-riverWidth;
    const ends=Math.max((lat-58)*RAD,(-lat-29)*RAD);
    const lake=Math.acos(T.MathUtils.clamp(n.dot(lakeNormal),-1,1))-.37;
    return Math.min(Math.max(river,ends),lake);
  }
  function isWater(n) {return shoreDistance(n)<.007;}
  const hills=[[-34,64,.62,.39],[144,60,.70,.40],[-100,-25,.36,.34],[95,30,.52,.29],[-36,-14,.55,.42]].map(([lon,lat,h,w])=>({n:direction(lon,lat),h,w}));
  function elevation(n){
    let h=.15+.075*Math.sin(n.x*4+n.z*2)*Math.sin(n.y*5-n.z*2);
    for(const hill of hills){const d=Math.acos(T.MathUtils.clamp(n.dot(hill.n),-1,1));h+=hill.h*(1-smooth(hill.w*.72,hill.w,d));}
    return h;
  }
  function terrainRadius(n){const d=shoreDistance(n),e=elevation(n);return R-.15+smooth(-.015,.065,d)*(e+.15);}
  const surfaceRadius = n => Math.max(R+.012,terrainRadius(n));
  function basis(n, heading=0) {
    const north = UP.clone().addScaledVector(n,-n.y);
    if(north.lengthSq()<.0001) north.set(0,0,-1);
    north.normalize();
    const forward = north.negate().applyAxisAngle(n,heading);
    const right = n.clone().cross(forward).normalize();
    return new T.Matrix4().makeBasis(right,n,forward);
  }
  function plantAt(obj,n,heading=0,lift=0,parent=world) {
    obj.position.copy(n).multiplyScalar(surfaceRadius(n)+lift);
    obj.quaternion.setFromRotationMatrix(basis(n,heading));
    obj.userData.normal=n.clone(); parent.add(obj); return obj;
  }
  const plant=(obj,lon,lat,heading=0,lift=0)=>plantAt(obj,direction(lon,lat),heading,lift);
  const groundMeshes=[];
  // One closed irregular mesh; continuous turf and carved banks replace the tile shell.
  const geo=new T.IcosahedronGeometry(1,36),gp=geo.attributes.position,colors=new Float32Array(gp.count*3);
  const grassDeep=new T.Color('#4c922c'),grassSun=new T.Color('#7eb43b'),sand=new T.Color('#dcbb7e'),earth=new T.Color('#b17b4e');
  for(let i=0;i<gp.count;i++){
    const n=new V3().fromBufferAttribute(gp,i).normalize(),d=shoreDistance(n),h=terrainRadius(n);
    gp.setXYZ(i,n.x*h,n.y*h,n.z*h);
    const variation=.42+.16*Math.sin(n.x*7+n.z*2)+.13*Math.sin(n.y*8-n.x*3)+.05*Math.sin(n.z*25+n.x*11);
    const c=grassDeep.clone().lerp(grassSun,T.MathUtils.clamp(variation,0,1));
    const tangent=new V3(n.z,0,-n.x).normalize(),slope=Math.abs(elevation(n.clone().addScaledVector(tangent,.008).normalize())-elevation(n))/.048;if(slope>.48)c.lerp(earth,Math.min(1,(slope-.48)*2.2));
    if(d<.055)c.copy(sand).lerp(earth,smooth(.015,.038,d)).lerp(grassDeep,smooth(.035,.055,d));
    colors.set([c.r,c.g,c.b],i*3);
  }
  geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.computeVertexNormals();
  const land=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.96,flatShading:true,envMapIntensity:.1}));
  land.name='continuous-spherical-landscape';land.castShadow=land.receiveShadow=true;world.add(land);groundMeshes.push(land);
  const waterMat=new T.MeshPhysicalMaterial({color:'#079dc2',roughness:.15,metalness:.07,clearcoat:.8,clearcoatRoughness:.17,envMapIntensity:.65});
  waterMat.onBeforeCompile=shader=>{shader.uniforms.uTime={value:0};waterMat.userData.shader=shader;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWaterWorld;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWaterWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWaterWorld; uniform float uTime;').replace('#include <color_fragment>','#include <color_fragment>\nfloat w = sin(vWaterWorld.x * 62.0 + vWaterWorld.z * 25.0 + uTime * 1.0) * sin(vWaterWorld.y * 44.0 - vWaterWorld.z * 35.0 - uTime * .7); float shimmer=smoothstep(.91,1.0,w); diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.71,.93,.96),shimmer*.48);');};
  const water=new T.Mesh(new T.SphereGeometry(R+.012,100,72),waterMat);water.receiveShadow=true;world.add(water);groundMeshes.push(water);
  const fill=new T.DirectionalLight('#fff1d8',.55);scene.add(fill,fill.target);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(32,32,2,32,32,32);sg.addColorStop(0,'rgba(30,49,23,.32)');sg.addColorStop(.55,'rgba(30,49,23,.13)');sg.addColorStop(1,'rgba(30,49,23,0)');sc.fillStyle=sg;sc.fillRect(0,0,64,64);const shadowMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false});
  function rootShadow(lon,lat,size){const g=plant(new T.Group(),lon,lat,0,.018),m=new T.Mesh(new T.PlaneGeometry(size,size),shadowMat);m.rotation.x=-Math.PI/2;g.add(m);}

  // The three places are separated around the globe, so the far side is actually hidden.
  const places={
    stage:{lon:-24,lat:54,title:'字母石台',caption:'听一听，把三个声音连起来。'},
    camp:{lon:156,lat:48,title:'林间营地',caption:'星球背面，藏着一个小小营地。'},
    stream:{lon:streamLon(12),lat:12,title:'溪流桥',caption:'跟着溪水走，看看桥的另一边。'}
  };
  Object.values(places).forEach(p=>{p.normal=direction(p.lon,p.lat);p.point=p.normal.clone().multiplyScalar(surfaceRadius(p.normal));});
  const stage=new T.Group();plantAt(stage,places.stage.normal,0,-.025);stage.scale.setScalar(.72);
  const stageStone=mat('#e5d2a8',.86),trimStone=mat('#f4e6c4',.8);
  put(box(4,.32,1.9,.1,stageStone),0,.16,0,stage);
  put(box(4.08,.09,1.98,.04,trimStone),0,.365,0,stage);
  put(box(2.85,.20,.65,.06,stageStone),0,.1,1.22,stage);
  const lanternMat=new T.MeshStandardMaterial({color:'#ffe4a2',emissive:'#ffbf62',emissiveIntensity:.2,roughness:.5});
  for(const side of[-1,1]){put(box(.29,1.0,.29,.04,mat('#ac916c',.9)),side*2.25,.5,-.55,stage);put(box(.45,.36,.45,.05,lanternMat),side*2.25,1.18,-.55,stage);}
  function letterFace(letter){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.textAlign='center';g.textBaseline='middle';g.font='900 190px "Arial Rounded MT Bold", Arial, sans-serif';g.fillStyle='rgba(91,69,86,.22)';g.fillText(letter,128,144);g.fillStyle='#fffdf0';g.fillText(letter,128,135);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;}
  const letters=new Map(),clickable=[];
  ['S','I','T'].forEach((letter,i)=>{const block=box(.87,.87,.87,.1,mat(['#e6917e','#a6c77d','#83c5d2'][i],.65));put(block,(i-1)*1.05,.845,0,stage);const face=new T.Mesh(new T.PlaneGeometry(.73,.73),new T.MeshBasicMaterial({map:letterFace(letter),transparent:true,depthWrite:false,toneMapped:false}));face.position.z=.441;block.add(face);block.userData.letter=letter.toLowerCase();block.userData.homeY=.845;letters.set(letter.toLowerCase(),block);clickable.push(block);});

  const tent=plant(props.tent({scale:.85}),places.camp.lon,places.camp.lat,-.1);
  const campBed=plant(new T.Group(),places.camp.lon,places.camp.lat,0,-.04);
  put(box(1.85,.13,1.65,.07,mat('#d0bd86',.9)),0,.02,0,campBed);
  const fire=plant(new T.Group(),places.camp.lon-3,places.camp.lat-18);
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2;put(box(.2,.13,.2,.045,mat('#a19e83',.9)),Math.cos(a)*.34,.06,Math.sin(a)*.34,fire);}
  const flame=new T.Mesh(new T.IcosahedronGeometry(.25,0),lanternMat);flame.scale.set(.65,1.45,.65);flame.position.y=.28;fire.add(flame);
  const bridge=plant(new T.Group(),places.stream.lon,places.stream.lat,0,.10);
  const wood=mat('#b48a54',.9);
  for(let i=0;i<9;i++)put(box(.25,.11,.78,.025,wood),(i-4)*.245,.16+Math.sin(i/8*Math.PI)*.13,0,bridge);
  for(const side of[-1,1]){put(box(2.2,.07,.06,.02,mat('#d8b87c',.88)),0,.59,side*.42,bridge);for(const x of[-.93,.93])put(box(.075,.59,.075,.02,wood),x,.29,side*.42,bridge);}
  if(props.fox)plant(props.fox({scale:.55}),places.stream.lon-18,places.stream.lat-10,.55);

  // Low-poly forest clusters frame clearings; radial roots make the curvature legible.
  const treeSpecs=[
    [-50,59,.69,'#78a932'],[-42,73,.60,'#3d9064'],[-10,71,.70,'#58a03f'],[0,53,.58,'#68a534'],[-52,38,.76,'#9abd3f'],[-6,34,.50,'#3d895d'],
    [-38,68,.47,'#528e33'],[-60,63,.55,'#86b53e'],[-7,65,.46,'#4a956c'],[7,68,.55,'#7db43c'],[-64,45,.52,'#477e36'],
    [135,60,.80,'#6da136'],[170,66,.73,'#3e865f'],[180,49,.62,'#8fb43d'],[132,37,.69,'#40895a'],[173,29,.55,'#a4b84a'],[117,62,.57,'#669331'],
    [124,52,.56,'#478757'],[140,72,.64,'#7da337'],[177,62,.55,'#649c45'],[186,37,.48,'#3e8c68'],[120,40,.48,'#77a539'],
    [38,18,.70,'#77a231'],[87,32,.78,'#267751'],[85,-2,.67,'#85af38'],[42,42,.55,'#489266'],[91,-25,.51,'#6fa039'],[37,-3,.44,'#327b54'],
    [30,31,.57,'#8cb53b'],[100,40,.65,'#38824e'],[98,13,.55,'#64973c'],[94,50,.52,'#438968'],
    [-36,2,.43,'#5f942f'],[-49,-3,.48,'#78a738'],[-52,10,.40,'#35835a'],[-42,-21,.44,'#679d36'],[-24,-11,.39,'#3c8959'],[-108,12,.61,'#75a542'],[-139,36,.64,'#3f946d'],[-145,7,.49,'#9ebc48'],[-96,-23,.48,'#3f895b'],[-23,-42,.42,'#699b38'],[175,-18,.51,'#4e9445']
  ];
  treeSpecs.forEach(([lon,lat,scale,color],i)=>{if(!isWater(direction(lon,lat))){plant(props.tree({scale,color,kind:i%3===1?'pine':'broadleaf',fruit:i%11===0}),lon,lat,i*.7);rootShadow(lon,lat,1.2*scale);}});
  for(let i=0;i<72;i++){
    const lon=random()*360-180,lat=Math.asin(random()*1.65-.65)/RAD,n=direction(lon,lat);
    if(isWater(n)||Object.values(places).some(p=>n.dot(p.normal)>.97))continue;
    plantAt(props.flowerPatch({scale:.56+random()*.18,count:3,color:['#fff2c4','#f7c58c','#c7d9f2'][i%3]}),n,i);
    if(i%5===0)plant(props.rockCluster({scale:.45}),lon+4,lat+3);
  }
  [[-47,24],[145,10],[177,15],[33,-33],[100,-12]].forEach(([lon,lat],i)=>plant(props.mushroom({scale:.6,color:i%2?'#d1ac76':'#dc8e64'}),lon,lat));
  const bushGeo=new T.IcosahedronGeometry(1,1),bushMats=[mat('#47772d',.95),mat('#699a30',.95),mat('#83a738',.95)];
  treeSpecs.forEach(([lon,lat,scale],i)=>{for(let j=0;j<2;j++){const nl=lon+(j?3:-2.5),nt=lat-1.8-j*2,n=direction(nl,nt);if(isWater(n))continue;const m=new T.Mesh(bushGeo,bushMats[(i+j)%3]);m.scale.set(.29*scale+.10,.18*scale+.08,.27*scale+.1);m.castShadow=m.receiveShadow=true;plantAt(m,n,i,.12);}});
  [[75,20],[49,8],[49,-5],[63,-32],[18,-21],[31,-40],[16,-2]].forEach(([lon,lat],i)=>plant(props.rockCluster({scale:.55+(i%3)*.08,color:'#c3a67a'}),lon,lat));
  const lilyMat=mat('#82ae54',.88);
  [[33,-15],[29,-22],[43,-26],[48,-14],[35,-28]].forEach(([lon,lat],i)=>{const n=direction(lon,lat);if(!isWater(n))return;const g=plantAt(new T.Group(),n,0,.015),m=new T.Mesh(new T.CircleGeometry(.12+(i%2)*.035,9,.14,Math.PI*2-.28),lilyMat);m.rotation.x=-Math.PI/2;m.receiveShadow=true;g.add(m);});
  // Small grassy flecks and warm stepping stones trace routes around the surface.
  const tuftGeometry=new T.BufferGeometry(),bladePositions=[];for(let b=0;b<5;b++){const x=(b%3-1)*.065,z=(Math.floor(b/3)-.5)*.075,h=.075+b*.016;bladePositions.push(x-.018,0,z,x+.018,0,z,x+.035,h,z+.018);}tuftGeometry.setAttribute('position',new T.Float32BufferAttribute(bladePositions,3));tuftGeometry.computeVertexNormals();const tuftMat=new T.MeshStandardMaterial({color:'#699c32',roughness:1,side:T.DoubleSide}),tufts=new T.InstancedMesh(tuftGeometry,tuftMat,1500),tmp=new T.Object3D();let tuftCount=0;
  for(let i=0;i<1900;i++){const n=direction(random()*360-180,Math.asin(random()*2-1)/RAD);if(isWater(n))continue;tmp.position.copy(n).multiplyScalar(surfaceRadius(n)+.012);tmp.quaternion.setFromRotationMatrix(basis(n,random()*6));tmp.updateMatrix();tufts.setMatrixAt(tuftCount++,tmp.matrix);if(tuftCount===1500)break;}
  tufts.count=tuftCount;tufts.receiveShadow=true;world.add(tufts);
  const pathMat=new T.MeshStandardMaterial({color:'#c6a46a',roughness:1,side:T.DoubleSide});
  function route(a,b,count,width=.13){const positions=[];let previous=null;for(let i=0;i<count;i++){const t=i/(count-1),n=a.clone().lerp(b,t).addScaledVector(a.clone().cross(b).normalize(),Math.sin(t*Math.PI*2)*.035).normalize(),next=a.clone().lerp(b,Math.min(1,t+.01)).addScaledVector(a.clone().cross(b).normalize(),Math.sin((t+.01)*Math.PI*2)*.035).normalize();const tangent=next.clone().sub(n);if(tangent.lengthSq()<.00001)tangent.copy(n).sub(a);const right=n.clone().cross(tangent).normalize();const l=n.clone().addScaledVector(right,width/R).normalize(),r=n.clone().addScaledVector(right,-width/R).normalize();const pair=[l.multiplyScalar(surfaceRadius(l)+.022),r.multiplyScalar(surfaceRadius(r)+.022)];if(previous&&!isWater(n)){positions.push(...previous[0].toArray(),...previous[1].toArray(),...pair[0].toArray(),...previous[1].toArray(),...pair[1].toArray(),...pair[0].toArray());}previous=pair;}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();const m=new T.Mesh(g,pathMat);m.receiveShadow=true;world.add(m);}
  route(direction(-24,45),direction(39,19),65,.14);
  route(direction(150,37),direction(105,23),55,.13);
  const gems=new Map(),gemColors=['#e59885','#edcc63','#77c4d4','#a7cd81','#b5a2dc','#eca9c5'];
  [['s',-46,47],['a',149,33],['t',86,5],['i',-5,10],['p',-132,-3],['n',173,63]].forEach(([letter,lon,lat],i)=>{
    const group=plant(new T.Group(),lon,lat);put(box(.48,.12,.48,.045,mat('#c5b697',.9)),0,.04,0,group);
    const gem=new T.Mesh(new T.OctahedronGeometry(.25),new T.MeshPhysicalMaterial({color:gemColors[i],roughness:.22,clearcoat:1,emissive:gemColors[i],emissiveIntensity:.08,envMapIntensity:.8}));gem.position.y=.48;gem.castShadow=true;group.add(gem);gem.userData.letter=letter;gem.userData.homeY=.48;gems.set(letter,gem);clickable.push(gem);
  });
  const rippleMat=new T.MeshBasicMaterial({color:'#e8fff2',transparent:true,opacity:.52,depthWrite:false,side:T.DoubleSide});const ripples=[];
  for(let i=0;i<24;i++){const lat=-27+i*3.5,n=direction(streamLon(lat)+(i%2?1.5:-1.5),lat);if(!isWater(n))continue;const p=new T.Mesh(new T.PlaneGeometry(.23,.025),rippleMat);const g=plantAt(new T.Group(),n,0,.012);p.rotation.x=-Math.PI/2;g.add(p);ripples.push({mesh:p,phase:i});}
  // A few faceted clouds retain the reference's warm, storybook sky.
  const cloudMaterial=new T.MeshStandardMaterial({color:'#fff0d6',roughness:1,flatShading:true});const clouds=[];
  [[-8,5,-2,1],[7,6,-5,.8],[-6,-5,-6,.7]].forEach(([x,y,z,s],i)=>{const group=new T.Group();put(group,x,y,z);[[0,0,0,1.15,.43,.5],[-.8,-.03,0,.6,.32,.4],[.65,.06,0,.7,.38,.43]].forEach(([a,b,c,sx,sy,sz])=>{const m=new T.Mesh(new T.IcosahedronGeometry(1,1),cloudMaterial);m.position.set(a,b,c);m.scale.set(sx*s,sy*s,sz*s);group.add(m);});clouds.push({mesh:group,x,phase:i});});
  const starPos=new Float32Array(120*3);for(let i=0;i<120;i++){const n=new V3(random()-.5,random()-.5,random()-.5).normalize().multiplyScalar(45+random()*15);starPos.set(n.toArray(),i*3);}
  const starsGeo=new T.BufferGeometry();starsGeo.setAttribute('position',new T.BufferAttribute(starPos,3));const stars=new T.Points(starsGeo,new T.PointsMaterial({color:'#fff3d3',size:.085,transparent:true,opacity:0,depthWrite:false}));scene.add(stars);
  const explorer=props.explorer({scale:.65});const explorerNormal=direction(-20,39);plantAt(explorer,explorerNormal,0,.025);
  let walk=null;
  function walkTo(input){if(!input||!Number.isFinite(input.lengthSq())||input.lengthSq()<.000001)return false;const n=input.clone().normalize();if(isWater(n))return false;const from=explorerNormal.clone();walk={from,to:n,time:0,duration:Math.max(.6,from.angleTo(n)*4.5)};return true;}
  const slerpDirection=(a,b,t)=>{const angle=a.angleTo(b);if(angle<.001)return b.clone();if(Math.PI-angle<.0001){let axis=a.clone().cross(UP);if(axis.lengthSq()<.0001)axis=a.clone().cross(new V3(1,0,0));return a.clone().applyAxisAngle(axis.normalize(),angle*t).normalize();}return a.clone().multiplyScalar(Math.sin((1-t)*angle)).addScaledVector(b,Math.sin(t*angle)).divideScalar(Math.sin(angle)).normalize();};

  world.updateMatrixWorld(true);
  const movingRoots=new Set([explorer,land,water,tufts,...letters.values(),...gems.values(),...clouds.map(c=>c.mesh),...ripples.map(r=>r.mesh)]),batches=new Map();
  world.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;for(let p=o;p&&p!==world;p=p.parent)if(movingRoots.has(p))return;const key=o.geometry.uuid+'/'+o.material.uuid+'/'+o.castShadow+'/'+o.receiveShadow;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);});
  for(const list of batches.values()){if(list.length<3)continue;const first=list[0],batch=new T.InstancedMesh(first.geometry,first.material,list.length);batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.frustumCulled=false;list.forEach((mesh,i)=>{batch.setMatrixAt(i,mesh.matrixWorld);mesh.parent.remove(mesh);});world.add(batch);}

  // Overview or low, locally upright views into each clearing, with perspective depth.
  const view={mode:'planet',yaw:.16,pitch:.42,target:new V3(0,-.75,0),up:UP.clone(),height:23.0,auto:!reduced,zoom:1};
  const targetView={yaw:.16,pitch:.42,target:new V3(0,-.75,0),up:UP.clone(),height:23.0};
  let transition=1,night=false,drag=null,lastInteraction=performance.now();
  const setPressed=(id,on)=>{const b=document.getElementById(id);if(b){b.setAttribute('aria-pressed',String(on));b.classList.toggle('is-active',on);}};
  function setView(mode,keepDirection=false){
    view.mode=mode;view.zoom=1;transition=0;lastInteraction=performance.now();
    if(places[mode]){
      const p=places[mode];targetView.target.copy(p.point).addScaledVector(p.normal,.78);targetView.yaw=(p.lon+(mode==='camp'?8:mode==='stream'?-6:0))*RAD;targetView.pitch=p.lat*RAD-1.37;targetView.up.copy(p.normal);targetView.height=mode==='stage'?5.8:6.5;view.auto=false;
    }else{targetView.target.set(0,-.75,0);targetView.up.copy(UP);targetView.yaw=keepDirection?view.yaw:.16;targetView.pitch=keepDirection?view.pitch:.42;targetView.height=23.0;}
    targetView.yaw=view.yaw+wrapAngle(targetView.yaw-view.yaw);
    for(const name of['planet','stage','camp','stream'])setPressed('view-'+name,mode===name);
    setPressed('auto-rotate',view.auto);
    const cap=document.querySelector('#caption p');if(cap)cap.textContent=places[mode]?.caption||'转动小星球，走进森林里。';
  }
  const lightState={k:0};
  function setTheme(value){night=value==='night';document.body.dataset.theme=value;setPressed('theme-light',!night);setPressed('theme-night',night);}
  for(const name of['planet','stage','camp','stream'])document.querySelector('#view-'+name)?.addEventListener('click',()=>setView(name));
  document.querySelector('#auto-rotate')?.addEventListener('click',()=>{if(view.mode!=='planet')setView('planet',true);view.auto=!view.auto;lastInteraction=performance.now();setPressed('auto-rotate',view.auto);});
  document.querySelector('#theme-light')?.addEventListener('click',()=>setTheme('light'));
  document.querySelector('#theme-night')?.addEventListener('click',()=>setTheme('night'));
  let audioCtx=null;
  function bell(freq=660){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audioCtx.currentTime);g.gain.setValueAtTime(.0001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.09,audioCtx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+.55);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.6);}catch(e){}}
  const hops=new Map();
  function tapLetter(letter){const obj=letters.get(letter)||gems.get(letter);if(!obj)return;hops.set(obj,0);bell(520+'satipn'.indexOf(letter)*62);document.querySelectorAll('#bag button').forEach(b=>{const selected=b.dataset.letter===letter;b.classList.toggle('is-selected',selected);b.setAttribute('aria-pressed',String(selected));if(selected){b.classList.remove('is-pop');void b.offsetWidth;b.classList.add('is-pop');setTimeout(()=>b.classList.remove('is-pop'),450);}});lastInteraction=performance.now();}
  document.querySelectorAll('#bag [data-letter]').forEach(b=>b.addEventListener('click',()=>tapLetter(b.dataset.letter)));
  document.querySelector('#preview-sound')?.addEventListener('click',()=>{bell(660);setTimeout(()=>bell(830),140);setTimeout(()=>bell(990),280);});
  const ray=new T.Raycaster();
  canvas.addEventListener('pointerdown',e=>{if(drag||!e.isPrimary)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);view.auto=false;setPressed('auto-rotate',false);lastInteraction=performance.now();});
  canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;drag.moved=drag.moved||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6;if(drag.moved){if(view.mode!=='planet')setView('planet',true);view.yaw-=dx*.006;view.pitch=T.MathUtils.clamp(view.pitch+dy*.005,-1.48,1.48);targetView.yaw=view.yaw;targetView.pitch=view.pitch;}drag.lastX=e.clientX;drag.lastY=e.clientY;lastInteraction=performance.now();});
  canvas.addEventListener('pointerup',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    if(!drag.moved){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);const floor=ray.intersectObjects(groundMeshes,false)[0],hit=ray.intersectObjects(clickable,true)[0];
      if(hit&&(!floor||hit.distance<floor.distance+.02)){let o=hit.object;while(o&&!o.userData.letter)o=o.parent;if(o)tapLetter(o.userData.letter);}else if(floor)walkTo(floor.point.clone().normalize());
    }
    drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  });
  const cancel=e=>{if(drag&&e.pointerId===drag.id)drag=null;};canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);
  canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoom=T.MathUtils.clamp(view.zoom+e.deltaY*.0007,.72,1.35);lastInteraction=performance.now();},{passive:false});
  function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();setTheme('light');setView('planet');
  document.querySelector('#loading')?.setAttribute('hidden','');
  let prev=performance.now(),frames=0,start=prev;
  const stats={fps:0,drawCalls:0,triangles:0,version:'spherical-forest-preview',view:'planet'};
  function frame(now){
    const dt=Math.min((now-prev)/1000,.05);prev=now;const time=now/1000;
    if(transition<1){const k=1-Math.exp(-dt*4);view.target.lerp(targetView.target,k);view.up.lerp(targetView.up,k).normalize();view.yaw=T.MathUtils.lerp(view.yaw,targetView.yaw,k);view.pitch=T.MathUtils.lerp(view.pitch,targetView.pitch,k);view.height=T.MathUtils.lerp(view.height,targetView.height,k);transition+=dt*.55;}else{view.target.copy(targetView.target);view.up.copy(targetView.up);view.height=targetView.height;}
    if(view.auto&&!drag&&now-lastInteraction>1800)view.yaw+=dt*.055;
    const aspect=innerWidth/innerHeight,nearMobile=innerWidth<600&&view.mode!=='planet';camera.fov=T.MathUtils.lerp(camera.fov,nearMobile?62:45,1-Math.exp(-dt*5));camera.updateProjectionMatrix();const h=Math.max(view.height,(view.mode==='planet'?17.4:3.9)/aspect)*view.zoom*(nearMobile?1.3:1);
    const distance=h/(2*Math.tan(camera.fov*RAD/2));
    camera.position.set(view.target.x+Math.sin(view.yaw)*Math.cos(view.pitch)*distance,view.target.y+Math.sin(view.pitch)*distance,view.target.z+Math.cos(view.yaw)*Math.cos(view.pitch)*distance);if(camera.position.length()<R+1.25)camera.position.setLength(R+1.25);camera.up.copy(view.up);const aim=view.target.clone();if(view.mode!=='planet')aim.addScaledVector(view.up,-.85);camera.lookAt(aim);
    fill.position.copy(camera.position);fill.target.position.set(0,0,0);
    lightState.k=T.MathUtils.lerp(lightState.k,night?1:0,1-Math.exp(-dt*3));const nk=lightState.k;
    sun.intensity=2.8-nk*1.45;sun.color.copy(mix('#fff0c9','#d0dfff',nk));hemi.intensity=.82-nk*.25;rim.intensity=1.1+nk*.6;fill.intensity=.55-nk*.18;
    lanternMat.emissiveIntensity=.2+nk*1.2;stars.material.opacity=nk*.8;cloudMaterial.color.copy(mix('#fff0d6','#a7b5d4',nk));
    if(waterMat.userData.shader&&!reduced)waterMat.userData.shader.uniforms.uTime.value=time;
    gems.forEach((g,i)=>{if(!reduced)g.rotation.y+=dt*.25;g.material.emissiveIntensity=.08+nk*.3;if(!hops.has(g)&&!reduced)g.position.y=g.userData.homeY+Math.sin(time*1.3+g.id)*.035;});
    if(!reduced){ripples.forEach(r=>r.mesh.position.z=Math.sin(time*.7+r.phase)*.11);clouds.forEach(c=>c.mesh.position.x=c.x+Math.sin(time*.15+c.phase)*.25);}
    if(walk){walk.time+=dt;const t=Math.min(1,walk.time/walk.duration);explorerNormal.copy(slerpDirection(walk.from,walk.to,t));const next=slerpDirection(walk.from,walk.to,Math.min(1,t+.01));plantAt(explorer,explorerNormal,0,.025+(reduced?0:Math.abs(Math.sin(t*walk.duration*9))*.035));if(t<.999){const forward=next.addScaledVector(explorerNormal,-next.dot(explorerNormal)).normalize(),right=explorerNormal.clone().cross(forward).normalize();explorer.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right,explorerNormal,forward));}if(t>=1)walk=null;}
    for(const[obj,t]of hops){const next=t+dt;obj.position.y=obj.userData.homeY+Math.sin(Math.min(next/.5,1)*Math.PI)*.3;if(next>=.5){obj.position.y=obj.userData.homeY;hops.delete(obj);}else hops.set(obj,next);}
    renderer.render(scene,camera);frames++;if(now-start>=1000){stats.fps=Math.round(frames*1000/(now-start));stats.drawCalls=renderer.info.render.calls;stats.triangles=renderer.info.render.triangles;stats.view=view.mode;frames=0;start=now;}
    requestAnimationFrame(frame);
  }
  window.__yayaPreview={scene,world,camera,renderer,view,stats,letters,gems,places,explorer,explorerNormal,groundMeshes,land,water,setView,setTheme,tapLetter,walkTo,direction,surfaceRadius,geometryCount:geometries.size,materialCount:materials.size};
  requestAnimationFrame(frame);
})();
