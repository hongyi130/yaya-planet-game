/* Original low-poly wildlife for Yaya's voxel planet. Three.js r147, no assets or save data. */
(function () {
  "use strict";

  function create(options) {
    const {
      THREE: T, scene, surfaceRadius, orient, tangent, moveAlong, arc,
      STAGE, obstacles = [], LOW_POWER = false, crystals = {}, props = [],
    } = options;
    if (!T || !scene || !surfaceRadius || !orient || !tangent || !moveAlong) {
      throw new Error("YayaWildlife requires the host scene and surface helpers.");
    }
    const V = T.Vector3;
    const Y = new V(0, 1, 0);
    const geometries = new Set();
    const materials = new Set();
    const meshMaterial = new T.MeshStandardMaterial({
      vertexColors: true, roughness: 0.86, metalness: 0, flatShading: true,
      emissive: "#b48a58", emissiveIntensity: .055,
    });
    materials.add(meshMaterial);
    const palette = {
      caramel: "#ce8b50", honey: "#e1a665", back: "#d89b58", chestnut: "#ab6c43",
      cream: "#fff0d1", spot: "#ffedcc", antler: "#e4c28c", hoof: "#674634",
      eye: "#332620", nose: "#4b302c", bunny: "#f4e6cf", bunnyShade: "#e2cdb5",
      blush: "#d8878e", ear: "#e89a9b", white: "#fff5df",
    };
    const unitIco = new T.IcosahedronGeometry(1, 1);
    const unitSmall = new T.IcosahedronGeometry(1, 0);
    const unitRod = new T.CylinderGeometry(0.75, 1, 1, 6, 1);
    const unitBox = new T.BoxGeometry(1, 1, 1);
    for (const g of [unitIco, unitSmall, unitRod, unitBox]) geometries.add(g);

    // Bake static details into one vertex-coloured mesh per moving body part.
    // This keeps the spots, face and antler forks inexpensive on phones.
    function batch(parent, pieces) {
      const positions = [], normals = [], colors = [];
      const matrix = new T.Matrix4();
      const rotation = new T.Quaternion();
      const scale = new V();
      const normalMatrix = new T.Matrix3();
      const p = new V(), n = new V();
      for (const piece of pieces) {
        let geometry = piece.geometry || unitIco;
        const owned = !!geometry.index;
        if (owned) geometry = geometry.toNonIndexed();
        rotation.setFromEuler(new T.Euler(...(piece.rotation || [0, 0, 0])));
        if (piece.quaternion) rotation.copy(piece.quaternion);
        matrix.compose(new V(...piece.position), rotation, scale.set(...piece.scale));
        normalMatrix.getNormalMatrix(matrix);
        const color = new T.Color(piece.color);
        const pos = geometry.getAttribute("position");
        const nor = geometry.getAttribute("normal");
        for (let i = 0; i < pos.count; i += 1) {
          p.fromBufferAttribute(pos, i).applyMatrix4(matrix);
          n.fromBufferAttribute(nor, i).applyNormalMatrix(normalMatrix);
          positions.push(p.x, p.y, p.z);
          normals.push(n.x, n.y, n.z);
          colors.push(color.r, color.g, color.b);
        }
        if (owned) geometry.dispose();
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
      geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
      geometry.computeBoundingSphere();
      geometries.add(geometry);
      const mesh = new T.Mesh(geometry, meshMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    const ellipsoid = (position, scale, color, rotation) => ({position, scale, color, rotation});
    function rodPiece(from, to, radius, color) {
      const a = new V(...from), b = new V(...to);
      return {
        geometry: unitRod, position: a.clone().add(b).multiplyScalar(.5).toArray(),
        scale: [radius, a.distanceTo(b), radius], color,
        quaternion: new T.Quaternion().setFromUnitVectors(Y, b.sub(a).normalize()),
      };
    }
    function group(parent, position = [0, 0, 0]) {
      const object = new T.Group();
      object.position.set(...position);
      parent.add(object);
      return object;
    }
    function makeLeg(root, x, z, isFront) {
      const hip = new V(x, isFront ? .79 : .77, z);
      const upper = batch(root, [{geometry: unitRod, position: [0, 0, 0], scale: [1, 1, 1], color: palette.caramel}]);
      const lower = batch(root, [{geometry: unitRod, position: [0, 0, 0], scale: [1, 1, 1], color: palette.honey}]);
      const hoof = batch(root, [{geometry: unitBox, position: [0, 0, 0], scale: [.063, .052, .094], color: palette.hoof}]);
      const knee = batch(root, [ellipsoid([0, 0, 0], [.043, .047, .045], palette.caramel)]);
      return {x, z, hip, upper, lower, hoof, knee, isFront, foot: new V(x, 0, z)};
    }
    function makeDeer() {
      const root = new T.Group();
      root.name = "Yaya gentle woodland deer";
      const terrainFrame = group(root);
      const body = group(terrainFrame);
      const parts = [
        ellipsoid([0, .78, -.02], [.202, .245, .40], palette.caramel),
        ellipsoid([0, .82, -.22], [.18, .23, .21], palette.back),
        ellipsoid([0, .83, .22], [.155, .24, .17], palette.honey),
        ellipsoid([0, .67, .015], [.135, .12, .29], palette.cream),
        ellipsoid([0, .98, .28], [.105, .26, .12], palette.honey, [-.27, 0, 0]),
        ellipsoid([0, .955, .368], [.076, .205, .034], palette.cream, [-.27, 0, 0]),
      ];
      for (const side of [-1, 1]) {
        [[.157,.88,-.22],[.176,.83,-.08],[.145,.94,-.06],[.163,.88,.09],[.15,.81,.17]].forEach(([x,y,z], i) => {
          parts.push(ellipsoid([x * side,y,z], [.008,.025 + (i % 2) * .006,.036], palette.spot));
        });
      }
      batch(body, parts);
      const head = group(body, [0, 1.14, .34]);
      const face = [
        ellipsoid([0,0,.05],[.12,.125,.19],palette.honey),
        ellipsoid([0,-.055,.191],[.08,.072,.12],palette.caramel),
        ellipsoid([0,-.09,.203],[.064,.032,.096],palette.cream),
        ellipsoid([0,-.045,.287],[.051,.032,.032],palette.nose),
      ];
      for (const side of [-1, 1]) {
        face.push(ellipsoid([side * .103,.024,.133],[.019,.023,.018],palette.eye));
        face.push(ellipsoid([side * .114,.034,.141],[.005,.006,.005],palette.white));
        // Slender pale branches have real depth, with tips tapering into the silhouette.
        const s = side;
        face.push(rodPiece([s*.057,.079,-.008],[s*.082,.185,-.035],.019,palette.antler));
        face.push(rodPiece([s*.082,.185,-.035],[s*.13,.29,-.05],.013,palette.antler));
        face.push(rodPiece([s*.13,.29,-.05],[s*.15,.345,-.023],.007,palette.antler));
        face.push(rodPiece([s*.082,.185,-.035],[s*.17,.225,.016],.012,palette.antler));
        face.push(rodPiece([s*.17,.225,.016],[s*.19,.285,.032],.007,palette.antler));
        face.push(rodPiece([s*.102,.225,-.045],[s*.075,.265,.03],.009,palette.antler));
      }
      batch(head, face);
      const ears = [-1, 1].map(side => {
        const ear = group(head, [side * .092,.06,-.036]);
        batch(ear, [
          ellipsoid([side*.072,.027,-.012],[.095,.047,.034],palette.caramel,[0,0,side*.32]),
          ellipsoid([side*.071,.031,.014],[.064,.025,.009],palette.cream,[0,0,side*.32]),
        ]);
        return ear;
      });
      const tail = group(body, [0,.875,-.355]);
      batch(tail, [
        ellipsoid([0,.035,-.064],[.051,.058,.10],palette.caramel,[-.45,0,0]),
        ellipsoid([0,.005,-.074],[.038,.027,.08],palette.cream,[-.45,0,0]),
      ]);
      const legs = [-1,1].flatMap(side => [makeLeg(terrainFrame,side*.115,.225,true),makeLeg(terrainFrame,side*.12,-.25,false)]);
      return {root, terrainFrame, body, head, ears, tail, legs, footprint: .44, dimensions: [0.4,1.49,.99]};
    }
    function makeRabbit(scale) {
      const root = new T.Group();
      root.name = "Yaya cream woodland rabbit";
      const terrainFrame = group(root);
      const model = group(terrainFrame);
      model.scale.setScalar(scale);
      const body = group(model);
      batch(body, [
        ellipsoid([0,.177,-.055],[.14,.19,.185],palette.bunny),
        ellipsoid([0,.205,.07],[.104,.14,.105],palette.white),
        ellipsoid([-.11,.09,-.075],[.076,.10,.115],palette.bunnyShade),
        ellipsoid([.11,.09,-.075],[.076,.10,.115],palette.bunnyShade),
      ]);
      const head = group(body,[0,.335,.095]);
      batch(head,[
        ellipsoid([0,0,0],[.113,.105,.113],palette.bunny),
        ellipsoid([-.032,-.035,.09],[.047,.034,.037],palette.white),
        ellipsoid([.032,-.035,.09],[.047,.034,.037],palette.white),
        ellipsoid([0,-.018,.125],[.018,.012,.012],palette.blush),
        ellipsoid([-.094,.017,.045],[.013,.018,.013],palette.eye),
        ellipsoid([.094,.017,.045],[.013,.018,.013],palette.eye),
        ellipsoid([-.099,.022,.055],[.004,.005,.004],palette.white),
        ellipsoid([.099,.022,.055],[.004,.005,.004],palette.white),
      ]);
      const ears = [-1,1].map(side => {
        const ear = group(head,[side*.052,.065,-.025]);
        ear.rotation.z = -side*.16;
        batch(ear,[
          ellipsoid([0,.108,0],[.035,.133,.027],palette.white),
          ellipsoid([0,.114,.023],[.018,.099,.008],palette.ear),
        ]);
        return ear;
      });
      const tail = group(body,[0,.17,-.23]);
      batch(tail,[ellipsoid([0,0,0],[.065,.064,.064],palette.white)]);
      const legs = [-1,1].flatMap(side => [
        {x:side*.065*scale,z:.135*scale,foot: new V(),hoof:batch(terrainFrame,[ellipsoid([0,0,0],[.043*scale,.031*scale,.073*scale],palette.bunny)])},
        {x:side*.10*scale,z:-.09*scale,foot: new V(),hoof:batch(terrainFrame,[ellipsoid([0,0,0],[.065*scale,.036*scale,.10*scale],palette.bunnyShade)])},
      ]);
      return {root, terrainFrame, model, body, head, ears, tail, legs, footprint:.25*scale, dimensions:[.33*scale,.64*scale,.47*scale]};
    }

    const animals = [];
    const motionQuery = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    let reducedMotion = !!(motionQuery && motionQuery.matches);
    const onMotionChange = event => { reducedMotion = event.matches; };
    if (motionQuery && motionQuery.addEventListener) motionQuery.addEventListener("change", onMotionChange);
    const frame = new T.Object3D();
    const inverse = new T.Quaternion();
    const local = new V(), world = new V();
    const normal = new V();
    const distance = arc || ((a,b) => a.angleTo(b)*9.7);
    const baseRadius = STAGE && STAGE.group ? STAGE.group.position.length() : 9.5;
    const fixedBlocks = obstacles.filter(o => !o.crystal).map(o => ({dir:o.dir.clone(),r:o.r}));
    const crystalBlocks = Object.values(crystals).filter(c=>c && c.dir).map(c=>({dir:c.dir.clone(),r:.9}));
    const plantBlocks = props.filter(p=>p && p.dir).map(p=>({dir:p.dir.clone(),r:.2}));
    const occupied = fixedBlocks.concat(crystalBlocks,plantBlocks);

    function blocked(dir, footprint) {
      // The altar, arrival strip and letter routes retain ample breathing room.
      const position = dir.clone().multiplyScalar(surfaceRadius(dir));
      if (Math.abs(position.x)<3.2 && Math.abs(position.z)<3.4 && position.y>baseRadius-2) return true;
      return occupied.some(o=>distance(dir,o.dir)<o.r+footprint+.13) ||
        animals.some(a=>distance(dir,a.home)<a.footprint+footprint+.36);
    }
    function sampleGround(dir, heading, legs, stride=0) {
      frame.position.copy(dir).multiplyScalar(surfaceRadius(dir));
      // Keep the scene root radial, while a standing animal follows the actual
      // voxel face normal. On a flat terrace this avoids an unnatural sideways lean.
      const axis = Math.abs(dir.y)>=Math.abs(dir.x) && Math.abs(dir.y)>=Math.abs(dir.z) ? "y" : Math.abs(dir.x)>=Math.abs(dir.z) ? "x" : "z";
      normal.set(0,0,0); normal[axis]=Math.sign(dir[axis]);
      orient(frame, normal, heading);
      inverse.copy(frame.quaternion).invert();
      const points = [];
      for (const leg of legs) {
        local.set(leg.x,0,leg.z + stride);
        world.copy(local).applyQuaternion(frame.quaternion).add(frame.position);
        const d = world.clone().normalize();
        const r = surfaceRadius(d);
        const point = d.multiplyScalar(r);
        points.push({world:point,local:point.clone().sub(frame.position).applyQuaternion(inverse)});
      }
      // On a voxel top, all contact points share one world-space plane. A path
      // crossing a one-unit ledge cannot pass this test, even on the sphere's flank.
      const heights = points.map(p=>p.world[axis]);
      heights.push(frame.position[axis]);
      const step = Math.max(...heights)-Math.min(...heights);
      return {points,radius:frame.position.length(),step,axis,plane:heights[0],quaternion:frame.quaternion.clone()};
    }
    function findPatch(animal, target, phase) {
      const heading = new V(-.88,0,.45 + phase*.09).normalize();
      const offsets = [[0,0]];
      for (let ring=1;ring<=8;ring++) {
        for(let i=0;i<12;i++) offsets.push([Math.cos(i*Math.PI/6)*ring*.15,Math.sin(i*Math.PI/6)*ring*.15]);
      }
      for(const [dx,dz] of offsets) {
        const dir = new V(target[0]+dx,baseRadius-.4,target[1]+dz).normalize();
        if(blocked(dir,animal.footprint)) continue;
        const h = tangent(heading,dir);
        const sample = sampleGround(dir,h,animal.legs);
        if(sample.step>.055) continue;
        let route = null;
        for(const sign of [1,-1]) {
          const travel = tangent(h.clone().multiplyScalar(sign),dir);
          const length = animal.species === "deer" ? .34 : .24;
          const frames = [];
          for(let i=0;i<=16;i++) {
            const stepDir = moveAlong(dir,travel,length*i/16);
            if(blocked(stepDir,animal.footprint)) break;
            const stepHeading = tangent(h,stepDir);
            const ground = sampleGround(stepDir,stepHeading,animal.legs,.025);
            if(ground.step>.055 || ground.axis!==sample.axis || Math.abs(ground.plane-sample.plane)>.055) break;
            frames.push({dir:stepDir,radius:ground.radius});
          }
          if(frames.length===17) { route={travel,length,frames}; break; }
        }
        if(route) return {dir,heading:h,route,ground:sample};
      }
      // A safe static home is preferable to an animal walking off a tiny ledge.
      for(const [dx,dz] of offsets) {
        const dir=new V(target[0]+dx,baseRadius-.4,target[1]+dz).normalize();
        if(blocked(dir,animal.footprint)) continue;
        const h=tangent(heading,dir),ground=sampleGround(dir,h,animal.legs);
        if(ground.step<.07) return {dir,heading:h,route:null,ground};
      }
      return null;
    }
    // Portrait framing needs a closer pair of foreground terraces. The desktop
    // composition and deer home stay identical to the approved wide view.
    const portrait = window.innerWidth / Math.max(window.innerHeight, 1) < .8;
    const definitions = [
      {id:"forest-deer",species:"deer",model:makeDeer(),target:[4.15,1.25],phase:0,cycle:15.5},
      {id:"forest-rabbit-1",species:"rabbit",model:makeRabbit(.95),target:portrait?[3.4,3.8]:[4.6,3.8],phase:1.7,cycle:12.3},
      {id:"forest-rabbit-2",species:"rabbit",model:makeRabbit(.82),target:portrait?[3.0,4.4]:[5.05,4.85],phase:4.2,cycle:13.7},
    ];
    for(const definition of definitions) {
      const animal={...definition.model,id:definition.id,species:definition.species,phase:definition.phase,cycle:definition.cycle,dir:new V(),heading:new V(),lift:0,motion:"idle",radius:0,groundHeight:0,maxTerrainStep:0,footGroundErrors:[],clock:definition.phase};
      const patch=findPatch(animal,definition.target,definition.phase);
      if(!patch) {
        // This is only expected on a custom planet with all suitable terraces occupied.
        animal.root.visible=false;
        animal.home = new V(...[definition.target[0],baseRadius-.4,definition.target[1]]).normalize();
        animal.dir.copy(animal.home); animal.heading.copy(tangent(new V(-1,0,.5),animal.dir));
        animal.route=null;
      } else {
        animal.home=patch.dir.clone(); animal.dir.copy(patch.dir); animal.heading.copy(patch.heading);
        animal.baseHeading=patch.heading.clone(); animal.route=patch.route;
      }
      animal.root.userData.decorativeWildlife=true;
      animal.root.userData.wildlifeId=animal.id;
      // No lesson click targets, collision objects or persistent state are added.
      animal.root.traverse(object => {object.userData.decorativeWildlife=true;});
      scene.add(animal.root);
      animals.push(animal);
    }
    const limbDirection = new V();
    function setSegment(object,a,b,width) {
      object.position.copy(a).add(b).multiplyScalar(.5);
      object.scale.set(width,a.distanceTo(b),width);
      limbDirection.copy(b).sub(a).normalize();
      object.quaternion.setFromUnitVectors(Y,limbDirection);
    }
    function updateAnimal(animal,dt) {
      if(!animal.root.visible) return;
      animal.clock += dt;
      const t=animal.clock;
      const deer=animal.species==="deer";
      let hop=0,walk=0;
      animal.pause=(animal.pause??(1+animal.phase))-dt;
      const visitor=dt>0&&options.getPlayer?options.getPlayer():null;
      const fleeing=visitor&&arc(animal.dir,visitor.dir)<1.5;
      if(!reducedMotion && ((!animal.goal&&animal.pause<=0)||fleeing)) {
        for(let n=0;n<20;n++) {
          const v=fleeing?animal.dir.clone().sub(visitor.dir):new V(Math.random()-.5,Math.random()-.5,Math.random()-.5);
          const heading=tangent(v,animal.dir),length=.5+Math.random()*.9;
          let safe=true,goal=null,prev=surfaceRadius(animal.dir);
          for(let k=1;k<=10;k++) {const d=moveAlong(animal.dir,heading,length*k/10).normalize(),r=surfaceRadius(d);
            if(arc(d,STAGE.center)<2.8||obstacles.some(o=>arc(d,o.dir)<o.r+animal.footprint)||Math.abs(r-prev)>.4){safe=false;break}prev=r;goal=d;}
          if(safe&&arc(goal,animal.home)<3){animal.goal=goal;animal.travelHeading=heading;break}
        }
        animal.pause=.6+Math.random()*1.5;
      }
      if(animal.goal&&!reducedMotion){const distance=arc(animal.dir,animal.goal),speed=fleeing?(deer?1.5:2):deer?.55:.75;
        animal.heading.copy(tangent(animal.goal.clone().sub(animal.dir),animal.dir));
        const next=moveAlong(animal.dir,animal.heading,Math.min(distance,speed*dt)).normalize();
        if(!obstacles.some(o=>arc(next,o.dir)<o.r+animal.footprint)){animal.dir.copy(next);walk=1;hop=deer?0:Math.abs(Math.sin(t*9))*(fleeing?.2:.10)}else animal.goal=null;
        if(distance<.08){animal.goal=null;animal.pause=1+Math.random()*2.5;}
      }
      animal.radius=surfaceRadius(animal.dir);
      animal.lift=hop;
      animal.groundHeight=animal.radius;
      animal.root.position.copy(animal.dir).multiplyScalar(animal.radius+hop);
      orient(animal.root,animal.dir,animal.heading);
      animal.motion=hop>.001?"hop":walk>.001?"walk":"idle";
      const breathe=reducedMotion?0:Math.sin(t*1.65)*.004;
      animal.body.position.y=breathe;
      animal.head.rotation.y=reducedMotion?0:Math.sin(t*.53+animal.phase)*.12;
      animal.head.rotation.x=reducedMotion?0:Math.pow(Math.max(0,Math.sin(t*.38-.8)),5)*(deer?.18:.07);
      const flick=reducedMotion?0:Math.pow(Math.max(0,Math.sin(t*1.6+animal.phase)),20)*.13;
      animal.ears.forEach((ear,index)=> {
        ear.rotation.x=(deer?0:-.13)+flick*(index?1:-.7);
        ear.rotation.z=deer ? (reducedMotion?0:Math.sin(t*.65+index)*.025) : (index?-.16:.16)+(reducedMotion?0:Math.sin(t*.7+index)*.035);
      });
      animal.tail.rotation.x=reducedMotion?0:Math.sin(t*2.3)*.055;
      const ground=sampleGround(animal.dir,animal.heading,animal.legs);
      animal.terrainFrame.quaternion.copy(animal.root.quaternion).invert().multiply(ground.quaternion);
      animal.maxTerrainStep=ground.step;
      animal.footGroundErrors=[];
      for(let i=0;i<animal.legs.length;i++) {
        const leg=animal.legs[i];
        const contact=ground.points[i].local;
        leg.foot.copy(contact);
        if(deer) {
          const gait=!reducedMotion?Math.max(0,Math.sin(t*5.4+i*Math.PI*.5))*walk*.035:0;
          leg.foot.y+=gait;
          leg.foot.z+=!reducedMotion?Math.cos(t*5.4+i*Math.PI*.5)*walk*.025:0;
          const knee=new V(leg.x, .405+contact.y*.48, leg.z+(leg.isFront?.035:-.066));
          const hip=leg.hip.clone();hip.y+=breathe;
          setSegment(leg.upper,hip,knee,.055);
          setSegment(leg.lower,knee,leg.foot.clone().add(new V(0,.045,0)),.027);
          leg.knee.position.copy(knee);
          leg.hoof.position.copy(leg.foot).add(new V(0,.026,0));
          animal.footGroundErrors.push(gait);
        } else {
          leg.hoof.position.copy(contact).add(new V(0,.028,0));
          animal.footGroundErrors.push(0);
        }
      }
    }
    let disposed=false;
    function update(dt) {
      if(disposed) return;
      const delta=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1));
      for(const animal of animals) updateAnimal(animal,delta);
    }
    function snapshot() {
      return animals.map(a=>({
        id:a.id,species:a.species,visible:a.root.visible,motion:a.motion,
        world:a.root.position.toArray(),dir:a.dir.toArray(),up:Y.clone().applyQuaternion(a.root.quaternion).toArray(),
        radius:a.radius,expectedRadius:surfaceRadius(a.dir)+a.lift,lift:a.lift,
        maxTerrainStep:a.maxTerrainStep,footGroundErrors:[...a.footGroundErrors],
        home:a.home.toArray(),travelRange:a.route?a.route.length:0,reducedMotion,
      }));
    }
    function dispose() {
      if(disposed) return;
      disposed=true;
      animals.forEach(a=>scene.remove(a.root));
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
      if(motionQuery && motionQuery.removeEventListener) motionQuery.removeEventListener("change",onMotionChange);
    }
    update(0);
    return {animals,update,snapshot,dispose,get reducedMotion(){return reducedMotion;}};
  }
  window.YayaWildlife={create};
})();
