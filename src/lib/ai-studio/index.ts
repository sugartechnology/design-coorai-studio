export type {
  AiImageContext,
  AiImageGeneration,
  AiStudioCreditQuote,
  AiStudioProductRequest,
  AiStudioRoomDesignRequest,
  AiStudioRoomReferenceRequest,
} from "./types";

export {
  createAiStudioSessionId,
  generateRoomDesign,
  generateRoomReference,
  getOrCreateAiStudioSessionId,
  isGenerationSuccessful,
  isGenerationTerminal,
  listReferenceGenerations,
  listRoomGenerations,
  pollGenerationUntilDone,
  quoteAiCredits,
  resolveGenerationImageUrl,
} from "./ai-studio-api";

export { useAiStudioSession } from "./use-ai-studio-session";

export type {
  AspectRatioKey,
  ImageSizeKey,
  LightingModeKey,
  PeopleAgeKey,
  PeopleGenderKey,
  PersonalizeOptionKey,
  ScenePerson,
} from "./room-options";

export {
  ASPECT_RATIO_OPTIONS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_LIGHTING_MODE,
  IMAGE_SIZE_OPTIONS,
  LIGHTING_OPTIONS,
  PEOPLE_AGE_OPTIONS,
  PEOPLE_GENDER_OPTIONS,
  PERSONALIZE_OPTIONS,
} from "./room-options";
