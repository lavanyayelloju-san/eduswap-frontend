// FIX: Implemented the main App component to manage application state, routing, and logic, resolving the "not a module" error.
import React, { useState, useEffect, Suspense } from 'react';
import { User, Resource, Notification, View, Conversation, Comment, Message, Report } from './types';
import { mockUsers, mockResources, mockNotifications, mockConversations, mockReports } from './mockData';
import Header from './components/Header';
import { LoadingSpinner } from './components/Icons';

// Lazy load views and modals
const LoginView = React.lazy(() => import('./views/LoginView'));
const SignupView = React.lazy(() => import('./views/SignupView'));
const OtpVerificationView = React.lazy(() => import('./views/OtpVerificationView'));
const IdVerificationView = React.lazy(() => import('./views/IdVerificationView'));
const PendingVerificationView = React.lazy(() => import('./views/PendingVerificationView'));
const FeedView = React.lazy(() => import('./views/FeedView'));
const UploadView = React.lazy(() => import('./views/UploadView'));
const NotificationsView = React.lazy(() => import('./views/NotificationsView'));
const ProfileView = React.lazy(() => import('./views/ProfileView'));
const AdminDashboardView = React.lazy(() => import('./views/AdminDashboardView'));
const DirectMessageView = React.lazy(() => import('./views/DirectMessageView'));
const ChatView = React.lazy(() => import('./views/ChatView'));
const AnnouncementsView = React.lazy(() => import('./views/AnnouncementsView'));
const UserProfileView = React.lazy(() => import('./views/UserProfileView'));
const SavedItemsView = React.lazy(() => import('./views/SavedItemsView'));

const BottomNav = React.lazy(() => import('./components/BottomNav'));
const BotModal = React.lazy(() => import('./components/BotModal'));
const CommentsModal = React.lazy(() => import('./components/CommentsModal'));
const PreviewModal = React.lazy(() => import('./components/PreviewModal'));
const FilterPanel = React.lazy(() => import('./components/FilterPanel'));
const EditProfileModal = React.lazy(() => import('./components/EditProfileModal'));
const IdPreviewModal = React.lazy(() => import('./components/IdPreviewModal'));
const SecurityModal = React.lazy(() => import('./components/SecurityModal'));
const LogoutModal = React.lazy(() => import('./components/LogoutModal'));
const TermsModal = React.lazy(() => import('./components/TermsModal'));
const ReportModal = React.lazy(() => import('./components/ReportModal'));

const App: React.FC = () => {
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [resources, setResources] = useState<Resource[]>(mockResources);
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
    const [reports, setReports] = useState<Report[]>(mockReports);
    const [view, setView] = useState<View>('login');
    const [previousView, setPreviousView] = useState<View>('login');
    const [loginError, setLoginError] = useState('');

    // Modal states and selected items
    const [isBotModalOpen, setBotModalOpen] = useState(false);
    const [isCommentsModalOpen, setCommentsModalOpen] = useState(false);
    const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
    const [isFilterPanelOpen, setFilterPanelOpen] = useState(false);
    const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);
    const [isIdPreviewModalOpen, setIdPreviewModalOpen] = useState(false);
    const [isSecurityModalOpen, setSecurityModalOpen] = useState(false);
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
    const [isTermsModalOpen, setTermsModalOpen] = useState(false);
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    
    // Filtering state
    const [appliedFilters, setAppliedFilters] = useState<any>({});
    
    // Handlers
    const handleLogin = (identifier: string, pass: string) => {
        setLoginError('');
        const user = users.find(u => (u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase()));
        
        // Specific admin credentials check
        if (user && user.username === 'admin272007') {
            if (pass === 'admin2717') {
                 setCurrentUser(user);
                 setView('feed');
            } else {
                 setLoginError('Invalid credentials. Please try again.');
            }
            return;
        }

        if (user) { // Password check omitted for mock data for other users
            setCurrentUser(user);
            if (user.status === 'pending') {
                setView('pending_verification');
            } else {
                setView('feed');
            }
        } else {
            setLoginError('Invalid credentials. Please try again.');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setView('login');
        setLogoutModalOpen(false);
    };

    const handleViewChange = (newView: View) => {
        setPreviousView(view);
        setView(newView);
    };

    const handleVerificationComplete = (idCardUrl: string) => {
        // Mock user creation
        const newUser: User = {
            id: `user-${Date.now()}`, name: 'New User', username: 'newuser', email: 'new@college.edu',
            rollNumber: '23259-XX-000', avatarUrl: 'https://api.dicebear.com/8.x/adventurer/svg?seed=new',
            status: 'pending', idCardUrl, trustScore: 50, savedItems: [],
        };
        setUsers(prev => [...prev, newUser]);
        setView('pending_verification');
    };
    
    const handleSaveClick = (resourceId: string) => {
        if (!currentUser) return;
        const isSaved = currentUser.savedItems.includes(resourceId);
        const updatedSavedItems = isSaved
            ? currentUser.savedItems.filter(id => id !== resourceId)
            : [...currentUser.savedItems, resourceId];
        const updatedUser = { ...currentUser, savedItems: updatedSavedItems };
        setCurrentUser(updatedUser);
        setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
    };

    const handleAddComment = (resourceId: string, text: string) => {
        if (!currentUser) return;
        const newComment: Comment = {
            id: `comment-${Date.now()}`,
            user: { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl },
            text,
            timestamp: 'Just now',
        };
        const updatedResources = resources.map(r => {
            if (r.id === resourceId) {
                return { ...r, comments: [...r.comments, newComment] };
            }
            return r;
        });
        setResources(updatedResources);
        setSelectedResource(updatedResources.find(r => r.id === resourceId) || null);
    };

    const handleUpload = (resourceData: Omit<Resource, 'id' | 'owner' | 'comments'>) => {
        if (!currentUser) return;
        const newResource: Resource = {
            ...resourceData,
            id: `resource-${Date.now()}`,
            owner: currentUser,
            comments: [],
        };
        setResources(prev => [newResource, ...prev]);
        setView('feed');
    };
    
    const handleUpdateProfile = (updatedData: Partial<User>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updatedData };
        setCurrentUser(updatedUser);
        setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
        
        // Also update owner info on resources
        setResources(resources.map(r => r.owner.id === currentUser.id ? {...r, owner: updatedUser} : r));
    };
    
    const handleVerifyUser = (userId: string, approved: boolean) => {
        const user = users.find(u => u.id === userId);
        if(!user) return;

        const newStatus = approved ? 'verified' : 'rejected';
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        
        const notificationMessage = `Your ID verification has been ${newStatus}.`;
        const adminNotification: Notification = {
            id: `notif-${Date.now()}`,
            type: 'admin',
            message: notificationMessage,
            timestamp: 'Just now',
            read: false
        };
        // This is a simplified way to notify a user. In a real app, this would target the specific user.
        setNotifications(prev => [adminNotification, ...prev]);

        setIdPreviewModalOpen(false);
    };

    const handleBorrowClick = (resource: Resource) => {
        if (!currentUser) return;

        setResources(resources.map(r => r.id === resource.id ? {...r, availability: 'Pending Approval', requesterId: currentUser.id} : r));
        
        const ownerNotification: Notification = {
            id: `notif-${Date.now()}`,
            type: 'borrow_request',
            message: `${currentUser.name} wants to borrow "${resource.title}"`,
            timestamp: 'Just now',
            read: false,
            resourceId: resource.id,
            borrower: currentUser,
            processed: false
        };
        // This is a simplified way to notify the owner. In a real app, you would add this to the owner's notification list.
        setNotifications(prev => [ownerNotification, ...prev]);

        alert(`Borrow request sent for "${resource.title}"`);
    };

    const handleBorrowDecision = (notificationId: string, resourceId: string | undefined, approved: boolean) => {
        const resource = resources.find(r => r.id === resourceId);
        if (!resource || !resource.requesterId) return;

        const requester = users.find(u => u.id === resource.requesterId);
        if (!requester) return;

        // Update notification for the owner
        setNotifications(notifications.map(n => n.id === notificationId ? {...n, processed: true} : n));

        // Update resource status
        const newAvailability = approved ? 'Borrowed' : 'Available';
        setResources(resources.map(r => r.id === resourceId ? {...r, availability: newAvailability, requesterId: undefined} : r));

        // Create notification for the borrower
        const borrowerNotification: Notification = {
             id: `notif-${Date.now()}`,
             type: 'borrow_response',
             message: `Your request for "${resource.title}" was ${approved ? 'approved' : 'rejected'}.`,
             timestamp: 'Just now',
             read: false,
             resourceId: resource.id,
        };
        setNotifications(prev => [borrowerNotification, ...prev]);
    };

    const handlePostAnnouncement = (message: string) => {
        const newAnnouncement: Notification = {
            id: `notif-${Date.now()}`, type: 'announcement', message, timestamp: 'Just now', read: false
        };
        setNotifications(prev => [newAnnouncement, ...prev]);
    };

    const handleReportSubmit = (resourceId: string, reasonCategory: string, reasonDetails: string) => {
        if (!currentUser) return;
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) return;
    
        const newReport: Report = {
            id: `report-${Date.now()}`,
            resource,
            reporter: currentUser,
            reasonCategory,
            reasonDetails,
            timestamp: 'Just now',
        };
        setReports(prev => [newReport, ...prev]);
        alert('Report submitted. Our team will review it shortly.');
    };

    const handleDeleteResource = (resourceId: string) => {
        if (!window.confirm('Are you sure you want to delete this resource? This cannot be undone.')) return;
        
        // Filter resources, reports, and notifications
        setResources(prev => prev.filter(r => r.id !== resourceId));
        setReports(prev => prev.filter(r => r.resource.id !== resourceId));
        setNotifications(prev => prev.filter(n => n.resourceId !== resourceId));

        // Remove from saved items of all users
        const updatedUsers = users.map(user => ({
            ...user,
            savedItems: user.savedItems.filter(id => id !== resourceId)
        }));
        setUsers(updatedUsers);
        
        // Update current user if they were affected
        const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser?.id);
        if (updatedCurrentUser) {
            setCurrentUser(updatedCurrentUser);
        }
    };
    
    const handleRemoveResource = (resourceId: string) => {
        setResources(prev => prev.filter(r => r.id !== resourceId));
        setReports(prev => prev.filter(r => r.resource.id !== resourceId));
    };

    const handleDismissReport = (reportId: string) => {
        setReports(prev => prev.filter(r => r.id !== reportId));
    };
    
    const handleSendMessage = (conversationId: string, text: string) => {
        if(!currentUser) return;
        const newMessage: Message = { id: `msg-${Date.now()}`, senderId: currentUser.id, text, timestamp: 'Just now'};
        const updatedConversations = conversations.map(c => c.id === conversationId ? {...c, messages: [...c.messages, newMessage], lastMessage: text} : c);
        setConversations(updatedConversations);
        setSelectedConversation(updatedConversations.find(c => c.id === conversationId) || null);
    };

    // Modal openers
    const handleOpenComments = (resource: Resource) => { setSelectedResource(resource); setCommentsModalOpen(true); };
    const handleOpenPreview = (resource: Resource) => { setSelectedResource(resource); setPreviewModalOpen(true); };
    const handleProfileClick = (user: User) => { setSelectedUser(user); handleViewChange('user_profile'); };
    const handleOpenIdPreview = (user: User) => { setSelectedUser(user); setIdPreviewModalOpen(true); };
    const handleOpenReport = (resource: Resource) => { setSelectedResource(resource); setReportModalOpen(true); };
    const handleConversationClick = (convo: Conversation) => { setSelectedConversation(convo); handleViewChange('chat'); };
    const handleSendMessageClick = (user: User) => {
        if (!currentUser) return;
        const existingConvo = conversations.find(c => c.participant.id === user.id);
        if (existingConvo) {
            setSelectedConversation(existingConvo);
        } else {
            const newConvo: Conversation = {
                id: `convo-${Date.now()}`,
                participant: user,
                lastMessage: 'Started a new conversation.',
                messages: []
            };
            setConversations(prev => [newConvo, ...prev]);
            setSelectedConversation(newConvo);
        }
        handleViewChange('chat');
    };
    
    const filteredResources = resources.filter(resource => {
        if (!appliedFilters || Object.keys(appliedFilters).length === 0) return true;
        return Object.entries(appliedFilters).every(([category, values]) => {
            const filterValues = values as string[];
            if (filterValues.length === 0) return true;
            return filterValues.includes(resource[category as keyof Resource] as string);
        });
    });

    const mainViews: Record<string, React.ReactNode> = {
        feed: <FeedView resources={filteredResources} currentUser={currentUser} onCommentClick={handleOpenComments} onSaveClick={handleSaveClick} onPreviewClick={handleOpenPreview} onProfileClick={handleProfileClick} onOpenFilters={() => setFilterPanelOpen(true)} onBorrowClick={handleBorrowClick} onReportClick={handleOpenReport} onDeleteClick={handleDeleteResource} />,
        upload: <UploadView onUpload={handleUpload} />,
        notifications: <NotificationsView notifications={notifications} onAnnouncementClick={() => handleViewChange('announcements')} onBorrowDecision={handleBorrowDecision} />,
        profile: currentUser && <ProfileView currentUser={currentUser} userResources={resources.filter(r => r.owner.id === currentUser.id)} onEditProfile={() => setEditProfileModalOpen(true)} onViewSavedItems={() => handleViewChange('saved_items')} onSecurity={() => setSecurityModalOpen(true)} onLogout={() => setLogoutModalOpen(true)} onCommentClick={handleOpenComments} onSaveClick={handleSaveClick} onPreviewClick={handleOpenPreview} onProfileClick={handleProfileClick} onBorrowClick={handleBorrowClick} onReportClick={handleOpenReport} onTermsClick={() => setTermsModalOpen(true)} onDeleteClick={handleDeleteResource} />,
        admin: <AdminDashboardView users={users} reports={reports} onViewId={handleOpenIdPreview} onPostAnnouncement={handlePostAnnouncement} onRemoveResource={handleRemoveResource} onDismissReport={handleDismissReport} />,
        dms: currentUser && <DirectMessageView conversations={conversations} currentUser={currentUser} onBack={() => handleViewChange(previousView)} onConversationClick={handleConversationClick} />,
        chat: selectedConversation && currentUser && <ChatView conversation={selectedConversation} currentUser={currentUser} onBack={() => handleViewChange('dms')} onSendMessage={handleSendMessage} />,
        announcements: <AnnouncementsView notifications={notifications} onBack={() => handleViewChange('notifications')} />,
        user_profile: selectedUser && <UserProfileView user={selectedUser} currentUser={currentUser} userResources={resources.filter(r => r.owner.id === selectedUser.id)} onBack={() => handleViewChange(previousView)} onSendMessage={handleSendMessageClick} onCommentClick={handleOpenComments} onSaveClick={handleSaveClick} onPreviewClick={handleOpenPreview} onProfileClick={handleProfileClick} onBorrowClick={handleBorrowClick} onReportClick={handleOpenReport} onTermsClick={() => setTermsModalOpen(true)} onDeleteClick={handleDeleteResource} />,
        saved_items: currentUser && <SavedItemsView resources={resources.filter(r => currentUser.savedItems.includes(r.id))} currentUser={currentUser} onPreviewClick={handleOpenPreview} onCommentClick={handleOpenComments} onSaveClick={handleSaveClick} onProfileClick={handleProfileClick} onBorrowClick={handleBorrowClick} onReportClick={handleOpenReport} onBack={() => handleViewChange('profile')} onDeleteClick={handleDeleteResource} />,
        login: <LoginView onLogin={handleLogin} onGoToSignup={() => setView('signup')} error={loginError} />,
        signup: <SignupView onSignup={() => setView('otp')} onBackToLogin={() => setView('login')} />,
        otp: <OtpVerificationView onOtpSuccess={() => setView('id_verification')} />,
        id_verification: <IdVerificationView onVerificationComplete={handleVerificationComplete} />,
        pending_verification: <PendingVerificationView onBackToLogin={() => handleLogout()} />,
    };

    const isAuthFlow = ['login', 'signup', 'otp', 'id_verification', 'pending_verification'].includes(view);
    
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen w-full"><LoadingSpinner className="h-12 w-12 text-brand-blue" /></div>}>
            <div className="max-w-lg mx-auto bg-gray-50 min-h-screen font-sans">
                {!isAuthFlow && currentUser ? (
                    <>
                        <Header onMessageClick={() => handleViewChange('dms')} />
                        <main className="pb-20">
                            {mainViews[view]}
                        </main>
                        <BottomNav activeView={view} setView={(v) => handleViewChange(v as View)} onSwappyClick={() => setBotModalOpen(true)} currentUser={currentUser} />
                    </>
                ) : mainViews[view]}

                {/* Modals */}
                <BotModal isOpen={isBotModalOpen} onClose={() => setBotModalOpen(false)} />
                <CommentsModal isOpen={isCommentsModalOpen} onClose={() => { setCommentsModalOpen(false); setSelectedResource(null); }} resource={selectedResource} onAddComment={handleAddComment} />
                <PreviewModal isOpen={isPreviewModalOpen} onClose={() => { setPreviewModalOpen(false); setSelectedResource(null); }} resource={selectedResource} />
                <FilterPanel isOpen={isFilterPanelOpen} onClose={() => setFilterPanelOpen(false)} resources={resources} onApplyFilters={setAppliedFilters} />
                <EditProfileModal isOpen={isEditProfileModalOpen} onClose={() => setEditProfileModalOpen(false)} currentUser={currentUser} onSave={handleUpdateProfile} />
                <IdPreviewModal isOpen={isIdPreviewModalOpen} onClose={() => { setIdPreviewModalOpen(false); setSelectedUser(null); }} user={selectedUser} onVerify={handleVerifyUser} />
                <SecurityModal isOpen={isSecurityModalOpen} onClose={() => setSecurityModalOpen(false)} />
                <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setLogoutModalOpen(false)} onConfirmLogout={handleLogout} />
                <TermsModal isOpen={isTermsModalOpen} onClose={() => setTermsModalOpen(false)} />
                <ReportModal isOpen={isReportModalOpen} onClose={() => { setReportModalOpen(false); setSelectedResource(null); }} resource={selectedResource} onSubmit={handleReportSubmit} />
            </div>
        </Suspense>
    );
};

export default App;