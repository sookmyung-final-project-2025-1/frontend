import { ApiError, fetcher } from '@/api/fetcher';
import {
  QueryKey,
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

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
  responseSchema?: { parse: (v: unknown) => T };
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

type MutationOptions<TResponse, TVariables> = {
  method: Method;
  endpoint: string | ((vars: TVariables) => string);
  body?: (vars: TVariables) => unknown;
  contentType?: 'application/json' | 'multipart/form-data';
  authorization?: boolean;
  requestSchema?: { parse: (v: unknown) => TVariables };
  responseSchema?: { parse: (v: unknown) => TResponse };
  invalidateKeys?: QueryKey[];
  onSuccess?: (data?: TResponse) => void;
  onError?: (error: ApiError) => void;
};

export function useApiMutation<TResponse, TVariables = void>(
  opts: MutationOptions<TResponse, TVariables>
): UseMutationResult<TResponse, ApiError, TVariables> {
  const qc = useQueryClient();

  return useMutation<TResponse, ApiError, TVariables>({
    mutationFn: async (vars: TVariables) => {
      const safeVars = opts.requestSchema
        ? opts.requestSchema.parse(vars as unknown)
        : vars;

      const endpoint =
        typeof opts.endpoint === 'function'
          ? opts.endpoint(safeVars)
          : opts.endpoint;

      const rawBody =
        typeof opts.body === 'function'
          ? opts.body(safeVars)
          : (safeVars as unknown);

      const data = await fetcher<TResponse>({
        method: opts.method,
        endpoint,
        body: rawBody,
        authorization: opts.authorization ?? true,
        contentType: opts.contentType ?? 'application/json',
        schema: opts.responseSchema,
      });

      return data;
    },

    onSuccess: (data) => {
      if (opts.invalidateKeys?.length) {
        for (const key of opts.invalidateKeys) {
          qc.invalidateQueries({ queryKey: key });
        }
      }
      opts.onSuccess?.(data);
    },

    onError: (error) => {
      opts.onError?.(error as ApiError);
    },
  });
}
