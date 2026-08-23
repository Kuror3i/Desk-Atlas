import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import type { Desk } from './WorkspaceMap';
import { QRCodeSVG } from 'qrcode.react';

interface BookNowFlowProps {
  desk: Desk;
  onBack: () => void;
}

type RentType = 'hourly' | 'day';
type PaymentMethod = 'cash' | 'card' | 'qr';

interface BookingData {
  rentType: RentType;
  hours?: number;
  fullName: string;
  email: string;
  privacyConsent: boolean;
  paymentMethod: PaymentMethod;
}

export function BookNowFlow({ desk, onBack }: BookNowFlowProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});

  const totalSteps = 5;

  const handleRentSelection = (rentType: RentType, hours?: number) => {
    setBookingData({ ...bookingData, rentType, hours });
    setStep(2);
  };

  const handleUserInfo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBookingData({
      ...bookingData,
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      privacyConsent: formData.get('privacy') === 'on'
    });
    setStep(3);
  };

  const handlePaymentMethod = (method: PaymentMethod) => {
    setBookingData({ ...bookingData, paymentMethod: method });
    setStep(4);
  };

  const handlePaymentConfirm = () => {
    setStep(5);
  };

  const calculateTotal = () => {
    if (bookingData.rentType === 'day') return desk.dayRate;
    if (bookingData.rentType === 'hourly' && bookingData.hours) {
      return desk.hourlyRate * bookingData.hours;
    }
    return 0;
  };

  const qrData = JSON.stringify({
    deskId: desk.id,
    deskName: desk.name,
    bookingId: `BK${Date.now()}`,
    userName: bookingData.fullName,
    rentType: bookingData.rentType,
    hours: bookingData.hours,
    total: calculateTotal(),
    date: new Date().toISOString()
  });

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={step === 1 ? onBack : () => setStep(step - 1)}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Book Now - {desk.name}</h1>
          <div className="text-sm text-gray-600">Step {step} of {totalSteps}</div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-[#009689] transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Step 1: Rent Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Select Rent Type</h2>

            <div className="grid gap-6">
              <div
                onClick={() => handleRentSelection('day')}
                className="border-2 border-gray-300 hover:border-[#009689] rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg"
              >
                <h3 className="text-2xl font-semibold mb-2">Day Rent</h3>
                <p className="text-gray-600 mb-4">Full day access to the workspace</p>
                <div className="text-4xl font-bold text-[#009689]">${desk.dayRate}</div>
                <p className="text-gray-500 mt-2">per day</p>
              </div>

              <div
                onClick={() => setStep(1.5)}
                className="border-2 border-gray-300 hover:border-[#009689] rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg"
              >
                <h3 className="text-2xl font-semibold mb-2">Hourly Rate</h3>
                <p className="text-gray-600 mb-4">Pay by the hour</p>
                <div className="text-4xl font-bold text-[#009689]">${desk.hourlyRate}</div>
                <p className="text-gray-500 mt-2">per hour</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1.5: Hours Selection */}
        {step === 1.5 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Select Hours</h2>

            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 6, 8].map(hours => (
                <button
                  key={hours}
                  onClick={() => handleRentSelection('hourly', hours)}
                  className="border-2 border-gray-300 hover:border-[#009689] rounded-xl p-6 transition-all hover:shadow-lg"
                >
                  <div className="text-2xl font-semibold">{hours} {hours === 1 ? 'Hour' : 'Hours'}</div>
                  <div className="text-xl text-[#009689] mt-2">${desk.hourlyRate * hours}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: User Information */}
        {step === 2 && (
          <form onSubmit={handleUserInfo} className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Your Information</h2>

            <div>
              <label className="block text-lg font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-[#009689] focus:outline-none"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-lg font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-[#009689] focus:outline-none"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="privacy"
                id="privacy"
                required
                className="w-5 h-5 mt-1"
              />
              <label htmlFor="privacy" className="text-gray-600">
                I consent to the collection and processing of my personal information in accordance with the privacy policy. My data will be used solely for booking management and communication purposes.
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#009689] hover:bg-[#007d6f] text-white py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 3: Payment Method */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Payment Method</h2>

            <div className="bg-gray-100 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Amount</span>
                <span className="text-3xl font-bold">${calculateTotal()}</span>
              </div>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => handlePaymentMethod('cash')}
                className="border-2 border-gray-300 hover:border-[#009689] rounded-xl p-6 text-left transition-all hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">Cash</h3>
                <p className="text-gray-600 mt-1">Pay with cash at reception</p>
              </button>

              <button
                onClick={() => handlePaymentMethod('card')}
                className="border-2 border-gray-300 hover:border-[#009689] rounded-xl p-6 text-left transition-all hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">Card</h3>
                <p className="text-gray-600 mt-1">Credit or debit card payment</p>
              </button>

              <button
                onClick={() => handlePaymentMethod('qr')}
                className="border-2 border-gray-300 hover:border-[#009689] rounded-xl p-6 text-left transition-all hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">QR Payment</h3>
                <p className="text-gray-600 mt-1">Scan and pay with your mobile wallet</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment Confirmation */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Confirm Payment</h2>

            <div className="bg-[#e6f7f5] border border-[#b3e7e0] rounded-xl p-8">
              <div className="text-center">
                <p className="text-lg mb-4">Payment Method: <span className="font-semibold capitalize">{bookingData.paymentMethod}</span></p>
                <p className="text-4xl font-bold text-[#009689] mb-2">${calculateTotal()}</p>
                <p className="text-gray-600">
                  {bookingData.rentType === 'day' ? 'Full Day' : `${bookingData.hours} Hour${bookingData.hours !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-2">
              <p className="text-gray-600">Desk: <span className="font-medium">{desk.name}</span></p>
              <p className="text-gray-600">Zone: <span className="font-medium">{desk.zone}</span></p>
              <p className="text-gray-600">Name: <span className="font-medium">{bookingData.fullName}</span></p>
              <p className="text-gray-600">Email: <span className="font-medium">{bookingData.email}</span></p>
            </div>

            <button
              onClick={handlePaymentConfirm}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Confirm Payment
            </button>
          </div>
        )}

        {/* Step 5: QR Code */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-semibold mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600 text-lg">Your workspace is ready</p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <div className="flex justify-center mb-6">
                <QRCodeSVG value={qrData} size={256} level="H" />
              </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-2">
                <h3 className="font-semibold text-lg mb-3">Booking Details</h3>
                <p className="text-gray-600">Desk: <span className="font-medium">{desk.name}</span></p>
                <p className="text-gray-600">Zone: <span className="font-medium">{desk.zone}</span></p>
                <p className="text-gray-600">Duration: <span className="font-medium">
                  {bookingData.rentType === 'day' ? 'Full Day' : `${bookingData.hours} Hour${bookingData.hours !== 1 ? 's' : ''}`}
                </span></p>
                <p className="text-gray-600">Total: <span className="font-medium">${calculateTotal()}</span></p>
                <p className="text-gray-600">Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></p>
              </div>

              <div className="mt-6 p-4 bg-[#e6f7f5] border border-[#b3e7e0] rounded-xl">
                <p className="text-sm text-center text-blue-800">
                  ✉️ A copy of your QR code has been sent to <span className="font-medium">{bookingData.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onBack}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Return to Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
