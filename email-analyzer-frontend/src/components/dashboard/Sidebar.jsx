// src/components/dashboard/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Sidebar.module.css';
import { FaInbox, FaRegStar, FaRegCalendarAlt, FaTag, FaRegClock } from 'react-icons/fa'; // Example icons

const formatDate = (dateString) => {
    if (!dateString) return '';
    // Adding UTC timezone hint for consistency
    return new Date(dateString + 'T00:00:00Z').toLocaleDateString(undefined, {
         year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
};

function Sidebar({ selectedFilter, onSelectFilter }) {
    const [dates, setDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDates = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('/api/summaries');
                const uniqueDates = [
                    ...new Set(response.data.map(s => s.date.split('T')[0]))
                ].sort((a, b) => new Date(b) - new Date(a));
                setDates(uniqueDates);
            } catch (err) {
                console.error("Error fetching summary dates:", err);
                setError("Failed to load dates");
            } finally {
                setLoading(false);
            }
        };
        fetchDates();
    }, []);

    const handleFilterClick = (type, value) => {
        onSelectFilter({ type, value });
    };

    return (
        <div className={styles.sidebar}>
            {/* Mock Static Items - Replace with real logic later */}
            <div
                className={`${styles.navItem} ${selectedFilter.type === 'category' && selectedFilter.value === 'Inbox' ? styles.selected : ''}`}
                onClick={() => handleFilterClick('category', 'Inbox')}
            >
                <FaInbox className={styles.icon} /> Inbox
            </div>
             <div
                className={`${styles.navItem} ${selectedFilter.type === 'category' && selectedFilter.value === 'Starred' ? styles.selected : ''}`}
                onClick={() => handleFilterClick('category', 'Starred')}
            >
                <FaRegStar className={styles.icon} /> Starred
            </div>

            <hr className={styles.divider}/>

            {/* Dynamic Dates */}
            <div className={styles.sectionTitle}><FaRegCalendarAlt className={styles.icon} /> By Date</div>
            {loading && <div className={styles.loading}>Loading...</div>}
            {error && <div className={styles.error}>{error}</div>}
            {!loading && !error && dates.map(dateStr => (
                 <div
                    key={dateStr}
                    className={`${styles.navItem} ${styles.dateItem} ${selectedFilter.type === 'date' && selectedFilter.value === dateStr ? styles.selected : ''}`}
                    onClick={() => handleFilterClick('date', dateStr)}
                >
                    {formatDate(dateStr)}
                </div>
            ))}
            {!loading && !error && dates.length === 0 && <div className={styles.noDates}>No processed dates.</div>}
        </div>
    );
}

export default Sidebar;