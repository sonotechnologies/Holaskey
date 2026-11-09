import Image from 'next/image';

/** Terracotta signature sign-off; draws itself in once (clip-path reveal, fade under reduced motion). */
export function Signature({ className = '', width = 90 }: { className?: string; width?: number }) {
  return (
    <Image
      src="/signature.png"
      alt="HOLASKEY signature"
      width={width}
      height={Math.round((width * 166) / 282)}
      className={`animate-sign ${className}`}
    />
  );
}
