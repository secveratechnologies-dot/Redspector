import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: string;
  owner: string;
  risk: string;
}

export default function AssetsDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await apiRequest('/assets');
        if (res.success && Array.isArray(res.data)) setAssets(res.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load assets');
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading assets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-red-400">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <Card key={asset.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all shadow-md">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-white">{asset.name}</h3>
              <p className="text-sm text-slate-400">Type: {asset.type}</p>
              <p className="text-sm text-slate-400">Owner: {asset.owner}</p>
              <p className="text-sm text-slate-400">Risk: {asset.risk}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
