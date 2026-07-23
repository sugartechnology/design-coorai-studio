export type AiStudioProductRequest = {
  productId?: string;
  name?: string;
  description?: string;
  quantity?: number;
  width?: number;
  height?: number;
  depth?: number;
  imageUrl?: string;
};

export type AiStudioRoomDesignRequest = {
  roomType?: string;
  styleId?: string;
  lightingDetailed?: boolean;
  lightingMode?: string;
  people?: Array<{ gender?: string; ageGroup?: string; quantity?: number }>;
  peopleActive?: boolean;
  peopleGender?: string;
  peopleAgeGroup?: string;
  objectReplacement?: boolean;
  personalizeOptions?: string[];
  designMode?: "auto" | "manual" | string;
  promptNotes?: string;
  sceneLayout?: string;
  referenceImageUrl?: string;
  scenePreviewImageUrl?: string;
  galleryImageUrls?: string[];
  products?: AiStudioProductRequest[];
  imageSize?: string;
  aspectRatio?: string;
};

export type AiStudioRoomReferenceRequest = {
  roomType?: string;
  styleId?: string;
  roomSize?: string;
  promptNotes?: string;
  imageSize?: string;
  aspectRatio?: string;
};

export type AiImageGeneration = {
  id: string;
  jobId?: string;
  prompt?: string;
  referenceImageUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  altText?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  contextType?: string;
  source?: string;
};

/** Alias used by global AI gallery listing (CRM OfferAIImageGenerationResponse). */
export type AiGalleryItem = AiImageGeneration;

export type AiGalleryPage = {
  content?: AiGalleryItem[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  last?: boolean;
  page?: {
    size?: number;
    number?: number;
    totalElements?: number;
    totalPages?: number;
  };
};

export type CreditBalanceResponse = {
  organizationId?: string | null;
  totalCredit?: number;
  availableCredit?: number;
  walletBalance?: number;
  lowCreditThreshold?: number;
  lowCredit?: boolean;
  depleted?: boolean;
  currency?: string;
  evaluatedAt?: string;
  available?: boolean;
  messageCode?: string | null;
};

export type AiStudioCreditQuote = {
  contextType?: string;
  imageSize?: string;
  aspectRatio?: string;
  creditAmount?: number;
  supportedImageSizes?: string[];
  supportedAspectRatios?: string[];
};

export type AiImageContext =
  | "AI_STUDIO_ROOM"
  | "AI_STUDIO_ROOM_REFERENCE"
  | "AI_STUDIO_VIDEO"
  | "AI_STUDIO_FABRIC"
  | "AI_STUDIO_EDIT";
