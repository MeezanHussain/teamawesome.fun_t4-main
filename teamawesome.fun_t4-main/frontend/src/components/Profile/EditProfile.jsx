import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./EditProfile.module.css";
import api from "../../../utils/api";
import default_profile_picture from "../../assets/default-profile-picture.jpeg";

const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    isProfilePublic: false,
    profilePictureUrl: "",
    links: [],
  });

  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/profile");
        const profileData = response.data.data.profile;
        console.log("Fetched profile data:", profileData);
        console.log("isProfilePublic value:", profileData.isProfilePublic);
        setProfile(profileData);
        setPreviewUrl(profileData.profilePictureUrl || "");
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Debug effect to monitor profile state changes
  useEffect(() => {
    console.log("Profile state changed:", profile);
  }, [profile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log("handleChange called:", { name, value, type, checked });
    if (name === "isProfilePublic") {
      console.log("Checkbox changed:", { oldValue: profile.isProfilePublic, newValue: checked });
    }
    setProfile((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
    }
  };

  const handleLinkChange = (e) => {
    const { name, value } = e.target;
    setNewLink((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    console.log("Form submission - current profile state:", profile);
    console.log("Checkbox value before submission:", profile.isProfilePublic);

    try {
      // Update name if changed
      if (profile.firstName && profile.lastName) {
        await api.put("/profile/name", {
          firstName: profile.firstName,
          lastName: profile.lastName,
        });
      }

      // Update bio if changed
      if (profile.bio !== undefined) {
        await api.put("/profile/bio", {
          bio: profile.bio,
        });
      }

      // Update profile visibility if changed
      console.log("Sending profile visibility update:", { isPublic: profile.isProfilePublic });
      await api.put("/profile/visibility", {
        isPublic: profile.isProfilePublic,
      });

      // Upload profile picture if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append("profilePicture", selectedFile);
        await api.post("/profile/picture", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url) return;

    try {
      const response = await api.post("/profile/links", newLink);
      setProfile((prev) => ({
        ...prev,
        links: [...prev.links, response.data.data.link],
      }));
      setNewLink({ platform: "", url: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add link");
    }
  };

  const handleUpdateLink = async (linkId) => {
    if (!newLink.platform || !newLink.url) return;

    try {
      await api.put(`/profile/links/${linkId}`, newLink);
      setProfile((prev) => ({
        ...prev,
        links: prev.links.map((link) =>
          link._id === linkId ? { ...link, ...newLink } : link
        ),
      }));
      setEditingLinkId(null);
      setNewLink({ platform: "", url: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update link");
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await api.delete(`/profile/links/${linkId}`);
      setProfile((prev) => ({
        ...prev,
        links: prev.links.filter((link) => link._id !== linkId),
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete link");
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      await api.delete("/profile/picture");
      setPreviewUrl("");
      setProfile((prev) => ({
        ...prev,
        profilePictureUrl: "",
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete profile picture"
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        await api.delete("/profile");
        navigate("/login");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete account");
      }
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Edit Your Profile</h2>

        <div className={styles.avatarContainer}>
          <img
            src={previewUrl || default_profile_picture}
            alt="Preview"
            className={styles.avatar}
          />
          <div className={styles.imageControls}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={styles.fileInput}
              id="profilePicture"
            />
            <label htmlFor="profilePicture" className={styles.uploadButton}>
              Upload Photo
            </label>
            {previewUrl && (
              <button
                type="button"
                onClick={handleDeleteProfilePicture}
                className={styles.deletePhotoButton}
              >
                Delete Photo
              </button>
            )}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            value={profile.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={profile.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            disabled
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Bio</label>
          <textarea
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            maxLength={1000}
            placeholder="Tell us something about you..."
          />
        </div>

        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            name="isProfilePublic"
            checked={profile.isProfilePublic}
            onChange={handleChange}
          />
          <label>Make profile public</label>
        </div>

        <div className={styles.linksSection}>
          <h3>Social Links</h3>
          <div className={styles.linkForm}>
            <input
              type="text"
              name="title"
              value={newLink.title}
              onChange={handleLinkChange}
              placeholder="Platform (e.g., Twitter)"
            />
            <input
              type="url"
              name="url"
              value={newLink.url}
              onChange={handleLinkChange}
              placeholder="URL"
            />
            {editingLinkId ? (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateLink(editingLinkId)}
                  className={styles.linkButton}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingLinkId(null);
                    setNewLink({ platform: "", url: "" });
                  }}
                  className={styles.linkButton}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAddLink}
                className={styles.linkButton}
              >
                Add
              </button>
            )}
          </div>
          <ul className={styles.linksList}>
            {profile.links?.map((link) => (
              <li key={link.id} className={styles.linkItem}>
                <span>
                  {link.platform}: {link.url}
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLinkId(link._id);
                      setNewLink({ platform: link.platform, url: link.url });
                    }}
                    className={styles.linkActionButton}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLink(link._id)}
                    className={styles.linkActionButton}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.actionButtons}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className={styles.deleteAccountButton}
          >
            Delete Account
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
      </form>
    </div>
  );
};

export default EditProfile;
