import { siTiktok } from "simple-icons";

export default function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
    >
      <path d={siTiktok.path} />
    </svg>
  );
}
