/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ENQUIRY_ENDPOINT?: string;
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  /** Secret. Server only; never sent to the browser. */
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
}

declare namespace App {
  interface Locals {
    /** The signed-in staff member, on dashboard pages. */
    user?: import('./lib/auth/session').SessionUser;
    /** True when the dashboard runs locally without a database (sample data only). */
    officePreview?: boolean;
  }
}
