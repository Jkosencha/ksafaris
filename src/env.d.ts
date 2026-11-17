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
    staff?: { id: string; name: string; role: 'admin' | 'staff' };
    /** True when the dashboard runs locally without Supabase keys (sample data only). */
    officePreview?: boolean;
  }
}
