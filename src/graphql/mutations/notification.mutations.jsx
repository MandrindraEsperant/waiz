import { USER_FIELDS } from '../fragments';

export const READ_NOTIFICATION_MUTATION = `
  mutation ReadNotification {
    readNotification { ${USER_FIELDS} }
  }
`;
