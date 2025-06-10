// File: email-analyzer-frontend/src/components/dashboard/EmailListPane.jsx
// --- FINAL LAYOUT FIX: ADDED A SPACER HEADER FOR ALIGNMENT ---

import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import styles from './EmailListPane.module.css';

// Helper function to format date/time
const formatEmailDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Helper function to generate initials from the 'sender' field
const getInitials = (sender) => {
    if (!sender) return '?';
    const namePart = sender.split('<')[0].trim();
    const words = namePart.replace(/[^a-zA-Z ]/g, "").split(' ').filter(Boolean);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
        return words[0][0].toUpperCase();
    }
    return sender[0]?.toUpperCase() || '?';
};

// Helper function to get a deterministic color class
const getAvatarColorClass = (senderName) => {
  let hash = 0;
  if (senderName.length === 0) return styles.avatarColor1;
  for (let i = 0; i < senderName.length; i++) {
    hash = senderName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % 5) + 1;
  return styles[`avatarColor${index}`];
};

// Skeleton Component for Email List Item
const EmailListItemSkeleton = () => (
    <div className={styles.emailItem}>
      <div className={styles.avatarPlaceholder} style={{backgroundColor: 'transparent'}}>
        <Skeleton circle width={40} height={40} />
      </div>
      <div className={styles.textContent}>
        <div className={styles.metaRow}>
          <Skeleton width={150} />
          <Skeleton width={60} />
        </div>
        <Skeleton count={2} />
      </div>
    </div>
);

// Component to render a single email item
const EmailItem = ({ email, onSelectEmail, isSelected }) => {
  const isUnread = !email.isRead;
  const senderName = email.sender.split('<')[0].trim();

  return (
    <div
      className={`
        ${styles.emailItem}
        ${isSelected ? styles.selected : ''}
        ${isUnread ? styles.unread : ''}
      `}
      onClick={() => onSelectEmail(email)}
    >
      <div className={`${styles.avatarPlaceholder} ${getAvatarColorClass(senderName)}`}>
        {getInitials(email.sender)}
      </div>
      <div className={styles.textContent}>
        <div className={styles.metaRow}>
          <div className={styles.sender}>{senderName}</div>
          <div className={styles.date}>{formatEmailDate(email.receivedAt)}</div>
        </div>
        <div className={styles.subject}>{email.subject || '(No Subject)'}</div>
        <div className={styles.snippet}>{email.snippet}</div>
      </div>
    </div>
  );
};


function EmailListPane({ emails, isLoading, error, onSelectEmail, selectedEmailId }) {
    return (
        <SkeletonTheme baseColor="#1E1E1E" highlightColor="#2a2a2e">
            <div className={styles.listPane}>
                {/* THIS IS THE NEW SPACER HEADER. It's empty but provides alignment. */}
                <div className={styles.listHeader}></div>

                <div className={styles.emailList}>
                    {isLoading && Array.from({ length: 10 }).map((_, index) => <EmailListItemSkeleton key={`skeleton-${index}`} />)}
                    {!isLoading && error && <div className={styles.errorState}>{error}</div>}
                    {!isLoading && !error && emails.length === 0 && (
                         <div className={styles.emptyState}>No emails found in your inbox.</div>
                    )}
                    {!isLoading && !error && emails.map(email => (
                        <EmailItem
                            key={email._id}
                            email={email}
                            onSelectEmail={onSelectEmail}
                            isSelected={selectedEmailId === email._id}
                        />
                     ))}
                </div>
            </div>
        </SkeletonTheme>
    );
}

export default EmailListPane;