import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import './AdminPage.css';

export default function AdminPage() {
    const navigate = useNavigate();

    return (
        <div className="admin-page">
            <AdminPanel onClose={() => navigate('/')} />
        </div>
    );
}
