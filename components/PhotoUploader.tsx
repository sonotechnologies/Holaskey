'use client';
import { useRef, useState } from 'react';
import { ACCEPTED_REF_TYPES, MAX_REF_BYTES } from '@/lib/images';
import { fileExt, uploadWithProgress } from '@/lib/upload';
import { CameraIcon, CloseIcon } from './icons';

export interface UploadedPhoto {
  key: string;
  path: string | null; // set once uploaded
  preview: string;
  name: string;
  pct: number;
  note: string;
  error?: string;
}

/**
 * Large dashed drop zone on smoke. On phones the file input offers camera or gallery.
 * Files go straight to the private custom-refs bucket under <userId>/<requestId>/.
 */
export function PhotoUploader({
  userId,
  folder,
  max,
  photos,
  setPhotos,
  withNotes = true,
  compact = false,
}: {
  userId: string;
  folder: string;
  max: number;
  photos: UploadedPhoto[];
  setPhotos: (fn: (p: UploadedPhoto[]) => UploadedPhoto[]) => void;
  withNotes?: boolean;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  const add = (files: FileList | File[]) => {
    setError('');
    const list = Array.from(files);
    const room = max - photos.length;
    if (room <= 0) return setError(`You can add up to ${max} photos. Remove one to add another.`);
    if (list.length > room) setError(`Only ${room} more ${room === 1 ? 'photo fits' : 'photos fit'}, so we added the first ${room}.`);
    list.slice(0, room).forEach((file) => {
      const type = file.type || (/\.(heic|heif)$/i.test(file.name) ? 'image/heic' : '');
      if (!ACCEPTED_REF_TYPES.includes(type)) return setError(`${file.name} isn't a photo we can use. Use JPG, PNG, WebP or HEIC.`);
      if (file.size > MAX_REF_BYTES) return setError(`${file.name} is ${(file.size / 1048576).toFixed(1)} MB. The limit is 8 MB per photo.`);
      const key = crypto.randomUUID();
      const path = `${userId}/${folder}/${key}.${fileExt(file)}`;
      setPhotos((p) => [...p, { key, path: null, preview: URL.createObjectURL(file), name: file.name, pct: 0, note: '' }]);
      uploadWithProgress('custom-refs', path, file, (pct) => setPhotos((p) => p.map((x) => (x.key === key ? { ...x, pct } : x))))
        .then(() => setPhotos((p) => p.map((x) => (x.key === key ? { ...x, path, pct: 100 } : x))))
        .catch((e: Error) => setPhotos((p) => p.map((x) => (x.key === key ? { ...x, error: e.message, pct: 0 } : x))));
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center gap-3 border border-dashed bg-smoke px-6 text-center text-ink transition-colors ${compact ? 'py-6' : 'py-10 lg:py-16'} ${drag ? 'border-ink' : 'border-muted hover:border-ink'}`}
      >
        <CameraIcon />
        <span className="text-lg font-medium">{compact ? 'Add photos' : 'Add photos of what you want'}</span>
        {!compact && <span className="max-w-[36ch] text-sm text-muted">Screenshots, Pinterest or IG saves, a fit you saw — up to {max}</span>}
        <span className="label mt-2 inline-flex h-11 items-center border border-ink px-5">
          <span className="md:hidden">Camera or gallery</span>
          <span className="hidden md:inline">Choose photos</span>
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          if (e.target.files) add(e.target.files);
          e.target.value = '';
        }}
      />
      {error && (
        <p role="alert" className="flex items-baseline gap-2 text-[15px]">
          <span className="label text-err">Error</span>
          {error}
        </p>
      )}
      {photos.length > 0 && (
        <ul className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
          {photos.map((ph, i) => (
            <li key={ph.key} className="flex w-[152px] flex-none flex-col gap-2">
              <div className="relative aspect-[4/5] overflow-hidden bg-smoke">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.preview} alt={ph.note || `Reference photo ${i + 1}`} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                <span className="label-sm absolute inset-0 -z-0 flex items-center justify-center p-2 text-center text-[10px] text-muted">{ph.name}</span>
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => setPhotos((p) => p.filter((x) => x.key !== ph.key))}
                  className="absolute right-0 top-0 z-10 flex h-11 w-11 items-center justify-center bg-bg/80 text-ink"
                >
                  <CloseIcon size={16} />
                </button>
                <div
                  className="absolute bottom-0 left-0 z-10 h-[3px] bg-accent transition-[width,opacity] duration-150"
                  style={{ width: `${ph.pct}%`, opacity: ph.path || ph.error ? 0 : 1 }}
                  role="progressbar"
                  aria-valuenow={ph.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Uploading photo ${i + 1}`}
                />
              </div>
              {ph.error ? (
                <p className="text-xs">
                  <span className="label-sm text-err">Error</span> {ph.error}
                </p>
              ) : !ph.path ? (
                <p className="label-sm text-muted">Uploading… {ph.pct}%</p>
              ) : null}
              {withNotes && (
                <>
                  <label htmlFor={`note-${ph.key}`} className="sr-only">
                    Note for photo {i + 1}
                  </label>
                  <input
                    id={`note-${ph.key}`}
                    value={ph.note}
                    maxLength={120}
                    onChange={(e) => setPhotos((p) => p.map((x) => (x.key === ph.key ? { ...x, note: e.target.value } : x)))}
                    placeholder="Note, e.g. this collar"
                    className="h-10 min-w-0 border border-line bg-smoke px-2.5 text-sm text-ink outline-none focus:border-ink"
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
