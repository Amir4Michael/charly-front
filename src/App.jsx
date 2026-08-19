import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import ScrollToTop from './components/ScrollToTop';
import MainLayout from './layouts/MainLayout';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoadingState } from './components/common';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DailyReportsPage = lazy(() => import('./pages/DailyReportsPage'));
const DailyReportFormPage = lazy(() => import('./pages/DailyReportFormPage'));
const DailyReportViewPage = lazy(() => import('./pages/DailyReportViewPage'));
const WeeklySchedulePage = lazy(() => import('./pages/WeeklySchedulePage'));
const WeeklyReportPage = lazy(() => import('./pages/WeeklyReportPage'));

const MaterialsPage = lazy(() => import('./pages/MaterialsPage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const QuarriesPage = lazy(() => import('./pages/QuarriesPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const QuarryDetailPage = lazy(() => import('./pages/QuarryDetailPage'));
const TrucksPage = lazy(() => import('./pages/TrucksPage'));
const TruckDetailPage = lazy(() => import('./pages/TruckDetailPage'));
const WorkersPage = lazy(() => import('./pages/WorkersPage'));
const WorkerDetailPage = lazy(() => import('./pages/WorkerDetailPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));

const ProductionPage = lazy(() => import('./pages/ProductionPage'));
const LoadingSalesPage = lazy(() => import('./pages/LoadingSalesPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const ReportsCenterPage = lazy(() => import('./pages/ReportsCenterPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));


import InstallPrompt from './components/pwa/InstallPrompt';
import PwaUpdateManager from './components/pwa/PwaUpdateManager';

function ProtectedRoute({ children }) {
    const { isAuthenticated, initializing } = useAuth();
    // ننتظر محاولة استعادة الجلسة (refresh عبر httpOnly cookie) قبل أي قرار توجيه،
    // وإلا كان أي تحديث للصفحة (F5) يُخرج المستخدم فورًا لأن الـAccess Token في الذاكرة فقط.
    if (initializing) return <LoadingState />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}

function AppRoutes() {
    return (
        <Suspense fallback={<LoadingState />}>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/" element={<DashboardPage />} />

                    {/* التشغيل */}
                    <Route path="/operations/daily-reports" element={<DailyReportsPage />} />
                    <Route path="/operations/daily-reports/new" element={<DailyReportFormPage />} />
                    <Route path="/operations/daily-reports/:id" element={<DailyReportViewPage />} />
                    <Route path="/operations/daily-reports/:id/edit" element={<DailyReportFormPage />} />
                    <Route path="/operations/weekly-schedule" element={<WeeklySchedulePage />} />
                    <Route path="/operations/weekly-report" element={<WeeklyReportPage />} />

                    {/* البيانات الأساسية */}
                    <Route path="/materials" element={<MaterialsPage />} />
                    <Route path="/people" element={<PeoplePage />} />
                    <Route path="/quarries" element={<QuarriesPage />} />
                    <Route path="/quarries/:id" element={<QuarryDetailPage />} />
                    <Route path="/suppliers/:type" element={<SuppliersPage />} />
                    <Route path="/trucks" element={<TrucksPage />} />
                    <Route path="/trucks/:id" element={<TruckDetailPage />} />
                    <Route path="/workers" element={<WorkersPage />} />
                    <Route path="/workers/:id" element={<WorkerDetailPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/customers/:id" element={<CustomerDetailPage />} />

                    {/* الإنتاج والمبيعات */}
                    <Route path="/production" element={<ProductionPage />} />
                    <Route path="/sales" element={<LoadingSalesPage />} />

                    {/* المالية */}
                    <Route path="/expenses" element={<ExpensesPage />} />
                    <Route path="/accounts" element={<AccountsPage />} />

                    {/* التقارير */}
                    <Route path="/reports" element={<ReportsCenterPage />} />

                    {/* الإدارة */}
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <AppRoutes />
                <Toaster position="top-center" dir="rtl" richColors />

                <PwaUpdateManager />
                <InstallPrompt />
            </Router>
        </AuthProvider>
    );
}

export default App;