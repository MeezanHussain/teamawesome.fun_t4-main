import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import styles from './Auth.module.css';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', formData);
            if (response.data.success) {
                // The token is automatically handled by the axios interceptor in api.js
                // Redirect to dashboard or home page after successful login
                navigate('/profile');
            }
        } catch (err) {
            if (err.response && err.response.data.error) {
                setError(err.response.data.error.message || 'Login failed');
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>Log in to your account</p>
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.label}>Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>
                    
                    {error && <div className={styles.error}>{error}</div>}
                    
                    <button 
                        type="submit" 
                        className={styles.button}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>
                
                <p className={styles.toggleText}>
                    Don't have an account?{' '}
                    <span 
                        className={styles.toggleLink} 
                        onClick={() => navigate('/signup')}
                    >
                        Sign Up
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Login;