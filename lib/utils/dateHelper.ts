export const getDateInMonths = (fromDate: Date = new Date(), months: number = 6): Date => {
  const result = new Date(fromDate);
  result.setMonth(result.getMonth() + months);
  return result;
};

/** @deprecated Use getDateInMonths instead */
export const getDateInSixMonths = (fromDate: Date = new Date()): Date =>
  getDateInMonths(fromDate, 6);
