import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosConfig";

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // FIXED: Changed from "/api/auth/profile" to "/auth/profile"
        const response = await axiosInstance.get("/auth/profile");
        setProfileData(response.data);
      } catch (error) {
        console.error("Failed to fetch profile info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (!profileData)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load user credentials.
      </div>
    );

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 shadow-md rounded">
      <h1 className="text-2xl font-bold mb-4 text-center">User Profile</h1>
      <div className="space-y-2">
        <p>
          <strong>Name:</strong> {profileData.name}
        </p>
        <p>
          <strong>Email:</strong> {profileData.email}
        </p>
        <p>
          <strong>Role:</strong>{" "}
          <span className="capitalize">{profileData.role || "user"}</span>
        </p>
      </div>
    </div>
  );
};

export default Profile;
