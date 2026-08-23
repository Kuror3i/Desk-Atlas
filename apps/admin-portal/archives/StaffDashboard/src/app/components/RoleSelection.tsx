import { useNavigate } from 'react-router';
import { Users, Settings } from 'lucide-react';

export function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#009689]">DeskAtlas</h1>
        </div>

        {/* Role Selection */}
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-2">Please Select your</p>
          <h2 className="text-3xl font-bold text-gray-900">USER TYPE</h2>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Staff/Tenant Card */}
          <button
            onClick={() => navigate('/login')}
            className="bg-white rounded-2xl p-8 border-4 border-transparent hover:border-[#009689] transition-all shadow-lg hover:shadow-xl group"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 mb-4 flex items-center justify-center">
                <Users className="w-16 h-16 text-gray-800 group-hover:text-[#009689] transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Staff</h3>
            </div>
          </button>

          {/* Admin Card */}
          <button
            onClick={() => {/* Admin not implemented yet */}}
            className="bg-white rounded-2xl p-8 border-4 border-transparent hover:border-[#009689] transition-all shadow-lg hover:shadow-xl group"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 mb-4 flex items-center justify-center">
                <Settings className="w-16 h-16 text-gray-800 group-hover:text-[#009689] transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Admin</h3>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
