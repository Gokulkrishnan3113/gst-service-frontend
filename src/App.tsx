import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './components/Login';
import Vendors from './components/Vendors';
import GSTFilings from './components/GSTFilings';
import AllFilings from './components/AllFilings';
import VendorSelector from './components/VendorSelector';
import VendorDetails from './components/VendorDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/vendors" replace />} />
          <Route
            path="/vendors"
            element={
              <ProtectedRoute>
                <Layout>
                  <Vendors />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gst-filings/:gstin"
            element={
              <ProtectedRoute>
                <Layout>
                  <GSTFilings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-filings"
            element={
              <ProtectedRoute>
                <Layout>
                  <AllFilings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor-details"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorSelector />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor-details/:gstin"
            element={
              <ProtectedRoute>
                <Layout>
                  <VendorDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;