export interface AvatarDetails {
  name?: string;
  age?: string;
  gender?: string;
  location?: string;
  career?: string;
  profession?: string;
  income?: string;
  niche?: string;
}

export interface AvatarData {
  id?: string;
  user_id?: string;
  clerk_user_id?: string;
  user_email?: string;
  name?: string;
  details: AvatarDetails | string;
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
  imageUrl?: string;
  image_url?: string;
  imageGenerationKeywords?: string;
  created_at?: string;
  targetAudience?: string;
  target_audience?: string;
  helpDescription?: string;
  help_description?: string;
}
