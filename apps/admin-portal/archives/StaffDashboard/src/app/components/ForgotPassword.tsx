import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-[#009689] rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#009689]">DeskAtlas</h1>
            <p className="text-gray-600 text-sm mt-1">Staff Portal</p>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent password reset instructions to:
              </p>
              <p className="font-medium text-[#009689] mb-6">{email}</p>
              <p className="text-sm text-gray-500 mb-8">
                If you don't see the email, check your spam folder.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3 bg-[#009689] text-white rounded-lg hover:bg-[#00796b] transition-colors font-medium"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-[#009689] rounded-full flex items-center justify-center">
            <Mail className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#009689]">DeskAtlas</h1>
          <p className="text-gray-600 text-sm mt-1">Staff Portal</p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
          <p className="text-gray-600 text-sm mb-6">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009689] focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-[#009689] text-white rounded-lg hover:bg-[#00796b] transition-colors font-medium"
            >
              Send Reset Instructions
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-[#009689]"
            >
              Back to Login
            </button>
          </div>
        </div>

        {/* Back to Role Selection Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#009689] text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to role selection
          </button>
        </div>
      </div>
    </div>
  );
}
