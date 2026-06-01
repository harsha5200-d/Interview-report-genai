import '../auth.form.scss'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from "../hooks/useAuth"
import React, { useState } from 'react'

const Login = () => {
  const { loading, handleLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(location.state?.message || "")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError("")
    try {
      setSubmitting(true)
      await handleLogin({ email, password })
      navigate("/", { replace: true })
    } catch (error) {
      console.error("Login failed:", error)
      setFormError(error.response?.data?.message || "Login failed. Please check your credentials.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (<main><h1>Loading.......</h1></main>)
  }
  return (
    <main>
      <div className="form-container">

        <h1>Login</h1>

        {formError && (
          <p style={{ color: formError.includes("exists") ? "#0b6e4f" : "#b00020", marginBottom: 12 }}>{formError}</p>
        )}

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label htmlFor="email">Email</label>

            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>

            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className='button primary-button' disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>

        </form>

        <p>
          Don't have an Account?
          <Link to="/register"> Register </Link>
        </p>

      </div>
    </main>
  )
}

export default Login