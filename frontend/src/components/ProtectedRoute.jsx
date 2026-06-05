import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext"; // 👈 ඔයාගේ AuthContext එක තියෙන නිවැරදි Path එක දාන්න

const ProtectedRoute = ({ children }) => {
    // 1. Context එකෙන් user, token සහ loading කියන තුනම ගන්නවා
    const { user, token, loading } = useContext(AuthContext);

    // 2. [ඉතාමත් වැදගත්] Context එකෙන් localStorage එක චෙක් කරලා ඉවර වෙනකන් පේජ් එක හෝල්ඩ් කරන් ඉන්නවා
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-sm tracking-wide text-slate-400">ඇතුළු වීමේ අවසරය පරීක්ෂා කරමින් පවතී...</p>
            </div>
        );
    }

    // 3. ලෝඩින් එක ඉවර වුණාට පස්සේ... ටෝකන් එකක් හෝ යූසර් කෙනෙක් නැත්නම් කෙලින්ම ලොගින් පේජ් එකට යවනවා
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // 4. යූසර්ගේ රෝල් එක ඇඩ්මින් නෙවෙයි නම් සාමාන්‍ය ප්ලේයර් පේජ් එකට හරවා යවනවා
    if (user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    // හැමදේම හරිනම් විතරක් Admin පේජ් එක පෙන්වනවා
    return children;
};

export default ProtectedRoute;