import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { LanguageProvider } from './context/LanguageContext';
import HotelPage from './pages/HotelPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import AdminPage from './pages/AdminPage';

function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <ChatProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/"        element={<HotelPage />} />
                            <Route path="/signin"  element={<SignIn />} />
                            <Route path="/signup"  element={<SignUp />} />
                            <Route path="/admin"   element={<AdminPage />} />
                            {/* Catch-all */}
                            <Route path="*"        element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                </ChatProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
