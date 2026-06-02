import { NOTIFICATION_FIELDS } from '../fragments';

export const GET_NOTIFICATIONS_QUERY = `
  query GetNotifications($status: String!) {
    getNotifications(status: $status) { ${NOTIFICATION_FIELDS} }
  }
`;
