import styles from "./ProjectTypeSelector.module.css";

const ProjectTypeSelector = ({ selectedType, onTypeSelect, required = false }) => {
  const projectTypes = [
    {
      value: "Individual",
      label: "Individual Project",
      description: "Solo work assignment",
      icon: "👤",
      color: "#667eea"
    },
    {
      value: "Group",
      label: "Group Project",
      description: "Team collaboration required",
      icon: "👥",
      color: "#48bb78"
    },
    {
      value: "Assignment",
      label: "Assignment",
      description: "Course assessment task",
      icon: "📝",
      color: "#ed8936"
    },
    {
      value: "Research",
      label: "Research Project",
      description: "Academic research work",
      icon: "🔬",
      color: "#9f7aea"
    },
    {
      value: "Capstone",
      label: "Capstone Project",
      description: "Final year major project",
      icon: "🎓",
      color: "#38b2ac"
    }
  ];

  return (
    <div className={styles.projectTypeSelector}>
      <label className={styles.label}>
        Project Type {required && <span className={styles.required}>*</span>}
      </label>
      
      <div className={styles.typesGrid}>
        {projectTypes.map((type) => (
          <div
            key={type.value}
            className={`${styles.typeCard} ${
              selectedType === type.value ? styles.selected : ""
            }`}
            onClick={() => onTypeSelect(type.value)}
            style={{ '--type-color': type.color }}
          >
            <div className={styles.typeIcon}>{type.icon}</div>
            <div className={styles.typeInfo}>
              <div className={styles.typeLabel}>{type.label}</div>
              <div className={styles.typeDescription}>{type.description}</div>
            </div>
            {selectedType === type.value && (
              <div className={styles.checkmark}>✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectTypeSelector;