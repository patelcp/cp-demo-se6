import { CONSENT_ENDPOINT } from '../../lib/cannabissense-personalization';

export function CannabisSensePersonalizationConsent({
  allowed, campaign, site,
}: {
  allowed: boolean;
  site: 'aglc' | 'cannabissense';
  campaign: { campaign: string; source?: string } | null;
}) {
  return (
    <aside className="shell campaign-consent" aria-label="Demo personalization">
      <p>
        {allowed
          ? 'Demo personalization is allowed on this page until your choice expires.'
          : site === 'cannabissense'
            ? 'Optional: allow Sitecore personalization for the edibles campaign. This uses visitor cookies on this page for up to 30 minutes.'
            : 'Optional: allow Sitecore personalization on the AGLC demo home page. If a native variant is configured, this uses visitor cookies on this demo site for up to 30 minutes.'}
      </p>
      <form method="post" action={CONSENT_ENDPOINT}>
        <input type="hidden" name="choice" value={allowed ? 'revoke' : 'allow'} />
        {!allowed && campaign && <input type="hidden" name="utm_campaign" value={campaign.campaign} />}
        {!allowed && campaign?.source && <input type="hidden" name="utm_source" value={campaign.source} />}
        <button type="submit">{allowed ? 'Turn off personalization' : 'Allow personalization'}</button>
      </form>
    </aside>
  );
}
