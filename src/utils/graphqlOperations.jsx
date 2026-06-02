export const USER_FIELDS = `
  id
  name
  firstName
  phone
  email
  role
  driverAvailability
  isMembershipActive
  lastPosition { latitude longitude }
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
  departure { latitude longitude }
  arrival { latitude longitude }
  driver { id name firstName phone email driverAvailability }
  customer { id name firstName phone email }
`;

export const MEMBERSHIP_FIELDS = `
  id
  status
  startDate
  validationCode
  memberShipType { id name price duration }
  driver { id name firstName email phone }
`;

export const SIGNIN = `
  query Signin($input: SigninInput!) {
    signin(input: $input) {
      user { ${USER_FIELDS} }
      token
    }
  }
`;

export const SIGNUP = `
  mutation Signup($input: SignupInput!) {
    signup(input: $input) { ${USER_FIELDS} }
  }
`;

export const VERIFY_BEARER_TOKEN = `
  query VerifyBearerToken {
    verifyBearerToken { ${USER_FIELDS} }
  }
`;

export const GET_CURRENT_MEMBERSHIP = `
  query GetCurrentMemberShip {
    getCurrentMemberShip { ${MEMBERSHIP_FIELDS} }
  }
`;

export const GET_MEMBERSHIP_TYPES = `
  query GetMemberShipTypes {
    getMemberShipTypes { id name price duration }
  }
`;

export const UPGRADE_ACCOUNT = `
  mutation UpgradeAccount($input: UpgradeAccountInput!) {
    upgradeAccount(input: $input)
  }
`;

export const GET_RIDES = `
  query GetRides($input: GetRidesInput) {
    getRides(input: $input) { ${RIDE_FIELDS} }
  }
`;

export const CREATE_RIDE = `
  mutation CreateRide($input: CreateRideInput!) {
    createRide(input: $input) { ${RIDE_FIELDS} }
  }
`;

export const UPDATE_RIDE = `
  mutation UpdateRide($input: UpdateRideInput!) {
    updateRide(input: $input) { ${RIDE_FIELDS} }
  }
`;

export const REJECT_RIDE = `
  mutation RejectRide($input: RejectRideInput!) {
    rejectRide(input: $input)
  }
`;

export const PROPOSE_PRICE = `
  mutation ProposePrice($input: DriverProposalPriceInput!) {
    proposePrice(input: $input) {
      id
      proposalPrice
      createdAt
      driver { id name firstName }
      ride { id ref status price }
    }
  }
`;

export const ACCEPT_PROPOSAL_PRICE = `
  mutation AcceptProposalPrice($idDriverProposalPrice: ID!) {
    acceptProposalPrice(idDriverProposalPrice: $idDriverProposalPrice) { ${RIDE_FIELDS} }
  }
`;

export const GET_PROPOSAL_PRICES = `
  query GetProposalPrices($input: String!) {
    getProposalPrices(input: $input) {
      id
      proposalPrice
      createdAt
      driver { id name firstName phone driverAvailability }
      ride { id ref status price }
    }
  }
`;

export const GET_RIDES_HISTORY = `
  query GetRidesHistory($idRide: ID!) {
    getRidesHistory(idRide: $idRide) { date code }
  }
`;

export const GET_DRIVER_DASHBOARD_STAT = `
  query GetDriverDashBoardPeriodicStat($input: DashBoardPeriodicStatInput!) {
    getDriverDashBoardPeriodicStat(input: $input) {
      revenue
      nbRide
      totalDistance
      chartData { label value }
    }
  }
`;

export const UPDATE_USER = `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) { ${USER_FIELDS} }
  }
`;

export const GET_NOTIFICATIONS = `
  query GetNotifications($status: String!) {
    getNotifications(status: $status) {
      id idUser status category action date data
    }
  }
`;

export const READ_NOTIFICATION = `
  mutation ReadNotification {
    readNotification { ${USER_FIELDS} }
  }
`;
