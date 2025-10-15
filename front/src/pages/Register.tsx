import { useNavigate } from "react-router-dom"
import { registerUser } from "../api/auth"
import AuthForm from "../components/AuthForm"

const Register = () => {
  const navigate = useNavigate()

  const handleRegister = async (values: Record<string, string>) => {
    await registerUser({
      username: values.username,
      email: values.email,
      password: values.password,
    })
    alert("Регистрация успешна! Теперь войдите в систему.")
    navigate("/login")
  }

  return (
    <AuthForm
      onSubmit={handleRegister}
      buttonText="Зарегистрироваться"
      fields={[
        { name: "username", placeholder: "Имя пользователя" },
        { name: "email", placeholder: "Email", type: "email" },
        { name: "password", placeholder: "Пароль", type: "password" },
      ]}
    />
  )
}

export default Register
