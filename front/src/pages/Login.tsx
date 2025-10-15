import { useNavigate } from "react-router-dom"
import { loginUser } from "../api/auth"
import AuthForm from "../components/AuthForm"

const Login = () => {
  const navigate = useNavigate()

  const handleLogin = async (values: Record<string, string>) => {
    const res = await loginUser({
      username: values.username,
      password: values.password,
    })
    localStorage.setItem("token", res.access_token)
    alert("Вы вошли в систему!")
    navigate("/")
  }

  return (
    <AuthForm
      onSubmit={handleLogin}
      buttonText="Войти"
      fields={[
        { name: "username", placeholder: "Имя пользователя" },
        { name: "password", placeholder: "Пароль", type: "password" },
      ]}
    />
  )
}

export default Login
