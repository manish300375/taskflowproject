import React, { useState, useEffect } from 'react';
import { User, Edit3, Save, X, Mail, Calendar, Shield } from 'lucide-react';
import { authHelpers, profileHelpers } from '../lib/supabase';
import ProfileImageUpload from './ProfileImageUpload';

interface ProfileSectionProps {
  user: any;
  onUserUpdate: (user: any) => void;
}

export default function ProfileSection({ user, onUserUpdate }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    avatar_url: user?.user_metadata?.avatar_url || ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfileData({
      full_name: user?.user_metadata?.full_name || '',
      avatar_url: user?.user_metadata?.avatar_url || ''
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!profileData.full_name.trim()) {
      setError('Full name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await profileHelpers.updateUserProfile(user.id, {
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local user state
      onUserUpdate({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url
        }
      });

      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      full_name: user?.user_metadata?.full_name || '',
      avatar_url: user?.user_metadata?.avatar_url || ''
    });
    setIsEditing(false);
    setError(null);
  };

  const handleImageUpdate = (imageUrl: string) => {
    setProfileData(prev => ({ ...prev, avatar_url: imageUrl }));
    // Auto-update user state when image is uploaded
    onUserUpdate({
      ...user,
      user_metadata: {
        ...user.user_metadata,
        avatar_url: imageUrl
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 transition-colors duration-200"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isEditing ? (
          <div className="space-y-6">
            {/* Profile Image Upload */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Profile Picture</h3>
              <ProfileImageUpload
                currentImageUrl={profileData.avatar_url}
                userId={user.id}
                onImageUpdate={handleImageUpdate}
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Display */}
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  {profileData.full_name || 'No name set'}
                </h3>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Member Since</p>
                    <p className="text-sm text-gray-600">{formatDate(user.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Status</p>
                    <p className="text-sm text-green-600">Active</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">User ID</p>
                    <p className="text-sm text-gray-600 font-mono">{user.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}