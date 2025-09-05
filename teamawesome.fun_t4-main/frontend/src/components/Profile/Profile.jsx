import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import styles from "./Profile.module.css";
import default_profile_picture from "../../assets/default-profile-picture.jpeg";

const Profile = () => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    bio: "",
    isProfilePublic: false,
    profilePictureUrl: "",
  });
  const [links, setLinks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const profileRes = await api.get("/profile");
        const profileData = profileRes.data.data.profile;
        const userId = profileData.id;

        const projectsRes = await api.get(`/projects/user/${userId}`);

        setProfile(profileData);
        setLinks(profileData.links || []);
        setProjects(projectsRes.data.projects || []);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(err.response?.data?.error?.message || "Failed to load data");
        }
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleShare = (username) => {
    navigator.clipboard.writeText(`${window.location.origin}/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteProject = async (projectId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this project?"
    );
    if (!confirm) return;

    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((proj) => proj.id !== projectId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <img
          src={profile.profilePictureUrl || default_profile_picture}
          alt="Profile"
          className={styles.avatar}
        />
        <h2>
          {profile.firstName} {profile.lastName}
        </h2>
        <p className={styles.bio}>
          {profile.bio ? (
            <i>{profile.bio}</i>
          ) : (
            <i>Write something about yourself..</i>
          )}
        </p>

        <div className={styles.actions}>
          <button
            className={styles.button}
            onClick={() => navigate("/edit-profile")}
          >
            Edit Profile
          </button>
          <button className={styles.button} onClick={() => handleShare(profile.userName)}>
            {copied ? "Copied!" : "Share Profile"}
          </button>
        </div>

        <h3 className={styles.linksHeader}>
          {links.length > 0 ? "Links :" : ""}
        </h3>
        <ul className={styles.linkList}>
          {links.map((link) => (
            <li key={link.id}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.projectsHeader}>
          <h2>My Projects</h2>
          <div className={styles.projectActions}>
            <button
              className={styles.galleryButton}
              onClick={() => navigate("/project-gallery")}
            >
              View Gallery
            </button>
            <button
              className={styles.createButton}
              onClick={() => navigate("/project-upload")}
            >
              Create Project
            </button>
          </div>
        </div>

        {projects.length > 0 ? (
          <div className={styles.projectsGrid}>
            {projects.map((project) => (
              <div key={project.id} className={styles.projectCard}>
                {project.image_urls?.length > 0 && (
                  <div className={styles.projectImages}>
                    {project.image_urls.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`${project.title} ${index + 1}`}
                        className={styles.projectImage}
                      />
                    ))}
                  </div>
                )}
                <div className={styles.projectInfo}>
                  <h3>{project.title}</h3>
                  <p className={styles.projectDescription}>
                    {project.description || "No description"}
                  </p>
                  <div className={styles.projectMeta}>
                    <span>{project.likes_count || 0} Likes</span>
                    <span>
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className={styles.deleteProjectButton}
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noProjects}>
            <p>You haven't created any projects yet.</p>
            <button
              className={styles.createButton}
              onClick={() => navigate("/project-upload")}
            >
              Create Your First Project
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
