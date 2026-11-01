// Original, lightweight low-poly forest props for the independent Yaya visual study.
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
      // Flat clones are local: never change the host scene's cached materials.
      const flatMaterials = new Map();
      function flat(color, roughness = 0.92) {
        const key = `${new T.Color(color).getHexString()}:${roughness}`;
        if (!flatMaterials.has(key)) {
          const material = mat(color, roughness).clone();
          material.flatShading = true;
          flatMaterials.set(key, material);
        }
        return flatMaterials.get(key);
      }
      const sphereGeo = new T.IcosahedronGeometry(1, 1);
      const smallSphereGeo = new T.IcosahedronGeometry(1, 0);
      const rodGeo = new T.CylinderGeometry(0.80, 1, 1, 7);
      const capGeo = new T.SphereGeometry(1, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2);
      const smileGeo = new T.TorusGeometry(0.027, 0.007, 4, 8, Math.PI);
      const coneGeo = new T.ConeGeometry(1, 1, 7);
      const foxEarGeo = new T.ConeGeometry(1, 1, 3);
      const foxTailGeo = new T.ConeGeometry(1, 1, 6);

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

      const green = flat("#83b744");
      const lightGreen = flat("#b3d265");
      const darkGreen = flat("#3f8860");
      const bark = flat("#936345");
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
        const object = box(w, h, d, Math.min(radius, 0.035), material);
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
        const color = options.color || "#88b95b";
        const leaf = flat(color);
        const lighter = flat(new T.Color(color).lerp(new T.Color("#c8da83"), 0.22));
        const darker = flat(new T.Color(color).lerp(new T.Color("#366644"), 0.20));
        mesh(group, rodGeo, bark, 0, 0.56, 0, 0.17, 1.12, 0.17);
        if (options.kind === "pine") {
          // Wider, shorter shelves keep the conifers compact within the forest.
          mesh(group, coneGeo, darker, 0, 0.91, 0, 0.94, 1.10, 0.94);
          mesh(group, coneGeo, leaf, 0, 1.37, 0, 0.78, 1.12, 0.78).rotation.y = 0.21;
          mesh(group, coneGeo, leaf, 0, 1.81, 0, 0.58, 1.07, 0.58).rotation.y = -0.13;
          mesh(group, coneGeo, lighter, 0, 2.26, 0, 0.36, 0.87, 0.36);
        } else {
          // A crown is one connected surface, not separate stacked spherical clumps.
          // Three reusable silhouettes have gently uneven shoulders and flatter undersides.
          if (!tree.crowns) {
            tree.crowns = [0.25, 1.8, 3.4].map((phase) => {
              const geometry = new T.IcosahedronGeometry(1, 2);
              const positions = geometry.attributes.position;
              const colors = [];
              for (let i = 0; i < positions.count; i += 1) {
                const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
                const angle = Math.atan2(z, x);
                const shoulder = 1 + 0.07 * Math.sin(angle * 3 + phase)
                  + 0.035 * Math.sin(angle * 5 - phase + y * 3);
                positions.setXYZ(i,
                  x * shoulder + 0.09 * y,
                  y * (y < 0 ? 0.63 : 1.02) + 0.045 * Math.sin(x * 3 + z * 2 + phase),
                  z * shoulder,
                );
              }
              // Three restrained face-tone groups provide depth without extra draw calls.
              for (let i = 0; i < positions.count; i += 3) {
                const y = (positions.getY(i) + positions.getY(i + 1) + positions.getY(i + 2)) / 3;
                const x = (positions.getX(i) + positions.getX(i + 1) + positions.getX(i + 2)) / 3;
                const z = (positions.getZ(i) + positions.getZ(i + 1) + positions.getZ(i + 2)) / 3;
                const tone = y + x * 0.24 - z * 0.14;
                const shade = tone < -0.14 ? [0.78, 0.86, 0.73]
                  : tone > 0.47 ? [1.0, 1.0, 0.91] : [0.90, 0.96, 0.85];
                for (let v = 0; v < 3; v += 1) colors.push(...shade);
              }
              geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
              geometry.computeVertexNormals();
              geometry.computeBoundingSphere();
              return geometry;
            });
            tree.crownMaterials = new Map();
            tree.crownCounter = 0;
          }
          const colorKey = new T.Color(color).getHexString();
          if (!tree.crownMaterials.has(colorKey)) {
            const material = leaf.clone();
            material.vertexColors = true;
            tree.crownMaterials.set(colorKey, material);
          }
          const variant = tree.crownCounter++ % 3;
          rod(group, [0, 0.62, 0], [-0.53, 1.44, 0.06], 0.095, bark);
          rod(group, [0, 0.73, 0], [0.49, 1.53, -0.06], 0.082, bark);
          const crown = mesh(group, tree.crowns[variant], tree.crownMaterials.get(colorKey),
            -0.03, 1.55, 0, 1.37, 1.02, 1.10);
          crown.rotation.y = [0.08, -0.22, 0.19][variant];
          if (options.fruit) {
            mesh(group, smallSphereGeo, honey, -0.58, 1.21, 0.83, 0.10);
            mesh(group, smallSphereGeo, honey, 0.53, 1.40, 0.91, 0.095);
          }
        }
        return finish(group, "storybook-faceted-tree", options.scale ?? 1);
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
        mesh(group, capGeo, flat(options.color || "#d98a68", 0.9), 0, 0.21, 0, 0.23, 0.16, 0.23);
        mesh(group, smallSphereGeo, cream, -0.075, 0.35, 0.01, 0.036, 0.012, 0.032);
        mesh(group, smallSphereGeo, cream, 0.09, 0.32, 0.07, 0.03, 0.012, 0.027);
        return finish(group, "forest-mushroom", options.scale ?? 1);
      }

      /** rockCluster({ color = "#9b879b", scale = 1 }). */
      function rockCluster(options = {}) {
        const group = new T.Group();
        const color = new T.Color(options.color || "#a29d86");
        const stone = flat(color, 0.97);
        const pale = flat(color.clone().lerp(new T.Color("#e0d8bb"), 0.25), 0.96);
        mesh(group, smallSphereGeo, stone, -0.12, 0.170131, -0.04, 0.29, 0.20, 0.26).rotation.y = 0.4;
        mesh(group, smallSphereGeo, pale, 0.21, 0.102079, 0.12, 0.20, 0.12, 0.18).rotation.y = -0.4;
        mesh(group, smallSphereGeo, stone, -0.26, 0.055293, 0.23, 0.13, 0.065, 0.11);
        return finish(group, "faceted-river-stones", options.scale ?? 1);
      }

      /** fox({ scale = 1 }) — original small woodland fox, feet at Y=0, faces +Z. */
      function fox(options = {}) {
        const group = new T.Group();
        const orange = flat("#df8539");
        const warmOrange = flat("#ed9e4c");
        const white = flat("#fff0d2");
        const dark = flat("#523e34");
        mesh(group, sphereGeo, orange, 0, 0.42, -0.08, 0.25, 0.25, 0.42);
        mesh(group, smallSphereGeo, white, 0, 0.43, 0.22, 0.18, 0.21, 0.13);
        for (const side of [-1, 1]) {
          for (const z of [-0.28, 0.15]) {
            mesh(group, rodGeo, dark, side * 0.145, 0.135, z, 0.045, 0.27, 0.045);
          }
        }
        mesh(group, sphereGeo, warmOrange, 0, 0.68, 0.30, 0.27, 0.25, 0.23);
        mesh(group, smallSphereGeo, white, 0, 0.585, 0.47, 0.21, 0.13, 0.18);
        mesh(group, smallSphereGeo, dark, 0, 0.62, 0.62, 0.046, 0.031, 0.032);
        for (const side of [-1, 1]) {
          const ear = mesh(group, foxEarGeo, orange, side * 0.165, 0.91, 0.28, 0.115, 0.27, 0.10);
          ear.rotation.z = -side * 0.14;
          mesh(group, foxEarGeo, dark, side * 0.165, 0.92, 0.335, 0.056, 0.15, 0.018);
          mesh(group, smallSphereGeo, dark, side * 0.115, 0.72, 0.488, 0.022, 0.027, 0.017);
        }
        // A broad upward tail is distinct even when this tiny animal is seen from above.
        const tail = mesh(group, foxTailGeo, orange, 0.12, 0.49, -0.59, 0.20, 0.65, 0.19);
        tail.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(-0.35, -0.50, 0.78).normalize());
        const tip = mesh(group, foxTailGeo, white, 0.24, 0.70, -0.88, 0.15, 0.32, 0.14);
        tip.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(0.35, 0.50, -0.78).normalize());
        return finish(group, "little-woodland-fox", options.scale ?? 1);
      }

      return { tree, flowerPatch, tent, explorer, mushroom, rockCluster, fox };
    },
  };
})();
