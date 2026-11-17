/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ENQUIRY_ENDPOINT?: string;
}

declare namespace App {
  interface Locals {
    /** The signed-in staff member, on dashboard pages. */
    user?: import('./lib/auth/session').SessionUser;
    /** True when the dashboard runs locally without a database (sample data only). */
    officePreview?: boolean;
    /** The agency's details from Site settings (set by the middleware for every page). */
    settings?: import('./lib/services/site-settings').SiteSettings;
  }
}
