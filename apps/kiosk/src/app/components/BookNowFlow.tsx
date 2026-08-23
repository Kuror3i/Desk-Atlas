import { useState } from 'react';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { WorkspaceMap, type Desk } from './WorkspaceMap';
import { QRCodeSVG } from 'qrcode.react';
import { UpcomingScheduleView } from './UpcomingScheduleView';

interface BookNowFlowProps {
  desk: Desk;
  allDesks: Desk[];
  onBack: () => void;
}

type RentType = 'hourly' | 'day';
type PaymentMethod = 'cash' | 'card' | 'qr';

interface BookingData {
  rentType: RentType;
  hours?: number;
  startTime?: string;
  endTime?: string;
  alternativeDesks: string[];
  fullName: string;
  email: string;
  privacyConsent: boolean;
  paymentMethod: PaymentMethod;
}

export function BookNowFlow({ desk, allDesks, onBack }: BookNowFlowProps) {
  const [step, setStep] = useState(0);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({
    alternativeDesks: []
  });
  const [isAlternativeAssigned, setIsAlternativeAssigned] = useState(false);
  const [assignedDesk, setAssignedDesk] = useState(desk.name);
  const [assignedDeskIndex, setAssignedDeskIndex] = useState(0);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Check if a time slot is pending (mock data - in real app this would come from API)
  const isPendingTimeSlot = (time: string) => {
    // Simulate some slots being pending
    return ['14:00', '14:15', '14:30', '14:45', '15:00'].includes(time);
  };

  // Filter desks by same zone to keep price range similar
  const availableDesks = allDesks.filter(d =>
    d.id !== desk.id &&
    d.zone === desk.zone && // Same zone for similar pricing
    (d.status === 'available' || d.status === 'pending')
  );

  // Generate time slots in 15-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Calculate end time (1 hour after start by default)
  const calculateDefaultEndTime = (start: string) => {
    const [hour, minute] = start.split(':').map(Number);
    const endHour = hour + 1;
    const endMinute = minute;

    if (endHour > 20) return '20:00';
    return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    const defaultEnd = calculateDefaultEndTime(time);
    setEndTime(defaultEnd);
  };

  const totalSteps = 7;

  const toggleAlternativeDesk = (deskId: string) => {
    const alternatives = bookingData.alternativeDesks || [];
    if (alternatives.includes(deskId)) {
      setBookingData({
        ...bookingData,
        alternativeDesks: alternatives.filter(id => id !== deskId)
      });
    } else if (alternatives.length < 3) {
      setBookingData({
        ...bookingData,
        alternativeDesks: [...alternatives, deskId]
      });
    }
  };

  const calculateHoursFromTime = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return (endMinutes - startMinutes) / 60;
  };

  const handleRentSelection = (rentType: RentType, hours?: number) => {
    if (rentType === 'day') {
      setBookingData({ ...bookingData, rentType, hours: 8 });
      setStep(3);
    } else {
      setBookingData({ ...bookingData, rentType });
      setStep(2.5);
    }
  };

  const handleTimeSelection = () => {
    if (!startTime || !endTime) return;

    const hours = calculateHoursFromTime(startTime, endTime);

    setBookingData({
      ...bookingData,
      rentType: 'hourly', // Explicitly set rentType
      startTime,
      endTime,
      hours
    });
    setStep(3);
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
    setStep(5);
  };

  const handlePaymentMethod = (method: PaymentMethod) => {
    setBookingData({ ...bookingData, paymentMethod: method });
    if (method === 'cash') {
      setStep(6); // Go to confirmation for cash
    } else {
      setStep(5.5); // Go to payment processing for card/QR
    }
  };

  const handlePaymentProcessing = () => {
    setPaymentProcessing(true);

    // Simulate payment gateway processing (3 seconds)
    setTimeout(() => {
      setPaymentProcessing(false);
      setPaymentConfirmed(true);

      // Show success notification
      setTimeout(() => {
        setStep(6); // Move to confirmation
      }, 2000);
    }, 3000);
  };

  const handlePaymentConfirm = () => {
    // Simulate checking if primary desk was taken
    const wasPrimaryTaken = Math.random() > 0.7;

    if (wasPrimaryTaken && bookingData.alternativeDesks && bookingData.alternativeDesks.length > 0) {
      const alternativeDeskId = bookingData.alternativeDesks[0];
      const alternativeDesk = allDesks.find(d => d.id === alternativeDeskId);

      setIsAlternativeAssigned(true);
      setAssignedDesk(alternativeDesk?.name || desk.name);
      setAssignedDeskIndex(1);
    } else {
      setIsAlternativeAssigned(false);
      setAssignedDesk(desk.name);
      setAssignedDeskIndex(0);
    }

    setStep(7);
  };

  const calculateTotal = () => {
    if (bookingData.rentType === 'day') return desk.dayRate;
    if (bookingData.rentType === 'hourly' && bookingData.hours) {
      return Math.round(desk.hourlyRate * bookingData.hours * 100) / 100;
    }
    return 0;
  };

  const formatTimeRange = () => {
    if (bookingData.startTime && bookingData.endTime) {
      return `${bookingData.startTime} - ${bookingData.endTime}`;
    }
    if (bookingData.hours) {
      return `${bookingData.hours} ${bookingData.hours === 1 ? 'hour' : 'hours'}`;
    }
    return '';
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

  // Generate queue number for cash payments
  const queueNumber = `Q${Math.floor(Math.random() * 9000) + 1000}`;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={step === 0 ? onBack : () => setStep(step - 1)}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Book Now - {desk.name}</h1>
          <div className="text-sm text-gray-600">Step {step + 1} of {totalSteps}</div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%`, backgroundColor: '#009689' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className={`${step === 3 ? 'max-w-6xl' : 'max-w-2xl'} mx-auto px-6 py-12`}>
        {/* Step 0: Upcoming Schedule View */}
        {step === 0 && (
          <UpcomingScheduleView
            deskName={desk.name}
            onContinue={() => setStep(1)}
            buttonText="Continue to Select Rent Type"
          />
        )}

        {/* Step 1: Rent Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Select Rent Type</h2>

            <div className="grid gap-6">
              <div
                onClick={() => handleRentSelection('day')}
                className="border-2 border-gray-300 hover:border-blue-600 rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg"
              >
                <h3 className="text-2xl font-semibold mb-2">Day Rent</h3>
                <p className="text-gray-600 mb-4">Full day access to the workspace</p>
                <div className="text-4xl font-bold text-blue-600">₱{desk.dayRate}</div>
                <p className="text-gray-500 mt-2">per day</p>
              </div>

              <div
                onClick={() => setStep(2.5)}
                className="border-2 border-gray-300 hover:border-blue-600 rounded-2xl p-8 cursor-pointer transition-all hover:shadow-lg"
              >
                <h3 className="text-2xl font-semibold mb-2">Hourly Rate</h3>
                <p className="text-gray-600 mb-4">Pay by the hour</p>
                <div className="text-4xl font-bold text-blue-600">₱{desk.hourlyRate}</div>
                <p className="text-gray-500 mt-2">per hour</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2.5: Time Selection for Hourly */}
        {step === 2.5 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Select Time Range</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                Select your start and end time. The end time will automatically be set to 1 hour after your start time, but you can adjust it.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                ⏳ Times marked "Pending payment" have unconfirmed cash payments.
              </p>
            </div>

            {startTime && isPendingTimeSlot(startTime) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 mb-1">Pending Payment Time Slot</p>
                    <p className="text-sm text-yellow-800">
                      This time has a pending cash payment. Make sure to select alternative spaces to guarantee a seat if the other user completes payment first.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-medium mb-2">Start Time</label>
                <select
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Select start time</option>
                  {timeSlots.map(slot => {
                    const isPending = isPendingTimeSlot(slot);
                    return (
                      <option key={slot} value={slot}>
                        {slot}{isPending ? ' ⏳ (Pending payment)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">End Time</label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!startTime}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-600 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select end time</option>
                  {timeSlots
                    .filter(slot => startTime && slot > startTime)
                    .map(slot => {
                      const hours = calculateHoursFromTime(startTime, slot);
                      const hoursDisplay = hours < 1
                        ? `${Math.round(hours * 60)} mins`
                        : hours === 1
                          ? '1 hr'
                          : `${hours} hrs`;

                      return (
                        <option key={slot} value={slot}>
                          {slot} ({hoursDisplay})
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            {startTime && endTime && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-sm text-green-800 mb-1">Calculated Duration</p>
                  <p className="text-2xl font-bold text-green-900">
                    {calculateHoursFromTime(startTime, endTime).toFixed(2)} hours
                  </p>
                  <p className="text-lg text-green-800 mt-2">
                    Total: ₱{(calculateHoursFromTime(startTime, endTime) * desk.hourlyRate).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleTimeSelection}
              disabled={!startTime || !endTime}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Alternative Spaces */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-semibold mb-2">Select Alternative Spaces</h2>
              <p className="text-gray-600">Choose up to 3 backup spaces from {desk.zone} in case another user books this desk simultaneously</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">
                    Due to network delays, two customers might book the same desk at the same time. Alternatives from the same zone ensure similar pricing and you'll still have a guaranteed space.
                  </p>
                </div>
              </div>
            </div>

            {availableDesks.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  No alternative desks available in {desk.zone}. You can still proceed, but there's a small risk if another user books simultaneously.
                </p>
              </div>
            )}

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-sm">
                <span className="font-medium">Selected: {bookingData.alternativeDesks?.length || 0}/3</span>
              </p>
            </div>

            {/* Interactive Workspace Map - Full Size for Kiosk */}
            <div className="border-2 border-gray-200 rounded-xl p-8 bg-white" style={{ minHeight: '700px', height: '70vh' }}>
              <WorkspaceMap
                desks={allDesks}
                onDeskClick={(clickedDesk) => {
                  if (clickedDesk.id !== desk.id && (clickedDesk.status === 'available' || clickedDesk.status === 'pending')) {
                    toggleAlternativeDesk(clickedDesk.id);
                  }
                }}
                selectedDeskId={desk.id}
                highlightedDeskIds={bookingData.alternativeDesks || []}
                interactiveZone={desk.zone}
              />
            </div>

            <div className="bg-gray-50 border border-gray-300 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">💡 Tip:</span> Click on desks in <span className="font-semibold">{desk.zone}</span> to select alternatives. Other zones are shown for reference only.
              </p>
            </div>

            <button
              onClick={() => setStep(4)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 4: User Information */}
        {step === 4 && (
          <form onSubmit={handleUserInfo} className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Your Information</h2>

            <div>
              <label className="block text-lg font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="fullName"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-600 focus:outline-none"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-lg font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-600 focus:outline-none"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 5: Payment Method */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Payment Method</h2>

            <div className="bg-gray-100 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Amount</span>
                <span className="text-3xl font-bold">₱{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => handlePaymentMethod('cash')}
                className="border-2 border-gray-300 hover:border-blue-600 rounded-xl p-6 text-left transition-all hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">Cash</h3>
                <p className="text-gray-600 mt-1">Pay with cash at reception</p>
              </button>

              <button
                onClick={() => handlePaymentMethod('card')}
                className="border-2 border-gray-300 hover:border-blue-600 rounded-xl p-6 text-left transition-all hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">Card</h3>
                <p className="text-gray-600 mt-1">Credit or debit card payment</p>
              </button>

              <button
                onClick={() => handlePaymentMethod('qr')}
                className="border-2 border-gray-300 hover:border-blue-600 rounded-xl p-6 text-left transition-all hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">QR Payment</h3>
                <p className="text-gray-600 mt-1">Scan and pay with your mobile wallet</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 5.5: Payment Processing (Card/QR) */}
        {step === 5.5 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">Processing Payment</h2>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Amount</span>
                <span className="text-3xl font-bold">₱{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {bookingData.paymentMethod === 'card' && !paymentProcessing && !paymentConfirmed && (
              /* Card Terminal Instructions */
              <div className="space-y-6">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-8">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">Tap Your Card</h3>
                    <p className="text-lg text-gray-700 mb-6">Please tap or insert your card on the payment terminal</p>
                    <div className="flex items-center justify-center gap-2 text-blue-700">
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                      <p className="text-sm font-medium">Waiting for card...</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePaymentProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
                >
                  Simulate Card Tap
                </button>
              </div>
            )}

            {bookingData.paymentMethod === 'qr' && !paymentProcessing && !paymentConfirmed && (
              /* QR Payment Gateway */
              <div className="space-y-6">
                <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold mb-4">Scan to Pay</h3>
                    <p className="text-gray-700 mb-6">Use your mobile wallet app to scan and pay</p>

                    {/* Payment QR Code */}
                    <div className="bg-white p-6 rounded-xl inline-block mb-4">
                      <QRCodeSVG
                        value={JSON.stringify({
                          paymentType: 'QRPh',
                          merchantId: 'COWORK-KIOSK-001',
                          amount: calculateTotal(),
                          currency: 'PHP',
                          reference: `PAY${Date.now()}`
                        })}
                        size={200}
                        level="H"
                      />
                    </div>

                    <p className="text-sm text-gray-600 mb-4">Supported: GCash, PayMaya, QRPh</p>

                    <div className="flex items-center justify-center gap-2 text-purple-700">
                      <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
                      <p className="text-sm font-medium">Waiting for payment...</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePaymentProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
                >
                  Simulate QR Payment
                </button>
              </div>
            )}

            {paymentProcessing && (
              /* Processing Animation */
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-12">
                <div className="text-center">
                  <div className="w-20 h-20 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <h3 className="text-2xl font-semibold mb-2">Processing Payment...</h3>
                  <p className="text-gray-600">Please wait while we confirm your payment</p>
                </div>
              </div>
            )}

            {paymentConfirmed && !paymentProcessing && (
              /* Payment Success */
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold text-green-900 mb-2">Payment Confirmed!</h3>
                  <p className="text-green-800 mb-4">₱{calculateTotal().toFixed(2)} paid successfully</p>
                  <p className="text-sm text-green-700">Staff has been notified. Preparing your booking confirmation...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Booking Confirmation Summary */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-8">
              {bookingData.paymentMethod === 'cash' ? 'Confirm Booking' : 'Finalizing Your Booking'}
            </h2>

            {bookingData.paymentMethod !== 'cash' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
                <div className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Payment Confirmed</p>
                    <p className="text-sm text-green-700">₱{calculateTotal().toFixed(2)} paid via {bookingData.paymentMethod === 'card' ? 'Card' : 'QR Payment'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
              <div className="text-center">
                <p className="text-sm text-blue-800 mb-2">Total Amount</p>
                <p className="text-5xl font-bold text-blue-600 mb-3">₱{calculateTotal().toFixed(2)}</p>
                <p className="text-gray-600">
                  {bookingData.rentType === 'day' ? 'Full Day' : formatTimeRange()}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-2">
              <p className="text-gray-600">Desk: <span className="font-medium">{desk.name}</span></p>
              <p className="text-gray-600">Zone: <span className="font-medium">{desk.zone}</span></p>
              <p className="text-gray-600">Name: <span className="font-medium">{bookingData.fullName}</span></p>
              <p className="text-gray-600">Email: <span className="font-medium">{bookingData.email}</span></p>
            </div>

            {bookingData.paymentMethod === 'cash' ? (
              <button
                onClick={handlePaymentConfirm}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
              >
                Pay at the Counter
              </button>
            ) : (
              <button
                onClick={handlePaymentConfirm}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-medium transition-colors"
              >
                Complete Booking
              </button>
            )}
          </div>
        )}

        {/* Step 7: QR Code */}
        {step === 7 && (
          <div className="space-y-6">
            {isAlternativeAssigned && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
                  <div>
                    <p className="font-semibold text-yellow-900 mb-2">Desk Assignment Update</p>
                    <p className="text-yellow-800 mb-2">
                      Your primary choice <span className="font-semibold">{desk.name}</span> was booked by another user at the same time.
                    </p>
                    <p className="text-yellow-800">
                      You have been assigned to your <span className="font-semibold">alternative selection #{assignedDeskIndex + 1}: {assignedDesk}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                isAlternativeAssigned ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <Check className={`w-10 h-10 ${isAlternativeAssigned ? 'text-yellow-600' : 'text-green-600'}`} />
              </div>
              <h2 className="text-3xl font-semibold mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600 text-lg">
                {bookingData.paymentMethod === 'cash' ? 'Please proceed to the counter' : 'Your workspace is ready'}
              </p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              {bookingData.paymentMethod === 'cash' ? (
                /* Queue Number for Cash Payment */
                <>
                  <div className="flex justify-center mb-6">
                    <div className="bg-orange-50 border-4 border-orange-500 rounded-2xl p-12 text-center">
                      <p className="text-lg font-medium text-orange-900 mb-2">Your Queue Number</p>
                      <p className="text-8xl font-bold text-orange-600">{queueNumber}</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
                    <p className="font-semibold text-orange-900 mb-3 text-center">Next Steps:</p>
                    <ol className="text-sm text-orange-800 space-y-2 list-decimal list-inside">
                      <li>Proceed to the payment counter</li>
                      <li>Show this queue number to the staff</li>
                      <li>Complete your cash payment of ₱{calculateTotal().toFixed(2)}</li>
                      <li>Staff will process your payment and issue your QR code</li>
                    </ol>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 space-y-2 mb-6">
                    <h3 className="font-semibold text-lg mb-3">Booking Details</h3>
                    <p className="text-gray-600">
                      {isAlternativeAssigned ? 'Assigned Desk:' : 'Desk:'}
                      <span className="font-medium"> {assignedDesk}</span>
                      {isAlternativeAssigned && (
                        <span className="text-sm text-yellow-700"> (Alternative #{assignedDeskIndex + 1})</span>
                      )}
                    </p>
                    <p className="text-gray-600">Zone: <span className="font-medium">
                      {isAlternativeAssigned
                        ? allDesks.find(d => d.name === assignedDesk)?.zone
                        : desk.zone}
                    </span></p>
                    {bookingData.startTime && bookingData.endTime ? (
                      <p className="text-gray-600">Time: <span className="font-medium">
                        {bookingData.startTime} - {bookingData.endTime} ({bookingData.hours} hours)
                      </span></p>
                    ) : (
                      <p className="text-gray-600">Duration: <span className="font-medium">
                        {bookingData.rentType === 'day' ? 'Full Day' : `${bookingData.hours} Hour${bookingData.hours !== 1 ? 's' : ''}`}
                      </span></p>
                    )}
                    <p className="text-gray-600">Total: <span className="font-medium text-lg">₱{calculateTotal().toFixed(2)}</span></p>
                    <p className="text-gray-600">Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-800 text-center">
                      📧 Your QR code will be sent to <span className="font-medium">{bookingData.email}</span> once payment is processed by staff.
                    </p>
                  </div>
                </>
              ) : (
                /* QR Code Display for Card/QR Payment */
                <>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-green-800 text-center">
                      ✓ Payment confirmed • Staff notified • Desk status: <span className="font-semibold">OCCUPIED</span>
                    </p>
                  </div>

                  <div className="flex justify-center mb-6">
                    <QRCodeSVG value={qrData} size={256} level="H" />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 space-y-2 mb-6">
                    <h3 className="font-semibold text-lg mb-3">Booking Details</h3>
                    <p className="text-gray-600">
                      {isAlternativeAssigned ? 'Assigned Desk:' : 'Desk:'}
                      <span className="font-medium"> {assignedDesk}</span>
                      {isAlternativeAssigned && (
                        <span className="text-sm text-yellow-700"> (Alternative #{assignedDeskIndex + 1})</span>
                      )}
                    </p>
                    <p className="text-gray-600">Zone: <span className="font-medium">
                      {isAlternativeAssigned
                        ? allDesks.find(d => d.name === assignedDesk)?.zone
                        : desk.zone}
                    </span></p>
                    {bookingData.startTime && bookingData.endTime ? (
                      <p className="text-gray-600">Time: <span className="font-medium">
                        {bookingData.startTime} - {bookingData.endTime} ({bookingData.hours} hours)
                      </span></p>
                    ) : (
                      <p className="text-gray-600">Duration: <span className="font-medium">
                        {bookingData.rentType === 'day' ? 'Full Day' : `${bookingData.hours} Hour${bookingData.hours !== 1 ? 's' : ''}`}
                      </span></p>
                    )}
                    <p className="text-gray-600">Total: <span className="font-medium text-lg">₱{calculateTotal().toFixed(2)}</span></p>
                    <p className="text-gray-600">Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-center text-blue-800">
                      ✉️ A copy of your QR code has been sent to <span className="font-medium">{bookingData.email}</span>
                    </p>
                  </div>
                </>
              )}
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
