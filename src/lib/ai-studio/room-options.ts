export type LightingModeKey =
  | "very-sunny"
  | "sunny"
  | "balanced"
  | "evening"
  | "night";

export type PeopleGenderKey = "female" | "male";
export type PeopleAgeKey = "young-adult" | "child" | "senior";

export type ScenePerson = {
  gender: PeopleGenderKey;
  ageGroup: PeopleAgeKey;
  quantity: number;
};

export type PersonalizeOptionKey = "plant" | "art" | "decor";

export type ImageSizeKey = "1K" | "2K" | "4K";
export type AspectRatioKey = "16:9" | "9:16" | "4:5" | "1:1" | "3:4";

/** Message keys under the `aiStudio` namespace (see messages/*.json). */
export const LIGHTING_OPTIONS: ReadonlyArray<{
  key: LightingModeKey;
  labelKey:
    | "lightingVerySunny"
    | "lightingSunny"
    | "lightingBalanced"
    | "lightingEvening"
    | "lightingNight";
}> = [
  { key: "very-sunny", labelKey: "lightingVerySunny" },
  { key: "sunny", labelKey: "lightingSunny" },
  { key: "balanced", labelKey: "lightingBalanced" },
  { key: "evening", labelKey: "lightingEvening" },
  { key: "night", labelKey: "lightingNight" },
];

export const PEOPLE_GENDER_OPTIONS: ReadonlyArray<{
  key: PeopleGenderKey;
  labelKey: "genderFemale" | "genderMale";
  symbol: string;
}> = [
  { key: "female", labelKey: "genderFemale", symbol: "♀" },
  { key: "male", labelKey: "genderMale", symbol: "♂" },
];

export const PEOPLE_AGE_OPTIONS: ReadonlyArray<{
  key: PeopleAgeKey;
  labelKey: "ageYoungAdult" | "ageChild" | "ageSenior";
}> = [
  { key: "young-adult", labelKey: "ageYoungAdult" },
  { key: "child", labelKey: "ageChild" },
  { key: "senior", labelKey: "ageSenior" },
];

export const PERSONALIZE_OPTIONS: ReadonlyArray<{
  key: PersonalizeOptionKey;
  labelKey: "personalizePlant" | "personalizeArt" | "personalizeDecor";
}> = [
  { key: "plant", labelKey: "personalizePlant" },
  { key: "art", labelKey: "personalizeArt" },
  { key: "decor", labelKey: "personalizeDecor" },
];

export const IMAGE_SIZE_OPTIONS: ReadonlyArray<{
  key: ImageSizeKey;
  label: string;
  multiplier: string;
}> = [
  { key: "1K", label: "1K", multiplier: "x1" },
  { key: "2K", label: "2K", multiplier: "x2" },
  { key: "4K", label: "4K", multiplier: "x4" },
];

export const ASPECT_RATIO_OPTIONS: ReadonlyArray<{
  key: AspectRatioKey;
  label: string;
}> = [
  { key: "16:9", label: "16:9" },
  { key: "9:16", label: "9:16" },
  { key: "4:5", label: "4:5" },
  { key: "1:1", label: "1:1" },
  { key: "3:4", label: "3:4" },
];

export const DEFAULT_LIGHTING_MODE: LightingModeKey = "balanced";
export const DEFAULT_IMAGE_SIZE: ImageSizeKey = "1K";
export const DEFAULT_ASPECT_RATIO: AspectRatioKey = "16:9";
