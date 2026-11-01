/* Round 3 — a small explorer in a large, rounded-block world.
   Original procedural geometry only; no fetched textures or model assets. */
(() => {
  'use strict';
  function roundedBox(T, bevel = .075) {
    // A smooth bevel with only 44 triangles (rather than a subdivided cube).
    const core=.5-bevel,positions=[],normals=[],a=new T.Vector3(),b=new T.Vector3(),n=new T.Vector3();
    function face(points) {
      a.fromArray(points[1]).sub(new T.Vector3().fromArray(points[0]));b.fromArray(points[2]).sub(new T.Vector3().fromArray(points[0]));
      n.crossVectors(a,b);const center=new T.Vector3();points.forEach(p=>center.add(new T.Vector3().fromArray(p)));
      if(n.dot(center)<0)points.reverse();
      for(let i=1;i<points.length-1;i++)for(const p of [points[0],points[i],points[i+1]]) {
        positions.push(...p);n.set(p[0]-Math.max(-core,Math.min(core,p[0])),p[1]-Math.max(-core,Math.min(core,p[1])),p[2]-Math.max(-core,Math.min(core,p[2]))).normalize();normals.push(n.x,n.y,n.z);
      }
    }
    for(let axis=0;axis<3;axis++)for(const sign of [-1,1]) {
      const u=(axis+1)%3,v=(axis+2)%3;
      face([[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{const p=[0,0,0];p[axis]=sign*.5;p[u]=x*core;p[v]=y*core;return p;}));
    }
    for(let free=0;free<3;free++)for(const s of [-1,1])for(const t of [-1,1]) {
      const u=(free+1)%3,v=(free+2)%3;
      face([[1,0,-1],[1,0,1],[0,1,1],[0,1,-1]].map(([x,y,z])=>{const p=[0,0,0];p[u]=s*(x?.5:core);p[v]=t*(y?.5:core);p[free]=z*core;return p;}));
    }
    for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]) face([[x*.5,y*core,z*core],[x*core,y*.5,z*core],[x*core,y*core,z*.5]]);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.computeBoundingSphere();return g;
  }
  function create(c) {
    const { THREE: T, scene, skyGroup, clouds, planet, cells, STAGE, obstacles, props, registerProp, place,
      tangent, arc, surfaceRadius, rng, LOW_POWER, habitat, START_DIR, orient } = c;
    const R = c.R || 16, SURF = R + .7, root = new T.Group(); root.name = 'round3-large-world'; scene.add(root);
    const box = roundedBox(T), cube = new T.BoxGeometry(1, 1, 1), sphere = new T.SphereGeometry(1, 12, 8);
    const color = new T.Color(), normalMatrix = new T.Matrix3(), v = new T.Vector3(), norm = new T.Vector3();
    const material = new T.MeshStandardMaterial({ vertexColors: true, roughness: .88, metalness: 0 });
    const matrix = new T.Matrix4(), quaternion = new T.Quaternion(), pos = new T.Vector3(), scale = new T.Vector3();
    function batch() {
      const positions = [], normals = [], colors = [];
      return {
        add(geo, transform, tint) {
          const g = geo.index ? geo.toNonIndexed() : geo, pp = g.attributes.position, nn = g.attributes.normal, cc = g.attributes.color;
          color.set(tint); normalMatrix.getNormalMatrix(transform);
          for (let i = 0; i < pp.count; i++) {
            v.fromBufferAttribute(pp, i).applyMatrix4(transform); norm.fromBufferAttribute(nn, i).applyMatrix3(normalMatrix).normalize();
            positions.push(v.x, v.y, v.z); normals.push(norm.x, norm.y, norm.z); colors.push(color.r * (cc ? cc.getX(i) : 1), color.g * (cc ? cc.getY(i) : 1), color.b * (cc ? cc.getZ(i) : 1));
          }
          if (g !== geo) g.dispose();
        },
        block(x, y, z, sx, sy, sz, tint, rot = 0, geo = box) {
          quaternion.setFromAxisAngle(new T.Vector3(0, 1, 0), rot);
          matrix.compose(pos.set(x, y, z), quaternion, scale.set(sx, sy, sz)); this.add(geo, matrix, tint);
        },
        mesh(mat = material) {
          const g = new T.BufferGeometry();
          g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
          g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
          g.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); g.computeBoundingSphere();
          const m = new T.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
        },
      };
    }
    const local = (x, z) => new T.Vector3(x, SURF, z).normalize();
    const scenery = [], landmarks = {}, treeInfo = [];
    const lessonClear = (c.PLANET.clearSpots || []).map(([polar,azim]) => {const p=polar*Math.PI/180,a=azim*Math.PI/180;return new T.Vector3(Math.sin(p)*Math.sin(a),Math.cos(p),-Math.sin(p)*Math.cos(a));});
    Object.values(c.crystals||{}).forEach(cr=>lessonClear.push(cr.dir));
    const clearsLesson = (d,r=.7) => lessonClear.every(q=>arc(d,q)>r+2.1);
    // Remove superseded small scenery and its exact collision disks together.
    for (const p of props) {
      p.obj.visible = false;
      for (let i = obstacles.length - 1; i >= 0; i--) if (!obstacles[i].crystal && arc(obstacles[i].dir, p.dir) < .001) obstacles.splice(i, 1);
    }
    props.splice(0, props.length);
    if (habitat?.pond) habitat.pond.visible = false;
    for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].kind === 'pond') obstacles.splice(i, 1);
    const oldMeadow = scene.getObjectByName('art-meadow-details'); if (oldMeadow) oldMeadow.visible = false;
    const groundColor = new T.Color();
    cells.forEach(([x, y, z], i) => {
      const n = .5 + .5 * Math.sin(x * 11.7 + y * 5.9 + z * 21.8), patch = Math.sin(x * .9 + y * .7) * Math.sin(z * .8 - y * .5);
      // Round 4b: no checkerboard. Colour comes from smooth, large-scale fields (broad lighter / darker lawns and
      // yellow-green vs blue-green drift); the per-block random term is only a faint tint.
      const big = Math.sin(x * .33 + z * .21 + y * .27) * Math.sin(y * .31 - z * .37 + x * .12), wide = Math.sin(x * .17 - y * .21 + z * .19);
      groundColor.setHSL(.252 + big * .028 + wide * .012 + (n - .5) * .006, .58 + wide * .05 + (n - .5) * .03, .375 + big * .035 + wide * .02 + (n - .5) * .014).convertSRGBToLinear();
      planet.setColorAt(i, groundColor);
    }); planet.instanceColor.needsUpdate = true;
    // Round 4: subtle grass speckle (small lighter/darker squares per tile) so flat top faces read as lawn, not plain checkers.
    {
      const mat = planet.material, prevCompile = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
      mat.onBeforeCompile = shader => {
        prevCompile(shader);
        shader.fragmentShader = shader.fragmentShader.replace('diffuseColor.rgb *= (0.96 + grain * 0.07)',
          `float tuft = fract(sin(dot(floor((vLocal + 0.5) * 7.0) + vCell * 5.3, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          diffuseColor.rgb *= mix(1.0, 0.93 + tuft * 0.14, grass);
          // Round 5 brick road: road cells are the only warm (red > green) instance colours; draw staggered bricks on their tops
          float roadish = step(1.22, diffuseColor.r / (diffuseColor.g + 0.001));
          vec3 ac = abs(vCell); vec2 buv = ac.x > ac.y && ac.x > ac.z ? vLocal.yz : (ac.y > ac.z ? vLocal.xz : vLocal.xy);
          float brow = floor((buv.y + 0.5) * 3.0), bx = fract((buv.x + 0.5) * 2.0 + brow * 0.5), by = fract((buv.y + 0.5) * 3.0);
          float mortar = 1.0 - step(0.05, bx) * step(bx, 0.95) * step(0.08, by) * step(by, 0.92);
          float btone = fract(sin(dot(vec3(floor((buv.x + 0.5) * 2.0 + brow * 0.5), brow, 0.0) + vCell, vec3(12.99, 78.23, 37.72))) * 43758.5);
          diffuseColor.rgb *= mix(1.0, mix(0.9 + btone * 0.16, 0.74, mortar), roadish * grass);
          diffuseColor.rgb *= (0.985 + grain * 0.03)`);
        shader.fragmentShader = shader.fragmentShader.replace('(1.0 - 0.055 * edge)', '(1.0 - 0.012 * edge)');
      };
      mat.customProgramCacheKey = () => prevKey() + '-r4-speckle'; mat.needsUpdate = true;
    }
    scene.fog = new T.Fog('#f4b9b5', 62, 210);
    const sky = skyGroup.children.find(o => o.isMesh && o.material.isShaderMaterial);
    if (sky) {
      sky.material.fragmentShader = `varying vec3 vDir;
        void main(){vec3 d=normalize(vDir);float h=d.y;
        vec3 horizon=vec3(1.,.74,.52),mid=vec3(.96,.55,.68),zenith=vec3(.50,.33,.70),low=vec3(.86,.50,.64);
        vec3 c=mix(horizon,mid,smoothstep(-.02,.07,h));c=mix(c,zenith,smoothstep(.06,.30,h));
        c=mix(c,low,smoothstep(.0,-.55,h));
        vec3 sd=normalize(vec3(.20,.06,-1.));float s=max(0.,dot(d,sd));
        c+=vec3(1.,.62,.30)*pow(s,4.)*.22+vec3(1.,.85,.55)*pow(s,40.)*.22+vec3(1.,.96,.80)*pow(s,500.)*.3;
        float band=sin(d.x*9.+h*13.)*sin(h*21.-d.x*5.);c+=band*.012;
        gl_FragColor=vec4(c,1.);}`;
      sky.material.needsUpdate = true;
    }
    skyGroup.children.filter(o => o.isPoints).forEach(o => { o.material.fog=false; o.material.opacity = .85; o.material.size = 2.2; });
    // Extra twinkling stars in the upper sky (small, fog-free points; stars sit high so they read against the purple).
    {
      const n=LOW_POWER?160:260,pos=new Float32Array(n*3);
      for(let i=0;i<n;i++){const az=rng()*Math.PI*2,el=(.02+rng()*.9)*Math.PI/2*(rng()<.85?1:.6),r=420;pos[i*3]=Math.sin(az)*Math.cos(el)*r;pos[i*3+1]=Math.sin(el)*r;pos[i*3+2]=-Math.cos(az)*Math.cos(el)*r;}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));
      const st=new T.Points(g,new T.PointsMaterial({color:'#fff3df',size:2.4,sizeAttenuation:false,transparent:true,opacity:.8,depthWrite:false,fog:false}));st.name='round4-stars';skyGroup.add(st);
    }
    // Round 4 clouds: soft clusters of chunky rounded cubes, cream tops fading to pink-lilac undersides.
    clouds.clear(); clouds.rotation.set(0, 0, 0);
    const cloudBox = roundedBox(T, .16);
    const cloudMat = new T.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false });
    // Round 5 clouds: cumulus shapes (flat base + 3-5 round domes) filled with small rounded voxels. The clouds are
    // unlit, so light is baked into the vertex colours per face: sunlit cream tops, peach sides, lilac shaded bellies.
    const cTop = new T.Color('#fffbf4'), cMid = new T.Color('#f9d3d6'), cLow = new T.Color('#c690bd'), cSun = new T.Color('#ffe3b3'), cTmp = new T.Color();
    const cloudSun = new T.Vector3(.2, .35, -1).normalize(), cloudShapes = [];
    function cloudShape(rr) {
      const n = 2 + Math.floor(rr() * 3), w = 5 + n * 1.5, lobes = [[0, .3, 0, w * .5, 1.1, 2.0]];
      for (let j = 0; j < n; j++) {
        const t = n === 1 ? 0 : j / (n - 1) - .5, mid = 1 - Math.abs(t) * 1.3, r = 1.6 + mid * 1.5 + rr() * .5;
        lobes.push([t * w * .72 + (rr() - .5) * .6, .55 + r * .55, (rr() - .5) * .8, r * 1.08, r, r * .95]);
      }
      const step = 1.15, size = 1.32, cells = [], inside = (x, y, z) => y > -.55 && lobes.some(([cx, cy, cz, ax, ay, az]) => ((x - cx) / ax) ** 2 + ((y - cy) / ay) ** 2 + ((z - cz) / az) ** 2 < 1);
      let top = 0;
      for (let x = -w * .62; x <= w * .62; x += step) for (let y = -.55; y <= 6.2; y += step) for (let z = -2.4; z <= 2.4; z += step) {
        if (!inside(x, y, z) || (inside(x + step, y, z) && inside(x - step, y, z) && inside(x, y + step, z) && inside(x, y - step, z) && inside(x, y, z + step) && inside(x, y, z - step))) continue;
        cells.push([x, y, z]); top = Math.max(top, y);
      }
      const sp = cloudBox.attributes.position, sn = cloudBox.attributes.normal, P = [], N = [], C = [];
      for (const [x, y, z] of cells) {
        const h = (y + .55) / (top + .55), base = cTmp.copy(cLow).lerp(cMid, Math.min(1, h * 1.8));
        if (h > .45) base.lerp(cTop, Math.min(1, (h - .45) / .4));
        for (let i = 0; i < sp.count; i++) {
          // big soft blocks like the concept: bright cream tops, warm sides facing the sunset, cool lilac undersides
          const ny = sn.getY(i), sun = Math.max(0, sn.getX(i) * cloudSun.x + sn.getZ(i) * cloudSun.z);
          const col = base.clone().lerp(cSun, sun * .3);
          if (ny > .5) col.lerp(cTop, .75); else if (ny < -.5) col.lerp(cLow, .55).multiplyScalar(.92); else col.multiplyScalar(.95);
          P.push(sp.getX(i) * size + x, sp.getY(i) * size + y, sp.getZ(i) * size + z); N.push(sn.getX(i), ny, sn.getZ(i)); C.push(Math.min(1, col.r), Math.min(1, col.g), Math.min(1, col.b));
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 3));
      g.computeBoundingSphere(); g.scale(.62, .62, .62); g.computeBoundingSphere(); return g;
    }
    function cloudMesh(rr) {
      // a handful of shapes shared by every cloud (cheap), each placed with its own scale / flip
      if (cloudShapes.length < 6) cloudShapes.push(cloudShape(rr));
      const m = new T.Mesh(cloudShapes[Math.floor(rr() * cloudShapes.length)], cloudMat); m.castShadow = false; m.receiveShadow = false;
      if (rr() < .5) m.scale.x = -1;
      return m;
    }
    const cloudRng = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);
    for (let i = 0; i < 13; i++) {
      const cloud = cloudMesh(cloudRng), a = i / 13 * Math.PI * 2;
      cloud.position.set(Math.cos(a) * 36, 25 + i % 4 * 2.5, Math.sin(a) * 36);
      cloud.scale.setScalar(1.1 + i % 3 * .25); cloud.rotation.y = -a - Math.PI / 2; clouds.add(cloud);
      if(i<4){cloud.position.set([-26,-13,18,35][i],[18,24,22,12][i],[-48,-65,-59,-42][i]);cloud.rotation.y=0;cloud.scale.setScalar([1.6,1.2,1.4,1.4][i]);}
    }
    // Distant clouds: far, big, low on the horizon so both portrait and landscape get soft shapes.
    for(const [x,y,z,k] of [[-58,-52,-250,5.2],[62,-38,-270,4.8],[-6,-70,-240,6],[140,-30,-200,5],[-150,-34,-190,5]]) {
      const m=cloudMesh(cloudRng);m.name='round3-distant-cloud';m.position.set(x,y,z);m.scale.setScalar(k);skyGroup.add(m);
    }
    // Round 4: the ring of tiny floating islands from round 2 was grey rock; re-tint it to warm earth, bright grass and green trees (same meshes, cloned materials).
    (habitat?.root.children||[]).filter(g=>g.isGroup&&Math.abs(g.position.length()-31)<1.6).forEach(g=>g.traverse(o=>{
      if(!o.isMesh)return;const hex=o.material.color.getHexString(),map={bdadad:'#c98a5a',a1bc99:'#78bd4c','84a490':'#4d9b3f'};
      if(map[hex]){o.material=o.material.clone();o.material.color.set(map[hex]);}
    }));
    const oldBirds=(habitat?.root.children||[]).filter(g=>g.isGroup&&g.children.length===3&&Math.abs((g.children[0].scale.x||0)-.09)<.001);
    const skyPlanets = [];
    // Small distant planets with banded vertex colours (original geometry). [azimuth°, elevation°, radius, bands, ring]
    function bandedPlanet(r, bands, tilt = .4) {
      const g = new T.SphereGeometry(r, 18, 12), pos = g.attributes.position, col = [], c = new T.Color(), nrm = new T.Vector3();
      for (let i = 0; i < pos.count; i++) {
        nrm.fromBufferAttribute(pos, i).normalize();
        const t = (nrm.y * Math.cos(tilt) + nrm.x * Math.sin(tilt)) * .5 + .5, k = Math.floor(t * bands.length * 1.9) % bands.length;
        c.set(bands[Math.min(bands.length - 1, Math.floor(t * bands.length))] || bands[0]); if (k % 2) c.multiplyScalar(.93);
        const light = .78 + .22 * Math.max(0, nrm.x * -.5 + nrm.y * .55 + nrm.z * .65); c.multiplyScalar(light); col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      return new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false }));
    }
    [[-10,5.5,6.8,['#f0b774','#e2884f','#f2cf96','#d77a48'],1],[5,3.5,5.4,['#f2aa82','#e56c52','#f6c6a0','#d9583f'],0],[13.5,7,6.2,['#8fd3d0','#58aeb8','#a8e0d8','#4b98ae'],0],
     [-2.5,8.5,3,['#f7d8c6','#e9b5a8','#f4cfc0'],0],[24,10,3.4,['#bda0e8','#9a7fd0','#cdb8f0'],0],[-26,8,3.8,['#f5d07a','#e8b04e','#f8e0a0'],1],[38,6,3,['#f0a0b8','#d9789a','#f7bdd0'],0],[-41,5,2.8,['#9fe0b8','#6cc29c','#bdf0d0'],0],
     [75,7,4.5,['#f0b774','#e2884f','#f2cf96'],0],[115,6,5,['#8fd3d0','#58aeb8','#a8e0d8'],1],[160,8,4,['#f2aa82','#e56c52','#f6c6a0'],0],[200,6,5.2,['#bda0e8','#9a7fd0','#cdb8f0'],0],[-80,7,4.2,['#f5d07a','#e8b04e','#f8e0a0'],0],[-120,6,5,['#f0a0b8','#d9789a','#f7bdd0'],1],[-165,8,4,['#9fe0b8','#6cc29c','#bdf0d0'],0]
    ].forEach(([az, el, r, bands, ring], i) => {
      const m = bandedPlanet(r, bands, .3 + i * .17), dist = 240, A = az * Math.PI / 180, E = el * Math.PI / 180;
      m.position.set(Math.sin(A) * Math.cos(E) * dist, Math.sin(E) * dist, -Math.cos(A) * Math.cos(E) * dist);
      m.name = 'round3-sky-planet-' + i; skyGroup.add(m); skyPlanets.push(m);
      if (ring) { const rg = new T.Mesh(new T.TorusGeometry(r * 1.7, r * .1, 4, 36), new T.MeshBasicMaterial({ color: '#f6d9a0', fog: false })); rg.scale.z = .25; rg.rotation.set(1.2, .1, .5); m.add(rg); }
    });
    // Round 4b: small planets over the lower / side parts of the dome as well (the player's "up" turns as they walk round)
    {
      const pal=[['#f6c58a','#e99a62','#f9dcae'],['#a8e0d8','#6cc4c0','#c8f0e8'],['#f0a0b8','#d9789a','#f7bdd0'],['#f5d07a','#e8b04e','#f8e0a0'],['#bda0e8','#9a7fd0','#cdb8f0'],['#9fe0b8','#6cc29c','#bdf0d0'],['#8fd3d0','#58aeb8','#a8e0d8']];
      let k=0;const N=34;
      for(let i=0;i<N&&k<(LOW_POWER?12:18);i++){
        const yy=1-2*(i+.5)/N;if(yy>.45)continue;
        const rad=Math.sqrt(1-yy*yy),az=i*2.399963+2.1,dist=205,m=bandedPlanet(2.4+(i%4)*.7,pal[k%pal.length],.4+k*.3);
        m.position.set(Math.cos(az)*rad*dist,yy*dist,Math.sin(az)*rad*dist);m.name='round4-sky-planet-low-'+k;skyGroup.add(m);skyPlanets.push(m);
        if(k%4===1){const rg=new T.Mesh(new T.TorusGeometry(2.4*1.7,.24,4,36),new T.MeshBasicMaterial({color:'#f6d9a0',fog:false}));rg.scale.z=.25;rg.rotation.set(1.2,.1,.5);m.add(rg);}
        k++;
      }
    }
    // Round 4b: extra small planets spread over every azimuth (higher in the sky than the originals)
    [[32,17,3.0,['#f6c58a','#e99a62','#f9dcae'],0],[58,26,2.4,['#a8e0d8','#6cc4c0','#c8f0e8'],0],[96,19,3.4,['#f0a0b8','#d9789a','#f7bdd0'],1],[135,28,2.6,['#f5d07a','#e8b04e','#f8e0a0'],0],
     [178,18,3.8,['#bda0e8','#9a7fd0','#cdb8f0'],0],[212,30,2.4,['#f2aa82','#e56c52','#f6c6a0'],0],[246,17,3.2,['#9fe0b8','#6cc29c','#bdf0d0'],1],[282,27,2.8,['#f0b774','#e2884f','#f2cf96'],0],
     [318,18,3.4,['#8fd3d0','#58aeb8','#a8e0d8'],0],[-18,29,2.4,['#f7d8c6','#e9b5a8','#f4cfc0'],0],[104,38,2.0,['#fff0c8','#f8d58c','#fff8e0'],0],[262,40,2.2,['#c9b8f0','#a98fe0','#e0d4fa'],0]
    ].forEach(([az, el, r, bands, ring], i) => {
      if (LOW_POWER && i > 9) return;
      const m = bandedPlanet(r, bands, .5 + i * .23), dist = 200, A = az * Math.PI / 180, E = el * Math.PI / 180;
      m.position.set(Math.sin(A) * Math.cos(E) * dist, Math.sin(E) * dist, -Math.cos(A) * Math.cos(E) * dist);
      m.name = 'round4-sky-planet-' + i; skyGroup.add(m); skyPlanets.push(m);
      if (ring) { const rg = new T.Mesh(new T.TorusGeometry(r * 1.7, r * .1, 4, 36), new T.MeshBasicMaterial({ color: '#f6d9a0', fog: false })); rg.scale.z = .25; rg.rotation.set(1.2, .1, .5); m.add(rg); }
    });
    // Round 4b: the sky must not be empty from the sides or behind - more clouds and small planets all around the dome.
    {
      const nCloud=LOW_POWER?14:20;
      for(let i=0;i<nCloud;i++){
        const yy=1-2*(i+.5)/nCloud,rr_=Math.sqrt(1-yy*yy),az=i*2.399963+.9,rad=40+(i%3)*8,cloud=cloudMesh(cloudRng);
        cloud.position.set(Math.cos(az)*rr_*rad,yy*rad,Math.sin(az)*rr_*rad);cloud.scale.setScalar(1.15+(i%4)*.22);cloud.lookAt(0,0,0);clouds.add(cloud);
      }
      // The sky dome is fixed in world space but the player walks all the way round the planet, so "sky" can be any
      // world direction: spread the far clouds over the WHOLE sphere (Fibonacci lattice), not just the upper half.
      const nFar=LOW_POWER?22:30;
      for(let i=0;i<nFar;i++){
        const yy=1-2*(i+.5)/nFar,rad=Math.sqrt(1-yy*yy),az=i*2.399963+.6,dist=190+(i%3)*14,m=cloudMesh(cloudRng);
        m.name='round4-far-cloud';m.position.set(Math.cos(az)*rad*dist,yy*dist,Math.sin(az)*rad*dist);m.scale.setScalar(3.6+(i%3)*.8);m.lookAt(0,0,0);skyGroup.add(m);
      }
    }
    // Round 4c: a ring of clouds and small planets that stays around the player's horizon (it turns with the player's
    // "up" while walking round the planet), so side and back views always have sky decoration, not just gradient.
    const localSky = new T.Group(); localSky.name = 'round4-horizon-ring'; skyGroup.add(localSky);
    {
      const nC = LOW_POWER ? 30 : 40, nP = LOW_POWER ? 12 : 16, pal = [['#f6c58a','#e99a62','#f9dcae'],['#a8e0d8','#6cc4c0','#c8f0e8'],['#f0a0b8','#d9789a','#f7bdd0'],['#f5d07a','#e8b04e','#f8e0a0'],['#bda0e8','#9a7fd0','#cdb8f0'],['#9fe0b8','#6cc29c','#bdf0d0']];
      for (let i = 0; i < nC; i++) {
        const az = i / nC * Math.PI * 2 + (cloudRng() - .5) * .2, el = (-42 + (i % 3) * 14 + cloudRng() * 10) * Math.PI / 180, dist = 150 + cloudRng() * 40, m = cloudMesh(cloudRng);
        m.name = 'round4-ring-cloud'; m.position.set(Math.cos(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist);
        m.scale.setScalar(2.2 + cloudRng() * 1.4); m.lookAt(0, 0, 0); localSky.add(m);
      }
      for (let i = 0; i < nP; i++) {
        const az = (i + .5) / nP * Math.PI * 2 + 1.1, el = (-34 + (i * 37 % 36)) * Math.PI / 180, dist = 175, m = bandedPlanet(2.3 + (i % 4) * .8, pal[i % pal.length], .3 + i * .27);
        m.name = 'round4-ring-planet-' + i; m.position.set(Math.cos(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist); localSky.add(m); skyPlanets.push(m);
        if (i % 4 === 2) { const rg = new T.Mesh(new T.TorusGeometry((2.3 + (i % 4) * .8) * 1.7, .26, 4, 36), new T.MeshBasicMaterial({ color: '#f6d9a0', fog: false })); rg.scale.z = .25; rg.rotation.set(1.2, .1, .5); m.add(rg); }
      }
    }
    const skyUp = new T.Vector3(0, 1, 0), skyQ = new T.Quaternion();
    function register(g, dir, radius, kind) {
      place(g, dir, STAGE.front, -.06); registerProp(g, dir, radius);
      const o = obstacles[obstacles.length - 1]; if (radius > 0) { o.kind = kind; o.obj = g; }
      scenery.push(g); return g;
    }
    // Round 4: chunky rounded-cube geometry (bigger bevel) and a small deterministic RNG for decoration,
    // so the shared game rng is not consumed by purely visual jitter.
    const chunk = roundedBox(T, .2), soft = roundedBox(T, .13);
    const mk = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const decoRng = mk(20261027);
    // Voxel blob made of overlapping super-ellipsoid lobes: only the visible shell is emitted.
    // lobes: [cx,cy,cz,rx,ry,rz]; returns number of blocks.
    function voxelBlob(b, lobes, step, size, palette, rr, shade = 1) {
      const p = 2.7, inside = (x, y, z, k = 0) => lobes.some(([cx, cy, cz, rx, ry, rz]) =>
        Math.pow(Math.abs((x - cx) / rx), p) + Math.pow(Math.abs((y - cy) / ry), p) + Math.pow(Math.abs((z - cz) / rz), p) < 1 - k * .0);
      let minY = 1e9, maxY = -1e9; lobes.forEach(([, cy, , , ry]) => { minY = Math.min(minY, cy - ry); maxY = Math.max(maxY, cy + ry); });
      const xs = lobes.map(l => [l[0] - l[3], l[0] + l[3]]), zs = lobes.map(l => [l[2] - l[5], l[2] + l[5]]);
      const x0 = Math.min(...xs.map(a => a[0])), x1 = Math.max(...xs.map(a => a[1])), z0 = Math.min(...zs.map(a => a[0])), z1 = Math.max(...zs.map(a => a[1]));
      let count = 0;
      for (let y = minY; y <= maxY + 1e-6; y += step) for (let x = x0; x <= x1; x += step) for (let z = z0; z <= z1; z += step) {
        if (!inside(x, y, z)) continue;
        if (inside(x + step, y, z) && inside(x - step, y, z) && inside(x, y + step, z) && inside(x, y - step, z) && inside(x, y, z + step) && inside(x, y, z - step)) continue;
        const t = (y - minY) / Math.max(.01, maxY - minY), s = size * (.9 + rr() * .16);
        color.set(palette[Math.floor(rr() * palette.length)]);
        const k = (.80 + .40 * t) * shade * (.95 + rr() * .1);
        count++;
        b.block(x + (rr() - .5) * .1, y + (rr() - .5) * .1, z + (rr() - .5) * .1, s, s * (.92 + rr() * .1), s, '#' + color.clone().multiplyScalar(k).getHexString(), 0, chunk);
      }
      return count;
    }
    const treePalettes = [
      ['#3f7f35', '#4e9140', '#5ba043', '#47893a'],
      ['#58a03e', '#68b046', '#79bb4d', '#5fa844'],
      ['#e48faf', '#ef9fbb', '#d97d9f', '#f4b0c8'],
      ['#a9c043', '#bdce52', '#94b23c', '#cbd965'],
    ];
    let accentCount = 0;
    function tree(height, tint = 0) {
      const g = new T.Group(), trunk = batch(), crown = trunk, k = height / 6.5, rr = mk(1000 + treeInfo.length * 37 + Math.floor(height * 100));
      // Thick, flared trunk with roots and two branches into the canopy.
      trunk.block(0, .22, 0, 1.55, .5, 1.5, '#7b4f33', rr() * .5, soft);
      trunk.block(0, 1.55, 0, 1.08, 3.0, 1.04, '#8c5a38', 0, soft);
      trunk.block(.1, 2.9, 0, .92, 1.6, .9, '#80532f', .2, soft);
      for (const [x, z, a] of [[.62, .35, .5], [-.55, .5, -.4], [.1, -.7, .2]]) trunk.block(x, .3, z, .66, .58, .6, '#9b6540', a, soft);
      for (const s of [-1, 1]) {
        trunk.block(s * .66, 3.0, .05, .52, 1.4, .5, '#9a6640', s * .2, soft);
        trunk.block(s * 1.08, 3.55, .08, .72, .48, .5, '#a8714a', s * .15, soft);
      }
      trunk.block(-.46, 1.7, .52, .1, 2.2, .34, '#6e4429', .1, soft); trunk.block(.4, 1.3, .5, .1, 1.7, .3, '#6e4429', -.1, soft);
      let pal = treePalettes[tint === 0 ? 0 : tint === 1 ? 1 : (accentCount++ % 2 ? 3 : 2)];
      const cy = 4.55, lobes = [[0, cy, 0, 2.55, 1.75, 2.55], [1.45, cy - .45, .55, 1.65, 1.2, 1.6], [-1.5, cy - .35, -.6, 1.6, 1.25, 1.55], [.1, cy + 1.05, -.35, 1.65, 1.1, 1.6], [-.4, cy - .2, 1.55, 1.5, 1.05, 1.3]];
      voxelBlob(crown, lobes, LOW_POWER ? 1.0 : .8, LOW_POWER ? 1.14 : .9, pal, rr);
      // a few small fuzzy blocks on the surface keep the silhouette from looking like one polished ball
      for (let i = 0; i < (LOW_POWER ? 6 : 12); i++) { const a = rr() * Math.PI * 2, e = rr() * 1.1 - .3, rad = 2.5 + rr() * .5; color.set(pal[i % pal.length]); crown.block(Math.cos(a) * rad * Math.cos(e) * .9, cy + Math.sin(e) * 1.8, Math.sin(a) * rad * Math.cos(e) * .9, .5, .5, .5, '#' + color.getHexString(), a, chunk); }
      g.add(trunk.mesh()); g.scale.setScalar(k); return g;
    }
    // A spherical promenade continues past the lighthouse to the far side.
    const routePoints=[];
    for(let i=0;i<=72;i++) {
      const t=i/72,angle=-.244+t*2.73,x=(Math.sin(t*Math.PI*4)*1.25 + Math.sin(t*Math.PI)*1.5);
      routePoints.push(new T.Vector3(x,SURF*Math.cos(angle),-SURF*Math.sin(angle)).normalize());
    }
    const answerDirs = [routePoints[28].clone(),routePoints[47].clone(),routePoints[69].clone()];
    // ---- Round 4 visual dirt road --------------------------------------------------------------
    // The road starts in the near field in front of the camera, detours around the stone platform and the
    // grandma's picnic area (never crossing them) and then rejoins the real route toward the lighthouse.
    // Gameplay still uses routePoints (answers, tests); only the drawn road is detoured.
    const gn=d=>[d.x/d.y*SURF,d.z/d.y*SURF];
    const sstep=(v,a,b)=>{const k=Math.max(0,Math.min(1,(v-a)/(b-a)));return k*k*(3-2*k);};
    const SIDE=1,DETOUR_X=SIDE*4.7;
    const roadCtl=[];
    for(let k=0;k<=16;k++){const z=11.6-k*(11.6-4.0)/16,u=Math.min(1,(z-4)/2.4);roadCtl.push(local(Math.sin((z-4)*.55)*1.3*u+.5*u,z));}
    routePoints.forEach((d,i)=>{
      if(i===0)return;
      if(d.y>.3){const [x,z]=gn(d),w=sstep(z,6.8,3.0)*sstep(z,-8.6,-4.6);roadCtl.push(w>0?local(x+w*(DETOUR_X-x),z):d.clone());}
      else roadCtl.push(d.clone());
    });
    const trailPts=[roadCtl[0].clone()];
    for(let i=1;i<roadCtl.length;i++){const a=roadCtl[i-1],b=roadCtl[i],n=Math.max(1,Math.ceil(arc(a,b)/.5));for(let k=1;k<=n;k++)trailPts.push(a.clone().lerp(b,k/n).normalize());}
    // paver rows: one row every ~0.66 m along the road (trailPts stay dense for spacing checks)
    const paveRows=[trailPts[0]];for(const d of trailPts)if(arc(d,paveRows[paveRows.length-1])>=.66)paveRows.push(d);void paveRows;
    const inStageZone=d=>{if(d.y<.3)return false;const [x,z]=gn(d);return Math.abs(x)<3.05&&z>-5.1&&z<2.7;};
    const trail=batch(),edges=batch(),pebbles=batch();
    const pathAvoid=d=>obstacles.some(o=>o.kind!=='tree' && arc(d,o.dir)<o.r+.1)||inStageZone(d);
    const placeMatrix=new T.Object3D();
    function groundBlock(b,d,sx,sy,sz,tint,forward,offset=.035) {
      place(placeMatrix,d,forward||STAGE.front,offset);placeMatrix.scale.set(sx,sy,sz);placeMatrix.updateMatrix();b.add(box,placeMatrix.matrix,tint);placeMatrix.scale.set(1,1,1);
    }
    const roadRng=mk(555);
    // Round 5 road: paint the terrain voxels themselves in brick tones (top faces take the instance colour, sides stay
    // soil), so the road follows every terrain step exactly - a continuous voxel brick road like the concept art.
    {
      const brick=['#dcc0a0','#d2b393','#e4caaa','#d8ba98'].map(h=>new T.Color(h).convertSRGBToLinear()),cv=new T.Vector3();
      const cosHalf=Math.cos(1.05/SURF);
      cells.forEach(([x,y,z],i)=>{
        cv.set(x,y,z).normalize();if(inStageZone(cv))return;
        let near=false;for(const t of trailPts)if(t.dot(cv)>cosHalf){near=true;break;}
        if(!near)return;
        const h=Math.abs(Math.sin(x*12.99+y*78.23+z*37.72)*43758.5)%1;planet.setColorAt(i,brick[Math.floor(h*4)]);
      });
      planet.instanceColor.needsUpdate=true;
    }
    for(let i=0;i<trailPts.length-1;i+=1) {
      const d=trailPts[i],forward=tangent(trailPts[Math.min(trailPts.length-1,i+2)].clone().sub(d),d),right=new T.Vector3().crossVectors(forward,d).normalize();
      if(i%7===3){const s=roadRng()<.5?-1:1,dd=c.moveAlong(d,right,s*1.5).normalize();if(!pathAvoid(dd))groundBlock(pebbles,dd,.18+roadRng()*.08,.1,.16+roadRng()*.08,['#c9b999','#b8a58a'][i%2],forward,.07);}
    }
    const trailMesh=trail.mesh();trailMesh.name='round3-winding-path';trailMesh.castShadow=false;root.add(trailMesh,edges.mesh(),pebbles.mesh());
    // Little blue-roofed cottage (Round 4: chunkier, rounder, more detail). Doorway stays ~2 m high.
    {
      const g=new T.Group(),walls=batch(),roof=batch(),trim=batch(),stone=batch(),glow=batch(),deco=batch(),rr=mk(4242);
      // stone plinth + plaster walls with timber frame
      for(let i=0;i<9;i++)stone.block(-1.7+i*.425,.2,1.3+(i%2)*.04,.44,.4,.3,['#b9a58b','#a8957c','#c7b496'][i%3],0,soft);
      stone.block(0,.18,0,3.75,.36,2.75,'#a9957b',0,soft);
      walls.block(0,1.62,0,3.3,2.9,2.45,'#f4d3aa',0,soft);
      for(const x of [-1.62,1.62])trim.block(x,1.62,1.2,.28,2.9,.28,'#8a5532',0,chunk);
      for(const x of [-1.62,1.62])trim.block(x,1.62,-1.2,.28,2.9,.28,'#8a5532',0,chunk);
      trim.block(0,3.05,1.22,3.5,.3,.3,'#8a5532',0,chunk);trim.block(0,.42,1.23,3.4,.18,.2,'#8a5532',0,chunk);
      trim.block(1.05,2.1,1.22,.18,1.6,.14,'#8a5532',0,chunk);
      // two-slope blue roof, each layer split into shingle blocks along the ridge with colour variation
      const blues=['#3b62a8','#4a76bb','#33579a','#5683c4','#40689f'];
      for(let layer=0;layer<6;layer++){
        const half=2.02-layer*.32,y=3.12+layer*.27;
        for(let s=0;s<6;s++){
          const z=-1.4+s*.56;
          roof.block(-half+.27,y,z,.78,.33,.55,blues[(layer*2+s)%5],0,chunk);
          roof.block(half-.27,y,z,.78,.33,.55,blues[(layer*3+s+1)%5],0,chunk);
        }
        trim.block(-half+.27,y-.02,1.63,.78,.3,.14,'#b27a45',0,chunk);trim.block(half-.27,y-.02,1.63,.78,.3,.14,'#c58a50',0,chunk);
      }
      trim.block(0,4.74,0,.62,.26,3.3,'#2f4f86',0,chunk);
      // stone chimney
      stone.block(.95,4.1,-.7,.74,1.5,.74,'#b6603f',0,soft);stone.block(.95,4.95,-.7,.95,.25,.95,'#8a4a35',0,chunk);
      deco.block(.95,5.35,-.7,.5,.34,.5,'#fff3ea',0,chunk);deco.block(1.1,5.78,-.6,.62,.4,.6,'#fde9e2',0,chunk);
      // arched door, round attic window, side windows with flower boxes
      trim.block(-.43,1.2,1.25,1.12,2.1,.16,'#6f4429',0,chunk);trim.block(-.43,2.28,1.25,.9,.28,.16,'#6f4429',0,chunk);
      trim.block(-.43,1.2,1.34,.86,1.92,.12,'#b57a3f',0,chunk);trim.block(-.43,2.12,1.34,.62,.3,.12,'#b57a3f',0,chunk);
      for(let i=0;i<3;i++)trim.block(-.7+i*.27,1.15,1.42,.04,1.7,.02,'#855630');
      deco.block(-.12,1.1,1.47,.1,.1,.08,'#f4cf6c',0,chunk);
      for(const x of [1.06,-1.2]){
        trim.block(x,2.0,1.25,.78,.9,.2,'#7a4d2b',0,chunk);glow.block(x,2.0,1.36,.58,.7,.08,'#ffe29a',0,chunk);
        trim.block(x,2.0,1.4,.06,.74,.05,'#7a4d2b');trim.block(x,2.0,1.4,.62,.05,.05,'#7a4d2b');
        deco.block(x,1.5,1.52,.82,.2,.3,'#8a5532',0,chunk);
        for(let k=0;k<4;k++)deco.block(x-.28+k*.19,1.66,1.53,.18,.2,.18,['#ef6a8a','#ffd35a','#c076e0','#ff8f4a'][k],0,chunk);
      }
      trim.block(0,3.95,1.22,.66,.66,.2,'#7a4d2b',0,chunk);glow.block(0,3.95,1.32,.46,.46,.08,'#ffe29a',0,chunk);
      // steps, lantern, barrel, bushes at the door
      for(let i=0;i<3;i++)stone.block(-.43,.08+i*.1,1.58+(2-i)*.2,1.3-i*.12,.16,.4,['#c5b394','#b3a085','#cdbb9d'][i],0,soft);
      deco.block(.58,1.6,1.4,.14,.48,.14,'#5a4a3a');glow.block(.58,1.95,1.4,.26,.3,.26,'#ffd36a',0,chunk);
      deco.block(1.95,.5,.9,.7,.95,.7,'#a8693b',.3,chunk);deco.block(1.95,.99,.9,.74,.1,.74,'#6f4429',.3,chunk);
      deco.block(-1.95,.35,1.0,.62,.7,.62,'#c58a50',.2,chunk);
      for(const [x,z,s] of [[-1.35,1.5,.7],[1.5,1.5,.85]])voxelBlob(deco,[[x,.5*s+.1,z,.7*s,.55*s,.7*s]],.4*s+.05,.46*s+.05,['#4c9a3e','#5eab46','#6fba50'],rr);
      const m=glow.mesh(new T.MeshStandardMaterial({vertexColors:true,emissive:'#ffb85a',emissiveIntensity:.55,roughness:.5}));
      g.add(walls.mesh(),roof.mesh(),trim.mesh(),stone.mesh(),deco.mesh(),m);g.name='round3-blue-cottage';
      const d=local(-4.9,-5.5);register(g,d,2.4,'house');landmarks.house={dir:d,radius:2.4,doorHeight:2.0,object:g};
    }
    // Tall red/white lighthouse (Round 4: octagonal bands, balcony railing, dark cap, glowing lantern).
    {
      const g=new T.Group(),tower=batch(),trim=batch(),glass=batch(),cap=batch();
      for(let i=0;i<8;i++){const a=i*Math.PI/4;tower.block(Math.cos(a)*1.0,.18,Math.sin(a)*1.0,.9,.36,.9,['#b9a58b','#a8957c'][i%2],a,soft);}
      tower.block(0,.2,0,2.35,.4,2.35,'#b09b80',0,soft);tower.block(0,.2,0,2.35,.4,2.35,'#b09b80',Math.PI/4,soft);
      for(let i=0;i<7;i++){
        const w=1.78-i*.075,col=i%2?'#d9463a':'#fff0dc',y=.92+i*.9;
        tower.block(0,y,0,w,.93,w,col,0,soft);tower.block(0,y,0,w,.93,w,col,Math.PI/4,soft);
      }
      trim.block(0,1.1,.78,.5,.78,.2,'#7a4d2b',0,chunk);trim.block(0,.9,.83,.4,.55,.1,'#b57a3f',0,chunk);
      for(let i=0;i<3;i++){const y=2.5+i*1.8;trim.block(.1,y,.74-i*.04,.34,.5,.1,'#50566a',0,chunk);trim.block(.1,y,.79-i*.04,.22,.38,.06,'#ffe29a',0,chunk);}
      // gallery
      trim.block(0,7.05,0,2.55,.3,2.55,'#8a5532',0,chunk);trim.block(0,7.05,0,2.55,.3,2.55,'#8a5532',Math.PI/4,chunk);
      for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;trim.block(Math.cos(a)*1.2,7.55,Math.sin(a)*1.2,.12,.6,.12,'#5a4636',0,chunk);}
      for(const [x,z,sx,sz] of [[0,1.2,2.2,.1],[0,-1.2,2.2,.1],[1.2,0,.1,2.2],[-1.2,0,.1,2.2]])trim.block(x,7.82,z,sx,.1,sz,'#5a4636',0,chunk);
      // lantern room
      glass.block(0,8.2,0,1.45,1.1,1.45,'#ffe48c',0,chunk);
      for(const x of [-.78,.78])for(const z of [-.78,.78])trim.block(x,8.2,z,.16,1.25,.16,'#7a4d2b',0,chunk);
      cap.block(0,8.92,0,2.0,.32,2.0,'#3f4a6e',0,chunk);cap.block(0,9.2,0,1.5,.3,1.5,'#4a5880',0,chunk);cap.block(0,9.46,0,1.0,.28,1.0,'#3f4a6e',0,chunk);cap.block(0,9.8,0,.22,.42,.22,'#caa25a',0,chunk);
      g.add(tower.mesh(),trim.mesh(),cap.mesh(),glass.mesh(new T.MeshStandardMaterial({vertexColors:true,emissive:'#ffb347',emissiveIntensity:.85,roughness:.4})));
      g.scale.setScalar(.92);
      g.name='round3-lighthouse';const d=local(.8,-12.5);register(g,d,1.75,'lighthouse');landmarks.lighthouse={dir:d,radius:1.75,height:9.0,object:g};
    }
    // Pond follows a shallow, curved basin. Decorative shore and collision agree.
    const pond=new T.Group(),pd=local(-2.9,4.4);place(pond,pd,STAGE.front,.06);pond.scale.setScalar(2.1/2.35);root.add(pond);
    obstacles.push({dir:pd,r:2.1,kind:'pond',obj:pond});landmarks.pond={dir:pd,radius:2.1,object:pond};
    // Excavate the old voxel shell under the water. Navigation still treats the
    // entire shore as solid, so this visual basin never becomes walkable.
    const basinMatrix=new T.Matrix4(),basinPoint=new T.Vector3();
    cells.forEach(([x,y,z],i)=>{basinPoint.set(x,y,z);if(arc(basinPoint.clone().normalize(),pd)<1.85){basinPoint.addScaledVector(pd,-3.0);basinMatrix.makeTranslation(basinPoint.x,basinPoint.y,basinPoint.z);planet.setMatrixAt(i,basinMatrix);}});
    planet.instanceMatrix.needsUpdate=true;
    const shore=new T.Mesh(new T.CylinderGeometry(2.4,2.25,.24,32),new T.MeshStandardMaterial({color:'#c98f5e',roughness:1}));shore.position.y=.03;shore.receiveShadow=true;pond.add(shore);
    const waterMat=new T.MeshStandardMaterial({color:'#3b97e0',transparent:true,opacity:.9,roughness:.2,metalness:.05});
    const water=new T.Mesh(new T.CircleGeometry(2.15,40),waterMat);water.rotation.x=-Math.PI/2;water.position.y=.18;pond.add(water);
    const stones=batch();
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;stones.block(Math.cos(a)*2.25,.15,Math.sin(a)*2.25,.35+rng()*.16,.25+rng()*.17,.43,['#b9774c','#cf8d5d','#a9663f'][i%3],a,soft);}
    pond.add(stones.mesh());
    const ripples=[];
    for(let i=0;i<5;i++) {const m=new T.Mesh(new T.RingGeometry(.21,.23,24),new T.MeshBasicMaterial({color:'#e3f8ef',transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set((rng()-.5)*2.7,.195,(rng()-.5)*2.7);pond.add(m);ripples.push(m);}
    for(let i=0;i<4;i++) {const m=new T.Mesh(new T.CircleGeometry(.25,12,0,Math.PI*1.85),new T.MeshStandardMaterial({color:'#85a854',side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.rotation.z=i;m.position.set(-1.2+i*.6,.20,.85+Math.sin(i)*.3);pond.add(m);}
    const ducks=[];
    for(let i=0;i<2;i++){const b=batch(),g=new T.Group();b.block(0,.15,0,.28,.25,.43,'#f9e8bd');b.block(0,.36,.17,.22,.24,.22,'#fff0cc');b.block(0,.32,.33,.19,.075,.17,'#e8a544');for(const s of [-1,1])b.block(s*.115,.39,.23,.025,.035,.035,'#4c433c');g.add(b.mesh());pond.add(g);ducks.push(g);}
    const skyStars=new Float32Array(100*3);for(let i=0;i<100;i++){skyStars[i*3]=(rng()-.5)*240;skyStars[i*3+1]=-10-rng()*130;skyStars[i*3+2]=-280;}
    const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(skyStars,3));skyGroup.add(new T.Points(sg,new T.PointsMaterial({color:'#fff1d6',size:1.6,sizeAttenuation:false,transparent:true,opacity:.65,depthWrite:false})));
    // =====================================================================================================
    // Round 4 placement system: seeded Poisson-style dart throwing over the WHOLE sphere with per-type radii.
    // Buildings are spaced further apart than trees, trees further than bushes/flowers; corridors stay open
    // along the road, around the stone platform / grandma, the start point and the answer crystals.
    // =====================================================================================================
    const placed=[];                                  // {dir,r,kind}
    const kindOf=o=>o.kind==='house'||o.kind==='lighthouse'?'building':o.kind==='tree'||o.kind==='apple-tree'?'tree':o.kind==='pond'?'pond':'other';
    obstacles.forEach(o=>placed.push({dir:o.dir,r:o.r,kind:kindOf(o)}));
    answerDirs.forEach(d=>placed.push({dir:d,r:1.2,kind:'crystal'}));
    const MIN={ // center-to-center minimum distance (metres) between object kinds
      tree:{tree:5.4,building:6.6,pond:5.0,crystal:4.4,bush:3.0,mush:2.6,flower:1.7,other:3.2},
      bush:{tree:3.0,building:4.0,pond:3.4,crystal:3.0,bush:2.5,mush:2.2,flower:1.4,other:2.2},
      mush:{tree:2.6,building:3.6,pond:3.0,crystal:3.0,bush:2.2,mush:3.2,flower:1.4,other:2.0},
      flower:{tree:1.7,building:3.0,pond:2.7,crystal:2.4,bush:1.4,mush:1.4,flower:1.8,other:1.5},
      rock:{tree:2.0,building:3.0,pond:2.8,crystal:2.4,bush:1.6,mush:1.6,flower:1.2,other:1.5},
    };
    function fits(d,kind,r,corridor=0,opt={}) {
      if(opt.nearOk!==true){if(arc(d,STAGE.center)<(opt.stage||(kind==='tree'?6.0:4.4)))return false;if(arc(d,START_DIR)<(kind==='tree'?3.6:2.4))return false;}
      for(const p of placed){const need=Math.max(r+p.r+.3,(MIN[kind]&&MIN[kind][p.kind])||0);if(arc(d,p.dir)<need)return false;}
      if(corridor)for(const t of trailPts)if(arc(d,t)<corridor)return false;
      return true;
    }
    const randDir=rr=>{for(;;){const v=new T.Vector3(rr()*2-1,rr()*2-1,rr()*2-1),l=v.length();if(l>.1&&l<1)return v.divideScalar(l);}};
    const placeRng=mk(90210);
    const tallestCount=LOW_POWER?30:38;
    // 1) hand-placed framing trees first (kept only where spacing/corridor rules allow), then fill the sphere
    const treeSeeds=[[-10.6,5.2,6.9,0],[9.6,5.6,6.3,1],[-8,-1.8,6.4,0],[7.8,-4.4,6.4,0],[-7.4,-9.8,7,1],[-3,-17.7,5.5,0],[8.3,-14.3,6.1,1],[-12.5,9,5.6,1],[13.2,.5,6.3,0],[-13,-8,6.5,2],[12,-12,5.9,0],[-4.8,-20,5.5,1],[12,-23,6.1,0]];
    function addTree(d,h,tint){const g=tree(h,tint);g.name='round3-tree';register(g,d,.66*h/6.5,'tree');treeInfo.push({dir:d,height:h});placed.push({dir:d,r:.66*h/6.5,kind:'tree'});}
    for(const [x,z,h,tint] of treeSeeds){const d=local(x,z);if(clearsLesson(d,1.2)&&fits(d,'tree',.7,2.7,{stage:5.6}))addTree(d,h,tint);}
    for(let tries=0;treeInfo.length<tallestCount&&tries<9000;tries++){
      const d=randDir(placeRng);if(!clearsLesson(d,1.2)||!fits(d,'tree',.7,2.7))continue;
      const roll=placeRng();addTree(d,5.0+placeRng()*2.0,roll<.6?0:roll<.82?1:2);
    }
    // 2) small stuff. Everything goes into spatial chunks (one merged mesh per chunk) so that
    //    frustum + horizon culling can drop whole regions of the far side of the planet.
    const K=18,anchors=[];for(let i=0;i<K;i++){const y=1-2*(i+.5)/K,rad=Math.sqrt(1-y*y),a=i*2.399963;anchors.push(new T.Vector3(Math.cos(a)*rad,y,Math.sin(a)*rad));}
    const chunks=anchors.map(a=>({center:a,b:batch()}));
    const chunkOf=d=>{let best=0,bd=-2;for(let i=0;i<K;i++){const v=anchors[i].dot(d);if(v>bd){bd=v;best=i;}}return chunks[best];};
    const templates={};
    function emit(sb,d,forward,lift=.02,tint='#ffffff',key=null) {
      let geo=key&&templates[key];
      if(!geo){const m=sb();geo=m.geometry;if(key)templates[key]=geo;}
      place(placeMatrix,d,forward,lift);placeMatrix.updateMatrix();chunkOf(d).b.add(geo,placeMatrix.matrix,tint);
      if(!key)geo.dispose();
    }
    const fRng=mk(31337),flowerPals=[['#ef6a3c','#ff9a4a'],['#ef7f9f','#fbb4c8'],['#a05ad8','#c58be0'],['#ffd35a','#fff0dc'],['#e8546d','#ff8f9c'],['#7aa8f0','#bcd6ff']];
    function bigFlower(b,x,z,h,c0,c1,sz=1){
      b.block(x,h*.5,z,.07*sz,h,.07*sz,'#4f8f3a',0,cube);b.block(x+.14*sz,h*.38,z,.34*sz,.1*sz,.17*sz,'#5aa141',.5,cube);
      for(let k=0;k<5;k++){const a=k/5*Math.PI*2;b.block(x+Math.cos(a)*.2*sz,h,z+Math.sin(a)*.2*sz,.3*sz,.12*sz,.24*sz,k%2?c0:c1,-a,cube);}
      b.block(x,h+.05*sz,z,.2*sz,.16*sz,.2*sz,'#f4b82e',0,cube);
    }
    function mushroom(b,s,cap,spot='#fff1dc'){
      b.block(0,.55*s,0,.46*s,1.1*s,.46*s,'#f3e1bd',0,chunk);b.block(0,.12*s,0,.66*s,.26*s,.66*s,'#e5cd9f',0,chunk);
      b.block(0,1.12*s,0,1.55*s,.38*s,1.5*s,cap,0,chunk);b.block(0,1.42*s,0,1.22*s,.34*s,1.18*s,cap,0,chunk);b.block(0,1.68*s,0,.78*s,.25*s,.76*s,cap,0,chunk);
      for(const [x,y,z,r] of [[.5,1.3,.34,.2],[-.46,1.32,.18,.18],[.05,1.68,.3,.17],[-.2,1.18,-.64,.19],[.38,1.2,-.5,.15],[-.05,1.86,-.05,.2]])b.block(x*s,y*s,z*s,r*2*s,r*s,r*2*s,spot,0,soft);
    }
    const capColors=['#e5473d','#5f93e0','#f0a13a','#e5473d','#c276d8'];
    // big flower patches
    const patches=[],nPatch=LOW_POWER?34:55;
    for(let tries=0,n=0;n<nPatch&&tries<9000;tries++){
      const d=randDir(fRng);if(!fits(d,'flower',.6,1.55,{stage:5.2}))continue;
      const b=batch(),k=2+(n%3),pal=flowerPals[n%flowerPals.length];
      for(let j=0;j<k;j++)bigFlower(b,(j-(k-1)/2)*.42+(fRng()-.5)*.12,(fRng()-.5)*.5,.32+fRng()*.34,pal[0],pal[1],.85+fRng()*.5);
      emit(()=>b.mesh(),d,tangent(randDir(fRng),d),.02);placed.push({dir:d,r:.6,kind:'flower'});patches.push(d);n++;
    }
    // mushrooms (single or pair), bigger than the old ones but spaced out
    let nMush=0;const mushTarget=LOW_POWER?7:9;
    for(let tries=0;nMush<mushTarget&&tries<6000;tries++){
      const d=randDir(fRng);if(!fits(d,'mush',.6,2.2))continue;
      const b=batch(),s=.8+fRng()*.45;mushroom(b,s,capColors[nMush%5]);
      emit(()=>b.mesh(),d,tangent(randDir(fRng),d),0);placed.push({dir:d,r:.7,kind:'mush'});obstacles.push({dir:d,r:.55,kind:'mushroom'});nMush++;
    }
    // round bushes (all rounded-cube clusters) - spacing from trees keeps canopy and bush from stacking
    let nBush=0;const bushTarget=LOW_POWER?14:20;
    for(let tries=0;nBush<bushTarget&&tries<6000;tries++){
      const d=randDir(fRng);if(!fits(d,'bush',.9,2.1))continue;
      const b=batch(),s=.7+fRng()*.5,rrb=mk(300+nBush);
      voxelBlob(b,[[0,.75*s,0,1.15*s,.85*s,1.15*s],[.5*s,.55*s,.3*s,.8*s,.6*s,.8*s]],(LOW_POWER?.95:.62)*s,(LOW_POWER?1.08:.7)*s,nBush%7===5?['#e48faf','#ef9fbb','#d97d9f']:['#4c9a3e','#5eab46','#6fba50','#3f8736'],rrb,1.05);
      emit(()=>b.mesh(),d,tangent(randDir(fRng),d),0);placed.push({dir:d,r:.9,kind:'bush'});obstacles.push({dir:d,r:.8*s,kind:'bush'});nBush++;
    }
    // rocks
    for(let tries=0,n=0;n<(LOW_POWER?14:22)&&tries<4000;tries++){
      const d=randDir(fRng);if(!fits(d,'rock',.6,1.6))continue;
      const b=batch();b.block(0,.2,0,.7+fRng()*.5,.4+fRng()*.3,.6+fRng()*.5,['#b8a58a','#a8a68c','#c4b090'][n%3],fRng()*3,soft);
      emit(()=>b.mesh(),d,STAGE.front,.02);placed.push({dir:d,r:.5,kind:'rock'});obstacles.push({dir:d,r:.45,kind:'rock'});n++;
    }
    // near-field details for the spawn view: flowers, mushrooms and stones just in front of / beside the player,
    // always away from the road, the player and the platform
    const nearZone=d=>{if(d.y<.3)return false;const [x,z]=gn(d);return z>3.2&&z<13&&Math.abs(x)<9.5;};
    let nNear=0;
    for(let tries=0;nNear<(LOW_POWER?6:8)&&tries<4000;tries++){
      const d=local((fRng()-.5)*18,4.3+fRng()*8);if(!nearZone(d)||arc(d,START_DIR)<1.5||trailPts.some(t=>arc(d,t)<1.35)||placed.some(p=>arc(d,p.dir)<Math.max(p.r+.8,p.kind==='tree'?3.0:p.kind==='flower'?2.3:1.4)))continue;
      const b=batch(),k=2+(nNear%3),pal=flowerPals[(nNear*2+1)%flowerPals.length];
      for(let j=0;j<k;j++)bigFlower(b,(j-(k-1)/2)*.4+(fRng()-.5)*.14,(fRng()-.5)*.5,.3+fRng()*.34,pal[0],pal[1],.85+fRng()*.5);
      emit(()=>b.mesh(),d,STAGE.front,.02);placed.push({dir:d,r:.6,kind:'flower'});patches.push(d);nNear++;
    }
    // grass tufts everywhere (cheap 3-blade cubes) with extra density near the camera and along the road
    const tuftBatch=batch();for(let j=0;j<3;j++)tuftBatch.block((j-1)*.09,.12,0,.05,.24+(j===1?.07:0),.06,'#ffffff',j*.5,cube);
    const tuftGeo=tuftBatch.mesh().geometry;
    const tuftCols=['#6fb04a','#8cc654','#5a9c40','#a1cf5c'];
    const nTuft=LOW_POWER?320:650;let nT=0;
    for(let tries=0;nT<nTuft&&tries<nTuft*3;tries++){
      const d=randDir(fRng);if(arc(d,STAGE.center)<3.5)continue;
      if(placed.some(p=>p.kind!=='flower'&&p.kind!=='rock'&&arc(d,p.dir)<p.r*.8+.3))continue;
      if(trailPts.some(t=>arc(d,t)<1.0))continue;
      place(placeMatrix,d,tangent(randDir(fRng),d),.02);placeMatrix.scale.setScalar(.7+fRng()*.5);placeMatrix.updateMatrix();
      chunkOf(d).b.add(tuftGeo,placeMatrix.matrix,tuftCols[nT%4]);placeMatrix.scale.setScalar(1);nT++;
    }
    let nTn=0;
    for(let tries=0;nTn<(LOW_POWER?50:80)&&tries<2500;tries++){
      const d=local((fRng()-.5)*20,3.8+fRng()*9);if(!nearZone(d)||arc(d,START_DIR)<1.0||trailPts.some(t=>arc(d,t)<1.05)||placed.some(p=>p.kind!=='flower'&&arc(d,p.dir)<p.r*.8+.3))continue;
      place(placeMatrix,d,tangent(randDir(fRng),d),.02);placeMatrix.scale.setScalar(.7+fRng()*.5);placeMatrix.updateMatrix();
      chunkOf(d).b.add(tuftGeo,placeMatrix.matrix,tuftCols[nTn%4]);placeMatrix.scale.setScalar(1);nTn++;
    }
    const floraNear={value:new T.Vector2(9,12.5)},fadedMats=new Map();
    // near-camera dissolve: a copy of the material that dithers away fragments much closer to the camera than the player
    // inPlace patches the given material itself (props keep references to their materials for the occluder fade)
    function nearFade(mat,inPlace=false){
      if(fadedMats.has(mat))return fadedMats.get(mat);
      const m=inPlace?mat:mat.clone(),prev=mat.onBeforeCompile,prevKey=mat.customProgramCacheKey?mat.customProgramCacheKey.bind(mat):()=>'';
      m.onBeforeCompile=(sh,r)=>{
        if(prev)prev.call(m,sh,r);
        sh.uniforms.uNear=floraNear;
        sh.vertexShader='varying float vViewZ;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n  vViewZ=-mvPosition.z;');
        sh.fragmentShader='uniform vec2 uNear;varying float vViewZ;\n'+sh.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n  {float fk=smoothstep(uNear.x,uNear.y,vViewZ);if(fk<1.){float n=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);if(n>fk)discard;}}');
      };
      m.customProgramCacheKey=()=>prevKey()+'-round5-near-fade';
      m.needsUpdate=true;fadedMats.set(mat,m);return m;
    }
    const floraMat=nearFade(material);
    const floraMeshes=chunks.map(ch=>{const m=ch.b.mesh(floraMat);m.castShadow=false;m.name='round4-flora';root.add(m);return {mesh:m,center:ch.center};});
    // trees (round 3 forest + the orchard's apple trees and props) dissolve near the camera too, so walking past one never fills the frame
    const fadeTargets=[];scene.traverse(o=>{if(o.name==='round3-tree'||o.name==='a01-orchard')fadeTargets.push(o);});
    fadeTargets.forEach(g=>g.traverse(o=>{if(o.isMesh&&(o.material.isMeshStandardMaterial||o.material.isMeshLambertMaterial))nearFade(o.material,true);}));
    // chunk angular radius ~ sqrt(4*pi/K)/2 (+margin); used by the horizon cull in update()
    const CHUNK_RAD=Math.sqrt(4*Math.PI/K)*.62;
    // Debug / report helper: every placed object (dir,r,kind) so a map of the distribution can be drawn.
    const propMap=()=>placed.map(p=>[+p.dir.x.toFixed(3),+p.dir.y.toFixed(3),+p.dir.z.toFixed(3),p.kind,+p.r.toFixed(2)]);

    // 3) wandering animals: small blocky critters spread over the sphere (hidden/frozen when far from the camera)
    const fauna=[];
    function makeAnimal(kind){
      const b=batch(),P={rabbit:['#f1e2cc','#fff6e8','#e8a0a4'],fox:['#e5833a','#fff0d8','#3a2c2a'],squirrel:['#b97a4a','#f4dcc0','#6b4429'],hedgehog:['#8a6a52','#e9cfa8','#4a3a30'],deer:['#c98f58','#fff0d2','#6b4a32'],duck:['#fff4d6','#f0a840','#4a3d36']}[kind];
      const [m1,m2,m3]=P,s={rabbit:1,fox:1.15,squirrel:.9,hedgehog:.85,deer:1.5,duck:.8}[kind];
      b.block(0,.28*s,0,.34*s,.30*s,.5*s,m1,0,soft);                       // body
      b.block(0,.40*s,.30*s,.26*s,.26*s,.26*s,m1,0,soft);                   // head
      b.block(0,.34*s,.45*s,.14*s,.1*s,.1*s,m2,0,soft);                     // muzzle
      b.block(-.05*s,.42*s,.52*s,.035*s,.035*s,.02*s,m3,0,cube);b.block(.05*s,.42*s,.52*s,.035*s,.035*s,.02*s,m3,0,cube);
      if(kind==='rabbit'){for(const x of [-.07,.07])b.block(x*s,.64*s,.26*s,.07*s,.26*s,.08*s,m1,x*2,soft);b.block(0,.3*s,-.28*s,.14*s,.14*s,.14*s,m2,0,soft);}
      if(kind==='fox'){for(const x of [-.08,.08])b.block(x*s,.58*s,.28*s,.08*s,.14*s,.06*s,m1,0,soft);b.block(0,.3*s,-.5*s,.14*s,.14*s,.5*s,m1,0,soft);b.block(0,.3*s,-.74*s,.14*s,.14*s,.12*s,m2,0,soft);}
      if(kind==='squirrel'){b.block(0,.42*s,-.34*s,.18*s,.46*s,.18*s,m1,0,soft);b.block(0,.68*s,-.36*s,.2*s,.2*s,.2*s,m2,0,soft);for(const x of [-.07,.07])b.block(x*s,.58*s,.28*s,.05*s,.1*s,.05*s,m3,0,soft);}
      if(kind==='hedgehog'){b.block(0,.32*s,-.04*s,.42*s,.3*s,.5*s,m3,0,soft);b.block(0,.46*s,-.06*s,.34*s,.12*s,.4*s,m1,0,soft);}
      if(kind==='deer'){for(const x of [-.12,.12])for(const z of [-.2,.2])b.block(x*s,.1*s,z*s,.07*s,.3*s,.07*s,m3,0,soft);b.block(0,.58*s,.24*s,.16*s,.3*s,.16*s,m1,0,soft);for(const x of [-.07,.07])b.block(x*s,.92*s,.3*s,.04*s,.18*s,.04*s,m2,x*3,soft);}
      if(kind==='duck'){b.block(0,.28*s,0,.34*s,.26*s,.46*s,m1,0,soft);b.block(0,.46*s,.22*s,.2*s,.22*s,.2*s,m1,0,soft);b.block(0,.42*s,.36*s,.14*s,.06*s,.14*s,m2,0,soft);}
      const mesh=b.mesh();mesh.castShadow=false;const g=new T.Group();g.add(mesh);g.scale.setScalar(kind==='deer'?1.2:1.35);return g;
    }
    function spawnAnimal(kind,d){
      const g=makeAnimal(kind);root.add(g);place(g,d,tangent(randDir(placeRng),d),0);
      fauna.push({g,kind,dir:d.clone(),home:d.clone(),heading:tangent(randDir(placeRng),d),target:null,pause:placeRng()*3,shake:0,speed:.55+placeRng()*.25});
    }
    const animalKinds=['rabbit','fox','squirrel','hedgehog','deer','rabbit','squirrel','fox','hedgehog','duck'];
    const faunaTarget=LOW_POWER?12:20;
    for(let tries=0,n=0;n<faunaTarget&&tries<5000;tries++){
      const d=randDir(placeRng);
      if(arc(d,STAGE.center)<3.5||arc(d,START_DIR)<2.5||trailPts.some(t=>arc(d,t)<1.5))continue;
      if(placed.some(p=>arc(d,p.dir)<p.r+.7)||fauna.some(f=>arc(f.dir,d)<5))continue;
      const kind=n<3?['rabbit','deer','fox'][n]:animalKinds[n%animalKinds.length];
      spawnAnimal(kind,d);n++;
    }
    // butterflies drifting over flower patches (one merged mesh each, wings flap by scaling)
    const butterflies=[];
    for(let i=0;i<(LOW_POWER?8:14)&&patches.length;i++){
      const home=patches[Math.floor(placeRng()*patches.length)],bb=batch(),col=['#f2c86d','#edb1ce','#9ec8f0','#ffffff'][i%4];
      bb.block(-.07,0,0,.14,.015,.1,col,.4,soft);bb.block(.07,0,0,.14,.015,.1,col,-.4,soft);bb.block(0,0,0,.025,.03,.12,'#4a3d36',0,cube);
      const m=bb.mesh();m.castShadow=false;const g=new T.Group();g.add(m);g.scale.setScalar(1.6);root.add(g);butterflies.push({g,m,home,phase:i*1.7});
    }
    const faunaBlocked=d=>placed.some(p=>p.kind!=='flower'&&p.kind!=='rock'&&arc(d,p.dir)<p.r+.2);
    const tmpV=new T.Vector3(),camDir=new T.Vector3(),mv=new T.Vector3();
    function updateFauna(dt,time,playerDir) {
      for(const f of fauna){
        const near=arc(f.dir,playerDir)<26;f.g.visible=near&&f.dir.dot(camDir)>.1;if(!near)continue;
        if(f.shake>0){f.shake=Math.max(0,f.shake-dt);f.g.rotation.z=Math.sin(f.shake*26)*.28*Math.min(1,f.shake*2);}
        else f.g.rotation.z=0;
        f.pause-=dt;
        if(!f.target&&f.pause<=0&&f.shake<=0){for(let j=0;j<10;j++){const t=c.moveAlong(f.dir,tangent(randDir(placeRng),f.dir),.8+placeRng()*1.3).normalize();if(arc(t,f.home)<4&&!faunaBlocked(t)&&!trailPts.some(q=>arc(t,q)<.55)&&arc(t,STAGE.center)>3.2){f.target=t;break;}}f.pause=.4;}
        let lift=0;
        if(f.target){
          mv.copy(f.target).sub(f.dir);const h=tangent(mv,f.dir),next=c.moveAlong(f.dir,h,dt*f.speed).normalize();
          if(!faunaBlocked(next)&&Math.abs(surfaceRadius(next)-surfaceRadius(f.dir))<.45){f.dir.copy(next);f.heading.copy(h);lift=Math.abs(Math.sin(time*9+f.home.x*7))*.05;if(arc(f.dir,f.target)<.12){f.target=null;f.pause=1.5+placeRng()*3;}}
          else{f.target=null;f.pause=.4;}
        }
        place(f.g,f.dir,f.heading,lift);
        if(f.shake>0)f.g.rotation.z=Math.sin(f.shake*26)*.28*Math.min(1,f.shake*2);
      }
      for(const bf of butterflies){
        const near=arc(bf.home,playerDir)<26;bf.g.visible=near;if(!near)continue;
        const a=time*.7+bf.phase,off=c.moveAlong(bf.home,tangent(new T.Vector3(Math.cos(a),0.3,Math.sin(a)),bf.home),.7+.35*Math.sin(time*.4+bf.phase)).normalize();
        bf.g.position.copy(off).multiplyScalar(surfaceRadius(off)+.7+Math.sin(time*1.7+bf.phase)*.18);
        orient(bf.g,off,tangent(new T.Vector3(-Math.sin(a),0,Math.cos(a)),off));bf.m.scale.set(1,.4+Math.abs(Math.sin(time*11+bf.phase)),1);
      }
    }
    // --- child feedback effects (cheap pooled cubes): dust puffs / petals when running, sparkle burst, wrong-answer wobble
    const FX_N=LOW_POWER?16:26,fx=[];
    const fxBox=roundedBox(T,.2);
    for(let i=0;i<FX_N;i++){
      const m=new T.Mesh(fxBox,new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0,depthWrite:false,fog:false}));
      m.visible=false;m.castShadow=false;root.add(m);fx.push({m,life:0,max:1,vel:new T.Vector3(),spin:0,grow:0,base:.12,grav:0});
    }
    let fxIdx=0,fxTimer=0,lastFxPos=null;
    function spawnFx(pos,up,vel,color,size,life,grow=1.4,grav=0,opacity=.7){
      const p=fx[fxIdx++%FX_N];p.m.visible=true;p.life=p.max=life;p.m.material.color.set(color);p.m.material.opacity=opacity;p.base=size;p.grow=grow;p.grav=grav;
      p.m.position.copy(pos);p.vel.copy(vel);p.spin=(placeRng()-.5)*6;p.m.scale.setScalar(size);p.up=up;p.o=opacity;
    }
    function updateFx(dt,time,player,moving,speedFactor) {
      fxTimer-=dt;
      if(moving&&fxTimer<=0&&player){
        fxTimer=speedFactor>1.2?.09:.16;
        const up=player.dir,right=tangent(new T.Vector3().crossVectors(player.heading,up),up),pos=player.obj.position.clone().addScaledVector(up,.06).addScaledVector(player.heading,-.28);
        const nearFlower=patches.some(p=>arc(p,player.dir)<1.7);
        const col=nearFlower&&placeRng()<.7?['#ef7f9f','#ffd35a','#fbb4c8'][Math.floor(placeRng()*3)]:'#f4e3c6';
        spawnFx(pos.addScaledVector(right,(placeRng()-.5)*.3),up,up.clone().multiplyScalar(.5+placeRng()*.4).addScaledVector(player.heading,-.25).addScaledVector(right,(placeRng()-.5)*.6),col,nearFlower?.10:.16,.8,nearFlower?.4:1.6,nearFlower?-.6:0,nearFlower?1:.7);
      }
      for(const p of fx){
        if(!p.m.visible)continue;p.life-=dt;if(p.life<=0){p.m.visible=false;continue;}
        const k=p.life/p.max;p.m.position.addScaledVector(p.vel,dt);p.vel.addScaledVector(p.up||Y_UP,p.grav*dt);p.m.rotation.y+=p.spin*dt;p.m.rotation.x+=p.spin*.5*dt;
        p.m.scale.setScalar(p.base*(1+(1-k)*p.grow));p.m.material.opacity=p.o*k;
      }
    }
    const Y_UP=new T.Vector3(0,1,0);
    // star / sparkle burst at a world position (correct answer)
    function sparkleBurst(worldPos) {
      const up=worldPos.clone().normalize();
      for(let i=0;i<FX_N;i++){
        const a=i/FX_N*Math.PI*2,sideV=tangent(new T.Vector3(Math.cos(a),.2,Math.sin(a)),up).multiplyScalar(1.6+placeRng()*1.1).addScaledVector(up,1.0+placeRng()*1.4);
        spawnFx(worldPos,up,sideV,['#fff3b0','#ffd35a','#ffffff','#ffc4e1'][i%4],.26+placeRng()*.16,1.1+placeRng()*.4,.6,-1.2,1);
      }
    }
    // wrong answer: nearest animal shakes its head; a few grey puffs
    function wrongFeedback(worldPos) {
      const d=worldPos.clone().normalize();let best=null,bd=99;
      for(const f of fauna){const a=arc(f.dir,d);if(a<bd){bd=a;best=f;}}
      if(best&&bd<14){best.shake=1.1;best.target=null;}
      for(let i=0;i<6;i++)spawnFx(worldPos,d,d.clone().multiplyScalar(.5+placeRng()*.4).add(randDir(placeRng).multiplyScalar(.3)),'#cfc8dc',.12,.7,1.5,0,.5);
    }
    // horizon / distance culling of tall props (trees, buildings) and of flora chunks
    function cull() {
      camDir.copy(skyGroup.position);if(camDir.lengthSq()<1)return;const camLen=camDir.length();camDir.divideScalar(camLen);
      const horizon=Math.acos(Math.min(.98,SURF/camLen));
      const flatLimit=Math.cos(horizon+CHUNK_RAD),tallLimit=Math.cos(Math.min(2.9,horizon+1.0));
      for(const f of floraMeshes)f.mesh.visible=f.center.dot(camDir)>flatLimit;
      for(const g of scenery)g.visible=g.position.lengthSq()<1?true:g.position.clone().normalize().dot(camDir)>tallLimit;
    }
    const snapshot=()=>({version:'round3',radius:R,treeHeights:treeInfo.map(t=>t.height),routeLength:routePoints.slice(1).reduce((sum,d,i)=>sum+arc(routePoints[i],d),0),answers:answerDirs.map(d=>d.toArray()),landmarks:Object.fromEntries(Object.entries(landmarks).map(([k,v])=>[k,{position:v.dir.toArray(),radius:v.radius,height:v.height,doorHeight:v.doorHeight}]))});
    let cullTimer=0;
    function update(dt,time,state) {
      oldBirds.forEach((g,i)=>{const a=time*.045+i*.22;g.position.set(Math.cos(a)*23,R+12+i*.35,Math.sin(a)*23);});
      waterMat.opacity=.81+Math.sin(time*.9)*.025;
      ripples.forEach((m,i)=>{const k=(time*.18+i*.2)%1;m.scale.setScalar(.5+k*3);m.material.opacity=(1-k)*.28;});
      ducks.forEach((d,i)=>{const a=time*.18+i*Math.PI;d.position.set(Math.cos(a)*1.27,.19,Math.sin(a)*.88);d.rotation.y=-a+Math.PI/2;});
      skyPlanets.forEach((m,i)=>m.rotation.y+=dt*(.015+i*.003));
      window.YayaRound3Crystals?.tick(time,skyGroup.position);
      cullTimer-=dt;if(cullTimer<=0){cullTimer=.2;cull();}
      if(state){localSky.quaternion.slerp(skyQ.setFromUnitVectors(skyUp,state.dir),1-Math.exp(-Math.min(dt,.1)*3));}
      if(state&&state.obj){const pd=state.obj.position.distanceTo(skyGroup.position);floraNear.value.set(pd*.5,pd*.7);}
      if(state){updateFauna(dt,time,state.dir);updateFx(dt,time,state.moving?state:null,state.moving,state.speed||1);}
    }
    return {root,routePoints,trailPts,answerDirs,sparkleBurst,wrongFeedback,propMap,fauna,landmarks,pond,pd,ducks,trees:treeInfo,update,snapshot,complete(){habitat?.complete();},createCrystal:(label,color)=>createCrystal(T,label,color)};
  }
  function createCrystal(T, letter, tint='#b6a5e9') {
    const group=new T.Group(),body=new T.Group();group.add(body);
    const geo=new T.OctahedronGeometry(.72,0),material=new T.MeshStandardMaterial({color:tint,roughness:.30,metalness:.08,emissive:tint,emissiveIntensity:.23,transparent:true,opacity:.90});
    const gem=new T.Mesh(geo,material);gem.scale.set(.82,1.42,.72);body.add(gem);
    const edge=new T.LineSegments(new T.EdgesGeometry(geo),new T.LineBasicMaterial({color:'#f8eaff',transparent:true,opacity:.65}));edge.scale.copy(gem.scale);body.add(edge);
    const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 92px sans-serif';ctx.shadowColor='#fff3c6';ctx.shadowBlur=12;ctx.fillStyle='#fff9e8';ctx.fillText(letter.toUpperCase(),64,66);
    const label=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false}));label.position.y=.02;label.scale.set(.70,.70,1);group.add(label);
    return {group,body,material,label};
  }
  window.YayaRound3={create,createCrystal,roundedBox,makeGroundGeometry:(T)=>roundedBox(T,.035)};
})();
