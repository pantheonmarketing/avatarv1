interface Environment {
  supabase: {
    url: string;
    key: string;
  };
  isProduction: boolean;
}

const environment: Environment = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  isProduction: process.env.NODE_ENV === 'production',
};

export default environment; 