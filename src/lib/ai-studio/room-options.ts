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

export const LIGHTING_OPTIONS: ReadonlyArray<{
  key: LightingModeKey;
  label: string;
}> = [
  { key: "very-sunny", label: "Çok güneşli" },
  { key: "sunny", label: "Güneşli" },
  { key: "balanced", label: "Dengeli" },
  { key: "evening", label: "Akşam" },
  { key: "night", label: "Gece" },
];

export const PEOPLE_GENDER_OPTIONS: ReadonlyArray<{
  key: PeopleGenderKey;
  label: string;
  symbol: string;
}> = [
  { key: "female", label: "Kadın", symbol: "♀" },
  { key: "male", label: "Erkek", symbol: "♂" },
];

export const PEOPLE_AGE_OPTIONS: ReadonlyArray<{
  key: PeopleAgeKey;
  label: string;
}> = [
  { key: "young-adult", label: "Genç" },
  { key: "child", label: "Çocuk" },
  { key: "senior", label: "Yaşlı" },
];

export const PERSONALIZE_OPTIONS: ReadonlyArray<{
  key: PersonalizeOptionKey;
  label: string;
}> = [
  { key: "plant", label: "Bitki ekle" },
  { key: "art", label: "Sanat eseri" },
  { key: "decor", label: "Dekor ekle" },
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

export function peopleLabel(person: ScenePerson): string {
  const gender = PEOPLE_GENDER_OPTIONS.find((g) => g.key === person.gender)?.label ?? person.gender;
  const age = PEOPLE_AGE_OPTIONS.find((a) => a.key === person.ageGroup)?.label ?? person.ageGroup;
  return `${age} ${gender}`;
}
