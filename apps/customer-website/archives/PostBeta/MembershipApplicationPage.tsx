import { useState } from "react";
import { useNavigate } from "react-router";
import { Check, Users } from "lucide-react";

export function MembershipApplicationPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    consent: false,
  });

  const membershipPlans = [
    {
      id: "monthly",
      name: "Monthly Membership",
      price: "$299/month",
      description: "Ideal for regular co-workers",
      features: [
        "Unlimited access to all zones",
        "Priority desk booking",
        "10% discount on meeting rooms",
        "Access to members-only events",
        "Complimentary coffee, tea & snacks",
        "Valid for 30 days",
      ],
    },
    {
      id: "quarterly",
      name: "Quarterly Membership",
      price: "$799/quarter",
      description: "Best value for committed members",
      features: [
        "Unlimited access to all zones",
        "Priority desk booking",
        "20% discount on meeting rooms",
        "Free 5 hours meeting room/month",
        "Access to members-only events",
        "Complimentary coffee, tea & snacks",
        "Dedicated locker storage",
        "Valid for 90 days",
      ],
    },
    {
      id: "annual",
      name: "Annual Membership",
      price: "$2,999/year",
      description: "Ultimate workspace solution",
      features: [
        "Unlimited access to all zones",
        "Priority desk booking",
        "30% discount on meeting rooms",
        "Free 10 hours meeting room/month",
        "Access to members-only events",
        "Complimentary coffee, tea & snacks",
        "Dedicated locker storage",
        "Free guest passes (2/month)",
        "24/7 access available",
        "Valid for 365 days",
      ],
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      alert("Please select a membership plan");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    const selectedPlanDetails = membershipPlans.find((p) => p.id === selectedPlan);

    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              Application Submitted!
            </h1>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-6">
              <p className="text-gray-800 font-medium mb-2">Check your email for next steps</p>
              <p className="text-sm text-gray-600">
                We've sent payment instructions and details to <span className="font-semibold">{formData.email}</span>
              </p>
            </div>

            <div className="text-left bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Next Steps:</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-teal-600 mt-0.5">1.</span>
                  <span>Check your email for payment instructions ({selectedPlanDetails?.price})</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-teal-600 mt-0.5">2.</span>
                  <span>Complete the payment process</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-teal-600 mt-0.5">3.</span>
                  <span>Our admin will verify your payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-teal-600 mt-0.5">4.</span>
                  <span>Your login details will be automatically sent to your email after verification</span>
                </li>
              </ol>
            </div>

            <p className="text-sm text-gray-600 mb-8">
              The verification process typically takes 1-2 business days after payment confirmation.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Back to Home
              </button>
              <button
                onClick={() => navigate("/workspaces")}
                className="w-full px-6 py-3 border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium"
              >
                Browse Workspaces
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Users className="w-16 h-16 text-teal-600 mx-auto mb-6" />
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">Apply for Membership</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join our community and enjoy exclusive benefits and priority access
          </p>
        </div>

        {/* Membership Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-10 text-center">
            Choose Your Membership Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {membershipPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 transition-all flex flex-col bg-white p-10 ${
                  selectedPlan === plan.id
                    ? "border-teal-500 shadow-2xl scale-105"
                    : "border-gray-300 hover:border-teal-400 hover:shadow-lg"
                }`}
              >
                {/* Plan Name */}
                <h3 className="text-center text-teal-600 font-semibold text-2xl mb-8">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold text-gray-900 mb-3">{plan.price}</div>
                  <p className="text-base text-gray-500">{plan.description}</p>
                </div>

                {/* Features */}
                <div className="flex-1 mb-10">
                  <ul className="space-y-4 text-center">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-base text-gray-600">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subscribe Button */}
                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-4 rounded-full font-semibold transition-all text-lg ${
                    selectedPlan === plan.id
                      ? "bg-teal-600 text-white hover:bg-teal-700 shadow-md"
                      : "bg-gray-800 text-white hover:bg-gray-900"
                  }`}
                >
                  {selectedPlan === plan.id ? "SELECTED" : "SELECT"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Application Form - Only show when plan is selected */}
        {selectedPlan && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
                Complete Your Application
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
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
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="john@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Payment instructions and login details will be sent to this email
                  </p>
                </div>

                <div className="flex items-start gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="consent"
                    required
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-1 w-4 h-4 text-teal-600 rounded focus:ring-2 focus:ring-teal-500"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-600">
                    I agree to the privacy policy and terms of service, and consent to receive
                    communications about my membership application and payment instructions *
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-lg shadow-md"
                >
                  Submit Membership Application
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
