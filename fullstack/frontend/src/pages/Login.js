import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Navbar from '../Components/Navbar';
import { API_BASE_URL } from '../api';
import getEmailValidationError from '../utils/emailValidation';

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [loginMethod, setLoginMethod] = useState('email');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const isMobileLogin = loginMethod === 'mobile';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (isMobileLogin && !/^\d{10}$/.test(identifier.trim())) {
      setError('Enter a 10-digit mobile number.');
      return;
    }
    if (!isMobileLogin && getEmailValidationError(identifier)) {
      setError(getEmailValidationError(identifier));
      return;
    }

    const payload = isMobileLogin
      ? { mobile: `+91${identifier.trim()}`, password }
      : { email: identifier.trim().toLowerCase(), password };

    if (isMobileLogin && !otpSent) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(otp);
      setOtpSent(true);
      return;
    }

    if (isMobileLogin && verificationCode !== generatedOtp) {
      setError('The OTP is incorrect.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('vastraToken', data.token);
      dispatch({ type: 'LOGIN_USER', payload: data.user });
      navigate(location.state?.from || (data.user.isAdmin ? '/admin' : '/'));
    } catch (submitError) {
      setError(submitError.message || 'Unable to log in.');
    }
  };

  return (
    <>
      <Navbar />
      <main className="auth-page container py-5">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1 className="page-title">Welcome back</h1>
          <p className="text-muted">Sign in to view your orders and continue shopping.</p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="auth-method-toggle" role="group" aria-label="Login method">
            <button type="button" className={loginMethod === 'email' ? 'active' : ''} onClick={() => { setLoginMethod('email'); setIdentifier(''); setOtpSent(false); setVerificationCode(''); setError(''); }}>Email</button>
            <button type="button" className={loginMethod === 'mobile' ? 'active' : ''} onClick={() => { setLoginMethod('mobile'); setIdentifier(''); setPassword(''); setOtpSent(false); setVerificationCode(''); setError(''); }}>Mobile number</button>
          </div>
          <label htmlFor="login-identifier">{loginMethod === 'mobile' ? 'Mobile number' : 'Email address'}</label>
          {isMobileLogin ? (
            <div className="input-group">
              <span className="input-group-text">+91</span>
              <input id="login-identifier" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" value={identifier} onChange={(event) => { setIdentifier(event.target.value.replace(/\D/g, '').slice(0, 10)); setOtpSent(false); setVerificationCode(''); }} required />
            </div>
          ) : (
            <input id="login-identifier" type="email" pattern="[^@ ]+@[^@ ]+\.[A-Za-z]{2,}" value={identifier} onChange={(event) => { setIdentifier(event.target.value); setOtpSent(false); setVerificationCode(''); }} required />
          )}
          {otpSent ? (
            <>
              <p className="auth-otp-demo">Demo OTP: <strong>{generatedOtp}</strong></p>
              <label htmlFor="login-otp">Enter OTP</label>
              <input id="login-otp" type="text" inputMode="numeric" maxLength="6" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} required />
            </>
          ) : !isMobileLogin ? (
            <>
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </>
          ) : null}
          <button className="btn btn-dark w-100 mt-4" type="submit">
            {isMobileLogin ? (otpSent ? 'Verify OTP' : 'Send OTP') : 'Login'}
          </button>
          <p className="auth-footer">New customer? <Link to="/signup">Create an account</Link></p>
        </form>
      </main>
    </>
  );
}

export default Login;