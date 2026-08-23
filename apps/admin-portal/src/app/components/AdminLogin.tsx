import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
  showSignUp?: boolean;
}

export function AdminLogin({ onLogin, onBack, showSignUp = false }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateSignUp = () => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isSignUp) {
      // Validate sign-up form
      if (validateSignUp()) {
        // Simulate sending confirmation email
        setEmailSent(true);
      }
    } else {
      // Accept any email and password for login simulation
      if (email && password) {
        onLogin();
      }
    }
  };

  const handleConfirmEmail = () => {
    // Simulate email confirmation and log in
    setEmailSent(false);
    onLogin();
  };

  // Email Confirmation Screen
  if (emailSent) {
    return (
      <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#e6f7f5' }}>
              <Mail className="w-10 h-10" style={{ color: '#009689' }} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>

            <p className="text-gray-600 mb-6">
              We've sent a confirmation link to <strong>{email}</strong>
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-3">
                Please click the confirmation link in your email to verify your account and complete the registration.
              </p>
              <p className="text-xs text-gray-500">
                The link will expire in 24 hours for security purposes.
              </p>
            </div>

            {/* Simulate Email Confirmation Button (for demo purposes) */}
            <button
              onClick={handleConfirmEmail}
              className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity mb-4"
              style={{ backgroundColor: '#009689' }}
            >
              <CheckCircle className="w-5 h-5 inline mr-2" />
              Simulate Email Confirmation
            </button>

            <button
              onClick={() => setEmailSent(false)}
              className="text-gray-600 hover:text-[#009689] transition-colors text-sm"
            >
              Back to sign up
            </button>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-2 mx-auto mt-6 text-gray-600 hover:text-[#009689] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to role selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold" style={{ backgroundColor: '#009689' }}>
            D
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#009689' }}>
            DeskAtlas
          </h1>
          <p className="text-gray-600 text-lg">Admin Portal</p>
        </div>

        {/* Login/Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sign Up Fields */}
            {isSignUp && (
              <>
                {/* First Name */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all pr-12 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#009689] focus:ring-2 focus:ring-[#e6f7f5] transition-all pr-12 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Remember Me (Login Only) */}
            {!isSignUp && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-[#009689]"
                  style={{ accentColor: '#009689' }}
                />
                <label htmlFor="remember" className="ml-2 text-gray-700">
                  Remember Me
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#009689' }}
            >
              {isSignUp ? 'Sign Up' : 'Log In'}
            </button>

            {/* Lost Password Link (Login Only) */}
            {!isSignUp && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-gray-600 hover:text-[#009689] transition-colors"
                >
                  Lost your password?
                </button>
              </div>
            )}

            {/* Sign Up Toggle */}
            {showSignUp && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-gray-600 hover:text-[#009689] transition-colors"
                >
                  {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 mx-auto mt-6 text-gray-600 hover:text-[#009689] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to role selection
        </button>
      </div>
    </div>
  );
}
