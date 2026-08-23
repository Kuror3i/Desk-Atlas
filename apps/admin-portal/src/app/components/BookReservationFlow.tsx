import { useState } from 'react';
import { ArrowLeft, Check, MapPin } from 'lucide-react';
import type { Desk } from './WorkspaceMap';
import { QRCodeSVG } from 'qrcode.react';

interface BookReservationFlowProps {
  desk: Desk;
  allDesks: Desk[];
  onBack: () => void;
}

type RentType = 'hourly' | 'day';
type PaymentMethod = 'cash' | 'card' | 'qr';

interface ReservationData {
  date: string;
  timeSlot: string;
  duration: string;
  rentType: RentType;
  alternativeDesks: string[];
  fullName: string;
  email: string;
  privacyConsent: boolean;
  paymentMethod: PaymentMethod;
}

export function BookReservationFlow({ desk, allDesks, onBack }: BookReservationFlowProps) {
  const [step, setStep] = useState(1);
  const [reservationData, setReservationData] = useState<Partial<ReservationData>>({
    alternativeDesks: []
  });
  const [showAlternativeMap, setShowAlternativeMap] = useState(false);

  const totalSteps = 6;

  const availableDesks = allDesks.filter(d =>
    d.id !== desk.id && (d.status === 'available' || d.status === 'pending')
  );

  const handleReservationDetails = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setReservationData({
      ...reservationData,
      date: formData.get('date') as string,
      timeSlot: formData.get('timeSlot') as string,
      duration: formData.get('duration') as string,
      rentType: formData.get('rentType') as RentType
    });
    setStep(2);
  };

  const toggleAlternativeDesk = (deskId: string) => {
    const alternatives = reservationData.alternativeDesks || [];
    if (alternatives.includes(deskId)) {
      setReservationData({
        ...reservationData,
        alternativeDesks: alternatives.filter(id => id !== deskId)
      });
    } else if (alternatives.length < 4) {
      setReservationData({
        ...reservationData,
        alternativeDesks: [...alternatives, deskId]
      });
    }
  };

  const handleUserInfo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setReservationData({
      ...reservationData,
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      privacyConsent: formData.get('privacy') === 'on'
    });
    setStep(4);
  };

  const handlePaymentMethod = (method: PaymentMethod) => {
    setReservationData({ ...reservationData, paymentMethod: method });
    setStep(5);
  };

  const handlePaymentConfirm = () => {
    setStep(6);
  };

  const calculateTotal = () => {
    if (reservationData.rentType === 'day') return desk.dayRate;
    const hours = parseInt(reservationData.duration || '1');
    return desk.hourlyRate * hours;
  };

  const qrData = JSON.stringify({
    deskId: desk.id,
    deskName: desk.name,
    reservationId: `RES${Date.now()}`,
    userName: reservationData.fullName,
    date: reservationData.date,
    timeSlot: reservationData.timeSlot,
    duration: reservationData.duration,
    rentType: reservationData.rentType,
    alternatives: reservationData.alternativeDesks,
    total: calculateTotal()
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
          <h1 className="text-2xl font-semibold">Book Reservation - {desk.name}</h1>
          <div className="text-sm text-gray-600">Step {step} of {totalSteps}</div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full bg-purple-600 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Step 1: Reservation Details */}
        {step === 1 && (
          <form onSubmit={handleReservationDetails} className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Reservation Details</h2>

            <div>
              <label className="block text-lg font-medium mb-2">Reservation Date</label>
              <input
                type="date"
                name="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-lg font-medium mb-2">Time Slot</label>
              <select
                name="timeSlot"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-600 focus:outline-none"
              >
                <option value="">Select time slot</option>
                <option value="08:00">08:00 AM</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:00">01:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:00">04:00 PM</option>
                <option value="17:00">05:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-medium mb-2">Rent Type</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-purple-600">
                  <input type="radio" name="rentType" value="day" required className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-medium">Full Day</div>
                    <div className="text-gray-600">${desk.dayRate}</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-xl cursor-pointer hover:border-purple-600">
                  <input type="radio" name="rentType" value="hourly" required className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-medium">Hourly</div>
                    <div className="text-gray-600">${desk.hourlyRate}/hour</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium mb-2">Duration (hours)</label>
              <select
                name="duration"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-600 focus:outline-none"
              >
                <option value="">Select duration</option>
                {[1, 2, 3, 4, 6, 8].map(hours => (
                  <option key={hours} value={hours}>{hours} {hours === 1 ? 'hour' : 'hours'}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Alternative Spaces */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-semibold mb-2">Select Alternatives</h2>
              <p className="text-gray-600">Choose up to 4 backup spaces in case your preferred space becomes unavailable</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-sm">
                <span className="font-medium">Selected: {reservationData.alternativeDesks?.length || 0}/4</span>
              </p>
            </div>

            <div className="grid gap-3">
              {availableDesks.map(d => {
                const isSelected = reservationData.alternativeDesks?.includes(d.id);
                const canSelect = (reservationData.alternativeDesks?.length || 0) < 4;

                return (
                  <button
                    key={d.id}
                    onClick={() => toggleAlternativeDesk(d.id)}
                    disabled={!isSelected && !canSelect}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50'
                        : canSelect
                          ? 'border-gray-300 hover:border-purple-400'
                          : 'border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{d.name}</div>
                        <div className="text-sm text-gray-600">{d.zone} • {d.type.replace('-', ' ')}</div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: User Information */}
        {step === 3 && (
          <form onSubmit={handleUserInfo} className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Your Information</h2>

            <div>
              <label className="block text-lg font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-600 focus:outline-none"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-lg font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-600 focus:outline-none"
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
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 4: Payment Method */}
        {step === 4 && (
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
                className="border-2 border-gray-300 hover:border-purple-600 rounded-xl p-6 text-left transition-all hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">Cash</h3>
                <p className="text-gray-600 mt-1">Pay with cash at reception</p>
              </button>

              <button
                onClick={() => handlePaymentMethod('card')}
                className="border-2 border-gray-300 hover:border-purple-600 rounded-xl p-6 text-left transition-all hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">Card</h3>
                <p className="text-gray-600 mt-1">Credit or debit card payment</p>
              </button>

              <button
                onClick={() => handlePaymentMethod('qr')}
                className="border-2 border-gray-300 hover:border-purple-600 rounded-xl p-6 text-left transition-all hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">QR Payment</h3>
                <p className="text-gray-600 mt-1">Scan and pay with your mobile wallet</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Payment Confirmation */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Confirm Payment</h2>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-8">
              <div className="text-center">
                <p className="text-lg mb-4">Payment Method: <span className="font-semibold capitalize">{reservationData.paymentMethod}</span></p>
                <p className="text-4xl font-bold text-purple-600 mb-2">${calculateTotal()}</p>
                <p className="text-gray-600">Reservation Payment</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-2">
              <p className="text-gray-600">Desk: <span className="font-medium">{desk.name}</span></p>
              <p className="text-gray-600">Date: <span className="font-medium">{reservationData.date}</span></p>
              <p className="text-gray-600">Time: <span className="font-medium">{reservationData.timeSlot}</span></p>
              <p className="text-gray-600">Duration: <span className="font-medium">{reservationData.duration} hours</span></p>
              <p className="text-gray-600">Name: <span className="font-medium">{reservationData.fullName}</span></p>
              <p className="text-gray-600">Email: <span className="font-medium">{reservationData.email}</span></p>
            </div>

            <button
              onClick={handlePaymentConfirm}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Confirm Payment
            </button>
          </div>
        )}

        {/* Step 6: QR Code */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-semibold mb-2">Reservation Confirmed!</h2>
              <p className="text-gray-600 text-lg">Your space is reserved</p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <div className="flex justify-center mb-6">
                <QRCodeSVG value={qrData} size={256} level="H" />
              </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-2">
                <h3 className="font-semibold text-lg mb-3">Reservation Details</h3>
                <p className="text-gray-600">Preferred Desk: <span className="font-medium">{desk.name}</span></p>
                <p className="text-gray-600">Zone: <span className="font-medium">{desk.zone}</span></p>
                <p className="text-gray-600">Date: <span className="font-medium">{reservationData.date}</span></p>
                <p className="text-gray-600">Time: <span className="font-medium">{reservationData.timeSlot}</span></p>
                <p className="text-gray-600">Duration: <span className="font-medium">{reservationData.duration} hours</span></p>
                <p className="text-gray-600">Total: <span className="font-medium">${calculateTotal()}</span></p>

                {reservationData.alternativeDesks && reservationData.alternativeDesks.length > 0 && (
                  <div className="pt-3 mt-3 border-t">
                    <p className="font-medium mb-2">Alternative Spaces:</p>
                    {reservationData.alternativeDesks.map(deskId => {
                      const altDesk = allDesks.find(d => d.id === deskId);
                      return altDesk ? (
                        <p key={deskId} className="text-sm text-gray-600 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {altDesk.name} ({altDesk.zone})
                        </p>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-sm text-center text-purple-800">
                  ✉️ A copy of your reservation QR code has been sent to <span className="font-medium">{reservationData.email}</span>
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
