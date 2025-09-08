import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import CollaboratorManager from "./CollaboratorManager";
import MilestoneTracker from "./MilestoneTracker";
import ProjectProgress from "./ProjectProgress";
import styles from "./SwinburneProjectView.module.css";

const SwinburneProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/swinburne-projects/${projectId}`);
      const projectData = response.data.project;
      
      setProject(projectData);
      
      // Find current user's role in collaborators
      const token = getCookie("token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = payload.id;
        const userCollaboration = projectData.collaborators.find(
          collab => collab.user_id === currentUserId
        );
        setUserRole(userCollaboration?.role || null);
      }
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!project) return;
    
    try {
      await api.post(`/projects/${project.base_project_id}/like`);
      setProject(prev => ({
        ...prev,
        is_liked: !prev.is_liked,
        likes_count: prev.is_liked 
          ? parseInt(prev.likes_count) - 1 
          : parseInt(prev.likes_count) + 1
      }));
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleEdit = () => {
    navigate(`/swinburne-project-edit/${projectId}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await api.delete(`/swinburne-projects/${projectId}`);
      navigate("/profile", { state: { projectDeleted: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.notFound}>
        <h2>Project not found</h2>
        <button onClick={() => navigate("/profile")}>Back to Profile</button>
      </div>
    );
  }

  const canEdit = userRole === "Leader";
  const canCollaborate = ["Leader", "Developer", "Designer", "Researcher", "Writer"].includes(userRole);

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.projectInfo}>
            <div className={styles.breadcrumb}>
              <span className={styles.unitCode}>{project.unit_code}</span>
              <span className={styles.semester}>{project.semester} {project.academic_year}</span>
              <span className={styles.campus}>{project.campus}</span>
            </div>
            <h1 className={styles.title}>{project.title}</h1>
            <p className={styles.description}>{project.description}</p>
            
            <div className={styles.metadata}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Type:</span>
                <span className={styles.metaValue}>{project.project_type}</span>
              </div>
              {project.assessment_weight && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Weight:</span>
                  <span className={styles.metaValue}>{project.assessment_weight}</span>
                </div>
              )}
              {project.due_date && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Due:</span>
                  <span className={styles.metaValue}>
                    {new Date(project.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.tags}>
              {project.tags && project.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.statusBadge} data-status={project.status}>
              {project.status}
            </div>
            
            <div className={styles.actionButtons}>
              <button 
                className={`${styles.likeButton} ${project.is_liked ? styles.liked : ""}`}
                onClick={handleLike}
              >
                ❤️ {project.likes_count}
              </button>
              
              {canEdit && (
                <>
                  <button className={styles.editButton} onClick={handleEdit}>
                    ✏️ Edit
                  </button>
                  <button className={styles.deleteButton} onClick={handleDelete}>
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <ProjectProgress 
          progress={project.progress_percentage} 
          status={project.status}
        />
      </div>

      {/* Project Images */}
      {project.image_urls && project.image_urls.length > 0 && (
        <div className={styles.imagesSection}>
          <div className={styles.imagesGrid}>
            {project.image_urls.map((url, index) => (
              <img 
                key={index} 
                src={url} 
                alt={`Project image ${index + 1}`}
                className={styles.projectImage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className={styles.tabNavigation}>
        <button 
          className={`${styles.tab} ${activeTab === "overview" ? styles.active : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "team" ? styles.active : ""}`}
          onClick={() => setActiveTab("team")}
        >
          Team ({project.collaborators.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "milestones" ? styles.active : ""}`}
          onClick={() => setActiveTab("milestones")}
        >
          Milestones ({project.milestones.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "overview" && (
          <div className={styles.overviewTab}>
            <div className={styles.projectDetails}>
              <h3>Project Details</h3>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <label>Unit:</label>
                  <span>{project.unit_code} - {project.unit_name}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Academic Period:</label>
                  <span>{project.semester} {project.academic_year}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Campus:</label>
                  <span>{project.campus}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Project Type:</label>
                  <span>{project.project_type}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Visibility:</label>
                  <span>{project.visibility}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Collaboration:</label>
                  <span>{project.collaboration_status}</span>
                </div>
                {project.final_grade && (
                  <div className={styles.detailItem}>
                    <label>Grade:</label>
                    <span className={styles.grade}>{project.final_grade}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.projectCreator}>
              <h3>Project Creator</h3>
              <div className={styles.creatorInfo}>
                <img 
                  src={project.profile_picture_url || "/default-avatar.png"} 
                  alt={`${project.first_name} ${project.last_name}`}
                  className={styles.creatorAvatar}
                />
                <div className={styles.creatorDetails}>
                  <h4>{project.first_name} {project.last_name}</h4>
                  <p>@{project.user_name}</p>
                  <p>Created on {new Date(project.base_created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "team" && (
          <CollaboratorManager 
            projectId={projectId}
            collaborators={project.collaborators}
            userRole={userRole}
            collaborationStatus={project.collaboration_status}
            onUpdate={fetchProject}
          />
        )}

        {activeTab === "milestones" && (
          <MilestoneTracker 
            projectId={projectId}
            milestones={project.milestones}
            canEdit={canCollaborate}
            onUpdate={fetchProject}
          />
        )}
      </div>
    </div>
  );
};

// Helper function to get cookie (you might want to move this to utils)
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

export default SwinburneProjectView;