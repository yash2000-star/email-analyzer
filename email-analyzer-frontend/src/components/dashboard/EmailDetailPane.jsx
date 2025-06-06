// src/components/dashboard/EmailDetailPane.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'react-toastify';
import styles from './EmailDetailPane.module.css';
import { FaCheckCircle, FaExclamationCircle, FaHourglassHalf, FaSpinner } from 'react-icons/fa';

// --- Helper function to detect and link URLs ---
const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

const linkify = (text) => {
  if (!text) return '';
  return text.split(urlRegex).map((part, index) => {
    if (urlRegex.test(part)) {
      const href = part.startsWith('www.') ? `http://${part}` : part;
      return <a href={href} key={`link-${index}`} target="_blank" rel="noopener noreferrer" className={styles.linkifiedUrl}>{part}</a>;
    }
    const formattedPart = part.replace(/ {2,}/g, (match) => '\u00a0'.repeat(match.length));
    return <span key={`text-${index}`}>{formattedPart}</span>;
  });
};

// --- Skeleton Component for Detail View ---
const EmailDetailSkeleton = () => (
     <div className={styles.detailPane}>
        <div className={styles.emailHeader}>
            <Skeleton height={30} width="70%" style={{ marginBottom: '18px' }}/>
            <div className={styles.metaLine}> <Skeleton width="45%" height={15} /> <Skeleton width="35%" height={15} /> </div>
        </div>
         <div className={styles.analysisSection}>
             <h3 className={styles.sectionTitle}><Skeleton width={100} height={12} /></h3>
             <Skeleton count={2} style={{ marginBottom: '10px', maxWidth: '95%' }}/>
             <Skeleton width="30%" style={{ margin: '15px 0 10px 0' }}/>
             <Skeleton count={3} width="70%" style={{ marginBottom: '8px' }}/>
             <div className={styles.statusSection}> <Skeleton width={120} height={20} /> <Skeleton width={180} height={35} /> </div>
         </div>
          <div className={styles.emailBody}>
               <h3 className={styles.sectionTitle}><Skeleton width={120} height={12}/></h3>
               <Skeleton count={10} style={{ marginBottom: '6px' }} />
          </div>
     </div>
);

// --- Main Component ---
function EmailDetailPane({ selectedEmailId, onStatusUpdate }) {
    const [emailData, setEmailData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Fetch details effect
    useEffect(() => {
        if (!selectedEmailId) {
            setEmailData(null); setError(null); setLoading(false); return;
        }
        const fetchEmailDetails = async () => {
            setLoading(true); setError(null); setEmailData(null);
            try {
                const response = await axios.get(`/api/emails/${selectedEmailId}/content`);
                setEmailData(response.data); // Set the fetched data
            } catch (err) {
                console.error(`Error fetching details for email ${selectedEmailId}:`, err);
                const errorMsg = err.response?.data?.message || 'Failed to fetch email details.';
                setError(errorMsg);
                 if (err.response?.data?.needsReAuth) {
                    toast.error("Authentication expired. Please log in again.");
                    setTimeout(() => { window.location.href = '/auth/logout'; }, 3000);
                 } else {
                    toast.error(`Error loading email: ${errorMsg}`);
                 }
            } finally {
                setLoading(false); // Ensure loading is set to false
            }
        };
        fetchEmailDetails();
    }, [selectedEmailId]);

    // Status update handler
    const handleUpdateStatus = async (actionPointId, newStatus) => {
        if (!actionPointId || isUpdatingStatus) return;
        setIsUpdatingStatus(true);
        try {
            await axios.patch(`/api/action-points/${actionPointId}/status`, { status: newStatus });
             toast.success(`Status updated to ${newStatus}`);
             if (onStatusUpdate) onStatusUpdate();
             // Update local state directly after success
             if (emailData && emailData.analysis) {
                setEmailData(prevData => ({
                    ...prevData,
                    analysis: { ...prevData.analysis, status: newStatus }
                 }));
             }
        } catch (err) {
            console.error(`Error updating status for ${actionPointId}:`, err);
            const errorMsg = err.response?.data?.message || 'Failed to update status.';
            toast.error(`Update Error: ${errorMsg}`);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Status display helper
    const getStatusInfo = (status) => {
        switch (status) {
            case 'done': return { icon: <FaCheckCircle />, color: 'var(--color-green-done)', text: 'Done' };
            case 'dismissed': return { icon: <FaExclamationCircle />, color: 'var(--text-light-secondary)', text: 'Dismissed' };
            case 'pending': default: return { icon: <FaHourglassHalf />, color: 'var(--color-yellow-pending)', text: 'Pending' };
        }
    };

    // ======================================================
    // --- RENDER LOGIC --- (Checks in correct order now) ---
    // ======================================================

    // 1. Handle case where no email is selected yet
    if (!selectedEmailId) {
        return <div className={styles.detailPane}><div className={styles.placeholder}>Select an email from the list to view its details and AI analysis.</div></div>;
    }

    // 2. Handle loading state -> Show Skeleton
    if (loading) {
        return (
             <SkeletonTheme baseColor="#2d2d2d" highlightColor="#3a3a3a">
                 <EmailDetailSkeleton />
             </SkeletonTheme>
        );
    }

    // 3. Handle error state (if fetch failed)
    if (error) {
        return (
            <div className={styles.detailPane}>
                <div className={styles.emailHeader}>
                     <h2 className={styles.subject}>Error Loading Email</h2>
                </div>
                <div className={`${styles.placeholder} ${styles.error}`}>
                    <FaExclamationCircle style={{ marginRight: '10px', fontSize: '1.2em' }} />
                    {error}
                </div>
            </div>
        );
    }

    // 4. Handle edge case where data is still null/undefined AFTER loading/no error
    //    This is the crucial check to prevent the destructuring error.
    if (!emailData) {
        console.warn("EmailDetailPane rendering, but emailData is null/undefined after load/error checks.");
        return <div className={styles.detailPane}><div className={styles.placeholder}>Could not load email data. Please select another email or refresh.</div></div>;
    }

    // 5. --- If all checks above passed, THEN destructure and render ---
    const { originalEmail, analysis } = emailData; // Destructuring is safe now
    const sanitizedHtmlBody = originalEmail?.bodyType === 'text/html' ? DOMPurify.sanitize(originalEmail.body) : null;
    const statusInfo = getStatusInfo(analysis?.status);

    return (
        <div className={styles.detailPane}>
            {/* --- Email Header --- */}
            <div className={styles.emailHeader}>
                <h2 className={styles.subject}>{originalEmail?.subject || '(No Subject)'}</h2>
                <div className={styles.metaLine}>
                    <span className={styles.from}><strong>From:</strong> {originalEmail?.from || 'N/A'}</span>
                    <span className={styles.date}><strong>Date:</strong> {originalEmail?.date ? new Date(originalEmail.date).toLocaleString() : 'N/A'}</span>
                </div>
            </div>

             {/* --- AI Analysis Section --- */}
            {analysis && (
                <div className={styles.analysisSection}>
                    <h3 className={styles.sectionTitle}>AI Analysis</h3>
                    {analysis.summary && ( <p className={styles.summary}>{analysis.summary}</p> )}
                    {analysis.actionPoints && analysis.actionPoints.length > 0 && (
                        <>
                            <strong className={styles.actionListLabel}>Action Points:</strong>
                            <ul className={styles.actionList}>
                                {analysis.actionPoints.map((point, index) => ( <li key={index}>{point}</li> ))}
                            </ul>
                        </>
                    )}
                    {(!analysis.actionPoints || analysis.actionPoints.length === 0) && !analysis.summary && (
                        <p className={styles.noAnalysisMessage}>No specific summary or action points were identified by the AI for this email.</p>
                    )}
                     <div className={styles.statusSection}>
                         <span className={styles.statusLabel} style={{ color: statusInfo.color }}> {statusInfo.icon} Status: {statusInfo.text} </span>
                         <div className={styles.buttonGroup}>
                             {analysis._id && analysis.status !== 'done' && (
                                <button onClick={() => handleUpdateStatus(analysis._id, 'done')} className={`${styles.button} ${styles.doneButton}`} disabled={isUpdatingStatus}>
                                    {isUpdatingStatus ? <FaSpinner className={styles.spinner} /> : 'Mark Done'}
                                </button>
                             )}
                             {analysis._id && analysis.status !== 'pending' && (
                                 <button onClick={() => handleUpdateStatus(analysis._id, 'pending')} className={`${styles.button} ${styles.pendingButton}`} disabled={isUpdatingStatus}>
                                     {isUpdatingStatus ? <FaSpinner className={styles.spinner} /> : 'Mark Pending'}
                                 </button>
                             )}
                         </div>
                     </div>
                </div>
            )}
            {!analysis && ( <div className={styles.analysisSection}> <h3 className={styles.sectionTitle}>AI Analysis</h3> <p className={styles.noAnalysisMessage}>AI analysis data not available.</p> </div> )}

            {/* --- Original Email Body Section --- */}
            <div className={styles.emailBody}>
                 <h3 className={styles.sectionTitle}>Original Email</h3>
                 {originalEmail?.bodyType === 'text/html' && sanitizedHtmlBody && ( <div className={styles.htmlBodyContainer} dangerouslySetInnerHTML={{ __html: sanitizedHtmlBody }} /> )}
                 {originalEmail?.bodyType === 'text/plain' && originalEmail.body && (
                    <div className={styles.plainBodyContainer}>
                        {originalEmail.body.split('\n').map((line, index) => ( <div key={`line-${index}`} className={styles.plainBodyLine}> {linkify(line) || '\u00A0'} </div> ))}
                    </div>
                 )}
                 {!originalEmail?.body && ( <p className={styles.placeholder}>(No body content)</p> )}
            </div>
        </div>
    );
}

export default EmailDetailPane;