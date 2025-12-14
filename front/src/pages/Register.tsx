import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";
import AuthForm from "../components/AuthForm";

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = async (values: Record<string, string>) => {
    await registerUser({
      username: values.username,
      email: values.email,
      password: values.password,
    });
    alert("Регистрация успешна! Теперь войдите в систему.");
    navigate("/login");
  };

  return (
    <AuthForm
      title="Регистрация"
      onSubmit={handleRegister}
      buttonText="Зарегистрироваться"
      fields={[
        {
          name: "username",
          label: "Имя пользователя",
          placeholder: "Придумайте имя пользователя",
        },
        {
          name: "email",
          label: "Email",
          placeholder: "Введите email",
          type: "email",
        },
        {
          name: "password",
          label: "Пароль",
          placeholder: "Придумайте пароль",
          type: "password",
        },
      ]}
      footerText="Уже есть аккаунт?"
      footerLinkText="Войти"
      footerLinkTo="/login"
    />
  );
};

export default Register;
