'use client';
import { EditingScripts } from '@sitecore-content-sdk/nextjs';

/** Native editing scripts only. Analytics will be added after consent design is verified. */
export default function Scripts() {
  return <EditingScripts />;
}
