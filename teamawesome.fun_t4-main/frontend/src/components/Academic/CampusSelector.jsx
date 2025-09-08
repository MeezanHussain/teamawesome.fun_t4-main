import styles from "./CampusSelector.module.css";

const CampusSelector = ({ 
  selectedCampus, 
  onCampusSelect, 
  availableCampuses = [], 
  required = false 
}) => {
  const allCampuses = [
    {
      value: "Hawthorn",
      label: "Hawthorn Campus",
      description: "Melbourne, Victoria",
      icon: "🏢"
    },
    {
      value: "Sarawak",
      label: "Sarawak Campus",
      description: "Kuching, Malaysia",
      icon: "🌴"
    },
    {
      value: "Online",
      label: "Online Learning",
      description: "Distance Education",
      icon: "💻"
    }
  ];

  // Filter campuses based on availability if provided
  const campuses = availableCampuses.length > 0 
    ? allCampuses.filter(campus => availableCampuses.includes(campus.value))
    : allCampuses;

  return (
    <div className={styles.campusSelector}>
      <label className={styles.label}>
        Campus {required && <span className={styles.required}>*</span>}
      </label>
      
      <div className={styles.campusGrid}>
        {campuses.map((campus) => (
          <div
            key={campus.value}
            className={`${styles.campusCard} ${
              selectedCampus === campus.value ? styles.selected : ""
            } ${
              availableCampuses.length > 0 && !availableCampuses.includes(campus.value) 
                ? styles.disabled 
                : ""
            }`}
            onClick={() => {
              if (availableCampuses.length === 0 || availableCampuses.includes(campus.value)) {
                onCampusSelect(campus.value);
              }
            }}
          >
            <div className={styles.campusIcon}>{campus.icon}</div>
            <div className={styles.campusInfo}>
              <div className={styles.campusLabel}>{campus.label}</div>
              <div className={styles.campusDescription}>{campus.description}</div>
            </div>
            {selectedCampus === campus.value && (
              <div className={styles.checkmark}>✓</div>
            )}
          </div>
        ))}
      </div>

      {availableCampuses.length > 0 && (
        <div className={styles.availabilityNote}>
          <small>
            * Available campuses for selected unit: {availableCampuses.join(", ")}
          </small>
        </div>
      )}
    </div>
  );
};

export default CampusSelector;