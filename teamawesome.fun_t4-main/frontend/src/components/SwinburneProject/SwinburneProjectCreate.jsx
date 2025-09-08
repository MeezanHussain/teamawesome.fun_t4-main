import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import UnitSelector from "../Academic/UnitSelector";
import SemesterCalendar from "../Academic/SemesterCalendar";
import CampusSelector from "../Academic/CampusSelector";
import ProjectTypeSelector from "./ProjectTypeSelector";
import styles from "./SwinburneProjectCreate.module.css";

const SwinburneProjectCreate = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [units, setUnits] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    // Basic Information
    title: "",
    description: "",
    files: [],
    previews: [],
    
    // Course Details
    unit_code: "",
    unit_name: "",
    semester: "",
    academic_year: new Date().getFullYear(),
    campus: "",
    
    // Project Details
    project_type: "",
    assessment_weight: "",
    due_date: "",
    
    // Collaboration Settings
    collaboration_status: "Open",
    visibility: "Swinburne Only",
    instructor_code: "",
    
    // Project Planning
    tags: []
  });

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await api.get("/swinburne-projects/units");
      setUnits(response.data.units);
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-populate unit name when unit code is selected
    if (field === 'unit_code') {
      const selectedUnit = units.find(unit => unit.unit_code === value);
      if (selectedUnit) {
        setFormData(prev => ({
          ...prev,
          unit_name: selectedUnit.unit_name
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Create previews
    const newPreviews = selectedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setFormData(prev => ({
      ...prev,
      files: selectedFiles,
      previews: newPreviews
    }));
  };

  const handleTagsChange = (tags) => {
    setFormData(prev => ({
      ...prev,
      tags: tags
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.title.trim().length >= 3;
      case 2:
        return formData.unit_code && formData.semester && formData.campus && formData.project_type;
      case 3:
        return true; // Collaboration step is optional
      case 4:
        return true; // Planning step is optional
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError("");
    } else {
      setError("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    
    if (!validateStep(currentStep)) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      const submitFormData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'files') {
          formData.files.forEach((file) => submitFormData.append("projectImages", file));
        } else if (key === 'previews') {
          // Skip previews
        } else if (key === 'tags') {
          submitFormData.append(key, JSON.stringify(formData[key]));
        } else {
          submitFormData.append(key, formData[key]);
        }
      });

      const response = await api.post("/swinburne-projects/create", submitFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/profile", { 
        state: { 
          swinburneProjectCreated: true,
          projectData: response.data.project
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create Swinburne project");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <h2>Basic Information</h2>
            <div className={styles.formGroup}>
              <label htmlFor="title">Project Title *</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                maxLength={100}
                placeholder="Enter your project title"
                required
              />
              <small>{formData.title.length}/100 characters</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Project Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Describe your project (optional)"
              />
              <small>{formData.description.length}/1000 characters</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="files" className={styles.uploadFileLabel}>Project Images</label>
              <input
                className={styles.uploadButton}
                id="files"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                type="button"
                className={styles.uploadTrigger}
                onClick={() => document.getElementById('files').click()}
              >
                + Upload Images
              </button>
              <div className={styles.filePreviews}>
                {formData.previews.map((preview, index) => (
                  <div key={index} className={styles.previewItem}>
                    <img src={preview.url} alt={preview.name} />
                    <span>{preview.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <h2>Course Details</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <UnitSelector
                  units={units}
                  selectedUnit={formData.unit_code}
                  onUnitSelect={(unitCode) => handleInputChange('unit_code', unitCode)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <CampusSelector
                  selectedCampus={formData.campus}
                  onCampusSelect={(campus) => handleInputChange('campus', campus)}
                  availableCampuses={
                    units.find(u => u.unit_code === formData.unit_code)?.campus || []
                  }
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <SemesterCalendar
                  selectedSemester={formData.semester}
                  selectedYear={formData.academic_year}
                  onSemesterSelect={(semester) => handleInputChange('semester', semester)}
                  onYearSelect={(year) => handleInputChange('academic_year', year)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <ProjectTypeSelector
                  selectedType={formData.project_type}
                  onTypeSelect={(type) => handleInputChange('project_type', type)}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="assessment_weight">Assessment Weight</label>
                <input
                  id="assessment_weight"
                  type="text"
                  value={formData.assessment_weight}
                  onChange={(e) => handleInputChange('assessment_weight', e.target.value)}
                  placeholder="e.g., 30%, Final Project"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="due_date">Due Date</label>
                <input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <h2>Collaboration Settings</h2>
            <div className={styles.formGroup}>
              <label>Collaboration Status</label>
              <div className={styles.radioGroup}>
                {[
                  { value: 'Open', label: 'Open for Collaborators', desc: 'Anyone can request to join' },
                  { value: 'Invite Only', label: 'Invite Only', desc: 'Only invited users can join' },
                  { value: 'Closed', label: 'Closed', desc: 'No new collaborators allowed' }
                ].map(option => (
                  <div key={option.value} className={styles.radioItem}>
                    <input
                      type="radio"
                      id={`collab_${option.value}`}
                      name="collaboration_status"
                      value={option.value}
                      checked={formData.collaboration_status === option.value}
                      onChange={(e) => handleInputChange('collaboration_status', e.target.value)}
                    />
                    <label htmlFor={`collab_${option.value}`}>
                      <strong>{option.label}</strong>
                      <small>{option.desc}</small>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Project Visibility</label>
              <div className={styles.radioGroup}>
                {[
                  { value: 'Public', label: 'Public', desc: 'Visible to everyone' },
                  { value: 'Swinburne Only', label: 'Swinburne Only', desc: 'Only Swinburne users can see' },
                  { value: 'Team Only', label: 'Team Only', desc: 'Only team members can see' },
                  { value: 'Private', label: 'Private', desc: 'Only you can see' }
                ].map(option => (
                  <div key={option.value} className={styles.radioItem}>
                    <input
                      type="radio"
                      id={`vis_${option.value}`}
                      name="visibility"
                      value={option.value}
                      checked={formData.visibility === option.value}
                      onChange={(e) => handleInputChange('visibility', e.target.value)}
                    />
                    <label htmlFor={`vis_${option.value}`}>
                      <strong>{option.label}</strong>
                      <small>{option.desc}</small>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="instructor_code">Instructor Access Code (Optional)</label>
              <input
                id="instructor_code"
                type="text"
                value={formData.instructor_code}
                onChange={(e) => handleInputChange('instructor_code', e.target.value)}
                placeholder="Enter instructor code for grade access"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <h2>Project Planning</h2>
            <div className={styles.formGroup}>
              <label htmlFor="tags">Project Tags</label>
              <TagInput
                tags={formData.tags}
                onTagsChange={handleTagsChange}
                placeholder="Add tags (press Enter to add)"
              />
              <small>Add relevant tags like technologies, subject areas, etc.</small>
            </div>

            <div className={styles.summarySection}>
              <h3>Project Summary</h3>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <label>Title:</label>
                  <span>{formData.title}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Unit:</label>
                  <span>{formData.unit_code} - {formData.unit_name}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Semester:</label>
                  <span>{formData.semester} {formData.academic_year}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Campus:</label>
                  <span>{formData.campus}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Type:</label>
                  <span>{formData.project_type}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Collaboration:</label>
                  <span>{formData.collaboration_status}</span>
                </div>
                <div className={styles.summaryItem}>
                  <label>Visibility:</label>
                  <span>{formData.visibility}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Create Swinburne Academic Project</h1>
        <div className={styles.progressBar}>
          {[1, 2, 3, 4].map(step => (
            <div
              key={step}
              className={`${styles.progressStep} ${
                currentStep >= step ? styles.active : ""
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {renderStep()}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            className={styles.backButton}
            onClick={currentStep === 1 ? () => navigate("/template-select") : prevStep}
          >
            {currentStep === 1 ? "Back to Templates" : "Previous"}
          </button>
          
          {currentStep < 4 ? (
            <button
              className={styles.nextButton}
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
            >
              Next
            </button>
          ) : (
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={isLoading || !validateStep(currentStep)}
            >
              {isLoading ? "Creating Project..." : "Create Project"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Tag Input Component
const TagInput = ({ tags, onTagsChange, placeholder }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        onTagsChange([...tags, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={styles.tagInput}>
      <div className={styles.tags}>
        {tags.map((tag, index) => (
          <span key={index} className={styles.tag}>
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className={styles.tagRemove}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={styles.tagInputField}
      />
    </div>
  );
};

export default SwinburneProjectCreate;