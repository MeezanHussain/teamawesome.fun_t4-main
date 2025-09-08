import { useState } from "react";
import api from "../../../utils/api";
import styles from "./CollaboratorManager.module.css";

const CollaboratorManager = ({ 
  projectId, 
  collaborators, 
  userRole, 
  collaborationStatus,
  onUpdate 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("Developer");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const roles = ["Developer", "Designer", "Researcher", "Writer"];
  const canManage = userRole === "Leader";

  const searchUsers = async (term) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await api.get(`/profile/search-users?query=${encodeURIComponent(term)}`);
      
      // Filter out users who are already collaborators
      const currentCollaboratorIds = collaborators.map(c => c.user_id);
      const filteredResults = response.data.users.filter(
        user => !currentCollaboratorIds.includes(user.id)
      );
      
      setSearchResults(filteredResults);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addCollaborator = async (userId) => {
    try {
      setError("");
      await api.post(`/swinburne-projects/${projectId}/collaborators`, {
        userId,
        role: selectedRole
      });
      
      setShowAddForm(false);
      setSearchTerm("");
      setSearchResults([]);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add collaborator");
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      setError("");
      await api.put(`/swinburne-projects/${projectId}/collaborators/${userId}`, {
        role: newRole
      });
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role");
    }
  };

  const removeCollaborator = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this collaborator?")) {
      return;
    }

    try {
      setError("");
      await api.delete(`/swinburne-projects/${projectId}/collaborators/${userId}`);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove collaborator");
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    searchUsers(term);
  };

  return (
    <div className={styles.collaboratorManager}>
      <div className={styles.header}>
        <h3>Team Members</h3>
        {canManage && collaborationStatus !== "Closed" && (
          <button 
            className={styles.addButton}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            + Add Member
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Add Collaborator Form */}
      {showAddForm && (
        <div className={styles.addForm}>
          <div className={styles.formHeader}>
            <h4>Add New Collaborator</h4>
            <button 
              className={styles.closeButton}
              onClick={() => {
                setShowAddForm(false);
                setSearchTerm("");
                setSearchResults([]);
              }}
            >
              ×
            </button>
          </div>

          <div className={styles.searchSection}>
            <div className={styles.searchInput}>
              <input
                type="text"
                placeholder="Search users by name or username..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {isSearching && <span className={styles.searchLoader}>⏳</span>}
            </div>

            <div className={styles.roleSelector}>
              <label>Role:</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map(user => (
                <div key={user.id} className={styles.userResult}>
                  <div className={styles.userInfo}>
                    <img 
                      src={user.profile_picture_url || "/default-avatar.png"}
                      alt={`${user.first_name} ${user.last_name}`}
                      className={styles.userAvatar}
                    />
                    <div>
                      <h5>{user.first_name} {user.last_name}</h5>
                      <p>@{user.user_name}</p>
                    </div>
                  </div>
                  <button
                    className={styles.inviteButton}
                    onClick={() => addCollaborator(user.id)}
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className={styles.noResults}>No users found</div>
          )}
        </div>
      )}

      {/* Collaborators List */}
      <div className={styles.collaboratorsList}>
        {collaborators.map(collaborator => (
          <div key={collaborator.user_id} className={styles.collaboratorCard}>
            <div className={styles.collaboratorInfo}>
              <img 
                src={collaborator.profile_picture_url || "/default-avatar.png"}
                alt={`${collaborator.first_name} ${collaborator.last_name}`}
                className={styles.collaboratorAvatar}
              />
              <div className={styles.collaboratorDetails}>
                <h4>{collaborator.first_name} {collaborator.last_name}</h4>
                <p>@{collaborator.user_name}</p>
                <small>Joined {new Date(collaborator.joined_at).toLocaleDateString()}</small>
              </div>
            </div>

            <div className={styles.collaboratorRole}>
              {canManage && collaborator.role !== "Leader" ? (
                <select
                  value={collaborator.role}
                  onChange={(e) => updateRole(collaborator.user_id, e.target.value)}
                  className={styles.roleSelect}
                >
                  <option value="Leader">Leader</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              ) : (
                <span className={`${styles.roleBadge} ${styles[collaborator.role.toLowerCase()]}`}>
                  {collaborator.role}
                </span>
              )}
            </div>

            <div className={styles.collaboratorActions}>
              {collaborator.status === "Invited" && (
                <span className={styles.invitedBadge}>Invited</span>
              )}
              
              {canManage && collaborator.role !== "Leader" && (
                <button
                  className={styles.removeButton}
                  onClick={() => removeCollaborator(collaborator.user_id)}
                  title="Remove collaborator"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {collaborators.length === 0 && (
        <div className={styles.emptyState}>
          <p>No team members yet.</p>
          {canManage && (
            <p>Add collaborators to start working together!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CollaboratorManager;