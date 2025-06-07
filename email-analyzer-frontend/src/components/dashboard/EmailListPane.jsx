// src/components/dashboard/EmailListPane.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import axios from 'axios';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import styles from './EmailListPane.module.css';

// --- Helper function to format date/time (keep as is) ---
const formatEmailDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};

// --- Helper function to generate initials (keep as is) ---
const getInitials = (sender) => {
    if (!sender) return '?';
    const parts = sender.split(/[ <@]/);
    const namePart = parts[0];
    if (namePart.includes('.')) {
      const nameSegments = namePart.split('.');
      return nameSegments.map(s => s[0]).join('').toUpperCase().slice(0,2);
    }
    const words = namePart.split(' ').filter(Boolean);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
        return words[0][0].toUpperCase();
    }
    return sender[0]?.toUpperCase() || '?';
};

// --- Skeleton Component for Email List Item (keep as is) ---
const EmailListItemSkeleton = () => (
    <div className={styles.emailItemSkeleton}>
        <div className={styles.metaRow}>
            <Skeleton width={120} height={14} inline={true} style={{ marginRight: 'auto' }}/>
            <Skeleton width={50} height={12} inline={true} />
        </div>
        <Skeleton height={14} style={{ marginBottom: '6px', maxWidth: '90%' }} />
        <Skeleton height={12} style={{ maxWidth: '80%' }}/>
    </div>
);

function EmailListPane({ selectedFilter, onSelectEmail, selectedEmailId, refreshTrigger }) {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Effect to fetch emails (Your existing logic - no changes needed here)
    useEffect(() => {
        if (!selectedFilter || !selectedFilter.value) {
             setEmails([]);
             setLoading(false);
             return;
        }
        const fetchEmails = async () => {
            setLoading(true);
            setError(null);
            // setEmails([]); // Clear previous emails *before* fetching new ones
            try {
                console.log(`Fetching emails from: /api/processed-emails?date=${selectedFilter.value}`);
                const response = await axios.get(`/api/processed-emails?date=${selectedFilter.value}`);
                setEmails(response.data || []); // Ensure emails is always an array
            } catch (err) {
                console.error(`Error fetching emails for filter ${JSON.stringify(selectedFilter)}:`, err);
                setError(err.response?.data?.message || 'Failed to fetch emails.');
                setEmails([]); // Clear emails on error
            } finally {
                setLoading(false);
            }
        };
        fetchEmails();
    }, [selectedFilter, refreshTrigger]);


    const getTagClass = (status) => {
        switch (status) {
            case 'done': return styles.tagDone;
            case 'dismissed': return styles.tagDismissed;
            case 'pending':
            default: return styles.tagPending;
        }
    };

    // --- NEW FUNCTION TO HANDLE EMAIL CLICK ---
    const handleEmailItemClick = useCallback((clickedEmailId) => {
        // 1. Call the original onSelectEmail prop to update the parent's selectedEmailId
        //    This is crucial for EmailDetailPane to work.
        if (onSelectEmail) {
            onSelectEmail(clickedEmailId);
        }

        // 2. Update the local 'isRead' status for the clicked email
        const emailIndex = emails.findIndex(e => e.emailId === clickedEmailId);

        // If the email exists in the current list and was unread
        if (emailIndex !== -1 && emails[emailIndex].isRead === false) {
            const updatedEmails = emails.map((email, index) =>
                index === emailIndex ? { ...email, isRead: true } : email
            );
            setEmails(updatedEmails); // Update the local 'emails' state

            // TODO LATER: Call backend API to persist this change
            // console.log(`Frontend: Email ${clickedEmailId} marked as read locally.`);
            // markEmailAsReadOnBackend(clickedEmailId);
        }
    }, [emails, onSelectEmail]); // Dependencies: `emails` array and `onSelectEmail` prop

    return (
        <SkeletonTheme baseColor="#2d2d2d" highlightColor="#3a3a3a">
            <div className={styles.listPane}>
                <div className={styles.listHeader}>
                     <input type="search" placeholder="Search emails..." className={styles.searchBar} disabled/>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.emailList}>
                    {loading && !error && (
                        Array.from({ length: 10 }).map((_, index) => (
                           <EmailListItemSkeleton key={`skeleton-${index}`} />
                        ))
                    )}

                    {!loading && !error && emails.length === 0 && (
                         <div className={styles.noEmails}>No emails found for this selection.</div>
                    )}

                    {!loading && !error && emails.map(email => {
                         const isUnread = email.isRead === false;

                         return (
                             <div
                                key={email._id || email.emailId} // Use _id from ActionPoint or emailId
                                className={`
                                    ${styles.emailItem}
                                    ${selectedEmailId === email.emailId ? styles.selected : ''}
                                    ${isUnread ? styles.unread : ''}
                                `}
                                // *** Call the new handleEmailItemClick handler ***
                                onClick={() => handleEmailItemClick(email.emailId)}
                            >
                                <div className={styles.emailItemContent}>
                                    <div className={styles.avatarPlaceholder}>
                                        {getInitials(email.emailSender)}
                                    </div>
                                    <div className={styles.textContent}>
                                        <div className={styles.metaRow}>
                                            <div className={styles.sender}>{email.emailSender || 'Unknown Sender'}</div>
                                            <div className={styles.date}>{formatEmailDate(email.emailDate)}</div>
                                        </div>
                                        <div className={styles.subject}>{email.emailSubject || '(No Subject)'}</div>
                                        {email.emailSnippet && (
                                            <div className={styles.snippet}>{email.emailSnippet}</div>
                                        )}
                                    </div>
                                </div>
                                {email.status && (
                                    <div className={styles.tags}>
                                        <span className={`${styles.tag} ${getTagClass(email.status)}`}>
                                            {email.status || 'pending'}
                                        </span>
                                    </div>
                                )}
                            </div>
                         );
                     })}
                </div>
            </div>
        </SkeletonTheme>
    );
}

export default EmailListPane;