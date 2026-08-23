import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Check, ChevronRight } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  rate: string;
  image: string;
}

export function ReservationFlowPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const preSelectedWorkspace = location.state?.workspace;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    duration: "4",
    workspace: preSelectedWorkspace?.id || "",
    alternativeWorkspace: "",
    fullName: "",
    email: "",
    privacyConsent: false,
    paymentMethod: "credit-card",
  });
  const [selectedPrimaryWorkspace, setSelectedPrimaryWorkspace] = useState<Workspace | null>(preSelectedWorkspace || null);
  const [selectedAlternativeWorkspaces, setSelectedAlternativeWorkspaces] = useState<Workspace[]>([]);

  const totalSteps = 5;

  // Generate all workspaces for selection
  const generateAllWorkspaces = (): Workspace[] => {
    const workspaces: Workspace[] = [];

    // Zone A desks (A1-A12)
    for (let i = 1; i <= 12; i++) {
      workspaces.push({
        id: `A${i}`,
        name: `Zone A - Desk ${i}`,
        type: "zone-a",
        status: i === 3 ? "unavailable" : i === 5 ? "reserved" : i === 8 ? "occupied" : i === 11 ? "unavailable" : "available",
        description: "Shared workspace with high-speed WiFi and power outlets",
        rate: "$15/day",
        image: "https://images.unsplash.com/photo-1562664348-2188b99b5157?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      });
    }

    // Zone B desks (B1-B12)
    for (let i = 1; i <= 12; i++) {
      workspaces.push({
        id: `B${i}`,
        name: `Zone B - Desk ${i}`,
        type: "zone-b",
        status: i === 4 ? "reserved" : i === 10 ? "unavailable" : i === 11 ? "unavailable" : "available",
        description: "Shared workspace with high-speed WiFi and power outlets",
        rate: "$15/day",
        image: "https://images.unsplash.com/photo-1562664348-2188b99b5157?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      });
    }

    // Meeting rooms
    workspaces.push(
      {
        id: "Meeting-1",
        name: "Meeting Room 1",
        type: "meeting-room",
        status: "available",
        description: "Private room for 4-8 people with AV equipment",
        rate: "$60/hour",
        image: "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      {
        id: "Meeting-2",
        name: "Meeting Room 2",
        type: "meeting-room",
        status: "reserved",
        description: "Private room for 4-8 people with AV equipment",
        rate: "$60/hour",
        image: "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      {
        id: "Meeting-3",
        name: "Meeting Room 3",
        type: "meeting-room",
        status: "available",
        description: "Private room for 4-8 people with AV equipment",
        rate: "$60/hour",
        image: "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjb3dvcmtpbmclMjBzcGFjZSUyMG1vZGVybnxlbnwxfHx8fDE3Nzg4NTMzNzR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      {
        id: "Booth-1",
        name: "Booth 1",
        type: "booth",
        status: "available",
        description: "Private booth for focused work",
        rate: "$25/day",
        image: "https://images.unsplash.com/photo-1626187777040-ffb7cb2c5450?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxMHx8Y293b3JraW5nJTIwc3BhY2UlMjBtb2Rlcm58ZW58MXx8fHwxNzc4ODUzMzc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      },
      {
        id: "Booth-2",
        name: "Booth 2",
        type: "booth",
        status: "available",
        description: "Private booth for focused work",
        rate: "$25/day",
        image: "https://images.unsplash.com/photo-1626187777040-ffb7cb2c5450?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxMHx8Y293b3JraW5nJTIwc3BhY2UlMjBtb2Rlcm58ZW58MXx8fHwxNzc4ODUzMzc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      }
    );

    return workspaces;
  };

  const allWorkspaces = generateAllWorkspaces();

  // Get alternative workspaces (same zone/type, different from primary, available only)
  const getAlternativeWorkspaces = (): Workspace[] => {
    if (!selectedPrimaryWorkspace) return [];

    return allWorkspaces.filter(
      (w) =>
        w.type === selectedPrimaryWorkspace.type &&
        w.id !== selectedPrimaryWorkspace.id &&
        w.status === "available"
    );
  };

  const handleNext = () => {
    // Validation for step 2: 4 alternative workspaces must be selected
    if (currentStep === 2 && getAlternativeWorkspaces().length > 0) {
      if (selectedAlternativeWorkspaces.length !== 4) {
        alert("Please select exactly 4 alternative workspaces");
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    setCurrentStep(5);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Step 1: Choose Date & Time</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="4">4 hours</option>
                  <option value="8">Full day (8 hours)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        const alternativeWorkspaces = getAlternativeWorkspaces();

        const handleToggleAlternative = (workspace: Workspace) => {
          const isSelected = selectedAlternativeWorkspaces.some(w => w.id === workspace.id);

          if (isSelected) {
            // Remove from selection
            setSelectedAlternativeWorkspaces(selectedAlternativeWorkspaces.filter(w => w.id !== workspace.id));
          } else {
            // Add to selection if less than 4
            if (selectedAlternativeWorkspaces.length < 4) {
              setSelectedAlternativeWorkspaces([...selectedAlternativeWorkspaces, workspace]);
            }
          }
        };

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Step 2: Select 4 Alternative Workspaces *
            </h2>
            <p className="text-gray-600">
              Select 4 alternative workspaces from the same zone/type in case your first choice becomes unavailable.
              This ensures you get the same price.
            </p>

            {!selectedPrimaryWorkspace ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800">Please select a primary workspace from the map first</p>
              </div>
            ) : alternativeWorkspaces.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-600">No alternative workspaces available in the same zone/type</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-teal-800 font-medium">
                    Selected: {selectedAlternativeWorkspaces.length} / 4 workspaces
                  </p>
                  {selectedAlternativeWorkspaces.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedAlternativeWorkspaces.map((workspace, index) => (
                        <span key={workspace.id} className="px-2 py-1 bg-teal-600 text-white rounded text-xs">
                          {index + 1}. {workspace.id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600">
                  Available alternatives in <span className="font-semibold">{selectedPrimaryWorkspace.type}</span> ({alternativeWorkspaces.length} available)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {alternativeWorkspaces.map((workspace) => {
                    const isSelected = selectedAlternativeWorkspaces.some(w => w.id === workspace.id);
                    const selectionIndex = selectedAlternativeWorkspaces.findIndex(w => w.id === workspace.id);

                    return (
                      <button
                        key={workspace.id}
                        onClick={() => handleToggleAlternative(workspace)}
                        disabled={!isSelected && selectedAlternativeWorkspaces.length >= 4}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          isSelected
                            ? "border-teal-600 bg-teal-50"
                            : selectedAlternativeWorkspaces.length >= 4
                            ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
                            : "border-gray-200 hover:border-teal-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={workspace.image}
                            alt={workspace.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
                            <p className="text-xs text-gray-600 mt-1">{workspace.description}</p>
                            <p className="text-sm font-semibold text-teal-600 mt-1">
                              {workspace.rate}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex flex-col items-center gap-1">
                              <Check className="w-5 h-5 text-teal-600" />
                              <span className="text-xs font-semibold text-teal-600">#{selectionIndex + 1}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedAlternativeWorkspaces.length < 4 && (
                  <p className="text-sm text-red-600 mt-2">
                    * Please select {4 - selectedAlternativeWorkspaces.length} more workspace{4 - selectedAlternativeWorkspaces.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Step 3: Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="john@example.com"
                />
              </div>
              <div className="flex items-start gap-3 pt-4">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={formData.privacyConsent}
                  onChange={(e) =>
                    setFormData({ ...formData, privacyConsent: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                />
                <label htmlFor="privacy" className="text-sm text-gray-600">
                  I agree to the privacy policy and terms of service
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Step 4: Payment</h2>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Reservation Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">{formData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="text-gray-900">{formData.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="text-gray-900">{formData.duration} hours</span>
                </div>
                {selectedPrimaryWorkspace && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Workspace:</span>
                    <span className="text-gray-900">{selectedPrimaryWorkspace.name}</span>
                  </div>
                )}
                {selectedAlternativeWorkspaces.length > 0 && (
                  <div>
                    <span className="text-gray-600 block mb-1">Alternative Workspaces:</span>
                    <ul className="text-sm text-gray-900 space-y-1">
                      {selectedAlternativeWorkspaces.map((workspace, index) => (
                        <li key={workspace.id}>
                          {index + 1}. {workspace.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="border-t border-gray-300 my-3"></div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-teal-600">
                    {selectedPrimaryWorkspace?.rate || "$0.00"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="credit-card"
                    checked={formData.paymentMethod === "credit-card"}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethod: e.target.value })
                    }
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="text-gray-900">Credit/Debit Card</span>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={formData.paymentMethod === "paypal"}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethod: e.target.value })
                    }
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="text-gray-900">PayPal</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Complete Reservation
            </button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Reservation Confirmed!</h2>
            <p className="text-gray-600">
              Your workspace has been successfully reserved. Check your email for the confirmation
              and QR code.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/workspaces")}
                className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Make Another Reservation
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full px-6 py-3 border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium"
              >
                Back to Home
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        {currentStep < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index + 1 <= currentStep
                        ? "bg-teal-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1 < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        index + 1 < currentStep ? "bg-teal-600" : "bg-gray-200"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="flex gap-4 mt-6">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back
              </button>
            )}
            {currentStep < 4 && (
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
