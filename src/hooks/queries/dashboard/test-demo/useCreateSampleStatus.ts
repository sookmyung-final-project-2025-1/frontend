import { useApiMutation } from '../../useApi';

type SampleStatus = {
  additionProp1: {};
  additionProp2: {};
  additionProp3: {};
};

export const useCreateSampleStatus = () => {
  return useApiMutation<SampleStatus, void>({
    method: 'POST',
    endpoint: '/api/test/start-demo',
    authorization: true,
  });
};
