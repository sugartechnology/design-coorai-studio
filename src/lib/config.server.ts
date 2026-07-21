import process from "node:process";

// Server-only config. Values here must never be imported from client components.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    crmApiUrl: process.env.CRM_API_URL,
    companySlug: process.env.CRM_COMPANY_SLUG ?? "istikbal",
  };
}
