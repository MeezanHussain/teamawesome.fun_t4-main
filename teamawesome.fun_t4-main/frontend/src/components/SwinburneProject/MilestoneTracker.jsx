import { useState } from "react";
import api from "../../../utils/api";
import styles from "./MilestoneTracker.module.css";

const MilestoneTracker = ({ 
  projectId, 
  milestones, 
  canEdit, 
  onUpdate 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    due_date: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      due_date: "",
    });
    setShowAddForm(false);
    setEditingMilestone(null);
    setError("");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.due_date) {
      setError("Name and due date are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (editingMilestone) {
        // Update existing milestone
        await api.put(`/swinburne-projects/${projectId}/milestones/${editingMilestone.id}`, formData);
      } else {
        // Create new milestone
        await api.post(`/swinburne-projects/${projectId}/milestones`, formData);
      }

      resetForm();
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save milestone");
    } finally {
      setIsSubmitting(false);
    }
  };

  const editMilestone = (milestone) => {
    setFormData({
      name: milestone.name,
      description: milestone.description || "",
      due_date: milestone.due_date.split('T')[0], // Format for date input
    });
    setEditingMilestone(milestone);
    setShowAddForm(true);
  };

  const toggleMilestoneCompletion = async (milestoneId, isCompleted) => {
    try {
      const endpoint = isCompleted ? "uncomplete" : "complete";
      await api.post(`/swinburne-projects/${projectId}/milestones/${milestoneId}/${endpoint}`);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update milestone");
    }
  };

  const deleteMilestone = async (milestoneId) => {
    if (!window.confirm("Are you sure you want to delete this milestone?")) {
      return;
    }

    try {
      await api.delete(`/swinburne-projects/${projectId}/milestones/${milestoneId}`);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete milestone");
    }
  };

  const sortedMilestones = [...milestones].sort((a, b) => {
    // Sort by completion status (incomplete first), then by order_index, then by due_date
    if (a.is_completed !== b.is_completed) {
      return a.is_completed - b.is_completed;
    }
    if (a.order_index !== b.order_index) {
      return a.order_index - b.order_index;
    }
    return new Date(a.due_date) - new Date(b.due_date);
  });

  const completedCount = milestones.filter(m => m.is_completed).length;
  const totalCount = milestones.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={styles.milestoneTracker}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h3>Project Milestones</h3>
          <div className={styles.progressSummary}>
            <span className={styles.progressText}>
              {completedCount} of {totalCount} completed ({Math.round(completionPercentage)}%)
            </span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <button 
            className={styles.addButton}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            + Add Milestone
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Add/Edit Milestone Form */}
      {showAddForm && (
        <div className={styles.milestoneForm}>
          <div className={styles.formHeader}>
            <h4>{editingMilestone ? "Edit Milestone" : "Add New Milestone"}</h4>
            <button 
              className={styles.closeButton}
              onClick={resetForm}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Milestone Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter milestone name"
                maxLength={200}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="due_date">Due Date *</label>
              <input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : (editingMilestone ? "Update" : "Add")} Milestone
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Milestones List */}
      <div className={styles.milestonesList}>
        {sortedMilestones.map(milestone => {
          const dueDate = new Date(milestone.due_date);
          const isOverdue = !milestone.is_completed && dueDate < new Date();
          const daysDiff = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));

          return (
            <div 
              key={milestone.id} 
              className={`${styles.milestoneCard} ${
                milestone.is_completed ? styles.completed : ""
              } ${isOverdue ? styles.overdue : ""}`}
            >
              <div className={styles.milestoneHeader}>
                <div className={styles.milestoneInfo}>
                  <div className={styles.milestoneTitle}>
                    <input
                      type="checkbox"
                      checked={milestone.is_completed}
                      onChange={() => toggleMilestoneCompletion(milestone.id, milestone.is_completed)}
                      disabled={!canEdit}
                      className={styles.milestoneCheckbox}
                    />
                    <h4 className={milestone.is_completed ? styles.strikethrough : ""}>
                      {milestone.name}
                    </h4>
                  </div>
                  
                  {milestone.description && (
                    <p className={styles.milestoneDescription}>
                      {milestone.description}
                    </p>
                  )}
                </div>

                {canEdit && (
                  <div className={styles.milestoneActions}>
                    <button
                      className={styles.editButton}
                      onClick={() => editMilestone(milestone)}
                      title="Edit milestone"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => deleteMilestone(milestone.id)}
                      title="Delete milestone"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.milestoneFooter}>
                <div className={styles.dueDateInfo}>
                  <span className={`${styles.dueDate} ${isOverdue ? styles.overdue : ""}`}>
                    Due: {dueDate.toLocaleDateString()}
                  </span>
                  {!milestone.is_completed && (
                    <span className={`${styles.daysRemaining} ${isOverdue ? styles.overdue : ""}`}>
                      {isOverdue 
                        ? `${Math.abs(daysDiff)} days overdue`
                        : daysDiff === 0 
                          ? "Due today"
                          : `${daysDiff} days remaining`
                      }
                    </span>
                  )}
                </div>

                {milestone.is_completed && milestone.completed_at && (
                  <div className={styles.completedInfo}>
                    <span className={styles.completedDate}>
                      ✅ Completed on {new Date(milestone.completed_at).toLocaleDateString()}
                    </span>
                    {milestone.completed_by_first_name && (
                      <span className={styles.completedBy}>
                        by {milestone.completed_by_first_name} {milestone.completed_by_last_name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {milestones.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h4>No milestones yet</h4>
          <p>Break down your project into manageable milestones to track progress.</p>
          {canEdit && (
            <button 
              className={styles.addFirstButton}
              onClick={() => setShowAddForm(true)}
            >
              Add Your First Milestone
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MilestoneTracker;