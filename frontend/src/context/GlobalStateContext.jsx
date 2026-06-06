import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const GlobalStateContext = createContext(null);

export const GlobalStateProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast System
  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch Jobs
  const fetchJobs = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent) setLoadingJobs(true);
    try {
      const response = await api.get('/api/ai/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      if (!silent) setLoadingJobs(false);
    }
  }, [isAuthenticated]);

  // Fetch Campaigns
  const fetchCampaigns = useCallback(async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent) setLoadingCampaigns(true);
    try {
      const response = await api.get('/api/calendar');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      if (!silent) setLoadingCampaigns(false);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
      fetchCampaigns();
    } else {
      setJobs([]);
      setCampaigns([]);
    }
  }, [isAuthenticated, fetchJobs, fetchCampaigns]);

  // Active Background Job Polling
  // If there are any pending or processing jobs, poll them every 4 seconds.
  useEffect(() => {
    if (!isAuthenticated) return;

    const activeJobs = jobs.filter((j) => j.status === 'pending' || j.status === 'processing');
    if (activeJobs.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get('/api/ai/jobs');
        const newJobs = response.data;
        
        // Check if any job just completed or failed to notify the user
        newJobs.forEach((newJob) => {
          const oldJob = jobs.find((j) => j.id === newJob.id);
          if (oldJob && oldJob.status !== newJob.status) {
            if (newJob.status === 'completed') {
              showToast(`AI Blog Generation Complete: "${newJob.topic}"`, 'success');
              // Sync dashboard/history data
              fetchCampaigns(true);
            } else if (newJob.status === 'failed') {
              showToast(`AI Blog Generation Failed: "${newJob.topic}"`, 'error');
            }
          }
        });
        
        setJobs(newJobs);
      } catch (error) {
        console.error('Error polling jobs:', error);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated, jobs, showToast, fetchCampaigns]);

  // Compute active count
  const activeJobsCount = jobs.filter((j) => j.status === 'pending' || j.status === 'processing').length;

  const value = {
    jobs,
    campaigns,
    loadingJobs,
    loadingCampaigns,
    toasts,
    activeJobsCount,
    fetchJobs,
    fetchCampaigns,
    showToast,
    removeToast,
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
      
      {/* Toast Render Overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex w-80 items-center justify-between rounded-lg border p-4 shadow-lg animate-slide-up ${
              toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              {toast.type === 'success' && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              )}
              {toast.type === 'error' && (
                <span className="flex h-2 w-2 rounded-full bg-red-500" />
              )}
              {toast.type === 'info' && (
                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              )}
              <p className="text-xs font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors ml-4"
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};
