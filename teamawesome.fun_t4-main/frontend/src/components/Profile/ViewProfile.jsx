import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import styles from "./ViewProfile.module.css";
import default_profile_picture from "../../assets/default-profile-picture.jpeg";


const ViewProfile = () => {
  const { userName } = useParams(); 
  console.log("userName: ", userName);
  const navigate = useNavigate();
  
  // State management
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    bio: "",
    profilePictureUrl: "",
    isProfilePublic: false,
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
    followRequestStatus: null,
    canViewFullProfile: false,
    accessMessage: null,
  });
  
  const [projects, setProjects] = useState([]);
  const [links, setLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null);

  // Function to refresh profile data
  const refreshProfileData = async () => {
    try {
      const profileRes = await api.get(`/profile/public/${userName}`);
      const profileData = profileRes.data.data.profile;

      setProfile(prev => ({
        ...prev,
        ...profileData,
        canViewFullProfile: profileData.canViewFullProfile,
        accessMessage: profileData.accessMessage,
      }));

      setLinks(profileData.links || []);
      setProjects(profileData.projects || []);

      return profileData;
    } catch (err) {
      console.error("Failed to refresh profile:", err);
      throw err;
    }
  };

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      const currentUserRes = await api.get("/profile");
      const currentUser = currentUserRes.data.data.profile;
      
      setIsAuthenticated(true);
      setCurrentUserId(currentUser.id);
      setCurrentUserName(currentUser.userName);
      setIsCurrentUser(currentUser.userName === userName);
      
      return currentUser;
    } catch (err) {
      // If we get a 401, user is not authenticated
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setCurrentUserId(null);
        setCurrentUserName(null);
        setIsCurrentUser(false);
        return null;
      }
      // For other errors, still try to proceed
      console.error("Auth check error:", err);
      setIsAuthenticated(false);
      setCurrentUserId(null);
      setCurrentUserName(null);
      setIsCurrentUser(false);
      return null;
    }
  };

  // First useEffect: Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await checkAuthStatus();
      } catch (err) {
        // Don't set error for auth failures - just proceed as unauthenticated
        console.error("Authentication check error:", err);
        setIsAuthenticated(false);
        setCurrentUserId(null);
        setCurrentUserName(null);
        setIsCurrentUser(false);
      }
    };

    checkAuth();
  }, [userName]);

  // Second useEffect: Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        // If authenticated and viewing own profile, redirect to main profile
        if (isAuthenticated && currentUserName && currentUserName === userName) {
          navigate('/profile');
          return;
        }

        // Fetch profile data (works for both authenticated and unauthenticated users)
        await refreshProfileData();

      } catch (err) {
        console.error("Profile fetch error:", err);
        if (err.response?.status === 404) {
          setError("Profile not found");
        } else if (err.response?.status === 401) {
          setError("Please log in to view this profile");
        } else if (err.code === "NETWORK_ERROR" || !err.response) {
          setError(
            err.response?.data?.error?.message || "Failed to load profile"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch profile data immediately for unauthenticated users
    // For authenticated users, wait until we have the currentUserId
    if (!isAuthenticated || currentUserId) {
      fetchProfileData();
    }
  }, [userName, isAuthenticated, currentUserId, navigate]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      setError("Please log in to follow users");
      return;
    }

    if (isCurrentUser) {
      setError("You cannot follow yourself");
      return;
    }

    try {
      setFollowLoading(true);
      
      const response = await api.post(`/profile/follow/${userName}`);
      
      // Update local state immediately for better UX
      if (response.data.data?.isFollowing) {
        setProfile(prev => ({
          ...prev,
          isFollowing: true,
          followRequestStatus: null,
          followersCount: prev.followersCount + 1
        }));
      } else if (response.data.data?.followRequestStatus) {
        setProfile(prev => ({
          ...prev,
          followRequestStatus: response.data.data.followRequestStatus
        }));
      }
      
      // Refresh profile data to get updated counts and status
      await refreshProfileData();
    } catch (err) {
      console.error("Follow request failed:", err);
      setError(err.response?.data?.error?.message || "Failed to follow user");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!isAuthenticated || isCurrentUser) {
      return;
    }

    try {
      setFollowLoading(true);
      const response = await api.delete(`/profile/follow/${userName}`);
      
      // Update local state immediately for better UX
      setProfile(prev => ({
        ...prev,
        isFollowing: false,
        followRequestStatus: null,
        followersCount: Math.max(0, prev.followersCount - 1)
      }));
      
      // Refresh profile data to get updated counts and status
      await refreshProfileData();
    } catch (err) {
      console.error("Unfollow request failed:", err);
      setError(err.response?.data?.error?.message || "Failed to unfollow user");
    } finally {
      setFollowLoading(false);
    }
  };



  // Get the appropriate follow button based on current state
  const getFollowButton = () => {
    if (isCurrentUser) {
      return null; // Don't show follow button for own profile
    }

    if (!isAuthenticated) {
      return (
        <div className={styles.loginPrompt}>
          <p>Please log in to follow this user</p>
          <button 
            onClick={() => navigate('/login')} 
            className={styles.loginButton}
          >
            Log In
          </button>
        </div>
      );
    }

    if (followLoading) {
      return (
        <button className={styles.followButton} disabled>
          Processing...
        </button>
      );
    }

    if (profile.isFollowing) {
      return (
        <button
          onClick={handleUnfollow}
          className={styles.unfollowButton}
          disabled={followLoading}
        >
          Following
        </button>
      );
    }

    if (profile.followRequestStatus === "pending") {
      return (
        <button className={styles.pendingButton} disabled>
          Request Sent
        </button>
      );
    }

    return (
      <button 
        onClick={handleFollow} 
        className={styles.followButton}
        disabled={followLoading}
      >
        Follow
      </button>
      );
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarContainer}>
          <img
            src={profile.profilePictureUrl || default_profile_picture}
            alt={`${profile.firstName} ${profile.lastName}`}
            className={styles.avatar}
          />
        </div>

        <div className={styles.profileInfo}>
          <h1>
            {profile.firstName} {profile.lastName}
          </h1>
          
          {profile.canViewFullProfile && profile.bio && (
            <p className={styles.bio}>{profile.bio}</p>
          )}

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {profile.followersCount}
              </span>
              <span className={styles.statLabel}>Followers</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {profile.followingCount}
              </span>
              <span className={styles.statLabel}>Following</span>
            </div>
          </div>

          {/* Follow button or login prompt */}
          {getFollowButton()}
        </div>
      </div>

      {!profile.canViewFullProfile && (
        <div className={styles.privateProfile}>
          <p>{profile.accessMessage}</p>
          {!isAuthenticated && (
            <button 
              onClick={() => navigate('/login')} 
              className={styles.loginButton}
            >
              Log In
            </button>
          )}
        </div>
      )}

      {profile.canViewFullProfile && (
        <>
          {links.length > 0 && (
            <div className={styles.linksSection}>
              <h2>Links</h2>
              <ul className={styles.linkList}>
                {links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.projectsSection}>
            <h2>Projects</h2>
            {projects.length > 0 ? (
              <div className={styles.projectsGrid}>
                {projects.map((project) => (
                  <div key={project.id} className={styles.projectCard}>
                    {project.image_urls?.length > 0 && (
                      <div className={styles.projectImages}>
                        {project.image_urls.map((imageUrl, index) => (
                          <img
                            key={index}
                            src={imageUrl}
                            alt={`${project.title} ${index + 1}`}
                            className={styles.projectImage}
                          />
                        ))}
                      </div>
                    )}
                    <div className={styles.projectInfo}>
                      <h3>{project.title}</h3>
                      <p className={styles.projectDescription}>
                        {project.description || "No description"}
                      </p>
                      <div className={styles.projectMeta}>
                        <span>{project.likes_count || 0} Likes</span>
                        <span>
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noProjects}>No projects yet</p>
            )}
          </div>


        </>
      )}


    </div>
  );
};

export default ViewProfile;
