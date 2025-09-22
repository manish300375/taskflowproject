import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Camera, User } from 'lucide-react';
import { profileHelpers } from '../lib/supabase';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  userId: string;
  onImageUpdate: (imageUrl: string) => void;
  className?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export default function ProfileImageUpload({ 
  currentImageUrl, 
  userId, 
  onImageUpdate, 
  className = '' 
}: ProfileImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return 'Please upload a JPG, PNG, or WebP image file.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.';
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: validationError,
        success: false
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false
    });

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 100);

      const { data, error } = await profileHelpers.uploadProfileImage(file, userId);
      
      clearInterval(progressInterval);

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        // Update user profile with new image URL
        const { error: updateError } = await profileHelpers.updateUserProfile(userId, {
          avatar_url: data.publicUrl
        });

        if (updateError) {
          throw new Error(updateError.message);
        }

        setUploadState({
          isUploading: false,
          progress: 100,
          error: null,
          success: true
        });

        onImageUpdate(data.publicUrl);

        // Clear success state after 3 seconds
        setTimeout(() => {
          setUploadState(prev => ({ ...prev, success: false }));
        }, 3000);
      }
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearError = () => {
    setUploadState(prev => ({ ...prev, error: null }));
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImageUrl = previewUrl || currentImageUrl;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current/Preview Image */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
            {displayImageUrl ? (
              <img
                src={displayImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Camera overlay button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadState.isUploading}
            className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 shadow-lg disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : uploadState.error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploadState.isUploading}
        />

        {uploadState.isUploading ? (
          <div className="space-y-3">
            <div className="w-8 h-8 mx-auto text-blue-500">
              <Upload className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Uploading image...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{uploadState.progress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-8 h-8 mx-auto text-gray-400">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                Drop your image here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, WebP up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {uploadState.success && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-700">Profile image updated successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {uploadState.error && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700">{uploadState.error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview Controls */}
      {previewUrl && !uploadState.isUploading && (
        <div className="flex justify-center">
          <button
            onClick={clearPreview}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear preview</span>
          </button>
        </div>
      )}

      {/* Format Requirements */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium">Requirements:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Accepted formats: JPG, PNG, WebP</li>
          <li>Maximum file size: 5MB</li>
          <li>Recommended: Square images (1:1 ratio)</li>
        </ul>
      </div>
    </div>
  );
}