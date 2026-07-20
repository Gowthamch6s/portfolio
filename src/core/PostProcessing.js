import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Pass order matters: SSAO needs a beauty image already in the buffer to darken (RenderPass
// first), Bokeh/Bloom then layer on top, Afterimage (the motion-blur stand-in) blends against
// the previous *frame's* output last so it doesn't get re-blurred by the passes before it, and
// OutputPass has to be the final step — EffectComposer skips the renderer's own output color
// transform while any composer passes are active, so without it colors come out wrong (bloom
// especially depends on correct linear-to-sRGB handling to not look blown out or muddy).
export function createPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
  ssaoPass.kernelRadius = 6;
  ssaoPass.minDistance = 0.005;
  ssaoPass.maxDistance = 0.12;
  composer.addPass(ssaoPass);

  const bokehPass = new BokehPass(scene, camera, { focus: 10, aperture: 0.0015, maxblur: 0.008 });
  composer.addPass(bokehPass);

  // threshold is deliberately high: with hundreds of small bright snowflakes on screen, a
  // lower threshold blooms all of them at once and washes the whole frame out.
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.25, 0.4, 0.94);
  composer.addPass(bloomPass);

  const afterimagePass = new AfterimagePass(0);
  composer.addPass(afterimagePass);

  composer.addPass(new OutputPass());

  function setSize(width, height) {
    composer.setSize(width, height);
    ssaoPass.setSize(width, height);
  }

  return { composer, bokehPass, bloomPass, afterimagePass, ssaoPass, setSize };
}
