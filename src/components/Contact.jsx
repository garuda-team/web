import { useState } from "react";
import { GhostWord, SplitWords } from "./Reveal.jsx";
import { ghosts, site, ui } from "../content.js";

const c = ui.contact;

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = c.required;
    if (!form.email.trim()) errs.email = c.required;
    else if (!isEmail(form.email.trim())) errs.email = c.invalidEmail;
    if (!form.message.trim()) errs.message = c.required;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body = `${form.message}\n\n— ${form.name} <${form.email}>`;
    const href = `mailto:${site.contactEmail}?subject=${encodeURIComponent(c.subject)}&body=${encodeURIComponent(body)}`;
    setStatus(c.sending);
    window.location.href = href;
  };

  return (
    <section id="contact" className="section contact surface-paper" data-surface="paper" data-wave aria-labelledby="contact-title">
      <GhostWord text={ghosts.contact} />
      <div className="wrap">
        <div className="section-head">
          <SplitWords as="h2" id="contact-title" className="h2" text={c.title} />
          <p className="contact__lead">{c.lead}</p>
        </div>

        <form className="contact__form" onSubmit={onSubmit} noValidate>
          <div className="contact__row">
            <label className="contact__field">
              <span className="contact__label">{c.name}</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder={c.namePlaceholder}
                value={form.name}
                onChange={set("name")}
                aria-invalid={errors.name ? "true" : undefined}
              />
              {errors.name ? <span className="contact__error">{errors.name}</span> : null}
            </label>

            <label className="contact__field">
              <span className="contact__label">{c.email}</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder={c.emailPlaceholder}
                value={form.email}
                onChange={set("email")}
                aria-invalid={errors.email ? "true" : undefined}
              />
              {errors.email ? <span className="contact__error">{errors.email}</span> : null}
            </label>
          </div>

          <label className="contact__field">
            <span className="contact__label">{c.message}</span>
            <textarea
              name="message"
              rows={5}
              placeholder={c.messagePlaceholder}
              value={form.message}
              onChange={set("message")}
              aria-invalid={errors.message ? "true" : undefined}
            />
            {errors.message ? <span className="contact__error">{errors.message}</span> : null}
          </label>

          <div className="contact__actions">
            <button type="submit" className="contact__send">{c.send}</button>
            {status ? <span className="contact__status" role="status">{status}</span> : null}
          </div>

          <p className="contact__fallback">
            {c.orWriteTo}{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
          </p>
        </form>
      </div>
    </section>
  );
}
