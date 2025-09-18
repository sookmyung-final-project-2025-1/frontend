import { useHealthQuery } from '@/hooks/queries/dashboard/useHealthQuery';

export default function SystemHealth() {
  const { data } = useHealthQuery();
  return <div></div>;
}
