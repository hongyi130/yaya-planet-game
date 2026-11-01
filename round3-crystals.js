/* Round 4 answer / teaching gems: faceted hexagonal crystal (procedural lathe geometry, flat facets),
   clearcoat physical material, additive inner core + fresnel rim shell, facet edge lines, orbiting sparkles
   and a soft halo. No transmission pass (too heavy for phones) - the "refractive" look is faked with the
   emissive core, rim light and translucency. Public API unchanged: create(T, letter, color); pass an empty letter for a plain crystal. */
(() => {
  let wv = null; const live = [];
  const SCALE = 1.7;
  let shared = null;
  function assets(T) {
    if (shared) return shared;
    // profile (radius, y): pointed bottom, faceted belly, table-like shoulder, pointed top
    const profile = [[0, -.98], [.42, -.52], [.60, .08], [.50, .56], [.22, .86], [0, .98]].map(([r, y]) => new T.Vector2(r, y));
    let gem = new T.LatheGeometry(profile, 6); gem = gem.toNonIndexed(); gem.computeVertexNormals();
    const rimGeo = gem.clone(); rimGeo.scale(1.07, 1.05, 1.07);
    const core = new T.OctahedronGeometry(.34, 0); core.scale(.9, 1.5, .9);
    const edges = new T.EdgesGeometry(gem, 20);
    const star = document.createElement('canvas'); star.width = star.height = 64;
    const g = star.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.25, 'rgba(255,244,200,.85)'); grad.addColorStop(1, 'rgba(255,230,160,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 2); g.lineTo(32, 62); g.moveTo(2, 32); g.lineTo(62, 32); g.stroke();
    const sparkTex = new T.CanvasTexture(star); sparkTex.encoding = T.sRGBEncoding;
    const halo = document.createElement('canvas'); halo.width = halo.height = 128;
    const h = halo.getContext('2d'), hg = h.createRadialGradient(64, 64, 4, 64, 64, 64);
    hg.addColorStop(0, 'rgba(255,255,255,.85)'); hg.addColorStop(.25, 'rgba(255,236,190,.38)'); hg.addColorStop(1, 'rgba(255,226,170,0)');
    h.fillStyle = hg; h.fillRect(0, 0, 128, 128);
    const haloTex = new T.CanvasTexture(halo); haloTex.encoding = T.sRGBEncoding;
    const sparkGeo = new T.BufferGeometry(); const n = 9, pos = new Float32Array(n * 3);
    sparkGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
    shared = { gem, rimGeo, core, edges, sparkTex, haloTex, sparkGeo, n };
    return shared;
  }
  function create(T, letter, color = '#b69be8') {
    const A = assets(T), hsl = {}; new T.Color(color).getHSL(hsl);
    // saturate / deepen the pastel tint so the gem reads as a rich amethyst-like crystal, not a pale ghost
    const deep = new T.Color().setHSL(hsl.h, .78, .5), tint = deep.clone(); color = '#' + deep.getHexString();
    const root = new T.Group(), body = new T.Group(); root.add(body); root.scale.setScalar(SCALE);
    const material = new T.MeshPhysicalMaterial({ color, roughness: .1, metalness: .04, clearcoat: 1, clearcoatRoughness: .06,
      emissive: color, emissiveIntensity: .3, transparent: true, opacity: .58, depthWrite: false, flatShading: true });
    // draw order inside the gem: glowing core -> letter -> crystal faces -> rim -> facet lines, so the letter reads as sitting INSIDE the stone
    const gem = new T.Mesh(A.gem, material); gem.castShadow = false; gem.renderOrder = 3; body.add(gem);
    const coreMat = new T.MeshBasicMaterial({ color: new T.Color('#ffffff').lerp(tint, .45), transparent: true, opacity: .6, blending: T.AdditiveBlending, depthWrite: false });
    const core = new T.Mesh(A.core, coreMat); core.renderOrder = 1; body.add(core);
    const rimMat = new T.ShaderMaterial({
      uniforms: { c: { value: new T.Color('#ffffff').lerp(tint, .45) }, k: { value: 1 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: 'varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform vec3 c;uniform float k;varying vec3 vN;varying vec3 vV;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.0);gl_FragColor=vec4(c*(.08+f*1.25)*k,(.05+f*.8)*k);}',
    });
    const rim = new T.Mesh(A.rimGeo, rimMat); rim.renderOrder = 4; body.add(rim);
    const edgeMat = new T.LineBasicMaterial({ color: '#f3e8ff', transparent: true, opacity: .8 });
    const edges = new T.LineSegments(A.edges, edgeMat); edges.renderOrder = 5; body.add(edges);
    const sparkMat = new T.PointsMaterial({ map: A.sparkTex, size: .34, transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: '#fff6dc', sizeAttenuation: true });
    const sparks = new T.Points(A.sparkGeo, sparkMat); sparks.renderOrder = 6; root.add(sparks);
    // letter: embedded in the gem (depth-tested, drawn before the faces, so the crystal tints it); a deep outline in the gem's own hue keeps it readable
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const g = c.getContext('2d'); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 118px "Arial Rounded MT Bold", Arial, sans-serif';
    // no letter (answer crystals) -> blank sprite: nothing is drawn, but it still marks the tap target
    if (letter) {
      g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = '#' + new T.Color().setHSL(hsl.h, .7, .2).getHexString(); g.strokeText(letter.toUpperCase(), 80, 88);
      g.shadowColor = '#fff6d8'; g.shadowBlur = 14; g.fillStyle = '#fffbea'; g.fillText(letter.toUpperCase(), 80, 88);
    }
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
    const label = new T.Sprite(new T.SpriteMaterial({ map: tex, depthWrite: false, depthTest: true, transparent: true }));
    label.scale.set(.78, .78, 1); label.renderOrder = 2; body.add(label);
    // the same letter again, additive, drawn after the faces: it glows through the crystal so it stays easy to read
    const glowMat = new T.SpriteMaterial({ map: tex, depthWrite: false, depthTest: true, transparent: true, blending: T.AdditiveBlending, opacity: .55 });
    const letterGlow = new T.Sprite(glowMat); letterGlow.scale.copy(label.scale); letterGlow.renderOrder = 4; body.add(letterGlow);
    const halo = new T.Sprite(new T.SpriteMaterial({ map: A.haloTex, color: new T.Color('#fff2cf').lerp(tint, .55), depthWrite: false, blending: T.AdditiveBlending, transparent: true }));
    halo.scale.set(3.6, 3.6, 1); halo.renderOrder = 0; root.add(halo);
    const item = { label, letterGlow, glowMat, root, body, material, core, coreMat, rimMat, edgeMat, sparks, sparkMat, halo, phase: Math.random() * 6, seeds: Array.from({ length: A.n }, (_, i) => [i / A.n * 6.283, .55 + (i % 3) * .16, (i * .37) % 1]) };
    live.push(item);
    return { group: root, body, bodyMat: material, label, eyes: [], mouth: new T.Object3D(), cheeks: [], gem, halo, item };
  }
  // called every frame (round3.update): gentle bob, slow spin, pulsing core, orbiting sparkles, dim when "wrong"
  function tick(time, cam) {
    for (const it of live) {
      let v = it.root, on = true; while (v) { if (!v.visible) { on = false; break; } v = v.parent; }
      if (!on) continue;
      const e = it.material.emissiveIntensity, dim = e < .08;
      if (cam) {
        // keep the crystal and its letter readable from far away (portrait view is narrow): grow gently with distance
        wv = wv || new it.root.position.constructor(); const wp = it.root.getWorldPosition(wv), d = wp.distanceTo(cam), k = Math.max(1, Math.min(2.0, d / 9));
        it.root.scale.setScalar(SCALE * Math.min(1.45, k));
      }
      it.body.rotation.y = time * .7 + it.phase; it.body.position.y = Math.sin(time * 1.5 + it.phase) * .06;
      const pulse = .5 + .5 * Math.sin(time * 2.3 + it.phase);
      it.coreMat.opacity = dim ? 0 : (.38 + .3 * pulse) * Math.min(1.6, .5 + e); it.rimMat.uniforms.k.value = dim ? .15 : 1;
      it.edgeMat.opacity = dim ? .25 : .55 + .35 * pulse; it.glowMat.opacity = dim ? .15 : .45 + .15 * pulse; it.sparks.visible = !dim; it.halo.visible = !dim; it.halo.material.opacity = .55 + .35 * pulse;
      if (!dim) {
        const p = it.sparks.geometry.attributes.position;
        // geometry is shared; positions written per item just before drawing is not possible, so use object rotation instead
        it.sparks.rotation.y = time * .9 + it.phase; it.sparks.position.y = Math.sin(time * 1.1 + it.phase) * .05; it.sparkMat.size = .26 + .14 * pulse;
        void p;
      }
    }
  }
  // fill the shared sparkle ring once (points orbit the gem at three heights)
  function seedSparks(T) {
    const A = assets(T), p = A.sparkGeo.attributes.position;
    for (let i = 0; i < A.n; i++) { const a = i / A.n * 6.283 * 2.1, r = .72 + (i % 3) * .14, y = -.9 + (i * .23) % 1.9; p.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r); }
    p.needsUpdate = true;
  }
  const origCreate = create;
  window.YayaRound3Crystals = { create: (T, l, c) => { seedSparks(T); return origCreate(T, l, c); }, tick, SCALE };
})();
