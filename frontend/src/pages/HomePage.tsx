import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import './HomePage.css';
import { getToken } from '../lib/auth-storage';
import { getMe, type AuthUser } from '../api/auth';
import { fetchMedia, getWatchHistory, getCurrentlyWatching, getWatchlist } from '../api/media';
import { fetchGenres } from '../api/genres';
import { useMediaSearch } from '../hooks/useMediaSearch';
import { formatGenreLabel } from '../constants/interests';
import { formatReleaseDate } from '../lib/date';
import type { Media } from '../types/media';
import type { Genre } from '../types/genre';

type Category = 'Newest' | 'Highest Rated';
type TypeFilter = 'All' | 'MOVIE' | 'SERIES';

const categories: Category[] = ['Newest', 'Highest Rated'];
const typeFilters: { value: TypeFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'SERIES', label: 'Series' },
];

export function HomePage() {
  const token = getToken();

  const [media, setMedia] = useState<Media[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [hiddenMediaIds, setHiddenMediaIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Newest');
  const [selectedGenreId, setSelectedGenreId] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<TypeFilter>('All');
  const [searchByInterests, setSearchByInterests] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!token) return;

    Promise.all([fetchMedia(), fetchGenres(), getMe(token)])
      .then(([mediaData, genreData, user]) => {
        setMedia(mediaData);
        setGenres(genreData);
        setCurrentUser(user);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Best-effort — if this fails, the home page just shows everything
    // (including already-watched/in-progress/planned items) rather than
    // breaking entirely. Home is meant to surface only NOT_WATCHED media.
    Promise.all([getWatchHistory(token), getCurrentlyWatching(token), getWatchlist(token)])
      .then(([watchedMedia, watchingMedia, plannedMedia]) => {
        setHiddenMediaIds(
          new Set(
            [...watchedMedia, ...watchingMedia, ...plannedMedia].map((item) => item.id),
          ),
        );
      })
      .catch(() => {});
  }, [token]);

  // The search index stores genre/interest names, not ids, so the id picked
  // in the dropdown has to be resolved to a name before it's sent to /media/search.
  const selectedGenreName = useMemo(() => {
    if (selectedGenreId === 'All') return undefined;
    return genres.find((genre) => genre.id === selectedGenreId)?.name;
  }, [selectedGenreId, genres]);

  const { results: searchResults, searching } = useMediaSearch({
    query,
    genre: selectedGenreName,
    interests: searchByInterests ? currentUser?.interests : undefined,
  });

  const filteredMedia = useMemo(() => {
    const baseList = searchResults ?? media;

    return baseList
      .filter((item) => !hiddenMediaIds.has(item.id))
      .filter((item) => selectedType === 'All' || item.type === selectedType)
      .sort((a, b) => {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        const yearA = new Date(a.releaseDate).getFullYear();
        const yearB = new Date(b.releaseDate).getFullYear();

        if (selectedCategory === 'Highest Rated') {
          return ratingB - ratingA || yearB - yearA;
        }
        return yearB - yearA || ratingB - ratingA;
      });
  }, [media, searchResults, selectedCategory, selectedType, hiddenMediaIds]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) return <div className="home-page-status">Loading...</div>;
  if (error) return <div className="home-page-status">Something went wrong: {error}</div>;

  return (
    <main className="home-page">
      <header className="top-bar">
        <Link to="/profile" className="profile-button">
          Profile
        </Link>
        <Link to="/history" className="history-button">
          History
        </Link>
        <Link to="/watchlist" className="watchlist-button">
          Watchlist
        </Link>

        {/* Grouping the search and filter elements together */}
        <div className="center-controls">
          <label className="search-shell" aria-label="Search media">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search media"
              aria-label="Search media"
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
                  value={selectedGenreId}
                  onChange={(event) => setSelectedGenreId(event.target.value)}
                  aria-label="Select a genre"
                >
                  <option value="All">All</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {formatGenreLabel(genre.name)}
                    </option>
                  ))}
                </select>
              </div>

              <label className="interest-toggle">
                <input
                  type="checkbox"
                  checked={searchByInterests}
                  onChange={(event) =>
                    setSearchByInterests(event.target.checked)
                  }
                />
                <span>Search by interests</span>
              </label>
            </div>
          </aside>
        </div>

        {currentUser?.role === 'admin' && (
          <Link to="/media/add" className="add-media-button">
            Add Media
          </Link>
        )}
      </header>

      <section className="media-stage" aria-label="Media blocks">
        {error && <p style={{ padding: '0 4px' }}>{error}</p>}

        {!error && !loading && media.length === 0 && (
          <p style={{ padding: '0 4px' }}>No media has been added yet.</p>
        )}

        <div className="media-grid">
          {filteredMedia.map((item) => (
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