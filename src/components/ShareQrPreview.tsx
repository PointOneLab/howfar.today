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

  const previewUrl = useMemo(() => {
    const hasAny =
      selection.structure || selection.goals || selection.status || selection.design;
    if (!hasAny) return null;
    const payload = buildSharePayload(config, selection, {
      profileName: profileName.trim() || 'default',
      sharedAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const hash = encodeShareHash(payload);
    return buildShareUrl(window.location.origin, window.location.pathname, hash);
  }, [config, selection, profileName]);

  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) {
      setDataUrl(null);
      return;
    }
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

  if (!previewUrl) {
    return (
      <p className="share-qr share-qr--empty">Select at least one category to preview a QR code.</p>
    );
  }

  if (!dataUrl) {
    return <p className="share-qr share-qr--empty">Generating QR code…</p>;
  }

  return (
    <div className="share-qr">
      <img src={dataUrl} width={200} height={200} alt="QR code for share link" />
      <p className="share-qr__hint">Scan to open this snapshot. Updates as you change options.</p>
    </div>
  );
}
