export const QUERY_KEYS = {
  emailCheck: (email: string) => ['emailCheck', email],
  businessNumCheck: (businessNumber: string) => [
    'businessNumber',
    businessNumber,
  ],
} as const;
