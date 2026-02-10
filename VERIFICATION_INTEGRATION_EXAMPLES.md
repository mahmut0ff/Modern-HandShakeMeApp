# Verification Badge Integration Examples

## How to Add Verified Badge to UI Components

### 1. Profile Screen

Add verified badge next to user name in profile header:

```tsx
// mobile/app/(tabs)/profile.tsx
import VerifiedBadge from '@/components/VerifiedBadge';

// In the profile header section:
<View style={styles.profileHeader}>
  <View style={styles.nameContainer}>
    <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
    {user?.isVerified && <VerifiedBadge size={20} />}
  </View>
  <Text style={styles.userRole}>{user?.role}</Text>
</View>

// Add to styles:
nameContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
```

### 2. Master Profile View

When viewing a master's profile:

```tsx
// mobile/app/masters/[id].tsx
import VerifiedBadge from '@/components/VerifiedBadge';

<View style={styles.masterHeader}>
  <Image source={{ uri: master.avatar }} style={styles.avatar} />
  <View style={styles.masterInfo}>
    <View style={styles.nameRow}>
      <Text style={styles.masterName}>{master.name}</Text>
      {master.isVerified && <VerifiedBadge size={18} />}
    </View>
    <View style={styles.ratingRow}>
      <Ionicons name="star" size={16} color="#FFD700" />
      <Text style={styles.rating}>{master.rating}</Text>
    </View>
  </View>
</View>

// Styles:
nameRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
```

### 3. Master List/Search Results

In master listing cards:

```tsx
// mobile/components/MasterCard.tsx
import VerifiedBadge from '@/components/VerifiedBadge';

export default function MasterCard({ master, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: master.avatar }} style={styles.avatar} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{master.name}</Text>
          {master.isVerified && <VerifiedBadge size={16} />}
        </View>
        <Text style={styles.skills}>{master.skills?.join(', ')}</Text>
        <View style={styles.footer}>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{master.rating}</Text>
          </View>
          <Text style={styles.price}>от {master.hourlyRate} сом/час</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

### 4. Chat Header

Show verified badge in chat conversation header:

```tsx
// mobile/app/chat/[id].tsx
import VerifiedBadge from '@/components/VerifiedBadge';

<View style={styles.chatHeader}>
  <TouchableOpacity onPress={() => router.back()}>
    <Ionicons name="arrow-back" size={24} color={theme.text} />
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.chatHeaderInfo}
    onPress={() => router.push(`/masters/${otherUser.id}`)}
  >
    <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
    <View>
      <View style={styles.headerNameRow}>
        <Text style={styles.headerName}>{otherUser.name}</Text>
        {otherUser.isVerified && <VerifiedBadge size={14} />}
      </View>
      <Text style={styles.headerStatus}>
        {otherUser.isOnline ? 'Online' : 'Offline'}
      </Text>
    </View>
  </TouchableOpacity>
</View>

// Styles:
headerNameRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
```

### 5. Application/Response Cards

Show verified badge on applications from masters:

```tsx
// mobile/components/ApplicationCard.tsx
import VerifiedBadge from '@/components/VerifiedBadge';

export default function ApplicationCard({ application, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Image source={{ uri: application.master.avatar }} style={styles.avatar} />
        <View style={styles.masterInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.masterName}>{application.master.name}</Text>
            {application.master.isVerified && <VerifiedBadge size={14} />}
          </View>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{application.master.rating}</Text>
          </View>
        </View>
        <Text style={styles.price}>${application.proposed_price}</Text>
      </View>
      <Text style={styles.coverLetter}>{application.cover_letter}</Text>
    </TouchableOpacity>
  );
}
```

### 6. Order Details - Master Info

When showing master info on an order:

```tsx
// mobile/app/jobs/[id].tsx
import VerifiedBadge from '@/components/VerifiedBadge';

{order.master && (
  <View style={styles.masterSection}>
    <Text style={styles.sectionTitle}>Master</Text>
    <TouchableOpacity 
      style={styles.masterCard}
      onPress={() => router.push(`/masters/${order.master.id}`)}
    >
      <Image source={{ uri: order.master.avatar }} style={styles.masterAvatar} />
      <View style={styles.masterDetails}>
        <View style={styles.masterNameRow}>
          <Text style={styles.masterName}>{order.master.name}</Text>
          {order.master.isVerified && <VerifiedBadge size={16} />}
        </View>
        <View style={styles.masterRating}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{order.master.rating}</Text>
          <Text style={styles.completedJobs}>
            {order.master.completedProjects} completed jobs
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.text + '66'} />
    </TouchableOpacity>
  </View>
)}
```

### 7. Profile Menu - Add Verification Option

Add verification menu item to profile screen:

```tsx
// mobile/app/(tabs)/profile.tsx

const menuItems = [
  {
    icon: 'person-outline' as const,
    title: 'My Profile',
    subtitle: 'Edit your personal information',
    onPress: () => router.push('/profile/edit' as any),
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Verification',
    subtitle: user?.isVerified ? 'Verified ✓' : 'Verify your identity',
    badge: !user?.isVerified ? 'New' : undefined,
    onPress: () => router.push('/verification' as any),
  },
  // ... other menu items
];
```

### 8. Dashboard - Verification Alert

Show verification prompt on dashboard for unverified users:

```tsx
// mobile/app/(tabs)/index.tsx

{user?.role === 'MASTER' && !user?.isVerified && (
  <View style={styles.section}>
    <TouchableOpacity
      style={[styles.verificationAlert, { 
        backgroundColor: '#FFF3CD', 
        borderColor: '#FFC107' 
      }]}
      onPress={() => router.push('/verification' as any)}
    >
      <View style={styles.alertIcon}>
        <Ionicons name="shield-checkmark" size={24} color="#FF9800" />
      </View>
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>Get Verified</Text>
        <Text style={styles.alertText}>
          Verify your identity to build trust and get more orders
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#FF9800" />
    </TouchableOpacity>
  </View>
)}
```

### 9. Custom Badge Variants

Create different badge styles for different contexts:

```tsx
// mobile/components/VerifiedBadge.tsx - Enhanced version

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VerifiedBadgeProps {
  size?: number;
  color?: string;
  variant?: 'icon' | 'text' | 'full';
}

export default function VerifiedBadge({ 
  size = 16, 
  color = '#4CAF50',
  variant = 'icon' 
}: VerifiedBadgeProps) {
  if (variant === 'icon') {
    return (
      <View style={styles.badge}>
        <Ionicons name="checkmark-circle" size={size} color={color} />
      </View>
    );
  }
  
  if (variant === 'text') {
    return (
      <View style={[styles.textBadge, { backgroundColor: color + '15' }]}>
        <Ionicons name="checkmark-circle" size={12} color={color} />
        <Text style={[styles.textBadgeText, { color }]}>Verified</Text>
      </View>
    );
  }
  
  // variant === 'full'
  return (
    <View style={[styles.fullBadge, { backgroundColor: color }]}>
      <Ionicons name="checkmark-circle" size={14} color="white" />
      <Text style={styles.fullBadgeText}>Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  textBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  fullBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

### 10. Usage Examples for Different Variants

```tsx
// Icon only (default)
{user.isVerified && <VerifiedBadge />}

// With text
{user.isVerified && <VerifiedBadge variant="text" />}

// Full badge
{user.isVerified && <VerifiedBadge variant="full" />}

// Custom size and color
{user.isVerified && <VerifiedBadge size={24} color="#2196F3" />}
```

## API Integration

### Check Verification Status

```tsx
import { verificationApi } from '@/src/api/verification';

const checkVerificationStatus = async () => {
  try {
    const response = await verificationApi.getStatus();
    const status = response.data.status;
    
    if (status === 'approved') {
      // Show verified badge
    } else if (status === 'pending') {
      // Show "Under Review" message
    } else if (status === 'rejected') {
      // Show retry option
    } else {
      // Show "Start Verification" button
    }
  } catch (error) {
    console.error('Failed to check verification status', error);
  }
};
```

### Update User Context After Verification

```tsx
// In AuthContext or user profile fetch
const fetchUserProfile = async () => {
  const response = await profileApi.getCurrentUser();
  const user = response.data;
  
  // Check if user is verified
  if (user.isVerified || user.isIdentityVerified) {
    // User is verified, show badge everywhere
  }
};
```

## Styling Tips

### Consistent Badge Placement
- Always place badge immediately after the name
- Use `flexDirection: 'row'` and `alignItems: 'center'`
- Add small gap (4-8px) between name and badge

### Size Guidelines
- List items: 14-16px
- Profile headers: 18-20px
- Large displays: 24px
- Chat/small contexts: 12-14px

### Color Scheme
- Default: `#4CAF50` (green) for verified
- Alternative: `#2196F3` (blue) for premium verified
- Warning: `#FF9800` (orange) for pending verification
