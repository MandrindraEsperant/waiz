import { DASHBOARD_STAT_FIELDS } from '../fragments';

export const GET_DRIVER_DASHBOARD_STAT_QUERY = `
  query GetDriverDashBoardPeriodicStat($input: DashBoardPeriodicStatInput!) {
    getDriverDashBoardPeriodicStat(input: $input) { ${DASHBOARD_STAT_FIELDS} }
  }
`;
