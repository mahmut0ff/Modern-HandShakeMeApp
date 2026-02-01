import { useMemo } from 'react';
import {
  useGetProjectMilestonesQuery,
  useCreateProjectMilestoneMutation,
  useUpdateProjectMilestoneMutation,
  useDeleteProjectMilestoneMutation,
  ProjectMilestone,
} from '../services/projectApi';

export interface MilestoneStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  progressPercentage: number;
  paymentPercentage: number;
}

export const useMilestones = (projectId: number) => {
  const {
    data: milestones,
    isLoading,
    error,
    refetch,
  } = useGetProjectMilestonesQuery(projectId);

  const [createMilestone, { isLoading: creating }] = useCreateProjectMilestoneMutation();
  const [updateMilestone, { isLoading: updating }] = useUpdateProjectMilestoneMutation();
  const [deleteMilestone, { isLoading: deleting }] = useDeleteProjectMilestoneMutation();

  const stats: MilestoneStats = useMemo(() => {
    if (!milestones || milestones.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        cancelled: 0,
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        progressPercentage: 0,
        paymentPercentage: 0,
      };
    }

    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === 'COMPLETED').length;
    const inProgress = milestones.filter((m) => m.status === 'IN_PROGRESS').length;
    const pending = milestones.filter((m) => m.status === 'PENDING').length;
    const cancelled = milestones.filter((m) => m.status === 'CANCELLED').length;

    const totalAmount = milestones.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const completedAmount = milestones
      .filter((m) => m.status === 'COMPLETED')
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const pendingAmount = milestones
      .filter((m) => m.status !== 'COMPLETED' && m.status !== 'CANCELLED')
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);

    const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
    const paymentPercentage = totalAmount > 0 ? (completedAmount / totalAmount) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      totalAmount,
      completedAmount,
      pendingAmount,
      progressPercentage,
      paymentPercentage,
    };
  }, [milestones]);

  const sortedMilestones = useMemo(() => {
    if (!milestones) return [];
    return [...milestones].sort((a, b) => (a.orderNum || 0) - (b.orderNum || 0));
  }, [milestones]);

  const activeMilestones = useMemo(() => {
    return sortedMilestones.filter(
      (m) => m.status === 'IN_PROGRESS' || m.status === 'PENDING'
    );
  }, [sortedMilestones]);

  const completedMilestones = useMemo(() => {
    return sortedMilestones.filter((m) => m.status === 'COMPLETED');
  }, [sortedMilestones]);

  const overdueMilestones = useMemo(() => {
    const now = new Date();
    return sortedMilestones.filter(
      (m) =>
        m.dueDate &&
        m.status !== 'COMPLETED' &&
        m.status !== 'CANCELLED' &&
        new Date(m.dueDate) < now
    );
  }, [sortedMilestones]);

  const nextMilestone = useMemo(() => {
    return activeMilestones[0] || null;
  }, [activeMilestones]);

  return {
    milestones: sortedMilestones,
    activeMilestones,
    completedMilestones,
    overdueMilestones,
    nextMilestone,
    stats,
    isLoading,
    error,
    refetch,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    isProcessing: creating || updating || deleting,
  };
};
