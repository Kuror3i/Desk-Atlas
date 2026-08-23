import { useState } from 'react';
import { Search, Calendar, Activity, User, MapPin, Eye, X } from 'lucide-react';

type RecordType = 'reservation' | 'session' | 'workspace';

interface SearchResult {
  id: string;
  type: RecordType;
  title: string;
  subtitle: string;
  status: string;
  statusColor: string;
  details: string[];
}

export function RecordSearchScreen() {
  const [searchType, setSearchType] = useState<RecordType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SearchResult | null>(null);

  const allRecords: SearchResult[] = [
    {
      id: 'RES-2026-001',
      type: 'reservation',
      title: 'Sarah Johnson',
      subtitle: 'sarah.j@email.com',
      status: 'Checked In',
      statusColor: 'bg-green-100 text-green-800',
      details: ['May 15, 2026', '9:00 AM - 5:00 PM', 'Desk A-12', 'QR: Valid'],
    },
    {
      id: 'SES-001',
      type: 'session',
      title: 'Sarah Johnson',
      subtitle: 'Active Session',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-800',
      details: ['Desk A-12', 'Started: 9:05 AM', 'Duration: 6h 30m', 'Source: Online Reservation'],
    },
    {
      id: 'RES-2026-002',
      type: 'reservation',
      title: 'Michael Chen',
      subtitle: 'mchen@email.com',
      status: 'Confirmed',
      statusColor: 'bg-[#b2dfdb] text-[#00695c]',
      details: ['May 15, 2026', '10:00 AM - 2:00 PM', 'Meeting Room 1', 'QR: Valid'],
    },
    {
      id: 'SES-002',
      type: 'session',
      title: 'James Wilson',
      subtitle: 'Active Session',
      status: 'Active',
      statusColor: 'bg-green-100 text-green-800',
      details: ['Private Office 2', 'Started: 11:10 AM', 'Duration: 3h 45m', 'Source: Online Reservation'],
    },
    {
      id: 'DESK-A-12',
      type: 'workspace',
      title: 'Desk A-12',
      subtitle: 'Desk • Zone A',
      status: 'Occupied',
      statusColor: 'bg-orange-100 text-orange-800',
      details: ['Current User: Sarah Johnson', 'Session: SES-001', 'Since: 9:05 AM'],
    },
    {
      id: 'RES-2026-003',
      type: 'reservation',
      title: 'Emily Davis',
      subtitle: 'emily.davis@email.com',
      status: 'Pending',
      statusColor: 'bg-yellow-100 text-yellow-800',
      details: ['May 15, 2026', '1:00 PM - 6:00 PM', 'Desk B-5', 'QR: Pending'],
    },
    {
      id: 'MR-1',
      type: 'workspace',
      title: 'Meeting Room 1',
      subtitle: 'Meeting Room • Main Floor',
      status: 'Occupied',
      statusColor: 'bg-orange-100 text-orange-800',
      details: ['Current User: Michael Chen', 'Session: SES-002', 'Since: 10:15 AM'],
    },
    {
      id: 'RES-2026-004',
      type: 'reservation',
      title: 'James Wilson',
      subtitle: 'jwilson@email.com',
      status: 'Checked In',
      statusColor: 'bg-green-100 text-green-800',
      details: ['May 15, 2026', '11:00 AM - 3:00 PM', 'Private Office 2', 'QR: Valid'],
    },
    {
      id: 'DESK-B-5',
      type: 'workspace',
      title: 'Desk B-5',
      subtitle: 'Desk • Zone B',
      status: 'Reserved',
      statusColor: 'bg-[#b2dfdb] text-[#00695c]',
      details: ['Reserved for: Emily Davis', 'Time: 1:00 PM - 6:00 PM'],
    },
    {
      id: 'SES-003',
      type: 'session',
      title: 'Alice Martinez',
      subtitle: 'Active Session',
      status: 'Near End',
      statusColor: 'bg-orange-100 text-orange-800',
      details: ['Desk C-8', 'Started: 8:45 AM', 'Duration: 3h 15m', 'Source: Member'],
    },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allRecords.filter((record) => {
      const matchesType = searchType === 'all' || record.type === searchType;
      const matchesQuery =
        record.id.toLowerCase().includes(query) ||
        record.title.toLowerCase().includes(query) ||
        record.subtitle.toLowerCase().includes(query) ||
        record.details.some((detail) => detail.toLowerCase().includes(query));

      return matchesType && matchesQuery;
    });

    setSearchResults(filtered);
    setHasSearched(true);
  };

  const getRecordIcon = (type: RecordType) => {
    switch (type) {
      case 'reservation':
        return Calendar;
      case 'session':
        return Activity;
      case 'workspace':
        return MapPin;
    }
  };

  const getRecordTypeLabel = (type: RecordType) => {
    switch (type) {
      case 'reservation':
        return 'Reservation';
      case 'session':
        return 'Active Session';
      case 'workspace':
        return 'Workspace';
    }
  };

  const getRecordTypeBadgeColor = (type: RecordType) => {
    switch (type) {
      case 'reservation':
        return 'bg-[#e0f2f1] text-[#009689] border-[#b2dfdb]';
      case 'session':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'workspace':
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Record Search</h1>
        <p className="text-gray-600 mt-1">Quick lookup of operational records for support assistance</p>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          {/* Search Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSearchType('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  searchType === 'all'
                    ? 'bg-[#009689] text-white border-[#009689]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Search className="w-4 h-4" />
                All Records
              </button>
              <button
                onClick={() => setSearchType('reservation')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  searchType === 'reservation'
                    ? 'bg-[#009689] text-white border-[#009689]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Reservation
              </button>
              <button
                onClick={() => setSearchType('session')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  searchType === 'session'
                    ? 'bg-[#009689] text-white border-[#009689]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Activity className="w-4 h-4" />
                Active Session
              </button>
              <button
                onClick={() => setSearchType('workspace')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  searchType === 'workspace'
                    ? 'bg-[#009689] text-white border-[#009689]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Workspace
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Query</label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, QR code, workspace label..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009689] focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-[#009689] text-white rounded-lg hover:bg-[#00796b] transition-colors font-medium"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results {searchResults.length > 0 && `(${searchResults.length})`}
            </h2>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No records found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your search query or search type
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((result) => {
                const Icon = getRecordIcon(result.type);
                return (
                  <div
                    key={result.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{result.title}</h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border ${getRecordTypeBadgeColor(
                              result.type
                            )}`}
                          >
                            {getRecordTypeLabel(result.type)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${result.statusColor}`}>
                            {result.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{result.subtitle}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {result.details.map((detail, index) => (
                            <span key={index} className="text-sm text-gray-500">
                              {detail}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-mono">ID: {result.id}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRecord(result)}
                      className="flex items-center gap-2 text-[#009689] hover:text-[#00796b] text-sm font-medium ml-4"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!hasSearched && (
        <div className="bg-[#e0f2f1] border border-[#b2dfdb] rounded-lg p-6">
          <h3 className="font-semibold text-[#004d40] mb-2">Search Tips</h3>
          <ul className="space-y-2 text-sm text-[#00695c]">
            <li className="flex items-start gap-2">
              <span className="text-[#009689] mt-0.5">•</span>
              <span>Search by user name, email address, or QR/reference code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#009689] mt-0.5">•</span>
              <span>Use workspace labels like "Desk A-12" or "Meeting Room 1"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#009689] mt-0.5">•</span>
              <span>Filter by record type to narrow down results</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#009689] mt-0.5">•</span>
              <span>Useful when QR codes don't work or reservations can't be found</span>
            </li>
          </ul>
        </div>
      )}

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{getRecordTypeLabel(selectedRecord.type)} Details</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedRecord.id}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Record Type and Status Badges */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded text-sm font-medium border ${getRecordTypeBadgeColor(selectedRecord.type)}`}>
                  {getRecordTypeLabel(selectedRecord.type)}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${selectedRecord.statusColor}`}>
                  {selectedRecord.status}
                </span>
              </div>

              {/* Primary Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Primary Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Name/Title</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRecord.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Description</span>
                    <span className="text-sm font-medium text-gray-900">{selectedRecord.subtitle}</span>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Additional Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {selectedRecord.details.map((detail, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Detail {index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Record Reference */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Reference</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Record ID</span>
                    <span className="text-sm font-mono font-medium text-gray-900">{selectedRecord.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
