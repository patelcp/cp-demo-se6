import { CONSENT_ENDPOINT } from '../../lib/cannabissense-personalization';

export function CannabisSensePersonalizationConsent({
  allowed, campaign,
}: {
  allowed: boolean;
  campaign: { campaign: string; source?: string } | null;
}) {
  return (
    <aside className="shell campaign-consent" aria-label="Campaign personalization">
      <p>
        {allowed
          ? 'Campaign personalization is allowed for 30 minutes on this page.'
          : 'Optional: allow Sitecore personalization for the edibles campaign. This uses visitor cookies on this page for up to 30 minutes.'}
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
