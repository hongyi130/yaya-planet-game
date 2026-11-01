/* A-02 treasure-world rewards. Original geometry; no assets, timers or save keys. */
(function (global) {
  "use strict";

  function create(options) {
    const {
      THREE: T, scene, player, STAGE, surfaceRadius, moveAlong, tangent,
      arc, orient, upAt = dir => dir, tween, wait, ease = k => k,
      sfx = {}, say = () => {}, playOnce = () => {}, obstacles = [],
    } = options;
    if (!T || !scene || !player || !STAGE || !surfaceRadius || !moveAlong || !orient || !tween || !wait) {
      throw new Error("YayaSecondRewards needs the game's scene, player and surface/animation helpers.");
    }
    const V = T.Vector3;
    const Y = new V(0, 1, 0);
    const geometries = new Set(), materials = new Set(), textures = new Set();
    const flat = new T.MeshLambertMaterial({ vertexColors: true });
    materials.add(flat);
    const sphere = new T.IcosahedronGeometry(1, 1);
    const small = new T.IcosahedronGeometry(1, 0);
    const box = new T.BoxGeometry(1, 1, 1);
    const rod = new T.CylinderGeometry(1, 1, 1, 8);
    [sphere, small, box, rod].forEach(g => geometries.add(g));
    const palette = {
      fur: "#ca8a52", honey: "#dfa66a", ear: "#8f593b", cream: "#fff0d3",
      nose: "#49332f", eye: "#302b31", tongue: "#e9959b", mint: "#53aa93",
      lightMint: "#8bc9a7", darkMint: "#388f80", gold: "#f5c75e", paper: "#fff0c9",
      wood: "#b5804d", woodLight: "#d1a571", bark: "#8a6046",
    };
    const motionQuery = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = Boolean(motionQuery && motionQuery.matches), disposed = false;
    const onMotionChange = event => { reducedMotion = event.matches; };
    if (motionQuery && motionQuery.addEventListener) motionQuery.addEventListener("change", onMotionChange);

    // Bake fixed details together so spots, eyes and map-table parts add no draw calls.
    function batch(parent, pieces) {
      const positions = [], normals = [], colors = [];
      const matrix = new T.Matrix4(), normalMatrix = new T.Matrix3(), q = new T.Quaternion();
      const p = new V(), n = new V();
      for (const piece of pieces) {
        let geometry = piece.geometry || sphere;
        const temporary = Boolean(geometry.index);
        if (temporary) geometry = geometry.toNonIndexed();
        q.setFromEuler(new T.Euler(...(piece.rotation || [0, 0, 0])));
        matrix.compose(new V(...piece.position), q, new V(...piece.scale));
        normalMatrix.getNormalMatrix(matrix);
        const color = new T.Color(piece.color);
        const pos = geometry.getAttribute("position"), nor = geometry.getAttribute("normal");
        for (let i = 0; i < pos.count; i += 1) {
          p.fromBufferAttribute(pos, i).applyMatrix4(matrix);
          n.fromBufferAttribute(nor, i).applyNormalMatrix(normalMatrix);
          positions.push(p.x, p.y, p.z); normals.push(n.x, n.y, n.z);
          colors.push(color.r, color.g, color.b);
        }
        if (temporary) geometry.dispose();
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
      geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
      geometry.computeBoundingSphere(); geometries.add(geometry);
      const mesh = new T.Mesh(geometry, flat);
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
      return mesh;
    }
    const ellipsoid = (position, scale, color, rotation) => ({ position, scale, color, rotation });
    const cuboid = (position, scale, color, rotation) => ({ geometry: box, position, scale, color, rotation });
    function group(parent, position = [0, 0, 0]) {
      const object = new T.Group(); object.position.set(...position); parent.add(object); return object;
    }
    function material(color, extra = {}) {
      const value = new T.MeshLambertMaterial(Object.assign({ color }, extra)); materials.add(value); return value;
    }
    function mesh(parent, geometry, mat, position = [0, 0, 0]) {
      geometries.add(geometry);
      const object = new T.Mesh(geometry, mat); object.position.set(...position);
      object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
    }
    function besidePlayer() {
      const behind = moveAlong(player.dir, player.heading.clone().negate(), 1.15);
      const right = new V().crossVectors(player.dir, player.heading).normalize();
      return moveAlong(behind, right, 1.25).normalize();
    }
    function mark(root, word) {
      root.name = `reward-${word}`;
      root.userData.secondPlanetReward = word;
      root.traverse(object => { object.userData.decorativeReward = true; });
    }

    let dog = null, cap = null, map = null;
    function makeDog(spot) {
      if (dog) return dog.root;
      const root = new T.Group(); scene.add(root);
      const body = group(root);
      batch(body, [
        ellipsoid([0, .35, -.015], [.205, .205, .34], palette.fur),
        ellipsoid([0, .36, -.24], [.21, .195, .19], palette.honey),
        ellipsoid([0, .265, .045], [.175, .105, .28], palette.cream),
        ellipsoid([0, .38, .245], [.16, .20, .095], palette.cream),
        { geometry: rod, position: [0, .485, .22], scale: [.158, .065, .158], color: palette.mint, rotation: [Math.PI / 2, 0, 0] },
        ellipsoid([0, .38, .312], [.045, .055, .018], palette.gold),
      ]);
      const head = group(root, [0, .585, .29]);
      batch(head, [
        ellipsoid([0, 0, 0], [.218, .195, .214], palette.honey),
        ellipsoid([0, -.055, .175], [.157, .108, .13], palette.cream),
        ellipsoid([0, .055, .155], [.061, .11, .051], palette.cream),
        ellipsoid([0, -.023, .289], [.068, .048, .042], palette.nose),
        cuboid([0, -.116, .268], [.073, .016, .016], palette.nose),
        ellipsoid([.016, -.139, .27], [.027, .033, .014], palette.tongue),
        ...[-1, 1].flatMap(side => [
          ellipsoid([side * .114, .04, .16], [.031, .036, .028], palette.eye),
          ellipsoid([side * .114 - .007, .051, .182], [.009, .011, .007], "#fffaf1"),
        ]),
      ]);
      const ears = [-1, 1].map(side => {
        const ear = group(head, [side * .184, .045, -.017]);
        batch(ear, [ellipsoid([side * .018, -.113, -.005], [.069, .174, .105], palette.ear, [0, 0, side * .12])]);
        return ear;
      });
      const legs = [];
      for (const x of [-.14, .14]) for (const z of [-.225, .205]) {
        const leg = group(root, [x, .275, z]);
        batch(leg, [
          cuboid([0, -.105, 0], [.087, .22, .102], palette.fur),
          ellipsoid([0, -.235, .024], [.073, .043, .092], palette.cream),
        ]);
        legs.push({ object: leg, phase: (x < 0 ? 0 : Math.PI) + (z < 0 ? Math.PI : 0) });
      }
      const tail = group(root, [0, .43, -.325]);
      batch(tail, [
        ellipsoid([0, .10, -.065], [.052, .158, .053], palette.fur, [-.65, 0, 0]),
        ellipsoid([0, .225, -.155], [.049, .064, .049], palette.cream, [-.65, 0, 0]),
      ]);
      const dir = (spot || besidePlayer()).clone().normalize();
      dog = { root, body, head, ears, legs, tail, dir, heading: tangent(player.heading, dir), radius: surfaceRadius(dir), celebrate: 0, moving: false, gaitTime: 0 };
      root.position.copy(dir).multiplyScalar(dog.radius);
      orient(root, upAt(dir), dog.heading);
      mark(root, "dog");
      return root;
    }

    function hideOtherHeadwear(except) {
      player.obj.children.forEach(child => {
        if (child !== except && child.userData.headwear) child.visible = false;
      });
    }
    function makeCap() {
      if (cap) { hideOtherHeadwear(cap); cap.visible = true; return cap; }
      cap = new T.Group(); player.obj.add(cap); cap.position.y = 1.48;
      const mint = material(palette.mint), cream = material(palette.cream), brim = material(palette.darkMint);
      mesh(cap, new T.SphereGeometry(.34, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2), mint);
      mesh(cap, new T.SphereGeometry(.343, 4, 3, Math.PI / 2 - .43, .86, .56, Math.PI / 2 - .56), cream);
      const shape = new T.Shape();
      shape.moveTo(-.28, -.01); shape.lineTo(.28, -.01);
      shape.quadraticCurveTo(.35, .18, .22, .33); shape.quadraticCurveTo(0, .43, -.22, .33);
      shape.quadraticCurveTo(-.35, .18, -.28, -.01); shape.closePath();
      const billGeo = new T.ExtrudeGeometry(shape, { depth: .03, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 1, curveSegments: 4 });
      billGeo.rotateX(Math.PI / 2);
      mesh(cap, billGeo, brim, [0, .035, .14]);
      batch(cap, [
        ellipsoid([0, .35, 0], [.045, .022, .045], palette.gold),
        { geometry: small, position: [0, .16, .312], scale: [.047, .049, .016], color: palette.gold },
      ]);
      cap.userData.headwear = "cap";
      mark(cap, "cap"); hideOtherHeadwear(cap);
      return cap;
    }

    function mapTexture() {
      const canvas = document.createElement("canvas"); canvas.width = 384; canvas.height = 240;
      const g = canvas.getContext("2d");
      g.fillStyle = "#fff0c9"; g.fillRect(0, 0, 384, 240);
      g.strokeStyle = "#d8b580"; g.lineWidth = 5; g.strokeRect(9, 9, 366, 222);
      g.fillStyle = "#9bc9a0";
      [[52, 52, 25], [78, 68, 23], [243, 185, 34]].forEach(([x, y, r]) => {
        g.beginPath(); g.moveTo(x, y-r); g.lineTo(x+r, y+r*.6); g.lineTo(x-r, y+r*.6); g.closePath(); g.fill();
      });
      g.fillStyle = "#8bcbd1"; g.beginPath(); g.ellipse(208, 55, 48, 24, -.28, 0, Math.PI*2); g.fill();
      g.strokeStyle = "#fff6df"; g.lineWidth = 3; g.beginPath(); g.moveTo(180, 53); g.quadraticCurveTo(195, 46, 212, 48); g.stroke();
      g.strokeStyle = "#bf8759"; g.lineWidth = 7; g.lineCap = "round"; g.setLineDash([4, 14]);
      g.beginPath(); g.moveTo(49, 186); g.bezierCurveTo(113, 198, 121, 109, 180, 128); g.bezierCurveTo(264, 155, 250, 100, 330, 68); g.stroke(); g.setLineDash([]);
      g.fillStyle = "#4b9e89"; g.beginPath(); g.arc(49, 186, 13, 0, Math.PI*2); g.fill();
      g.strokeStyle = "#dc7966"; g.lineWidth = 10;
      g.beginPath(); g.moveTo(317, 53); g.lineTo(344, 79); g.moveTo(344, 53); g.lineTo(317, 79); g.stroke();
      g.strokeStyle = "rgba(159,117,77,.2)"; g.lineWidth = 2;
      for (const x of [128, 256]) { g.beginPath(); g.moveTo(x, 12); g.lineTo(x, 228); g.stroke(); }
      const tex = new T.CanvasTexture(canvas); tex.encoding = T.sRGBEncoding;
      tex.anisotropy = 4; textures.add(tex); return tex;
    }
    function mapSpot() {
      const front = STAGE.front.clone(), side = new V().crossVectors(STAGE.up, front).normalize();
      // The front-left meadow stays visible over the voxel steps from the stage
      // camera. A table beside the rear pillar would be hidden by its high terrace.
      for (const x of [-2.2, -2.65, -3.1]) for (const z of [4.4, 4.9, 5.4]) {
        const nominal = STAGE.group.position.clone().addScaledVector(side, x).addScaledVector(front, z);
        const dir = nominal.clone().normalize();
        if (obstacles.some(o => arc(dir, o.dir) < o.r + .8)) continue;
        const center = dir.clone().multiplyScalar(surfaceRadius(dir));
        const heights = [center.dot(STAGE.up)];
        for (const dx of [-.76, .76]) for (const dz of [-.50, .50]) {
          const sample = center.clone().addScaledVector(side, dx).addScaledVector(front, dz).normalize();
          heights.push(sample.multiplyScalar(surfaceRadius(sample)).dot(STAGE.up));
        }
        if (Math.max(...heights) - Math.min(...heights) < .12) return { center, front, up: STAGE.up };
      }
      const fallback = moveAlong(STAGE.center, side.clone().negate(), 3.6).normalize();
      return { center: fallback.clone().multiplyScalar(surfaceRadius(fallback)), front, up: upAt(fallback) };
    }
    function makeMap() {
      if (map) return map.root;
      const root = new T.Group(); scene.add(root);
      const spot = mapSpot(); root.position.copy(spot.center); orient(root, spot.up, spot.front);
      const parts = [cuboid([0, .46, 0], [1.43, .09, .94], palette.woodLight)];
      for (const x of [-.54, .54]) for (const z of [-.30, .30]) parts.push(cuboid([x, .215, z], [.085, .43, .085], palette.wood));
      parts.push(cuboid([0, .20, -.30], [1.13, .055, .065], palette.bark));
      batch(root, parts);
      const paper = material(palette.paper), tex = mapTexture();
      const ink = new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide }); materials.add(ink);
      const foldRoot = group(root, [0, .525, 0]);
      const hinges = [];
      for (let i = 0; i < 3; i += 1) {
        const hinge = group(foldRoot, [i === 0 ? -.21 : i === 2 ? .21 : 0, 0, 0]);
        const offset = i === 0 ? -.21 : i === 2 ? .21 : 0;
        mesh(hinge, new T.BoxGeometry(.42, .022, .82), paper, [offset, 0, 0]);
        const surface = new T.PlaneGeometry(.42, .82); surface.rotateX(-Math.PI / 2);
        const uv = surface.getAttribute("uv");
        for (let j = 0; j < uv.count; j += 1) uv.setX(j, (i + uv.getX(j)) / 3);
        mesh(hinge, surface, ink, [offset, .012, 0]);
        hinges.push(hinge);
      }
      const pin = group(hinges[2], [.43, .014, .18]);
      batch(pin, [
        { geometry: rod, position: [0, .046, 0], scale: [.014, .092, .014], color: palette.bark },
        ellipsoid([0, .108, 0], [.056, .056, .056], "#df806b"),
      ]);
      const compass = mesh(root, new T.CylinderGeometry(.08, .08, .018, 10), material(palette.gold), [0, .458, .482]);
      compass.rotation.x = Math.PI / 2;
      map = { root, hinges, pin, opening: false, unfold: 1 };
      mark(root, "map"); setMapFold(1);
      return root;
    }
    function setMapFold(k) {
      if (!map) return;
      map.unfold = k;
      map.hinges[0].rotation.z = -1.9 * (1-k) - .025;
      map.hinges[2].rotation.z = 1.9 * (1-k) + .035;
    }

    function updateDog(dt, time) {
      if (!dog) return;
      dog.celebrate = Math.max(0, dog.celebrate - dt);
      const target = besidePlayer(), distance = arc(dog.dir, target);
      let moving = false;
      if (!dog.celebrate && distance > .28) {
        const toward = tangent(target.clone().sub(dog.dir), dog.dir);
        dog.dir.copy(moveAlong(dog.dir, toward, Math.min(distance, Math.min(4.0, distance * 3.0) * dt))).normalize();
        dog.heading.lerp(toward, 1 - Math.exp(-dt * 9)); moving = true;
      } else {
        dog.heading.lerp(tangent(player.dir.clone().sub(dog.dir), dog.dir), 1 - Math.exp(-dt * 3));
      }
      dog.heading.copy(tangent(dog.heading, dog.dir));
      const ground = surfaceRadius(dog.dir);
      // Follow the same stepped surface as the player. Snap upward to avoid sinking;
      // ease downward for a short, natural step off a voxel terrace.
      dog.radius = ground > dog.radius ? ground : dog.radius + (ground - dog.radius) * Math.min(1, dt * 16);
      dog.root.position.copy(dog.dir).multiplyScalar(dog.radius);
      orient(dog.root, upAt(dog.dir), dog.heading);
      dog.moving = moving;
      dog.gaitTime += dt * (moving ? 12 : 0);
      dog.legs.forEach(leg => { leg.object.rotation.x = moving && !reducedMotion ? Math.sin(dog.gaitTime + leg.phase) * .42 : 0; });
      dog.tail.rotation.z = reducedMotion ? 0 : Math.sin(time * (dog.celebrate ? 15 : 8)) * .47;
      dog.tail.rotation.y = reducedMotion ? 0 : Math.sin(time * 5) * .12;
      dog.body.position.y = reducedMotion ? 0 : (moving ? Math.abs(Math.sin(dog.gaitTime)) * .014 : Math.sin(time * 2) * .004);
      dog.head.rotation.y = reducedMotion || moving ? 0 : Math.sin(time * .8) * .1;
      dog.head.rotation.z = reducedMotion ? 0 : Math.sin(time * .55) * .045;
      dog.ears.forEach((ear, i) => { ear.rotation.z = reducedMotion ? 0 : Math.sin(time * (moving ? 10 : 1.2) + i) * (moving ? .10 : .025); });
    }
    function update(dt, time) {
      if (disposed) return;
      const delta = Math.max(0, Math.min(Number.isFinite(dt) ? dt : 0, .1));
      const now = Number.isFinite(time) ? time : 0;
      updateDog(delta, now);
      if (map && !map.opening) map.pin.position.y = .014 + (reducedMotion ? 0 : Math.sin(now * 1.4) * .003);
    }
    const gifts = {
      dog: {
        voice: "reward-dog",
        async show(center) {
          const spot = moveAlong(center, tangent(player.dir.clone().sub(center), center), 1.15).normalize();
          const puppy = makeDog(spot); dog.celebrate = 2.3;
          puppy.scale.setScalar(reducedMotion ? 1 : .01);
          if (!reducedMotion) await tween(.5, k => puppy.scale.setScalar(Math.max(.01, ease(k))));
          if (sfx.bubble) sfx.bubble(); playOnce(player, "emote-yes");
          const spoken = say("你拼出了 <b>dog</b>，一只小狗跑出来啦！它会陪你一起探险。", { voice: "reward-dog" });
          await Promise.all([spoken, wait(2.0)]); dog.celebrate = 0;
        },
        restore() { makeDog(besidePlayer()); },
      },
      cap: {
        voice: "reward-cap",
        async show() {
          const object = makeCap(); if (sfx.hatDrop) sfx.hatDrop(); playOnce(player, "emote-yes");
          const spoken = say("你拼出了 <b>cap</b>，一顶棒球帽！戴上它，继续探险吧。", { voice: "reward-cap" });
          if (!reducedMotion) await tween(.7, k => {
            object.position.y = 1.48 + (1 - ease(k)) * 1.8;
            object.rotation.y = (1-k) * Math.PI * 2;
          });
          object.position.y = 1.48; object.rotation.y = 0; await Promise.all([spoken, wait(1.5)]);
        },
        restore() { makeCap(); },
      },
      map: {
        voice: "reward-map", carry: false,
        async show() {
          const object = makeMap(); map.opening = true;
          object.scale.setScalar(reducedMotion ? 1 : .01); setMapFold(reducedMotion ? 1 : 0);
          if (sfx.place) sfx.place(); playOnce(player, "emote-yes");
          const spoken = say("你拼出了 <b>map</b>，一张藏宝地图！展开它，看看上面的路线吧。", { voice: "reward-map" });
          if (!reducedMotion) {
            await tween(.4, k => object.scale.setScalar(Math.max(.01, ease(k))));
            await tween(.8, k => setMapFold(ease(k)));
          }
          setMapFold(1); map.opening = false; await Promise.all([spoken, wait(1.2)]);
        },
        restore() { makeMap(); setMapFold(1); },
      },
    };
    function snapshot() {
      return {
        words: [dog && "dog", cap && "cap", map && "map"].filter(Boolean),
        dog: dog && { position: dog.root.position.toArray(), dir: dog.dir.toArray(), radius: dog.radius, surface: surfaceRadius(dog.dir), moving: dog.moving, tail: dog.tail.rotation.toArray().slice(0, 3) },
        cap: cap && { position: cap.position.toArray(), visible: cap.visible, parentIsPlayer: cap.parent === player.obj },
        map: map && { position: map.root.position.toArray(), unfold: map.unfold, opening: map.opening },
        reducedMotion,
      };
    }
    function dispose() {
      if (disposed) return; disposed = true;
      [dog && dog.root, cap, map && map.root].filter(Boolean).forEach(object => object.removeFromParent());
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
      if (motionQuery && motionQuery.removeEventListener) motionQuery.removeEventListener("change", onMotionChange);
    }
    return { gifts, update, snapshot, dispose, makeDog, makeCap, makeMap,
      get dog() { return dog; }, get cap() { return cap; }, get map() { return map; } };
  }
  global.YayaSecondRewards = { create };
})(window);
