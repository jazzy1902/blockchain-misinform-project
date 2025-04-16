import { createContext, useState, useCallback, useEffect } from 'react';

export const ContentContext = createContext();

const API_URL = 'http://localhost:3001'; // Backend server URL

export function ContentProvider({ children }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshContents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/content`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch content when component mounts
  useEffect(() => {
    refreshContents();
  }, [refreshContents]);

  const addSubmission = useCallback(async (userId, content, cid) => {
    const newSubmission = {
      userId,
      content,
      cid,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0
    };
    
    setSubmissions(prev => [...prev, newSubmission]);
  }, []);

  const vote = useCallback(async (cid, voteType) => {
    // In a real app, you would make an API call to the backend here
    // For now, we'll just update the state locally
    setSubmissions(prev => 
      prev.map(item => {
        if (item.cid === cid) {
          return {
            ...item,
            [voteType]: item[voteType] + 1
          };
        }
        return item;
      })
    );
  }, []);

  return (
    <ContentContext.Provider value={{
      submissions,
      loading,
      error,
      addSubmission,
      refreshContents,
      vote
    }}>
      {children}
    </ContentContext.Provider>
  );
}