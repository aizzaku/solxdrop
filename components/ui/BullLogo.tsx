export function BullLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 8C4.5 8 3 6 3 3.8c2.4 0 4.3 1.3 5.1 3.2" />
      <path d="M17 8c2.5 0 4-2 4-4.2-2.4 0-4.3 1.3-5.1 3.2" />
      <path d="M7 7.2c-.7 1.4-1 3-.6 4.6.8 2.8 3.1 5 5.6 5s4.8-2.2 5.6-5c.4-1.6.1-3.2-.6-4.6" />
      <path d="M9.4 14.8c.8.6 1.7.9 2.6.9s1.8-.3 2.6-.9" />
      <circle cx="10.4" cy="12.4" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="13.6" cy="12.4" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
