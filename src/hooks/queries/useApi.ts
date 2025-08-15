import { fetcher } from '@/api/fetcher';
import { QueryKey, useQuery } from '@tanstack/react-query';

type FetchOptionsType = {
  contentType?: 'application/json' | 'multipart/form-data';
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

type UseQueryProps<T> = {
  queryKey: QueryKey;
  queryOptions: {
    endpoint: string;
    authorization?: boolean;
  };
  fetchOptions?: FetchOptionsType;
  responseSchema: { parse: (v: unknown) => T };
};

export function useApiQuery<T>({
  queryKey,
  queryOptions,
  fetchOptions,
  responseSchema,
}: UseQueryProps<T>) {
  return useQuery({
    queryKey: queryKey,
    queryFn: () =>
      fetcher<T>({
        method: 'GET',
        endpoint: queryOptions.endpoint,
        authorization: queryOptions?.authorization,
        contentType: fetchOptions?.contentType,
        schema: responseSchema,
      }),
    enabled: fetchOptions?.enabled ?? true,
    staleTime: fetchOptions?.staleTime,
    gcTime: fetchOptions?.gcTime,
  });
}

// useMutaion
type Method = 'POST' | 'PUT' | 'DELETE';

type MutationOptions = {
  method: Method;
  authorization?: boolean;
  headers?: Record<string, string>;
};

// export function useApiMutation({}: MutationOptions){
//     return useMutation({
//         mutationFn:
//     })
// }
