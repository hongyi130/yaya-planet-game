/* Regrade the original forest palette without replacing geometry or moving props. */
(function (global) {
  "use strict";

  const PROFILES = {
    tree: { hue: 161, hueRange: -13, light: .38, lightRange: .28 },
    treeHigh: { hue: 165, hueRange: -12, light: .36, lightRange: .29 },
    plant: { hue: 140, hueRange: -10, light: .39, lightRange: .29 },
  };
  const gradedTextures = new WeakMap();
  const gradedMaterials = new WeakMap();
  const clamp = value => Math.max(0, Math.min(1, value));

  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const high = Math.max(r, g, b), low = Math.min(r, g, b);
    const difference = high - low;
    const lightness = (high + low) / 2;
    if (!difference) return [0, 0, lightness];
    const saturation = difference / (1 - Math.abs(2 * lightness - 1));
    const hue = high === r ? (g - b) / difference + (g < b ? 6 : 0)
      : high === g ? (b - r) / difference + 2 : (r - g) / difference + 4;
    return [hue * 60, saturation, lightness];
  }

  function rgb(hue, saturation, lightness) {
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const sector = hue / 60;
    const middle = chroma * (1 - Math.abs(sector % 2 - 1));
    const base = lightness - chroma / 2;
    const values = sector < 1 ? [chroma, middle, 0] : sector < 2 ? [middle, chroma, 0]
      : sector < 3 ? [0, chroma, middle] : sector < 4 ? [0, middle, chroma]
      : sector < 5 ? [middle, 0, chroma] : [chroma, 0, middle];
    return values.map(value => Math.round((value + base) * 255));
  }

  function remap(r, g, b, profile) {
    const [hue, saturation, lightness] = hsl(r, g, b);
    // Source leaves use the green palette ramp; preserve its per-face tonal steps.
    if (hue >= 70 && hue <= 180 && saturation > .16 && lightness > .12 && lightness < .85) {
      const tone = clamp((lightness - .45) / .25);
      return { kind: "leaf", value: rgb(profile.hue + profile.hueRange * tone,
        .43 + .10 * (1 - tone), profile.light + profile.lightRange * tone) };
    }
    // The trunk samples the separate orange-brown strip; it must stay brown.
    if (hue >= 10 && hue <= 48 && saturation > .22 && lightness > .12 && lightness < .86) {
      const tone = clamp((lightness - .42) / .3);
      return { kind: "bark", value: rgb(24 + 8 * tone, .43 + .06 * tone, .23 + .22 * tone) };
    }
    return null;
  }

  function gradeTexture(texture, name, report) {
    let cache = gradedTextures.get(texture);
    if (cache && cache[name]) return cache[name];
    const image = texture.image;
    const width = image && (image.naturalWidth || image.width);
    const height = image && (image.naturalHeight || image.height);
    if (!width || !height) { report.skipped.push(`${name}: texture image unavailable`); return null; }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    let pixels;
    try {
      context.drawImage(image, 0, 0, width, height);
      pixels = context.getImageData(0, 0, width, height);
    } catch (error) {
      report.skipped.push(`${name}: texture pixels unavailable`);
      return null;
    }
    let changed = 0;
    const profile = PROFILES[name];
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (!pixels.data[i + 3]) continue;
      const next = remap(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2], profile);
      if (!next) continue;
      pixels.data[i] = next.value[0];
      pixels.data[i + 1] = next.value[1];
      pixels.data[i + 2] = next.value[2];
      report[next.kind === "leaf" ? "leafPixels" : "barkPixels"] += 1;
      changed += 1;
    }
    if (!changed) return null;
    context.putImageData(pixels, 0, 0);
    // Clone keeps the glTF's flipY, UV transform, color space and sampler settings.
    const graded = texture.clone();
    // Three.js texture clones share Source; give this palette its own pixel source.
    if (texture.source) graded.source = new texture.source.constructor(canvas);
    else graded.image = canvas;
    graded.name = `${texture.name || "forest-colormap"}-v2-${name}`;
    graded.needsUpdate = true;
    cache = cache || {};
    cache[name] = graded;
    gradedTextures.set(texture, cache);
    report.textures += 1;
    return graded;
  }

  function gradeMaterial(THREE, material, name, report) {
    if (!material || material.userData.yayaFoliageV2) return material;
    let cache = gradedMaterials.get(material);
    if (cache && cache[name]) return cache[name];
    const map = material.map && gradeTexture(material.map, name, report);
    if (!map) return material;
    const next = material.clone();
    next.map = map;
    if ("roughness" in next) next.roughness = .88;
    if ("metalness" in next) next.metalness = 0;
    next.userData = Object.assign({}, next.userData, { yayaFoliageV2: name });
    next.needsUpdate = true;
    cache = cache || {};
    cache[name] = next;
    gradedMaterials.set(material, cache);
    report.materials += 1;
    return next;
  }

  /** Call after GLTF loading, before cloning or placing tree/treeHigh/plant models. */
  function regrade(THREE, models) {
    const report = { models: [], materials: 0, textures: 0, leafPixels: 0, barkPixels: 0, skipped: [] };
    if (!models) return report;
    Object.keys(PROFILES).forEach(name => {
      const model = models[name];
      const scene = model && (model.scene || model);
      if (!scene || typeof scene.traverse !== "function") return;
      scene.traverse(object => {
        if (!object.isMesh || !object.material) return;
        object.material = Array.isArray(object.material)
          ? object.material.map(material => gradeMaterial(THREE, material, name, report))
          : gradeMaterial(THREE, object.material, name, report);
      });
      report.models.push(name);
    });
    return report;
  }

  global.YayaArtFoliage = Object.assign(global.YayaArtFoliage || {}, { regrade });
})(window);
