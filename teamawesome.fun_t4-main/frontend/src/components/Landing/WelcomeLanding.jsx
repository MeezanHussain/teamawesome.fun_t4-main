import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Code, 
  Heart, 
  Star, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  Zap,
  ChevronDown,
  Rocket
} from "lucide-react";
import api from "../../../utils/api";
import { getCookie } from "../../../utils/cookie";
import styles from "./WelcomeLanding.module.css";
import default_profile_picture from "../../assets/default-profile-picture.jpeg";

const WelcomeLanding = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const token = getCookie("token");
    setIsAuthenticated(!!token);
    
    // Auto-scroll to gallery after welcome animation
    const timer = setTimeout(() => {
      setShowGallery(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showGallery) {
      fetchProjects();
    }
  }, [showGallery]);

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

  const scrollToGallery = () => {
    setShowGallery(true);
    document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      {/* Hero Welcome Section */}
      <motion.div 
        className={styles.heroSection}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className={styles.heroBackground}>
          <div className={styles.gradientOverlay}></div>
          <div className={styles.floatingShapes}>
            <motion.div 
              className={styles.shape1}
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className={styles.shape2}
              animate={{ 
                y: [0, 20, 0],
                rotate: [360, 180, 0]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className={styles.shape3}
              animate={{ 
                x: [0, 15, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </div>
        </div>

        <div className={styles.heroContent}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={styles.logoContainer}
          >
            <div className={styles.logo}>
              <Rocket className={styles.rocketIcon} />
              <span className={styles.logoText}>TeamAwesome</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.heroTitle}
          >
            Welcome to the Future of
            <span className={styles.highlight}> Student Networking</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className={styles.heroSubtitle}
          >
            Connect, collaborate, and showcase your projects in the most innovative 
            student social media platform. Where creativity meets opportunity.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className={styles.heroStats}
          >
            <div className={styles.statItem}>
              <Users className={styles.statIcon} />
              <span className={styles.statNumber}>500+</span>
              <span className={styles.statLabel}>Students</span>
            </div>
            <div className={styles.statItem}>
              <Code className={styles.statIcon} />
              <span className={styles.statNumber}>1000+</span>
              <span className={styles.statLabel}>Projects</span>
            </div>
            <div className={styles.statItem}>
              <Heart className={styles.statIcon} />
              <span className={styles.statNumber}>5000+</span>
              <span className={styles.statLabel}>Connections</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className={styles.heroActions}
          >
            {!isAuthenticated ? (
              <>
                <button 
                  className={styles.primaryButton}
                  onClick={() => navigate("/signup")}
                >
                  <Sparkles className={styles.buttonIcon} />
                  Get Started Free
                </button>
                <button 
                  className={styles.secondaryButton}
                  onClick={() => navigate("/login")}
                >
                  <Globe className={styles.buttonIcon} />
                  Sign In
                </button>
              </>
            ) : (
              <button 
                className={styles.primaryButton}
                onClick={() => navigate("/profile")}
              >
                <Zap className={styles.buttonIcon} />
                Go to My Profile
              </button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className={styles.scrollIndicator}
          >
          </motion.div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.section 
        className={styles.featuresSection}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className={styles.featuresContainer}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={styles.featuresTitle}
          >
            Why Choose TeamAwesome?
          </motion.h2>
          
          <div className={styles.featuresGrid}>
            {[
              {
                icon: <Users className={styles.featureIcon} />,
                title: "Student-Focused",
                description: "Built specifically for students to showcase their academic and personal projects"
              },
              {
                icon: <Code className={styles.featureIcon} />,
                title: "Project Showcase",
                description: "Display your work with beautiful galleries and detailed descriptions"
              },
              {
                icon: <Heart className={styles.featureIcon} />,
                title: "Smart Networking",
                description: "Connect with like-minded students and industry professionals"
              },
              {
                icon: <Star className={styles.featureIcon} />,
                title: "Recognition",
                description: "Get feedback, likes, and recognition for your innovative projects"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className={styles.featureCard}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.05 }}
              >
                <div className={styles.featureIconContainer}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Project Gallery Section */}
      <section id="gallery-section" className={styles.gallerySection}>
        <AnimatePresence>
          {showGallery && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.8 }}
            >
              <div className={styles.galleryHeader}>
                <motion.h2
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className={styles.galleryTitle}
                >
                  Featured Student Projects
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className={styles.gallerySubtitle}
                >
                  Discover amazing work from talented students around the world
                </motion.p>
                {!isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className={styles.loginPrompt}
                  >
                    <p>Want to like and interact with projects?</p>
                    <button
                      className={styles.loginButton}
                      onClick={() => navigate("/login")}
                    >
                      Log In
                    </button>
                  </motion.div>
                )}
              </div>

              <div className={styles.projectsFeed}>
                {loading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading amazing projects...</p>
                  </div>
                ) : error ? (
                  <div className={styles.errorContainer}>
                    <p className={styles.errorMessage}>{error}</p>
                    <button 
                      className={styles.retryButton}
                      onClick={() => fetchProjects(1)}
                    >
                      Try Again
                    </button>
                  </div>
                ) : projects.length > 0 ? (
                  projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      className={styles.projectCard}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                    >
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
                            {project.image_urls.map((imageUrl, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={imageUrl}
                                alt={`${project.title} ${imgIndex + 1}`}
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
                    </motion.div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* CTA Section */}
      <motion.section 
        className={styles.ctaSection}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className={styles.ctaContainer}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={styles.ctaTitle}
          >
            Ready to Showcase Your Projects?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className={styles.ctaDescription}
          >
            Join thousands of students who are already building their professional network 
            and showcasing their amazing work on TeamAwesome.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className={styles.ctaActions}
          >
            {!isAuthenticated ? (
              <>
                <button 
                  className={styles.ctaPrimaryButton}
                  onClick={() => navigate("/signup")}
                >
                  <ArrowRight className={styles.buttonIcon} />
                  Start Building Your Portfolio
                </button>
                <button 
                  className={styles.ctaSecondaryButton}
                  onClick={() => navigate("/login")}
                >
                  Already have an account? Sign In
                </button>
              </>
            ) : (
              <button 
                className={styles.ctaPrimaryButton}
                onClick={() => navigate("/project-upload")}
              >
                <Rocket className={styles.buttonIcon} />
                Upload Your Next Project
              </button>
            )}
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default WelcomeLanding;
