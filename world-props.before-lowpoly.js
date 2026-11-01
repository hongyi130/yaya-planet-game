// Original, lightweight toy props for the independent Yaya visual study.
// THREE r147 UMD; every factory returns a foot-origin Group facing +Z.
(function () {
  "use strict";

  window.YayaProps = {
    create({ box, mat: sharedMat }) {
      const T = window.THREE;
      if (!T || !box || !sharedMat) throw new Error("YayaProps needs THREE, box() and mat().");
      const mat = (color, roughness, metalness) => sharedMat(
        color && color.isColor ? `#${color.getHexString()}` : color, roughness, metalness,
      );
      const sphereGeo = new T.SphereGeometry(1, 12, 8);
      const smallSphereGeo = new T.SphereGeometry(1, 8, 6);
      const rodGeo = new T.CylinderGeometry(1, 1, 1, 8);
      const capGeo = new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const smileGeo = new T.TorusGeometry(0.027, 0.007, 4, 8, Math.PI);
      const coneGeo = new T.LatheGeometry([
        new T.Vector2(0, 0), new T.Vector2(0.67, 0),
        new T.Vector2(0.77, 0.07), new T.Vector2(0.79, 0.16),
        new T.Vector2(0.73, 0.27), new T.Vector2(0.20, 1.12),
        new T.Vector2(0.08, 1.29), new T.Vector2(0, 1.32),
      ], 12);

      const flowerShape = new T.Shape();
      for (let i = 0; i <= 60; i += 1) {
        const angle = i / 60 * Math.PI * 2;
        const radius = 0.078 * (1 + 0.2 * Math.cos(angle * 5));
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (!i) flowerShape.moveTo(x, y);
        else flowerShape.lineTo(x, y);
      }
      const flowerGeo = new T.ExtrudeGeometry(flowerShape, {
        depth: 0.014, bevelEnabled: true, bevelThickness: 0.012,
        bevelSize: 0.01, bevelSegments: 1, steps: 1, curveSegments: 3,
      });
      flowerGeo.rotateX(-Math.PI / 2);

      const green = mat("#79b27a", 0.83);
      const lightGreen = mat("#a6c57d", 0.84);
      const darkGreen = mat("#4d8f70", 0.87);
      const bark = mat("#a77860", 0.9);
      const cream = mat("#fff0cc", 0.8);
      const honey = mat("#e8b65b", 0.73);
      const flowerMats = [mat("#f4cf6d", 0.8), mat("#f3ddd6", 0.8), mat("#d8c9ef", 0.8)];

      function mesh(group, geometry, material, x, y, z, sx = 1, sy = sx, sz = sx) {
        const object = new T.Mesh(geometry, material);
        object.position.set(x, y, z);
        object.scale.set(sx, sy, sz);
        object.castShadow = true;
        object.receiveShadow = true;
        group.add(object);
        return object;
      }
      function block(group, w, h, d, radius, material, x, y, z) {
        const object = box(w, h, d, radius, material);
        object.position.set(x, y, z);
        object.castShadow = true;
        object.receiveShadow = true;
        group.add(object);
        return object;
      }
      function rod(group, a, b, radius, material) {
        const from = new T.Vector3(...a);
        const to = new T.Vector3(...b);
        const center = from.clone().add(to).multiplyScalar(0.5);
        const object = mesh(group, rodGeo, material, center.x, center.y, center.z,
          radius, from.distanceTo(to), radius);
        object.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), to.sub(from).normalize());
        return object;
      }
      function finish(group, name, scale = 1) {
        group.name = name;
        group.scale.setScalar(scale);
        return group;
      }

      /** tree({ color, scale = 1, kind = "broadleaf", fruit = false }). */
      function tree(options = {}) {
        const group = new T.Group();
        const leaf = options.color ? mat(options.color, 0.83) : green;
        const lighter = options.color
          ? mat(new T.Color(options.color).lerp(new T.Color("#e3e7ad"), 0.22), 0.85)
          : lightGreen;
        const darker = options.color
          ? mat(new T.Color(options.color).lerp(new T.Color("#35635d"), 0.20), 0.88)
          : darkGreen;
        block(group, 0.28, 1.65, 0.30, 0.09, bark, 0, 0.825, 0);
        if (options.kind === "pine") {
          mesh(group, coneGeo, darker, 0, 0.85, 0, 1.04, 0.90, 1.04);
          mesh(group, coneGeo, leaf, 0, 1.40, 0, 0.80, 0.83, 0.80);
          mesh(group, coneGeo, lighter, 0, 1.94, 0, 0.57, 0.68, 0.57);
        } else {
          block(group, 1.20, 1.10, 1.15, 0.38, darker, 0.05, 1.70, -0.07).rotation.y = 0.13;
          block(group, 0.96, 1.12, 0.95, 0.37, leaf, -0.50, 1.97, 0.08).rotation.z = -0.13;
          block(group, 1.02, 1.22, 1.00, 0.39, leaf, 0.43, 2.11, 0.09).rotation.z = 0.12;
          block(group, 1.00, 0.96, 1.00, 0.36, lighter, -0.08, 2.48, -0.09).rotation.y = -0.15;
          if (options.fruit) {
            mesh(group, smallSphereGeo, honey, -0.50, 1.83, 0.55, 0.12);
            mesh(group, smallSphereGeo, honey, 0.49, 2.12, 0.56, 0.11);
          }
        }
        return finish(group, "soft-clay-tree", options.scale ?? 1);
      }

      /** flowerPatch({ color, scale = 1, count = 3 }) — maximum 10 meshes. */
      function flowerPatch(options = {}) {
        const group = new T.Group();
        const count = Math.min(3, Math.max(1, options.count ?? 3));
        const locations = [[-0.20, 0.00, 0.17], [0.10, -0.13, 0.27], [0.27, 0.13, 0.20]];
        for (let i = 0; i < count; i += 1) {
          const [x, z, height] = locations[i];
          block(group, 0.025, height, 0.025, 0.008, darkGreen, x, height / 2, z);
          const color = options.color ? mat(options.color, 0.8) : flowerMats[i];
          mesh(group, flowerGeo, color, x, height, z);
          mesh(group, smallSphereGeo, honey, x, height + 0.024, z, 0.026, 0.018, 0.026);
        }
        const leaf = mesh(group, sphereGeo, green, -0.07, 0.06, 0.02, 0.22, 0.045, 0.09);
        leaf.rotation.y = -0.4;
        return finish(group, "tiny-meadow-flowers", options.scale ?? 1);
      }

      const tentTriangle = new T.Shape();
      tentTriangle.moveTo(-0.76, 0);
      tentTriangle.lineTo(0.76, 0);
      tentTriangle.lineTo(0, 1.20);
      tentTriangle.closePath();
      const backGeo = new T.ShapeGeometry(tentTriangle);
      const doorShape = tentTriangle.clone();
      const opening = new T.Path();
      opening.moveTo(-0.33, 0.025);
      opening.lineTo(0, 0.82);
      opening.lineTo(0.33, 0.025);
      opening.closePath();
      doorShape.holes.push(opening);
      const frontGeo = new T.ShapeGeometry(doorShape);
      const innerDoor = new T.Shape();
      innerDoor.moveTo(-0.34, 0);
      innerDoor.lineTo(0.34, 0);
      innerDoor.lineTo(0, 0.85);
      innerDoor.closePath();
      const innerDoorGeo = new T.ShapeGeometry(innerDoor);
      const tentFace = mat("#e9ba64", 0.9).clone();
      tentFace.side = T.DoubleSide;
      const tentInside = mat("#6d6559", 1);

      /** tent({ scale = 1 }) — mustard cloth with real open door silhouette. */
      function tent(options = {}) {
        const group = new T.Group();
        block(group, 1.68, 0.10, 1.62, 0.06, mat("#d8be8f", 0.92), 0, 0.05, 0);
        const angle = Math.atan2(1.20, 0.76);
        const roofLength = Math.hypot(1.20, 0.76) + 0.10;
        for (const side of [-1, 1]) {
          const roof = block(group, roofLength, 0.09, 1.64, 0.042,
            side < 0 ? mat("#f0c46d", 0.88) : mat("#d9a850", 0.88), side * 0.38, 0.70, 0);
          roof.rotation.z = -side * angle;
        }
        mesh(group, backGeo, tentFace, 0, 0.10, -0.74);
        mesh(group, frontGeo, tentFace, 0, 0.10, 0.75);
        mesh(group, innerDoorGeo, tentInside, 0, 0.11, 0.55);
        block(group, 0.55, 0.035, 0.33, 0.025, mat("#9aac8e", 0.95), 0, 0.12, 0.72);
        const pole = mat("#b08b5a", 0.73);
        rod(group, [-0.78, 0.04, 0.80], [0, 1.32, 0.80], 0.025, pole);
        rod(group, [0.78, 0.04, 0.80], [0, 1.32, 0.80], 0.025, pole);
        return finish(group, "mustard-camping-tent", options.scale ?? 1);
      }

      /** explorer({ scale = 1 }) — 1.2-unit original explorer, face toward +Z. */
      function explorer(options = {}) {
        const group = new T.Group();
        const skin = mat("#e7bb94", 0.85);
        const coat = mat("#f0bf66", 0.78);
        const trousers = mat("#7d94a0", 0.9);
        const boots = mat("#8d7465", 0.86);
        const hat = mat("#88bba9", 0.82);
        const eyes = mat("#454354", 0.72);
        for (const side of [-1, 1]) {
          block(group, 0.155, 0.19, 0.25, 0.055, boots, side * 0.12, 0.095, 0.04);
          block(group, 0.14, 0.22, 0.17, 0.045, trousers, side * 0.12, 0.27, 0);
          const arm = block(group, 0.13, 0.31, 0.16, 0.06, coat, side * 0.28, 0.55, 0.01);
          arm.rotation.z = side * 0.13;
          mesh(group, smallSphereGeo, skin, side * 0.30, 0.40, 0.015, 0.075, 0.08, 0.075);
        }
        block(group, 0.45, 0.44, 0.32, 0.12, coat, 0, 0.55, 0);
        block(group, 0.32, 0.35, 0.17, 0.08, mat("#a78caa", 0.87), 0, 0.57, -0.23);
        block(group, 0.45, 0.39, 0.40, 0.13, skin, 0, 0.94, 0.005);
        block(group, 0.49, 0.14, 0.44, 0.068, hat, 0, 1.115, -0.005);
        block(group, 0.50, 0.055, 0.42, 0.026, hat, 0, 1.075, 0.10);
        mesh(group, smallSphereGeo, eyes, -0.087, 0.96, 0.209, 0.017, 0.024, 0.012);
        mesh(group, smallSphereGeo, eyes, 0.087, 0.96, 0.209, 0.017, 0.024, 0.012);
        const smile = mesh(group, smileGeo, eyes, 0, 0.91, 0.211);
        smile.rotation.z = Math.PI;
        block(group, 0.09, 0.10, 0.02, 0.02, cream, 0.12, 0.60, 0.168);
        return finish(group, "little-yaya-explorer", options.scale ?? 1);
      }

      /** mushroom({ color = "#d99684", scale = 1 }). */
      function mushroom(options = {}) {
        const group = new T.Group();
        block(group, 0.10, 0.22, 0.10, 0.045, cream, 0, 0.11, 0);
        mesh(group, capGeo, mat(options.color || "#d99684", 0.77), 0, 0.21, 0, 0.23, 0.16, 0.23);
        mesh(group, smallSphereGeo, cream, -0.075, 0.35, 0.01, 0.036, 0.012, 0.032);
        mesh(group, smallSphereGeo, cream, 0.09, 0.32, 0.07, 0.03, 0.012, 0.027);
        return finish(group, "clay-mushroom", options.scale ?? 1);
      }

      /** rockCluster({ color = "#9b879b", scale = 1 }). */
      function rockCluster(options = {}) {
        const group = new T.Group();
        const color = new T.Color(options.color || "#9b879b");
        const stone = mat(color, 0.97);
        const pale = mat(color.clone().lerp(new T.Color("#d3c7c5"), 0.25), 0.96);
        block(group, 0.48, 0.38, 0.43, 0.16, stone, -0.12, 0.19, -0.04).rotation.y = 0.4;
        block(group, 0.31, 0.24, 0.29, 0.10, pale, 0.20, 0.12, 0.11).rotation.y = -0.4;
        block(group, 0.20, 0.13, 0.18, 0.06, stone, -0.26, 0.065, 0.22);
        return finish(group, "soft-river-stones", options.scale ?? 1);
      }

      return { tree, flowerPatch, tent, explorer, mushroom, rockCluster };
    },
  };
})();
