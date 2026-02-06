import React from 'react';
import { render } from '@testing-library/react-native';
import { DisputeCard } from '../components/DisputeCard';

describe('DisputeCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders open dispute correctly', () => {
    const { UNSAFE_root } = render(
      <DisputeCard
        id={1}
        projectTitle="Test Project"
        reason="quality"
        status="open"
        priority="medium"
        initiatorName="John Doe"
        respondentName="Jane Smith"
        messagesCount={5}
        createdAt="2024-01-20T10:00:00Z"
        onPress={mockOnPress}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders resolved dispute correctly', () => {
    const { UNSAFE_root } = render(
      <DisputeCard
        id={2}
        projectTitle="Test Project"
        reason="payment"
        status="resolved"
        priority="high"
        initiatorName="John Doe"
        respondentName="Jane Smith"
        messagesCount={10}
        amountDisputed="500"
        createdAt="2024-01-15T10:00:00Z"
        onPress={mockOnPress}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with amount disputed', () => {
    const { UNSAFE_root } = render(
      <DisputeCard
        id={3}
        projectTitle="Test Project"
        reason="payment"
        status="in_mediation"
        priority="urgent"
        initiatorName="John Doe"
        respondentName="Jane Smith"
        messagesCount={15}
        amountDisputed="1000"
        createdAt="2024-01-10T10:00:00Z"
        onPress={mockOnPress}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders all status types', () => {
    const statuses: Array<'open' | 'in_mediation' | 'resolved' | 'closed' | 'escalated'> = [
      'open',
      'in_mediation',
      'resolved',
      'closed',
      'escalated',
    ];

    statuses.forEach(status => {
      const { UNSAFE_root } = render(
        <DisputeCard
          id={1}
          projectTitle="Test Project"
          reason="quality"
          status={status}
          priority="medium"
          initiatorName="John Doe"
          respondentName="Jane Smith"
          messagesCount={5}
          createdAt="2024-01-20T10:00:00Z"
          onPress={mockOnPress}
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  it('renders all priority types', () => {
    const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = [
      'low',
      'medium',
      'high',
      'urgent',
    ];

    priorities.forEach(priority => {
      const { UNSAFE_root } = render(
        <DisputeCard
          id={1}
          projectTitle="Test Project"
          reason="quality"
          status="open"
          priority={priority}
          initiatorName="John Doe"
          respondentName="Jane Smith"
          messagesCount={5}
          createdAt="2024-01-20T10:00:00Z"
          onPress={mockOnPress}
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
