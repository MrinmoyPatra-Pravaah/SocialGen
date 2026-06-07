import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGlobalState } from '../context/GlobalStateContext';
import api from '../services/api';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  Plus, 
  ArrowRight,
  Loader
} from 'lucide-react';

// This is the Dashboard page component. 
// It shows the user a summary of their marketing campaigns, blogs, active jobs, and recent posts.
const Dashboard = () => {
  const navigate = useNavigate();
  
  // Destructuring global state variables and functions that we need from our React context
  const { jobs, campaigns, showToast, activeJobsCount, fetchJobs, fetchCampaigns } = useGlobalState();
  
  // State variables for managing local dashboard state
  const [dashboardData, setDashboardData] = useState(null); // holds stats and recent activities
  const [dailyPosts, setDailyPosts] = useState([]);         // holds list of posts generated today
  const [selectedPost, setSelectedPost] = useState(null);   // holds the post currently open in the detail modal/drawer
  const [failedImages, setFailedImages] = useState({});     // keeps track of image URLs that failed to load
  const [loading, setLoading] = useState(true);             // loading state to show a loading screen while fetching data

  // Helper function to extract search keywords from the campaign title.
  // This is used to load a fallback random image from loremflickr if the original fails.
  const getTopicKeywords = (title) => {
    if (!title) return 'marketing';
    const commonWords = new Set(['daily', 'updates', 'on', 'a', 'an', 'the', 'in', 'of', 'for', 'with', 'and', 'or', 'to', 'at', 'by', 'from', 'about']);
    const words = title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !commonWords.has(w));
    return words.join(',') || 'marketing';
  };

  // Fetch the automated posts from our backend server
  const fetchDailyPosts = async () => {
    try {
      const res = await api.get('/api/social/posts');
      setDailyPosts(res.data || []);
    } catch (err) {
      console.error('Oops! Could not load daily posts from the server:', err);
    }
  };

  // Function to cancel an active AI content generation job
  const handleCancelJob = async (id) => {
    try {
      await api.post(`/api/ai/jobs/${id}/cancel`);
      fetchJobs(true); // reload list of jobs in global state
      showToast('Generation cancelled.', 'info');
    } catch (err) {
      console.error('Failed to cancel job:', err);
      showToast('Cancel failed.', 'error');
    }
  };

  // React Hook that runs when the component mounts or when "jobs" state updates
  useEffect(() => {
    const getOverview = async () => {
      try {
        const response = await api.get('/api/dashboard/overview');
        setDashboardData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
      } finally {
        setLoading(false); // turn off the loading screen
      }
    };
    
    // Call the functions to load data
    getOverview();
    fetchDailyPosts();
    
    // Check if we need to refresh statistics if active jobs change
    const activeJobs = jobs.filter((j) => j.status === 'pending' || j.status === 'processing');
    if (activeJobs.length === 0 && dashboardData) {
      getOverview();
    }
  }, [jobs]);

  // Show a basic loading message if we are still fetching data from the backend
  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h3>Loading dashboard data... Please wait.</h3>
      </div>
    );
  }

  // Get statistics from dashboardData or use default values if not loaded yet
  const stats = dashboardData?.stats || {
    total_campaigns: 0,
    total_blogs: 0,
    active_jobs: 0,
    failed_jobs: 0,
  };

  // Get list of recent activities or default to empty list
  const recentActivities = dashboardData?.recent_activities || [];
  
  // Find upcoming campaigns from the campaigns list that start today or in the future
  const upcomingEvents = [...campaigns]
    .filter(c => new Date(c.start_date) >= new Date().setHours(0,0,0,0))
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 4);

  // Filter jobs that are currently running (status is pending or processing)
  const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');

  // Define the cards we want to show in the stats grid at the top of the dashboard.
  const kpiCards = [
    {
      label: 'Scheduled Posts',
      value: stats.total_campaigns,
      icon: CalendarIcon,
      color: '#007bff', // Standard blue
      link: '/calendar',
    },
    {
      label: 'AI Blogs Generated',
      value: stats.total_blogs,
      icon: Sparkles,
      color: '#28a745', // Standard green
      link: '/history',
    },
    {
      label: 'Active AI Jobs',
      value: activeJobsCount,
      icon: Clock,
      color: '#ffc107', // Standard yellow
      link: '/generate',
    },
    {
      label: 'Failed Jobs',
      value: stats.failed_jobs,
      icon: AlertCircle,
      color: '#dc3545', // Standard red
      link: '/history',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'Arial, sans-serif', padding: '10px' }}>
      
      {/* Header section with page title and action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#333' }}>Overview Dashboard</h2>
          <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>
            A simple overview of your marketing activities and generated posts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/calendar" className="btn-secondary" style={{ padding: '8px 12px', fontSize: '13px', textDecoration: 'none' }}>
            + Add Campaign
          </Link>
          <Link to="/generate" className="btn-primary" style={{ padding: '8px 12px', fontSize: '13px', textDecoration: 'none' }}>
            Generate Content
          </Link>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              to={card.link}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: '#333',
                background: '#ffffff',
                border: `1px solid #cccccc`,
                borderRadius: '4px',
                padding: '15px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
                  {card.label}
                </span>
                <Icon style={{ width: '18px', height: '18px', color: card.color }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                {card.value}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main layout grid containing campaigns list and activity logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        
        {/* Left Side: Active AI Jobs or Upcoming Schedule */}
        <div style={{ background: '#ffffff', border: '1px solid #cccccc', borderRadius: '4px', padding: '20px' }}>
          {activeJobs.length > 0 ? (
            <div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                Running AI Generation Jobs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeJobs.map((job) => (
                  <div key={job.id} style={{
                    border: '1px solid #dddddd',
                    borderRadius: '4px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <strong style={{ fontSize: '14px' }}>{job.topic}</strong>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        Tone: {job.tone} | Platform: {job.platform || 'Blog'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleCancelJob(job.id)} 
                        style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Upcoming Campaigns</h3>
                <Link to="/calendar" style={{ fontSize: '13px', color: '#007bff', textDecoration: 'none' }}>View Calendar &rarr;</Link>
              </div>
              
              {upcomingEvents.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: '#666', border: '1px dashed #cccccc', borderRadius: '4px' }}>
                  No upcoming campaigns scheduled yet. Click "Add Campaign" to start planning!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {upcomingEvents.map((event) => (
                    <div key={event.id} style={{
                      padding: '10px',
                      borderBottom: '1px solid #eeeeee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{event.campaign_name}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Topic: {event.content_topic}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ background: '#eef2f7', border: '1px solid #ddd', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                          {event.platform}
                        </span>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Starts: {event.start_date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Recent Activity Logs */}
        <div style={{ background: '#ffffff', border: '1px solid #cccccc', borderRadius: '4px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            Recent Activities
          </h3>
          {recentActivities.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#999', fontSize: '13px' }}>
              No recent logs found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivities.map((act) => (
                <div key={act.id} style={{ fontSize: '13px', borderBottom: '1px solid #f9f9f9', paddingBottom: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>{act.title}</div>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>{act.subtitle}</div>
                  <div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
                    {new Date(act.date + 'Z').toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Automated Campaign Posts Section */}
      <div style={{ background: '#ffffff', border: '1px solid #cccccc', borderRadius: '4px', padding: '20px', marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Automated Campaign Posts</h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#666' }}>
              These are the posts generated automatically by your active campaigns.
            </p>
          </div>
          <Link to="/inbox" style={{ fontSize: '13px', color: '#007bff', textDecoration: 'none' }}>Go to Inbox &rarr;</Link>
        </div>

        {dailyPosts.length === 0 ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: '#666', border: '1px dashed #cccccc', borderRadius: '4px' }}>
            No automated posts have been generated for today.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {dailyPosts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => setSelectedPost(post)}
                style={{
                  border: '1px solid #cccccc',
                  borderRadius: '4px',
                  padding: '12px',
                  background: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Fallback image */}
                <div style={{ width: '100%', height: '120px', borderRadius: '4px', overflow: 'hidden', background: '#eee', position: 'relative' }}>
                  <img 
                    src={failedImages[post.id] ? `https://loremflickr.com/300/200/${getTopicKeywords(post.title)}?lock=${post.id}` : (post.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80')} 
                    onError={() => {
                      setFailedImages(prev => ({ ...prev, [post.id]: true }));
                    }}
                    alt="Poster" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <span style={{ position: 'absolute', top: '5px', right: '5px', background: '#333', color: '#fff', fontSize: '10px', padding: '2px 5px', borderRadius: '3px' }}>
                    {post.platform}
                  </span>
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>{post.title}</h4>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {post.content}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '8px', fontSize: '11px', color: '#666' }}>
                  <div>Likes: {post.likes} | Shares: {post.shares}</div>
                  <span style={{ color: '#007bff' }}>Details &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section: Quick Actions Panel */}
      <div style={{ background: '#ffffff', border: '1px solid #cccccc', borderRadius: '4px', padding: '20px', marginTop: '10px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          Quick Actions Shortcuts
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
          {[
            { label: 'Content Remix Tool', desc: 'Adapt posts for other channels', link: '/remix', color: '#007bff' },
            { label: 'Hashtag Search Lab', desc: 'Find hashtags for your content', link: '/hashtags', color: '#17a2b8' },
            { label: 'Brand Voice Setup', desc: 'Set target style and voice', link: '/brand-voice', color: '#28a745' },
            { label: 'Content History Log', desc: 'View past generated blogs', link: '/history', color: '#6c757d' },
          ].map((action, i) => (
            <Link key={i} to={action.link} style={{
              display: 'block',
              textDecoration: 'none',
              color: '#333',
              border: '1px solid #cccccc',
              borderRadius: '4px',
              padding: '15px',
              background: '#ffffff',
            }}>
              <strong style={{ color: action.color, fontSize: '14px', display: 'block', marginBottom: '4px' }}>{action.label}</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>{action.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Detailed Post Dialog/Drawer */}
      {selectedPost && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#ffffff', width: '90%', maxWidth: '600px', borderRadius: '4px', border: '1px solid #ccc', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{selectedPost.title}</h3>
              <button onClick={() => setSelectedPost(null)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '70vh', overflowY: 'auto' }}>
              {selectedPost.image_url && (
                <div style={{ width: '100%', height: '200px', borderRadius: '4px', overflow: 'hidden' }}>
                  <img 
                    src={failedImages[selectedPost.id] ? `https://loremflickr.com/500/300/${getTopicKeywords(selectedPost.title)}?lock=${selectedPost.id}` : selectedPost.image_url} 
                    onError={() => {
                      setFailedImages(prev => ({ ...prev, [selectedPost.id]: true }));
                    }}
                    alt="Creative Poster" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
              )}

              <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', border: '1px solid #eee', fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <span>Platform: <strong>{selectedPost.platform}</strong></span>
                <span>Likes: <strong>{selectedPost.likes}</strong></span>
                <span>Shares: <strong>{selectedPost.shares}</strong></span>
                <span>Comments: <strong>{selectedPost.comments_count}</strong></span>
                <span>Posted: <strong>{new Date(selectedPost.posted_at + 'Z').toLocaleDateString()}</strong></span>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <strong style={{ fontSize: '13px', color: '#666' }}>Generated Caption Script:</strong>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPost.content);
                      showToast('Copied script to clipboard!', 'success');
                    }} 
                    style={{ background: '#f8f9fa', border: '1px solid #ccc', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Copy Text
                  </button>
                </div>
                <div style={{ border: '1px solid #cccccc', borderRadius: '4px', padding: '15px', background: '#fefefe', fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {selectedPost.content}
                </div>
              </div>
            </div>

            <div style={{ padding: '15px', borderTop: '1px solid #eee', background: '#f8f9fa', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Link to="/inbox" onClick={() => setSelectedPost(null)} style={{ padding: '6px 12px', border: '1px solid #ccc', background: '#fff', textDecoration: 'none', color: '#333', fontSize: '12px', borderRadius: '4px' }}>
                Go to Inbox
              </Link>
              <button onClick={() => setSelectedPost(null)} style={{ padding: '6px 12px', background: '#6c757d', color: '#fff', border: 'none', fontSize: '12px', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
