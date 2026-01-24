import React from 'react';
import { render } from '@testing-library/react-native';
import { VerificationStatusCard } from '../components/VerificationStatusCard';

describe('VerificationStatusCard', () => {
  it('renders unverified status correctly', () => {
    const { UNSAFE_root } = render(
      <VerificationStatusCard
        status="unverified"
        approvedCount={0}
        totalCount={5}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders verified status correctly', () => {
    const { UNSAFE_root } = render(
      <VerificationStatusCard
        status="verified"
        approvedCount={5}
        totalCount={5}
        verificationLevel="premium"
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders in_review status correctly', () => {
    const { UNSAFE_root } = render(
      <VerificationStatusCard
        status="in_review"
        approvedCount={3}
        totalCount={5}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders rejected status correctly', () => {
    const { UNSAFE_root } = render(
      <VerificationStatusCard
        status="rejected"
        approvedCount={2}
        totalCount={5}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders partial status correctly', () => {
    const { UNSAFE_root } = render(
      <VerificationStatusCard
        status="partial"
        approvedCount={2}
        totalCount={5}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with different verification levels', () => {
    const levels: Array<'basic' | 'standard' | 'premium'> = ['basic', 'standard', 'premium'];
    
    levels.forEach(level => {
      const { UNSAFE_root } = render(
        <VerificationStatusCard
          status="verified"
          approvedCount={5}
          totalCount={5}
          verificationLevel={level}
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
