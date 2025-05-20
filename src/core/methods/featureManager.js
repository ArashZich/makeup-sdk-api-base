// src/core/methods/featureManager.js

export const defaultFeatures = [
  "lips",
  "eyeshadow",
  "eyepencil",
  "eyelashes",
  "blush",
  "concealer",
  "foundation",
  "brows",
  "eyeliner",
  // "lens"
];

export const defaultPatterns = {
  lips: ["normal", "matte", "glossy", "glitter"],
  eyeshadow: ["normal"],
  eyepencil: ["normal"],
  eyeliner: ["normal", "lashed"],
  eyelashes: ["long-lash"], //"volume-boost"
  blush: ["normal"],
  concealer: ["normal"],
  foundation: ["normal"],
  brows: ["normal"],

  // lens: [
  //   "rainbow",
  //   "crystal-colors",
  //   "dahab-platinum",
  //   "desio-attitude",
  //   "freshlook-colorblends",
  // ],
};

export class FeatureManager {
  constructor(features = null) {
    this.features = features;
  }

  isFeatureEnabled(feature) {
    if (this.features?.allowedFeatures) {
      return this.features.allowedFeatures.includes(feature);
    }
    return defaultFeatures.includes(feature);
  }

  getAllowedPatterns(feature) {
    if (this.features?.allowedPatterns?.[feature]) {
      return this.features.allowedPatterns[feature];
    }
    return defaultPatterns[feature] || [];
  }

  getEnabledFeatures() {
    if (this.features?.allowedFeatures) {
      return this.features.allowedFeatures;
    }
    return defaultFeatures;
  }
}

export default FeatureManager;
