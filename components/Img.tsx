'use client';
import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

/** next/image that fades in once loaded (brief: "images fade in as they load"). */
export function Img({ className = '', alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  // Above-the-fold (priority) images paint immediately: fading them in would wait for
  // JavaScript and delay the largest contentful paint.
  if (props.priority) return <Image {...props} alt={alt} className={className} />;
  return <Image {...props} alt={alt} className={`img-fade ${className}`} data-loaded={loaded} onLoad={() => setLoaded(true)} />;
}

/** Plain dark placeholder used when an item has no photo yet. */
export function PhotoPlaceholder({ label = 'Product photo' }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-smoke label-sm text-muted">{label}</div>
  );
}
