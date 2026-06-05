import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import type { ShareSelection } from '@/core/share/payload';
import { buildSharePayload } from '@/core/share/payload';
import { buildShareUrl, encodeShareHash } from '@/core/share/codec';
import { selectConfig, useConfigStore } from '@/state/store';

interface ShareQrPreviewProps {
  selection: ShareSelection;
  profileName: string;
}

/** Live QR for the current share checkbox selection (client-side only). */
export function ShareQrPreview({ selection, profileName }: ShareQrPreviewProps) {
  const config = useConfigStore(selectConfig);
  const hasSelection = selection.structure || selection.goals || selection.status || selection.design;

  const previewUrl = useMemo(() => {
    if (!hasSelection) {
      return buildShareUrl(window.location.origin, window.location.pathname, '');
    }
    const payload = buildSharePayload(config, selection, {
      profileName: profileName.trim() || 'default',
      sharedAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const hash = encodeShareHash(payload);
    return buildShareUrl(window.location.origin, window.location.pathname, hash);
  }, [config, hasSelection, selection, profileName]);

  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void QRCode.toDataURL(previewUrl, {
        margin: 1,
        width: 200,
        errorCorrectionLevel: 'M',
      }).then((url) => {
        if (!cancelled) setDataUrl(url);
      });
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [previewUrl]);

  if (!dataUrl) {
    return <p className="share-qr share-qr--empty">Generating QR code…</p>;
  }

  return (
    <div className="share-qr">
      <img src={dataUrl} width={200} height={200} alt="QR code for share link" />
      <p className="share-qr__hint">
        {hasSelection
          ? 'Scan to open this snapshot. Updates as you change options.'
          : 'Scan to open the default app URL.'}
      </p>
    </div>
  );
}
