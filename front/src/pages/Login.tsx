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
      title="Вход"
      onSubmit={handleLogin}
      buttonText="Войти"
      fields={[
        {
          name: "username",
          label: "Имя пользователя",
          placeholder: "Введите имя пользователя",
        },
        {
          name: "password",
          label: "Пароль",
          placeholder: "Введите пароль",
          type: "password",
        },
      ]}
      footerText="Нет аккаунта?"
      footerLinkText="Регистрация"
      footerLinkTo="/register"
    />
  );
};

export default Login;
