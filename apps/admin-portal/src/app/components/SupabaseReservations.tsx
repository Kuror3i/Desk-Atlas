import React, { useEffect, useState } from 'react';

type Reservation = {
  reservations_id: string;
  workspace_id: string;
  customer_name: string;
  start_time: string;
  end_time: string;
  status: string;
};

export function SupabaseReservations() {
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      setError('Supabase env not configured (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY)');
      return;
    }
    const restUrl = `${url.replace(/\/+$/,'')}/rest/v1/upcoming_reservations?select=*`;
    fetch(restUrl, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReservations(data);
        else setError('Unexpected response');
      })
      .catch((err) => setError(String(err)));
  }, []);

  if (error) return <div className="p-4 bg-white rounded-md border">Error: {error}</div>;
  if (!reservations) return <div className="p-4 bg-white rounded-md border">Loading upcoming reservations…</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-2">Upcoming Reservations (7 days)</h3>
      <ul className="space-y-2">
        {reservations.map((r) => (
          <li key={r.reservations_id} className="text-sm">
            <div className="font-medium">{r.customer_name}</div>
            <div className="text-xs text-gray-500">{new Date(r.start_time).toLocaleString()} — {new Date(r.end_time).toLocaleString()}</div>
            <div className="text-xs">Status: {r.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
