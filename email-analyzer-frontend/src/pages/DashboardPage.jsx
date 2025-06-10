// src/pages/DashboardPage.jsx
// --- FINAL FEATURE: DYNAMIC AI CATEGORIES ---

import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import EmailListPane from '../components/dashboard/EmailListPane';
import EmailDetailPane from '../components/dashboard/EmailDetailPane';
import styles from './DashboardPage.module.css';
import api from '../utils/api';

function DashboardPage() {
    const { userName, isUserLoading } = useOutletContext();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeView, setActiveView] = useState('inbox');
    const [emails, setEmails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEmail, setSelectedEmail] = useState(null);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                setIsLoading(true);
                const response = await api.get('/emails');
                setEmails(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch emails:", err);
                setError('Failed to load your inbox. Please try refreshing the page.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchEmails();
    }, []);

    // --- NEW: Automatically find all unique categories from the email list ---
    const uniqueCategories = useMemo(() => {
        if (!emails) return [];
        // Get all category strings, filter out any null/empty ones
        const allCategories = emails.map(email => email.aiCategory).filter(Boolean);
        // Return a sorted array of unique categories
        return [...new Set(allCategories)].sort();
    }, [emails]); // Recalculates only when the master email list changes

    // --- UPDATED: The filtering logic now handles dynamic categories ---
    const filteredEmails = useMemo(() => {
        // First, handle the main views
        if (activeView === 'inbox') return emails;
        if (activeView === 'starred') return emails.filter(email => email.isStarred);
        if (activeView === 'action-items') {
            return emails.filter(email => 
                email.aiActionPoints && 
                email.aiActionPoints.length > 0 && 
                email.aiActionPoints[0].toLowerCase() !== 'none'
            );
        }
        // If it's not a main view, it must be a category view
        return emails.filter(email => email.aiCategory === activeView);
    }, [emails, activeView]);

    const handleSelectEmail = (email) => { setSelectedEmail(email); };
    const toggleSidebar = () => { setIsSidebarCollapsed(prevState => !prevState); };

    const handleUpdateEmail = (updatedEmail) => {
        setEmails(currentEmails =>
            currentEmails.map(email =>
                email._id === updatedEmail._id ? updatedEmail : email
            )
        );
        if (selectedEmail && selectedEmail._id === updatedEmail._id) {
            setSelectedEmail(updatedEmail);
        }
    };
    
    const handleSelectView = (view) => {
        setActiveView(view);
        setSelectedEmail(null);
    };

    return (
        <div className={`${styles.dashboardContainer} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}> 
            <Sidebar 
                isCollapsed={isSidebarCollapsed}
                onToggle={toggleSidebar}
                activeView={activeView}
                onSelectView={handleSelectView}
                // --- NEW: Pass the calculated categories to the sidebar ---
                categories={uniqueCategories}
            />
            <EmailListPane
                emails={filteredEmails}
                isLoading={isLoading}
                error={error}
                onSelectEmail={handleSelectEmail}
                selectedEmailId={selectedEmail?._id}
            />
            <EmailDetailPane
                selectedEmail={selectedEmail}
                onUpdateEmail={handleUpdateEmail}
                userName={userName}
                isUserLoading={isUserLoading}
            />
        </div>
    );
}

export default DashboardPage;