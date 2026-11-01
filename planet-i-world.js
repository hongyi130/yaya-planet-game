/* I · 雪花玻璃球星球 (large world) — complete I adventure. NEW FILE (mirrors planet-t-world.js's interface so app.js can use it as the "round3" world of i01).
   Everything is procedural: the sphere is a stepped snow terrace, props are merged rounded-block meshes, the glass globe is one cheap fresnel shell,
   the snow is one Points object, the aurora is three additive ribbons. Loaded after round3-world.js / planet-i-art.js and before app.js. */
(() => {
  'use strict';
  const roundedBox = (T, b) => window.YayaRound3.roundedBox(T, b);
  function create(c) {
    const { THREE: T, scene, skyGroup, clouds, planet, cells, STAGE, obstacles, props, place, tangent, arc, surfaceRadius, rng, LOW_POWER, habitat, START_DIR, orient } = c;
    const A = window.YAYA_I_ART, L = A.LAYOUT, R = c.R || 16, SURF = R + .7, root = new T.Group(); root.name = 'i-large-world'; scene.add(root);
    const DEG = Math.PI / 180, V3 = T.Vector3;
    const P = (x, a) => { const l = x / SURF, f = a / SURF; return new V3(Math.sin(l), Math.cos(l) * Math.cos(f), -Math.cos(l) * Math.sin(f)).normalize(); };
    const XA = d => [SURF * Math.asin(Math.max(-1, Math.min(1, d.x))), SURF * Math.atan2(-d.z, d.y)];
    const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    const placeRng = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(20261028);
    const GLOBE_R = 24.5, BED_Y = -9.5, FLOOR_Y = BED_Y;   // round 2: the glass hugs the planet; the planet sinks into a snow bed (no stem)

    // ---- remove the superseded small-world props of the shared scene (same cleanup as planets S / T) -----------------------
    for (const p of props) {
      p.obj.visible = false;
      for (let i = obstacles.length - 1; i >= 0; i--) if (!obstacles[i].crystal && arc(obstacles[i].dir, p.dir) < .001) obstacles.splice(i, 1);
    }
    props.splice(0, props.length);
    if (habitat?.pond) habitat.pond.visible = false;
    for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].kind === 'pond') obstacles.splice(i, 1);
    habitat?.root.traverse(o => { if (o.isMesh && (o.material.wireframe || o.material.isShaderMaterial)) o.visible = false; });
    const oldMeadow = scene.getObjectByName('art-meadow-details'); if (oldMeadow) oldMeadow.visible = false;
    if (habitat) for (const ch of [...habitat.root.children]) {
      if (ch.isLineSegments || (ch.isMesh && ch.geometry.type === 'SphereGeometry' && Math.abs(ch.geometry.parameters.radius - 9.35) < .01)) ch.visible = false;
      else if (ch.isMesh && ch.geometry.type === 'IcosahedronGeometry' && Math.abs(ch.scale.x - .22) < .001) ch.visible = false;
      else if (ch.isGroup && Math.abs(ch.position.length() - 31) < 1.6) ch.visible = false;   // ring of tiny floating islands of the shared habitat
    }
    if (c.orchard && c.orchard.basket && c.orchard.basket.group) c.orchard.basket.group.visible = false;
    const oldBirds = (habitat?.root.children || []).filter(g => g.isGroup && g.children.length === 3 && Math.abs((g.children[0].scale.x || 0) - .09) < .001);
    oldBirds.forEach(g => g.visible = false);

    // ---- features (surface metres) -------------------------------------------------------------------------------------------
    const lakeD = P(L.lake.x, L.lake.a);
    const lakeMask = d => { const [x, a] = XA(d); if (d.y < .05) return 0; const u = (x - L.lake.x) / L.lake.rx, v = (a - L.lake.a) / L.lake.rz, ang = Math.atan2(v, u); return 1 - Math.hypot(u, v) / (1 + .14 * Math.sin(3 * ang + 1.2) + .07 * Math.sin(5 * ang)); };
    // the ice slide: one closed loop round the planet (a ring at polar angle th0 from the top pole, with a gentle wobble), like B1's ring road
    const slideAt = l => { const th = L.ring.th0 + .055 * Math.sin(3 * l + .6) + .03 * Math.sin(5 * l + 2.1); return new V3(Math.sin(th) * Math.cos(l), Math.cos(th), -Math.sin(th) * Math.sin(l)).normalize(); };
    const slide = (() => {
      const N = 2400, dense = [], cum = [0]; for (let i = 0; i <= N; i++) { dense.push(slideAt(-Math.PI + i / N * Math.PI * 2)); if (i) cum.push(cum[i - 1] + arc(dense[i - 1], dense[i])); }
      const len = cum[N], M = Math.round(len / .46), pts = []; let j = 0;
      for (let k = 0; k < M; k++) { const s = k / M * len; while (j < N - 1 && cum[j + 1] < s) j++; const t = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]); pts.push(dense[j].clone().lerp(dense[j + 1], t).normalize()); }
      return { pts, M, len };
    })();
    const slideDist = d => { let m = 99; for (let k = 0; k < slide.M; k += 2) { const a = arc(d, slide.pts[k]); if (a < m) m = a; } return m; };

    // R3: use the same flat voxel faces as R2 mobile on every device; no bevel facets or redundant terrain shadow pass.
    planet.geometry = new T.BoxGeometry(1,1,1); planet.castShadow = false;

    // ---- ground colours (vertex colours only, like planet S's cPale / cLav): warm white on the lit snow, pale lilac-blue in the lows and on the
    //      shaded lower half (darker the further down), a pale ice-blue band round the waist, brighter step rims ----------------------------
    const groundColor = new T.Color(), tmpC = new T.Color();
    const cWarm = new T.Color('#eef2fb'), cWarm2 = new T.Color('#e2e8f4'), cPaleB = new T.Color('#d9e4fa'), cLav = new T.Color('#a9a6d6'), cLavD = new T.Color('#8f8ac6'), cBand = new T.Color('#aee0f6'), cRim = new T.Color('#eef2fb');
    cells.forEach(([x, y, z], i) => {
      const d = Math.hypot(x, y, z), vv = new V3(x, y, z).normalize(), yN = vv.y;
      const lvl = Math.max(0, Math.min(1, (d - (R - 1.6)) / 2.1));          // 1 = outermost step
      const wide = Math.sin(x * .17 + y * .11) * Math.sin(z * .15 - y * .13) + .5 * Math.sin(x * .07 - z * .09 + 1.7);
      const big = Math.sin(x * .11 + z * .08 + 1.3) * Math.sin(y * .1 - x * .06 + .4) + .6 * Math.sin(z * .13 - y * .09 + 2.2);   // smooth, large patches (never per-cell)
      groundColor.copy(cWarm).lerp(cWarm2, smooth(-.3, .6, wide) * .8).lerp(cPaleB, smooth(.1, 1.0, big) * .6).lerp(cLav, smooth(.1, 1.0, -big) * .42 + (1 - lvl) * .2);
      groundColor.lerp(cRim, lvl * .25);                                     // step rims a touch brighter
      const low = smooth(.12, -.5, yN);                                      // 0 on the lit top half, 1 on the far lower half
      groundColor.lerp(cLav, Math.min(1, low * 1.2)).lerp(cLavD, smooth(-.2, -.7, yN) * .85).multiplyScalar(1 - .3 * smooth(-.05, -.65, yN));
      const bandK = smooth(.075, .0, Math.abs(yN + .30 + .015 * Math.sin(x * .9 + z * .7))); if (bandK > 0) groundColor.lerp(cBand, bandK * (.55 + .4 * Math.sin(x * 2.9 + z * 3.7 + y * 1.3)));   // pale ice-blue band round the waist
      groundColor.multiplyScalar(.985 + .02 * Math.sin(x * 7.1 + y * 3.9 + z * 5.3));
      if(arc(vv,START_DIR)<3.3) groundColor.lerp(new T.Color('#aebed6'),.56);
      planet.setColorAt(i, groundColor);
    }); planet.instanceColor.needsUpdate = true;
    // R3: bake only exposed faces of the existing cells. Positions and colours stay
    // identical; buried cube faces never enter either the colour or shadow pass.
    {
      const occupied=new Set(cells.map(v=>v.join(','))), cube=new T.BoxGeometry(1,1,1).toNonIndexed();
      const pp=cube.attributes.position, nn=cube.attributes.normal, pos=[],norm=[],colors=[],origins=[],locals=[];
      const color=new T.Color(),faceColor=new T.Color(),wall=new T.Color("#a9a6d6");
      cells.forEach((cell,i)=>{planet.getColorAt(i,color);
        if(slideDist(new V3(...cell).normalize())<6.9)return;
        for(let f=0;f<6;f++){
          const k=f*6,nx=nn.getX(k),ny=nn.getY(k),nz=nn.getZ(k);
          if(nx*cell[0]+ny*cell[1]+nz*cell[2]<=0 || occupied.has([cell[0]+nx,cell[1]+ny,cell[2]+nz].join(',')))continue;
          const radial=new V3(...cell).normalize(),top=nx*radial.x+ny*radial.y+nz*radial.z;faceColor.copy(color).lerp(wall,top>.67?.06:.62).multiplyScalar(top>.67?1:.90);
          for(let j=k;j<k+6;j++){const x=pp.getX(j),y=pp.getY(j),z=pp.getZ(j);pos.push(x+cell[0],y+cell[1],z+cell[2]);norm.push(nx,ny,nz);locals.push(x,y,z);origins.push(...cell);colors.push(faceColor.r,faceColor.g,faceColor.b);}
        }
      });
      const g=new T.BufferGeometry();for(const [name,values]of Object.entries({position:pos,normal:norm,color:colors,cellOrigin:origins,cellLocal:locals}))g.setAttribute(name,new T.Float32BufferAttribute(values,3));
      g.computeBoundingSphere();planet.geometry.dispose();planet.geometry=g;planet.count=1;planet.setMatrixAt(0,new T.Matrix4());planet.setColorAt(0,new T.Color('#ffffff'));planet.instanceMatrix.needsUpdate=true;planet.instanceColor.needsUpdate=true;planet.material.vertexColors=true;planet.frustumCulled=false;cube.dispose();
    }
    // Uniform colour across each square face: no radial strata clipping through a face.
    planet.material=new T.MeshLambertMaterial({vertexColors:true,emissive:'#b9c3e5',emissiveIntensity:.035});
    planet.material.onBeforeCompile=shader=>{
      shader.vertexShader='attribute vec3 cellOrigin;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=normalize(mix(objectNormal,normalize(cellOrigin),.82));');
    };
    planet.material.customProgramCacheKey=()=> 'i-square-snow-phase2';

    // ---- light, fog, sky -------------------------------------------------------------------------------------------------------
    scene.fog = new T.Fog('#bdc3df', 95, 280);
    scene.traverse(o => {
      if (o.isDirectionalLight) { o.color.set('#fff0df'); o.intensity *= .90; }
      else if (o.isHemisphereLight) { o.color.set('#dbe8ff'); o.groundColor.set('#a8a9d1'); o.intensity *= .90; }
    });
    const sky = skyGroup.children.find(o => o.isMesh && o.material.isShaderMaterial);
    if (sky) {
      sky.material.fragmentShader = `uniform float sunset; uniform float iNight; varying vec3 vDir;
        void main(){vec3 d=normalize(vDir);float h=d.y;
        vec3 horizon=vec3(.83,.75,.81),mid=vec3(.69,.66,.81),zenith=vec3(.40,.53,.75),low=vec3(.66,.65,.80);
        vec3 c=mix(horizon,mid,smoothstep(-.02,.10,h));c=mix(c,zenith,smoothstep(.08,.55,h));
        c=mix(c,low,smoothstep(.0,-.5,h));
        vec3 sd=normalize(vec3(.20,.06,-1.));float s=max(0.,dot(d,sd));
        c+=vec3(1.,.70,.50)*pow(s,14.)*.025+vec3(1.,.88,.66)*pow(s,70.)*.035+vec3(1.,.96,.84)*pow(s,700.)*.045;
        float band=sin(d.x*9.+h*13.)*sin(h*21.-d.x*5.);c+=band*.010;
        c=mix(c,c*vec3(.70,.60,.95)+vec3(.04,.0,.10),clamp(sunset,0.,1.)*.8);
        c=mix(c,mix(vec3(.085,.10,.24),vec3(.025,.04,.13),smoothstep(-.2,.8,h)),iNight);gl_FragColor=vec4(c,1.);}`;
      sky.material.uniforms.iNight={value:0};sky.material.needsUpdate = true;
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
    const cTop = new T.Color('#fffdfb'), cMid = new T.Color('#f6def0'), cLow = new T.Color('#b8a4dc'), cSun = new T.Color('#ffe0cc'), cTmp = new T.Color();
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
      g.computeBoundingSphere(); g.scale(.62, .62, .62); g.computeBoundingSphere();
      // Distant-cloud LOD keeps every original block and cloud position. At 150m+,
      // their bevels are subpixel; the near clouds retain the rounded geometry.
      const cb=new T.BoxGeometry(1,1,1).toNonIndexed(),lp=[],lc=[],cp=cb.attributes.position;
      cells.forEach(([x,y,z],ci)=>{for(let j=0;j<cp.count;j++){const cn=cb.attributes.normal;if(inside(x+cn.getX(j)*step,y+cn.getY(j)*step,z+cn.getZ(j)*step))continue;lp.push((x+cp.getX(j)*size)*.62,(y+cp.getY(j)*size)*.62,(z+cp.getZ(j)*size)*.62);const k=(ci*sp.count+Math.floor(j/6)*6)*3;lc.push(C[k],C[k+1],C[k+2]);}});
      const lite=new T.BufferGeometry();lite.setAttribute('position',new T.Float32BufferAttribute(lp,3));lite.setAttribute('color',new T.Float32BufferAttribute(lc,3));lite.computeBoundingSphere();g.userData.distantGeometry=lite;cb.dispose();return g;
    }
    function cloudMesh(rr) {
      // a handful of shapes shared by every cloud (cheap), each placed with its own scale / flip
      if (cloudShapes.length < 6) cloudShapes.push(cloudShape(rr));
      const m = new T.Mesh(cloudShapes[Math.floor(rr() * cloudShapes.length)], cloudMat); m.userData.fullCloudGeometry=m.geometry; m.castShadow = false; m.receiveShadow = false;
      if (rr() < .5) m.scale.x = -1;
      return m;
    }
    const cloudRng = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);
    for (let i = 0; i < (LOW_POWER ? 6 : 13); i++) {
      const cloud = cloudMesh(cloudRng), a = i / 13 * Math.PI * 2;
      cloud.position.set(Math.cos(a) * 54, 14 + i % 4 * 3.5, Math.sin(a) * 54);
      cloud.scale.setScalar(1.1 + i % 3 * .25); cloud.rotation.y = -a - Math.PI / 2; clouds.add(cloud);
      if(i<4){cloud.position.set([-30,-15,22,40][i],[16,24,22,10][i],[-56,-70,-64,-50][i]);cloud.rotation.y=0;cloud.scale.setScalar([1.6,1.2,1.4,1.4][i]);}
    }
    // Distant clouds: far, big, low on the horizon so both portrait and landscape get soft shapes.
    for(const [x,y,z,k] of [[-58,-52,-250,5.2],[62,-38,-270,4.8],[-6,-70,-240,6],[140,-30,-200,5],[-150,-34,-190,5]]) {
      const m=cloudMesh(cloudRng);m.name='round3-distant-cloud';m.position.set(x,y,z);m.scale.setScalar(k);skyGroup.add(m);
    }
    const skyPlanets = [];
    // Small distant planets with banded vertex colours (original geometry). [azimuth°, elevation°, radius, bands, ring]
    function bandedPlanet(r, bands, tilt = .4) {
      const g = new T.SphereGeometry(r, 8, 6), pos = g.attributes.position, col = [], c = new T.Color(), nrm = new T.Vector3();
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
      if (ring) { const rg = new T.Mesh(new T.TorusGeometry(r * 1.7, r * .1, 3, 16), new T.MeshBasicMaterial({ color: '#f6d9a0', fog: false })); rg.scale.z = .25; rg.rotation.set(1.2, .1, .5); m.add(rg); }
    });
    // Round 4b: small planets over the lower / side parts of the dome as well (the player's "up" turns as they walk round)
    {
      const pal=[['#f6c58a','#e99a62','#f9dcae'],['#a8e0d8','#6cc4c0','#c8f0e8'],['#f0a0b8','#d9789a','#f7bdd0'],['#f5d07a','#e8b04e','#f8e0a0'],['#bda0e8','#9a7fd0','#cdb8f0'],['#9fe0b8','#6cc29c','#bdf0d0'],['#8fd3d0','#58aeb8','#a8e0d8']];
      let k=0;const N=34;
      for(let i=0;i<N&&k<(LOW_POWER?6:18);i++){
        const yy=1-2*(i+.5)/N;if(yy>.45)continue;
        const rad=Math.sqrt(1-yy*yy),az=i*2.399963+2.1,dist=205,m=bandedPlanet(2.4+(i%4)*.7,pal[k%pal.length],.4+k*.3);
        m.position.set(Math.cos(az)*rad*dist,yy*dist,Math.sin(az)*rad*dist);m.name='round4-sky-planet-low-'+k;skyGroup.add(m);skyPlanets.push(m);
        if(k%4===1){const rg=new T.Mesh(new T.TorusGeometry(2.4*1.7,.24,3,16),new T.MeshBasicMaterial({color:'#f6d9a0',fog:false}));rg.scale.z=.25;rg.rotation.set(1.2,.1,.5);m.add(rg);}
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
      if (ring) { const rg = new T.Mesh(new T.TorusGeometry(r * 1.7, r * .1, 3, 16), new T.MeshBasicMaterial({ color: '#f6d9a0', fog: false })); rg.scale.z = .25; rg.rotation.set(1.2, .1, .5); m.add(rg); }
    });
    // Round 4b: the sky must not be empty from the sides or behind - more clouds and small planets all around the dome.
    {
      const nCloud=LOW_POWER?6:20;
      for(let i=0;i<nCloud;i++){
        const yy=1-2*(i+.5)/nCloud,rr_=Math.sqrt(1-yy*yy),az=i*2.399963+.9,rad=40+(i%3)*8,cloud=cloudMesh(cloudRng);
        cloud.position.set(Math.cos(az)*rr_*rad,yy*rad,Math.sin(az)*rr_*rad);cloud.scale.setScalar(1.15+(i%4)*.22);cloud.lookAt(0,0,0);clouds.add(cloud);
      }
      // The sky dome is fixed in world space but the player walks all the way round the planet, so "sky" can be any
      // world direction: spread the far clouds over the WHOLE sphere (Fibonacci lattice), not just the upper half.
      const nFar=LOW_POWER?9:30;
      for(let i=0;i<nFar;i++){
        const yy=1-2*(i+.5)/nFar,rad=Math.sqrt(1-yy*yy),az=i*2.399963+.6,dist=190+(i%3)*14,m=cloudMesh(cloudRng);
        m.name='round4-far-cloud';m.position.set(Math.cos(az)*rad*dist,yy*dist,Math.sin(az)*rad*dist);m.scale.setScalar(3.6+(i%3)*.8);m.lookAt(0,0,0);skyGroup.add(m);
      }
    }
    // Round 4c: a ring of clouds and small planets that stays around the player's horizon (it turns with the player's
    // "up" while walking round the planet), so side and back views always have sky decoration, not just gradient.
    const localSky = new T.Group(); localSky.name = 'round4-horizon-ring'; skyGroup.add(localSky);
    {
      const nC = LOW_POWER ? 11 : 40, nP = LOW_POWER ? 10 : 16, pal = [['#f6c58a','#e99a62','#f9dcae'],['#a8e0d8','#6cc4c0','#c8f0e8'],['#f0a0b8','#d9789a','#f7bdd0'],['#f5d07a','#e8b04e','#f8e0a0'],['#bda0e8','#9a7fd0','#cdb8f0'],['#9fe0b8','#6cc29c','#bdf0d0']];
      for (let i = 0; i < nC; i++) {
        const az = i / nC * Math.PI * 2 + (cloudRng() - .5) * .2, el = (-42 + (i % 3) * 14 + cloudRng() * 10) * Math.PI / 180, dist = 150 + cloudRng() * 40, m = cloudMesh(cloudRng);
        m.name = 'round4-ring-cloud'; m.position.set(Math.cos(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist);
        m.scale.setScalar(2.2 + cloudRng() * 1.4); m.lookAt(0, 0, 0); localSky.add(m);
      }
      for (let i = 0; i < nP; i++) {
        const az = (i + .5) / nP * Math.PI * 2 + 1.1, el = (-34 + (i * 37 % 36)) * Math.PI / 180, dist = 175, m = bandedPlanet(2.3 + (i % 4) * .8, pal[i % pal.length], .3 + i * .27);
        m.name = 'round4-ring-planet-' + i; m.position.set(Math.cos(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist); localSky.add(m); skyPlanets.push(m);
        if (i % 4 === 2) { const rg = new T.Mesh(new T.TorusGeometry((2.3 + (i % 4) * .8) * 1.7, .26, 3, 16), new T.MeshBasicMaterial({ color: '#f6d9a0', fog: false })); rg.scale.z = .25; rg.rotation.set(1.2, .1, .5); m.add(rg); }
      }
    }
    const skyUp = new V3(0, 1, 0), skyQ = new T.Quaternion();

    // Merge distant clouds into six spatial buckets per sky frame. The same
    // silhouettes/colours remain in the same places, with far fewer draw calls.
    for(const parent of [skyGroup,localSky]){
      const buckets=new Map();
      for(const cloud of [...parent.children]){
        if(!cloud.isMesh || !/cloud/.test(cloud.name) || !cloud.geometry.userData.distantGeometry)continue;
        const p=cloud.position,axis=Math.abs(p.x)>Math.abs(p.y)&&Math.abs(p.x)>Math.abs(p.z)?'x':Math.abs(p.y)>Math.abs(p.z)?'y':'z',key=axis+(p[axis]>0?'+':'-');
        let b=buckets.get(key);if(!b){b={p:[],c:[]};buckets.set(key,b);}cloud.updateMatrix();
        const g=cloud.geometry.userData.distantGeometry,pp=g.attributes.position,cc=g.attributes.color,v=new V3();
        for(let i=0;i<pp.count;i++){v.fromBufferAttribute(pp,i).applyMatrix4(cloud.matrix);b.p.push(v.x,v.y,v.z);b.c.push(cc.getX(i),cc.getY(i),cc.getZ(i));}parent.remove(cloud);
      }
      for(const [key,b]of buckets){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));g.computeBoundingSphere();const m=new T.Mesh(g,cloudMat);m.name='i-far-clouds-'+key;parent.add(m);}
    }

    const nearBuckets = new Map();
    for (const cloud of [...clouds.children]) {
      if (!cloud.isMesh) continue;
      const p = cloud.position, key = Math.abs(p.x)>Math.abs(p.z) ? (p.x>0?'px':'nx') : (p.z>0?'pz':'nz');
      let group = nearBuckets.get(key);if(!group){group=[];nearBuckets.set(key,group);}group.push(cloud);
    }
    function mergeClouds(list, lite) {
      const positions=[],colours=[],v=new V3();
      for (const cloud of list) {
        cloud.updateMatrix();const full=cloud.userData.fullCloudGeometry||cloud.geometry,g=lite?full.userData.distantGeometry:full,pp=g.attributes.position,cc=g.attributes.color;
        for(let i=0;i<pp.count;i++){v.fromBufferAttribute(pp,i).applyMatrix4(cloud.matrix);positions.push(v.x,v.y,v.z);colours.push(cc.getX(i),cc.getY(i),cc.getZ(i));}
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colours,3));g.computeBoundingSphere();return g;
    }
    for(const [key,list] of nearBuckets){
      // A merged bucket spans a quarter of the sky, so one near cloud would switch the whole bucket to full detail (+20–40k tris).
      // The simplified shape looks the same at play distance; use it always.
      const lite=mergeClouds(list,true);
      const mesh=new T.Mesh(lite,cloudMat);mesh.name='i-near-clouds-'+key;
      list.forEach(m=>clouds.remove(m));clouds.add(mesh);
    }
    // Far clouds are already plain cubes. One batch in each sky frame saves more draws.
    for(const parent of [skyGroup,localSky]){
      const list=parent.children.filter(m=>m.isMesh&&m.name.startsWith('i-far-clouds-'));
      if(list.length<2)continue;list.forEach(m=>m.userData.fullCloudGeometry=m.geometry);
      const mesh=new T.Mesh(mergeClouds(list,false),cloudMat);mesh.name='i-far-clouds-merged';list.forEach(m=>parent.remove(m));parent.add(mesh);
    }

    const skySpin={value:0}, skyBatches=new Map();
    skyPlanets.forEach((orb,index)=>{
      orb.updateMatrix();let b=skyBatches.get(orb.parent);if(!b){b={p:[],c:[],o:[],r:[],objects:[]};skyBatches.set(orb.parent,b);}b.objects.push(orb);
      for(const part of [orb,...orb.children.filter(o=>o.isMesh)]){
        part.updateMatrix();const M=part===orb?orb.matrix:new T.Matrix4().multiplyMatrices(orb.matrix,part.matrix),g=part.geometry.index?part.geometry.toNonIndexed():part.geometry,pp=g.attributes.position,cc=g.attributes.color,pt=new V3(),col=new T.Color();
        for(let k=0;k<pp.count;k++){pt.fromBufferAttribute(pp,k).applyMatrix4(M);b.p.push(pt.x,pt.y,pt.z);if(cc)col.fromBufferAttribute(cc,k);else col.copy(part.material.color);b.c.push(col.r,col.g,col.b);b.o.push(orb.position.x,orb.position.y,orb.position.z);b.r.push(.015+index*.003);}
        if(g!==part.geometry)g.dispose();
      }
    });
    for(const [parent,b]of skyBatches){
      const g=new T.BufferGeometry();for(const [name,values,size]of [['position',b.p,3],['color',b.c,3],['orbitCenter',b.o,3],['spinRate',b.r,1]])g.setAttribute(name,new T.Float32BufferAttribute(values,size));g.computeBoundingSphere();
      const m=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false,fog:false});m.onBeforeCompile=sh=>{sh.uniforms.skyTime=skySpin;sh.vertexShader='attribute vec3 orbitCenter;attribute float spinRate;uniform float skyTime;\n'+sh.vertexShader;sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 rel=position-orbitCenter;float a=skyTime*spinRate;transformed=orbitCenter+vec3(cos(a)*rel.x+sin(a)*rel.z,rel.y,-sin(a)*rel.x+cos(a)*rel.z);');};m.customProgramCacheKey=()=> 'i-sky-planets-batched-r3';
      const mesh=new T.Mesh(g,m);mesh.name='i-sky-planets-batch';mesh.frustumCulled=false;parent.add(mesh);b.objects.forEach(o=>parent.remove(o));
    }
    skyPlanets.length=0;

    // ---- helpers to bake structures onto the sphere ---------------------------------------------------------------------------------
    const box = roundedBox(T, .12), chunkBox = roundedBox(T, .18);
    const material = new T.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0, emissive: new T.Color('#c6d8f8'), emissiveIntensity: .12 });
    const frame = (dir, heading, h) => {   // origin on the ground at `dir` (radius h), y = up, z = heading
      const up = dir.clone().normalize(), z = tangent(heading.clone(), up), x = new V3().crossVectors(up, z).normalize();
      return new T.Matrix4().makeBasis(x, up, z).setPosition(up.clone().multiplyScalar(h));
    };
    const offsetDir = (dir, heading, x, z) => { const up = dir.clone().normalize(), hd = tangent(heading.clone(), up), rt = new V3().crossVectors(up, hd).normalize(); return up.clone().addScaledVector(rt, x / SURF).addScaledVector(hd, z / SURF).normalize(); };
    const maxGround = (dir, heading, rad) => { let h = surfaceRadius(dir), lo = h; for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, s = surfaceRadius(offsetDir(dir, heading, Math.cos(a) * rad, Math.sin(a) * rad)); h = Math.max(h, s); lo = Math.min(lo, s); } return [h, lo]; };
    // a plinth of snow blocks so a structure stands flat on the stepped terrain
    function plinth(b, dir, heading, hb, rad, step = .9) {
      const n = Math.ceil(rad / step);
      for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
        const x = i * step, z = j * step, rr = Math.hypot(x, z); if (rr > rad + .01) continue;
        const hs = surfaceRadius(offsetDir(dir, heading, x, z)), depth = hb - hs;
        const edge = rr > rad - step * .9;
        if (depth > .08 || edge) { const hgt = Math.max(.3, depth + .45); b.block(x, .05 - hgt / 2, z, step * 1.02, hgt, step * 1.02, depth > .6 ? '#d4dff5' : '#e8f0fc', { top: '#f7faff', low: .92, plain: !edge }); }
      }
    }
    const villageB = A.makeBatch(T, box), scenery = {};
    const sceneryB = key => scenery[key] || (scenery[key] = A.makeBatch(T, box));
    const bucket = d => { const ax = Math.abs(d.x), ay = Math.abs(d.y), az = Math.abs(d.z); return ax >= ay && ax >= az ? (d.x > 0 ? 'px' : 'nx') : ay >= az ? (d.y > 0 ? 'py' : 'ny') : (d.z > 0 ? 'pz' : 'nz'); };
    const landmarks = {};
    // warm doorway light: an unlit glow mesh (door fill) + additive halo quads (one draw call each); a real PointLight only on desktop (like the game's own lamps)
    const glowB = A.makeBatch(T, box), haloP = [], haloU = [], doorLights = [];
    const addHalo = (cx, cy, cz, ax, ay, az, bx, by, bz, hw, hh) => {   // centre + two half-axes (local frame of villageB's current base)
      const M = villageB.base(), v = new V3(), pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, w]) => v.set(cx + ax * u * hw + bx * w * hh, cy + ay * u * hw + by * w * hh, cz + az * u * hw + bz * w * hh).applyMatrix4(M).toArray());
      const i = haloP.length / 3; for (const q of [0, 1, 2, 0, 2, 3]) { haloP.push(...pts[q]); } haloU.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
      return i;
    };
    const glowHalo = r => { addHalo(0, .55, r + .25, 1, 0, 0, 0, 1, 0, 1.0, .85); addHalo(0, .05, r + 1.3, 1, 0, 0, 0, 0, 1, 1.3, 1.6); };
    const doorLight = (r) => { if (LOW_POWER || doorLights.length >= 2) return; const pl = new T.PointLight('#ffcf80', 1.1, 7, 2), p = new V3(0, .8, r + 1.0).applyMatrix4(villageB.base()); pl.position.copy(p); root.add(pl); doorLights.push(pl); };
    let houseFrame,houseKeep,houseRings; const houseMeshes=[]; let houseLayers=0;
    const iglooSpec = [...L.igloos];
    iglooSpec.forEach((g, i) => {
      const dir = P(g.x, g.a), heading = tangent(P(0, L.spawnA + 2 + i * 3).sub(dir), dir), [hb] = maxGround(dir, heading, g.r + .5);
      villageB.setBase(frame(dir, heading, hb)); plinth(villageB, dir, heading, hb, g.r + .35);
      A.igloo(villageB, { r: g.r, seed: 3 + i, glow: glowB, glowHalo, plain: i > 0 }); if (i < 2) doorLight(g.r); villageB.resetBase();
      obstacles.push({ dir, r: g.r + .6, kind: 'i-igloo' }); landmarks['igloo' + i] = { dir };
    });
    {   // the half igloo: lower courses built, ragged arc on one side, nothing on top; loose bricks (the same bricks) around
      const g = L.half, dir = P(g.x, g.a), heading = tangent(P(g.x - 1.2, g.a + 6).sub(dir), dir), [hb] = maxGround(dir, heading, g.r + .8);
      villageB.setBase(frame(dir, heading, hb)); plinth(villageB, dir, heading, hb, g.r + .35);
      const Kh = Math.round(g.r * Math.PI / 2 / .3), keep = []; for (let k = 0; k < Kh; k++) keep.push(k < Kh * .8 ? Math.PI * (1 - Math.pow(k / (Kh * .8), 1.35) * .93) : 0);
      houseFrame=frame(dir,heading,hb);houseKeep=keep;houseRings=Kh;
      const hb0=A.makeBatch(T,box);hb0.setBase(houseFrame);A.igloo(hb0,{r:g.r,rings:Kh,seed:11,keep});
      const hm0=hb0.mesh(material,'i-home-0');root.add(hm0);houseMeshes.push(hm0);
      villageB.block(0, .06, -.25, g.r * 1.55, .1, g.r * 1.5, '#cfe0f6', { top: '#e2eefc' });   // the ice floor inside, a small pile of bricks waiting on it
      A.looseBricks(villageB, [[-.5, -.5, .3, 2], [.35, -1.0, -.4, 1], [-2.9, -1.4, .5, 1], [-3.5, 1.0, 1.2, 1], [2.9, -3.0, -.4, 2], [3.6, -.9, .9, 1], [1.4, -3.9, .2, 1], [-1.3, -3.6, 1.9, 1], [-2.7, 3.0, .7, 1], [.6, -2.6, 2.4, 1], [-3.2, -2.9, 1.1, 1]], 7);
      villageB.resetBase(); obstacles.push({ dir, r: g.r + .65, kind: 'i-igloo' }); landmarks.halfIgloo = { dir };
    }
    L.hills.forEach((h, i) => {   // stepped snow hills (terraces)
      const dir = P(h.x, h.a), heading = tangent(P(h.x, h.a + 3).sub(dir), dir), [hb] = maxGround(dir, heading, h.r + .3);
      villageB.setBase(frame(dir, heading, hb));
      const tiers = [h.r, h.r * .68, h.r * .36];
      tiers.forEach((rr, k) => {
        const step = .9, n = Math.ceil(rr / step);
        for (let ix = -n; ix <= n; ix++) for (let iz = -n; iz <= n; iz++) {
          const x = ix * step, z = iz * step; if (Math.hypot(x, z) > rr + .01) continue;
          const hs = k === 0 ? surfaceRadius(offsetDir(dir, heading, x, z)) : hb, gh = k === 0 ? hb - hs : 0;
          const hgt = .6 + (k === 0 ? gh + .3 : 0);
          villageB.block(x, (k + 1) * .6 - hgt / 2, z, step * 1.02, hgt, step * 1.02, k === 0 ? '#e9e6f6' : k === 1 ? '#f3eff6' : '#fbf7f2', { top: k === 2 ? '#ffffff' : '#fdf9f4', low: .86 });
        }
      });
      villageB.resetBase();
      obstacles.push({ dir, r: h.r + .55, kind: 'i-hill' });
    });
    // 3 strings of coloured block bunting flags (like the little flags on planet A's plinth): a slim pole at each end, a sagging rope, small hanging flags
    {
      const FL = ['#f39a8f', '#f7c65d', '#8fcaa9', '#9cc4ec', '#d6a6e4'], BUNT = A.makeBatch(T, box);
      L.bunting.forEach(([p0, p1], si) => {
        const d0 = P(p0[0], p0[1]), d1 = P(p1[0], p1[1]), dm = d0.clone().add(d1).normalize(), len = arc(d0, d1), fwd = tangent(d1.clone().sub(d0), dm), H = 2.45;
        const gm = surfaceRadius(dm); let g0 = surfaceRadius(d0), g1 = surfaceRadius(d1);
        const pt = (u, y) => { const d = d0.clone().lerp(d1, u).normalize(); return [d, y]; };
        // poles: two white-wood posts with a gold ball on top
        for (const [d, g] of [[d0, g0], [d1, g1]]) { BUNT.setBase(frame(d, fwd, g - .05)); BUNT.block(0, H / 2, 0, .13, H, .13, '#efe6d8', { top: '#fff' }); BUNT.block(0, H + .05, 0, .22, .22, .22, '#ffd480', { top: '#ffe6a0', plain: true }); BUNT.resetBase(); obstacles.push({ dir: d, r: .3, kind: 'i-pole' }); }
        const nR = Math.round(len / .3);
        for (let k = 0; k <= nR; k++) {
          const u = k / nR, d = d0.clone().lerp(d1, u).normalize(), g = g0 + (g1 - g0) * u, sag = .55 * 4 * u * (1 - u), y = H - sag;
          BUNT.setBase(frame(d, fwd, g - .05)); BUNT.block(0, y, 0, .06, .06, .34, '#f6efe4', { plain: true, low: 1 });
          if (k > 0 && k < nR && k % 2 === 1) { const fh = .28 + .05 * A.hash(k, si, 2); BUNT.block(0, y - fh / 2 - .02, 0, .04, fh, .18, FL[(k + si * 2) % 5], { low: 1, top: '#ffffff', plain: true }); BUNT.block(0, y - fh - .05, 0, .04, .08, .1, FL[(k + si * 2) % 5], { low: 1, plain: true }); }
          BUNT.resetBase();
        }
      });
      villageB.__bunt = BUNT;
    }

    // ---- pine trees: blue-noise scatter (never closer than ~6 m, never on the slide / lake / igloos / spawn) -------------------------
    const explorationSites=YayaIAtmosphere.siteDefinitions(T,lakeD);
    const parkHint=slideAt(L.ring.arch+Math.PI),parkHintForward=tangent(slideAt(L.ring.arch+Math.PI+.01).sub(parkHint),parkHint),parkHintDir=parkHint.clone().multiplyScalar(SURF).addScaledVector(new V3().crossVectors(parkHintForward,parkHint),5).normalize();
    const treeSpots = [];
    {
      const avoid = [{ d: STAGE.center, r: 7.0 }, { d: START_DIR, r: 5.2 }, { d: P(0, -10.5), r: 9.5 }];   // nothing tall between the spawn camera and the stage
      iglooSpec.forEach(g => avoid.push({ d: P(g.x, g.a), r: g.r + 2.6 })); avoid.push({ d: P(L.half.x, L.half.a), r: L.half.r + 3.3 }, { d: P(L.penguin.x, L.penguin.a), r: 2.6 });
      L.hills.forEach(h => avoid.push({ d: P(h.x, h.a), r: h.r + 2.8 }));
      const ok = d => arc(d,parkHintDir)>5 && explorationSites.every(site=>arc(d,site.dir)>4.5) && d.y>-.5 && avoid.every(q => arc(d, q.d) > q.r) && lakeMask(d) < -.32 && slideDist(d) > 3.4 && treeSpots.every(t => arc(d, t) > (LOW_POWER ? 7.4 : 6.6));
      const maxT = LOW_POWER ? 20 : 30;
      [[-11.4, 4.6], [9.8, 9.2], [-2.6, 16.2], [14.6, -2.6], [-16.2, 10.5], [1.0, -18.5]].forEach(([x, a]) => { const d = P(x, a); if (ok(d)) treeSpots.push(d); });
      const N = 1800, ga = 2.399963;
      for (let i = 0; i < N && treeSpots.length < maxT; i++) { const yy = 1 - 2 * (((i * 7919) % N) + .5) / N, rad = Math.sqrt(1 - yy * yy), az = i * 7919 * ga % (Math.PI * 2); const d = new V3(Math.cos(az) * rad, yy, Math.sin(az) * rad); if (ok(d)) treeSpots.push(d); }
    }
    treeSpots.forEach((d, i) => {
      const s = .8 + A.hash(i, 1, 9) * .38, heading = tangent(P(0, 1).sub(d).applyAxisAngle(d, A.hash(i, 2, 4) * 6.28), d), b = sceneryB('t' + bucket(d)), h = surfaceRadius(d) - .2;
      b.setBase(frame(d, heading, h)); A.pine(b, s, i); b.resetBase(); obstacles.push({ dir: d, r: .7 * s + .1, kind: 'i-pine' });
    });
    // pines on top of the hills
    L.hills.forEach((h0, i) => { const dir = P(h0.x, h0.a), heading = tangent(P(h0.x, h0.a + 3).sub(dir), dir), [hb] = maxGround(dir, heading, h0.r + .3); villageB.setBase(frame(dir, heading, hb + 1.8 - .05)); A.pine(villageB, .62, 31 + i); villageB.resetBase(); });

    // ---- the ice slide: ice-blue surface in three lanes (two thin pale lines + diagonal white glint stripes), knee-high rounded snow banks, a start arch ----
    const meshes = [];
    const bankBox = roundedBox(T, .2), bankB = {}, bankOf = key => bankB[key] || (bankB[key] = A.makeBatch(T, bankBox));
    let archK = 0; const slideFloors=[],terraceFloors=[];
    {
      const M = slide.M, hs = [], hm = [], hf = [], fw = [];
      for (let k = 0; k < M; k++) fw.push(tangent(slide.pts[(k + 1) % M].clone().sub(slide.pts[(k - 1 + M) % M]), slide.pts[k]));
      const lo = [];
      for (let k = 0; k < M; k++) {   // highest AND lowest ground over the whole footprint (width 2.8, length .6): the slab must clear every voxel corner that pokes up
        let mx = -9, mn = 99; for (const lx of [-1.5, -.75, 0, .75, 1.5]) for (const lz of [-.3, .3]) { const h = surfaceRadius(offsetDir(slide.pts[k], fw[k], lx, lz)); mx = Math.max(mx, h); mn = Math.min(mn, h); }
        // Sample the actual voxel corner bounds in this segment's tangent frame.
        // Radial samples alone missed corners that pierced the ice as grey triangles.
        const d=slide.pts[k],rt=new V3().crossVectors(d,fw[k]),corner=.5*(Math.abs(d.x)+Math.abs(d.y)+Math.abs(d.z));
        for(const cell of cells){const along=cell[0]*fw[k].x+cell[1]*fw[k].y+cell[2]*fw[k].z,across=cell[0]*rt.x+cell[1]*rt.y+cell[2]*rt.z,up=cell[0]*d.x+cell[1]*d.y+cell[2]*d.z;if(up>R-1.5&&Math.abs(across)<1.96&&Math.abs(along)<1.14)mx=Math.max(mx,up+corner+.025);}
        hs.push(mx); lo.push(mn);
      }
      for (let k = 0; k < M; k++) { let m = 0; for (let o = -3; o <= 3; o++) m = Math.max(m, hs[(k + o + M) % M]); hm.push(m); }
      for (let k = 0; k < M; k++) { let sum = 0; for (let o = -2; o <= 2; o++) sum += hm[(k + o + M) % M]; hf.push(sum / 5); }
      const b = n => sceneryB('s' + n), LANE = ['#8cc8f0', '#80c0ec', '#98d0f4'], ICEL = '#f0f9ff';
      for (let k = 0; k < M; k++) {
        const d = slide.pts[k], B = b(bucket(d)), top = Math.max(hf[k], hs[k] + .03), depth = top - lo[k] + .45;
        slideFloors.push({dir:d.clone(),forward:fw[k].clone(),right:new V3().crossVectors(d,fw[k]).normalize(),top});
        B.setBase(frame(d, fw[k], top));
        for (let ln = -1; ln <= 1; ln++) { const hv = A.hash(k, ln + 2, 5), c = LANE[(ln + 1 + (hv > .6 ? 1 : 0)) % 3]; B.block(ln * .7, .0 - depth / 2, 0, .72, depth, .52, c, { top: c, low: .8, plain: true }); }
        for (const lx of [-.35, .35]) B.block(lx, .012, 0, .05, .04, .52, ICEL, { plain: true, top: ICEL, low: 1 });   // two thin pale lines -> three lanes
        if (k % 7 === 3) B.block((k%3-1)*.7, .025, 0, .22, .006, .025, '#badcec', { plain: true, top: '#badcec', low: 1 });   // diagonal white glint stripe
        // Rebuild the immediate shoulders in the track's local tangent frame.
        // World-axis voxels here read as diagonal wedges on the curved globe.
        for(const side of [-1,1])for(let band=0;band<7;band++){
          const x=side*(2.05+band*.9),dir=offsetDir(d,fw[k],x,0);
          const h=surfaceRadius(dir)*dir.dot(d),height=Math.round(h/.30)*.30;
          const depth=height-(R-4.8);B.block(x,height-top-depth/2,0,.94,depth,.53,'#a9afd4',{plain:true,top:'#e4eaf7',low:.88});
          terraceFloors.push({dir:d.clone(),forward:fw[k].clone(),right:new V3().crossVectors(d,fw[k]).normalize(),top:height,x});
        }
        B.resetBase();
        if (k % 2 === 0) for (const sx of [-1, 1]) {   // knee-high rounded snow banks (girl's knee ~ .45 m)
          const hv = A.hash(k, sx + 3, 9), bh = .38 + hv * .1, Hb = bh + (top - lo[k]) + .25;
          const BB = bankOf(bucket(d)); BB.setBase(frame(d, fw[k], top)); BB.block(sx * 1.38, bh - .02 - Hb / 2, 0, .56, Hb, .94, hv < .5 ? '#f3eff6' : '#fbf7f2', { top: '#fffdfa', low: .86, ry: (hv - .5) * .25 }); BB.resetBase();
        }
      }
      // the start arch: pillars of alternating ice-blue / white blocks + a banded lintel (modelled on T's finish arch), at the ring point nearest the arch azimuth
      let best = 9; slide.pts.forEach((d, k) => { const a0 = Math.atan2(-d.z, d.x), dd = Math.abs(((a0 - L.ring.arch + Math.PI * 3) % (Math.PI * 2)) - Math.PI); const e = Math.PI - dd; if (e < best) { best = e; archK = k; } });
      {
        const k = archK, d = slide.pts[k], top = Math.max(hf[k], hs[k] + .03), AB = A.makeBatch(T, bankBox), W = 2.0, BL = '#79bdea', BL2 = '#9ed0f3', WH = '#ffffff';
        AB.setBase(frame(d, fw[k], top));
        for (const sx of [-1, 1]) { for (let i = 0; i < 5; i++) AB.block(sx * W, .22 + i * .44, 0, .46, .44, .46, i % 2 ? WH : BL, { top: i % 2 ? WH : BL2, low: .9 }); AB.block(sx * W, 2.34, 0, .62, .2, .62, '#c8e8fb', { top: WH }); }
        for (let i = -5; i <= 5; i++) AB.block(i * .44, 2.54, 0, .44, .36, .4, (i + 5) % 2 ? WH : BL, { top: (i + 5) % 2 ? WH : BL2, low: .9 });
        AB.block(0, 2.84, 0, 5.0, .14, .46, '#bfe4fa', { top: WH });
        for (let i = 0; i < 4; i++) { const an = i * Math.PI / 4; AB.block(0, 3.24, 0, .62, .1, .14, WH, { rz: an, plain: true, top: WH, low: 1 }); }   // a snowflake-shaped block on the lintel
        AB.block(0, 3.24, 0, .2, .2, .2, '#dff2ff', { top: WH });
        AB.resetBase();
        const am = AB.mesh(material, 'i-slide-arch'); am.castShadow = !LOW_POWER; am.receiveShadow = true; root.add(am); meshes.push(am);
        for (const sx of [-1, 1]) obstacles.push({ dir: offsetDir(d, fw[k], sx * W, 0), r: .45, kind: 'i-arch' });
        landmarks.slideStart = { dir: d.clone() };
      }
      // small snow mounds on both sides, sparse and irregular, never touching the banks
      for (let k = 3; k < M; k += 9) {
        const hv = A.hash(k, 5, 8); if (hv < .35) continue;
        const side = (k / 9 % 2 === 0 ? 1 : -1) * (3.0 + hv * .6), d = offsetDir(slide.pts[k], fw[k], side, 0);
        if (Math.abs(k - archK) < 8) continue;
        const B = b(bucket(d)), h = surfaceRadius(d) - .1;
        B.setBase(frame(d, fw[k], h)); const sc = .75 + hv * .45;
        B.block(0, .26 * sc, 0, 1.0 * sc, .62 * sc, .9 * sc, '#f1ecf5', { ry: hv * 3, top: '#ffffff', low: .86 }); B.block(.1 * sc, .72 * sc, 0, .6 * sc, .4 * sc, .55 * sc, '#faf6f2', { ry: hv * 5, top: '#ffffff' }); B.resetBase();
        obstacles.push({ dir: d, r: .55 * sc, kind: 'i-mound' });
      }
    }
    let lakeHeight=SURF;
    // ---- the ice lake: ONE flat height (a spherical cap), 2-3 similar pale blues mixed by soft noise, a few white hairline cracks, a snow-white rim ----
    {
      const dir = lakeD, heading = tangent(P(L.lake.x + 1, L.lake.a + .3).sub(dir), dir), B = sceneryB('lake');
      let hL = 0; for (let ix = -9; ix <= 9; ix++) for (let iz = -7; iz <= 7; iz++) { const x = ix * .5, z = iz * .5; if (Math.hypot(x / (L.lake.rx + .8), z / (L.lake.rz + .8)) > 1) continue; hL = Math.max(hL, surfaceRadius(offsetDir(dir, heading, x, z))); }
      hL += .05;lakeHeight=hL;
      const LB = ['#7dc0ec', '#8ac9f0', '#72b8e6'], pitch = .86, nx = Math.ceil(L.lake.rx / pitch) + 1, nz = Math.ceil(L.lake.rz / pitch) + 1, tc = new T.Color();
      const inLake = (x, z, k = 1) => (x / (L.lake.rx * k)) ** 2 + (z / (L.lake.rz * k)) ** 2 <= 1;
      for (let ix = -nx; ix <= nx; ix++) for (let iz = -nz; iz <= nz; iz++) {
        const x = ix * pitch, z = iz * pitch; if (!inLake(x, z, 1.02)) continue;
        const d = offsetDir(dir, heading, x, z), g = surfaceRadius(d), depth = hL - g + .12;
        const nse = .5 + .5 * Math.sin(x * .9 + 1.3) * Math.sin(z * 1.1 - .4) + (A.hash(ix, iz, 4) - .5) * .5, ci = nse < .38 ? 2 : nse < .66 ? 0 : 1;
        tc.set(LB[ci]); const col = '#' + tc.getHexString(), low = '#' + tc.clone().multiplyScalar(.88).getHexString();
        B.setBase(frame(d, heading, hL)); B.block(0, -depth / 2, 0, pitch * 1.03, depth, pitch * 1.03, low, { top: col, low: .9, plain: true }); B.resetBase();
      }
      // hairline cracks: random walks of 3-5 thin white segments
      for (let c = 0; c < 4; c++) {
        let x = (A.hash(c, 1, 77) - .5) * L.lake.rx * 1.2, z = (A.hash(c, 2, 77) - .5) * L.lake.rz * 1.2, ang = A.hash(c, 3, 77) * 6.28;
        for (let sgi = 0; sgi < 3 + (c % 3); sgi++) {
          const len = .7 + A.hash(c, sgi, 78) * .8, mx = x + Math.sin(ang) * len / 2, mz = z + Math.cos(ang) * len / 2; if (!inLake(mx, mz, .93)) break;
          const d = offsetDir(dir, heading, mx, mz); B.setBase(frame(d, heading, hL + .006)); B.block(0, .012, 0, .05, .014, len, '#f4fbff', { ry: ang, plain: true, top: '#ffffff', low: 1 }); B.resetBase();
          x += Math.sin(ang) * len; z += Math.cos(ang) * len; ang += (A.hash(c, sgi, 79) - .5) * 1.5;
        }
      }
      // snow-white rim: rounded blocks along the shore (they also hide the cliff of the plate)
      const nRim = 26; for (let i = 0; i < nRim; i++) {
        const t = i / nRim * Math.PI * 2, x = Math.cos(t) * (L.lake.rx + .5), z = Math.sin(t) * (L.lake.rz + .5), d = offsetDir(dir, heading, x, z), g = surfaceRadius(d), hv = A.hash(i, 5, 6);
        const top = hL + .22 + hv * .1, depth = Math.max(.5, top - g + .1);
        if (slideDist(d) < 2.4) continue;
        B.setBase(frame(d, tangent(offsetDir(dir, heading, Math.cos(t + .1) * (L.lake.rx + .5), Math.sin(t + .1) * (L.lake.rz + .5)).sub(d), d), top)); B.block(0, -depth / 2, 0, .78 + hv * .2, depth, .8, '#f1edf6', { top: '#fffdfa', low: .86 }); B.resetBase();
      }
      obstacles.push({ dir, r: Math.min(L.lake.rx, L.lake.rz) * .8, kind: 'i-lake' });
      obstacles.push({ dir: offsetDir(dir, heading, -L.lake.rx * .55, 0), r: L.lake.rz * .55, kind: 'i-lake' }, { dir: offsetDir(dir, heading, L.lake.rx * .55, 0), r: L.lake.rz * .55, kind: 'i-lake' });
    }
    // a few lone snow blocks / small ice chunks around the lake (sparse)
    {
      const B = sceneryB('lake');
      for (let i = 0; i < 7; i++) {
        const ang = i / 7 * Math.PI * 2 + .3, rx = L.lake.rx + 1.7 + A.hash(i, 1, 1) * .5, rz = L.lake.rz + 1.7 + A.hash(i, 2, 1) * .5;
        const d = P(L.lake.x + Math.cos(ang) * rx, L.lake.a + Math.sin(ang) * rz); if (slideDist(d) < 3.2) continue;
        const h = surfaceRadius(d) - .12, hd = tangent(P(0, 1).sub(d), d).applyAxisAngle(d, i);
        B.setBase(frame(d, hd, h)); const big = i % 3 === 0;
        B.block(0, .3, 0, (big ? 1.2 : .8), (big ? .7 : .5), (big ? 1.0 : .7), '#f1edf6', { top: '#ffffff', low: .86 }); if (big) B.block(.1, .8, 0, .7, .4, .6, '#faf6f2', { top: '#fff', ry: .4 }); B.resetBase();
        obstacles.push({ dir: d, r: big ? .7 : .45, kind: 'i-block' });
      }
    }
    const parkUp=slide.pts[archK],parkHeading=tangent(slide.pts[(archK+1)%slide.M].clone().sub(slide.pts[(archK-1+slide.M)%slide.M]),parkUp),parkDir=parkUp.clone().multiplyScalar(slideFloors[archK].top).addScaledVector(new V3().crossVectors(parkHeading,parkUp),5).normalize();
    const parking={dir:parkDir,heading:tangent(parkHeading,parkDir)};
    YayaIAtmosphere.snowPad({T,cells,surfaceRadius,sceneryB,bucket,frame},parking,1.6,3.8);
    parking.obstacle={dir:offsetDir(parkDir,parking.heading,0,.8),r:1.7,kind:'i-sleigh',enabled:true};obstacles.push(parking.obstacle);
    const atmosphere=YayaIAtmosphere.create({T,cells,arc,signposts:[P(-13,-6),P(12,-4),P(2,16),P(-13,10)],root,sites:explorationSites,sceneryB,bucket,frame,offsetDir,surfaceRadius,tangent,obstacles,LOW_POWER,slideDist,glowB,lakeHeight:()=>lakeHeight});
    // the planet's lower part is sunk into the snow bed of the globe: nobody may walk down there (a disc round the south pole)
    obstacles.push({ dir: new V3(0, -1, 0), r: SURF * Math.acos(Math.min(1, -(BED_Y + 1.2) / SURF)), kind: 'i-sunk' });
    // commit the merged meshes (a handful of chunks -> a handful of draw calls)
    { const v = villageB.mesh(material, 'i-village'); v.castShadow = false; v.receiveShadow = true; root.add(v); meshes.push(v); }
    for (const [k, B] of Object.entries(bankB)) { if (!B.count()) continue; const m = B.mesh(material, 'i-bank-' + k); m.castShadow = false; m.receiveShadow = true; root.add(m); meshes.push(m); }
    { const bm = villageB.__bunt && villageB.__bunt.mesh(material, 'i-bunting'); if (bm) { bm.castShadow = false; bm.receiveShadow = false; root.add(bm); meshes.push(bm); } }
    if (glowB.count()) { const gm = glowB.mesh(new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false, fog: true }), 'i-door-glow'); root.add(gm); meshes.push(gm); }
    if (haloP.length) {
      const hg = new T.BufferGeometry(); hg.setAttribute('position', new T.Float32BufferAttribute(haloP, 3)); hg.setAttribute('uv', new T.Float32BufferAttribute(haloU, 2));
      const hm = new T.Mesh(hg, new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: 'varying vec2 vUv; void main(){ float d=length(vUv-.5)*2.; float a=smoothstep(1.,.0,d); a*=a; gl_FragColor=vec4(vec3(1.,.62,.24)*a*.20,1.); }' }));
      hm.name = 'i-door-halo'; hm.frustumCulled = false; hm.renderOrder = 5; root.add(hm);
    }
    for (const [k, B] of Object.entries(scenery)) { if (!B.count()) continue; const m = B.mesh(material, 'i-scenery-' + k); m.castShadow = false; m.receiveShadow = true; root.add(m); meshes.push(m); }

    // Merge banks, trees and scenery that share a spatial sector and material.
    // All vertices stay in place; retaining sectors preserves useful frustum culling.
    {
      const sectors=new Map();for(const m of meshes){if(!/^i-(bank|scenery)-/.test(m.name)||m.material!==material)continue;const match=m.name.match(/(px|nx|py|ny|pz|nz)$/),key=match?match[1]:m.name;let list=sectors.get(key);if(!list){list=[];sectors.set(key,list);}list.push(m);}
      for (const [key, list] of sectors) {
        if (list.length < 2) continue;
        const g = new T.BufferGeometry();
        // Large argument lists overflow the iPhone/WebKit stack. Copy vertex data
        // into typed buffers instead, preserving every value and its order.
        for (const name of ['position', 'normal', 'color']) {
          const length = list.reduce((n, mesh) => n + mesh.geometry.attributes[name].array.length, 0);
          const values = new Float32Array(length);
          let offset = 0;
          for (const mesh of list) {
            const source = mesh.geometry.attributes[name].array;
            values.set(source, offset);
            offset += source.length;
          }
          g.setAttribute(name, new T.BufferAttribute(values, 3));
        }
        list.forEach(mesh => root.remove(mesh));
        g.computeBoundingSphere();
        const m = new T.Mesh(g, material);m.name = 'i-sector-' + key;m.receiveShadow = true;root.add(m);
      }
    }

    // At globe distance, submit only front-facing terrain triangles; near views keep the full geometry.
    const horizonChunks=root.children.filter(m=>m.isMesh&&/^i-(sector-|village$)/.test(m.name)&&!m.geometry.index).map(mesh=>({mesh,g:mesh.geometry,index:new T.BufferAttribute(new Uint32Array(mesh.geometry.attributes.position.count),1)}));
    let horizonAt=null,horizonActive=false;
    function updateHorizon(camera){
      const p=camera.position,far=p.length()>46;
      if(!far){if(horizonActive)for(const x of horizonChunks){x.g.setIndex(null);x.g.setDrawRange(0,Infinity);}horizonActive=false;horizonAt=null;return;}
      if(horizonAt&&horizonAt.distanceToSquared(p)<4)return;horizonAt=p.clone();horizonActive=true;
      for(const x of horizonChunks){const a=x.g.attributes.position.array,indices=x.index.array;let count=0;
        for(let j=0;j<a.length;j+=9){
          const ux=a[j+3]-a[j],uy=a[j+4]-a[j+1],uz=a[j+5]-a[j+2],vx=a[j+6]-a[j],vy=a[j+7]-a[j+1],vz=a[j+8]-a[j+2];
          const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,dx=p.x-a[j],dy=p.y-a[j+1],dz=p.z-a[j+2];
          // FrontSide materials already reject these triangles in the GPU.
          // The angular margin covers movement between visibility updates.
          const hidden=nx*dx+ny*dy+nz*dz < -.12*Math.sqrt((nx*nx+ny*ny+nz*nz)*(dx*dx+dy*dy+dz*dz));
          if(!hidden){const v=j/3;indices[count++]=v;indices[count++]=v+1;indices[count++]=v+2;}}
        x.index.needsUpdate=true;x.g.setIndex(x.index);x.g.setDrawRange(0,count);
      }
    }

    // ---- snow globe (round 2): the glass hugs the planet (no stem / "mushroom neck"): the planet's lower part sinks into a snow bed with drifts and ice-crystal
    //      clusters, shaded lilac and darker downward; a wooden three-tier base with a gold pattern ring carries the whole globe ----------------------------
    const globe = new T.Group(); globe.name = 'i-globe'; root.add(globe);
    let domeMat, snowMat, shellRef;
    {
      const glassMat = new T.ShaderMaterial({
        transparent: true, depthWrite: false, side: T.DoubleSide, fog: false, uniforms: { uTime: { value: 0 }, uFloor: { value: BED_Y }, uVis: { value: 1 }, uFlash: { value: 0 } },
        vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vW=position; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `uniform float uTime; uniform float uFloor; uniform float uVis; uniform float uFlash; varying vec3 vN; varying vec3 vV; varying vec3 vW;
          void main(){ if(vW.y<uFloor-.2||uVis<.01) discard;
            vec3 n=normalize(vN), v=normalize(vV); float fr=1.-abs(dot(n,v)); float rim=pow(fr,2.2);
            vec3 wd=normalize(vW);
            vec3 irid=.5+.5*cos(6.283*(vec3(.0,.33,.67)+fr*.9+wd.y*.4)); vec3 tint=mix(vec3(.84,.90,1.),vec3(1.,.82,.92),.5+.5*wd.x);
            vec3 col=mix(tint,irid,.35*rim);
            float spot=pow(max(dot(wd,normalize(vec3(-.55,.62,-.55))),0.),90.)*.95+pow(max(dot(wd,normalize(vec3(.62,.5,-.6))),0.),160.)*.6+pow(max(dot(wd,normalize(vec3(-.50,.60,.62))),0.),150.)*1.15+pow(max(dot(wd,normalize(vec3(.66,.42,.62))),0.),300.)*.5;
            // two thin rainbow arc highlights that drift slowly round the shell
            float ca=dot(wd,normalize(vec3(-.55+.25*sin(uTime*.05),.62,-.55+.25*cos(uTime*.05)))), cb=dot(wd,normalize(vec3(.5,.45+.1*sin(uTime*.04),.7)));
            float b1=smoothstep(.018,.0,abs(ca-.74)), b2=smoothstep(.012,.0,abs(cb-.82));
            vec3 rb=.5+.5*cos(6.283*(vec3(.0,.33,.67)+ca*9.));
            float a=.035+.62*rim+spot+(b1*.42+b2*.3)*(.4+.6*smoothstep(-.2,.5,wd.y))+uFlash*(.25+.5*rim+spot*.6);
            gl_FragColor=vec4(col+spot+rb*(b1*.9+b2*.7)+uFlash*.35,clamp(a,0.,.92)*uVis); }`,
      });
      const shell = new T.Mesh(new T.SphereGeometry(GLOBE_R, 64, 40), glassMat); shell.name = 'i-glass'; shell.renderOrder = 20; shell.frustumCulled = false; globe.add(shell);
      globe.userData.glass = glassMat; globe.userData.heavy = []; shellRef = shell;
      // wooden base: three tiers of rounded wood blocks, a gold zig-zag pattern ring, gold rims (kept from round 1, moved up to the snow bed)
      const WB = A.makeBatch(T, roundedBox(T, .16)), tier = (r0, y0, h, col, col2, n) => {
        for (let i = 0; i < n; i++) { const th = i / n * Math.PI * 2, w = 2 * Math.PI * r0 / n * 1.04, hv = A.hash(i, y0, 3); WB.block(Math.cos(th) * r0, y0 - h / 2, Math.sin(th) * r0, 2.4, h, w, hv < .5 ? col : col2, { ry: -th, top: '#bd8a62', low: .85 }); }
      };
      tier(23.9, BED_Y - .05, 3.0, '#b5814f', '#a97545', 46); tier(26.6, BED_Y - 3.05, 3.0, '#9a6a3e', '#8f6139', 52); tier(29.2, BED_Y - 6.05, 3.0, '#815430', '#774c2f', 58);
      { const n = 72, r0 = 27.9; for (let i = 0; i < n; i++) { const th = i / n * Math.PI * 2, k = Math.abs(((i / 6) % 2) - 1), y = BED_Y - 4.6 + (k - .5) * 1.5; WB.block(Math.cos(th) * r0, y, Math.sin(th) * r0, .55, .55, 1.1, k > .5 ? '#f0c15a' : '#e0a73e', { ry: -th, low: 1, top: '#ffe08a' }); } }
      for (const [r0, y0] of [[25.0, BED_Y - .35], [27.7, BED_Y - 3.35], [30.3, BED_Y - 6.35]]) for (let i = 0; i < 60; i++) { const th = i / 60 * Math.PI * 2; WB.block(Math.cos(th) * r0, y0, Math.sin(th) * r0, .5, .4, 2.6, '#e9b84e', { ry: -th, low: 1, top: '#ffe08a' }); }
      for (let i = 0; i < 48; i++) { const th = i / 48 * Math.PI * 2, r0 = 22.9; WB.block(Math.cos(th) * r0, BED_Y + .12, Math.sin(th) * r0, 1.5, .9, 2.0, '#f1c860', { ry: -th, low: 1, top: '#ffe08a' }); }   // gold collar where the glass meets the wood
      const wood = WB.mesh(material, 'i-base'); wood.receiveShadow = false; globe.add(wood); globe.userData.heavy.push(wood);
      const fill = new T.Group(); [[23.2, 0, 3.0, '#a06d44'], [25.9, 3.0, 3.0, '#8b5e38'], [28.5, 6.0, 3.0, '#744a2e']].forEach(([rr, dy, hh, col]) => { const cy = new T.Mesh(new T.CylinderGeometry(rr, rr, hh, 40), new T.MeshStandardMaterial({ color: col, roughness: .9 })); cy.position.y = BED_Y - .08 - dy - hh / 2; fill.add(cy); }); globe.add(fill); globe.userData.heavy.push(fill);
      // the snow bed the planet is sunk into: a flat disc, lilac-shaded near the planet, with three rings of rounded snow drifts and a few ice-crystal clusters
      const bed = new T.Mesh(new T.CylinderGeometry(22.8, 22.8, .5, 48), new T.MeshStandardMaterial({ color: '#d8d2ee', roughness: .95, emissive: new T.Color('#8c86c0'), emissiveIntensity: .12 })); bed.position.y = BED_Y - .25; globe.add(bed); globe.userData.heavy.push(bed);
      const SB = A.makeBatch(T, roundedBox(T, .2));
      const rings = [[13.6, 22, 2.4, 1.5], [16.6, 28, 2.0, 1.1], [19.6, 22, 1.7, .9], [21.6, 14, 1.4, .6]];
      rings.forEach(([rr, n, sz, hh], ri) => { for (let i = 0; i < n; i++) { const th = (i + (ri % 2) * .5 + (A.hash(i, ri, 12) - .5) * .5) / n * Math.PI * 2, rj = rr + (A.hash(i, ri, 13) - .5) * 1.2, w = sz * (.8 + A.hash(i, ri, 14) * .5), h = hh * (.7 + A.hash(i, ri, 15) * .6);
        const lil = ri < 2 ? '#cfc9ea' : '#e0dcf2'; SB.block(Math.cos(th) * rj, BED_Y + h / 2 - .12, Math.sin(th) * rj, w, h, w * (.8 + A.hash(i, ri, 16) * .4), A.hash(i, ri, 17) < .5 ? lil : '#d9d4ee', { ry: -th + A.hash(i, ri, 18), top: ri < 2 ? '#ebe7f8' : '#f6f2fb', low: .84 }); } });
      for (let c = 0; c < 6; c++) {   // ice-crystal clusters: tall pale-blue prisms with white tips (these also break up the lower half of the planet)
        const th = (c + .35) / 6 * Math.PI * 2 + .2, rr = 15.8 + (c % 3) * 1.7;
        for (let j = 0; j < 4; j++) { const hh = 1.8 + A.hash(c, j, 21) * 3.2 - j * .35, ox = (A.hash(c, j, 22) - .5) * 1.6, oz = (A.hash(c, j, 23) - .5) * 1.6, w = .7 + A.hash(c, j, 24) * .5;
          SB.block(Math.cos(th) * rr + ox, BED_Y + hh / 2 - .1, Math.sin(th) * rr + oz, w, hh, w, j % 2 ? '#8fd2f2' : '#a8def6', { ry: A.hash(c, j, 25) * 3, rz: (A.hash(c, j, 26) - .5) * .28, rx: (A.hash(c, j, 27) - .5) * .28, top: '#eaf8ff', low: .9 }); }
      }
      const bedm = SB.mesh(material, 'i-bed-drifts'); globe.add(bedm); globe.userData.heavy.push(bedm);
    }
    // ---- inner "windscreen": two rainbow arc highlights on a camera-following dome (the camera at spawn is inside the globe), a flash when the sky is tapped ----
    {
      domeMat = new T.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, side: T.BackSide, blending: T.AdditiveBlending, fog: false, uniforms: { uTime: { value: 0 }, uVis: { value: 1 }, uFlash: { value: 0 }, uRoll: { value: 0 } },
        vertexShader: 'varying vec3 vW; void main(){ vW=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `uniform float uTime; uniform float uVis; uniform float uFlash; uniform float uRoll; varying vec3 vW;
          mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
          void main(){ vec3 vd=normalize(mat3(viewMatrix)*normalize(vW)); if(vd.z>0.) discard;
            vec2 q=rot(uRoll+uTime*.02)*vd.xy; vec3 w=vec3(q,vd.z);
            vec3 A1=normalize(vec3(-.85,.55,-.42)), A2=normalize(vec3(.88,-.30,-.40));
            float a1=acos(clamp(dot(w,A1),-1.,1.)), a2=acos(clamp(dot(w,A2),-1.,1.));
            float w1=.020+.05*uFlash, w2=.014+.04*uFlash;
            float b1=smoothstep(w1,0.,abs(a1-.62)), b2=smoothstep(w2,0.,abs(a2-.78));
            b1*=smoothstep(-.4,.3,w.y+.35*w.x); b2*=smoothstep(.45,-.2,w.y-.1*w.x);   // the arcs fade out at their ends
            vec3 c1=.55+.45*cos(6.283*(vec3(0.,.33,.67)+(a1-.62)*18.)), c2=.55+.45*cos(6.283*(vec3(.1,.43,.77)+(a2-.78)*20.));
            float edge=smoothstep(.45,.95,length(vd.xy)/(-vd.z+.0001));   // faint glassy light at the screen edge
            vec3 col=c1*b1*.22+c2*b2*.18+vec3(.85,.80,1.)*edge*.08+vec3(1.,.95,1.)*uFlash*(.10+.35*(b1+b2));
            gl_FragColor=vec4(col*uVis,1.); }` });
      const dome = new T.Mesh(new T.SphereGeometry(300, 32, 20), domeMat); dome.name = 'i-glass-inner'; dome.renderOrder = 4; dome.frustumCulled = false; skyGroup.add(dome);
    }
    // ---- falling snow: ONE Points object (more and bigger flakes in round 2). Flakes fall radially towards the planet; when the camera is inside the globe
    //      (spawn) they fill the view, from outside they stay inside the glass. A tap on the sky kicks them upward. -----------------------------------------
    {
      const n = LOW_POWER ? 200 : 400, pos = new Float32Array(n * 3), seed = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { const yy = 1 - 2 * rng(), az = rng() * Math.PI * 2, rad = Math.sqrt(1 - yy * yy); pos[i * 3] = Math.cos(az) * rad; pos[i * 3 + 1] = yy; pos[i * 3 + 2] = Math.sin(az) * rad; seed[i * 4] = rng(); seed[i * 4 + 1] = rng(); seed[i * 4 + 2] = .5 + rng() * .9; seed[i * 4 + 3] = rng(); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('seed', new T.BufferAttribute(seed, 4));
      snowMat = new T.ShaderMaterial({
        transparent: true, depthWrite: false, fog: false, uniforms: { uTime: { value: 0 }, uScale: { value: 380 }, uR0: { value: R + 1.0 }, uR1: { value: GLOBE_R - 1.6 }, uKick: { value: 0 } },
        vertexShader: `attribute vec4 seed; uniform float uTime; uniform float uScale; uniform float uR0; uniform float uR1; uniform float uKick; varying float vA;varying float vRotation;varying float vStyle;
          void main(){ float t=fract(seed.x+uTime*.014*seed.z); float r=mix(uR1,uR0,t); vec3 d=normalize(position);
            vec3 p=d*(r+uKick*(2.5+6.*seed.y)); p+=vec3(sin(uTime*.5+seed.w*40.),sin(uTime*.37+seed.y*30.)*.5,cos(uTime*.43+seed.w*33.))*.9;
            vec4 mv=modelViewMatrix*vec4(p,1.); float sz=(.2+.22*seed.y)*(1.+uKick*.9)*uScale/max(1.,-mv.z); sz*=mix(.4,1.6,smoothstep(0.,1.,t));gl_PointSize=clamp(sz,2.0,40.);vRotation=seed.w*6.283+uTime*(.15+seed.y*.45)+uKick*(2.+seed.z);vStyle=floor(seed.y*3.); vA=smoothstep(0.,.06,t)*smoothstep(1.,.93,t); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `varying float vA;varying float vRotation;varying float vStyle;${YayaIAtmosphere.SNOW_GLSL} void main(){vec2 p=gl_PointCoord-.5;float a=snowflake(p,vRotation,vStyle)*vA;if(a<.01)discard;gl_FragColor=vec4(mix(vec3(.82,.9,1.),vec3(1.),(1.-smoothstep(0.,.3,length(p)))),a*.9);}`, 
      });
      const pts = new T.Points(g, snowMat); pts.name = 'i-snow'; pts.frustumCulled = false; pts.renderOrder = 10; root.add(pts);
    }
    // ---- aurora: three additive ribbons high in the sky (follow the camera with the sky group) ---------------------------------------
    const auroraMats = [];
    {
      const defs = [{ az0: -78, az1: -12, el: 20, h: 26, seed: 0 }, { az0: 4, az1: 74, el: 16, h: 30, seed: 1.7 }, { az0: 120, az1: 215, el: 22, h: 24, seed: 3.1 }];
      defs.forEach((d, idx) => {
        const seg = 48, pos = [], uv = [], ind = [], rad = 330;
        for (let i = 0; i <= seg; i++) for (let j = 0; j <= 1; j++) {
          const u = i / seg, az = (d.az0 + (d.az1 - d.az0) * u) * DEG, el = (d.el + j * d.h + 4 * Math.sin(u * 5 + d.seed)) * DEG;
          pos.push(Math.sin(az) * Math.cos(el) * rad, Math.sin(el) * rad, -Math.cos(az) * Math.cos(el) * rad); uv.push(u, j);
        }
        for (let i = 0; i < seg; i++) { const a = i * 2; ind.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(ind);
        const m = new T.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, side: T.DoubleSide, uniforms: { uTime: { value: 0 }, uSeed: { value: d.seed },uBright:{value:1} },
          vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
          fragmentShader: `uniform float uTime; uniform float uSeed; uniform float uBright; varying vec2 vUv;
            void main(){ float u=vUv.x, v=vUv.y;
              float rays=.55+.45*sin(u*70.+sin(u*9.+uTime*.35+uSeed)*2.6+uTime*.5);
              float body=smoothstep(.0,.18,v)*smoothstep(1.,.45,v); float edge=smoothstep(.0,.08,u)*smoothstep(1.,.92,u);
              vec3 low=vec3(.20,.90,.55), mid=vec3(1.,.45,.80), hi=vec3(.50,.36,1.);
              vec3 col=mix(low,mid,smoothstep(.15,.6,v)); col=mix(col,hi,smoothstep(.5,1.,v));
              float wob=.75+.25*sin(u*5.+uTime*.25+uSeed*3.);
              float a=body*edge*rays*wob*.62*uBright; gl_FragColor=vec4(col,a); }` });
        const mesh = new T.Mesh(g, m); mesh.name = 'i-aurora-' + idx; mesh.frustumCulled = false; mesh.renderOrder = 1; skyGroup.add(mesh); auroraMats.push(m);
      });
    }

    // The three aurora strips share one shader; their original phase travels per vertex.
    {const strips=skyGroup.children.filter(o=>/^i-aurora-/.test(o.name)),P=[],U=[],S=[];
      for(const o of strips){const g=o.geometry.toNonIndexed();for(let i=0;i<g.attributes.position.count;i++){P.push(g.attributes.position.getX(i),g.attributes.position.getY(i),g.attributes.position.getZ(i));U.push(g.attributes.uv.getX(i),g.attributes.uv.getY(i));S.push(o.material.uniforms.uSeed.value);}skyGroup.remove(o);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setAttribute('auroraSeed',new T.Float32BufferAttribute(S,1));
      const m=auroraMats[0];m.vertexShader='attribute float auroraSeed;varying float vSeed;'+m.vertexShader.replace('vUv=uv;','vUv=uv;vSeed=auroraSeed;');m.fragmentShader=m.fragmentShader.replace('uniform float uSeed;','varying float vSeed;').replaceAll('uSeed','vSeed');m.needsUpdate=true;
      const me=new T.Mesh(g,m);me.name='i-aurora-batch';me.frustumCulled=false;me.renderOrder=1;skyGroup.add(me);auroraMats.splice(0,auroraMats.length,m);}

    // ---- NPC / companion animation -------------------------------------------------------------------------------------------------
    const peng = c.orchard?.granny; let beanieDone = false;
    function addUnicornBeanie() {   // a tiny knitted beanie on Xingduo (best effort: finds the guide's head group)
      const ug = window.__yaya?.unicornGuide; if (!ug || beanieDone) return;
      const g = ug.group || ug.root || ug.obj || null; if (!g) return;
      let head = null; g.traverse(o => { if (!head && /head/i.test(o.name || '')) head = o; }); if (!head) return;
      const hb = A.makeBatch(T, roundedBox(T, .1)); hb.block(0, 0, 0, .46, .15, .42, '#e24f6e', { top: '#f27a92' }); hb.block(0, .12, 0, .38, .14, .34, '#f0617f', { top: '#ff90a6' }); hb.block(0, .24, 0, .12, .1, .12, '#ffffff');
      const m = hb.mesh(material, 'i-unicorn-beanie'); m.position.set(0, .42, -.02); head.add(m); beanieDone = true;
    }
    const sparkles = [];
    function sparkleBurst(worldPos) { /* art preview: no quest feedback */ }
    function wrongFeedback(worldPos) { }
    // tap on the sky -> the snow puffs upward and the shell highlight flashes (cheap: two uniforms)
    let cloudsHid = false, flash = 0, kick = 0, tapAt = null, tapHooked = false, rollAcc = 0, lastFwd = null;
    const ray = new T.Raycaster(), ndc = new T.Vector2(), ctr = new V3(0, 0, 0), hitP = new V3();
    function hookTaps() {
      const cv = document.querySelector('canvas'); if (!cv || tapHooked) return; tapHooked = true;
      cv.addEventListener('pointerdown', e => { tapAt = { x: e.clientX, y: e.clientY, t: performance.now() }; }, true);
      cv.addEventListener('pointerup', e => {
        if (!tapAt) return; const dt = performance.now() - tapAt.t, mv = Math.hypot(e.clientX - tapAt.x, e.clientY - tapAt.y); tapAt = null; if (dt > 450 || mv > 12) return;
        const cam = c.camera || window.__yaya?.camera; if (!cam) return; const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, cam); const hit = ray.ray.intersectSphere(new T.Sphere(ctr, SURF + 2.2), hitP);
        if (!hit) { flash = 1; kick = 1; shakeInput?.(); }   // the ray misses the planet and its props: that is the sky
      }, true);
    }
    window.__iSkyTap = () => { flash = 1; kick = 1; };   // test hook (same effect as tapping the sky)
    let expDone = false;let night=0,nightTarget=0,shakeInput=null; const nightLights=[];scene.traverse(o=>{if(o.isDirectionalLight||o.isHemisphereLight)nightLights.push([o,o.intensity]);});
    function update(dt, time, state) {
      hookTaps(); skySpin.value=time;
      night+=(nightTarget-night)*Math.min(1,dt*.75);
      if(sky)sky.material.uniforms.iNight.value=night;
      nightLights.forEach(([light,intensity])=>light.intensity=intensity*(1-.38*night));
      cloudMat.color.setRGB(1-.58*night,1-.56*night,1-.38*night);
      auroraMats.forEach(m=>m.uniforms.uBright.value=1+night*1.2);
      family.forEach((f,i)=>{f.root.visible=nightTarget>0;f.body.rotation.z=Math.sin(time*3+i)*.12;f.body.position.y=Math.abs(Math.sin(time*3+i))*.16;f.head.rotation.z=Math.sin(time*2+i)*.10;});
      family.forEach(f=>f.root.updateMatrixWorld(true));
      familyBatches.forEach(({mesh,originals})=>{mesh.visible=nightTarget>0;originals.forEach((m,i)=>mesh.setMatrixAt(i,m.matrixWorld));mesh.instanceMatrix.needsUpdate=true;});
      updateParticles(dt);atmosphere.update(dt,time,nightTarget);giftStand.visible=gift.visible;
      if(shaking>0){shaking=Math.max(0,shaking-dt);flash=.7+.3*Math.sin(time*20);kick=.8;globe.rotation.z=Math.sin(time*18)*.018*shaking;}else globe.rotation.z=0;

      if (!expDone && window.__yaya?.renderer) { window.__yaya.renderer.toneMappingExposure = .76; expDone = true; }   // R3: reduced exposure; only I changes its grade
      const cam = c.camera || window.__yaya?.camera, cd = cam ? cam.position.length() : 30;
      if(cam)updateHorizon(cam);
      if(cam){const wp=new V3();for(const cloud of clouds.children){const full=cloud.userData.fullCloudGeometry;if(full?.userData.distantGeometry){const centers=cloud.userData.cloudCenters;const distance=centers?Math.min(...centers.map(p=>wp.copy(p).applyMatrix4(clouds.matrixWorld).distanceTo(cam.position))):cloud.getWorldPosition(wp).distanceTo(cam.position);cloud.geometry=distance>36?full.userData.distantGeometry:full;}}}
      if (cd > 46 && clouds.visible) { clouds.visible = false; cloudsHid = true; } else if (cd <= 46 && cloudsHid) { clouds.visible = true; cloudsHid = false; }
      flash = Math.max(0, flash - dt * 1.6); kick = Math.max(0, kick - dt * 1.1);
      const inside = 1 - smooth(31, 40, cd);   // 1 = camera at spawn distance (inside the globe), 0 = zoomed out (shell visible from outside)
      snowMat.uniforms.uTime.value = time; for (const m of auroraMats) m.uniforms.uTime.value = time;
      snowMat.uniforms.uKick.value = Math.sin(Math.min(1, kick) * Math.PI * .5) * kick; snowMat.uniforms.uR1.value = GLOBE_R - 1.6 + inside * 9.0;
      const gu = globe.userData.glass.uniforms; gu.uTime.value = time; gu.uVis.value = 1 - inside; gu.uFlash.value = flash;
      if (shellRef) shellRef.visible = inside < .995;   // no vertex work at all while the camera is inside the globe (the shell would be discarded anyway)
      if (cam) { const f = cam.getWorldDirection(new V3()); if (lastFwd) rollAcc += Math.atan2(f.x * lastFwd.z - f.z * lastFwd.x, f.x * lastFwd.x + f.z * lastFwd.z) * .35; lastFwd = f; }
      domeMat.uniforms.uTime.value = time; domeMat.uniforms.uVis.value = inside; domeMat.uniforms.uFlash.value = flash; domeMat.uniforms.uRoll.value = rollAcc;
      snowMat.uniforms.uScale.value = (window.innerHeight || 800) * .5 * (window.devicePixelRatio > 1.5 ? 1.2 : 1);
      skyPlanets.forEach((m, i) => m.rotation.y += dt * (.015 + i * .003));
      oldBirds.forEach(g => g.visible = false);
      if (peng && !peng.root.userData.riding) { const s = Math.sin(time * 1.3); peng.body.rotation.z = (nightTarget ? .14 : .035) * Math.sin(time * (nightTarget?3:.9)); peng.body.scale.y = 1 + .012 * s; peng.head.rotation.z = .07 + .03 * Math.sin(time * .7); peng.head.rotation.x = .04 + .02 * Math.sin(time * 1.1); }
      if (!beanieDone && time > 1) addUnicornBeanie();
      flakes.forEach((f, i) => { f.rotation.z = time * .45 * (i ? -1 : 1); f.position.y = 1.86 + .06 * Math.sin(time * 1.6 + i); f.updateMatrix();flakeInstances.setMatrixAt(i,f.matrix); });flakeInstances.instanceMatrix.needsUpdate=true;
      { const cp = cam ? cam.position : null; if (cp) { const vis = cp.length() > 34 || cp.y < 3; for (const m of globe.userData.heavy) if (m.visible !== vis) m.visible = vis; } }
      if (state) localSky.quaternion.slerp(skyQ.setFromUnitVectors(skyUp, state.dir), 1 - Math.exp(-Math.min(dt, .1) * 3));
    }
    // ---- the stone pedestal of the stage, ice-and-snow edition (done last): ice-blue pillars, snowflake-shaped block tops instead of the gold stars, a white layer on the slab ----
    const flakes = [];
    {
      const sg = STAGE.group, ice = new T.MeshLambertMaterial({ color: '#8fcbf0' }), iceCap = new T.MeshLambertMaterial({ color: '#e6f4fd' }), slabM = new T.MeshLambertMaterial({ color: '#c3dcf2' });
      sg.children.slice().forEach(m => {
        if (!m.isMesh || !m.geometry || m.geometry.type !== 'BoxGeometry') return; const q = m.geometry.parameters;
        if (Math.abs(q.height - 1.4) < .01) m.material = ice; else if (Math.abs(q.height - .12) < .01) m.material = iceCap; else if (Math.abs(q.width - 4.2) < .01 || Math.abs(q.width - 3.0) < .01) m.material = slabM;
      });
      (STAGE.stars || []).forEach(st => { st.visible = false; });
      const WH = '#fbf7f2';
      for (const side of [-1, 1]) {   // snowflake: three crossed bars + a block at each arm tip + a centre block (faces the spawn camera)
        const fb = A.makeBatch(T, box);
        for (let k = 0; k < 3; k++) { const an = k * Math.PI / 3; fb.block(0, 0, 0, .76, .13, .13, '#ffffff', { rz: an, top: '#ffffff', low: 1 }); for (const sg2 of [-1, 1]) fb.block(Math.cos(an) * sg2 * .34, Math.sin(an) * sg2 * .34, 0, .16, .16, .16, '#d9f0ff', { top: '#ffffff', low: 1 }); }
        fb.block(0, 0, 0, .2, .2, .2, '#bfe6ff', { top: '#ffffff', low: 1 });
        const fm = fb.mesh(material, 'i-stage-snowflake'); fm.position.set(side * 2.45, 1.86, -.5); fm.castShadow = true; sg.add(fm); flakes.push(fm);
      }
      const SGB = A.makeBatch(T, box), TOP = STAGE.top;   // snow layer: a thick white rim round the slab top (the middle stays free for the letter groove) and on the step
      SGB.block(0, TOP + .045, -.74, 4.2, .09, .34, WH, { top: '#ffffff', low: .9 }); SGB.block(0, TOP + .045, .74, 4.2, .09, .34, WH, { top: '#ffffff', low: .9 });
      SGB.block(-1.92, TOP + .045, 0, .36, .09, 1.2, WH, { top: '#ffffff', low: .9 }); SGB.block(1.92, TOP + .045, 0, .36, .09, 1.2, WH, { top: '#ffffff', low: .9 });
      SGB.block(0, TOP / 2 + .02 + .04, 1.25, 3.0, .08, .3, WH, { top: '#ffffff', low: .9 });
      for (const sx of [-1, 1]) SGB.block(sx * 2.45, 1.54, -.5, .66, .08, .66, WH, { top: '#ffffff', low: .9 });   // snow on the pillar caps
      const sm = SGB.mesh(material, 'i-stage-snow'); sm.receiveShadow = true; sg.add(sm);
    }
    // The six original stage boxes share one vertex-colour draw. Their hidden
    // originals remain in STAGE for the existing surface raycasts.
    const stageBoxes=STAGE.group.children.filter(m=>m.isMesh&&m.geometry?.type==='BoxGeometry');
    const sb=A.makeBatch(T,new T.BoxGeometry(1,1,1));
    for(const m of stageBoxes){m.updateMatrix();const p=m.geometry.parameters,mat=m.matrix.clone().multiply(new T.Matrix4().makeScale(p.width,p.height,p.depth));sb.matrix(mat,'#'+m.material.color.getHexString(),{plain:true,low:1});m.visible=false;}
    const stageMerged=sb.mesh(new T.MeshLambertMaterial({vertexColors:true}),'i-stage-boxes-batch');stageMerged.castShadow=true;stageMerged.receiveShadow=true;stageMerged.userData.kind='ground';STAGE.group.add(stageMerged);
    const flakeInstances=new T.InstancedMesh(flakes[0].geometry,flakes[0].material,flakes.length);flakeInstances.name='i-stage-snowflake-pair';flakeInstances.castShadow=true;flakeInstances.frustumCulled=false;STAGE.group.add(flakeInstances);flakes.forEach(f=>{f.visible=false;});
    const answerDirs = [P(-3.9, -3.7), P(3.9, -3.7), P(6.0, -.6)];
    const routePoints = [P(.6, -9.5), P(-.4, -7.2), P(-2.2, -5.6), P(-3.9, -3.7)]; const trailPts = routePoints.slice();
    const overview = (aspect = 1) => { const dist = aspect < .8 ? 118 : 92; const focus = new V3(0, 1, 0); return { focus, position: new V3(0, 12 + dist * .14, dist), up: new V3(0, 1, 0), lift: 1, zoom: 1, ahead: 0 }; };
    function iceSurfaceRadius(dir,ground){
      let best=0,dot=-1;slideFloors.forEach((f,k)=>{const score=f.dir.dot(dir);if(score>dot){dot=score;best=k;}});
      if(dot<Math.cos(8.5/SURF))return ground;
      let hit=null;for(let j=-1;j<=1;j++){const f=slideFloors[(best+j+slideFloors.length)%slideFloors.length],r=f.top/f.dir.dot(dir),pt=dir.clone().multiplyScalar(r).addScaledVector(f.dir,-f.top);if(Math.abs(pt.dot(f.right))<=1.06&&Math.abs(pt.dot(f.forward))<=.26)hit=Math.max(hit||0,r);}
      if(hit===null)for(const f of terraceFloors){if(f.dir.dot(dir)<Math.cos(8.5/SURF))continue;const r=f.top/f.dir.dot(dir),pt=dir.clone().multiplyScalar(r).addScaledVector(f.dir,-f.top);if(Math.abs(pt.dot(f.right)-f.x)<.47&&Math.abs(pt.dot(f.forward))<.265)hit=Math.max(hit||0,r);}
      return hit===null?ground:hit;
    }
    c.setSurfaceOverride?.((dir,ground)=>{let h=iceSurfaceRadius(dir,ground);
      for(const pad of [parking,...explorationSites]){if(!pad.top||pad.dir.dot(dir)<.9)continue;const r=pad.top/pad.dir.dot(dir),v=dir.clone().multiplyScalar(r).applyMatrix4(pad.frame.clone().invert());if(Math.abs(v.x)<pad.rx&&Math.abs(v.z)<pad.rz)h=Math.max(h,r);else for(const st of pad.steps||[])if(Math.abs(v.x)<st.rx&&Math.abs(v.z)<st.rz){h=Math.max(h,st.top/pad.dir.dot(dir));break;}}
      return h;});
    const trackPoints=slide.pts.map((_,i)=>slide.pts[(i+archK)%slide.M]);trackPoints.push(trackPoints[0].clone());
    const slideTrack={points:trackPoints,lanes:3,laneOffsets:[-.7,0,.7],length:slide.len,stops:[.13,.30,.47,.64,.81].map(f=>Math.round(f*slide.M))};
    function setHouse(n){
      houseLayers=Math.max(0,Math.min(5,n));
      if(!houseMeshes[houseLayers]){
        const b=A.makeBatch(T,box);b.setBase(houseFrame);
        const keep=houseKeep.map((v,k)=>k<Math.ceil(houseRings*houseLayers/5)?Math.PI:v);
        A.igloo(b,{r:L.half.r,rings:houseRings,seed:11,keep});
        const m=b.mesh(material,'i-home-'+houseLayers);root.add(m);houseMeshes[houseLayers]=m;
      }
      houseMeshes.forEach((m,i)=>m.visible=i===houseLayers);
    }
    // A small, level snow doorstep keeps all four dancers above the lake-edge snow.
    const porchBatch=A.makeBatch(T,box);porchBatch.setBase(houseFrame);
    porchBatch.block(0,-.14,L.half.r+.72,4.1,.28,1.65,'#c9d8ef',{top:'#e7eefb'});
    porchBatch.block(0,-.34,L.half.r+1.62,4.35,.22,.65,'#b9cbea',{top:'#dce8f8'});
    const familyPorch=porchBatch.mesh(material,'i-family-doorstep');familyPorch.visible=false;root.add(familyPorch);
    const family=[];
    function placeFamilyMember(p,x){
      p.position.set(x,.035,L.half.r+.82).applyMatrix4(houseFrame);
      p.quaternion.setFromRotationMatrix(houseFrame);
    }
    for(let i=0;i<3;i++){
      const f=A.penguin(T);f.root.name='i-family-'+i;
      f.root.scale.setScalar(i===0?.60:.37);placeFamilyMember(f.root,[-.40,.52,1.28][i]);
      f.root.visible=false;root.add(f.root);family.push(f);
      f.root.traverse(o=>{if(o.isMesh)o.castShadow=false;});
    }
    // The three relatives share exactly the same meshes and material; only their
    // transforms differ. Keep the original body/head pivots for the dance.
    const familyBatches = ['i-bingbing-body','i-bingbing-head'].map(name => {
      const originals=family.map(f=>f.root.getObjectByName(name)),first=originals[0];
      const mesh=new T.InstancedMesh(first.geometry,first.material,originals.length);
      mesh.name='i-family-batch-'+name;mesh.visible=false;mesh.frustumCulled=false;
      originals.forEach(m=>m.visible=false);root.add(mesh);return {mesh,originals};
    });
        const gift=c.orchard.pie;gift.position.copy(STAGE.group.localToWorld(new V3(0,STAGE.top+.3,0)));orient(gift,STAGE.center,STAGE.front);
    // Mini snow globe, built from the owner's design: a three-tier wooden base with a gold riveted band and a snowflake plaque,
    // a paved snow floor, a big brick igloo with a glowing door, Bingbing in a blue beanie, a blocky snowy pine with a gold star,
    // a lantern and bunting. Door, lantern and star glow (unlit batch); the glass is iridescent.
    const gb=A.makeBatch(T,box),glow=A.makeBatch(T,box),TAU=Math.PI*2;
    // round tiers come from a separate cylinder batch (rotated boxes leave star-shaped corners)
    const cyl=A.makeBatch(T,new T.CylinderGeometry(.5,.5,1,24)),poly=(y,w,h,col,o={},x=0,z=0)=>cyl.block(x,y,z,w,h,w,col,o);
    // thin seams on each face of an n-gon of width w
    const seams=(b,y,w,h,col,n=16,off=.5,skip,x=0,z=0)=>{for(let k=0;k<n;k++){const a=(k+off)*TAU/n;if(skip&&skip(a))continue;b.block(x+Math.sin(a)*w/2,y,z+Math.cos(a)*w/2,.008,h,.006,col,{plain:true,ry:a});}};
    const front=a=>Math.cos(a)>.93;   // keep the plaque face clear
    // wooden base: bottom tier, banded middle tier, upper tier, dark rim under the snow
    poly(.05,1.10,.10,'#8a5a3b',{top:'#a06b47',low:.8});seams(gb,.05,1.105,.085,'#5e3a26');
    poly(.16,1.02,.12,'#80523a',{top:'#96633f'});seams(gb,.16,1.025,.10,'#5a3825',16,.5,front);
    poly(.163,1.05,.06,'#e8bd52',{top:'#f5d47a'});
    for(let k=0;k<16;k++){const a=(k+.5)*TAU/16;if(front(a))continue;gb.block(Math.sin(a)*.528,.163,Math.cos(a)*.528,.032,.032,.018,'#fbe08a',{ry:a});}
    poly(.26,.94,.08,'#8f5e3f',{top:'#a87450'});seams(gb,.26,.945,.065,'#62402b');
    poly(.325,.88,.05,'#6a432e',{top:'#7d5038'});
    // snowflake plaque on the front of the band
    gb.block(0,.165,.52,.25,.15,.03,'#f4f7fd');gb.block(0,.165,.537,.21,.11,.008,'#a9c4e6',{plain:true});
    for(const r of [0,Math.PI/3,-Math.PI/3]){gb.block(0,.165,.543,.085,.012,.005,'#ffffff',{plain:true,rz:r+Math.PI/2});
      for(const s of [-1,1]){const x=Math.cos(r+Math.PI/2)*.028*s,y=Math.sin(r+Math.PI/2)*.028*s;gb.block(x,.165+y,.543,.024,.007,.005,'#ffffff',{plain:true,rz:r});}}
    // snow floor (top at .45), paved: radial joints and an inner ring joint
    poly(.40,.84,.10,'#e3e9f5',{top:'#f6f8fd',low:.82});seams(gb,.40,.845,.09,'#c4cfe3');
    for(let k=0;k<12;k++){const a=k*TAU/12;gb.block(Math.sin(a)*.33,.451,Math.cos(a)*.33,.006,.004,.16,'#d2dbec',{plain:true,ry:a});
      gb.block(Math.sin(a+TAU/24)*.25,.451,Math.cos(a+TAU/24)*.25,.13,.004,.006,'#d2dbec',{plain:true,ry:a+TAU/24});}
    // big brick igloo: six stepped rows of 12-sided rings with staggered joints, a cap, and an arched entrance
    const ix=-.15,iz=-.05,F=.45,rows=[.48,.455,.42,.37,.30,.21];
    rows.forEach((w,k)=>{const y=F+.031+k*.062,col=k%2?'#e9eff9':'#dde6f4';
      poly(y,w,.06,col,{top:'#f5f8fd',low:.84},ix,iz);seams(gb,y,w+.004,.056,'#b9c7e0',12,k%2?0:.5,null,ix,iz);});
    poly(F+.395,.14,.05,'#eef3fb',{top:'#ffffff'},ix,iz);
    const ez=iz+.265,ec=F+.085;   // entrance tunnel: a box below a lying cylinder gives a round arch, with brick joints and a glowing door
    gb.block(ix,F+.042,ez-.03,.2,.085,.13,'#e4ebf7');
    cyl.block(ix,ec,ez-.03,.2,.13,.2,'#e4ebf7',{rx:Math.PI/2});
    for(let k=0;k<5;k++){const a=-Math.PI/2+k*Math.PI/4;gb.block(ix+Math.sin(a)*.09,ec+Math.cos(a)*.09,ez+.036,.006,.036,.004,'#b9c7e0',{plain:true,rz:-a});}
    for(const s of [-1,1])gb.block(ix+s*.08,F+.035,ez+.036,.04,.006,.004,'#b9c7e0',{plain:true});
    glow.block(ix,F+.045,ez+.037,.1,.09,.006,'#ffb24a',{plain:true});glow.block(ix,ec+.015,ez+.037,.078,.05,.006,'#ffb24a',{plain:true});glow.block(ix,ec+.048,ez+.037,.044,.02,.006,'#ffb24a',{plain:true});
    glow.block(ix,F+.06,ez+.041,.055,.075,.004,'#ffe39a',{plain:true});
    // Bingbing: chibi penguin, blue beanie with a pom, red scarf, big eyes, rosy cheeks
    const bx=.075,bz=.17,nv='#24304f';
    for(const s of [-1,1])gb.block(bx+s*.04,F+.012,bz+.045,.06,.024,.07,'#f2a03c');
    gb.block(bx,F+.09,bz,.19,.15,.16,nv);gb.block(bx,F+.08,bz+.075,.135,.12,.02,'#f7f3ea');
    for(const s of [-1,1])gb.block(bx+s*.103,F+.095,bz,.035,.11,.08,nv,{rz:s*.3});
    gb.block(bx,F+.205,bz,.21,.13,.165,nv);gb.block(bx,F+.195,bz+.078,.165,.095,.015,'#f7f3ea',{plain:true});
    for(const s of [-1,1]){gb.block(bx+s*.038,F+.205,bz+.087,.036,.044,.006,'#15161d',{plain:true});gb.block(bx+s*.038-.008,F+.214,bz+.091,.012,.012,.004,'#ffffff',{plain:true});
      gb.block(bx+s*.066,F+.175,bz+.087,.028,.014,.004,'#f3a0a6',{plain:true});}
    gb.block(bx,F+.18,bz+.09,.032,.02,.022,'#f2a03c');
    gb.block(bx,F+.152,bz,.215,.035,.175,'#d9473f');gb.block(bx+.05,F+.105,bz+.09,.038,.08,.014,'#d9473f');
    for(const s of [-1,0,1])gb.block(bx+.05+s*.012,F+.062,bz+.09,.006,.014,.012,'#d9473f',{plain:true});
    gb.block(bx,F+.272,bz,.205,.032,.17,'#355f9f');for(let k=-3;k<=3;k++)gb.block(bx+k*.026,F+.272,bz+.086,.005,.028,.004,'#2b4f88',{plain:true});
    gb.block(bx,F+.305,bz,.17,.045,.145,'#4277c2',{top:'#4f86d0'});gb.block(bx,F+.335,bz,.11,.025,.1,'#4277c2');gb.block(bx,F+.36,bz,.05,.045,.05,'#ffffff');
    // blocky snowy pine with a gold star
    const tx=.25,tz=-.13;gb.block(tx,F+.07,tz,.075,.14,.075,'#8a5a3c');
    const ty=[[.23,.09,'#3f8f6e'],[.18,.085,'#4a9c78'],[.13,.075,'#56a983']].reduce((y,[w,h,c])=>{gb.block(tx,y+h/2,tz,w,h,w,c);gb.block(tx,y+h+.014,tz,w-.012,.03,w-.012,'#f2f5fc',{top:'#ffffff'});return y+h+.028;},F+.14);
    gb.block(tx,ty+.02,tz,.085,.04,.085,'#f2f5fc',{top:'#ffffff'});
    const sy=ty+.085;for(let k=0;k<5;k++){const a=k*TAU/5;glow.block(tx+Math.sin(a)*.018,sy+Math.cos(a)*.018,tz,.02,.04,.02,'#ffcf3e',{rz:-a});}glow.block(tx,sy,tz,.035,.035,.022,'#ffcf3e');
    // lantern on a post
    const lx=.33,lz=.11;gb.block(lx,F+.09,lz,.026,.18,.026,'#6b4430');gb.block(lx,F+.17,lz,.06,.012,.06,'#5a3826');
    for(const [dx,dz] of [[-1,-1],[-1,1],[1,-1],[1,1]])gb.block(lx+dx*.026,F+.21,lz+dz*.026,.01,.07,.01,'#5a3826',{plain:true});
    glow.block(lx,F+.21,lz,.048,.065,.048,'#ffd27a',{plain:true});gb.block(lx,F+.252,lz,.075,.018,.075,'#5a3826');gb.block(lx,F+.268,lz,.03,.014,.03,'#5a3826');
    // bunting from the igloo's shoulder to the pine
    const fa=new V3(ix+.1,F+.40,iz+.02),fb=new V3(tx-.06,F+.39,tz+.04),fc=['#d9504a','#3fa79c','#f0c048','#d9504a'];
    for(let k=0;k<=8;k++){const t=k/8,p=fa.clone().lerp(fb,t);p.y-=Math.sin(Math.PI*t)*.035;gb.block(p.x,p.y,p.z,.03,.005,.005,'#5a4a5e',{plain:true,ry:-.15});}
    for(let k=0;k<4;k++){const t=(k+.6)/4.4,p=fa.clone().lerp(fb,t);p.y-=Math.sin(Math.PI*t)*.035;
      [[.056,.017],[.038,.017],[.02,.017]].forEach(([w,h],j)=>gb.block(p.x,p.y-.01-j*.017,p.z,w,h,.006,fc[k],{plain:true,ry:-.15}));}
    gift.add(cyl.mesh(material,'i-mini-globe-tiers'));gift.add(gb.mesh(material,'i-mini-globe-village'));
    gift.add(glow.mesh(new T.MeshBasicMaterial({vertexColors:true,toneMapped:false}),'i-mini-globe-glow'));   // unlit, so door, lantern and star glow at night
    // An ice display stand under the globe fills the altar's letter groove; it stays put while the globe flies to the camera.
    const standB=A.makeBatch(T,box);for(let k=0;k<2;k++)standB.block(0,-.16,0,1.14,.3,1.14,'#cfdcef',{top:'#eef3fb',ry:k*Math.PI/4});const giftStand=standB.mesh(material,'i-mini-globe-stand');
    giftStand.position.copy(gift.position);giftStand.quaternion.copy(gift.quaternion);giftStand.visible=false;scene.add(giftStand);
    const glassMat=new T.ShaderMaterial({transparent:true,depthWrite:false,
      vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying vec3 vN;varying vec3 vV;void main(){vec3 n=normalize(vN);float f=pow(1.-abs(dot(n,normalize(vV))),2.2);vec3 rb=.6+.4*cos(6.2832*(f*1.3+n.y*.25+vec3(0.,.33,.67)));float g=.75*smoothstep(.90,.965,dot(n,normalize(vec3(-.5,.62,.6))))+.4*smoothstep(.975,.99,dot(n,normalize(vec3(.55,-.15,.82))));gl_FragColor=vec4(mix(mix(vec3(.86,.9,1.),rb,.55*f),vec3(1.),g),.04+f*.6+g*.7);}'});
    const gs=new T.Mesh(new T.SphereGeometry(.49,32,20),glassMat);gs.name='i-mini-globe-glass';gs.position.y=.71;gift.add(gs);gift.visible=false;
    const familyLight=new T.Mesh(new T.PlaneGeometry(1.3,1.2),new T.MeshBasicMaterial({color:'#ffd891',transparent:true,opacity:.82,side:T.DoubleSide,depthWrite:false}));
    familyLight.position.set(0,.60,L.half.r-.2).applyMatrix4(houseFrame);familyLight.quaternion.setFromRotationMatrix(houseFrame);familyLight.visible=false;root.add(familyLight);
    function setNight(instant=false){
      setHouse(5);nightTarget=1;placeFamilyMember(peng.root,-1.42);
      if(instant)night=1;familyPorch.visible=true;familyLight.visible=true;
      family.forEach(f=>f.root.visible=true);gift.visible=instant;
    }
    let shaking=0;function celebrate(){shaking=3;flash=kick=1;}
    // All celebration chips share one instanced draw, including existing shared app bursts.
    const chipBox=new T.BoxGeometry(.12,.12,.12).toNonIndexed(),chipQuad=new T.PlaneGeometry(.42,.42).toNonIndexed(),chipGeo=new T.BufferGeometry();
    for(const key of ['position','normal','uv']){const a=chipBox.attributes[key],b=chipQuad.attributes[key],out=new Float32Array(a.array.length+b.array.length);out.set(a.array);out.set(b.array,a.array.length);chipGeo.setAttribute(key,new T.BufferAttribute(out,a.itemSize));}
    chipGeo.setAttribute('flakePart',new T.Float32BufferAttribute([...Array(chipBox.attributes.position.count).fill(0),...Array(chipQuad.attributes.position.count).fill(1)],1));
    const chipMat=new T.MeshBasicMaterial({transparent:true,depthWrite:false,side:T.DoubleSide});
    chipMat.onBeforeCompile=sh=>{sh.vertexShader='attribute float flakePart;varying float vFlakePart;varying float vWhite;varying vec2 vFlakeUV;\n'+sh.vertexShader;
      sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFlakePart=flakePart;vFlakeUV=uv;vWhite=step(.65,min(instanceColor.r,min(instanceColor.g,instanceColor.b)))*step(max(instanceColor.r,max(instanceColor.g,instanceColor.b))-min(instanceColor.r,min(instanceColor.g,instanceColor.b)),.32);');
      sh.fragmentShader='varying float vFlakePart;varying float vWhite;varying vec2 vFlakeUV;\n'+YayaIAtmosphere.SNOW_GLSL+sh.fragmentShader;
      sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif(abs(vWhite-vFlakePart)>.5)discard;if(vWhite>.5){float alpha=snowflake(vFlakeUV-.5,0.,1.);if(alpha<.02)discard;diffuseColor.a*=alpha;}');};chipMat.customProgramCacheKey=()=> 'i-snowflake-chips-v92';
    const particleMesh=new T.InstancedMesh(chipGeo,chipMat,120);particleMesh.name='i-snow-bursts';particleMesh.frustumCulled=false;particleMesh.count=0;root.add(particleMesh);const chips=[];const pm=new T.Matrix4(),pc=new T.Color();
    function particleBurst(pos,color,count=16,power=1){const up=pos.clone().normalize();for(let i=0;i<Math.min(count,28);i++){if(chips.length>=120)chips.shift();const v=new V3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(power*4).addScaledVector(up,power*2);chips.push({p:pos.clone(),v,life:1.1,c:new T.Color(color)});}}
    function updateParticles(dt){for(let i=chips.length-1;i>=0;i--){const p=chips[i];p.life-=dt;if(p.life<=0){chips.splice(i,1);continue;}p.v.addScaledVector(p.p.clone().normalize(),-dt*3);p.p.addScaledVector(p.v,dt);pm.compose(p.p,(c.camera||window.__yaya?.camera)?.quaternion||new T.Quaternion(),new V3(p.life,p.life,p.life));particleMesh.setMatrixAt(i,pm);particleMesh.setColorAt(i,p.c);}particleMesh.count=chips.length;particleMesh.visible=chips.length>0;particleMesh.instanceMatrix.needsUpdate=true;if(particleMesh.instanceColor)particleMesh.instanceColor.needsUpdate=true;}
    const api = { onBoat: () => false, root, atmosphere, parking, routePoints, trailPts, answerDirs, sparkleBurst, wrongFeedback, propMap: new Map(), fauna: [], landmarks, update, globe: { group: globe, glass: globe.userData.glass, radius: GLOBE_R, floorY: FLOOR_Y },
      turtle: { overview }, slide: { pts: slide.pts, archK: () => archK }, slideTrack, home: {frame:houseFrame,dir:landmarks.halfIgloo.dir}, setHouse, setNight, celebrate, burst:particleBurst, setShakeInput:fn=>{shakeInput=fn}, trees: [], snapshot: () => ({ version: 'i-world-phase2', houseLayers, night:nightTarget, radius: R, trees: treeSpots.length, slideLength: slide.len }), complete() { habitat?.complete(); },
      createCrystal: (label, col) => window.YayaRound3.createCrystal(T, label, col), setDry() { } };
    return api;
  }
  window.YayaPlanetIWorld = { create };
})();
