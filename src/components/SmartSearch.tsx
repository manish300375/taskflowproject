import { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SmartSearchProps {
  onSearchResults: (taskIds: string[]) => void;
  onClearSearch: () => void;
}

export default function SmartSearch({ onSearchResults, onClearSearch }: SmartSearchProps) {
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || !session) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/semantic-search`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          similarity_threshold: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Search error:', errorData);
        throw new Error(errorData.error || 'Search failed');
      }

      const { results } = await response.json();
      const taskIds = results.map((result: { id: string }) => result.id);
      onSearchResults(taskIds);
    } catch (error) {
      console.error('Error performing semantic search:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setHasSearched(false);
    onClearSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="mb-6">
      <div className="bg-white rounded-card shadow-soft p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search tasks intelligently... (e.g., 'urgent items' or 'design work')"
              className="w-full px-4 py-3 pl-11 bg-cream border border-gray-200 rounded-button text-charcoal placeholder-mutedGray focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage focus:ring-opacity-20 transition-all"
              disabled={isSearching}
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-mutedGray" />
          </div>

          {hasSearched ? (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-5 py-3 bg-mutedGray text-white rounded-button text-base font-semibold hover:bg-opacity-80 transition-all shadow-sm"
              disabled={isSearching}
            >
              <X className="w-5 h-5" />
              Clear
            </button>
          ) : (
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className="flex items-center gap-2 px-5 py-3 bg-sage text-white rounded-button text-base font-semibold hover:bg-[#6B9D6F] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          )}
        </div>

        {hasSearched && !isSearching && (
          <div className="mt-3 text-sm text-mutedGray">
            Showing tasks with 70%+ similarity to your search
          </div>
        )}
      </div>
    </div>
  );
}
