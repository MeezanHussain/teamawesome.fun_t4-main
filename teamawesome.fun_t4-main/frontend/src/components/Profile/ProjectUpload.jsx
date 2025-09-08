import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import styles from "./ProjectUpload.module.css";

const ProjectUpload = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);

    // Create previews
    const newPreviews = selectedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      files.forEach((file) => formData.append("projectImages", file)); // ✅ match multer

      const response = await api.post("/projects", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/profile", { state: { projectCreated: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Create New Project</h1>
        <button
          className={styles.galleryButton}
          onClick={() => navigate("/project-gallery")}
        >
          View Gallery
        </button>
        <button
          className={styles.templateButton}
          onClick={() => navigate("/template-select")}
        >
          Choose Template
        </button>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Project Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="files" className={styles.uploadFileLabel}>Upload Images</label>
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
            +
          </button>
          <div className={styles.filePreviews}>
            {previews.map((preview, index) => (
              <div key={index} className={styles.previewItem}>
                <img src={preview.url} alt={preview.name} />
                <span>{preview.name}</span>
              </div>
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
};

export default ProjectUpload;
