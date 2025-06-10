// src/components/dashboard/EmailDetailPane.jsx
// --- FINAL CORRECTED VERSION 3/3 ---

import React from 'react';
import DOMPurify from 'dompurify';
import api from '../../utils/api';
import styles from './EmailDetailPane.module.css';
import {
  FaStar, FaRegStar, FaLightbulb, FaTasks, FaSmile, FaMeh,
  FaFrown, FaTag, FaEnvelopeOpenText, FaSignOutAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AIInsightCard = ({ icon, title, children }) => (
  <div className={styles.aiCard}>
    <div className={styles.aiCardHeader}>
      {icon}
      <h4>{title}</h4>
    </div>
    <div className={styles.aiCardContent}>
      {children}
    </div>
  </div>
);

// This component is now much simpler. It just receives props.
function EmailDetailPane({ selectedEmail, onUpdateEmail, userName, isUserLoading }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.get('/auth/logout');
      navigate('/login');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleToggleStar = async () => {
    if (!selectedEmail) return;
    const newStarredStatus = !selectedEmail.isStarred;
    try {
      onUpdateEmail({ ...selectedEmail, isStarred: newStarredStatus });
      await api.patch(`/emails/${selectedEmail._id}/star`, { isStarred: newStarredStatus });
    } catch (error) {
      console.error("Failed to update star status:", error);
      onUpdateEmail({ ...selectedEmail, isStarred: !newStarredStatus });
    }
  };

  const getSentimentUI = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return { icon: <FaSmile />, className: styles.sentimentPositive };
      case 'negative': return { icon: <FaFrown />, className: styles.sentimentNegative };
      default: return { icon: <FaMeh />, className: styles.sentimentNeutral };
    }
  };

  const renderEmailContent = () => {
    if (!selectedEmail) {
      return (
        <div className={styles.placeholderContainer}>
          <FaEnvelopeOpenText size={60} className={styles.placeholderIcon} />
          <h2>Select an email</h2>
          <p>Choose an email from the list to see its details and AI analysis.</p>
        </div>
      );
    }

    const {
      subject, sender, receivedAt, body, isStarred,
      aiSummary, aiCategory, aiSentiment, aiActionPoints
    } = selectedEmail;

    const sanitizedHtmlBody = DOMPurify.sanitize(body);
    const sentimentUI = getSentimentUI(aiSentiment);

    return (
      <>
        <header className={styles.emailHeader}>
          <div className={styles.subjectLine}>
            <h2 className={styles.subject}>{subject}</h2>
            <button onClick={handleToggleStar} className={styles.starButton}>
              {isStarred
                ? <FaStar size={22} color="#f1c40f" />
                : <FaRegStar size={22} />
              }
            </button>
          </div>
          <div className={styles.metaLine}>
            <span className={styles.sender}><strong>From:</strong> {sender}</span>
            <span className={styles.date}>{new Date(receivedAt).toLocaleString()}</span>
          </div>
        </header>

        <section className={styles.analysisSection}>
          <h3 className={styles.sectionHeader}>AI Compass</h3>
          <div className={styles.aiGrid}>
            <div className={styles.summaryAndActions}>
              {aiSummary && (
                <AIInsightCard icon={<FaLightbulb />} title="AI Summary">
                  <p>{aiSummary}</p>
                </AIInsightCard>
              )}
              {aiActionPoints && aiActionPoints.length > 0 && aiActionPoints[0].toLowerCase() !== 'none' && (
                <AIInsightCard icon={<FaTasks />} title="Action Items">
                  <ul className={styles.actionList}>
                    {aiActionPoints.map((point, index) => <li key={index}>{point}</li>)}
                  </ul>
                </AIInsightCard>
              )}
            </div>
            <div className={styles.metaCards}>
              <AIInsightCard icon={<FaTag />} title="Category">
                <span className={`${styles.tag} ${styles.categoryTag}`}>
                  {aiCategory || 'Unknown'}
                </span>
              </AIInsightCard>
              <AIInsightCard icon={sentimentUI.icon} title="Sentiment">
                <span className={`${styles.tag} ${sentimentUI.className}`}>
                  {aiSentiment || 'Unknown'}
                </span>
              </AIInsightCard>
            </div>
          </div>
        </section>

        <section className={styles.emailBody}>
          <h3 className={styles.sectionHeader}>Original Message</h3>
          <div
            className={styles.bodyContainer}
            dangerouslySetInnerHTML={{ __html: sanitizedHtmlBody }}
          />
        </section>
      </>
    );
  };

  return (
    <div className={styles.detailPane}>
      <div className={styles.detailHeader}>
        <input type="search" placeholder="Search all emails..." className={styles.globalSearchBar} />
        <div className={styles.userProfile} onClick={handleLogout} title="Logout">
          <div className={styles.userAvatar}>
            {isUserLoading ? '' : (userName ? userName.charAt(0).toUpperCase() : '?')}
          </div>
          <span>{isUserLoading ? 'Loading...' : userName}</span>
          <FaSignOutAlt style={{ marginLeft: '8px' }}/>
        </div>
      </div>
      
      <div className={styles.contentWrapper}>
        {renderEmailContent()}
      </div>
    </div>
  );
}

export default EmailDetailPane;