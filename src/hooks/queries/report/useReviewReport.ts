import { useApiMutation } from '../useApi';

type ReviewResponse = {
  reviewedBy: string;
  comment: string;
  isFraud: boolean;
};

export const useReviewReport = (reportId: string) => {
  const params = new URLSearchParams({ reportId });

  return useApiMutation<ReviewResponse, string>({
    method: 'PUT',
    endpoint: `/proxy/reports/${params}/review`,
  });
};
