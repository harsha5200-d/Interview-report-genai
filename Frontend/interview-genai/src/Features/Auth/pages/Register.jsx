import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Register = () => {

  const navigate = useNavigate()
  const { loading, handleRegister } = useAuth()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError("")

    try {
      setSubmitting(true)
      await handleRegister({ username, email, password })
      navigate("/", { replace: true })
    } catch (error) {
      console.error("Registration failed:", error)
      const message = error.response?.data?.message || "Registration failed."
      if (message.toLowerCase().includes("already exists")) {
        navigate("/login", { replace: true, state: { message: "Account already exists. Please log in." } })
        return
      }
      setFormError(message)
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

        <h1>Register</h1>

        {formError && (
          <p style={{ color: "#b00020", marginBottom: 12 }}>{formError}</p>
        )}

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label htmlFor="username">Username</label>

            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

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
            {submitting ? "Creating account..." : "Register"}
          </button>

        </form>

        <p>
          Already have an Account?
          <Link to="/login"> Login </Link>
        </p>

      </div>
    </main>
  )
}

export default Register