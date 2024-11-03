export interface AvatarDetails {
  name?: string;
  age?: string;
  gender?: string;
  location?: string;
  career?: string;
  profession?: string;
  [key: string]: any;
}

export interface AvatarData {
  id?: string;
  user_id?: string;
  clerk_user_id?: string;
  name?: string;
  targetAudience?: string;
  target_audience?: string;
  helpDescription?: string;
  help_description?: string;
  imageUrl?: string;
  image_url?: string;
  details: AvatarDetails;
  story?: string;
  currentWants?: string;
  current_wants?: string;
  painPoints?: string;
  pain_points?: string;
  desires?: string;
  offerResults?: string;
  offer_results?: string;
  biggestProblem?: string;
  biggest_problem?: string;
  humiliation?: string;
  frustrations?: string;
  complaints?: string;
  costOfNotBuying?: string;
  cost_of_not_buying?: string;
  biggestWant?: string;
  biggest_want?: string;
  created_at?: string;
  updated_at?: string;
  data?: {
    [key: string]: any;
  };
  imageGenerationKeywords?: string;
  image_generation_keywords?: string;
}

export interface AvatarResponse {
  success: boolean;
  data: AvatarData;
  error?: string;
}

export interface AvatarsResponse {
  success: boolean;
  data: AvatarData[];
  error?: string;
}
