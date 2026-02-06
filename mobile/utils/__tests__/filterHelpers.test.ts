import {
  applyFilters,
  applySorting,
  applySearch,
  paginateItems,
  resetFilters,
} from '../filterHelpers';

describe('filterHelpers', () => {
  const testData = [
    { id: 1, name: 'John', age: 30, city: 'New York' },
    { id: 2, name: 'Jane', age: 25, city: 'London' },
    { id: 3, name: 'Bob', age: 35, city: 'Paris' },
    { id: 4, name: 'Alice', age: 28, city: 'New York' },
  ];

  describe('applyFilters', () => {
    it('returns all items when no filters applied', () => {
      const result = applyFilters(testData, {});
      expect(result).toEqual(testData);
    });

    it('filters by single field', () => {
      const result = applyFilters(testData, { city: 'New York' });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John');
      expect(result[1].name).toBe('Alice');
    });

    it('filters by multiple fields', () => {
      const result = applyFilters(testData, { city: 'New York', age: 30 });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });

    it('filters by array values', () => {
      const result = applyFilters(testData, { city: ['New York', 'London'] });
      expect(result).toHaveLength(3);
    });
  });

  describe('applySorting', () => {
    it('sorts ascending by default', () => {
      const result = applySorting(testData, 'age');
      expect(result[0].age).toBe(25);
      expect(result[3].age).toBe(35);
    });

    it('sorts descending', () => {
      const result = applySorting(testData, 'age', 'desc');
      expect(result[0].age).toBe(35);
      expect(result[3].age).toBe(25);
    });

    it('sorts by string field', () => {
      const result = applySorting(testData, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[3].name).toBe('John');
    });
  });

  describe('applySearch', () => {
    it('returns all items when search query is empty', () => {
      const result = applySearch(testData, '', ['name']);
      expect(result).toEqual(testData);
    });

    it('searches in single field', () => {
      const result = applySearch(testData, 'john', ['name']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John');
    });

    it('searches in multiple fields', () => {
      const result = applySearch(testData, 'new', ['name', 'city']);
      expect(result).toHaveLength(2);
    });

    it('is case insensitive', () => {
      const result = applySearch(testData, 'JOHN', ['name']);
      expect(result).toHaveLength(1);
    });
  });

  describe('paginateItems', () => {
    it('returns first page correctly', () => {
      const result = paginateItems(testData, 1, 2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it('returns second page correctly', () => {
      const result = paginateItems(testData, 2, 2);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe(3);
    });

    it('calculates total pages correctly', () => {
      const result = paginateItems(testData, 1, 3);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('resetFilters', () => {
    it('resets all filters', () => {
      const filters = { name: 'John', age: 30, city: 'New York' };
      const result = resetFilters(filters);
      expect(result.name).toBeNull();
      expect(result.age).toBeNull();
      expect(result.city).toBeNull();
    });

    it('resets specific filters', () => {
      const filters = { name: 'John', age: 30, city: 'New York' };
      const result = resetFilters(filters, ['name', 'age']);
      expect(result.name).toBeNull();
      expect(result.age).toBeNull();
      expect(result.city).toBe('New York');
    });
  });
});
