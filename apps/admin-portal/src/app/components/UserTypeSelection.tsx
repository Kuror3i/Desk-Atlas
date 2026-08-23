import { Users, Settings } from 'lucide-react';

interface UserTypeSelectionProps {
  onSelectAdmin: () => void;
  onSelectStaff: () => void;
}

export function UserTypeSelection({ onSelectAdmin, onSelectStaff }: UserTypeSelectionProps) {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#009689' }}>
            DeskAtlas
          </h1>
          <p className="text-gray-600 text-lg mb-2">Please Select your</p>
          <h2 className="text-4xl font-bold text-gray-900">USER TYPE</h2>
        </div>

        {/* User Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Staff Card */}
          <button
            onClick={onSelectStaff}
            className="bg-white rounded-2xl p-12 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#e6f7f5] transition-colors">
                <Users className="w-12 h-12 text-gray-800 group-hover:text-[#009689] transition-colors" strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">Staff</h3>
            </div>
          </button>

          {/* Admin Card */}
          <button
            onClick={onSelectAdmin}
            className="bg-white rounded-2xl p-12 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#e6f7f5] transition-colors">
                <Settings className="w-12 h-12 text-gray-800 group-hover:text-[#009689] transition-colors" strokeWidth={2.5} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">Admin</h3>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
