import { Link, Route, Routes } from "react-router-dom";
import Home from "./screens/Home";
import GameDetail from "./screens/GameDetail";
import Plans from "./screens/Plans";
import Profile from "./screens/Profile";
import SignIn from "./screens/SignIn";
import TvHome from "./screens/TvHome";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games/:slug" element={<GameDetail />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/tv" element={<TvHome />} />
      <Route
        path="*"
        element={
          <div className="flex min-h-screen flex-col items-center justify-center gap-2">
            <p className="text-lg font-medium">Page not found</p>
            <Link to="/" className="underline">
              Back to store
            </Link>
          </div>
        }
      />
    </Routes>
  );
}
