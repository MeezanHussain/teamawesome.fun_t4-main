import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import { getCookie } from "../../../utils/cookie";
import styles from "./ProjectGallery.module.css";
import default_profile_picture from "../../assets/default-profile-picture.jpeg";

const ProjectGallery = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const token = getCookie("token");
    setIsAuthenticated(!!token);
    
    fetchProjects();
  }, []);

  const fetchProjects = async (pageNum = 1, append = false) => {
    try {
      setLoadingMore(pageNum > 1);
      const response = await api.get(`/projects/gallery?page=${pageNum}&limit=10`);
      
      const newProjects = response.data.projects;
      
      if (append) {
        setProjects(prev => [...prev, ...newProjects]);
      } else {
        setProjects(newProjects);
      }
      
      setHasMore(response.data.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      if (err.response?.status === 401) {
        // For gallery, don't redirect to login, just show error
        setError("Please log in to view the full gallery");
      } else {
        setError(err.response?.data?.message || "Failed to load projects");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProjects(page + 1, true);
    }
  };

  const handleLike = async (projectId) => {
    try {
      const response = await api.post(`/projects/${projectId}/like`);
      const { liked } = response.data;
      
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { 
                ...project, 
                is_liked: liked,
                likes_count: liked 
                  ? (project.likes_count || 0) + 1 
                  : Math.max(0, (project.likes_count || 0) - 1)
              }
            : project
        )
      );
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please log in to like projects");
      } else {
        setError("Failed to update like");
      }
    }
  };

  const handleUserClick = (userName) => {
    navigate(`/${userName}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => fetchProjects(1)}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Project Gallery</h1>
        <p>Discover amazing projects from the community</p>
        {!isAuthenticated && (
          <div className={styles.loginPrompt}>
            <p>Want to like and interact with projects?</p>
            <button
              className={styles.loginButton}
              onClick={() => navigate("/login")}
            >
              Log In
            </button>
          </div>
        )}
      </div>

      <div className={styles.projectsFeed}>
        {projects.length > 0 ? (
          projects.map((project) => (
            <div key={project.id} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <div 
                  className={styles.userInfo}
                  onClick={() => handleUserClick(project.user_name)}
                >
                  <img
                    src={project.profile_picture_url || default_profile_picture}
                    alt="Profile"
                    className={styles.userAvatar}
                  />
                  <div className={styles.userDetails}>
                    <h3 className={styles.userName}>
                      {project.first_name} {project.last_name}
                    </h3>
                    <span className={styles.projectDate}>
                      {formatDate(project.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.projectContent}>
                <h2 className={styles.projectTitle}>{project.title}</h2>
                {project.description && (
                  <p className={styles.projectDescription}>
                    {project.description}
                  </p>
                )}
                
                {project.image_urls && project.image_urls.length > 0 && (
                  <div className={styles.projectImages}>
                    {project.image_urls.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`${project.title} ${index + 1}`}
                        className={styles.projectImage}
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.projectActions}>
                {isAuthenticated ? (
                  <button
                    className={`${styles.likeButton} ${project.is_liked ? styles.liked : ''}`}
                    onClick={() => handleLike(project.id)}
                  >
                    <span className={styles.likeIcon}>
                      {project.is_liked ? '❤️' : '🤍'}
                    </span>
                    <span className={styles.likeCount}>
                      {project.likes_count || 0}
                    </span>
                  </button>
                ) : (
                  <button
                    className={styles.likeButton}
                    onClick={() => navigate("/login")}
                    title="Log in to like projects"
                  >
                    <span className={styles.likeIcon}>🤍</span>
                    <span className={styles.likeCount}>
                      {project.likes_count || 0}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noProjects}>
            <p>No projects found. Be the first to share your work!</p>
            <button
              className={styles.createButton}
              onClick={() => navigate("/project-upload")}
            >
              Create Your First Project
            </button>
          </div>
        )}
      </div>

      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <button
            className={styles.loadMoreButton}
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More Projects"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectGallery;
