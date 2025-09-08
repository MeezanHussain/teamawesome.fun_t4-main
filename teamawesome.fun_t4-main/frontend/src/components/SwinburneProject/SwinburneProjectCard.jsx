import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../../utils/api";
import styles from "./SwinburneProjectCard.module.css";

const SwinburneProjectCard = ({ 
  project, 
  showCollaborators = true, 
  showProgress = true,
  onUpdate = null 
}) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(project.is_liked || false);
  const [likesCount, setLikesCount] = useState(parseInt(project.likes_count || 0));

  const handleCardClick = () => {
    navigate(`/swinburne-project/${project.id}`);
  };

  const handleLike = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      await api.post(`/projects/${project.base_project_id}/like`);
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleUserClick = (e) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/${project.user_name}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      "Not Started": "#718096",
      "Planning": "#667eea",
      "In Progress": "#ed8936",
      "Review": "#9f7aea",
      "Completed": "#48bb78",
      "Submitted": "#38b2ac"
    };
    return colors[status] || "#718096";
  };

  const getDaysUntilDue = () => {
    if (!project.due_date) return null;
    
    const dueDate = new Date(project.due_date);
    const today = new Date();
    const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && project.status !== "Completed" && project.status !== "Submitted";

  return (
    <div 
      className={`${styles.projectCard} ${isOverdue ? styles.overdue : ""}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.projectMeta}>
          <span className={styles.unitCode}>{project.unit_code}</span>
          <span className={styles.projectType}>{project.project_type}</span>
        </div>
        
        <div 
          className={styles.statusBadge}
          style={{ backgroundColor: getStatusColor(project.status) }}
        >
          {project.status}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.cardContent}>
        <h3 className={styles.title}>{project.title}</h3>
        
        {project.description && (
          <p className={styles.description}>
            {project.description.length > 120 
              ? `${project.description.substring(0, 120)}...` 
              : project.description
            }
          </p>
        )}

        <div className={styles.projectDetails}>
          <div className={styles.detailItem}>
            <span className={styles.label}>Unit:</span>
            <span className={styles.value}>{project.unit_name}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.label}>Period:</span>
            <span className={styles.value}>{project.semester} {project.academic_year}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.label}>Campus:</span>
            <span className={styles.value}>{project.campus}</span>
          </div>
        </div>

        {/* Due Date */}
        {project.due_date && (
          <div className={styles.dueDate}>
            <span className={`${styles.dueDateLabel} ${isOverdue ? styles.overdue : ""}`}>
              {isOverdue 
                ? `${Math.abs(daysUntilDue)} days overdue`
                : daysUntilDue === 0 
                  ? "Due today"
                  : daysUntilDue === 1
                    ? "Due tomorrow"
                    : `Due in ${daysUntilDue} days`
              }
            </span>
            <span className={styles.dueDateValue}>
              {new Date(project.due_date).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Progress Bar */}
        {showProgress && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>Progress</span>
              <span className={styles.progressValue}>{project.progress_percentage || 0}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${project.progress_percentage || 0}%`,
                  backgroundColor: getStatusColor(project.status)
                }}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className={styles.tags}>
            {project.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className={styles.tag}>{tag}</span>
            ))}
            {project.tags.length > 3 && (
              <span className={styles.tagMore}>+{project.tags.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        {/* Creator Info */}
        <div className={styles.creatorInfo} onClick={handleUserClick}>
          <img 
            src={project.profile_picture_url || "/default-avatar.png"} 
            alt={`${project.first_name} ${project.last_name}`}
            className={styles.creatorAvatar}
          />
          <div className={styles.creatorDetails}>
            <span className={styles.creatorName}>
              {project.first_name} {project.last_name}
            </span>
            <span className={styles.createdDate}>
              {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.cardActions}>
          {/* Collaborators Count */}
          {showCollaborators && project.current_collaborators_count !== undefined && (
            <div className={styles.collaboratorsCount}>
              <span className={styles.actionIcon}>👥</span>
              <span>{project.current_collaborators_count}</span>
            </div>
          )}

          {/* Milestones Count */}
          {project.milestones_count !== undefined && (
            <div className={styles.milestonesCount}>
              <span className={styles.actionIcon}>📋</span>
              <span>{project.completed_milestones_count || 0}/{project.milestones_count || 0}</span>
            </div>
          )}

          {/* Like Button */}
          <button 
            className={`${styles.likeButton} ${isLiked ? styles.liked : ""}`}
            onClick={handleLike}
          >
            <span className={styles.actionIcon}>❤️</span>
            <span>{likesCount}</span>
          </button>
        </div>
      </div>

      {/* Project Images Preview */}
      {project.image_urls && project.image_urls.length > 0 && (
        <div className={styles.imagePreview}>
          <img 
            src={project.image_urls[0]} 
            alt="Project preview"
            className={styles.previewImage}
          />
          {project.image_urls.length > 1 && (
            <div className={styles.imageCount}>
              +{project.image_urls.length - 1}
            </div>
          )}
        </div>
      )}

      {/* Collaboration Status */}
      {project.collaboration_status === "Open" && (
        <div className={styles.collaborationBadge}>
          <span className={styles.openForCollab}>🤝 Open for Collaboration</span>
        </div>
      )}
    </div>
  );
};

export default SwinburneProjectCard;