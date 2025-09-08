import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TemplateSelector.module.css";

const TemplateSelector = () => {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const navigate = useNavigate();

  const templates = [
    {
      id: "standard",
      title: "Standard Project",
      description: "General project template for all users",
      icon: "📁",
      features: [
        "Basic project information",
        "Image uploads",
        "Public visibility",
        "Like system"
      ]
    },
    {
      id: "swinburne",
      title: "Swinburne Academic Project",
      description: "Specialized template for Swinburne University students",
      icon: "🎓",
      features: [
        "Course integration (Unit codes)",
        "Collaboration management",
        "Milestone tracking",
        "Academic calendar sync",
        "Semester organization",
        "Team finder",
        "Grade tracking"
      ],
      requirement: "Requires Swinburne University email (@swin.edu.au or @student.swin.edu.au)"
    }
  ];

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const handleContinue = () => {
    if (!selectedTemplate) return;
    
    if (selectedTemplate === "standard") {
      navigate("/project-upload");
    } else if (selectedTemplate === "swinburne") {
      navigate("/swinburne-project-create");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Choose Project Template</h1>
        <p>Select the template that best fits your project needs</p>
      </div>

      <div className={styles.templatesGrid}>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`${styles.templateCard} ${
              selectedTemplate === template.id ? styles.selected : ""
            }`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <div className={styles.templateIcon}>{template.icon}</div>
            <h3>{template.title}</h3>
            <p className={styles.templateDescription}>{template.description}</p>
            
            <div className={styles.featuresSection}>
              <h4>Features:</h4>
              <ul className={styles.featuresList}>
                {template.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            {template.requirement && (
              <div className={styles.requirement}>
                <strong>Note:</strong> {template.requirement}
              </div>
            )}

            <div className={styles.selectIndicator}>
              {selectedTemplate === template.id && (
                <div className={styles.checkmark}>✓</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <button
          className={styles.continueButton}
          onClick={handleContinue}
          disabled={!selectedTemplate}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;