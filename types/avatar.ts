export interface AvatarData {
  id?: string;
  name?: string;
  imageUrl?: string;
  details: {
    name: string;
    gender: string;
    ageRange: string;
    relationshipStatus: string;
    children: string;
    career: string;
    income: string;
    niche?: string;
  };
  story: string;
  currentWants: {
    main: string;
    subPoints: string[];
  };
  painPoints: Array<{
    main: string;
    subPoints: string[];
  }>;
  desires: Array<{
    main: string;
    subPoints: string[];
  }>;
  offerResults: Array<{
    main: string;
    subPoints: string[];
  }>;
  humiliation: Array<{
    main: string;
    subPoints: string[];
  }>;
  frustrations: Array<{
    main: string;
    subPoints: string[];
  }>;
  biggestProblem: {
    financial: {
      desire: string;
      problem: string;
    };
    emotional: {
      desire: string;
      problem: string;
    };
  };
  complaints: (string | { main: string; subPoints: string[] })[];
  worries: string[]; // Add this line
  costOfNotBuying: {
    financial: string;
    emotional: string;
    social: string;
  };
  biggestWant: { main: string; subPoints: string[] };
  shortDescription: {
    name: string;
    profession: string;
    niche: string;
  };
  // ... any other properties
}
