/* Small interface icons (24×24, drawn with the current text colour). */

const paths = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  prev: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor" stroke="none" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

export function Icon({ name, size = 20, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {paths[name]}
    </svg>
  );
}
