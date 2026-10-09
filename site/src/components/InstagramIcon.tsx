import { siInstagram } from "simple-icons";

export default function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
    >
      <path d={siInstagram.path} />
    </svg>
  );
}
