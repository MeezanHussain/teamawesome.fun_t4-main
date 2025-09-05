import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import styles from "./FollowNetwork.module.css";
import default_profile_picture from "../../assets/default-profile-picture.jpeg";
import Pagination from "./Pagination";

const FollowNetwork = ({ userId = null }) => {
  // If userId is provided, we're viewing another user's network
  // If userId is null, we're viewing the current user's network
  const isViewingOtherUser = userId !== null;

  const [activeTab, setActiveTab] = useState("connections");
  const [connections, setConnections] = useState({
    followers: 0,
    following: 0,
    pendingRequests: 0,
  });
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
  // Pagination state for all sections
  const [suggestionsPagination, setSuggestionsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    itemsPerPage: 5,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  const [followersPagination, setFollowersPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    itemsPerPage: 5,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  const [followingPagination, setFollowingPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    itemsPerPage: 5,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  const [pendingPagination, setPendingPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    itemsPerPage: 5,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/profile");
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch data when userId or isViewingOtherUser changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");

        // If not authenticated, we can still show public data but with limited functionality
        if (!isAuthenticated) {
          // For unauthenticated users, we can show basic follower/following counts
          // but not detailed lists or pending requests
          setConnections({
            followers: 0,
            following: 0,
            pendingRequests: 0,
          });
          setFollowers([]);
          setFollowing([]);
          setPendingRequests([]);
          setIsLoading(false);
          return;
        }

        // Determine which endpoints to use based on userId
        const followersEndpoint = isViewingOtherUser ? `/profile/followers/${userId}` : "/profile/followers";
        const followingEndpoint = isViewingOtherUser ? `/profile/following/${userId}` : "/profile/following";
        const pendingEndpoint = "/profile/follow-requests"; // Only current user can see pending requests

        // Get all data in parallel to avoid duplicate calls
        const [followersRes, followingRes, pendingRes] = await Promise.all([
          api.get(followersEndpoint),
          api.get(followingEndpoint),
          // Only get pending requests for current user
          isViewingOtherUser ? Promise.resolve({ data: { data: { requests: [] } } }) : api.get(pendingEndpoint),
        ]);

        // Set counts from the response data
        
        setConnections({
          followers: followersRes.data.data.followers.length,
          following: followingRes.data.data.following.length,
          pendingRequests: isViewingOtherUser ? 0 : pendingRes.data.data.requests.length,
        });

        // Set detailed lists
        setFollowers(followersRes.data.data.followers);
        setFollowing(followingRes.data.data.following);

        // Only set pending requests for current user
        if (!isViewingOtherUser) {
          setPendingRequests(pendingRes.data.data.requests);
        }
        
        // Update pagination states
        setFollowersPagination({
          currentPage: 1,
          totalPages: Math.ceil(followersRes.data.data.followers.length / 5),
          totalUsers: followersRes.data.data.followers.length,
          itemsPerPage: 5,
          hasNextPage: followersRes.data.data.followers.length > 5,
          hasPrevPage: false
        });
        
        setFollowingPagination({
          currentPage: 1,
          totalPages: Math.ceil(followingRes.data.data.following.length / 5),
          totalUsers: followingRes.data.data.following.length,
          itemsPerPage: 5,
          hasNextPage: followingRes.data.data.following.length > 5,
          hasPrevPage: false
        });
        
        if (!isViewingOtherUser) {
          setPendingPagination({
            currentPage: 1,
            totalPages: Math.ceil(pendingRes.data.data.requests.length / 5),
            totalUsers: pendingRes.data.data.requests.length,
            itemsPerPage: 5,
            hasNextPage: pendingRes.data.data.requests.length > 5,
            hasPrevPage: false
          });
        }
      } catch (err) {
        console.error("Failed to fetch follow network data:", err);
        setError("Failed to load follow network data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, isViewingOtherUser, isAuthenticated]);

  // Handle suggestions tab and search query changes
  useEffect(() => {
    if (activeTab !== "suggestions") return;

    const fetchSuggestions = async () => {
      if (!isAuthenticated) {
        setSuggestions([]);
        setSuggestionsPagination({
          currentPage: 1,
          totalPages: 1,
          totalUsers: 0,
          itemsPerPage: 5,
          hasNextPage: false,
          hasPrevPage: false
        });
        return;
      }

      try {
        setIsLoading(true);
        setError(""); // Clear any previous errors
        const query = searchQuery.length >= 2 ? searchQuery : "";
        const res = await api.get(
          `/profile/search?query=${query}&page=${suggestionsPagination.currentPage}&limit=${suggestionsPagination.itemsPerPage || 5}`
        );
        
        console.log("API Response:", res.data.data); // Debug log
        setSuggestions(res.data.data.users);
        setSuggestionsPagination(res.data.data.pagination);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
        setError("Failed to load user suggestions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [activeTab, searchQuery, isAuthenticated, suggestionsPagination.currentPage]);

  const handleFollow = async (userName) => {
    console.log("userName in handleFollow: ", userName);
    if (!isAuthenticated) {
      setError("Please log in to follow users");
      return;
    }

    try {
      const response = await api.post(`/profile/follow/${userName}`);
      const responseMessage = response.data.message;
      
      // Check if it was a direct follow or a follow request
      const isDirectFollow = responseMessage.includes("now following");
      
      if (isDirectFollow) {
        // Update following count for direct follows
        setConnections(prev => ({ ...prev, following: prev.following + 1 }));
        
        // Add the user to the following list
        const userToAdd = suggestions.find(user => user.userName === userName) || 
                         followers.find(user => user.userName === userName);
        
        if (userToAdd) {
          setFollowing(prev => [...prev, { ...userToAdd, isFollowing: true, followRequestStatus: null }]);
        }

        // Update suggestions - set as following
        setSuggestions(prev =>
          prev.map(user =>
            user.userName === userName
              ? { ...user, isFollowing: true, followRequestStatus: null }
              : user
          )
        );

        // Update followers - set as following
        setFollowers(prev =>
          prev.map(user =>
            user.userName === userName
              ? { ...user, isFollowing: true, followRequestStatus: null }
              : user
          )
        );
      } else {
        // Update following count for pending requests
        setConnections(prev => ({ ...prev, following: prev.following + 1 }));
        
        setSuggestions(prev =>
          prev.map(user =>
            user.userName === userName
              ? { ...user, isFollowing: false, followRequestStatus: "pending" }
              : user
          )
        );

        // Update followers - set as pending request
        setFollowers(prev =>
          prev.map(user =>
            user.userName === userName
              ? { ...user, isFollowing: false, followRequestStatus: "pending" }
              : user
          )
        );
      }
      
      // Clear any previous errors
      setError("");
    } catch (err) {
      console.error("Error following user:", err);
      setError(err.response?.data?.message || "Failed to follow user");
    }
  };

  const handleUnfollow = async (userName) => {
    if (!isAuthenticated) {
      setError("Please log in to unfollow users");
      return;
    }

    try {
      await api.delete(`/profile/follow/${userName}`);
      
      // Update following count
      setConnections(prev => ({ 
        ...prev, 
        following: Math.max(0, prev.following - 1) 
      }));
      
      // Update following list by removing the unfollowed user
      setFollowing(prev => {
        const newFollowing = prev.filter(user => user.userName !== userName);
        
        // Update pagination state
        setFollowingPagination(prevPagination => ({
          ...prevPagination,
          totalUsers: newFollowing.length,
          totalPages: Math.ceil(newFollowing.length / prevPagination.itemsPerPage),
          hasNextPage: Math.ceil(newFollowing.length / prevPagination.itemsPerPage) > prevPagination.currentPage
        }));
        
        return newFollowing;
      });
      
      // Update suggestions - set as not following
      setSuggestions(prev => 
        prev.map(user => 
          user.userName === userName 
            ? { ...user, isFollowing: false, followRequestStatus: null }
            : user
        )
      );
      
      // Update followers - set as not following
      setFollowers(prev => 
        prev.map(user => 
            user.userName === userName 
            ? { ...user, isFollowing: false, followRequestStatus: null }
            : user
        )
      );
      
      // Clear any previous errors
      setError("");
    } catch (err) {
      console.error("Error unfollowing user:", err);
      setError(
        err.response?.data?.message || "Failed to unfollow user"
      );
    }
  };

  const cancelRequested = async (userName) => {
    if (!isAuthenticated) {
      setError("Please log in to cancel follow requests");
      return;
    }

    try {
      await api.delete(`/profile/follow-request/${userName}`);
      
      // Update pending requests count
      setConnections(prev => ({ 
        ...prev, 
        pendingRequests: Math.max(0, prev.pendingRequests - 1) 
      }));
      
      // Update pending requests list by removing the cancelled request
      setPendingRequests(prev => prev.filter(request => request.userName !== userName));
      
      // Update suggestions - remove follow request status
      setSuggestions(prev => 
        prev.map(user => 
          user.userName === userName 
            ? { ...user, followRequestStatus: null }
            : user
        )
      );
      
      // Clear any previous errors
      setError("");
    } catch (err) {
      console.error("Error cancelling follow request:", err);
      setError(
        err.response?.data?.message || "Failed to cancel follow request"
      );
    }
  };

  const handleRemoveFollower = async (followerUserName) => {
    if (!isAuthenticated) {
      setError("Please log in to remove followers");
      return;
    }

    try {
      await api.delete(`/profile/followers/${followerUserName}`);
      
      // Update followers list by removing the deleted follower
      setFollowers(prev => {
        const newFollowers = prev.filter(follower => follower.userName !== followerUserName);
        
        // Update pagination state
        setFollowersPagination(prevPagination => ({
          ...prevPagination,
          totalUsers: newFollowers.length,
          totalPages: Math.ceil(newFollowers.length / prevPagination.itemsPerPage),
          hasNextPage: Math.ceil(newFollowers.length / prevPagination.itemsPerPage) > prevPagination.currentPage
        }));
        
        return newFollowers;
      });
      
      // Update connections count
      setConnections(prev => ({ 
        ...prev, 
        followers: Math.max(0, prev.followers - 1) 
      }));
      
      // Clear any previous errors
      setError("");
    } catch (err) {
      console.error("Error removing follower:", err);
      setError(
        err.response?.data?.message || "Failed to remove follower"
      );
    }
  };

  const getFollowButtonText = (user, isFollower = false) => {
    if (isFollower) {
      // For followers, show if you're following them back or not
      if (user.isFollowing) {
        return "Following";
      } else if (user.followRequestStatus === "pending") {
        return "Requested";
      } else {
        return user.isProfilePublic ? "Follow" : "Request";
      }
    }
    
    if (user.isFollowing) {
      return "Unfollow";
    } else if (user.followRequestStatus === "pending") {
      return "Requested";
    } else if (user.followRequestStatus === "accepted") {
      // If request was accepted but not following, show Follow/Request
      return user.isProfilePublic ? "Follow" : "Request";
    } else if (user.followRequestStatus === "rejected") {
      return user.isProfilePublic ? "Follow" : "Request";
    } else {
      return user.isProfilePublic ? "Follow" : "Request";
    }
  };

  const getFollowButtonAction = (user, isFollower = false) => {
    if (isFollower) {
      // For followers, handle follow/unfollow actions
      if (user.isFollowing) {
        return () => handleUnfollow(user.userName);
      } else if (user.followRequestStatus === "pending") {
        return () => cancelRequested(user.userName);
      } else {
        return () => handleFollow(user.userName);
      }
    }
    
    if (user.isFollowing) {
      return () => handleUnfollow(user.userName);
    } else if (user.followRequestStatus === "pending") {
      return () => cancelRequested(user.userName);
    } else if (user.followRequestStatus === "accepted") {
      // If request was accepted but not following, call handleFollow
      return () => handleFollow(user.userName);
    } else {
      return () => handleFollow(user.userName);
    }
  };

  const getFollowButtonClassName = (user, isFollower = false) => {
    if (isFollower) {
      // For followers, style based on follow status
      if (user.isFollowing) {
        return styles.unfollowButton;
      } else if (user.followRequestStatus === "pending") {
        return styles.requestedButton;
      } else {
        return styles.followButton;
      }
    }
    
    if (user.isFollowing) {
      return styles.unfollowButton;
    } else if (user.followRequestStatus === "pending") {
      return styles.requestedButton;
    } else {
      return styles.followButton;
    }
  };



  const handleRespondToRequest = async (requestId, action) => {
    if (!isAuthenticated) {
      setError("Please log in to respond to follow requests");
      return;
    }

    try {
      await api.put(`/profile/follow-requests/${requestId}`, { action });
      
      // Find the request to get user details
      const request = pendingRequests.find(req => req.id === requestId);
      
      if (request) {
        // Update pending requests count and list
        setConnections(prev => ({ ...prev, pendingRequests: prev.pendingRequests - 1 }));
        setPendingRequests(prev => prev.filter(req => req.id !== requestId));
        
        if (action === "accept") {
          // Update followers count
          setConnections(prev => ({ ...prev, followers: prev.followers + 1 }));
          
          // Add the accepted user to followers list
          const userToAdd = {
            id: request.follower_id,
            firstName: request.follower_first_name,
            lastName: request.follower_last_name,
            userName: request.follower_user_name,
            bio: request.follower_bio,
            jobTitle: request.follower_job_title,
            profilePictureUrl: request.follower_profile_picture_url,
            isFollowing: false,
            followRequestStatus: null
          };
          
          setFollowers(prev => [...prev, userToAdd]);
          console.log(followers.length)
          followers.forEach(x => console.log(x))
        }
      }
      
      // Clear any previous errors
      setError("");
    } catch (err) {
      console.error("Error processing follow request:", err);
      setError(
        err.response?.data?.message || "Failed to process request"
      );
    }
  };
  

  const handleSearch = async (e) => {
    if (!isAuthenticated) {
      setError("Please log in to search users");
      return;
    }

    e.preventDefault();
    // Reset to first page when searching
    setSuggestionsPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Pagination handlers
  const handlePageChange = (newPage, section = "suggestions") => {
    switch (section) {
      case "suggestions":
        setSuggestionsPagination(prev => ({ ...prev, currentPage: newPage }));
        break;
      case "followers":
        setFollowersPagination(prev => ({ ...prev, currentPage: newPage }));
        break;
      case "following":
        setFollowingPagination(prev => ({ ...prev, currentPage: newPage }));
        break;
      case "pending":
        setPendingPagination(prev => ({ ...prev, currentPage: newPage }));
        break;
      default:
        break;
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage, section = "suggestions") => {
    console.log(`handleItemsPerPageChange called with: ${newItemsPerPage} for ${section}`); // Debug log
    
    // For suggestions, fetch new data from API
    if (section === "suggestions" && isAuthenticated && activeTab === section) {
      const fetchNewData = async () => {
        try {
          setIsLoading(true);
          setError("");
          const query = searchQuery.length >= 2 ? searchQuery : "";
          const endpoint = `/profile/search?query=${query}&page=1&limit=${newItemsPerPage}`;
          
          const res = await api.get(endpoint);
          
          console.log(`New API Response for ${section}:`, res.data.data); // Debug log
          
          setSuggestions(res.data.data.users);
          
          // Update pagination state with the new itemsPerPage value
          const newPaginationState = {
            currentPage: 1,
            totalPages: res.data.data.pagination?.totalPages || 1,
            totalUsers: res.data.data.pagination?.totalUsers || 0,
            itemsPerPage: newItemsPerPage,
            hasNextPage: res.data.data.pagination?.hasNextPage || false,
            hasPrevPage: res.data.data.pagination?.hasPrevPage || false
          };
          
          console.log(`Setting pagination state for ${section}:`, newPaginationState); // Debug log
          setSuggestionsPagination(newPaginationState);
        } catch (err) {
          console.error(`Failed to fetch ${section}:`, err);
          setError(`Failed to load ${section}`);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchNewData();
    } else {
      // For other sections, just update the pagination state (client-side pagination)
      const updatePaginationState = (currentData, setPagination) => {
        const totalUsers = currentData.length;
        const totalPages = Math.ceil(totalUsers / newItemsPerPage);
        
        const newPaginationState = {
          currentPage: 1,
          totalPages: totalPages,
          totalUsers: totalUsers,
          itemsPerPage: newItemsPerPage,
          hasNextPage: totalPages > 1,
          hasPrevPage: false
        };
        
        console.log(`Setting pagination state for ${section}:`, newPaginationState); // Debug log
        setPagination(newPaginationState);
      };
      
      switch (section) {
        case "followers":
          updatePaginationState(followers, setFollowersPagination);
          break;
        case "following":
          updatePaginationState(following, setFollowingPagination);
          break;
        case "pending":
          updatePaginationState(pendingRequests, setPendingPagination);
          break;
        default:
          break;
      }
    }
  };


        const renderContent = () => {
    
    if (!isAuthenticated) {
      return (
        <div className={styles.error}>
          <p>Please log in to view your follow network</p>
          <button onClick={() => navigate('/login')} className={styles.loginButton}>
            Log In
            </button>
        </div>
      );
    }

    if (isLoading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    switch (activeTab) {
      case "connections":
        return (
          <div className={styles.connections}>
            <div className={styles.connectionsGrid}>
              <div className={styles.connectionCard}>
                <h3>{connections.followers}</h3>
                <p>Followers</p>
                <button onClick={() => setActiveTab("followers")}>
                  View All
                </button>
              </div>
              <div className={styles.connectionCard}>
                <h3>{connections.following}</h3>
                <p>Following</p>
                <button onClick={() => setActiveTab("following")}>
                  View All
                </button>
              </div>
              <div className={styles.connectionCard}>
                <h3>{connections.pendingRequests}</h3>
                <p>Pending Requests</p>
                <button onClick={() => setActiveTab("pending")}>
                  View All
                </button>
              </div>
            </div>
          </div>
        );
      case "followers":
        return (
          <div className={styles.userList}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                placeholder="Search followers by name, bio, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Search</button>
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery("")}
                  className={styles.clearButton}
                >
                  Clear
                </button>
              )}
            </form>
            {followers.length > 0 ? (
              <>
                {followers
                  .slice(
                    (followersPagination.currentPage - 1) * followersPagination.itemsPerPage,
                    followersPagination.currentPage * followersPagination.itemsPerPage
                  )
                  .map((user) => (
                    <UserCard
                      user={user}
                      key={user.id}
                      isFollower={true}
                    />
                  ))}
                
                <Pagination
                  currentPage={followersPagination.currentPage}
                  totalPages={followersPagination.totalPages}
                  totalItems={followersPagination.totalUsers}
                  itemsPerPage={followersPagination.itemsPerPage}
                  onPageChange={(page) => handlePageChange(page, "followers")}
                  onItemsPerPageChange={(limit) => handleItemsPerPageChange(limit, "followers")}
                  isLoading={isLoading}
                />
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👥</div>
                <p className={styles.noResults}>No followers yet</p>
                <p className={styles.emptySubtext}>
                  When people follow you, they'll appear here
                </p>
              </div>
            )}
          </div>
        );
      case "following":
        return (
          <div className={styles.userList}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                placeholder="Search following by name, bio, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Search</button>
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery("")}
                  className={styles.clearButton}
                >
                  Clear
                </button>
              )}
            </form>
            {following.length > 0 ? (
              <>
                {following
                  .slice(
                    (followingPagination.currentPage - 1) * followingPagination.itemsPerPage,
                    followingPagination.currentPage * followingPagination.itemsPerPage
                  )
                  .map((user) => (
                    <UserCard
                      user={user}
                      key={user.id}
                    />
                  ))}
                
                <Pagination
                  currentPage={followingPagination.currentPage}
                  totalPages={followingPagination.totalPages}
                  totalItems={followingPagination.totalUsers}
                  itemsPerPage={followingPagination.itemsPerPage}
                  onPageChange={(page) => handlePageChange(page, "following")}
                  onItemsPerPageChange={(limit) => handleItemsPerPageChange(limit, "following")}
                  isLoading={isLoading}
                />
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔍</div>
                <p className={styles.noResults}>Not following anyone yet</p>
                <p className={styles.emptySubtext}>
                  Start following people to see their updates here
                </p>
              </div>
            )}
          </div>
        );
      case "pending":
        return (
          <div className={styles.userList}>
            {pendingRequests.length > 0 ? (
              <>
                {pendingRequests
                  .slice(
                    (pendingPagination.currentPage - 1) * pendingPagination.itemsPerPage,
                    pendingPagination.currentPage * pendingPagination.itemsPerPage
                  )
                  .map((request) => (
                    <div key={request.id} className={styles.requestCard}>
                      <div className={styles.userInfo}>
                        <img
                          src={request.requesterPicture || default_profile_picture}
                          alt={request.requesterName}
                          className={styles.userAvatar}
                        />
                        <div className={styles.userDetails}>
                          <h4>{request.requesterName}</h4>
                          <p className={styles.requestDate}>
                            Requested {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={styles.requestActions}>
                        <button
                          onClick={() =>
                            handleRespondToRequest(request.id, "accept")
                          }
                          className={styles.acceptButton}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleRespondToRequest(request.id, "reject")
                          }
                          className={styles.rejectButton}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                
                <Pagination
                  currentPage={pendingPagination.currentPage}
                  totalPages={pendingPagination.totalPages}
                  totalItems={pendingPagination.totalUsers}
                  itemsPerPage={pendingPagination.itemsPerPage}
                  onPageChange={(page) => handlePageChange(page, "pending")}
                  onItemsPerPageChange={(limit) => handleItemsPerPageChange(limit, "pending")}
                  isLoading={isLoading}
                />
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <p className={styles.noResults}>No pending requests</p>
                <p className={styles.emptySubtext}>
                  When someone sends you a follow request, it will appear here
                </p>
              </div>
            )}
          </div>
        );
      case "suggestions":
        return (
          <div className={styles.userList}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                placeholder="Search users by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">Search</button>
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery("")}
                  className={styles.clearButton}
                >
                  Clear
                </button>
              )}
            </form>
            
            {isLoading ? (
              <div className={styles.loading}>Loading users...</div>
            ) : suggestions.length > 0 ? (
              <>
                {suggestions.map((user) => (
                  <UserCard
                    user={user}
                    key={user.id}
                  />
                ))}
                
                <Pagination
                  currentPage={suggestionsPagination.currentPage}
                  totalPages={suggestionsPagination.totalPages}
                  totalItems={suggestionsPagination.totalUsers}
                  itemsPerPage={suggestionsPagination.itemsPerPage}
                  onPageChange={(page) => handlePageChange(page, "suggestions")}
                  onItemsPerPageChange={(limit) => handleItemsPerPageChange(limit, "suggestions")}
                  isLoading={isLoading}
                />
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔍</div>
                <p className={styles.noResults}>
                  {searchQuery ? `No users found for "${searchQuery}"` : "No users found"}
                </p>
                <p className={styles.emptySubtext}>
                  {searchQuery 
                    ? "Try searching with different keywords or clear the search to see all users"
                    : "There are no users to display at the moment"
                  }
                </p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const UserCard = ({
    user,
    isFollower = false,
  }) => {
    return (
      <div className={styles.userCard}>
        <div className={styles.userInfo}>
          <img
            src={user.profilePictureUrl || default_profile_picture}
            alt={user.firstName || "User"}
            className={styles.userAvatar}
          />
          <div className={styles.userDetails}>
            <h4>
              {user.firstName || "Unknown"} {user.lastName || "User"}
            </h4>
            <p className={styles.userBio}>{user.bio || "No bio available"}</p>
            {user.jobTitle && <p className={styles.userJob}>{user.jobTitle}</p>}
          </div>
        </div>
        <div className={styles.userActions}>
          {isFollower && (
            <button
              onClick={() => handleRemoveFollower(user.userName)}
              className={styles.removeFollowerButton}
            >
              Remove Follower
            </button>
          )}
          {(
            <button
              onClick={getFollowButtonAction(user, isFollower)}
              className={getFollowButtonClassName(user, isFollower)}
            >
              {getFollowButtonText(user, isFollower)}
            </button>
          )}
          {(
            <button
              onClick={() => navigate(`/${user.userName}`)}
              className={styles.viewButton}
            >
              View Profile
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Manage My Network</h1>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "connections" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("connections")}
        >
          Connections
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "followers" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("followers")}
        >
          Followers
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "following" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("following")}
        >
          Following
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "pending" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Requests
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "suggestions" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("suggestions")}
        >
          Suggestions
        </button>
      </div>

      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
    };
  
  export default FollowNetwork;