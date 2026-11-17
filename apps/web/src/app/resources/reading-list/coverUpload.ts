import { createClient } from '@/lib/supabase/client';
// The raw values, not the CSS variables: a canvas cannot read a custom property.
import { colorValues } from '@/lib/brand';

// A cover uploaded from the page itself, by an admin, in the browser.
//
// Cropped to a book's 2:3 shape from the middle and shrunk to 360 by 540, which is sharp at twice
// the tile's size, before it leaves the machine. So a phone photo of a book does not put several
// megabytes on a page a hundred covers long, and every cover is the same shape whatever was chosen.

export const COVER_W = 360;
export const COVER_H = 540;

/** The largest 2:3 rectangle in the middle of a picture. */
export function centreCrop(width: number, height: number): { sx: number; sy: number; sw: number; sh: number } {
  const target = COVER_W / COVER_H;
  if (width / height > target) {
    const sw = Math.round(height * target);
    return { sx: Math.round((width - sw) / 2), sy: 0, sw, sh: height };
  }
  const sh = Math.round(width / target);
  return { sx: 0, sy: Math.round((height - sh) / 2), sw: width, sh };
}

async function toCoverJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { sx, sy, sw, sh } = centreCrop(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = COVER_W;
  canvas.height = COVER_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot prepare the picture.');
  // Behind a transparent picture, so its see-through parts are not drawn black.
  ctx.fillStyle = colorValues.white;
  ctx.fillRect(0, 0, COVER_W, COVER_H);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, COVER_W, COVER_H);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The picture could not be prepared.'))), 'image/jpeg', 0.86));
}

/** Prepares the picture and puts it in this project's storage. Returns its public address, which
 *  the server checks again before any book uses it. */
export async function uploadCover(bookId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That is not a picture.');
  if (file.size > 20 * 1024 * 1024) throw new Error('That picture is over 20 MB.');
  const blob = await toCoverJpeg(file);
  const supabase = createClient();
  // A new name each time, so a replaced cover is never served from a cache as the old one.
  const path = `reading-covers/${bookId}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('assets').upload(path, blob, {
    contentType: 'image/jpeg', upsert: false, cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('assets').getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Uploaded, but no address came back for it.');
  return data.publicUrl;
}
