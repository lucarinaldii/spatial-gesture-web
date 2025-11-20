import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Smartphone } from 'lucide-react';

export const QRCodeConnection = () => {
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [connectionUrl, setConnectionUrl] = useState('');

  useEffect(() => {
    // Get current URL and create mobile camera URL
    const baseUrl = window.location.origin;
    const mobileUrl = `${baseUrl}/mobile-camera?session=${sessionId}`;
    setConnectionUrl(mobileUrl);
  }, [sessionId]);

  return (
    <Card className="p-6 glass-panel">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Use Phone Camera</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Scan this QR code with your smartphone to use its camera for hand tracking
        </p>
        {connectionUrl && (
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG 
              value={connectionUrl} 
              size={200}
              level="H"
              includeMargin
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">Session: {sessionId}</p>
      </div>
    </Card>
  );
};
