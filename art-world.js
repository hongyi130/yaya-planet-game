/* Approved v2 art treatment. Geometry and seeded world layout stay in app.js. */
(() => {
  'use strict';
  function terrain(THREE, material, theme="forest") {
    material.onBeforeCompile = shader => {
      const decl = 'varying float vGrass;\nvarying float vLip;\nvarying vec3 vLocal;\nvarying vec3 vCell;';
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n' + decl)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 outward = normalize(instanceMatrix[3].xyz);
          vGrass = step(0.45, dot(normal, outward));
          vLip = dot(position, outward);
          vLocal = position; vCell = instanceMatrix[3].xyz;`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + decl)
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec3 px = floor((vLocal + 0.5) * 8.0) + vCell * 13.0;
          float grain = fract(sin(dot(px, vec3(12.9898,78.233,37.719))) * 43758.5453);
          float cell = fract(sin(dot(vCell,vec3(9.73,35.21,18.42))) * 17437.18);
          float grass = max(vGrass, step(0.29 + (grain - 0.5) * 0.065, vLip));
          vec3 soil = mix(vec3(0.64,0.265,0.092),vec3(0.88,0.43,0.17),cell);
          float strata = 0.91 + 0.09 * step(-0.12,vLip) + 0.055 * step(0.14,vLip);
          diffuseColor.rgb = mix(soil * strata, diffuseColor.rgb, grass);
          vec3 a = abs(vLocal) * 2.0;
          float mid = a.x+a.y+a.z-max(a.x,max(a.y,a.z))-min(a.x,min(a.y,a.z));
          float edge = smoothstep(0.94,0.997,mid);
          diffuseColor.rgb *= (0.96 + grain * 0.07) * (1.0 - 0.055 * edge);`);
    };
    const compile=material.onBeforeCompile;material.onBeforeCompile=shader=>{compile(shader);if(theme==='island')shader.fragmentShader=shader.fragmentShader.replace('vec3(0.64,0.265,0.092),vec3(0.88,0.43,0.17)','vec3(0.66,0.48,0.25),vec3(0.88,0.74,0.48)')};
    material.customProgramCacheKey = () => 'round2-terrain-'+theme;
  }
  function colorTerrain(THREE, planet, cells) {
    const color = new THREE.Color();
    cells.forEach(([x,y,z],i) => {
      const n = Math.sin(x*9.73+y*35.21+z*18.42)*17437.18;
      const v = n-Math.floor(n);
      color.setHSL(0.218 + v*0.025, 0.66 + v*0.07, 0.32 + v*0.10);
      planet.setColorAt(i,color);
    });
    planet.instanceColor.needsUpdate = true;
  }
  function makeStar(THREE) {
    const shape = new THREE.Shape();
    for(let i=0;i<10;i++) {
      const a = Math.PI/2+i*Math.PI/5, r = i%2 ? 0.146 : 0.325;
      if(i===0) shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);
      else shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape,{depth:0.115,bevelEnabled:true,bevelThickness:0.046,bevelSize:0.035,bevelSegments:1,curveSegments:1});
    geo.center();
    const mesh = new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xffce38,emissive:0xffbd32,emissiveIntensity:0.5,roughness:0.6,metalness:0,flatShading:true}));
    mesh.name='stage-star'; mesh.userData.art='stage-star'; mesh.castShadow=true;
    // Five facets meet at the warm raised center, like the concept's toy star.
    const points=[];
    for(let i=0;i<10;i++) {
      const a=Math.PI/2+i*Math.PI/5,b=Math.PI/2+(i+1)*Math.PI/5;
      const r=i%2?0.146:0.325,s=(i+1)%2?0.146:0.325;
      points.push(0,0,0.14,Math.cos(a)*r,Math.sin(a)*r,0.087,Math.cos(b)*s,Math.sin(b)*s,0.087);
    }
    const faceGeo=new THREE.BufferGeometry();faceGeo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));faceGeo.computeVertexNormals();
    const face=new THREE.Mesh(faceGeo,new THREE.MeshStandardMaterial({color:0xffe47a,emissive:0xffd75d,emissiveIntensity:0.65,roughness:0.5,flatShading:true}));
    mesh.add(face);
    const c=document.createElement('canvas');c.width=c.height=64;
    const g=c.getContext('2d'),grad=g.createRadialGradient(32,32,2,32,32,32);
    grad.addColorStop(0,'rgba(255,218,105,.5)');grad.addColorStop(.45,'rgba(255,210,75,.15)');grad.addColorStop(1,'rgba(255,209,80,0)');
    g.fillStyle=grad;g.fillRect(0,0,64,64);
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.55}));
    halo.scale.setScalar(1.15);mesh.add(halo);
    return mesh;
  }
  function softenClouds(THREE,clouds) {
    // Only replace cloud meshes' appearance. Keep the original world's seeded
    // positions, radial orientation and shared orbit; never bind these to the camera.
    const geo=new THREE.SphereGeometry(.5,9,6).toNonIndexed();
    const p=geo.attributes.position,colors=[];
    const light=new THREE.Vector3(-.5,.7,.5).normalize();
    for(let i=0;i<p.count;i+=3) {
      const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);
      const normal=b.sub(a).cross(c.sub(a)).normalize();
      const col=new THREE.Color(0xe8ba95).lerp(new THREE.Color(0xfff5dc),(normal.y+1)*.5);
      col.multiplyScalar(.94+.06*normal.dot(light));
      for(let j=0;j<3;j++)colors.push(col.r,col.g,col.b);
    }
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const mat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.8});
    const oldGeometries=new Set(),oldMaterials=new Set();
    clouds.traverse(o=>{if(o.isMesh){
      oldGeometries.add(o.geometry);oldMaterials.add(o.material);
      o.geometry=geo;o.material=mat;
    }});
    oldGeometries.forEach(g=>g.dispose());
    oldMaterials.forEach(m=>m.dispose());
  }
  function meadowDetails(THREE,scene,cells,obstacles,arc) {
    const tops=new Map();
    cells.forEach(([x,y,z])=>{const k=x+','+z;if(!tops.has(k)||tops.get(k)<y)tops.set(k,y);});
    const petals=[],centers=[],stems=[],grass=[];
    const rand=n=>{const x=Math.sin(n*93.17+17.18)*43758.54;return x-Math.floor(x);};
    let index=0;
    for(const [key,y] of tops) {
      const [x,z]=key.split(',').map(Number);
      if(y<5||z<-.5||z>7||Math.abs(x)>7||(Math.abs(x)<2.9&&z<2)||Math.abs(x)<1.9)continue;
      const seed=++index;
      if(rand(seed)>.65)continue;
      const px=x+(rand(seed+4)-.5)*.6,pz=z+(rand(seed+8)-.5)*.6,py=y+.515;
      const dir=new THREE.Vector3(px,py,pz).normalize();
      if(obstacles.some(o=>arc(dir,o.dir)<o.r+.16))continue;
      if(rand(seed+21)>.42) {
        const count=rand(seed+22)>.5?2:1;
        for(let j=0;j<count;j++) {
          const cx=px+j*.16,cz=pz+j*.09,cy=py+.15;
          stems.push([cx,py+.07,cz,.018,.14,.018]);
          centers.push([cx,cy+.015,cz,.037,.024,.037]);
          for(let k=0;k<5;k++) {const a=k*Math.PI*2/5;petals.push([cx+Math.cos(a)*.06,cy,cz+Math.sin(a)*.06,.057,.027,.041]);}
        }
      }
      for(let j=0;j<3;j++)grass.push([px+.12*(j-1),py+.04,pz-.1,.035,.08+rand(seed+j)*.09,.045]);
    }
    const group=new THREE.Group();group.name='art-meadow-details';
    const m=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),s=new THREE.Vector3();
    [[petals,new THREE.IcosahedronGeometry(1,0),0xfff8d9],[centers,new THREE.IcosahedronGeometry(1,0),0xffce56],[stems,new THREE.BoxGeometry(1,1,1),0x658d2f],[grass,new THREE.ConeGeometry(1,1,3),0x91b936]].forEach(([items,geo,color])=>{
      const mesh=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({color}),items.length);
      items.forEach(([x,y,z,sx,sy,sz],i)=>{m.compose(p.set(x,y,z),q,s.set(sx,sy,sz));mesh.setMatrixAt(i,m);});
      mesh.receiveShadow=true;mesh.castShadow=false;group.add(mesh);
    });
    scene.add(group);return group;
  }
  window.YayaArtWorld={terrain,colorTerrain,makeStar,softenClouds,meadowDetails};
})();
