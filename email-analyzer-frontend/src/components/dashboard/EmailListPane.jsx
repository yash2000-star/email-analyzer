// src/components/dashboard/EmailListPane.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'; // Import Skeleton components
import 'react-loading-skeleton/dist/skeleton.css'; // Import default skeleton CSS
import styles from './EmailListPane.module.css';

// --- Helper function to format date/time ---
const formatEmailDate = (dateString) => {
     if (!dateString) return '';
     const date = new Date(dateString);
     // Basic check if date is valid
     if (isNaN(date.getTime())) return '';

     const now = new Date();
     const isToday = date.toDateString() === now.toDateString();

     if (isToday) {
         // Format as H:MM AM/PM
         return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
     } else {
         // Format as Month Day (e.g., Apr 30)
         return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
     }
};

// --- Skeleton Component for Email List Item ---
const EmailListItemSkeleton = () => (
    // Use the specific skeleton class for padding etc.
    <div className={styles.emailItemSkeleton}>
        <div className={styles.metaRow}>
            {/* Define skeleton shapes matching content */}
            <Skeleton width={120} height={14} inline={true} style={{ marginRight: 'auto' }}/> {/* Sender Skeleton */}
            <Skeleton width={50} height={12} inline={true} />  {/* Date Skeleton */}
        </div>
        {/* Subject Skeleton */}
        <Skeleton height={14} style={{ marginBottom: '6px', maxWidth: '90%' }} />
        {/* Snippet Skeleton */}
        <Skeleton height={12} style={{ maxWidth: '80%' }}/>
        {/* Tags Skeleton (Optional) */}
        {/* <Skeleton width={70} height={18} style={{ marginTop: '8px' }} /> */}
    </div>
);


function EmailListPane({ selectedFilter, onSelectEmail, selectedEmailId, refreshTrigger }) {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false); // State to control loading display
    const [error, setError] = useState(null);

    // Effect to fetch emails when filter or trigger changes
    useEffect(() => {
        // Don't fetch if filter isn't set yet
        if (!selectedFilter || !selectedFilter.value) {
             setEmails([]);
             setLoading(false); // Ensure loading is false if no filter
             return;
        }

        const fetchEmails = async () => {
            setLoading(true); // Set loading true at the start
            setError(null);
            setEmails([]); // Clear previous emails

            let apiUrl = '';
            // Determine API URL based on filter type
            if (selectedFilter.type === 'date') {
                apiUrl = `/api/processed-emails?date=${selectedFilter.value}`;
            } else if (selectedFilter.type === 'category') {
                // Placeholder for category filtering
                setError(`Filtering by category "${selectedFilter.value}" not implemented yet.`);
                setLoading(false); // Stop loading if filter not implemented
                return;
            } else {
                 setError("Invalid filter type.");
                 setLoading(false); // Stop loading on invalid filter
                 return;
            }

            // Perform the API call
            try {
                console.log(`Fetching emails from: ${apiUrl}`);
                const response = await axios.get(apiUrl);
                setEmails(response.data); // Set emails on success
            } catch (err) {
                console.error(`Error fetching emails for filter ${JSON.stringify(selectedFilter)}:`, err);
                setError(err.response?.data?.message || 'Failed to fetch emails.'); // Set error message
            } finally {
                setLoading(false); // Set loading false when done (success or error)
            }
        };

        fetchEmails();
    }, [selectedFilter, refreshTrigger]); // Dependencies: run when filter or trigger changes


    // Helper to get tag style based on status
    const getTagClass = (status) => {
        switch (status) {
            case 'done': return styles.tagDone;
            case 'dismissed': return styles.tagDismissed;
            case 'pending':
            default: return styles.tagPending;
        }
    };

    // --- Render Component ---
    return (
        // Wrap with SkeletonTheme for consistent dark mode appearance
        <SkeletonTheme baseColor="#2d2d2d" highlightColor="#3a3a3a">
            <div className={styles.listPane}>
                {/* Header with Search Bar */}
                <div className={styles.listHeader}>
                     <input type="search" placeholder="Search emails..." className={styles.searchBar} disabled/>
                </div>

                {/* Display Error Message if exists */}
                {error && <div className={styles.error}>{error}</div>}

                {/* Email List Area */}
                <div className={styles.emailList}>
                    {/* --- Loading State: Show Skeletons --- */}
                    {loading && !error && (
                        // Create an array of N elements and map over it to render skeletons
                        Array.from({ length: 10 }).map((_, index) => (
                           <EmailListItemSkeleton key={`skeleton-${index}`} />
                        ))
                    )}

                    {/* --- No Emails Found State --- */}
                    {!loading && !error && emails.length === 0 && (
                         <div className={styles.noEmails}>No emails found for this selection.</div>
                    )}

                    {/* --- Loaded State: Show Real Email Items --- */}
                    {!loading && !error && emails.map(email => (
                         <div
                            key={email._id} // Use ActionPoint document ID as the key
                            className={`${styles.emailItem} ${selectedEmailId === email.emailId ? styles.selected : ''}`}
                            onClick={() => onSelectEmail(email.emailId)} // Pass Gmail ID to parent on click
                        >
                            {/* Row for Sender and Date */}
                            <div className={styles.metaRow}>
                                <div className={styles.sender}>{email.emailSender || 'Unknown'}</div>
                                <div className={styles.date}>{formatEmailDate(email.emailDate)}</div>
                            </div>
                            {/* Subject */}
                            <div className={styles.subject}>{email.emailSubject || '(No Subject)'}</div>
                            {/* Snippet */}
                            <div className={styles.snippet}>{email.emailSnippet}</div>
                            {/* Tags Area */}
                            <div className={styles.tags}>
                                {/* Status Tag */}
                                <span className={`${styles.tag} ${getTagClass(email.status)}`}>
                                    {email.status || 'pending'}
                                </span>
                                {/* Placeholder for other tags */}
                            </div>
                        </div>
                     ))}
                </div> {/* End of emailList div */}
            </div> {/* End of listPane div */}
        </SkeletonTheme>
    );
}

export default EmailListPane;