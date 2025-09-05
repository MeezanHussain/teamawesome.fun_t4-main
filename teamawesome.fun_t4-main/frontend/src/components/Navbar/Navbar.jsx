import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";
import { getCookie, deleteCookie } from "../../../utils/cookie"; // 👈 import from utils

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkAuth = () => {
    const token = getCookie("token");
    setIsLoggedIn(!!token);
  };

  useEffect(() => {
    checkAuth();
    // Listen to path changes for reactive auth state update
  }, [location.pathname]);

  const handleLogout = () => {
    deleteCookie("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo} onClick={() => navigate("/")}>
        <span style={{ color: "#667eea", fontWeight: "bold" }}>Team</span>
        <span style={{ color: "#764ba2", fontWeight: "bold" }}>Awesome</span>
      </div>

      <div className={styles.navLinks}>
                 {isLoggedIn ? (
           <>
             <Link to="/project-gallery" className={styles.navLink}>
               Gallery
             </Link>
             <Link to="/profile" className={styles.navLink}>
               My Profile
             </Link>
             <Link to="/follow-network" className={styles.navLink}>
               Network
             </Link>
             <Link to="/edit-profile" className={styles.navLink}>
               Edit Profile
             </Link>
             <button onClick={handleLogout} className={styles.logoutButton}>
               Logout
             </button>
           </>
         ) : (
           <>
             <Link to="/" className={styles.navLink}>
               Home
             </Link>
             <Link to="/login" className={styles.navLink}>
               Login
             </Link>
             <Link to="/signup" className={styles.navLink}>
               Sign Up
             </Link>
           </>
         )}
      </div>
    </nav>
  );
};

export default Navbar;
