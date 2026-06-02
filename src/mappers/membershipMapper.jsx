const planFromTypeName = (name) => {
  if (!name) return 'basic';
  return String(name).toLowerCase();
};

export const mapMembershipToSubscription = (membership) => {
  if (!membership) {
    return {
      hasSubscription: false,
      plan: 'basic',
      status: null,
    };
  }
  const typeName = membership.memberShipType?.name || 'basic';
  const isActive = membership.status === 'ACTIVE';
  return {
    hasSubscription: isActive || membership.status === 'PENDING',
    plan: planFromTypeName(typeName),
    status: membership.status,
    validationCode: membership.validationCode,
    startDate: membership.startDate,
    memberShipType: membership.memberShipType,
    data: membership,
  };
};

export const mapMembershipTypesToPlans = (types = []) =>
  types.map((t) => ({
    id: t.id,
    name: t.name,
    price: t.price,
    duration: t.duration,
    planKey: planFromTypeName(t.name),
  }));

export const mapQuotaFromMembership = (membership, ridesCount = 0) => ({
  success: true,
  data: {
    plan: planFromTypeName(membership?.memberShipType?.name),
    status: membership?.status || 'NONE',
    ridesUsed: ridesCount,
    hasActiveMembership: membership?.status === 'ACTIVE',
  },
});
