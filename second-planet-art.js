/* A-02: moonlit mint meadow. All hooks are called only for l02.
   No shared random stream, collisions, saves, camera or cloud transforms change. */
(() => {
  const palette = { meadow:'#65b9ac', sand:'#d6b69a', coral:'#efa4a3', pine:'#529c9d', sky:'#242843' };
  function terrain(T, material, planet, cells) {
    const original = material.onBeforeCompile;
    material.onBeforeCompile = shader => {
      original(shader);
      shader.fragmentShader = shader.fragmentShader.replace(
        'mix(vec3(0.64,0.265,0.092),vec3(0.88,0.43,0.17),cell)',
        'mix(vec3(0.44,0.31,0.29),vec3(0.74,0.57,0.43),cell)');
    };
    material.customProgramCacheKey = () => 'yaya-l02-mint-terrain-v1';
    const c = new T.Color();
    cells.forEach(([x,y,z],i) => {
      const n = Math.sin(x*9.73+y*35.21+z*18.42)*17437.18, v = n-Math.floor(n);
      c.setHSL(.455+v*.026,.32+v*.09,.32+v*.12);
      planet.setColorAt(i,c);
    });
    planet.instanceColor.needsUpdate = true;
  }
  function sky(T, skyGroup, clouds) {
    const dome = skyGroup.children.find(o => o.material && o.material.isShaderMaterial);
    dome.material.fragmentShader = `varying vec3 vDir;
      void main() {
        vec3 d=normalize(vDir);
        float glow=smoothstep(-.9,.85,-d.x+d.y*.15);
        vec3 c=mix(vec3(.075,.10,.23),vec3(.18,.34,.43),glow);
        float ribbon=exp(-pow((d.y-.16-sin(d.x*3.+d.z*2.)*.13)*5.,2.));
        c=mix(c,vec3(.28,.24,.44),ribbon*.3);
        gl_FragColor=vec4(c,1.);
      }`;
    dome.material.needsUpdate=true;
    skyGroup.children.forEach(o => {
      if(o.isPoints) {
        o.material.opacity=.72;o.material.size=1.6;
        const cols=o.geometry.getAttribute('color');
        for(let i=0;i<cols.count;i++) {
          const v=.38+.5*((i*37%101)/101);
          cols.setXYZ(i,v*.82,v*.94,v);
        }
        cols.needsUpdate=true;
      }
      if(o.isSprite) {o.material.color.set('#a6cfe4');o.material.opacity=.1;}
    });
    // Keep the restored world-space orbit, shape, orientation and opacity.
    const done=new Set();
    clouds.traverse(o => {
      if(!o.isMesh||done.has(o.geometry))return;done.add(o.geometry);
      const cols=o.geometry.getAttribute('color'),c=new T.Color();
      for(let i=0;i<cols.count;i++) {
        const t=Math.min(1,(cols.getX(i)+cols.getY(i)+cols.getZ(i))/3);
        c.set('#778cae').lerp(new T.Color('#e0e6ee'),t);
        cols.setXYZ(i,c.r,c.g,c.b);
      }
      cols.needsUpdate=true;
    });
  }
  function models(T, library) {
    const color=new T.Color(),hsl={},cache=new Map();
    ['tree','treeHigh','plant','tent','rocks','stones'].forEach(name => {
      library[name].scene.traverse(o => {
        if(!o.isMesh)return;
        const grade=mat => {
          const key=name+':'+mat.uuid;
          if(cache.has(key))return cache.get(key);
          if(!mat.map?.image)return mat;
          const src=mat.map.image,cv=document.createElement('canvas');
          cv.width=src.naturalWidth||src.width;cv.height=src.naturalHeight||src.height;
          const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(src,0,0);
          const pixels=g.getImageData(0,0,cv.width,cv.height),a=pixels.data;
          for(let i=0;i<a.length;i+=4) {
            color.setRGB(a[i]/255,a[i+1]/255,a[i+2]/255);color.getHSL(hsl);
            const leaf=['tree','treeHigh','plant'].includes(name)&&hsl.h>.19&&hsl.h<.53&&hsl.s>.15;
            if(leaf) color.setHSL(name==='treeHigh'?.97:.47,name==='treeHigh'?.40:.38,Math.min(.82,hsl.l*(name==='treeHigh'?1.18:1.03)));
            else if(name==='tent'&&hsl.h>.48&&hsl.h<.78&&hsl.s>.15) color.setHSL(.025,.54,Math.min(.78,hsl.l*1.18));
            else if(['rocks','stones'].includes(name)&&hsl.s<.35) color.setHSL(.64,.17,Math.min(.82,hsl.l*1.18));
            else continue;
            a[i]=Math.round(color.r*255);a[i+1]=Math.round(color.g*255);a[i+2]=Math.round(color.b*255);
          }
          g.putImageData(pixels,0,0);
          const tex=mat.map.clone();tex.source=new T.Source(cv);tex.needsUpdate=true;
          const next=mat.clone();next.map=tex;cache.set(key,next);return next;
        };
        o.material=Array.isArray(o.material)?o.material.map(grade):grade(o.material);
      });
    });
  }
  function decorate({THREE:T,scene,cells,obstacles,crystals,arc,STAGE}) {
    const group=new T.Group();group.name='l02-moon-meadow';scene.add(group);
    const top=new Map();cells.forEach(([x,y,z])=>{const k=x+','+z;if(!top.has(k)||top.get(k)<y)top.set(k,y);});
    const spots=[];
    for(const [key,y] of top) {
      const [x,z]=key.split(',').map(Number);
      if(y<4||z<0||z>6||Math.abs(x)<2.8||Math.abs(x)>6)continue;
      const d=new T.Vector3(x,y+.5,z).normalize();
      if(obstacles.some(o=>arc(d,o.dir)<o.r+.6)||Object.values(crystals).some(c=>arc(d,c.dir)<1.6))continue;
      const h=Math.abs(Math.sin(x*43.2+z*13.7));if(h<.48)continue;
      spots.push({x,y:y+.52,z,h});if(spots.length===12)break;
    }
    const stem=new T.InstancedMesh(new T.CylinderGeometry(.045,.07,.28,6),new T.MeshLambertMaterial({color:'#f5e6cf'}),spots.length*2);
    const cap=new T.InstancedMesh(new T.SphereGeometry(.21,7,3,0,Math.PI*2,0,Math.PI/2),new T.MeshLambertMaterial({color:'#eca1b6',emissive:'#a34e81',emissiveIntensity:.12,flatShading:true}),spots.length*2);
    const dot=new T.InstancedMesh(new T.IcosahedronGeometry(.027,0),new T.MeshLambertMaterial({color:'#fff4dd'}),spots.length*4);
    const obj=new T.Object3D();
    spots.forEach((p,i)=>{
      for(let j=0;j<2;j++) {
        const s=j?.65:1,x=p.x+j*.25,z=p.z+j*.19;
        obj.position.set(x,p.y+.14*s,z);obj.scale.setScalar(s);obj.updateMatrix();stem.setMatrixAt(i*2+j,obj.matrix);
        obj.position.y=p.y+.28*s;obj.updateMatrix();cap.setMatrixAt(i*2+j,obj.matrix);
        for(let k=0;k<2;k++) {obj.position.set(x+(k?-.08:.07)*s,p.y+.43*s,z+(k?.05:-.06)*s);obj.updateMatrix();dot.setMatrixAt(i*4+j*2+k,obj.matrix);}
      }
    });
    [stem,cap,dot].forEach(m=>{m.castShadow=true;m.receiveShadow=true;group.add(m);});
    // Muted ivory stone gives the golden stars a warmer edge against the blue sky.
    STAGE.group.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry').forEach(o=>o.material.color.set('#e2d6c3'));
    group.userData.palette=palette;group.userData.mushroomClusters=spots.length;
    return group;
  }
  window.YayaSecondArt={palette,terrain,sky,models,decorate};
})();
