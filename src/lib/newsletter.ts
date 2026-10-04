// Kit (kit.com) form that collects newsletter signups.
// Find the form ID in Kit: Grow → Landing Pages & Forms → your form → Publish → HTML;
// it's the number in the form's action URL (…/forms/1234567/subscriptions).
export const KIT_FORM_ID = "";

// Tag ID for people who want to be considered as rhythm game playtesters.
// In Kit: Grow → Subscribers → Tags → click the tag; the number at the end of the URL.
export const RHYTHM_TAG_ID = "";

/** Parked for now (2026-10-04): set to true to show the signup on the main and links pages. */
const SHOW_NEWSLETTER = false;

/** Shown only when switched on; on the live site it also needs the Kit form ID. */
export const newsletterEnabled = SHOW_NEWSLETTER && (KIT_FORM_ID !== "" || import.meta.env.DEV);

export const kitSubscribeUrl = (formId: string) => `https://app.kit.com/forms/${formId}/subscriptions`;
