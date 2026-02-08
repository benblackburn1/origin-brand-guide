import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    assets: 0,
    templates: 0,
    tools: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [assetsRes, templatesRes, toolsRes, usersRes] = await Promise.all([
        api.get('/assets'),
        api.get('/templates'),
        api.get('/tools'),
        api.get('/users')
      ]);

      setStats({
        assets: assetsRes.data.data?.length || 0,
        templates: templatesRes.data.data?.length || 0,
        tools: toolsRes.data.data?.length || 0,
        users: usersRes.data.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { name: 'Upload Asset', path: '/admin/assets', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Add Template', path: '/admin/templates', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Create Tool', path: '/admin/tools', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { name: 'Edit Colors', path: '/admin/colors', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' }
  ];

  const statCards = [
    { name: 'Brand Assets', value: stats.assets, path: '/admin/assets', color: 'bg-blue-500' },
    { name: 'Templates', value: stats.templates, path: '/admin/templates', color: 'bg-green-500' },
    { name: 'Tools', value: stats.tools, path: '/admin/tools', color: 'bg-purple-500' },
    { name: 'Users', value: stats.users, path: '/admin/users', color: 'bg-orange-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.path}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white text-xl font-bold">{stat.value}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.path}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors"
            >
              <svg className="h-8 w-8 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
              </svg>
              <span className="text-sm font-medium text-gray-700">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>Welcome to the Brand Hub Admin Panel. Here's how to get started:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Assets:</strong> Upload brand logos, fonts, and other assets in multiple formats.</li>
            <li><strong>Templates:</strong> Add presentation templates with preview images and download links.</li>
            <li><strong>Tools:</strong> Create interactive brand tools with custom HTML/CSS/JS code.</li>
            <li><strong>Colors:</strong> Define your brand color palettes with HEX, RGB, CMYK, and Pantone values.</li>
            <li><strong>Content:</strong> Write brand voice, messaging, and strategy content in markdown.</li>
            <li><strong>Users:</strong> Manage user accounts and permissions.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
