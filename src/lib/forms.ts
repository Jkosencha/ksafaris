// Shared styling and submit handling for the enquiry and booking forms.

export const fieldClass =
  'mt-1 block w-full rounded-md border border-mist-300 bg-white px-3 py-2.5 text-base text-ink-900 placeholder:text-ink-600/60 focus:border-reed-500 focus:ring-2 focus:ring-reed-300/40 focus:outline-none';
export const labelClass = 'block text-sm font-medium text-ink-800';

/**
 * Where submissions go. Set PUBLIC_ENQUIRY_ENDPOINT (Formspree, Web3Forms, a Netlify function…) in .env.
 * Without it, forms fall back to opening a pre-filled email to the office.
 */
export const FORM_ENDPOINT = (import.meta.env.PUBLIC_ENQUIRY_ENDPOINT as string | undefined) || '';

const SKIP = new Set(['website', 'subject']);

/** The visible label for a field: its <label for>, data-label, or the fieldset legend. */
function labelFor(form: HTMLFormElement, name: string) {
  const item = form.elements.namedItem(name);
  const el = (item instanceof RadioNodeList ? item[0] : item) as HTMLElement | null;
  if (!el) return name;
  const text =
    el.dataset.label ||
    (el.id && form.querySelector(`label[for="${el.id}"]`)?.textContent) ||
    el.closest('fieldset')?.querySelector('legend')?.textContent ||
    name;
  return text.replace(/\*/g, '').trim();
}

/** Turn the form into "Label: value" lines, in the order the fields appear. */
function summarise(form: HTMLFormElement, data: FormData) {
  const names = [...form.elements]
    .map((e) => (e as HTMLInputElement).name)
    .filter((n, i, all) => n && !SKIP.has(n) && all.indexOf(n) === i);
  return names
    .map((name) => {
      const values = data.getAll(name).map(String).filter(Boolean);
      return values.length ? `${labelFor(form, name)}: ${values.join(', ')}` : '';
    })
    .filter(Boolean)
    .join('\n');
}

/** Send every form matching `selector` to the endpoint, or by email when none is set. */
export function wireForms(selector: string, sentMessage: string) {
  document.querySelectorAll<HTMLFormElement>(selector).forEach((form) => {
    const status = form.querySelector<HTMLElement>('[data-form-status]')!;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const email = form.dataset.email!;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      if (data.get('website')) return; // honeypot

      const endpoint = form.dataset.endpoint;
      if (!endpoint) {
        const subject = String(data.get('subject') ?? 'Safari enquiry');
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summarise(form, data))}`;
        status.className = 'text-sm text-ink-700';
        status.textContent = 'Your email app should open with your details ready to send.';
        return;
      }

      button.disabled = true;
      status.className = 'text-sm text-ink-700';
      status.textContent = 'Sending…';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        status.className = 'text-sm font-medium text-moss-700';
        status.textContent = sentMessage;
      } catch {
        status.className = 'text-sm font-medium text-moss-700';
        status.textContent = `Sorry, something went wrong. Please email ${email} or message us on WhatsApp.`;
      } finally {
        button.disabled = false;
      }
    });
  });
}
