import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { ContentContext } from '../context/ContentContext';

export default function Browse() {
  const { submissions, loading, error, vote, refreshContents } = useContext(ContentContext);
  const [activeVote, setActiveVote] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  // Sort submissions based on selected option
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'top') {
      return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    } else if (sortBy === 'controversial') {
      return (b.upvotes + b.downvotes) - (a.upvotes + a.downvotes);
    }
    return 0;
  });

  const handleVote = async (cid, type) => {
    setActiveVote(`${cid}-${type}`);
    try {
      await vote(cid, type);
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setActiveVote(null);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={refreshContents} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={styles.page}>
      <div className="browse-header" style={styles.browseHeader}>
        <h1 style={styles.title}>Community Content</h1>
        <div className="controls" style={styles.controls}>
          <Link to="/submission" style={styles.newSubmissionButton}>
            + New Submission
          </Link>
          <div className="sort-options" style={styles.sortOptions}>
            <label htmlFor="sort-select" style={styles.sortLabel}>Sort by:</label>
            <select 
              id="sort-select"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.sortSelect}
            >
              <option value="newest">Newest</option>
              <option value="top">Top Rated</option>
              <option value="controversial">Most Controversial</option>
            </select>
          </div>
        </div>
      </div>

      {sortedSubmissions.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No submissions yet. Be the first to share!</p>
          <Link to="/submission" style={styles.ctaButton}>
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="content-list" style={styles.contentList}>
          {sortedSubmissions.map((item) => (
            <div key={item.cid} style={styles.contentCard}>
              <div style={styles.contentHeader}>
                <span style={styles.userId}>@{item.userId}</span>
                <span style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p style={styles.contentText}>{item.content}</p>
              <div style={styles.voteContainer}>
                <button 
                  onClick={() => handleVote(item.cid, 'upvotes')}
                  style={{
                    ...styles.voteButton,
                    ...styles.upvoteButton,
                    ...(activeVote === `${item.cid}-upvotes` ? styles.activeVote : {}),
                    ...(activeVote !== null && activeVote !== `${item.cid}-upvotes` ? styles.disabledButton : {})
                  }}
                  disabled={activeVote !== null && activeVote !== `${item.cid}-upvotes`}
                  aria-label="Upvote"
                >
                  <span aria-hidden="true">👍</span> 
                  <span style={styles.voteCount}>{item.upvotes}</span>
                </button>
                <button
                  onClick={() => handleVote(item.cid, 'downvotes')}
                  style={{
                    ...styles.voteButton,
                    ...styles.downvoteButton,
                    ...(activeVote === `${item.cid}-downvotes` ? styles.activeVote : {}),
                    ...(activeVote !== null && activeVote !== `${item.cid}-downvotes` ? styles.disabledButton : {})
                  }}
                  disabled={activeVote !== null && activeVote !== `${item.cid}-downvotes`}
                  aria-label="Downvote"
                >
                  <span aria-hidden="true">👎</span>
                  <span style={styles.voteCount}>{item.downvotes}</span>
                </button>
                <span style={styles.voteDifference}>
                  {item.upvotes - item.downvotes} points
                </span>
                {(item.upvotes + item.downvotes) > 0 && (
                  <span style={styles.voteRatio}>
                    ({Math.round((item.upvotes / (item.upvotes + item.downvotes)) * 100)}% upvoted)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1rem',
    fontFamily: 'Arial, sans-serif',
    color: '#333',
  },
  browseHeader: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '1.5rem',
    color: '#2c3e50',
    textAlign: 'center',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  newSubmissionButton: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    ':hover': {
      backgroundColor: '#2980b9',
    },
  },
  sortOptions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sortLabel: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  sortSelect: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    marginTop: '2rem',
  },
  emptyText: {
    fontSize: '1.1rem',
    marginBottom: '1.5rem',
    color: '#666',
  },
  ctaButton: {
    backgroundColor: '#2ecc71',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#27ae60',
    },
  },
  contentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  contentCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    fontSize: '0.9rem',
    color: '#666',
  },
  userId: {
    fontWeight: 'bold',
  },
  date: {
    color: '#7f8c8d',
  },
  contentText: {
    lineHeight: '1.6',
    marginBottom: '1.5rem',
    whiteSpace: 'pre-wrap',
  },
  voteContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  voteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    border: 'none',
  },
  upvoteButton: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  downvoteButton: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  activeVote: {
    transform: 'scale(1.1)',
  },
  disabledButton: {
    opacity: '0.5',
    cursor: 'not-allowed',
  },
  voteCount: {
    fontWeight: 'bold',
  },
  voteDifference: {
    fontWeight: 'bold',
    color: '#555',
    marginLeft: 'auto',
  },
  voteRatio: {
    fontSize: '0.8rem',
    color: '#666',
  },
  loadingSpinner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderTopColor: '#3498db',
    borderRadius: '50%',
    animation: 'spin 1s ease-in-out infinite',
  },
  errorMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '2rem',
    backgroundColor: '#ffebee',
    borderRadius: '8px',
  },
  retryButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#c0392b',
    },
  },
};