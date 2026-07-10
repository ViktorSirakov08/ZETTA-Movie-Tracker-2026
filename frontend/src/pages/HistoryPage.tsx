import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import './HomePage.css';
import { getToken } from '../lib/auth-storage';
import { getValidAccessToken } from '../lib/session';
import { getWatchHistory, type MediaItem } from '../api/media';
import { useMediaSearch } from '../hooks/useMediaSearch';
import { intersectByRelevance } from '../lib/media-filters';
import { formatGenreLabel } from '../constants/interests';
import { formatReleaseDate } from '../lib/date';

type Category = 'Newest' | 'Highest Rated';
type TypeFilter = 'All' | 'MOVIE' | 'SERIES';

const categories: Category[] = ['Newest', 'Highest Rated'];
const typeFilters: { value: TypeFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'SERIES', label: 'Series' },
];

export function HistoryPage() {
  const token = getToken();

  const [watched, setWatched] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<Category>('Newest');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<TypeFilter>('All');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { results: searchResults, searching } = useMediaSearch({
    query,
    genre: selectedGenre === 'All' ? undefined : selectedGenre,
  });

  useEffect(() => {
    if (!token) {
      return;
    }
    getValidAccessToken()
      .then((validToken) => {
        if (!validToken) {
          throw new Error('Your session has expired. Please log in again.');
        }
        return getWatchHistory(validToken);
      })
      .then((items) => {
        const stillWatched = items.filter((item) => {
          const localSavedState = localStorage.getItem(`watched_${item.id}`);

          return localSavedState !== 'false';
        });

        setWatched(stillWatched);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load your history.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const genreOptions = useMemo(() => {
    const names = new Set<string>();
    for (const item of watched) {
      for (const genre of item.genres) {
        names.add(genre.name);
      }
    }
    return ['All', ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [watched]);

  const filtered = useMemo(() => {
    const baseList = searchResults
      ? intersectByRelevance(searchResults, watched)
      : watched;

    return baseList
      .filter((item) => selectedType === 'All' || item.type === selectedType)
      .sort((a, b) => {
        if (selectedCategory === 'Highest Rated') {
          return (b.rating ?? 0) - (a.rating ?? 0);
        }
        return (
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );
      });
  }, [watched, searchResults, selectedCategory, selectedType]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="home-page">
      <header className="top-bar">
        <div className="left-actions">
          <Link to="/home" className="home-button">
            Home
          </Link>
        </div>

        <div className="center-controls">
          <label className="search-shell" aria-label="Search history">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search your history"
              aria-label="Search your history"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {searching && (
              <span className="search-status" aria-live="polite">
                Searching…
              </span>
            )}
          </label>

          <aside className="filter-menu-shell" aria-label="Filter menu">
            <button
              type="button"
              className={
                filtersOpen
                  ? 'hamburger-button hamburger-button--open'
                  : 'hamburger-button'
              }
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="filter-panel"
              aria-label="Toggle filter menu"
            >
              <span />
              <span />
              <span />
            </button>

            <div
              id="filter-panel"
              className={
                filtersOpen ? 'filter-panel filter-panel--open' : 'filter-panel'
              }
            >
              <div className="filter-group">
                <span className="filter-label">Categories</span>
                <div className="chip-row">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={
                        selectedCategory === category
                          ? 'chip chip--active'
                          : 'chip'
                      }
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-label">Type</span>
                <div className="chip-row">
                  {typeFilters.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={
                        selectedType === type.value ? 'chip chip--active' : 'chip'
                      }
                      onClick={() => setSelectedType(type.value)}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-label">Genres</span>
                <select
                  className="genre-select"
                  value={selectedGenre}
                  onChange={(event) => setSelectedGenre(event.target.value)}
                  aria-label="Select a genre"
                >
                  {genreOptions.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <section className="media-stage" aria-label="Watched media">
        {error && <p style={{ padding: '0 4px' }}>{error}</p>}

        {!error && !loading && watched.length === 0 && (
          <p style={{ padding: '0 4px' }}>
            You haven&apos;t marked anything as watched yet.
          </p>
        )}

        <div className="media-grid">
          {filtered.map((item) => (
            <article className="media-card" key={item.id}>
              <Link to={`/media/${item.id}`} className="media-card-link" key={item.id}>
                <div className="media-poster">
                  {item.posterUrl ? (
                    <img src={item.posterUrl} alt={item.name} />
                  ) : (
                    <span className="poster-label">Picture</span>
                  )}
                </div>
              </Link>

              <div className="media-copy">
                <div className="media-head">
                  <h2>{item.name}</h2>
                  <span className="media-rating">
                    {item.rating !== null ? item.rating.toFixed(1) : 'No Rating'}
                  </span>
                </div>
                <p className="release-year">
                  Released {formatReleaseDate(item.releaseDate)}
                </p>
                <p>{item.description}</p>
                <div className="genre-row" aria-label="Genres">
                  {item.genres.map((genre) => (
                    <span className="genre-pill" key={genre.id}>
                      {formatGenreLabel(genre.name)}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}