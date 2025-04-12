// Submission.jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentContext } from '../context/ContentContext';

export default function Submission() {
  const [userId, setUserId] = useState('');
  const [content, setContent] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const { addSubmission } = useContext(ContentContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId.trim() || !content.trim()) {
      setSubmissionStatus('error');
      return;
    }
    
    try {
      setSubmissionStatus('submitting');
      
      // 1. Send to your backend which will handle Pinata upload
      const response = await fetch('http://localhost:3001/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, content }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // 2. Store in your application state
      await addSubmission(userId, content, result.cid);
      
      setSubmissionStatus('success');
      
      setTimeout(() => {
        setUserId('');
        setContent('');
        setSubmissionStatus(null);
        navigate('/browse');
      }, 1500);
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionStatus('error');
    }
  };

  return (
    <div className="page">
      <h1>Content Submission</h1>
      <form onSubmit={handleSubmit} className="submission-form">
        <div className="form-group">
          <label htmlFor="userId">User Identification:</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your user ID"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your content here..."
            rows="5"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={submissionStatus === 'submitting'}
        >
          {submissionStatus === 'submitting' ? 'Uploading...' : 'Send for Review'}
        </button>
        
        {submissionStatus === 'success' && (
          <p className="success-message">✅ Submission successful!</p>
        )}
        
        {submissionStatus === 'error' && (
          <p className="error-message">⚠️ Submission failed. Please try again.</p>
        )}
      </form>
    </div>
  );
}