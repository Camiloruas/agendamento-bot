// frontend/src/components/Footer.tsx

import React from 'react';

const Footer: React.FC = () => {
    // Função para obter o ano atual automaticamente
    const getCurrentYear = (): number => {
        return new Date().getFullYear();
    };

    return (
        <footer style={styles.footer}>
            <p style={styles.text}>
                Developed by Camilo Ruas | © {getCurrentYear()}
            </p>
        </footer>
    );
};

const styles = {
    footer: {
        backgroundColor: '#141824',
        color: '#ffffff',
        textAlign: 'center' as 'center',
        padding: '20px',
        position: 'fixed' as 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
    },
    text: {
        margin: 0,
        fontSize: '14px',
        fontWeight: 500,
    },
};

export default Footer;
