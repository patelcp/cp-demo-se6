'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Text, RichText, Image, Link } from '@sitecore-content-sdk/nextjs';
import { NativeNavigationLink, NativeSearch } from '../../lib/native-controls';
import { normalizeNativeFields } from '../../lib/normalize-native-fields';
import type { HeroProps } from './Hero.props';
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}
const motionSnapshot = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const Default = ({ fields, params, page }: HeroProps) => {
  const data = normalizeNativeFields(fields?.data?.datasource);
  const motionAllowed = useSyncExternalStore(subscribeMotion, motionSnapshot, () => false);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const videoHref = data?.BackgroundVideo?.jsonValue?.value?.href;
  useEffect(() => {
    if (!video.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    video.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [videoHref, motionAllowed]);
  if (!data) return null;
  const hasImage = Boolean(data.Image?.jsonValue?.value?.src || page.mode.isEditing);
  const hasBackground = Boolean(data.BackgroundImage?.jsonValue?.value?.src || page.mode.isEditing);
  const safeVideo = videoHref && (/^https:\/\//i.test(videoHref) || /^\/(?!\/)/.test(videoHref)) ? videoHref : undefined;
  return <section className={`hero ${params.styles || ''}`} id={params.RenderingIdentifier}>
    {hasBackground && <div className="hero__backdrop"><Image field={data.BackgroundImage?.jsonValue} /></div>}
    {safeVideo && motionAllowed && !page.mode.isEditing && <><video className="hero__video" ref={video} src={safeVideo} poster={data.BackgroundImage?.jsonValue?.value?.src} muted loop playsInline preload="metadata" aria-hidden="true" /><button className="video-toggle" type="button" onClick={() => { if (!video.current) return; if (playing) { video.current.pause(); setPlaying(false); } else { video.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); } }}>{playing ? 'Pause background video' : 'Play background video'}</button></>}
    {page.mode.isEditing && data.BackgroundVideo?.jsonValue && <Link field={data.BackgroundVideo.jsonValue} className="hero__video-editor" />}
    <div className="shell hero__inner" data-has-image={hasImage}>
      <div className="hero__copy"><Text field={data.Eyebrow?.jsonValue} tag="p" className="eyebrow" /><Text field={data.Title?.jsonValue} tag="h1" /><RichText field={data.Summary?.jsonValue} className="rich-text hero__summary" /><NativeSearch fields={data} editing={page.mode.isEditing} />
        <div className="actions">{data.PrimaryLink?.jsonValue && <Link field={data.PrimaryLink.jsonValue} className="button" />}{data.SecondaryLink?.jsonValue && <Link field={data.SecondaryLink.jsonValue} className="button button--secondary" />}</div>
      </div>{hasImage && <div className="hero__media"><Image field={data.Image?.jsonValue} className="hero__image" /></div>}
      {!!data.children?.results?.length && <nav className="hero__quicklinks" aria-label="Quick links"><ul>{data.children.results.map(item => <li key={item.id}><NativeNavigationLink item={item} /></li>)}</ul></nav>}
    </div>
  </section>;
};
