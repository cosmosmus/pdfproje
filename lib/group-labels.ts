export type ContactGroup =
  | "APP_MEMBER"
  | "UNKNOWN_CUSTOMER"
  | "CURRENT_CUSTOMER"
  | "POTENTIAL_CUSTOMER";

export type GroupLabels = Record<ContactGroup, string>;

export const DEFAULT_GROUP_LABELS: GroupLabels = {
  APP_MEMBER: "App Üyesi",
  UNKNOWN_CUSTOMER: "Tanınmayan Müşteri",
  CURRENT_CUSTOMER: "Cari Müşterisi",
  POTENTIAL_CUSTOMER: "Potansiyel Müşteri",
};

type AdminLabelFields = {
  labelAppMember: string | null;
  labelUnknownCustomer: string | null;
  labelCurrentCustomer: string | null;
  labelPotentialCustomer: string | null;
};

/** Merges the admin's custom group names over the defaults (null/empty = default). */
export function resolveGroupLabels(admin: Partial<AdminLabelFields> | null | undefined): GroupLabels {
  return {
    APP_MEMBER: admin?.labelAppMember || DEFAULT_GROUP_LABELS.APP_MEMBER,
    UNKNOWN_CUSTOMER: admin?.labelUnknownCustomer || DEFAULT_GROUP_LABELS.UNKNOWN_CUSTOMER,
    CURRENT_CUSTOMER: admin?.labelCurrentCustomer || DEFAULT_GROUP_LABELS.CURRENT_CUSTOMER,
    POTENTIAL_CUSTOMER: admin?.labelPotentialCustomer || DEFAULT_GROUP_LABELS.POTENTIAL_CUSTOMER,
  };
}
