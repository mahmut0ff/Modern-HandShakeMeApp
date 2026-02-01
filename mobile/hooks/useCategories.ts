import { useMemo } from 'react';
import {
  useListCategoriesQuery,
  useGetCategorySkillsQuery,
  useListSkillsQuery,
  Category,
  Skill,
} from '../services/categoryApi';

export const useCategories = () => {
  const { data: categories, isLoading, error, refetch } = useListCategoriesQuery();

  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => a.order - b.order);
  }, [categories]);

  const getCategoryById = (id: string): Category | undefined => {
    return categories?.find((cat) => cat.id === id);
  };

  const getCategoryByName = (name: string): Category | undefined => {
    return categories?.find((cat) => cat.name.toLowerCase() === name.toLowerCase());
  };

  return {
    categories: sortedCategories,
    isLoading,
    error,
    refetch,
    getCategoryById,
    getCategoryByName,
  };
};

export const useCategorySkills = (categoryId?: string) => {
  const {
    data: categoryData,
    isLoading,
    error,
    refetch,
  } = useGetCategorySkillsQuery(categoryId || '', {
    skip: !categoryId,
  });

  const skills = useMemo(() => {
    return categoryData?.skills || [];
  }, [categoryData]);

  const getSkillById = (id: string): Skill | undefined => {
    return skills.find((skill) => skill.id === id);
  };

  const getSkillByName = (name: string): Skill | undefined => {
    return skills.find((skill) => skill.name.toLowerCase() === name.toLowerCase());
  };

  return {
    category: categoryData?.category,
    skills,
    skillsCount: categoryData?.count || 0,
    isLoading,
    error,
    refetch,
    getSkillById,
    getSkillByName,
  };
};

export const useSkillsSearch = (params?: {
  categoryId?: string;
  search?: string;
  limit?: number;
}) => {
  const {
    data: skillsData,
    isLoading,
    error,
    refetch,
  } = useListSkillsQuery(params || {}, {
    skip: !params,
  });

  const skills = useMemo(() => {
    return skillsData?.skills || [];
  }, [skillsData]);

  return {
    skills,
    count: skillsData?.count || 0,
    filters: skillsData?.filters,
    isLoading,
    error,
    refetch,
  };
};

export const useSkillSelection = (
  initialSkills: Skill[] = [],
  maxSkills: number = 10
) => {
  const [selectedSkills, setSelectedSkills] = React.useState<Skill[]>(initialSkills);

  const toggleSkill = (skill: Skill) => {
    const isSelected = selectedSkills.some((s) => s.id === skill.id);

    if (isSelected) {
      setSelectedSkills(selectedSkills.filter((s) => s.id !== skill.id));
    } else {
      if (selectedSkills.length >= maxSkills) {
        return false;
      }
      setSelectedSkills([...selectedSkills, skill]);
    }
    return true;
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.id !== skillId));
  };

  const clearSkills = () => {
    setSelectedSkills([]);
  };

  const isSkillSelected = (skillId: string): boolean => {
    return selectedSkills.some((s) => s.id === skillId);
  };

  const canAddMore = selectedSkills.length < maxSkills;

  return {
    selectedSkills,
    setSelectedSkills,
    toggleSkill,
    removeSkill,
    clearSkills,
    isSkillSelected,
    canAddMore,
    count: selectedSkills.length,
    maxSkills,
  };
};
