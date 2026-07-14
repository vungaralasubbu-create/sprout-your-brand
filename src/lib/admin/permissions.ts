// Central permission catalog for Admin RBAC.
// Keep in sync with the seeded rows in admin_role_permissions and the
// public.has_admin_permission Postgres function.

export type PermissionKey = string;

export type PermissionGroup = {
  key: string;
  label: string;
  permissions: { key: PermissionKey; label: string }[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "sales_partners",
    label: "Sales Partners",
    permissions: [
      { key: "sales_partners.view", label: "View" },
      { key: "sales_partners.manage", label: "Manage" },
    ],
  },
  {
    key: "leads",
    label: "Leads",
    permissions: [
      { key: "leads.view", label: "View" },
      { key: "leads.create", label: "Create" },
      { key: "leads.upload", label: "Upload" },
      { key: "leads.assign", label: "Assign" },
      { key: "leads.reassign", label: "Reassign" },
    ],
  },
  {
    key: "lead_ownership",
    label: "Lead Ownership Review",
    permissions: [
      { key: "lead_ownership.view", label: "View" },
      { key: "lead_ownership.decide", label: "Decide" },
    ],
  },
  {
    key: "payments",
    label: "Payment Verification",
    permissions: [
      { key: "payments.view", label: "View" },
      { key: "payments.review", label: "Review" },
      { key: "payments.verify", label: "Verify" },
      { key: "payments.reject", label: "Reject" },
      { key: "payments.request_info", label: "Request Info" },
    ],
  },
  {
    key: "payment_links",
    label: "Payment Links",
    permissions: [
      { key: "payment_links.view", label: "View" },
      { key: "payment_links.manage", label: "Manage" },
    ],
  },
  {
    key: "earnings",
    label: "Earnings",
    permissions: [{ key: "earnings.view", label: "View" }],
  },
  {
    key: "payouts",
    label: "Payouts",
    permissions: [
      { key: "payouts.view", label: "View" },
      { key: "payouts.process", label: "Process" },
      { key: "payouts.approve", label: "Approve" },
      { key: "payouts.hold", label: "Hold" },
    ],
  },
  {
    key: "referrals",
    label: "Referrals",
    permissions: [
      { key: "referrals.view", label: "View" },
      { key: "referrals.approve", label: "Approve" },
      { key: "referrals.reject", label: "Reject" },
    ],
  },
  {
    key: "brands",
    label: "Brands",
    permissions: [
      { key: "brands.view", label: "View" },
      { key: "brands.verify", label: "Verify" },
      { key: "brands.request_info", label: "Request Info" },
      { key: "brands.reject", label: "Reject" },
    ],
  },
  {
    key: "support",
    label: "Support Tickets",
    permissions: [
      { key: "support.view", label: "View" },
      { key: "support.reply", label: "Reply" },
      { key: "support.request_info", label: "Request Info" },
      { key: "support.resolve", label: "Resolve" },
    ],
  },
  {
    key: "employment",
    label: "Employment",
    permissions: [
      { key: "employment.view", label: "View" },
      { key: "employment.approve", label: "Approve" },
      { key: "employment.manage", label: "Manage" },
    ],
  },
  {
    key: "attendance",
    label: "Attendance",
    permissions: [
      { key: "attendance.view", label: "View" },
      { key: "attendance.manage", label: "Manage" },
    ],
  },
  {
    key: "payroll",
    label: "Payroll",
    permissions: [
      { key: "payroll.view", label: "View" },
      { key: "payroll.prepare", label: "Prepare" },
      { key: "payroll.edit", label: "Edit" },
      { key: "payroll.approve", label: "Approve" },
      { key: "payroll.generate_slips", label: "Generate Slips" },
      { key: "payroll.pay", label: "Mark Paid" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    permissions: [
      { key: "analytics.view", label: "View" },
      { key: "sales_command.view", label: "Sales Command Center" },
    ],
  },
  {
    key: "programs",
    label: "Programs",
    permissions: [
      { key: "programs.view", label: "View" },
      { key: "programs.manage", label: "Manage" },
    ],
  },
  {
    key: "risk_review",
    label: "Risk Review",
    permissions: [
      { key: "risk_review.view", label: "View" },
      { key: "risk_review.review", label: "Review" },
      { key: "risk_review.resolve", label: "Resolve" },
      { key: "risk_review.dismiss", label: "Dismiss" },
    ],
  },
  {
    key: "admin_team",
    label: "Admin Team",
    permissions: [
      { key: "admin_team.view", label: "View" },
      { key: "admin_team.manage", label: "Manage" },
    ],
  },
  {
    key: "system_settings",
    label: "System Settings",
    permissions: [
      { key: "system_settings.view", label: "View" },
      { key: "system_settings.manage", label: "Manage" },
    ],
  },
];

export const ADMIN_ROLES: { value: string; label: string; description: string }[] = [
  { value: "super_admin", label: "Super Admin", description: "Full access to every Admin system." },
  { value: "sales_admin", label: "Sales Admin", description: "Sales partners, analytics, sales command, programs." },
  { value: "lead_manager", label: "Lead Manager", description: "Lead upload, assignment, ownership reviews." },
  { value: "payment_verifier", label: "Payment Verifier", description: "Review and verify partner payment submissions." },
  { value: "payout_manager", label: "Payout Manager", description: "Process, approve, and hold partner payouts." },
  { value: "referral_manager", label: "Referral Manager", description: "Approve or reject referral bonuses." },
  { value: "brand_manager", label: "Brand Manager", description: "Verify partner brand profiles." },
  { value: "support_agent", label: "Support Agent", description: "Reply to and resolve support tickets." },
  { value: "employment_admin", label: "Employment Admin", description: "Full-time applications, attendance, benefits." },
  { value: "payroll_admin", label: "Payroll Admin", description: "Prepare, approve, and mark payroll paid." },
];

export const ADMIN_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ADMIN_ROLES.map((r) => [r.value, r.label]),
);

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  inactive: "Inactive",
};
