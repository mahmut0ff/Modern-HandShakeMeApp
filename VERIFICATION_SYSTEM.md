# Identity Verification System

## Overview
Complete identity verification system with secure photo storage, status tracking, and admin review capabilities.

## Features Implemented

### 1. Verification Statuses
- `NOT_STARTED` - User has not started verification
- `PENDING` - User uploaded photos, waiting for review
- `IN_REVIEW` - Admin is reviewing (optional intermediate state)
- `APPROVED` - Verification successful
- `REJECTED` - Verification failed

### 2. Required Documents
- **Face Photo (Selfie)**: Clear photo of user's face
- **Passport Photo**: Photo of user holding passport with face visible

### 3. Backend API Endpoints

#### User Endpoints
- `GET /verification/status` - Get current verification status
- `POST /verification/upload-face-photo` - Upload face photo (selfie)
- `POST /verification/upload-passport-photo` - Upload passport verification photo
- `POST /verification/submit` - Submit verification for review
- `GET /verification/requirements` - Get verification requirements

#### Admin Endpoints
- `GET /verification/admin/pending` - List pending verification requests
- `POST /verification/admin/approve` - Approve verification
- `POST /verification/admin/reject` - Reject verification with reason

### 4. Security Features
- Photos stored securely (S3 in production, local filesystem in development)
- Files are private by default (not publicly accessible)
- Authentication required for all endpoints
- Admin-only access for review endpoints
- Secure file upload with size validation (max 5MB per photo)

### 5. Mobile UI Components

#### Verification Screen (`mobile/app/verification.tsx`)
- Status display with color-coded badges
- Photo upload with camera/library options
- Preview of uploaded photos
- Submit button (enabled when both photos uploaded)
- Retry functionality for rejected verifications
- Clear instructions and requirements

#### Verified Badge Component (`mobile/components/VerifiedBadge.tsx`)
- Reusable component for displaying verification badge
- Can be used in:
  - Profile screens
  - Chat headers
  - Work listings
  - Master profiles

### 6. Data Model

#### VerificationDocument
```typescript
{
  id: string;
  type: 'FACE_PHOTO' | 'PASSPORT_PHOTO' | ...;
  url: string;
  fileName: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}
```

#### MasterVerification
```typescript
{
  id: string;
  userId: string;
  status: 'NOT_STARTED' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  documents: VerificationDocument[];
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 7. User Flow

1. User opens Profile → Verification
2. If status = `not_started`, shows "Start Verification" button
3. User uploads face photo (selfie)
4. User uploads passport photo (holding passport)
5. User submits verification
6. Status changes to `pending`
7. Admin reviews verification
8. Admin approves or rejects
9. User receives notification
10. If approved: verified badge appears on profile
11. If rejected: user can retry with new photos

### 8. Admin Review Flow

1. Admin accesses pending verifications list
2. Views user info and uploaded photos
3. Reviews photos for:
   - Face clearly visible
   - Good lighting
   - No mask/sunglasses
   - Passport readable
4. Approves or rejects with reason
5. User notified of decision

### 9. File Storage

#### Development
- Files stored in `./uploads/verification/{userId}/`
- Accessible via `/uploads/verification/{userId}/{filename}`

#### Production
- Files stored in S3 bucket
- Private ACL (not publicly accessible)
- Signed URLs for secure access
- Path: `verification/{userId}/{filename}`

### 10. Notifications

Users receive notifications for:
- Verification submitted
- Verification approved
- Verification rejected (with reason)

### 11. Integration Points

#### User Model
- `isVerified: boolean` - Verification status flag
- `isIdentityVerified: boolean` - Same as isVerified
- `identityVerifiedAt: string` - Timestamp of verification

#### Profile Display
Add VerifiedBadge component next to user name:
```tsx
import VerifiedBadge from '@/components/VerifiedBadge';

{user.isVerified && <VerifiedBadge size={20} />}
```

### 12. API Client Usage

```typescript
import { verificationApi } from '@/src/api/verification';

// Get status
const status = await verificationApi.getStatus();

// Upload photos
const formData = new FormData();
formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' });
await verificationApi.uploadFacePhoto(formData);
await verificationApi.uploadPassportPhoto(formData);

// Submit for review
await verificationApi.submitForReview();

// Admin: Approve
await verificationApi.adminApprove(verificationId, 'Looks good');

// Admin: Reject
await verificationApi.adminReject(verificationId, 'Photo not clear', 'Please retake');
```

### 13. Files Created

#### Backend
- `lambda/core/verification/upload-face-photo.ts`
- `lambda/core/verification/upload-passport-photo.ts`
- `lambda/core/verification/admin-list-pending.ts`
- `lambda/core/verification/admin-approve.ts`
- `lambda/core/verification/admin-reject.ts`
- `lambda/core/shared/utils/file-storage.ts`

#### Mobile
- `mobile/src/api/verification.ts`
- `mobile/app/verification.tsx`
- `mobile/components/VerifiedBadge.tsx`

#### Updated Files
- `lambda/core/shared/repositories/verification.repository.ts`
- `lambda/core/shared/repositories/user.repository.ts`
- `lambda/core/verification/get-status.ts`
- `lambda/core/verification/submit-for-review.ts`

### 14. Next Steps

1. **Add verification badge to UI components**:
   - Profile screen
   - Chat headers
   - Master listings
   - Order applications

2. **Create admin panel**:
   - List pending verifications
   - View photos and user info
   - Approve/reject interface

3. **Add route configuration**:
   - Add `/verification` route to mobile app
   - Add admin routes for verification management

4. **Configure API Gateway**:
   - Add new endpoints to API Gateway
   - Configure CORS and authentication

5. **Test the system**:
   - Upload photos
   - Submit verification
   - Admin review process
   - Notification delivery

### 15. Security Considerations

- Photos are stored privately (not publicly accessible)
- Only user and admin can access verification photos
- All operations require authentication
- File size limits prevent abuse (5MB max)
- Image type validation (only images allowed)
- Admin role required for review operations

### 16. Future Enhancements

- Video verification
- Additional document types (ID card, driver license)
- Automated verification using AI/ML
- Expiration and re-verification
- Verification history tracking
- Bulk admin operations
