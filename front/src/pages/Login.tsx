import AuthForm from "../components/AuthForm";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();

  const handleLogin = async (values: Record<string, string>) => {
    const res = await loginUser({
      username: values.username,
      password: values.password,
    });
    await login(res.access_token);
  };

  return (
    <AuthForm
      onSubmit={handleLogin}
      buttonText="Войти"
      fields={[
        { name: "username", placeholder: "Имя пользователя" },
        { name: "password", placeholder: "Пароль", type: "password" },
      ]}
    />
  );
};

export default Login;
