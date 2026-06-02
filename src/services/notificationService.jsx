import graphqlClient from '../graphql/client';
import { GET_NOTIFICATIONS_QUERY } from '../graphql/queries/notification.queries';
import { READ_NOTIFICATION_MUTATION } from '../graphql/mutations/notification.mutations';

export const fetchNotifications = async (status = 'UNREAD') => {
  const data = await graphqlClient(GET_NOTIFICATIONS_QUERY, { status });
  return data?.getNotifications || [];
};

export const markAllNotificationsRead = async () => {
  const data = await graphqlClient(READ_NOTIFICATION_MUTATION);
  return data?.readNotification;
};
