import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import LoginForm from "../components/LoginForm";
import { RegisterForm } from "../components/RegisterForm";
import bannerLoginForm from "../assets/bannerLoginForm.png";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const isLogin = location.pathname === "/login";

  return (
    <AuthLayout bannerImage={bannerLoginForm}>
      {isLogin ? (
        <LoginForm onSwitch={() => navigate("/register")} />
      ) : (
        <RegisterForm onSwitch={() => navigate("/login")} />
      )}
    </AuthLayout>
  );
}