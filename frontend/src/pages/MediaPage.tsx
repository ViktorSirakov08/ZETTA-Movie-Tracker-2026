
import { useEffect, useState } from 'react';
import { getValidAccessToken } from '../lib/session';
import { setWatchStatus, getWatchStatus } from '../api/media';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMediaById } from '../api/media';
import type { Media, Season } from '../types/media';
import { rateMedia, getUserRating, removeRating } from '../api/ratings';
import { updateMedia, deleteMedia } from '../api/media';
import {
  fetchSeasons,
  addSeason,
  addEpisode,
  getEpisodeWatchStatuses,
  getSeasonWatchStatuses,
  setEpisodeWatchStatus,
  type EpisodeWatchStatusEntry,
  type SeasonWatchStatusEntry,
} from '../api/media';
import { fetchGenres } from '../api/genres';
import type { Genre } from '../types/genre';
import { getMe, type AuthUser } from '../api/auth';
import { calculateAge, minimumAgeFor } from '../lib/age';
import { formatReleaseDate, isReleaseDateInFuture } from '../lib/date';
import './MediaPage.css';
import { CommentsList } from '../components/CommentsList';

export function MediaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchStatus, setWatchStatusState] = useState<string>('NOT_WATCHED');
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRemovingRating, setIsRemovingRating] = useState(false);
  const [editAgeRestriction, setEditAgeRestriction] = useState<'NONE' | 'PG13' | 'PG18'>('NONE');
  const [editDurationMinutes, setEditDurationMinutes] = useState('');
  const [editGenreIds, setEditGenreIds] = useState<string[]>([]);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPosterUrl, setEditPosterUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewerDateOfBirth, setViewerDateOfBirth] = useState<string | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [playSuccessMessage, setPlaySuccessMessage] = useState<string | null>(null);
  const [watchlistNotice, setWatchlistNotice] = useState<string | null>(null);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodeStatuses, setEpisodeStatuses] = useState<EpisodeWatchStatusEntry[]>([]);
  const [seasonStatuses, setSeasonStatuses] = useState<SeasonWatchStatusEntry[]>([]);

  // Admin "add season" panel state — a season is never created empty, so
  // this doubles as the title for that season's first episode.
  const [isAddingSeasonOpen, setIsAddingSeasonOpen] = useState(false);
  const [newSeasonFirstEpisodeTitle, setNewSeasonFirstEpisodeTitle] = useState('');
  const [isAddingSeason, setIsAddingSeason] = useState(false);
  const [addSeasonError, setAddSeasonError] = useState<string | null>(null);

  // Admin "add episode" panel state — season/episode numbers are always
  // auto-assigned server-side, never typed, so an episode can't be created
  // for a season that doesn't exist or skip a number within one.
  const [isAddingEpisodeOpen, setIsAddingEpisodeOpen] = useState(false);
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number | null>(null);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState('');
  const [isAddingEpisode, setIsAddingEpisode] = useState(false);
  const [addEpisodeError, setAddEpisodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchGenres().then(setAllGenres).catch(() => {});
    fetchSeasons(id).then(setSeasons).catch(() => {});

    getValidAccessToken().then((token) => {
      Promise.all([
      fetchMediaById(id),
      token ? getMe(token) : Promise.resolve(null)
      ])
      .then(([mediaData, user]) => {
          setMedia(mediaData);
          setCurrentUser(user);

          setEditName(mediaData.name);
          setEditDescription(mediaData.description);
          setEditPosterUrl(mediaData.posterUrl ?? '');
          setEditDurationMinutes(mediaData.durationMinutes ? String(mediaData.durationMinutes) : '');
          setEditGenreIds(mediaData.genres.map((g) => g.id));

          setEditAgeRestriction(mediaData.ageRestriction ?? 'NONE');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

      if (token) {
          getWatchStatus(token, id).then(setWatchStatusState).catch(() => {});
          getUserRating(token, id).then(setUserRating).catch(() => {});
          getMe(token).then((user) => setViewerDateOfBirth(user.dateOfBirth)).catch(() => {});
          getEpisodeWatchStatuses(token, id).then(setEpisodeStatuses).catch(() => {});
          getSeasonWatchStatuses(token, id).then(setSeasonStatuses).catch(() => {});
      }
    });
  }, [id]);

  // Re-pulled after any season/episode mutation or watch-status toggle, since
  // the backend recomputes season rollup status as a side effect.
  async function refreshSeasonsAndEpisodes() {
    if (!id) return;
    const [seasonsData, mediaData] = await Promise.all([
      fetchSeasons(id),
      fetchMediaById(id),
    ]);
    setSeasons(seasonsData);
    setMedia(mediaData);

    const token = await getValidAccessToken();
    if (token) {
      const [episodeStatusData, seasonStatusData, watchStatusData] = await Promise.all([
        getEpisodeWatchStatuses(token, id),
        getSeasonWatchStatuses(token, id),
        getWatchStatus(token, id),
      ]);
      setEpisodeStatuses(episodeStatusData);
      setSeasonStatuses(seasonStatusData);
      setWatchStatusState(watchStatusData);
    }
  }

  const requiredAge = media ? minimumAgeFor(media.ageRestriction) : 0;
  const isUnreleased = media ? isReleaseDateInFuture(media.releaseDate) : false;
  const canWatch =
    requiredAge === 0 ||
    (viewerDateOfBirth !== null && calculateAge(viewerDateOfBirth) >= requiredAge);

  async function updateStatus(
    status: 'NOT_WATCHED' | 'PLANNED_TO_WATCH' | 'WATCHING' | 'WATCHED',
  ) {
      if (!id) return;
      const token = await getValidAccessToken();
      if (!token) return;
      await setWatchStatus(token, id, status);
      setWatchStatusState(status);

      // Marking/unmarking a series at the top level cascades to every
      // episode and season on the backend — re-pull so the per-episode
      // buttons reflect that instead of showing stale state.
      if (media?.type === 'SERIES') {
        await refreshSeasonsAndEpisodes();
      }
  }

  async function handleRate(value: number) {
    if (!id) return;
    const token = await getValidAccessToken();
    if (!token) return;
    await rateMedia(token, id, value);
    setUserRating(value);
    fetchMediaById(id).then(setMedia);
  }

  async function handleRemoveRating() {
    if (!id) return;
    const token = await getValidAccessToken();
    if (!token) return;

    setIsRemovingRating(true);
    try {
      await removeRating(token, id);
      setUserRating(null);
      await fetchMediaById(id).then(setMedia);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error removing rating.');
    } finally {
      setIsRemovingRating(false);
    }
  }

  async function handleSaveChanges(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const token = await getValidAccessToken();
    if (!token) return;

    setIsSubmitting(true);
    try {
            const updated = await updateMedia(token, id, {
            name: editName,
            description: editDescription,
            posterUrl: editPosterUrl || undefined,
            ageRestriction: editAgeRestriction, 
            durationMinutes: editDurationMinutes ? Number(editDurationMinutes) : undefined,
            genreIds: editGenreIds,
            });
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
      if (isUnreleased) {
        setPlayError('This title has not been released yet.');
        return;
      }
      setPlayError(null);
      updateStatus('WATCHING')
        .then(() => {
          setPlaySuccessMessage(
            `▶ Now playing "${media?.name}" — added to your Currently Watching list.`,
          );
          setTimeout(() => setPlaySuccessMessage(null), 3500);
        })
        .catch((err) => {
          setPlayError(err instanceof Error ? err.message : 'Unable to play this title.');
        });
  }

  function handleAddToWatchlist() {
    setPlayError(null);
    setWatchlistNotice(null);
    
    const nextState = watchStatus !== 'PLANNED_TO_WATCH';

    if (nextState) {
        updateStatus('PLANNED_TO_WATCH');

        if (!canWatch && media) {
          const kind = media.type === 'MOVIE' ? 'movie' : 'series';
          setWatchlistNotice(
            `You will be able to watch this ${kind} when you are ${requiredAge}+.`,
          );
        }
    } else {
      updateStatus('NOT_WATCHED');
      setWatchlistNotice(null);
    }
  }

  function handleMarkAsWatched() {
    const nextState = watchStatus !== 'WATCHED';
    if (isUnreleased) {
        setPlayError('This title has not been released yet.');
        return;
      }
    if (nextState && canWatch) {
        updateStatus('WATCHED');
    } else {
        updateStatus('NOT_WATCHED');
    }
  }

  async function handleDeleteMedia() {
    const confirmDelete = window.confirm(
        'Are you sure you want to delete this media item? This cannot be undone.',
    );
    if (!confirmDelete) return;

    if (!id) return;
    const token = await getValidAccessToken();
    if (!token) return;

    try {
        await deleteMedia(token, id);
        navigate('/home');
    } catch (err) {
        alert(err instanceof Error ? err.message : 'Error deleting media.');
    }
    }

  async function handleAddSeason(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const token = await getValidAccessToken();
    if (!token) return;

    const title = newSeasonFirstEpisodeTitle.trim();
    if (!title) {
      setAddSeasonError('Enter a title for the first episode.');
      return;
    }

    setIsAddingSeason(true);
    setAddSeasonError(null);
    try {
      await addSeason(token, id, title);
      await refreshSeasonsAndEpisodes();
      setNewSeasonFirstEpisodeTitle('');
      setIsAddingSeasonOpen(false);
    } catch (err) {
      setAddSeasonError(
        err instanceof Error ? err.message : 'Unable to add season.',
      );
    } finally {
      setIsAddingSeason(false);
    }
  }

  async function handleAddEpisode(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const token = await getValidAccessToken();
    if (!token) return;

    const title = newEpisodeTitle.trim();
    const seasonNum = selectedSeasonNum ?? seasons.at(-1)?.seasonNum ?? null;

    if (!title || seasonNum === null) {
      setAddEpisodeError('Pick a season and enter a title.');
      return;
    }

    setIsAddingEpisode(true);
    setAddEpisodeError(null);
    try {
      await addEpisode(token, id, { seasonNum, title });
      await refreshSeasonsAndEpisodes();
      setNewEpisodeTitle('');
    } catch (err) {
      setAddEpisodeError(
        err instanceof Error ? err.message : 'Unable to add episode.',
      );
    } finally {
      setIsAddingEpisode(false);
    }
  }

  async function handleToggleEpisodeWatched(episodeId: string, watched: boolean) {
    const token = await getValidAccessToken();
    if (!token) return;

    try {
      await setEpisodeWatchStatus(token, episodeId, watched);
      await refreshSeasonsAndEpisodes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to update episode status.');
    }
  }

  if (loading) return <div className="detail-status">Loading...</div>;
  if (error) return <div className="detail-status">Something went wrong: {error}</div>;
  if (!media) return <div className="detail-status">Media not found.</div>;

  return (
    <main className="media-detail-page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        ← Back
      </button>

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
                {formatReleaseDate(media.releaseDate)} · {media.type === 'MOVIE' ? 'Movie' : 'Series'}
                {media.durationMinutes ? ` · ${media.durationMinutes}m` : ''}
                {media.ageRestriction !== 'NONE' ? ` · ${media.ageRestriction === 'PG13' ? '13+' : '18+'}` : ''}
              </p>
            </div>
            {!isUnreleased && (
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
                <div className="remove-rating-button">
                  {userRating !== null && (
                      <button 
                        type="button" 
                        className="remove-rating-link" 
                        onClick={handleRemoveRating}
                        disabled={isRemovingRating}
                      >
                        {isRemovingRating ? 'Removing...' : 'Remove Rating'}
                      </button>
                    )}
                </div>
            </div>)}
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
            <button
              className={
                watchStatus === 'PLANNED_TO_WATCH'
                  ? 'action-button action-button--primary'
                  : 'action-button'
              }
              onClick={handleAddToWatchlist}
            >
              {watchStatus === 'PLANNED_TO_WATCH'
                ? '✓ Added to Watchlist'
                : '+ Add to Watchlist'}
            </button>
            <button
              className={
                watchStatus === 'WATCHED'
                  ? 'action-button action-button--primary'
                  : 'action-button'
              }
              onClick={handleMarkAsWatched}
            >
              {watchStatus === 'WATCHED' ? '✓ Marked' : '+ Mark as Watched'}
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
            {currentUser?.role === 'admin' && media.type === 'SERIES' && (
              <button
                type="button"
                className="action-button action-button--primary"
                onClick={() => setIsAddingSeasonOpen((prev) => !prev)}
              >
                + Add Season
              </button>
            )}
            {currentUser?.role === 'admin' && media.type === 'SERIES' && (
              <button
                type="button"
                className="action-button action-button--primary"
                onClick={() => setIsAddingEpisodeOpen((prev) => !prev)}
                disabled={seasons.length === 0}
                title={seasons.length === 0 ? 'Add a season first' : undefined}
              >
                + Add Episode
              </button>
            )}
          </div>

          {isAddingSeasonOpen && (
            <form className="edit-media-panel" onSubmit={handleAddSeason}>
              <h3>Add Season</h3>
              <p className="detail-meta">
                A season always starts with one episode — season and episode
                numbers are assigned automatically.
              </p>
              <div className="field">
                <label htmlFor="new-season-episode-title">First episode title</label>
                <input
                  id="new-season-episode-title"
                  type="text"
                  value={newSeasonFirstEpisodeTitle}
                  onChange={(e) => setNewSeasonFirstEpisodeTitle(e.target.value)}
                  required
                />
              </div>
              {addSeasonError && (
                <p className="detail-age-restriction-notice">{addSeasonError}</p>
              )}
              <div className="form-panel-buttons">
                <button
                  type="submit"
                  className="action-button action-button--primary"
                  disabled={isAddingSeason}
                >
                  {isAddingSeason ? 'Adding...' : 'Add Season'}
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => setIsAddingSeasonOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {isAddingEpisodeOpen && (
            <form className="edit-media-panel" onSubmit={handleAddEpisode}>
              <h3>Add Episode</h3>
              <p className="detail-meta">
                Episode number is assigned automatically — pick a season and
                enter a title.
              </p>
              <div className="field">
                <label htmlFor="new-episode-season">Season</label>
                <select
                  id="new-episode-season"
                  value={selectedSeasonNum ?? seasons.at(-1)?.seasonNum ?? ''}
                  onChange={(e) => setSelectedSeasonNum(Number(e.target.value))}
                >
                  {seasons.map((season) => (
                    <option key={season.id} value={season.seasonNum}>
                      Season {season.seasonNum}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="new-episode-title">Title</label>
                <input
                  id="new-episode-title"
                  type="text"
                  value={newEpisodeTitle}
                  onChange={(e) => setNewEpisodeTitle(e.target.value)}
                  required
                />
              </div>
              {addEpisodeError && (
                <p className="detail-age-restriction-notice">{addEpisodeError}</p>
              )}
              <div className="form-panel-buttons">
                <button
                  type="submit"
                  className="action-button action-button--primary"
                  disabled={isAddingEpisode}
                >
                  {isAddingEpisode ? 'Adding...' : 'Add Episode'}
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => setIsAddingEpisodeOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

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
              <div className="field">
                <label htmlFor="edit-duration">Duration (minutes)</label>
                <input
                    id="edit-duration"
                    type="number"
                    min="0"
                    value={editDurationMinutes}
                    onChange={(e) => setEditDurationMinutes(e.target.value)}
                />
                </div>

                <div className="field">
                <label htmlFor="edit-age">Age restriction</label>
                <select
                    id="edit-age"
                    value={editAgeRestriction}
                    onChange={(e) => setEditAgeRestriction(e.target.value as 'NONE' | 'PG13' | 'PG18')}
                >
                    <option value="NONE">None</option>
                    <option value="PG13">13+</option>
                    <option value="PG18">18+</option>
                </select>
                </div>

                <div className="field">
                <label>Genres</label>
                <div className="genre-chip-row">
                    {allGenres.map((genre) => (
                    <button
                        type="button"
                        key={genre.id}
                        className={
                        editGenreIds.includes(genre.id) ? 'genre-chip genre-chip--active' : 'genre-chip'
                        }
                        onClick={() =>
                        setEditGenreIds((current) =>
                            current.includes(genre.id)
                            ? current.filter((g) => g !== genre.id)
                            : [...current, genre.id],
                        )
                        }
                    >
                        {genre.name}
                    </button>
                    ))}
                </div>
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
          {playSuccessMessage && (
            <p className="detail-play-success-notice" role="status">
              {playSuccessMessage}
            </p>
          )}

          {playError && (
            <p className="detail-age-restriction-notice">{playError}</p>)}

          <CommentsList mediaId={id!} />

          {watchlistNotice && (
            <p className="detail-age-restriction-notice">{watchlistNotice}</p>
          )}

          {media.type === 'SERIES' && (
            <EpisodeList
              seasons={seasons}
              episodes={media.episodes ?? []}
              episodeStatuses={episodeStatuses}
              seasonStatuses={seasonStatuses}
              canToggleWatched={currentUser !== null}
              onToggleEpisodeWatched={handleToggleEpisodeWatched}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function EpisodeList({
  seasons,
  episodes,
  episodeStatuses,
  seasonStatuses,
  canToggleWatched,
  onToggleEpisodeWatched,
}: {
  seasons: Season[];
  episodes: NonNullable<Media['episodes']>;
  episodeStatuses: EpisodeWatchStatusEntry[];
  seasonStatuses: SeasonWatchStatusEntry[];
  canToggleWatched: boolean;
  onToggleEpisodeWatched: (episodeId: string, watched: boolean) => void;
}) {
  if (seasons.length === 0) {
    return (
      <div className="episode-section">
        <h2>Episodes</h2>
        <p className="detail-meta">No seasons added yet.</p>
      </div>
    );
  }

  const episodeWatchedMap = new Map(episodeStatuses.map((e) => [e.episodeId, e.watched]));
  const seasonWatchedMap = new Map(seasonStatuses.map((s) => [s.seasonNum, s.watched]));

  return (
    <div className="episode-section">
      <h2>Episodes</h2>
      {seasons.map((season) => {
        const seasonEpisodes = episodes
          .filter((ep) => ep.seasonNum === season.seasonNum)
          .sort((a, b) => a.episodeNum - b.episodeNum);
        const seasonWatched = seasonWatchedMap.get(season.seasonNum) ?? false;

        return (
          <div key={season.id} className="season-group">
            <h3>
              Season {season.seasonNum}
              {seasonWatched && (
                <span className="season-watched-badge"> · ✓ Watched</span>
              )}
            </h3>
            {seasonEpisodes.length === 0 ? (
              <p className="detail-meta">No episodes added yet.</p>
            ) : (
              <ul className="episode-list">
                {seasonEpisodes.map((ep) => {
                  const watched = episodeWatchedMap.get(ep.id) ?? false;
                  return (
                    <li key={ep.id} className="episode-row">
                      <span className="episode-number">E{ep.episodeNum}</span>
                      <span className="episode-title">{ep.title}</span>
                      {canToggleWatched && (
                        <button
                          type="button"
                          className="episode-watch-toggle"
                          onClick={() => onToggleEpisodeWatched(ep.id, !watched)}
                        >
                          {watched ? '✓ Watched' : 'Mark Watched'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
