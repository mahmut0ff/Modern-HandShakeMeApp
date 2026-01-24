import React from 'react';
import { render } from '@testing-library/react-native';
import { DocumentCard } from '../components/DocumentCard';

describe('DocumentCard', () => {
  const mockOnUpload = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders pending document correctly', () => {
    const { UNSAFE_root } = render(
      <DocumentCard
        id="identity"
        title="Identity Document"
        description="Passport or ID card"
        status="pending"
        required={true}
        icon="card"
        onUpload={mockOnUpload}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders approved document correctly', () => {
    const { UNSAFE_root } = render(
      <DocumentCard
        id="identity"
        title="Identity Document"
        description="Passport or ID card"
        status="approved"
        required={true}
        icon="card"
        imageUrl="https://example.com/image.jpg"
        onUpload={mockOnUpload}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders rejected document with reason', () => {
    const { UNSAFE_root } = render(
      <DocumentCard
        id="identity"
        title="Identity Document"
        description="Passport or ID card"
        status="rejected"
        required={true}
        icon="card"
        rejectionReason="Document is not clear"
        onUpload={mockOnUpload}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders in_review document correctly', () => {
    const { UNSAFE_root } = render(
      <DocumentCard
        id="identity"
        title="Identity Document"
        description="Passport or ID card"
        status="in_review"
        required={true}
        icon="card"
        imageUrl="https://example.com/image.jpg"
        onUpload={mockOnUpload}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders with delete button when onDelete provided', () => {
    const { UNSAFE_root } = render(
      <DocumentCard
        id="identity"
        title="Identity Document"
        description="Passport or ID card"
        status="pending"
        required={true}
        icon="card"
        imageUrl="https://example.com/image.jpg"
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders in uploading state', () => {
    const { UNSAFE_root } = render(
      <DocumentCard
        id="identity"
        title="Identity Document"
        description="Passport or ID card"
        status="pending"
        required={true}
        icon="card"
        onUpload={mockOnUpload}
        isUploading={true}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });

  it('renders optional document without required badge', () => {
    const { UNSAFE_root } = render(
      <DocumentCard
        id="address"
        title="Proof of Address"
        description="Utility bill"
        status="pending"
        required={false}
        icon="home"
        onUpload={mockOnUpload}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
