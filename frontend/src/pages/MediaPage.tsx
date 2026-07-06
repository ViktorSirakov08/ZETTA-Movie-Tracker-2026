import { useEffect, useState } from 'react';
import { getToken } from '../lib/auth-storage';
import { setWatchStatus, getWatchStatus } from '../api/media';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchMediaById } from '../api/media';
import type { Media } from '../types/media';
import { rateMedia, getUserRating } from '../api/ratings';
import { getMe, type AuthUser } from '../api/auth';
import { calculateAge, minimumAgeFor } from '../lib/age';
import './MediaPage.css';

export function MediaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchStatus, setWatchStatusState] = useState<string>('NOT_WATCHED');
  const [userRating, setUserRating] = useState<number | null>(null);
  const navigate = useNavigate();
  
  // Reusing Auth state matching HomePage pattern
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  
  // Inline Editor Panel UI States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPosterUrl, setEditPosterUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewerDateOfBirth, setViewerDateOfBirth] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [watchlistNotice, setWatchlistNotice] = useState<string | null>(null);

  const [isWatchlistAdded, setIsWatchlistAdded] = useState(() => {
    const saved = localStorage.getItem(`watchlist_${id}`);
    return saved === 'true';
  });

  const [isWatchedMarked, setIsWatchedMarked] = useState(() => {
    const saved = localStorage.getItem(`watched_${id}`);
    return saved === 'true';
  });

  useEffect(() => {
    if (!id) return;
    const token = getToken();

    // Reusing the native sequential batch pipeline pattern from your home file
    Promise.all([
      fetchMediaById(id),
      token ? getMe(token) : Promise.resolve(null)
    ])
      .then(([mediaData, user]) => {
        setMedia(mediaData);
        setCurrentUser(user);
        
        // Map edit fields data on initial mount
        setEditName(mediaData.name);
        setEditDescription(mediaData.description);
        setEditPosterUrl(mediaData.posterUrl ?? '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    if (token) {
        getWatchStatus(token, id).then(setWatchStatusState).catch(() => {});
        getUserRating(token, id).then(setUserRating).catch(() => {});
        getMe(token).then((user) => setViewerDateOfBirth(user.dateOfBirth)).catch(() => {});
    }
  }, [id]);

  const requiredAge = media ? minimumAgeFor(media.ageRestriction) : 0;
  const canWatch =
    requiredAge === 0 ||
    (viewerDateOfBirth !== null && calculateAge(viewerDateOfBirth) >= requiredAge);

  async function updateStatus(status: 'PLANNED_TO_WATCH' | 'WATCHING' | 'WATCHED') {
      const token = getToken();
      if (!token || !id) return;
      await setWatchStatus(token, id, status);
      setWatchStatusState(status);
  }

  async function handleRate(value: number) {
    const token = getToken();
    if (!token || !id) return;
    await rateMedia(token, id, value);
    setUserRating(value);
    fetchMediaById(id).then(setMedia);
  }

  async function handleSaveChanges(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3000/media/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          posterUrl: editPosterUrl || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update media data.');

      const updated = await fetchMediaById(id);
      setMedia(updated);
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating data.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePlay() {
      if (!canWatch) {
        setPlayError(`This title is restricted to viewers ${requiredAge}+.`);
        return;
      }
      setPlayError(null);
      updateStatus('WATCHING').catch((err) => {
        setPlayError(err instanceof Error ? err.message : 'Unable to play this title.');
      });
  }

  function handleAddToWatchlist() {
    const nextState = !isWatchlistAdded;
    setIsWatchlistAdded(nextState);
    localStorage.setItem(`watchlist_${id}`, String(nextState));

    if (nextState) {
        setIsWatchedMarked(false);
        localStorage.removeItem(`watched_${id}`);
        updateStatus('PLANNED_TO_WATCH');

        if (!canWatch && media) {
          const kind = media.type === 'MOVIE' ? 'movie' : 'series';
          setWatchlistNotice(
            `You will be able to watch this ${kind} when you are ${requiredAge}+.`,
          );
        }
    } else {
      setWatchlistNotice(null);
    }
  }

  function handleMarkAsWatched() {
    const nextState = !isWatchedMarked;
    setIsWatchedMarked(nextState);
    localStorage.setItem(`watched_${id}`, String(nextState));
    
    if (nextState) {
        setIsWatchlistAdded(false);
        localStorage.removeItem(`watchlist_${id}`);
        updateStatus('WATCHED');
    }
  }

  async function handleDeleteMedia() {
    const confirmDelete = window.confirm("Are you sure you want to delete this media item? This cannot be undone.");
    if (!confirmDelete) return;

    const token = getToken();
    if (!token || !id) return;

    try {
        const response = await fetch(`http://localhost:3000/media/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        });

        if (!response.ok) throw new Error('Failed to delete media item.');

        // Redirect to home page instantly upon successful deletion
        navigate('/home');
    } catch (err) {
        alert(err instanceof Error ? err.message : 'Error deleting media.');
    }
  }

  if (loading) return <div className="detail-status">Loading...</div>;
  if (error) return <div className="detail-status">Something went wrong: {error}</div>;
  if (!media) return <div className="detail-status">Media not found.</div>;

  const releaseYear = new Date(media.releaseDate).getFullYear();

  return (
    <main className="media-detail-page">
      <Link to="/home" className="back-link">
        ← Back
      </Link>

      <div className="detail-layout">
        <div className="detail-poster">
          {media.posterUrl ? (
            <img src={media.posterUrl} alt={media.name} />
          ) : (
            <span className="poster-label">Picture</span>
          )}
        </div>

        <div className="detail-body">
          <div className="detail-heading">
            <div>
              <h1>{media.name}</h1>
              <p className="detail-meta">
                {releaseYear} · {media.type === 'MOVIE' ? 'Movie' : 'Series'}
                {media.durationMinutes ? ` · ${media.durationMinutes}m` : ''}
                {media.ageRestricted13 ? ' · 13+' : ''}
                {media.ageRestricted ? ' · 18+' : ''}
              </p>
            </div>
            <div className="rating-block">
            <span className="detail-rating">
                {media.rating !== null ? media.rating.toFixed(1) : 'No Rating'}
            </span>
                <div className="user-rating-stars" role="radiogroup" aria-label="Your rating">
                    <button
                        type="button"
                        className={userRating === 0 ? 'star star--filled' : 'star star--zero'}
                        onClick={() => handleRate(0)}
                        aria-label="Clear rating"
                    >
                        ✕
                    </button>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                        key={star}
                        type="button"
                        className={userRating !== null && star <= userRating ? 'star star--filled' : 'star'}
                        onClick={() => handleRate(star)}
                        aria-label={`Rate ${star} stars`}
                        >
                        ★
                        </button>
                    ))}
                </div>
            </div>
          </div>

          <div className="genre-row" aria-label="Genres">
            {media.genres.map((genre) => (
              <span className="genre-pill" key={genre.id}>
                {genre.name}
              </span>
            ))}
          </div>

          <p className="detail-description">{media.description}</p>

          <div className="detail-actions">
            <button
              className="action-button action-button--primary"
              onClick={handlePlay}
            >
              ▶ Play
            </button>
            <button className="action-button" onClick={handleAddToWatchlist}>
              {isWatchlistAdded ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
            </button>
            <button className="action-button" onClick={handleMarkAsWatched}>
              {isWatchedMarked ? '✓ Marked' : '+ Mark as Watched'}
            </button>
            {currentUser?.role === 'admin' && (
              <button 
                type="button" 
                className="action-button action-button--primary" 
                onClick={() => setIsEditing((prev) => !prev)}
              >
                ✎ Edit Media
              </button>
            )}
          </div>

          {isEditing && (
            <form className="edit-media-panel" onSubmit={handleSaveChanges}>
              <h3>Edit Media Details</h3>
              <div className="field">
                <label htmlFor="edit-title">Title</label>
                <input 
                  id="edit-title"
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="edit-poster">Poster URL</label>
                <input 
                  id="edit-poster"
                  type="url" 
                  value={editPosterUrl} 
                  onChange={(e) => setEditPosterUrl(e.target.value)} 
                />
              </div>
              <div className="field">
                <label htmlFor="edit-desc">Description</label>
                <textarea 
                  id="edit-desc"
                  rows={4}
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)} 
                  required
                />
              </div>
              <div className="form-panel-buttons">
                <button type="submit" className="action-button action-button--primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="action-button" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button 
                type="button" 
                className="action-button action-button--danger" 
                onClick={handleDeleteMedia}
                style={{ marginRight: 'auto' }}
            >
                🗑 Delete Media
              </button>
              </div>
            </form>
          )}
          {playError && (
            <p className="detail-age-restriction-notice">{playError}</p>)}

          {watchlistNotice && (
            <p className="detail-age-restriction-notice">{watchlistNotice}</p>
          )}

          {media.type === 'SERIES' && (
            <EpisodeList mediaId={media.id} episodes={media.episodes ?? []} />
          )}
        </div>
      </div>
    </main>
  );
}

function EpisodeList({
  episodes,
}: {
  mediaId: string;
  episodes: NonNullable<Media['episodes']>;
}) {
  if (episodes.length === 0) {
    return (
      <div className="episode-section">
        <h2>Episodes</h2>
        <p className="detail-meta">No episodes added yet.</p>
      </div>
    );
  }

  const bySeason = episodes.reduce<Record<number, typeof episodes>>((acc, ep) => {
    (acc[ep.seasonNum] ??= []).push(ep);
    return acc;
  }, {});

  return (
    <div className="episode-section">
      <h2>Episodes</h2>
      {Object.entries(bySeason).map(([season, seasonEpisodes]) => (
        <div key={season} className="season-group">
          <h3>Season {season}</h3>
          <ul className="episode-list">
            {seasonEpisodes
              .sort((a, b) => a.episodeNum - b.episodeNum)
              .map((ep) => (
                <li key={ep.id} className="episode-row">
                  <span className="episode-number">E{ep.episodeNum}</span>
                  <span className="episode-title">{ep.title}</span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}