import { useApiQuery } from '../useApi';

export type UseKpiQueryArgs = Readonly<{
  startTime: string;
  endTime: string;
}>;

export type Kpi = {
  additionProp1: {};
  additionProp2: {};
  additionProp3: {};
};

export const useKpiQuery = (args: UseKpiQueryArgs) => {
  const { startTime, endTime } = args;

  const kpiParameters = new URLSearchParams({
    startTime,
    endTime,
  }).toString();
  const isEnabled = Boolean(startTime && endTime);

  return useApiQuery<Kpi>({
    queryKey: ['dashboard', 'kpi', startTime, endTime],
    queryOptions: {
      endpoint: `/api/dashboard/kpis?${kpiParameters}}`,
      authorization: true,
    },
    fetchOptions: { enabled: isEnabled, staleTime: 0 },
  });
};
