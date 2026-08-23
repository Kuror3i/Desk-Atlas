import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, CheckCircle, Scan } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QRScanFlowProps {
  onBack: () => void;
}

interface ScannedBooking {
  deskId: string;
  deskName: string;
  bookingId?: string;
  reservationId?: string;
  userName: string;
  rentType: 'hourly' | 'day';
  hours?: number;
  total: number;
  date?: string;
  timeSlot?: string;
  duration?: string;
  alternatives?: string[];
}

export function QRScanFlow({ onBack }: QRScanFlowProps) {
  const [scannedData, setScannedData] = useState<ScannedBooking | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  // Simulate QR code detection after 3 seconds for demo purposes
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => {
        // Simulate successful scan with mock data
        const mockData: ScannedBooking = {
          deskId: 'A1',
          deskName: 'A1',
          reservationId: `RES${Date.now()}`,
          userName: 'John Doe',
          date: '2026-05-10',
          timeSlot: '09:00',
          duration: '4',
          rentType: 'hourly',
          total: 20,
          alternatives: ['A2', 'A3']
        };
        setScannedData(mockData);
        setIsScanning(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isScanning]);

  const handleCheckIn = () => {
    // Simulate check-in process
    alert('Check-in successful! Your workspace is ready.');
    onBack();
  };

  const handleCancel = () => {
    // Simulate cancellation
    if (confirm('Are you sure you want to cancel this booking?')) {
      alert('Booking cancelled successfully.');
      onBack();
    }
  };

  const handleRescan = () => {
    setScannedData(null);
    setIsScanning(true);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={scannedData ? handleRescan : onBack}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Scan QR Code</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {!scannedData ? (
          /* Camera Scanner */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold mb-3">Welcome Back!</h2>
              <p className="text-gray-600 text-lg">Position your QR code in front of the camera</p>
            </div>

            <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-square relative">
              {/* Simulated camera view */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 border-4 border-white rounded-2xl relative">
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-[#009689]"></div>
                  <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-[#009689]"></div>
                  <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-[#009689]"></div>
                  <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-[#009689]"></div>

                  {/* Scanning animation */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Scan className="w-16 h-16 text-[#009689] animate-pulse" />
                    </div>
                  )}
                </div>
              </div>

              {/* Status text */}
              <div className="absolute bottom-12 left-0 right-0 text-center">
                <div className="inline-block bg-black bg-opacity-75 px-6 py-3 rounded-full">
                  <p className="text-white text-lg font-medium">
                    {isScanning ? 'Scanning...' : 'Ready to scan'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#e6f7f5] border border-[#b3e7e0] rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Camera className="w-6 h-6 text-[#009689] mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">How to scan:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Hold your QR code steady in front of the camera</li>
                    <li>• Keep the QR code within the white frame</li>
                    <li>• Ensure good lighting for best results</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm">
              The camera will automatically detect and scan your QR code
            </p>
          </div>
        ) : (
          /* Scanned Booking Details */
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-semibold mb-2">QR Code Verified!</h2>
              <p className="text-gray-600 text-lg">Welcome, {scannedData.userName}</p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              {/* QR Code Display */}
              <div className="flex justify-center mb-6">
                <QRCodeSVG
                  value={JSON.stringify(scannedData)}
                  size={200}
                  level="H"
                />
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                <h3 className="font-semibold text-lg mb-3">
                  {scannedData.bookingId ? 'Booking Details' : 'Reservation Details'}
                </h3>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <p className="text-gray-600">ID:</p>
                  <p className="font-medium text-right">
                    {scannedData.bookingId || scannedData.reservationId}
                  </p>

                  <p className="text-gray-600">Desk:</p>
                  <p className="font-medium text-right">{scannedData.deskName}</p>

                  {scannedData.date && (
                    <>
                      <p className="text-gray-600">Date:</p>
                      <p className="font-medium text-right">{scannedData.date}</p>
                    </>
                  )}

                  {scannedData.timeSlot && (
                    <>
                      <p className="text-gray-600">Time:</p>
                      <p className="font-medium text-right">{scannedData.timeSlot}</p>
                    </>
                  )}

                  <p className="text-gray-600">Type:</p>
                  <p className="font-medium text-right capitalize">
                    {scannedData.rentType === 'day' ? 'Full Day' : `${scannedData.duration || scannedData.hours} Hours`}
                  </p>

                  <p className="text-gray-600">Total:</p>
                  <p className="font-medium text-right">${scannedData.total}</p>
                </div>

                {scannedData.alternatives && scannedData.alternatives.length > 0 && (
                  <div className="pt-3 mt-3 border-t">
                    <p className="text-gray-600 mb-2">Alternative Spaces:</p>
                    <p className="font-medium">{scannedData.alternatives.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                <p className="text-green-800 font-medium">
                  {scannedData.bookingId ? '✓ Active Booking' : '✓ Confirmed Reservation'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCheckIn}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
              >
                Check In Now
              </button>

              <button
                onClick={handleCancel}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
              >
                Cancel Booking
              </button>

              <button
                onClick={onBack}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 rounded-xl text-lg font-medium transition-colors"
              >
                Return to Main Screen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
