import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

// Auth
import Signup from "./components/Auth/Signup";
import Login from "./components/Auth/Login";

// Components
import Navbar from "./components/Navbar/Navbar";
import Profile from "./components/Profile/Profile";
import EditProfile from "./components/Profile/EditProfile";
import FollowNetwork from "./components/Follow/FollowNetwork";
import ProjectUpload from "./components/Profile/ProjectUpload";
import WelcomeLanding from "./components/Landing/WelcomeLanding";
import ProjectGallery from "./components/Profile/ProjectGallery";
import ViewProfile from "./components/Profile/ViewProfile";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<WelcomeLanding />} />

        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/follow-network" element={<FollowNetwork />} />
        <Route path="/project-upload" element={<ProjectUpload />} />
        <Route path="/project-gallery" element={<ProjectGallery />} />
        <Route path="/:userName" element={<ViewProfile />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
