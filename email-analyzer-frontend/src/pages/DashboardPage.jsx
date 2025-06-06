// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import EmailListPane from '../components/dashboard/EmailListPane';
import EmailDetailPane from '../components/dashboard/EmailDetailPane';
import styles from './DashboardPage.module.css';

function DashboardPage() {
    const [selectedFilter, setSelectedFilter] = useState({ type: 'date', value: null });
    const [selectedEmailId, setSelectedEmailId] = useState(null);
    const [refreshList, setRefreshList] = useState(false); // Use boolean toggle

    // Effect to set initial date filter
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setSelectedFilter({ type: 'date', value: today });
    }, []);

     // Handler to force refresh the email list
    const handleRefreshList = () => {
        console.log('Refreshing email list...');
        setRefreshList(prev => !prev); // Toggle state
    };

    // Handler to clear selected email when filter changes
     useEffect(() => {
        setSelectedEmailId(null); // Clear detail view when filter changes
     }, [selectedFilter]);


    return (
        <div className={styles.dashboardLayout}>
            {/* Note: Wrapper divs removed, apply layout styles directly to components via their own modules */}
            <Sidebar
                selectedFilter={selectedFilter}
                onSelectFilter={setSelectedFilter}
            />
            <EmailListPane
                selectedFilter={selectedFilter}
                onSelectEmail={setSelectedEmailId}
                selectedEmailId={selectedEmailId}
                refreshTrigger={refreshList} // Pass the boolean state
            />
            <EmailDetailPane
                selectedEmailId={selectedEmailId}
                onStatusUpdate={handleRefreshList}
            />
        </div>
    );
}

export default DashboardPage;