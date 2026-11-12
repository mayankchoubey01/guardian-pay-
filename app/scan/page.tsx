'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMember } from '@/components/MemberContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { QrCode, Scan, CreditCard, Shield, AlertTriangle, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';

function ScanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeMember } = useMember();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{ name: string; handle: string; amount: string; note: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const parseScannedData = (data: string) => {
    try {
      if (data.startsWith('fgpay://')) {
        const url = new URL(data);
        const name = url.searchParams.get('name') || '';
        const handle = url.searchParams.get('id') || url.searchParams.get('handle') || '';
        const amount = url.searchParams.get('amount') || '';
        const note = url.searchParams.get('note') || '';

        setParsedData({ name, handle, amount, note });
        return { name, handle, amount, note };
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const prefill = searchParams.get('data');
    if (prefill) {
      try {
        const decoded = decodeURIComponent(prefill);
        setScannedData(decoded);
        parseScannedData(decoded);
      } catch {}
    }
  }, [searchParams]);

  const startScanner = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        startScanLoop();
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permission in browser settings.');
      console.error('Camera error:', err);
    }
  };

  const stopScanner = () => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  const startScanLoop = () => {
    if (!scanning || !videoRef.current) return;

    if ('BarcodeDetector' in window) {
      scanWithBarcodeDetector();
    } else {
      scanWithCanvas();
    }
  };

  const scanWithBarcodeDetector = async () => {
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const scanLoop = async () => {
        if (!scanning || !videoRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              stopScanner();
              handleScanResult(rawValue);
              return;
            }
          }
        } catch (e) {
        }
        if (scanning) {
          scanIntervalRef.current = setTimeout(scanLoop, 200);
        }
      };
      scanLoop();
    } catch {
      scanWithCanvas();
    }
  };

  const scanWithCanvas = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const scanLoop = () => {
      if (!scanning || !videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        if (scanning) scanIntervalRef.current = setTimeout(scanLoop, 100);
        return;
      }

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
      }

      if (scanning) scanIntervalRef.current = setTimeout(scanLoop, 300);
    };
    scanLoop();
  };

  const handleScanResult = (data: string) => {
    setScannedData(data);
    const parsed = parseScannedData(data);
    if (parsed) {
      toast.success('QR code scanned! Review and confirm payment.');
    } else {
      toast.error('Invalid QR code format. Expected Guardian Pay QR.');
    }
  };

  const handleManualEntry = () => {
    const testData = prompt('Enter fgpay:// URL (for demo):',
      'fgpay://pay?name=Grocery%20Mart&id=%2B1-555-GROCER&amount=35&note=Weekly%20groceries');
    if (testData) {
      handleScanResult(testData);
    }
  };

  const proceedToPay = () => {
    if (parsedData) {
      router.push(`/send?contact=${encodeURIComponent(parsedData.name)}&handle=${encodeURIComponent(parsedData.handle)}&amount=${parsedData.amount}&note=${encodeURIComponent(parsedData.note)}`);
    }
  };

  const resetScan = () => {
    setScannedData(null);
    setParsedData(null);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="px-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scan to Pay</h1>
          <p className="text-slate-500 text-sm mt-0.5">Scan a Guardian Pay QR code</p>
        </div>
      </div>

      {/* Scanner Area */}
      {!scanning && !scannedData ? (
        <Card className="px-2">
          <CardContent className="p-6 text-center">
            <div className="w-28 h-28 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center">
              <QrCode className="w-14 h-14 text-white" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Scan a QR Code</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">Point your camera at a Guardian Pay QR code to pay instantly</p>

            <div className="space-y-3">
              <Button onClick={startScanner} className="w-full" size="lg">
                <Scan className="w-5 h-5 mr-2" aria-hidden="true" />
                Open Camera & Scan
              </Button>
              <Button variant="outline" onClick={handleManualEntry} className="w-full">
                Enter Code Manually
              </Button>
            </div>

            {/* Demo QR Codes */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-3">Demo QR Codes (tap to simulate scan)</p>
              <div className="grid grid-cols-3 gap-3">
                <DemoQRCard
                  name="Grocery Mart"
                  handle="+1-555-GROCER"
                  amount="35"
                  note="Weekly groceries"
                  color="green"
                  onClick={() => handleScanResult('fgpay://pay?name=Grocery%20Mart&id=%2B1-555-GROCER&amount=35&note=Weekly%20groceries')}
                />
                <DemoQRCard
                  name="Prize Claim Center"
                  handle="+1-555-PRIZE"
                  amount="8"
                  note="Congratulations you won!"
                  color="purple"
                  onClick={() => handleScanResult('fgpay://pay?name=Prize%20Claim%20Center&id=%2B1-555-PRIZE&amount=8&note=Congratulations%20you%20won!')}
                />
                <DemoQRCard
                  name="KYC Verify Desk"
                  handle="+1-555-KYC"
                  amount="5"
                  note="Bank verification required"
                  color="red"
                  onClick={() => handleScanResult('fgpay://pay?name=KYC%20Verify%20Desk&id=%2B1-555-KYC&amount=5&note=Bank%20verification%20required')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : scanning ? (
        <Card className="px-2 overflow-hidden">
          <CardContent className="p-0 relative">
            <video
              ref={videoRef}
              className="w-full aspect-video object-cover bg-black"
              playsInline
              autoPlay
              muted
              aria-label="QR code scanner camera"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 border-2 border-white/50 rounded-xl" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white" />
                <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-transparent via-white/10 to-transparent rounded-xl" />
              </div>
              <p className="mt-4 text-center text-sm opacity-80">Position QR code within the frame</p>
              <Button variant="ghost" className="mt-4 text-white hover:bg-white/10" onClick={stopScanner}>
                Cancel
              </Button>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <div className="flex gap-1">
                {[1,2,3].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{animationDelay: `${i * 150}ms`}} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 px-2">
          {/* Scanned Result */}
          <Card className={cn('border-2', parsedData ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50')}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center',
                  parsedData ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                )}>
                  {parsedData ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">
                    {parsedData ? 'Valid Guardian Pay QR' : 'Unknown QR Format'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {parsedData
                      ? `Ready to pay ${parsedData.name}`
                      : 'This QR code is not a recognized Guardian Pay code'
                    }
                  </p>
                </div>
              </div>

              {parsedData && (
                <div className="mt-4 space-y-2 pt-4 border-t border-slate-200">
                  <PaymentDetailRow label="Recipient" value={parsedData.name} icon={<CreditCard className="w-4 h-4" />} />
                  <PaymentDetailRow label="Handle" value={parsedData.handle} icon={<Shield className="w-4 h-4" />} />
                  <PaymentDetailRow label="Amount" value={`$${parseFloat(parsedData.amount).toFixed(2)}`} icon={<CreditCard className="w-4 h-4" />} highlight />
                  {parsedData.note && (
                    <PaymentDetailRow label="Note" value={parsedData.note} icon={<Shield className="w-4 h-4" />} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            {parsedData && (
              <Button onClick={proceedToPay} className="w-full" size="lg">
                <CreditCard className="w-5 h-5 mr-2" />
                Continue to Pay ${parseFloat(parsedData.amount).toFixed(2)}
              </Button>
            )}
            <Button variant="outline" onClick={resetScan} className="w-full">
              <XCircle className="w-5 h-5 mr-2" />
              Scan Another Code
            </Button>
            <Button variant="ghost" onClick={handleManualEntry} className="w-full text-slate-600">
              Enter Code Manually
            </Button>
          </div>

          {/* Safety Notice */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-slate-700">
                  <p className="font-medium">Guardian Protection Active</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>AI analyzes every scanned payment for scam signals</li>
                    <li>Suspicious QR codes (fake KYC, prize scams) are flagged</li>
                    <li>Payments held for family head review when risky</li>
                    <li>Money only moves after approval</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="px-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}

function DemoQRCard({ name, handle, amount, note, color, onClick }: {
  name: string;
  handle: string;
  amount: string;
  note: string;
  color: string;
  onClick: () => void;
}) {
  const colors = {
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200',
  };

  return (
    <button
      onClick={onClick}
      className={cn('p-3 rounded-xl border text-center transition-colors', colors[color as keyof typeof colors] || colors.green)}
    >
      <p className="font-medium text-slate-900 text-sm">{name}</p>
      <p className="text-xs text-slate-500">${amount}</p>
      <p className="text-xs text-slate-400 truncate mt-1">{note}</p>
    </button>
  );
}

function PaymentDetailRow({ label, value, icon, highlight }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={cn('font-medium text-slate-900', highlight && 'text-lg text-blue-600')}>{value}</p>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ScanPage() {
  const fallback = (
    <div className="max-w-md mx-auto space-y-4 pb-8 px-2">
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      <ScanPageContent />
    </Suspense>
  );
}