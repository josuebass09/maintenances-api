export const getDateInSixMonths = (fromDate: Date = new Date()): Date => {
  const result = new Date(fromDate);
  result.setMonth(result.getMonth() + 6);
  return result;
};
