export const POSITION_FIELDS = `
  latitude
  longitude
`;

export const USER_FIELDS = `
  id
  name
  firstName
  phone
  email
  role
  driverAvailability
  isMembershipActive
  lastPosition { ${POSITION_FIELDS} }
`;

export const RIDE_FIELDS = `
  id
  ref
  departureName
  arrivalName
  status
  price
  distance
  createdAt
  acceptedAt
  startedAt
  completedAt
  canceledAt
  scheduledAt
  isReservation
  departure { ${POSITION_FIELDS} }
  arrival { ${POSITION_FIELDS} }
  driver { ${USER_FIELDS} }
  customer { ${USER_FIELDS} }
`;

export const MEMBERSHIP_TYPE_FIELDS = `
  id
  name
  price
  duration
`;

export const MEMBERSHIP_FIELDS = `
  id
  status
  startDate
  validationCode
  memberShipType { ${MEMBERSHIP_TYPE_FIELDS} }
  driver { id name firstName phone email }
`;

export const NOTIFICATION_FIELDS = `
  id
  idUser
  status
  category
  action
  date
  data
`;

export const PROPOSAL_PRICE_FIELDS = `
  id
  proposalPrice
  createdAt
  driver { ${USER_FIELDS} }
  ride { id ref status price departureName arrivalName }
`;

export const DASHBOARD_STAT_FIELDS = `
  revenue
  nbRide
  totalDistance
  chartData { label value }
`;
