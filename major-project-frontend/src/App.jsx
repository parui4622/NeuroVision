import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import CoverPage from "./StatelessComponents/CoverPage/CoverPage";
import Dashboard from "./StatelessComponents/Dashboard/dashboard";
import UserLogin from "./StatelessComponents/Login/userLogin";
import UserSignUp from "./StatelessComponents/User/userSignUp";

function App() {
  return (    <>      
    <Router>
        <Routes>
          <Route index element={<CoverPage />} />
          <Route path="/" element={<CoverPage />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/signup" element={<UserSignUp />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
