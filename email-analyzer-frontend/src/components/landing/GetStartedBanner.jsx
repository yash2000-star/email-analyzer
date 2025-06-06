
// src/components/landing/GetStartedBanner.jsx
import React from 'react';
import styles from './GetStartedBanner.module.css';
import { FaArrowRight } from 'react-icons/fa';

// --- Ensure these imports are correct and files exist ---
import image1 from '../../assets/landing-bg-1.jpg';
import image2 from '../../assets/landing-bg-2.jpg';
import image3 from '../../assets/landing-bg-3.jpg';
import image4 from '../../assets/landing-bg-4.jpg';
// --- ---

function GetStartedBanner() {
    const handleLogin = () => {
        window.location.href = '/auth/google';
    };

    return (
        // Section needs relative positioning
        <section className={styles.bannerSection}>
            {/* Put the image tags BACK inside this div */}
            <div className={styles.imageRow}>
                <img src={image1} alt="Abstract background 1" className={styles.backgroundImage} />
                <img src={image2} alt="Abstract background 2" className={styles.backgroundImage} />
                <img src={image3} alt="Abstract background 3" className={styles.backgroundImage} />
                <img src={image4} alt="Abstract background 4" className={styles.backgroundImage} />
            </div>
            {/* Button container remains below images in the HTML structure */}
            <div className={styles.buttonContainer}>
                <button onClick={handleLogin} className={styles.bannerButton}>
                    <span className={styles.buttonText}>Get Started with Google</span>
                    <FaArrowRight className={styles.arrowIcon} />
                </button>
            </div>
        </section>
    );
}

export default GetStartedBanner;