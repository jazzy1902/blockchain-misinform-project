import { createContext, useState, useCallback } from 'react';

export const ContentContext = createContext();

export function ContentProvider({ children }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <ContentContext.Provider value={{
      submissions,
      loading,
      error,
      addSubmission
    }}>
      {children}
    </ContentContext.Provider>
  );
}