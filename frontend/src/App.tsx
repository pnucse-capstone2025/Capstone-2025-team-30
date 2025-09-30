import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@/shared/components/ui/Header/Header';
import Dashboard from '@/features/dashboard/Dashboard';
import Results from '@/features/results/Results';
import ModelTest from '@/features/model-test/ModelTest';
import { GlobalStyle } from '@/styles/GlobalStyle';
import StreamingManager from '@/core/streaming/StreamingManager';
import { ToastProvider, useToast, ToastContainer } from '@/shared/components/ui/Toast';

function AppContent() {
	const { toasts, removeToast } = useToast();
	
	return (
		<>
			<Header />
			<StreamingManager />
			<ToastContainer toasts={toasts} onRemove={removeToast} />

			<div className="app-container">
				<Routes>
					<Route path="/" element={<Dashboard />} />
					<Route path="/results" element={<Results />} />
					<Route path="/model-test" element={<ModelTest />} />
				</Routes>
			</div>
		</>
	);
}

function App() {
	return (
		<Router>
			<GlobalStyle />
			<ToastProvider>
				<AppContent />
			</ToastProvider>
		</Router>
	);
}

export default App;
