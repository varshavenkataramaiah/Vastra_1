import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Navbar from '../Components/Navbar';
import { API_BASE_URL } from '../api';
import getEmailValidationError from '../utils/emailValidation';

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [registrationMethod, setRegistrationMethod] = useState('email');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    const mobile = form.mobile.trim();
    setError('');

    const emailValidationError = registrationMethod === 'email' ? getEmailValidationError(email) : '';
    if (emailValidationError) {
      setError(emailValidationError);
      return;
    }
    if (registrationMethod === 'mobile' && !/^\d{10}$/.test(mobile)) {
      setError('Enter a 10-digit mobile number.');
      return;
    }

    if (registrationMethod === 'mobile' && !otpSent) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedOtp(otp);
      setOtpSent(true);
      return;
    }

    if (registrationMethod === 'mobile' && verificationCode !== generatedOtp) {
      setError('The OTP is incorrect.');
      return;
    }

    if (registrationMethod === 'email' && form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (registrationMethod === 'email' && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        email: registrationMethod === 'email' ? email : '',
        mobile: registrationMethod === 'mobile' ? `+91${mobile}` : '',
        password: registrationMethod === 'email' ? form.password : '',
      };

      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('vastraToken', data.token);
      dispatch({ type: 'LOGIN_USER', payload: data.user });
      navigate('/');
    } catch (submitError) {
      setError(submitError.message || 'Unable to create account.');
    }
  };

  return (
    <>
      <Navbar />
      <main className="auth-page container py-5">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1 className="page-title">Create your account</h1>
          <p className="text-muted">Join Vastra to keep track of your orders.</p>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="auth-method-toggle" role="group" aria-label="Registration method">
            <button type="button" className={registrationMethod === 'email' ? 'active' : ''} onClick={() => { setRegistrationMethod('email'); setOtpSent(false); setVerificationCode(''); }}>Email</button>
            <button type="button" className={registrationMethod === 'mobile' ? 'active' : ''} onClick={() => { setRegistrationMethod('mobile'); setOtpSent(false); setVerificationCode(''); }}>Mobile number</button>
          </div>
          <label htmlFor="signup-name">Full name</label>
          <input id="signup-name" name="name" type="text" value={form.name} onChange={updateField} required />
          {registrationMethod === 'email' ? (
            <>
              <label htmlFor="signup-email">Email address</label>
              <input id="signup-email" name="email" type="email" pattern="[^@ ]+@[^@ ]+\.[A-Za-z]{2,}" value={form.email} onChange={updateField} required />
            </>
          ) : (
            <>
              <label htmlFor="signup-mobile">Mobile number</label>
              <div className="input-group">
                <span className="input-group-text">+91</span>
                <input id="signup-mobile" name="mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" value={form.mobile} onChange={(event) => { setForm({ ...form, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) }); setOtpSent(false); setVerificationCode(''); }} required />
              </div>
            </>
          )}
          {registrationMethod === 'mobile' && otpSent && (
            <>
              <p className="auth-otp-demo">Demo OTP: <strong>{generatedOtp}</strong></p>
              <label htmlFor="signup-otp">Enter OTP</label>
              <input id="signup-otp" type="text" inputMode="numeric" maxLength="6" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value)} required />
            </>
          )}
          {registrationMethod === 'email' && (
            <>
              <label htmlFor="signup-password">Password</label>
              <input id="signup-password" name="password" type="password" value={form.password} onChange={updateField} required />
              <label htmlFor="signup-confirm-password">Confirm password</label>
              <input id="signup-confirm-password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} required />
            </>
          )}
          <button className="btn btn-dark w-100 mt-4" type="submit">
            {registrationMethod === 'mobile' ? (otpSent ? 'Verify OTP' : 'Send OTP') : 'Create account'}
          </button>
          <p className="auth-footer">Already have an account? <Link to="/login">Login</Link></p>
        </form>
      </main>
    </>
  );
}

export default Signup;