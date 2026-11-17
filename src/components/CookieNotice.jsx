import { useState } from "react";
import { ui } from "../content.js";

const KEY = "garuda-cookie-notice";

const seen = () => {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

/* Informative notice (no accept/reject): only the language preference is stored. */
export default function CookieNotice() {
  const t = ui.cookies;
  const [open, setOpen] = useState(() => !seen());
  if (!open) return null;
  const close = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* storage blocked: it just shows again next visit */
    }
    setOpen(false);
  };
  return (
    <aside className="cookie-notice" role="region" aria-labelledby="cookie-notice-title">
      <div className="cookie-notice__body">
        <p id="cookie-notice-title" className="cookie-notice__title">{t.title}</p>
        <p className="cookie-notice__text">{t.text}</p>
      </div>
      <button type="button" className="cookie-notice__close" onClick={close} aria-label={t.close}>
        <span aria-hidden="true">×</span>
      </button>
    </aside>
  );
}
