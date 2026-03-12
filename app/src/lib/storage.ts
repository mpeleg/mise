import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { generateId } from '../store';

function decode(base64: string): Uint8Array {
  const chars = atob(base64);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
  return bytes;
}

export async function uploadPhoto(localUri: string, userId: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${generateId()}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const { error } = await supabase.storage
    .from('recipe-photos')
    .upload(path, decode(base64), { contentType });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadRemotePhoto(remoteUrl: string, userId: string): Promise<string> {
  const res = await fetch(remoteUrl);
  const blob = await res.blob();
  const ext = remoteUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const path = `${userId}/${generateId()}.${ext}`;

  const { error } = await supabase.storage
    .from('recipe-photos')
    .upload(path, blob, { contentType: blob.type || 'image/jpeg' });

  if (error) throw new Error(`Remote photo upload failed: ${error.message}`);

  const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path);
  return data.publicUrl;
}
