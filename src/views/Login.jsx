import { useState } from "react";
import axiosClient from "../axios-client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const onSubmit = (ev) => {
    ev.preventDefault();
    setError(null);

    axiosClient.post("/login", {
      email,
      password,
    })
    .then(({ data }) => {
      localStorage.setItem("ACCESS_TOKEN", data.token);
      localStorage.setItem("USER_NAME", data.user.name);
      localStorage.setItem("USER_ROLE", data.user.role);
      window.location.reload(); // Refresh to enter the system
    })
    .catch((err) => {
      const response = err.response;
      if (response && response.status === 401) {
        setError("Invalid email or password");
      } else {
        setError("An error occurred. Check if Backend is running.");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-4 text-blue-600">Library Login</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="admin@school.edu"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter password"
              required
            />
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}