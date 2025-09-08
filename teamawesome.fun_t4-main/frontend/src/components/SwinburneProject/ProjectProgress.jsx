import styles from "./ProjectProgress.module.css";

const ProjectProgress = ({ progress = 0, status = "Not Started" }) => {
  const getProgressColor = () => {
    if (progress >= 100) return "#48bb78"; // Green
    if (progress >= 75) return "#38b2ac"; // Teal
    if (progress >= 50) return "#ed8936"; // Orange
    if (progress >= 25) return "#667eea"; // Blue
    return "#cbd5e0"; // Gray
  };

  const getStatusColor = (status) => {
    const statusColors = {
      "Not Started": "#718096",
      "Planning": "#667eea",
      "In Progress": "#ed8936",
      "Review": "#9f7aea",
      "Completed": "#48bb78",
      "Submitted": "#38b2ac"
    };
    return statusColors[status] || "#718096";
  };

  return (
    <div className={styles.projectProgress}>
      <div className={styles.progressHeader}>
        <div className={styles.progressInfo}>
          <span className={styles.progressLabel}>Progress</span>
          <span className={styles.progressPercentage}>{progress}%</span>
        </div>
        <div 
          className={styles.statusBadge}
          style={{ backgroundColor: getStatusColor(status) }}
        >
          {status}
        </div>
      </div>

      <div className={styles.progressBarContainer}>
        <div 
          className={styles.progressBar}
          style={{ 
            width: `${progress}%`,
            backgroundColor: getProgressColor()
          }}
        >
          <div className={styles.progressGlow} />
        </div>
      </div>

      <div className={styles.progressMilestones}>
        <div className={styles.milestone}>
          <div className={`${styles.milestoneMarker} ${progress >= 0 ? styles.reached : ""}`} />
          <span className={styles.milestoneLabel}>Start</span>
        </div>
        <div className={styles.milestone}>
          <div className={`${styles.milestoneMarker} ${progress >= 25 ? styles.reached : ""}`} />
          <span className={styles.milestoneLabel}>25%</span>
        </div>
        <div className={styles.milestone}>
          <div className={`${styles.milestoneMarker} ${progress >= 50 ? styles.reached : ""}`} />
          <span className={styles.milestoneLabel}>50%</span>
        </div>
        <div className={styles.milestone}>
          <div className={`${styles.milestoneMarker} ${progress >= 75 ? styles.reached : ""}`} />
          <span className={styles.milestoneLabel}>75%</span>
        </div>
        <div className={styles.milestone}>
          <div className={`${styles.milestoneMarker} ${progress >= 100 ? styles.reached : ""}`} />
          <span className={styles.milestoneLabel}>Complete</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectProgress;