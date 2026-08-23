import { useState } from 'react';
import { Search, Calendar, Activity, User, MapPin, Eye, X } from 'lucide-react';
import { RESERVATION_STATUS, RESERVATION_STATUS_LABEL, RESERVATION_STATUS_BADGE } from '../lib/reservationStatus';

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
      status: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.CHECKED_IN],
      statusColor: RESERVATION_STATUS_BADGE[RESERVATION_STATUS.CHECKED_IN],
      details: ['May 15, 2026', '9:00 AM - 5:00 PM', 'Desk A-12', 'QR: Valid'],
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Record Search</h1>
        <p className="text-gray-600 mt-1">Quick lookup of operational records for support assistance</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Type</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSearchType('all')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${searchType === 'all' ? 'bg-[#009689] text-white border-[#009689]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                <Search className="w-4 h-4" />
                All Records
              </button>
            </div>
          </div>

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
              <button onClick={handleSearch} className="px-6 py-3 bg-[#009689] text-white rounded-lg hover:bg-[#00796b] transition-colors font-medium">Search</button>
            </div>
          </div>
        </div>
      </div>

      {hasSearched && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Search Results {searchResults.length > 0 && `(${searchResults.length})`}</h2>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((result) => (
                <div key={result.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Search className="w-5 h-5 text-gray-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{result.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${result.statusColor}`}>{result.type}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.subtitle}</p>
                    </div>
                  </div>

                  <button onClick={() => setSelectedRecord(result)} className="flex items-center gap-2 text-[#009689] hover:text-[#00796b] text-sm font-medium ml-4"><Eye className="w-4 h-4" />View Details</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
