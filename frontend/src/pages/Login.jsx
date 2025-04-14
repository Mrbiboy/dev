import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import SetPassword from "./SetPassword"; // Adjust path as needed

const Login = ({ setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  // Handle Google OAuth callback
  useEffect(() => {
    if (location.pathname === "/auth/google/callback") {
      const params = new URLSearchParams(location.search);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const userId = params.get("user_id");
      const name = params.get("name");
      const email = params.get("email");
      const needsPassword = params.get("needs_password") === "true";

      if (accessToken && refreshToken && userId && email) {
        // Store tokens and user info
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("token_expiration", Date.now() + 3600000);
        const user = { id: userId, name, email };
        localStorage.setItem("user", JSON.stringify(user));

        if (!needsPassword) {
          // User has a password, go to dashboard
          setIsAuthenticated(true);
          setUser(user);
          toast.success("Connexion Google réussie !", {
            position: "top-right",
            autoClose: 3000,
            theme: "dark",
          });
          navigate("/dashboard", { replace: true });
        } else {
          // User needs to set a password
          setGoogleUser(user);
          setNeedsPassword(true);
        }
      } else {
        toast.error("Erreur lors de l'authentification Google", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
        navigate("/login", { replace: true });
      }
    }
  }, [location, navigate, setIsAuthenticated, setUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        console.log("✅ Login success:", data);

        localStorage.setItem("token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("token_expiration", Date.now() + 3600000);
        localStorage.setItem("user", JSON.stringify(data.user));

        setIsAuthenticated(true);
        setUser(data.user);

        toast.success("Connexion réussie !", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });

        navigate("/dashboard");
      } else {
        toast.error(data.error || "Échec de la connexion", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      }
    } catch (error) {
      toast.error("Erreur de connexion au serveur", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/auth/google");
      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url; // Redirect to Google OAuth
      } else {
        toast.error("Erreur lors de l'initialisation de Google OAuth", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      }
    } catch (error) {
      toast.error("Erreur de connexion au serveur", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    }
  };

  // Render password setup form if needed
  if (needsPassword && googleUser) {
    return (
      <SetPassword
        user={googleUser}
        setIsAuthenticated={setIsAuthenticated}
        setUser={setUser}
      />
    );
  }

  // Render login form
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md z-10">
        <h2 className="text-2xl font-bold text-center text-gray-100 mb-6">Connexion</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 placeholder-gray-400"
              placeholder="Entrez votre email"
              required
            />
          </div>

          <div className="mb-6 relative">
            <label htmlFor="password" className="block text-gray-300 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 pr-10 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 placeholder-gray-400"
              placeholder="Entrez votre mot de passe"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-9 text-gray-400 hover:text-white"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white p-2 rounded-lg font-semibold transition-colors duration-200 ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-800 p-2 rounded-lg font-semibold flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Se connecter avec Google
          </button>
        </div>

        <p className="text-center text-gray-400 mt-4">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;