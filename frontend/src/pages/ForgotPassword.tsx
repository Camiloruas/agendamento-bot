// frontend/src/pages/ForgotPassword.tsx

import React, { useState } from 'react';
import Footer from '../components/Footer';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (!email) {
            setError('Por favor, insira seu email.');
            setLoading(false);
            return;
        }

        try {
            // TODO: Implementar a chamada à API para recuperação de senha
            // await authService.forgotPassword(email);

            // Simulação de sucesso
            setTimeout(() => {
                setMessage('Um link de recuperação foi enviado para seu email.');
                setLoading(false);
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro inesperado.');
            setLoading(false);
        }
    };

    return (
        <>
            <div style={styles.container}>
                <h2 style={styles.title}>Recuperar Senha</h2>
                <p style={styles.description}>
                    Insira seu email e enviaremos um link para redefinir sua senha.
                </p>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            style={styles.input}
                            placeholder="seu@email.com"
                        />
                    </div>
                    {error && <p style={styles.errorMessage}>{error}</p>}
                    {message && <p style={styles.successMessage}>{message}</p>}
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                    </button>
                </form>
                <p style={styles.linkText}>
                    Lembrou sua senha? <a href="/login" style={styles.link}>Voltar ao Login</a>
                </p>
            </div>
            <Footer />
        </>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1f2e',
        padding: '20px',
        paddingBottom: '80px',
        fontFamily: 'Arial, sans-serif',
    },
    title: {
        color: '#ffffff',
        marginBottom: '20px',
        fontSize: '32px',
        fontWeight: 'bold',
    },
    description: {
        color: '#b0b0b0',
        marginBottom: '30px',
        textAlign: 'center' as 'center',
        maxWidth: '400px',
        fontSize: '16px',
    },
    form: {
        backgroundColor: '#141824',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column' as 'column',
        border: 'none',
    },
    formGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        color: '#e0e0e0',
        fontWeight: 'bold',
    },
    input: {
        width: 'calc(100% - 22px)',
        padding: '10px',
        border: '1px solid #2a3142',
        borderRadius: '4px',
        fontSize: '16px',
        backgroundColor: '#1f2533',
        color: '#ffffff',
    },
    button: {
        backgroundColor: '#007bff',
        color: '#fff',
        padding: '12px 20px',
        border: 'none',
        borderRadius: '4px',
        fontSize: '18px',
        cursor: 'pointer',
        marginTop: '20px',
        transition: 'background-color 0.3s ease',
    },
    errorMessage: {
        color: '#ff4444',
        marginTop: '10px',
        textAlign: 'center' as 'center',
        fontSize: '14px',
    },
    successMessage: {
        color: '#4caf50',
        marginTop: '10px',
        textAlign: 'center' as 'center',
        fontSize: '14px',
    },
    linkText: {
        marginTop: '15px',
        color: '#b0b0b0',
    },
    link: {
        color: '#4da6ff',
        textDecoration: 'none',
    },
};

export default ForgotPassword;
